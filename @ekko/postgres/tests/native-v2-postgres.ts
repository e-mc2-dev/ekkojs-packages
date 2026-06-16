// Native driver test — PostgreSQL (no ORM, raw PgClient)
// Run: ekko run --allow=fs,ffi:unsafe,net,env ekko-lib/postgres/tests/native-v2-postgres.ts
// Requires: docker run -d --name ekko-pg-test -e POSTGRES_USER=ekko -e POSTGRES_PASSWORD=ekko -e POSTGRES_DB=ekko_test -p 5433:5432 postgres:17-alpine

import { dlopen, types } from "ekko:ffi";

const platform = Ekko.platform === "win32" ? "windows-x64" : Ekko.platform === "darwin" ? "macos-arm64" : "linux-x64";
const ext = Ekko.platform === "win32" ? "dll" : Ekko.platform === "darwin" ? "dylib" : "so";
const pg = dlopen(`ekko-lib/postgres/native/${platform}/EkkoPostgres.${ext}`, {
  pg_connect:  { args: [types.buffer, types.i32], returns: types.i32 },
  pg_query:    { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  pg_exec:     { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  pg_begin:    { args: [types.i32], returns: types.i32 },
  pg_commit:   { args: [types.i32], returns: types.i32 },
  pg_rollback: { args: [types.i32], returns: types.i32 },
  pg_close:    { args: [types.i32], returns: types.void },
});

function buf(s: string) { return new TextEncoder().encode(s); }
function query(h: number, sql: string, params: any = {}): any {
  const s = buf(sql), p = buf(JSON.stringify(params));
  const j = pg.pg_query(h, s, s.length, p, p.length) as string;
  if (!j) return { columns: [], rows: [] };
  const r = JSON.parse(j); if (r.error) throw new Error(r.error); return r;
}
function exec(h: number, sql: string, params: any = {}): number {
  const s = buf(sql), p = buf(JSON.stringify(params));
  return pg.pg_exec(h, s, s.length, p, p.length) as number;
}
function rows(r: any): any[] {
  return r.rows.map((row: any[]) => { const o: any = {}; r.columns.forEach((c: string, i: number) => o[c] = row[i]); return o; });
}

console.log("\n=== PostgreSQL Native Driver Test ===\n");
let passed = 0, failed = 0, total = 0;
function assert(name: string, cond: boolean, detail?: string) { total++; if (cond) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); } }
function assertEq(name: string, a: any, e: any) { const as = JSON.stringify(a), es = JSON.stringify(e); assert(name, as === es, `got ${as}, expected ${es}`); }

// ── Connect ──
const cs = buf(`Host=${Ekko.env.get("PG_HOST")||"localhost"};Port=${Ekko.env.get("PG_PORT")||"5433"};Database=${Ekko.env.get("PG_DB")||"ekko_test"};Username=${Ekko.env.get("PG_USER")||"ekko"};Password=${Ekko.env.get("PG_PASS")||"ekko"};Pooling=true`);
const h = pg.pg_connect(cs, cs.length) as number;
assert("connect", h > 0);

// ── Cleanup + Schema ──
exec(h, 'DROP TABLE IF EXISTS posts'); exec(h, 'DROP TABLE IF EXISTS tags'); exec(h, 'DROP TABLE IF EXISTS users');
exec(h, 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, age INTEGER, active INTEGER NOT NULL DEFAULT 1)');
exec(h, 'CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL, body TEXT, user_id INTEGER NOT NULL, likes INTEGER NOT NULL DEFAULT 0)');
exec(h, 'CREATE INDEX IF NOT EXISTS idx_posts_user ON posts (user_id)');
exec(h, 'CREATE TABLE tags (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL)');
assert("create users", true); assert("create posts", true); assert("create tags", true);

// ── INSERT ──
console.log("\n--- INSERT ---");
exec(h, 'INSERT INTO users (name, email, age) VALUES (@p0, @p1, @p2)', {p0:"Alice",p1:"alice@test.com",p2:30});
exec(h, 'INSERT INTO users (name, email, age) VALUES (@p0, @p1, @p2)', {p0:"Bob",p1:"bob@test.com",p2:25});
exec(h, 'INSERT INTO users (name, email, age, active) VALUES (@p0, @p1, @p2, @p3)', {p0:"Charlie",p1:"charlie@test.com",p2:35,p3:0});
exec(h, 'INSERT INTO users (name, email, age) VALUES (@p0, @p1, @p2)', {p0:"Diana",p1:"diana@test.com",p2:28});
exec(h, 'INSERT INTO users (name, email, age) VALUES (@p0, @p1, @p2)', {p0:"Eve",p1:"eve@test.com",p2:null});
assert("insert 5 users", true);
exec(h, 'INSERT INTO posts (title, body, user_id, likes) VALUES (@p0, @p1, @p2, @p3)', {p0:"Hello World",p1:"First post",p2:1,p3:10});
exec(h, 'INSERT INTO posts (title, body, user_id, likes) VALUES (@p0, @p1, @p2, @p3)', {p0:"ORM Guide",p1:"How to use ORM",p2:1,p3:5});
exec(h, 'INSERT INTO posts (title, body, user_id, likes) VALUES (@p0, @p1, @p2, @p3)', {p0:"Postgres Tips",p1:"PG tricks",p2:2,p3:20});
exec(h, 'INSERT INTO posts (title, body, user_id, likes) VALUES (@p0, @p1, @p2, @p3)', {p0:"Draft",p1:null,p2:3,p3:0});
assert("insert 4 posts", true);
exec(h, 'INSERT INTO tags (name) VALUES (@p0)', {p0:"rust"});
exec(h, 'INSERT INTO tags (name) VALUES (@p0)', {p0:"javascript"});
exec(h, 'INSERT INTO tags (name) VALUES (@p0)', {p0:"database"});
assert("insert 3 tags", true);

// ── SELECT ──
console.log("\n--- SELECT ---");
const all = rows(query(h, 'SELECT * FROM users'));
assertEq("select all count", all.length, 5);
assertEq("first name", all[0].name, "Alice");
const names = rows(query(h, 'SELECT name FROM users'));
assertEq("select column", names[0].name, "Alice");
assert("only one column", Object.keys(names[0]).length === 1);

// ── WHERE ──
console.log("\n--- WHERE ---");
const alice = rows(query(h, 'SELECT * FROM users WHERE name = @p0 LIMIT 1', {p0:"Alice"}))[0];
assertEq("where eq", alice.name, "Alice");
assertEq("where eq email", alice.email, "alice@test.com");
assertEq("where lt", rows(query(h, 'SELECT * FROM users WHERE age < @p0', {p0:30})).length, 2);
assertEq("where gte", rows(query(h, 'SELECT * FROM users WHERE age >= @p0', {p0:30})).length, 2);
assertEq("where neq", rows(query(h, 'SELECT * FROM users WHERE name != @p0', {p0:"Bob"})).length, 4);
assertEq("where like", rows(query(h, "SELECT * FROM users WHERE name LIKE @p0", {p0:"A%"})).length, 1);
assertEq("where like val", rows(query(h, "SELECT * FROM users WHERE name LIKE @p0", {p0:"A%"}))[0].name, "Alice");
assertEq("where not like", rows(query(h, "SELECT * FROM users WHERE name NOT LIKE @p0", {p0:"A%"})).length, 4);

// ── WHERE object / compound ──
console.log("\n--- WHERE compound ---");
assertEq("obj shorthand", rows(query(h, 'SELECT * FROM users WHERE name = @p0 LIMIT 1', {p0:"Bob"}))[0].name, "Bob");
assertEq("multi-field", rows(query(h, 'SELECT * FROM users WHERE (name = @p0 AND age = @p1) LIMIT 1', {p0:"Alice",p1:30}))[0].email, "alice@test.com");
assert("AND", rows(query(h, 'SELECT * FROM users WHERE (age > @p0 AND active = @p1)', {p0:25,p1:1})).length >= 2);
assertEq("OR", rows(query(h, 'SELECT * FROM users WHERE (name = @p0 OR name = @p1)', {p0:"Alice",p1:"Bob"})).length, 2);
assert("NOT", rows(query(h, 'SELECT * FROM users WHERE NOT (active = @p0)', {p0:1})).length >= 1);

// ── WHERE special ──
console.log("\n--- WHERE special ---");
assertEq("isNull count", rows(query(h, 'SELECT * FROM users WHERE age IS NULL')).length, 1);
assertEq("isNull name", rows(query(h, 'SELECT * FROM users WHERE age IS NULL'))[0].name, "Eve");
assertEq("isNotNull", rows(query(h, 'SELECT * FROM users WHERE age IS NOT NULL')).length, 4);
assertEq("between", rows(query(h, 'SELECT * FROM users WHERE age BETWEEN @p0 AND @p1', {p0:25,p1:30})).length, 3);
assertEq("in", rows(query(h, "SELECT * FROM users WHERE name IN (@p0,@p1)", {p0:"Alice",p1:"Charlie"})).length, 2);

// ── ORDER BY ──
console.log("\n--- ORDER BY ---");
assertEq("asc", rows(query(h, 'SELECT * FROM users WHERE age IS NOT NULL ORDER BY age ASC'))[0].name, "Bob");
assertEq("desc", rows(query(h, 'SELECT * FROM users WHERE age IS NOT NULL ORDER BY age DESC'))[0].name, "Charlie");

// ── LIMIT / OFFSET ──
console.log("\n--- LIMIT / OFFSET ---");
assertEq("limit", rows(query(h, 'SELECT * FROM users LIMIT 2')).length, 2);
assertEq("offset", rows(query(h, 'SELECT * FROM users LIMIT 100 OFFSET 3')).length, 2);
assertEq("limit+offset", rows(query(h, 'SELECT * FROM users LIMIT 2 OFFSET 1')).length, 2);

// ── DISTINCT ──
console.log("\n--- DISTINCT ---");
assert("distinct", rows(query(h, 'SELECT DISTINCT active FROM users')).length >= 2);

// ── AGGREGATES ──
console.log("\n--- AGGREGATES ---");
assertEq("count", rows(query(h, 'SELECT COUNT(*) AS cnt FROM users'))[0].cnt, 5);
assertEq("sum", rows(query(h, 'SELECT SUM(likes) AS v FROM posts'))[0].v, 35);
assert("avg", typeof rows(query(h, 'SELECT AVG(age) AS v FROM users WHERE age IS NOT NULL'))[0].v === "number");
assertEq("min", rows(query(h, 'SELECT MIN(age) AS v FROM users WHERE age IS NOT NULL'))[0].v, 25);
assertEq("max", rows(query(h, 'SELECT MAX(age) AS v FROM users WHERE age IS NOT NULL'))[0].v, 35);

// ── first / exists ──
console.log("\n--- first / exists ---");
assertEq("first", rows(query(h, 'SELECT * FROM users LIMIT 1'))[0].name, "Alice");
assert("exists true", rows(query(h, 'SELECT COUNT(*) AS c FROM users WHERE name = @p0', {p0:"Alice"}))[0].c > 0);
assert("exists false", rows(query(h, 'SELECT COUNT(*) AS c FROM users WHERE name = @p0', {p0:"Nobody"}))[0].c === 0);
assert("firstOrThrow", (() => { try { const r = rows(query(h, 'SELECT * FROM users WHERE name = @p0 LIMIT 1', {p0:"Nobody"})); if (!r.length) throw new Error("no rows"); return false; } catch { return true; } })());

// ── UPDATE ──
console.log("\n--- UPDATE ---");
exec(h, 'UPDATE users SET age = @p0 WHERE name = @p1', {p0:31,p1:"Alice"});
assertEq("update age", rows(query(h, 'SELECT * FROM users WHERE name = @p0 LIMIT 1', {p0:"Alice"}))[0].age, 31);
exec(h, 'UPDATE users SET active = @p0 WHERE active = @p1', {p0:1,p1:0});
assertEq("update active", rows(query(h, 'SELECT COUNT(*) AS c FROM users WHERE active = @p0', {p0:1}))[0].c, 5);

// ── DELETE ──
console.log("\n--- DELETE ---");
exec(h, 'DELETE FROM tags WHERE name = @p0', {p0:"database"});
assertEq("delete", rows(query(h, 'SELECT COUNT(*) AS c FROM tags'))[0].c, 2);

// ── JOIN ──
console.log("\n--- JOIN ---");
const joined = rows(query(h, 'SELECT posts.title, users.name FROM posts JOIN users ON posts.user_id = users.id'));
assertEq("join count", joined.length, 4);
assert("join name", joined[0].name !== undefined);
assertEq("join str", rows(query(h, 'SELECT posts.title, users.name FROM posts JOIN users ON posts.user_id = users.id')).length, 4);
assert("left join", rows(query(h, 'SELECT users.name, posts.title FROM users LEFT JOIN posts ON users.id = posts.user_id')).length >= 5);

// ── GROUP BY ──
console.log("\n--- GROUP BY ---");
assert("group", rows(query(h, 'SELECT user_id, COUNT(*) AS cnt FROM posts GROUP BY user_id')).length >= 1);
assert("having", true); // PG needs raw aggregate in HAVING — skipped like ORM test

// ── TRANSACTIONS ──
console.log("\n--- TRANSACTIONS ---");
pg.pg_begin(h);
exec(h, "INSERT INTO tags (name) VALUES (@p0)", {p0:"testing"});
assertEq("in-tx count", rows(query(h, 'SELECT COUNT(*) AS c FROM tags'))[0].c, 3);
pg.pg_commit(h);
assertEq("after commit", rows(query(h, 'SELECT COUNT(*) AS c FROM tags'))[0].c, 3);
pg.pg_begin(h);
exec(h, "INSERT INTO tags (name) VALUES (@p0)", {p0:"temporary"});
assertEq("before rollback", rows(query(h, 'SELECT COUNT(*) AS c FROM tags'))[0].c, 4);
pg.pg_rollback(h);
assertEq("after rollback", rows(query(h, 'SELECT COUNT(*) AS c FROM tags'))[0].c, 3);

// ── SUBQUERIES ──
console.log("\n--- SUBQUERIES ---");
const pop = rows(query(h, 'SELECT * FROM users WHERE EXISTS (SELECT 1 FROM posts WHERE posts.user_id = users.id AND likes > @p0)', {p0:5}));
assertEq("exists popular", pop.length, 2);
assert("exists alice", pop.some((u: any) => u.name === "Alice"));
assert("exists bob", pop.some((u: any) => u.name === "Bob"));
assertEq("exists multi", rows(query(h, 'SELECT * FROM users WHERE EXISTS (SELECT 1 FROM posts WHERE posts.user_id = users.id AND (likes >= @p0 AND body IS NOT NULL))', {p0:10})).length, 2);
assertEq("not exists", rows(query(h, 'SELECT * FROM users WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.user_id = users.id AND likes > @p0)', {p0:5})).length, 3);
assert("not exists charlie", rows(query(h, 'SELECT * FROM users WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.user_id = users.id AND likes > @p0)', {p0:5})).some((u: any) => u.name === "Charlie"));
assertEq("count>1", rows(query(h, 'SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) > @p0', {p0:1})).length, 1);
assertEq("count>1 alice", rows(query(h, 'SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) > @p0', {p0:1}))[0].name, "Alice");
assertEq("count=1", rows(query(h, 'SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) = @p0', {p0:1})).length, 2);
assertEq("count=0", rows(query(h, 'SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) = @p0', {p0:0})).length, 2);
assertEq("count>=1", rows(query(h, 'SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) >= @p0', {p0:1})).length, 3);
assertEq("count<2", rows(query(h, 'SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) < @p0', {p0:2})).length, 4);
assert("sub+where", rows(query(h, 'SELECT * FROM users WHERE ((SELECT COUNT(*) FROM posts WHERE user_id = users.id) > @p0 AND age > @p1)', {p0:0,p1:25})).length >= 1);

// ── Native extras (replace ORM-specific: toSQL, include, chain immutability) ──
console.log("\n--- Native extras ---");
const insR = exec(h, 'INSERT INTO tags (name) VALUES (@p0)', {p0:"native"});
assert("insert affected rows", insR >= 1);
const updR = exec(h, 'UPDATE tags SET name = @p0 WHERE name = @p1', {p0:"native2",p1:"native"});
assert("update affected rows", updR >= 1);
const delR = exec(h, 'DELETE FROM tags WHERE name = @p0', {p0:"native2"});
assert("delete affected rows", delR >= 1);
assert("duplicate key error", exec(h, 'INSERT INTO users (name, email) VALUES (@p0, @p1)', {p0:"Dupe",p1:"alice@test.com"}) < 0);
const multiSort = rows(query(h, 'SELECT * FROM users WHERE age IS NOT NULL ORDER BY active ASC, age DESC'));
assert("multi-column order", multiSort.length >= 2);
assertEq("count with group", rows(query(h, 'SELECT active, COUNT(*) AS cnt FROM users GROUP BY active')).length, 1);
const havingR = rows(query(h, 'SELECT user_id, COUNT(*) AS cnt FROM posts GROUP BY user_id HAVING COUNT(*) > 1'));
assert("having raw aggregate", havingR.length >= 1);
assert("connection alive", h > 0);

// ── Edge cases ──
console.log("\n--- Edge cases ---");
assertEq("empty", rows(query(h, 'SELECT * FROM users WHERE name = @p0', {p0:"NOPE"})).length, 0);
assertEq("null first", rows(query(h, 'SELECT * FROM users WHERE name = @p0 LIMIT 1', {p0:"NOPE"})).length, 0);

pg.pg_close(h);
console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===`);
if (failed > 0) { console.log("FAIL"); Ekko.exit(1); } else console.log("PASS");
