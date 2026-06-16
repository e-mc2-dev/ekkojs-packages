import { dlopen, types } from "ekko:ffi";

const lib = dlopen("native:self", {
  mongo_connect:      { args: [types.buffer, types.i32], returns: types.i32 },
  mongo_find:         { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_insert_one:   { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_insert_many:  { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_update_one:   { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_update_many:  { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_delete_one:   { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_delete_many:  { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_count:        { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_aggregate:    { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mongo_create_index: { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mongo_close:        { args: [types.i32], returns: types.void },
});

function toBuffer(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function callJson(fn: Function, ...args: any[]): any {
  const json = fn(...args) as string;
  if (!json) return null;
  const parsed = JSON.parse(json);
  if (parsed && parsed.error) throw new Error(parsed.error);
  return parsed;
}

export class MongoClient {
  private _handle: number;

  constructor(uri: string) {
    const buf = toBuffer(uri);
    this._handle = lib.mongo_connect(buf, buf.length) as number;
    if (this._handle <= 0) throw new Error("MongoDB connection failed");
  }

  db(name: string): MongoDatabase {
    return new MongoDatabase(this._handle, name);
  }

  close() {
    lib.mongo_close(this._handle);
  }
}

export class MongoDatabase {
  private _handle: number;
  private _name: string;

  constructor(handle: number, name: string) {
    this._handle = handle;
    this._name = name;
  }

  collection(name: string): MongoCollection {
    return new MongoCollection(this._handle, this._name, name);
  }
}

export class MongoCollection {
  private _handle: number;
  private _db: Uint8Array;
  private _dbLen: number;
  private _coll: Uint8Array;
  private _collLen: number;

  constructor(handle: number, db: string, coll: string) {
    this._handle = handle;
    this._db = toBuffer(db);
    this._dbLen = this._db.length;
    this._coll = toBuffer(coll);
    this._collLen = this._coll.length;
  }

  find(filter?: object, options?: { sort?: object; limit?: number; skip?: number; projection?: object }): any[] {
    const query = { filter: filter || {}, ...options };
    const qBuf = toBuffer(JSON.stringify(query));
    return callJson(lib.mongo_find, this._handle, this._db, this._dbLen, this._coll, this._collLen, qBuf, qBuf.length) || [];
  }

  findOne(filter: object): any | null {
    const results = this.find(filter, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  insertOne(doc: object): { insertedId: string } {
    const buf = toBuffer(JSON.stringify(doc));
    return callJson(lib.mongo_insert_one, this._handle, this._db, this._dbLen, this._coll, this._collLen, buf, buf.length);
  }

  insertMany(docs: object[]): { insertedIds: string[] } {
    const buf = toBuffer(JSON.stringify(docs));
    return callJson(lib.mongo_insert_many, this._handle, this._db, this._dbLen, this._coll, this._collLen, buf, buf.length);
  }

  updateOne(filter: object, update: object): { modifiedCount: number } {
    const fBuf = toBuffer(JSON.stringify(filter));
    const uBuf = toBuffer(JSON.stringify(update));
    const n = lib.mongo_update_one(this._handle, this._db, this._dbLen, this._coll, this._collLen, fBuf, fBuf.length, uBuf, uBuf.length) as number;
    return { modifiedCount: Math.max(0, n) };
  }

  updateMany(filter: object, update: object): { modifiedCount: number } {
    const fBuf = toBuffer(JSON.stringify(filter));
    const uBuf = toBuffer(JSON.stringify(update));
    const n = lib.mongo_update_many(this._handle, this._db, this._dbLen, this._coll, this._collLen, fBuf, fBuf.length, uBuf, uBuf.length) as number;
    return { modifiedCount: Math.max(0, n) };
  }

  deleteOne(filter: object): { deletedCount: number } {
    const fBuf = toBuffer(JSON.stringify(filter));
    const n = lib.mongo_delete_one(this._handle, this._db, this._dbLen, this._coll, this._collLen, fBuf, fBuf.length) as number;
    return { deletedCount: Math.max(0, n) };
  }

  deleteMany(filter: object): { deletedCount: number } {
    const fBuf = toBuffer(JSON.stringify(filter));
    const n = lib.mongo_delete_many(this._handle, this._db, this._dbLen, this._coll, this._collLen, fBuf, fBuf.length) as number;
    return { deletedCount: Math.max(0, n) };
  }

  countDocuments(filter?: object): number {
    const fBuf = toBuffer(JSON.stringify(filter || {}));
    return lib.mongo_count(this._handle, this._db, this._dbLen, this._coll, this._collLen, fBuf, fBuf.length) as number;
  }

  aggregate(pipeline: object[]): any[] {
    const pBuf = toBuffer(JSON.stringify(pipeline));
    return callJson(lib.mongo_aggregate, this._handle, this._db, this._dbLen, this._coll, this._collLen, pBuf, pBuf.length) || [];
  }

  createIndex(keys: object, options?: object): number {
    const kBuf = toBuffer(JSON.stringify(keys));
    const oBuf = toBuffer(JSON.stringify(options || {}));
    return lib.mongo_create_index(this._handle, this._db, this._dbLen, this._coll, this._collLen, kBuf, kBuf.length, oBuf, oBuf.length) as number;
  }
}
