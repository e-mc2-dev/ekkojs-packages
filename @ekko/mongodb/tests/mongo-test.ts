// MongoDB driver test
// Run: ekko run --allow=fs,ffi:unsafe,net,env ekko-lib/mongodb/tests/mongo-test.ts
// Requires: docker run -d --name ekko-mongo-test -p 27018:27017 mongo:7

import { dlopen, types } from "ekko:ffi";

const platform = Ekko.platform === "win32" ? "windows-x64" : Ekko.platform === "darwin" ? "macos-arm64" : "linux-x64";
const prefix = Ekko.platform === "win32" ? "" : "lib";
const ext = Ekko.platform === "win32" ? "dll" : Ekko.platform === "darwin" ? "dylib" : "so";
const nativePath = `ekko-lib/mongodb/native/${platform}/${prefix}ekko_mongodb.${ext}`;

const lib = dlopen(nativePath, {
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

function toBuffer(s: string): Uint8Array { return new TextEncoder().encode(s); }

function callJson(fn: Function, ...args: any[]): any {
  const json = fn(...args) as string;
  if (!json) return null;
  const parsed = JSON.parse(json);
  if (parsed && parsed.error) throw new Error(parsed.error);
  return parsed;
}

console.log("\n=== MongoDB Driver Test ===\n");

let passed = 0, failed = 0, total = 0;

function assert(name: string, condition: boolean, detail?: string) {
  total++;
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}
function assertEq(name: string, actual: any, expected: any) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  assert(name, a === e, `got ${a}, expected ${e}`);
}

// ─── Connect ───
console.log("--- Connect ---");
const uri = Ekko.env.get("MONGO_URI") || "mongodb://localhost:27018/?directConnection=true";
const uriBuf = toBuffer(uri);
const handle = lib.mongo_connect(uriBuf, uriBuf.length) as number;
assert("connect succeeds", handle > 0, `handle=${handle}`);

const db = toBuffer("ekko_test");
const coll = toBuffer("test_items");

// Helper: wrap FFI calls
function find(filter: any = {}, opts: any = {}) {
  const q = toBuffer(JSON.stringify({ filter, ...opts }));
  return callJson(lib.mongo_find, handle, db, db.length, coll, coll.length, q, q.length) || [];
}
function insertOne(doc: any) {
  const buf = toBuffer(JSON.stringify(doc));
  return callJson(lib.mongo_insert_one, handle, db, db.length, coll, coll.length, buf, buf.length);
}
function insertMany(docs: any[]) {
  const buf = toBuffer(JSON.stringify(docs));
  return callJson(lib.mongo_insert_many, handle, db, db.length, coll, coll.length, buf, buf.length);
}
function updateOne(filter: any, update: any) {
  const f = toBuffer(JSON.stringify(filter)), u = toBuffer(JSON.stringify(update));
  return lib.mongo_update_one(handle, db, db.length, coll, coll.length, f, f.length, u, u.length) as number;
}
function updateMany(filter: any, update: any) {
  const f = toBuffer(JSON.stringify(filter)), u = toBuffer(JSON.stringify(update));
  return lib.mongo_update_many(handle, db, db.length, coll, coll.length, f, f.length, u, u.length) as number;
}
function deleteOne(filter: any) {
  const f = toBuffer(JSON.stringify(filter));
  return lib.mongo_delete_one(handle, db, db.length, coll, coll.length, f, f.length) as number;
}
function deleteMany(filter: any) {
  const f = toBuffer(JSON.stringify(filter));
  return lib.mongo_delete_many(handle, db, db.length, coll, coll.length, f, f.length) as number;
}
function count(filter: any = {}) {
  const f = toBuffer(JSON.stringify(filter));
  return lib.mongo_count(handle, db, db.length, coll, coll.length, f, f.length) as number;
}
function aggregate(pipeline: any[]) {
  const p = toBuffer(JSON.stringify(pipeline));
  return callJson(lib.mongo_aggregate, handle, db, db.length, coll, coll.length, p, p.length) || [];
}
function createIndex(keys: any, opts: any = {}) {
  const k = toBuffer(JSON.stringify(keys)), o = toBuffer(JSON.stringify(opts));
  return lib.mongo_create_index(handle, db, db.length, coll, coll.length, k, k.length, o, o.length) as number;
}

// ─── Cleanup ───
deleteMany({});

// ─── insertOne ───
console.log("\n--- insertOne ---");
const r1 = insertOne({ name: "Alice", age: 30, active: true });
assert("insertOne returns insertedId", r1.insertedId !== undefined && r1.insertedId !== null);
assert("insertedId is string", typeof r1.insertedId === "string" && r1.insertedId.length > 0);

insertOne({ name: "Bob", age: 25, active: true });
insertOne({ name: "Charlie", age: 35, active: false });
insertOne({ name: "Diana", age: 28, active: true });
insertOne({ name: "Eve", age: null, active: true });
assertEq("5 documents inserted", count(), 5);

// ─── insertMany ───
console.log("\n--- insertMany ---");
const collTags = toBuffer("test_tags");
const tagsDocs = [{ tag: "rust" }, { tag: "javascript" }, { tag: "database" }];
const tagsBuf = toBuffer(JSON.stringify(tagsDocs));
const r2 = callJson(lib.mongo_insert_many, handle, db, db.length, collTags, collTags.length, tagsBuf, tagsBuf.length);
assertEq("insertMany returns 3 ids", r2.insertedIds.length, 3);

// ─── find ───
console.log("\n--- find ---");
const all = find();
assertEq("find all count", all.length, 5);
assertEq("first doc name", all[0].name, "Alice");

const filtered = find({ name: "Bob" });
assertEq("find by name count", filtered.length, 1);
assertEq("find by name result", filtered[0].name, "Bob");

const gtFilter = find({ age: { "$gt": 28 } });
assert("find $gt count", gtFilter.length >= 2);

const sorted = find({}, { sort: { age: -1 }, limit: 2 });
assertEq("find sorted+limited count", sorted.length, 2);
assertEq("find sorted first", sorted[0].name, "Charlie");

const skipped = find({}, { sort: { age: 1 }, skip: 1, limit: 2 });
assertEq("find skip+limit count", skipped.length, 2);

const projected = find({ name: "Alice" }, { projection: { name: 1, _id: 0 } });
assertEq("projection name", projected[0].name, "Alice");
assert("projection excludes age", projected[0].age === undefined);

// ─── findOne (via find limit 1) ───
console.log("\n--- findOne ---");
const one = find({ name: "Alice" }, { limit: 1 });
assertEq("findOne name", one[0].name, "Alice");
const none = find({ name: "NONEXISTENT" }, { limit: 1 });
assertEq("findOne not found", none.length, 0);

// ─── updateOne ───
console.log("\n--- updateOne ---");
const u1 = updateOne({ name: "Alice" }, { "$set": { age: 31 } });
assertEq("updateOne modified", u1, 1);
const updatedAlice = find({ name: "Alice" })[0];
assertEq("updateOne result", updatedAlice.age, 31);

// ─── updateMany ───
console.log("\n--- updateMany ---");
const u2 = updateMany({ active: false }, { "$set": { active: true } });
assert("updateMany modified >= 1", u2 >= 1);
const allActive = find({ active: true });
assertEq("all now active", allActive.length, 5);

// ─── deleteOne ───
console.log("\n--- deleteOne ---");
const d1 = deleteOne({ name: "Eve" });
assertEq("deleteOne count", d1, 1);
assertEq("after deleteOne total", count(), 4);

// ─── deleteMany ───
console.log("\n--- deleteMany ---");
const tagCount1 = (() => { const f = toBuffer("{}"); return lib.mongo_count(handle, db, db.length, collTags, collTags.length, f, f.length) as number; })();
const df = toBuffer(JSON.stringify({ tag: { "$in": ["rust", "javascript"] } }));
const d2 = lib.mongo_delete_many(handle, db, db.length, collTags, collTags.length, df, df.length) as number;
assertEq("deleteMany count", d2, 2);

// ─── countDocuments ───
console.log("\n--- countDocuments ---");
assertEq("count all", count(), 4);
assertEq("count filtered", count({ age: { "$gte": 30 } }), 2);

// ─── aggregate ───
console.log("\n--- aggregate ---");
const agg = aggregate([
  { "$match": { age: { "$ne": null } } },
  { "$group": { "_id": null, "avgAge": { "$avg": "$age" }, "count": { "$sum": 1 } } },
]);
assertEq("aggregate returns 1 result", agg.length, 1);
assert("aggregate avgAge is number", typeof agg[0].avgAge === "number");
assertEq("aggregate count", agg[0].count, 4);

// ─── createIndex ───
console.log("\n--- createIndex ---");
const idx = createIndex({ name: 1 }, { name: "idx_name", unique: true });
assertEq("createIndex succeeds", idx, 0);

// ─── Error handling ───
console.log("\n--- Error handling ---");
try {
  insertOne({ name: "Alice", age: 99 }); // duplicate unique index
  assert("duplicate key throws", false);
} catch (e: any) {
  assert("duplicate key throws", e.message.includes("duplicate") || e.message.includes("E11000"));
}

// ─── WHERE equivalents (MongoDB filter operators) ───
console.log("\n--- Filter operators ---");
assertEq("$ne", find({ name: { "$ne": "Alice" } }).length, 3);
assertEq("$lt", find({ age: { "$lt": 30 } }).length, 2);
assertEq("$lte", find({ age: { "$lte": 30 } }).length, 2);
assertEq("$gt", find({ age: { "$gt": 28 } }).length, 2);
assertEq("$gte", find({ age: { "$gte": 30 } }).length, 2);
assertEq("$in", find({ name: { "$in": ["Alice", "Charlie"] } }).length, 2);
assertEq("$nin", find({ name: { "$nin": ["Alice", "Bob"] } }).length, 2);
assertEq("$exists true", find({ age: { "$exists": true } }).length, 4);
assert("$regex", find({ name: { "$regex": "^A" } }).length >= 1);
assertEq("$regex val", find({ name: { "$regex": "^A" } })[0].name, "Alice");

// ─── Compound filters ───
console.log("\n--- Compound filters ---");
assert("$and", find({ "$and": [{ age: { "$gt": 25 } }, { active: true }] }).length >= 2);
assertEq("$or", find({ "$or": [{ name: "Alice" }, { name: "Bob" }] }).length, 2);
assert("$not", find({ active: { "$not": { "$eq": true } } }).length === 0);

// ─── Sort + pagination ───
console.log("\n--- Sort + pagination ---");
const sortAsc2 = find({}, { sort: { age: 1 }, limit: 3 });
assertEq("sort asc first", sortAsc2[0].name, "Bob");
const sortDesc2 = find({}, { sort: { age: -1 }, limit: 1 });
assertEq("sort desc first", sortDesc2[0].name, "Charlie");
const page2 = find({}, { sort: { age: 1 }, skip: 1, limit: 2 });
assertEq("skip+limit", page2.length, 2);
assertEq("multi-sort", find({}, { sort: { active: 1, age: -1 } }).length, 4);

// ─── More aggregation ───
console.log("\n--- More aggregation ---");
const sumAgg = aggregate([{ "$group": { "_id": null, "total": { "$sum": "$age" } } }]);
assert("sum aggregate", sumAgg.length >= 1);
const minAgg = aggregate([{ "$match": { age: { "$ne": null } } }, { "$group": { "_id": null, "v": { "$min": "$age" } } }]);
assertEq("min aggregate", minAgg[0].v, 25);
const maxAgg = aggregate([{ "$match": { age: { "$ne": null } } }, { "$group": { "_id": null, "v": { "$max": "$age" } } }]);
assertEq("max aggregate", maxAgg[0].v, 35);
const groupAgg = aggregate([{ "$group": { "_id": "$active", "cnt": { "$sum": 1 } } }]);
assert("group by active", groupAgg.length >= 1);
const distinctAgg = aggregate([{ "$group": { "_id": "$active" } }]);
assert("distinct via group", distinctAgg.length >= 1);

// ─── $lookup (join equivalent) ───
console.log("\n--- $lookup ---");
insertOne({ name: "post_user", age: 99, active: 1 });
const postsColl = toBuffer("test_posts");
const postsData = [{ title: "P1", user_name: "Alice", likes: 10 }, { title: "P2", user_name: "Bob", likes: 5 }];
const postsBuf = toBuffer(JSON.stringify(postsData));
callJson(lib.mongo_insert_many, handle, db, db.length, postsColl, postsColl.length, postsBuf, postsBuf.length);
const lookup = aggregate([
  { "$lookup": { "from": "test_posts", "localField": "name", "foreignField": "user_name", "as": "posts" } },
  { "$match": { "posts.0": { "$exists": true } } },
]);
assert("$lookup returns results", lookup.length >= 1);
assert("$lookup has posts", Array.isArray(lookup[0].posts));

// ─── Projection ───
console.log("\n--- Projection ---");
const proj = find({ name: "Alice" }, { projection: { name: 1, age: 1, _id: 0 } });
assertEq("projection name", proj[0].name, "Alice");
assert("projection has age", proj[0].age !== undefined);
assert("projection no email", proj[0].email === undefined);

// ─── Multiple indexes ───
console.log("\n--- Indexes ---");
const idx2 = createIndex({ age: 1 }, { name: "idx_age" });
assertEq("second index", idx2, 0);
const idx3 = createIndex({ active: 1, age: -1 }, { name: "idx_compound" });
assertEq("compound index", idx3, 0);

// ─── Edge cases ───
console.log("\n--- Edge cases ---");
assertEq("empty result", find({ name: "NONEXISTENT" }).length, 0);
const nullFind = find({ name: "NONEXISTENT" }, { limit: 1 });
assertEq("null first", nullFind.length, 0);
assertEq("count zero filter", count({ name: "NONEXISTENT" }), 0);

// ─── Cleanup ───
deleteMany({});
const fEmpty = toBuffer("{}");
lib.mongo_delete_many(handle, db, db.length, collTags, collTags.length, fEmpty, fEmpty.length);
lib.mongo_delete_many(handle, db, db.length, postsColl, postsColl.length, fEmpty, fEmpty.length);
lib.mongo_close(handle);

console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===`);
if (failed > 0) { console.log("FAIL"); Ekko.exit(1); }
else console.log("PASS");
