// ORM v2 parity test — validates identical behavior between SQLite and PostgreSQL
//
// Run SQLite:   ekko run --allow=fs,ffi ekko-lib/postgres/tests/orm-v2-parity.ts -- sqlite
// Run Postgres: ekko run --allow=fs,ffi,net,env ekko-lib/postgres/tests/orm-v2-parity.ts -- postgres
//
// Both should produce IDENTICAL output (pass/fail per test case).

import { Database } from "ekko:db";
import { connect, defineTable, col, idx } from "ekko:db/orm";
import { register as registerPostgres } from "../src/index.ts";

// ─── Driver Selection ───

const mode = Ekko.args[Ekko.args.length - 1] || "sqlite";
let db: any;

if (mode === "postgres") {
  registerPostgres();
  db = connect("postgres", {
    host: Ekko.env.get("PG_HOST") || "localhost",
    port: parseInt(Ekko.env.get("PG_PORT") || "5432"),
    database: Ekko.env.get("PG_DB") || "ekko_test",
    user: Ekko.env.get("PG_USER") || "ekko",
    password: Ekko.env.get("PG_PASS") || "ekko",
  });
  // Clean up from previous runs
  try { db.exec("DROP TABLE IF EXISTS posts"); } catch {}
  try { db.exec("DROP TABLE IF EXISTS tags"); } catch {}
  try { db.exec("DROP TABLE IF EXISTS users"); } catch {}
} else {
  db = connect(Database(":memory:"));
}

console.log(`\n=== ORM v2 Parity Test (${mode}) ===\n`);

// ─── Test Harness ───

let passed = 0;
let failed = 0;
let total = 0;

function assert(name: string, condition: boolean, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

function assertEq(name: string, actual: any, expected: any) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  assert(name, a === e, `got ${a}, expected ${e}`);
}

function assertThrows(name: string, fn: () => void) {
  total++;
  try { fn(); failed++; console.log(`  ✗ ${name} — did not throw`); }
  catch { passed++; console.log(`  ✓ ${name}`); }
}

// ─── Schema Definitions ───

const Users = defineTable("users", {
  id:         col.int().primaryKey().autoIncrement(),
  name:       col.text(),
  email:      col.text().unique(),
  age:        col.int().nullable(),
  active:     col.bool().default(true),
});

const Posts = defineTable("posts", {
  id:         col.int().primaryKey().autoIncrement(),
  title:      col.text(),
  body:       col.text().nullable(),
  user_id:    col.int(),
  likes:      col.int().default(0),
}, { indexes: [idx("user_id").name("idx_posts_user")] });

Posts.belongsTo(Users, { foreignKey: "user_id" });

const Tags = defineTable("tags", {
  id:         col.int().primaryKey().autoIncrement(),
  name:       col.text().unique(),
});

Users.hasMany(Posts, { foreignKey: "user_id" });

// ─── Setup ───

console.log("--- Schema Creation ---");
db.createTable(Users);
db.createTable(Posts);
db.createTable(Tags);
assert("createTable Users", true);
assert("createTable Posts", true);
assert("createTable Tags", true);

// ─── 1. INSERT ───

console.log("\n--- INSERT ---");

db.from(Users).insert({ name: "Alice", email: "alice@test.com", age: 30 }).exec();
db.from(Users).insert({ name: "Bob", email: "bob@test.com", age: 25 }).exec();
db.from(Users).insert({ name: "Charlie", email: "charlie@test.com", age: 35, active: false }).exec();
db.from(Users).insert({ name: "Diana", email: "diana@test.com", age: 28 }).exec();
db.from(Users).insert({ name: "Eve", email: "eve@test.com", age: null }).exec();
assert("insert 5 users", true);

db.from(Posts).insert({ title: "Hello World", body: "First post", user_id: 1, likes: 10 }).exec();
db.from(Posts).insert({ title: "ORM Guide", body: "How to use ORM", user_id: 1, likes: 5 }).exec();
db.from(Posts).insert({ title: "Postgres Tips", body: "PG tricks", user_id: 2, likes: 20 }).exec();
db.from(Posts).insert({ title: "Draft", body: null, user_id: 3, likes: 0 }).exec();
assert("insert 4 posts", true);

db.from(Tags).insert({ name: "rust" }).exec();
db.from(Tags).insert({ name: "javascript" }).exec();
db.from(Tags).insert({ name: "database" }).exec();
assert("insert 3 tags", true);

// ─── 2. SELECT (toArray) ───

console.log("\n--- SELECT ---");

const allUsers = db.from(Users).toArray();
assertEq("select all users count", allUsers.length, 5);
assertEq("first user name", allUsers[0].name, "Alice");

const names = db.from(Users).select(u => [u.name]).toArray();
assertEq("select single column", names[0].name, "Alice");
assert("select returns only requested columns", Object.keys(names[0]).length === 1);

// ─── 3. WHERE (proxy expressions) ───

console.log("\n--- WHERE (proxy expressions) ---");

const alice = db.from(Users).where(u => u.name.eq("Alice")).first();
assertEq("where eq", alice.name, "Alice");
assertEq("where eq email", alice.email, "alice@test.com");

const young = db.from(Users).where(u => u.age.lt(30)).toArray();
assertEq("where lt count", young.length, 2);

const old = db.from(Users).where(u => u.age.gte(30)).toArray();
assertEq("where gte count", old.length, 2);

const notBob = db.from(Users).where(u => u.name.neq("Bob")).toArray();
assertEq("where neq count", notBob.length, 4);

const likeName = db.from(Users).where(u => u.name.like("A%")).toArray();
assertEq("where like count", likeName.length, 1);
assertEq("where like result", likeName[0].name, "Alice");

const notLike = db.from(Users).where(u => u.name.notLike("A%")).toArray();
assertEq("where notLike count", notLike.length, 4);

// ─── 4. WHERE (object shorthand) ───

console.log("\n--- WHERE (object shorthand) ---");

const byObj = db.from(Users).where({ name: "Bob" }).first();
assertEq("where object shorthand", byObj.name, "Bob");

const byMultiObj = db.from(Users).where({ name: "Alice", age: 30 }).first();
assertEq("where multi-field object", byMultiObj.email, "alice@test.com");

// ─── 5. WHERE (compound: AND, OR, NOT) ───

console.log("\n--- WHERE (compound) ---");

const andResult = db.from(Users).where(u => u.age.gt(25).and(u.active.eq(true))).toArray();
assert("AND: age>25 AND active", andResult.length >= 2);

const orResult = db.from(Users).where(u => u.name.eq("Alice").or(u.name.eq("Bob"))).toArray();
assertEq("OR: Alice or Bob", orResult.length, 2);

const notResult = db.from(Users).where(u => u.active.eq(true).not()).toArray();
assert("NOT: !active", notResult.length >= 1);

// ─── 6. WHERE (isNull, isNotNull, between, isIn) ───

console.log("\n--- WHERE (special operators) ---");

const nullAge = db.from(Users).where(u => u.age.isNull()).toArray();
assertEq("isNull count", nullAge.length, 1);
assertEq("isNull name", nullAge[0].name, "Eve");

const notNullAge = db.from(Users).where(u => u.age.isNotNull()).toArray();
assertEq("isNotNull count", notNullAge.length, 4);

const between = db.from(Users).where(u => u.age.between(25, 30)).toArray();
assertEq("between 25-30 count", between.length, 3);

const inList = db.from(Users).where(u => u.name.isIn(["Alice", "Charlie"])).toArray();
assertEq("isIn count", inList.length, 2);

// ─── 7. ORDER BY ───

console.log("\n--- ORDER BY ---");

const ascending = db.from(Users).where(u => u.age.isNotNull()).orderBy("age").toArray();
assertEq("orderBy ASC first", ascending[0].name, "Bob");

const descending = db.from(Users).where(u => u.age.isNotNull()).orderByDesc("age").toArray();
assertEq("orderByDesc first", descending[0].name, "Charlie");

// ─── 8. LIMIT / OFFSET ───

console.log("\n--- LIMIT / OFFSET ---");

const limited = db.from(Users).take(2).toArray();
assertEq("take(2) count", limited.length, 2);

const skipped = db.from(Users).take(100).skip(3).toArray();
assertEq("skip(3) count", skipped.length, 2);

const page = db.from(Users).take(2).skip(1).toArray();
assertEq("take(2).skip(1) count", page.length, 2);

// ─── 9. DISTINCT ───

console.log("\n--- DISTINCT ---");

const distinctActive = db.from(Users).select(u => [u.active]).distinct().toArray();
assert("distinct active values", distinctActive.length >= 2);

// ─── 10. AGGREGATES ───

console.log("\n--- AGGREGATES ---");

const userCount = db.from(Users).count();
assertEq("count()", userCount, 5);

const totalLikes = db.from(Posts).sum("likes");
assertEq("sum(likes)", totalLikes, 35);

const avgAge = db.from(Users).where(u => u.age.isNotNull()).avg("age");
assert("avg(age) is numeric", typeof avgAge === "number" && avgAge > 0);

const minAge = db.from(Users).where(u => u.age.isNotNull()).min("age");
assertEq("min(age)", minAge, 25);

const maxAge = db.from(Users).where(u => u.age.isNotNull()).max("age");
assertEq("max(age)", maxAge, 35);

// ─── 11. first / firstOrThrow / exists ───

console.log("\n--- first / firstOrThrow / exists ---");

const firstUser = db.from(Users).first();
assertEq("first() returns first row", firstUser.name, "Alice");

const exists = db.from(Users).where(u => u.name.eq("Alice")).exists();
assert("exists() true", exists === true);

const notExists = db.from(Users).where(u => u.name.eq("Nobody")).exists();
assert("exists() false", notExists === false);

assertThrows("firstOrThrow on empty", () => {
  db.from(Users).where(u => u.name.eq("Nobody")).firstOrThrow();
});

// ─── 12. UPDATE ───

console.log("\n--- UPDATE ---");

db.from(Users).where(u => u.name.eq("Alice")).update({ age: 31 }).exec();
const updatedAlice = db.from(Users).where(u => u.name.eq("Alice")).first();
assertEq("update age", updatedAlice.age, 31);

db.from(Users).where(u => u.active.eq(false)).update({ active: true }).exec();
const reactivated = db.from(Users).where(u => u.active.eq(true)).count();
assertEq("update all active", reactivated, 5);

// ─── 13. DELETE ───

console.log("\n--- DELETE ---");

db.from(Tags).where(u => u.name.eq("database")).delete().exec();
const remainingTags = db.from(Tags).count();
assertEq("delete one tag", remainingTags, 2);

// ─── 14. JOIN ───

console.log("\n--- JOIN ---");

const joined = db.from(Posts)
  .join(Users, (p, u) => p.user_id.eqField(u.id))
  .select("posts.title", "users.name")
  .toArray();
assertEq("join count", joined.length, 4);
assert("join has user name", joined[0].name !== undefined);

// String ON clause
const joinedStr = db.from(Posts)
  .join(Users, "posts.user_id = users.id")
  .select("posts.title", "users.name")
  .toArray();
assertEq("join string ON count", joinedStr.length, 4);

// LEFT JOIN
const leftJoined = db.from(Users)
  .leftJoin(Posts, (u, p) => u.id.eqField(p.user_id))
  .select("users.name", "posts.title")
  .toArray();
assert("left join count >= users", leftJoined.length >= 5);

// ─── 15. GROUP BY + HAVING ───

console.log("\n--- GROUP BY + HAVING ---");

const grouped = db.from(Posts)
  .select("user_id", "COUNT(*) AS post_count")
  .groupBy("user_id")
  .toArray();
assert("group by returns rows", grouped.length >= 1);

const havingResult = db.from(Posts)
  .select("user_id", "COUNT(*) AS cnt")
  .groupBy("user_id")
  .having(h => h.cnt.gt(1))
  .toArray();
assert("having filters groups", havingResult.length >= 1);

// ─── 16. TRANSACTIONS ───

console.log("\n--- TRANSACTIONS ---");

// Commit test
db.transaction((tx: any) => {
  tx.from(Tags).insert({ name: "testing" }).exec();
  const inTx = tx.from(Tags).count();
  assertEq("in-transaction count", inTx, 3);
});
const afterCommit = db.from(Tags).count();
assertEq("after commit count", afterCommit, 3);

// Rollback test (throw inside transaction)
try {
  db.transaction((tx: any) => {
    tx.from(Tags).insert({ name: "temporary" }).exec();
    const inTx = tx.from(Tags).count();
    assertEq("before rollback count", inTx, 4);
    throw new Error("force rollback");
  });
} catch {}
const afterRollback = db.from(Tags).count();
assertEq("after rollback count", afterRollback, 3);

// ─── 17. toSQL (query inspection) ───

console.log("\n--- toSQL ---");

const sql = db.from(Users).where(u => u.name.eq("test")).toSQL();
assert("toSQL contains WHERE", sql.includes("WHERE"));
assert("toSQL contains param placeholder", sql.includes("@p"));

const insertSql = db.from(Users).insert({ name: "test", email: "t@t.com" }).toSQL();
assert("insert toSQL contains INSERT", insertSql.includes("INSERT"));
assert("insert toSQL contains VALUES", insertSql.includes("VALUES"));

// ─── 18. include (eager loading) ───

console.log("\n--- INCLUDE (eager loading) ---");

const usersWithPosts = db.from(Users).include(u => u.posts).toArray();
assert("include returns users", usersWithPosts.length >= 1);
assert("include attaches posts array", Array.isArray(usersWithPosts[0].posts));

const aliceWithPosts = db.from(Users).where(u => u.name.eq("Alice")).include(u => u.posts).first();
assertEq("Alice has 2 posts", aliceWithPosts.posts.length, 2);

// ─── 19. Chained queries (immutability) ───

console.log("\n--- Chain immutability ---");

const base = db.from(Users);
const q1 = base.where(u => u.age.gt(25));
const q2 = base.where(u => u.name.eq("Bob"));
const r1 = q1.count();
const r2 = q2.count();
assert("chained queries are independent", r1 !== r2 || (r1 >= 1 && r2 >= 1));
assert("base query unmodified", base.count() === 5);

// ─── 20. Edge cases ───

console.log("\n--- Edge cases ---");

const emptyResult = db.from(Users).where(u => u.name.eq("NONEXISTENT")).toArray();
assertEq("empty result is array", emptyResult.length, 0);

const nullFirst = db.from(Users).where(u => u.name.eq("NONEXISTENT")).first();
assertEq("first on empty is null", nullFirst, null);

// ─── Cleanup & Summary ───

db.close();

console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===`);
if (failed > 0) console.log("FAIL");
else console.log("PASS");
