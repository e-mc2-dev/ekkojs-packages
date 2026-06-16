// @ekko/mongodb — ORM v2 driver (MongoDialect + MongoConnection).
// Translates the backend-neutral ORM plan/AST into MongoDB operation descriptors
// (find / aggregate / insert / update / delete). ZERO SQL. Registers as driver "mongodb",
// so `connect("mongodb", {...}).from(Coll).where(...).toArray()` works like any SQL driver.
//
// The raw `MongoClient` document API stays available via ./db.ts for non-ORM use.

import { Dialect, Connection, Transaction, registerDriver } from "ekko:db/orm";
import { dlopen, types } from "ekko:ffi";

const MONGO_FFI = {
  mongo_connect:         { args: [types.buffer, types.i32], returns: types.i32 },
  mongo_find:            { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_insert_one:      { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_insert_many:     { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_update_one:      { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_update_many:     { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_delete_one:      { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_delete_many:     { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_count:           { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_aggregate:       { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_create_index:    { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_drop_collection: { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_begin:           { args: [types.i32], returns: types.i32 },
  mongo_commit:          { args: [types.i32], returns: types.i32 },
  mongo_rollback:        { args: [types.i32], returns: types.i32 },
  mongo_close:           { args: [types.i32], returns: types.void },
};

// Lazy native:self binding — only resolved when a connection is opened WITHOUT an
// injected lib. Keeps importing this module side-effect-free (so a test can import
// MongoDialect/MongoConnection and inject an explicit-path lib without native:self).
let _selfLib: any = null;
function selfLib(): any {
  if (!_selfLib) _selfLib = dlopen("native:self", MONGO_FFI);
  return _selfLib;
}

function toBuffer(s: string): Uint8Array { return new TextEncoder().encode(s); }
function callJson(fn: Function, ...args: any[]): any {
  const json = fn(...args) as string;
  if (!json) return null;
  const parsed = JSON.parse(json);
  if (parsed && parsed.error) throw new Error(parsed.error);
  return parsed;
}

// ════════════════════════════════════════════════════════════
// AST (semantic op-codes) → MongoDB filter / pipeline
// ════════════════════════════════════════════════════════════

function likeToRegex(pattern: string): string {
  let r = "";
  for (const ch of pattern) {
    if (ch === "%") r += ".*";
    else if (ch === "_") r += ".";
    else if (".+*?^${}()|[]\\".includes(ch)) r += "\\" + ch;
    else r += ch;
  }
  return "^" + r + "$";
}

const _MONGO_CMP: any = { NEQ: "$ne", GT: "$gt", LT: "$lt", GTE: "$gte", LTE: "$lte" };

function exprToFilter(node: any): any {
  if (!node) return {};
  const op = node.op;
  if (op === "AND") return { $and: [exprToFilter(node.left), exprToFilter(node.right)] };
  if (op === "OR") return { $or: [exprToFilter(node.left), exprToFilter(node.right)] };
  if (op === "NOT") return { $nor: [exprToFilter(node.child)] };
  if (op === "IS_NULL") return { [node.field]: null };
  if (op === "IS_NOT_NULL") return { [node.field]: { $ne: null } };
  if (op === "IN") return { [node.field]: { $in: node.value } };
  if (op === "BETWEEN") return { [node.field]: { $gte: node.value[0], $lte: node.value[1] } };
  if (op === "LIKE") return { [node.field]: { $regex: likeToRegex(node.value) } };
  if (op === "NOT_LIKE") return { [node.field]: { $not: { $regex: likeToRegex(node.value) } } };
  if (op === "EXISTS") return { __exists: { table: node.table, child: node.child } };
  if (op === "NOT_EXISTS") return { __notExists: { table: node.table, child: node.child } };
  if (op.startsWith("SUBQUERY_COUNT_")) {
    const cmp = op.replace("SUBQUERY_COUNT_", "");
    const rel = node.child.rel;
    return { __subCount: { table: node.table, cmp, value: node.value, child: { rel: { localKey: rel.localKey, foreignKey: rel.foreignKey }, parentTable: node.child.parentTable } } };
  }
  if (node.value && node.value.__fieldRef) {
    return { __fieldRef: { lf: node.field, lt: node.table, op, rf: node.value.field, rt: node.value.table } };
  }
  let val = node.value;
  if (typeof val === "boolean") val = val ? 1 : 0;
  if (op === "EQ") return { [node.field]: val };
  if (_MONGO_CMP[op]) return { [node.field]: { [_MONGO_CMP[op]]: val } };
  return { [node.field]: val };
}

function hasSubquery(filter: any): boolean {
  if (!filter || typeof filter !== "object") return false;
  if (filter.__exists || filter.__notExists || filter.__subCount) return true;
  if (filter.$and) return filter.$and.some(hasSubquery);
  if (filter.$or) return filter.$or.some(hasSubquery);
  if (filter.$nor) return filter.$nor.some(hasSubquery);
  return false;
}

function flattenFilter(filter: any): any {
  if (!filter || typeof filter !== "object") return filter;
  if (filter.$and) return { $and: filter.$and.map(flattenFilter) };
  if (filter.$or) return { $or: filter.$or.map(flattenFilter) };
  if (filter.$nor) return { $nor: filter.$nor.map(flattenFilter) };
  return filter;
}

function buildSubqueryPipeline(mainTable: string, filter: any): any[] {
  const pipeline: any[] = [];
  const matchFilters: any[] = [];
  const simpleFilters: any[] = [];

  function walk(f: any) {
    if (f.$and) { f.$and.forEach(walk); return; }
    if (f.__exists) {
      const rel = extractRelFromChild(f.__exists.child);
      pipeline.push({ $lookup: { from: f.__exists.table, localField: rel.localKey, foreignField: rel.foreignKey, as: "__sub_" + f.__exists.table } });
      const innerFilter = extractInnerFilter(f.__exists.child);
      if (Object.keys(innerFilter).length > 0) {
        matchFilters.push({ ["__sub_" + f.__exists.table]: { $elemMatch: innerFilter } });
      } else {
        matchFilters.push({ ["__sub_" + f.__exists.table + ".0"]: { $exists: true } });
      }
      return;
    }
    if (f.__notExists) {
      const rel = extractRelFromChild(f.__notExists.child);
      const as_ = "__nosub_" + f.__notExists.table;
      pipeline.push({ $lookup: { from: f.__notExists.table, localField: rel.localKey, foreignField: rel.foreignKey, as: as_ } });
      const innerFilter = extractInnerFilter(f.__notExists.child);
      if (Object.keys(innerFilter).length > 0) {
        matchFilters.push({ [as_]: { $not: { $elemMatch: innerFilter } } });
      } else {
        matchFilters.push({ [as_]: { $size: 0 } });
      }
      return;
    }
    if (f.__subCount) {
      const rel = f.__subCount.child.rel;
      const as_ = "__cnt_" + f.__subCount.table;
      pipeline.push({ $lookup: { from: f.__subCount.table, localField: rel.localKey, foreignField: rel.foreignKey, as: as_ } });
      const cmpMap: any = { GT: "$gt", GTE: "$gte", LT: "$lt", EQ: "$eq" };
      const mop = cmpMap[f.__subCount.cmp] || "$eq";
      matchFilters.push({ $expr: { [mop]: [{ $size: "$" + as_ }, f.__subCount.value] } });
      return;
    }
    simpleFilters.push(f);
  }

  walk(filter);
  if (simpleFilters.length) pipeline.unshift({ $match: simpleFilters.length === 1 ? simpleFilters[0] : { $and: simpleFilters } });
  if (matchFilters.length) pipeline.push({ $match: matchFilters.length === 1 ? matchFilters[0] : { $and: matchFilters } });
  return pipeline;
}

function extractRelFromChild(child: any): { localKey: string; foreignKey: string } {
  if (child.op === "AND" && child.left && child.left.value && child.left.value.__fieldRef) {
    return { localKey: child.left.value.field, foreignKey: child.left.field };
  }
  if (child.value && child.value.__fieldRef) {
    return { localKey: child.value.field, foreignKey: child.field };
  }
  return { localKey: "id", foreignKey: "id" };
}

function extractInnerFilter(child: any): any {
  if (child.op === "AND" && child.left && child.left.value && child.left.value.__fieldRef) {
    return exprToSimpleFilter(child.right);
  }
  return {};
}

function exprToSimpleFilter(node: any): any {
  if (!node) return {};
  const op = node.op;
  if (op === "AND") return { $and: [exprToSimpleFilter(node.left), exprToSimpleFilter(node.right)] };
  if (op === "IS_NOT_NULL") return { [node.field]: { $ne: null } };
  let val = node.value;
  if (typeof val === "boolean") val = val ? 1 : 0;
  if (op === "EQ") return { [node.field]: val };
  if (_MONGO_CMP[op]) return { [node.field]: { [_MONGO_CMP[op]]: val } };
  return {};
}

// ════════════════════════════════════════════════════════════
// MongoDialect — compiles ORM plans to MongoDB operation descriptors (no SQL)
// ════════════════════════════════════════════════════════════

class MongoDialect extends Dialect {
  _schemas: any = {};
  _counters: any = {};
  _lastOp: any = null;

  constructor() { super("mongodb"); }

  compileSelect(plan: any) {
    const filter = plan.where ? exprToFilter(plan.where) : {};
    const needsAgg = hasSubquery(filter) || (plan.joins && plan.joins.length) || plan.distinct || (plan.groups && plan.groups.length);
    const safeJoins = (plan.joins || []).map((j: any) => ({ type: j.type, table: j.table, on: j.on && j.on.__rawOn ? { __rawOn: j.on.__rawOn } : (j.on ? exprToFilter(j.on) : null) }));
    this._lastOp = { type: needsAgg ? "aggregate" : "find", collection: plan.table, filter, fields: plan.fields, orders: plan.orders, limit: plan.limit, offset: plan.offset, distinct: plan.distinct, groups: plan.groups, joins: safeJoins };
    return { query: JSON.stringify(this._lastOp), params: {} };
  }

  compileAggregate(plan: any) {
    const filter = plan.where ? exprToFilter(plan.where) : {};
    this._lastOp = { type: "agg_func", collection: plan.table, filter, aggregate: plan.aggregate };
    return { query: JSON.stringify(this._lastOp), params: {} };
  }

  compileInsert(plan: any) {
    const coll = plan.table;
    const schema = this._schemas[coll];
    const doc: any = { ...plan.data };
    for (const k in doc) {
      if (typeof doc[k] === "boolean") doc[k] = doc[k] ? 1 : 0;
    }
    if (schema) {
      for (const k in schema._columns) {
        const c = schema._columns[k];
        if (c.autoIncrement && doc[k] === undefined) {
          if (!this._counters[coll]) this._counters[coll] = 0;
          doc[k] = ++this._counters[coll];
        }
        if (c.default !== undefined && doc[k] === undefined) {
          let def = c.default;
          if (typeof def === "boolean") def = def ? 1 : 0;
          doc[k] = def;
        }
      }
    }
    this._lastOp = { type: "insert", collection: coll, doc };
    return { query: JSON.stringify(this._lastOp), params: {} };
  }

  compileUpdate(plan: any) {
    const filter = plan.where ? exprToFilter(plan.where) : {};
    const data: any = {};
    for (const k in plan.data) {
      let v = plan.data[k];
      if (typeof v === "boolean") v = v ? 1 : 0;
      data[k] = v;
    }
    this._lastOp = { type: "update", collection: plan.table, filter: flattenFilter(filter), update: { $set: data } };
    return { query: JSON.stringify(this._lastOp), params: {} };
  }

  compileDelete(plan: any) {
    const filter = plan.where ? exprToFilter(plan.where) : {};
    this._lastOp = { type: "delete", collection: plan.table, filter: flattenFilter(filter) };
    return { query: JSON.stringify(this._lastOp), params: {} };
  }

  compileCreateTable(schema: any) {
    this._schemas[schema._name] = schema;
    this._counters[schema._name] = 0;
    const cols: any = {};
    for (const k in schema._columns) cols[k] = { type: schema._columns[k].type, unique: schema._columns[k].unique, autoIncrement: schema._columns[k].autoIncrement, default: schema._columns[k].default };
    return JSON.stringify({ type: "createTable", collection: schema._name, columns: cols });
  }

  compileCreateIndexes(schema: any) {
    const stmts: string[] = [];
    for (let i = 0; i < schema._indexes.length; i++) {
      const ix = schema._indexes[i];
      if (ix._fulltext) continue;
      const keys: any = {};
      for (const c of ix.columns) keys[c] = 1;
      const name = ix._name || ("idx_" + schema._name + "_" + ix.columns.join("_"));
      stmts.push(JSON.stringify({ type: "createIndex", collection: schema._name, keys, options: { name, unique: ix._unique || false } }));
    }
    return stmts;
  }

  compileDropTable(name: any) {
    const coll = typeof name === "object" ? name._name : name;
    this._lastOp = { type: "drop", collection: coll };
    return JSON.stringify(this._lastOp);
  }
}

// ════════════════════════════════════════════════════════════
// MongoConnection — executes MongoDB operation descriptors via FFI
// ════════════════════════════════════════════════════════════

class MongoConnection extends Connection {
  _handle: number;
  _db: Uint8Array;
  _lib: any;

  constructor(config: any) {
    const dialect = new MongoDialect();
    super(dialect);
    // config.lib lets a test harness inject an explicit-path dlopen handle
    // (native:self does not resolve when a test file is run directly). Production
    // omits it and uses the package's own native:self binding above.
    this._lib = config.lib || selfLib();
    const uri = config.uri || `mongodb://${config.host || "localhost"}:${config.port || 27017}/?directConnection=true`;
    const uriBuf = toBuffer(uri);
    this._handle = this._lib.mongo_connect(uriBuf, uriBuf.length) as number;
    if (this._handle <= 0) throw new Error("MongoDB connection failed");
    this._db = toBuffer(config.database || "ekko");
  }

  _collBuf(name: string) { return toBuffer(name); }

  execute(query: string, params?: any) {
    const op = JSON.parse(query);

    if (op.type === "insert") {
      const coll = this._collBuf(op.collection);
      const docBuf = toBuffer(JSON.stringify(op.doc));
      callJson(this._lib.mongo_insert_one, this._handle, this._db, this._db.length, coll, coll.length, docBuf, docBuf.length);
      return { affectedRows: 1 };
    }

    if (op.type === "update") {
      const coll = this._collBuf(op.collection);
      const fBuf = toBuffer(JSON.stringify(op.filter));
      const uBuf = toBuffer(JSON.stringify(op.update));
      const n = this._lib.mongo_update_many(this._handle, this._db, this._db.length, coll, coll.length, fBuf, fBuf.length, uBuf, uBuf.length) as number;
      return { affectedRows: Math.max(0, n) };
    }

    if (op.type === "delete") {
      const coll = this._collBuf(op.collection);
      const fBuf = toBuffer(JSON.stringify(op.filter));
      const n = this._lib.mongo_delete_many(this._handle, this._db, this._db.length, coll, coll.length, fBuf, fBuf.length) as number;
      return { affectedRows: Math.max(0, n) };
    }

    if (op.type === "createTable") {
      const cols = op.columns;
      for (const k in cols) {
        const c = cols[k];
        if (c.unique) {
          const coll = this._collBuf(op.collection);
          const kBuf = toBuffer(JSON.stringify({ [k]: 1 }));
          const oBuf = toBuffer(JSON.stringify({ name: "uniq_" + k, unique: true }));
          this._lib.mongo_create_index(this._handle, this._db, this._db.length, coll, coll.length, kBuf, kBuf.length, oBuf, oBuf.length);
        }
      }
      return { affectedRows: 0 };
    }

    if (op.type === "createIndex") {
      const coll = this._collBuf(op.collection);
      const kBuf = toBuffer(JSON.stringify(op.keys));
      const oBuf = toBuffer(JSON.stringify(op.options));
      this._lib.mongo_create_index(this._handle, this._db, this._db.length, coll, coll.length, kBuf, kBuf.length, oBuf, oBuf.length);
      return { affectedRows: 0 };
    }

    if (op.type === "drop") {
      const coll = this._collBuf(op.collection);
      this._lib.mongo_drop_collection(this._handle, this._db, this._db.length, coll, coll.length);
      return { affectedRows: 0 };
    }

    return { affectedRows: 0 };
  }

  query(query: string, params?: any) {
    const op = JSON.parse(query);
    if (op.type === "find") return this._execFind(op);
    if (op.type === "aggregate") return this._execAggregate(op);
    if (op.type === "agg_func") return this._execAggFunc(op);
    return { columns: [], rows: [] };
  }

  _execFind(op: any) {
    const plan = op;
    const filter = flattenFilter(op.filter);
    const queryObj: any = { filter };
    if (plan.orders && plan.orders.length) {
      const sort: any = {};
      for (const o of plan.orders) sort[o.field] = o.dir === "ASC" ? 1 : -1;
      queryObj.sort = sort;
    }
    if (plan.limit != null) queryObj.limit = plan.limit;
    if (plan.offset != null) queryObj.skip = plan.offset;
    if (plan.fields && plan.fields[0] !== "*") {
      const proj: any = {};
      for (const f of plan.fields) proj[f] = 1;
      proj._id = 0;
      queryObj.projection = proj;
    }

    const coll = this._collBuf(op.collection);
    const qBuf = toBuffer(JSON.stringify(queryObj));
    const docs = callJson(this._lib.mongo_find, this._handle, this._db, this._db.length, coll, coll.length, qBuf, qBuf.length) || [];

    const fields = plan.fields && plan.fields[0] !== "*"
      ? plan.fields
      : (docs.length > 0 ? Object.keys(docs[0]).filter((k: string) => k !== "_id") : []);

    return { columns: fields, rows: docs.map((d: any) => fields.map((f: string) => d[f] !== undefined ? d[f] : null)) };
  }

  _execAggregate(op: any) {
    const plan = op;
    const filter = op.filter;
    let pipeline: any[] = [];

    // Subqueries
    if (hasSubquery(filter)) {
      pipeline = buildSubqueryPipeline(op.collection, filter);
    } else if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: flattenFilter(filter) });
    }

    // JOINs
    if (plan.joins && plan.joins.length) {
      for (const j of plan.joins) {
        let localField = "id", foreignField = "id";
        if (j.on && j.on.__rawOn) {
          const m = j.on.__rawOn.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
          if (m) {
            localField = m[1] === op.collection ? m[2] : m[4];
            foreignField = m[1] === op.collection ? m[4] : m[2];
          }
        } else if (j.on && j.on.__fieldRef) {
          localField = j.on.__fieldRef.lt === op.collection ? j.on.__fieldRef.lf : j.on.__fieldRef.rf;
          foreignField = j.on.__fieldRef.lt === op.collection ? j.on.__fieldRef.rf : j.on.__fieldRef.lf;
        }
        const asField = "_j_" + j.table;
        pipeline.push({ $lookup: { from: j.table, localField, foreignField, as: asField } });
        pipeline.push({ $unwind: { path: "$" + asField, preserveNullAndEmptyArrays: j.type === "LEFT JOIN" } });
      }
    }

    // DISTINCT
    if (plan.distinct && plan.fields && plan.fields.length) {
      const field = plan.fields[0];
      pipeline.push({ $group: { _id: "$" + field } });
      pipeline.push({ $project: { [field]: "$_id", _id: 0 } });
      return this._runPipeline(op.collection, pipeline, [field]);
    }

    // GROUP BY
    if (plan.groups && plan.groups.length) {
      const groupId: any = {};
      for (const g of plan.groups) groupId[g] = "$" + g;
      const group: any = { _id: groupId };
      const projFields: string[] = [...plan.groups];
      for (const f of plan.fields) {
        if (plan.groups.includes(f)) continue;
        const aggMatch = f.match(/^(COUNT|SUM|AVG|MIN|MAX)\(([^)]*)\)\s+AS\s+(\w+)$/i);
        if (aggMatch) {
          const fn = aggMatch[1].toLowerCase();
          const col = aggMatch[2];
          const alias = aggMatch[3];
          if (fn === "count") group[alias] = { $sum: 1 };
          else group[alias] = { ["$" + fn]: "$" + col };
          projFields.push(alias);
        }
      }
      pipeline.push({ $group: group });
      const proj: any = { _id: 0 };
      for (const g of plan.groups) proj[g] = "$_id." + g;
      for (const f of projFields) { if (!plan.groups.includes(f)) proj[f] = 1; }
      pipeline.push({ $project: proj });
      return this._runPipeline(op.collection, pipeline, projFields);
    }

    // Sorting/limit/skip for subquery/join results
    if (plan.orders && plan.orders.length) {
      const sort: any = {};
      for (const o of plan.orders) sort[o.field] = o.dir === "ASC" ? 1 : -1;
      pipeline.push({ $sort: sort });
    }
    if (plan.offset != null) pipeline.push({ $skip: plan.offset });
    if (plan.limit != null) pipeline.push({ $limit: plan.limit });

    // Projection for JOINs
    const hasJoins = plan.joins && plan.joins.length;
    let fields: string[] = [];
    if (hasJoins && plan.fields && plan.fields[0] !== "*") {
      fields = plan.fields;
      const proj: any = { _id: 0 };
      const projFields: string[] = [];
      for (const f of plan.fields) {
        const parts = f.split(".");
        if (parts.length === 2) {
          const t = parts[0], c = parts[1];
          if (t === op.collection) proj[c] = "$" + c;
          else proj[c] = "$_j_" + t + "." + c;
          projFields.push(c);
        } else {
          proj[f] = 1;
          projFields.push(f);
        }
      }
      pipeline.push({ $project: proj });
      fields = projFields;
    }

    return this._runPipeline(op.collection, pipeline, fields);
  }

  _execAggFunc(op: any) {
    const agg = op.aggregate;
    const coll = this._collBuf(op.collection);

    if (agg.fn === "count") {
      const fBuf = toBuffer(JSON.stringify(flattenFilter(op.filter)));
      const n = this._lib.mongo_count(this._handle, this._db, this._db.length, coll, coll.length, fBuf, fBuf.length) as number;
      return { columns: [agg.alias], rows: [[n]] };
    }

    // sum/avg/min/max via aggregation pipeline
    const pipeline: any[] = [];
    const filter = flattenFilter(op.filter);
    if (Object.keys(filter).length > 0) pipeline.push({ $match: filter });
    const aggOp = "$" + agg.fn;
    pipeline.push({ $group: { _id: null, [agg.alias]: { [aggOp]: "$" + agg.field } } });
    pipeline.push({ $project: { _id: 0, [agg.alias]: 1 } });

    const pBuf = toBuffer(JSON.stringify(pipeline));
    const docs = callJson(this._lib.mongo_aggregate, this._handle, this._db, this._db.length, coll, coll.length, pBuf, pBuf.length) || [];
    if (docs.length === 0) return { columns: [agg.alias], rows: [[0]] };
    return { columns: [agg.alias], rows: [[docs[0][agg.alias]]] };
  }

  _runPipeline(collection: string, pipeline: any[], fieldHint: string[]) {
    const coll = this._collBuf(collection);
    const pBuf = toBuffer(JSON.stringify(pipeline));
    const docs = callJson(this._lib.mongo_aggregate, this._handle, this._db, this._db.length, coll, coll.length, pBuf, pBuf.length) || [];
    const fields = fieldHint.length > 0 ? fieldHint : (docs.length > 0 ? Object.keys(docs[0]).filter((k: string) => k !== "_id") : []);
    return { columns: fields, rows: docs.map((d: any) => fields.map((f: string) => d[f] !== undefined ? d[f] : null)) };
  }

  beginTransaction() {
    const r = this._lib.mongo_begin(this._handle) as number;
    if (r < 0) throw new Error("Failed to begin transaction");
    return new MongoTx(this._handle, this.dialect, this._db, this._lib);
  }

  close() { this._lib.mongo_close(this._handle); }
}

class MongoTx extends Transaction {
  _handle: number;
  _done: boolean;
  _db: Uint8Array;
  _lib: any;

  constructor(handle: number, dialect: any, db: Uint8Array, libRef: any) {
    super(dialect);
    this._handle = handle;
    this._done = false;
    this._db = db;
    this._lib = libRef;
  }

  execute(query: string, params?: any) {
    if (this._done) throw new Error("Transaction already ended");
    const op = JSON.parse(query);

    if (op.type === "insert") {
      const coll = toBuffer(op.collection);
      const docBuf = toBuffer(JSON.stringify(op.doc));
      callJson(this._lib.mongo_insert_one, this._handle, this._db, this._db.length, coll, coll.length, docBuf, docBuf.length);
      return { affectedRows: 1 };
    }
    if (op.type === "delete") {
      const coll = toBuffer(op.collection);
      const fBuf = toBuffer(JSON.stringify(op.filter));
      const n = this._lib.mongo_delete_many(this._handle, this._db, this._db.length, coll, coll.length, fBuf, fBuf.length) as number;
      return { affectedRows: Math.max(0, n) };
    }
    if (op.type === "update") {
      const coll = toBuffer(op.collection);
      const fBuf = toBuffer(JSON.stringify(op.filter));
      const uBuf = toBuffer(JSON.stringify(op.update));
      const n = this._lib.mongo_update_many(this._handle, this._db, this._db.length, coll, coll.length, fBuf, fBuf.length, uBuf, uBuf.length) as number;
      return { affectedRows: Math.max(0, n) };
    }
    return { affectedRows: 0 };
  }

  query(query: string, params?: any) {
    if (this._done) throw new Error("Transaction already ended");
    const op = JSON.parse(query);
    if (op.type === "agg_func") {
      const agg = op.aggregate;
      if (agg.fn === "count") {
        const coll = toBuffer(op.collection);
        const fBuf = toBuffer(JSON.stringify(flattenFilter(op.filter)));
        const n = this._lib.mongo_count(this._handle, this._db, this._db.length, coll, coll.length, fBuf, fBuf.length) as number;
        return { columns: [agg.alias], rows: [[n]] };
      }
    }
    return { columns: [], rows: [] };
  }

  commit() { if (!this._done) { this._lib.mongo_commit(this._handle); this._done = true; } }
  rollback() { if (!this._done) { this._lib.mongo_rollback(this._handle); this._done = true; } }
}

export function register() {
  registerDriver("mongodb", (config: any) => new MongoConnection(config));
}

export { MongoDialect, MongoConnection, MongoTx as MongoTransaction };
