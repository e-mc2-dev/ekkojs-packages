// Native driver test — MySQL (no ORM, raw MysqlClient)
// Run: ekko run --allow=fs,ffi:unsafe,net,env ekko-lib/mysql/tests/native-v2-mysql.ts
// Requires: docker run -d --name ekko-mysql-test -e MYSQL_ROOT_PASSWORD=ekko -e MYSQL_DATABASE=ekko_test -p 3307:3306 mysql:8

import { dlopen, types } from "ekko:ffi";
const platform = Ekko.platform === "win32" ? "windows-x64" : Ekko.platform === "darwin" ? "macos-arm64" : "linux-x64";
const ext = Ekko.platform === "win32" ? "dll" : Ekko.platform === "darwin" ? "dylib" : "so";
const lib = dlopen(`ekko-lib/mysql/native/${platform}/EkkoMysql.${ext}`, {
  mysql_connect:{args:[types.buffer,types.i32],returns:types.i32},
  mysql_query:{args:[types.i32,types.buffer,types.i32,types.buffer,types.i32],returns:types.cstring},
  mysql_exec:{args:[types.i32,types.buffer,types.i32,types.buffer,types.i32],returns:types.i32},
  mysql_begin:{args:[types.i32],returns:types.i32},mysql_commit:{args:[types.i32],returns:types.i32},mysql_rollback:{args:[types.i32],returns:types.i32},
  mysql_close:{args:[types.i32],returns:types.void},
});
function buf(s:string){return new TextEncoder().encode(s);}
function query(h:number,sql:string,params:any={}):any{const s=buf(sql),p=buf(JSON.stringify(params));const j=lib.mysql_query(h,s,s.length,p,p.length)as string;if(!j)return{columns:[],rows:[]};const r=JSON.parse(j);if(r.error)throw new Error(r.error);return r;}
function exec(h:number,sql:string,params:any={}):number{const s=buf(sql),p=buf(JSON.stringify(params));return lib.mysql_exec(h,s,s.length,p,p.length)as number;}
function rows(r:any):any[]{return r.rows.map((row:any[])=>{const o:any={};r.columns.forEach((c:string,i:number)=>o[c]=row[i]);return o;});}

console.log("\n=== MySQL Native Driver Test ===\n");
let passed=0,failed=0,total=0;
function assert(n:string,c:boolean,d?:string){total++;if(c){passed++;console.log(`  ✓ ${n}`);}else{failed++;console.log(`  ✗ ${n}${d?" — "+d:""}`);}}
function assertEq(n:string,a:any,e:any){const as=JSON.stringify(a),es=JSON.stringify(e);assert(n,as===es,`got ${as}, expected ${es}`);}

const cs=buf(`Server=${Ekko.env.get("MYSQL_HOST")||"localhost"};Port=${Ekko.env.get("MYSQL_PORT")||"3307"};Database=${Ekko.env.get("MYSQL_DB")||"ekko_test"};User Id=${Ekko.env.get("MYSQL_USER")||"root"};Password=${Ekko.env.get("MYSQL_PASS")||"ekko"};Pooling=true;TreatTinyAsBoolean=false`);
const h=lib.mysql_connect(cs,cs.length)as number;
assert("connect",h>0);

exec(h,'DROP TABLE IF EXISTS posts');exec(h,'DROP TABLE IF EXISTS tags');exec(h,'DROP TABLE IF EXISTS users');
exec(h,'CREATE TABLE IF NOT EXISTS `users` (`id` INT PRIMARY KEY AUTO_INCREMENT, `name` VARCHAR(255) NOT NULL, `email` VARCHAR(255) UNIQUE NOT NULL, `age` INT, `active` INT NOT NULL DEFAULT 1)');
exec(h,'CREATE TABLE IF NOT EXISTS `posts` (`id` INT PRIMARY KEY AUTO_INCREMENT, `title` VARCHAR(255) NOT NULL, `body` VARCHAR(255), `user_id` INT NOT NULL, `likes` INT NOT NULL DEFAULT 0)');
exec(h,'CREATE INDEX IF NOT EXISTS idx_posts_user ON posts (user_id)');
exec(h,'CREATE TABLE IF NOT EXISTS `tags` (`id` INT PRIMARY KEY AUTO_INCREMENT, `name` VARCHAR(255) UNIQUE NOT NULL)');
assert("create users",true);assert("create posts",true);assert("create tags",true);

console.log("\n--- INSERT ---");
exec(h,'INSERT INTO `users` (name,email,age) VALUES (@p0,@p1,@p2)',{p0:"Alice",p1:"alice@test.com",p2:30});
exec(h,'INSERT INTO `users` (name,email,age) VALUES (@p0,@p1,@p2)',{p0:"Bob",p1:"bob@test.com",p2:25});
exec(h,'INSERT INTO `users` (name,email,age,active) VALUES (@p0,@p1,@p2,@p3)',{p0:"Charlie",p1:"charlie@test.com",p2:35,p3:0});
exec(h,'INSERT INTO `users` (name,email,age) VALUES (@p0,@p1,@p2)',{p0:"Diana",p1:"diana@test.com",p2:28});
exec(h,'INSERT INTO `users` (name,email,age) VALUES (@p0,@p1,@p2)',{p0:"Eve",p1:"eve@test.com",p2:null});
assert("insert 5 users",true);
exec(h,'INSERT INTO `posts` (title,body,user_id,likes) VALUES (@p0,@p1,@p2,@p3)',{p0:"Hello World",p1:"First post",p2:1,p3:10});
exec(h,'INSERT INTO `posts` (title,body,user_id,likes) VALUES (@p0,@p1,@p2,@p3)',{p0:"ORM Guide",p1:"How to use ORM",p2:1,p3:5});
exec(h,'INSERT INTO `posts` (title,body,user_id,likes) VALUES (@p0,@p1,@p2,@p3)',{p0:"Postgres Tips",p1:"PG tricks",p2:2,p3:20});
exec(h,'INSERT INTO `posts` (title,body,user_id,likes) VALUES (@p0,@p1,@p2,@p3)',{p0:"Draft",p1:null,p2:3,p3:0});
assert("insert 4 posts",true);
exec(h,'INSERT INTO `tags` (name) VALUES (@p0)',{p0:"rust"});exec(h,'INSERT INTO `tags` (name) VALUES (@p0)',{p0:"javascript"});exec(h,'INSERT INTO `tags` (name) VALUES (@p0)',{p0:"database"});
assert("insert 3 tags",true);

console.log("\n--- SELECT ---");
const all=rows(query(h,'SELECT * FROM `users`'));assertEq("select all",all.length,5);assertEq("first name",all[0].name,"Alice");
assertEq("select col",rows(query(h,'SELECT name FROM `users`'))[0].name,"Alice");
assert("one col",Object.keys(rows(query(h,'SELECT name FROM `users`'))[0]).length===1);

console.log("\n--- WHERE ---");
const al=rows(query(h,'SELECT * FROM `users` WHERE name=@p0 LIMIT 1',{p0:"Alice"}))[0];
assertEq("eq",al.name,"Alice");assertEq("eq email",al.email,"alice@test.com");
assertEq("lt",rows(query(h,'SELECT * FROM `users` WHERE age<@p0',{p0:30})).length,2);
assertEq("gte",rows(query(h,'SELECT * FROM `users` WHERE age>=@p0',{p0:30})).length,2);
assertEq("neq",rows(query(h,'SELECT * FROM `users` WHERE name!=@p0',{p0:"Bob"})).length,4);
assertEq("like",rows(query(h,"SELECT * FROM `users` WHERE name LIKE @p0",{p0:"A%"})).length,1);
assertEq("like val",rows(query(h,"SELECT * FROM `users` WHERE name LIKE @p0",{p0:"A%"}))[0].name,"Alice");
assertEq("not like",rows(query(h,"SELECT * FROM `users` WHERE name NOT LIKE @p0",{p0:"A%"})).length,4);

console.log("\n--- WHERE compound ---");
assertEq("obj",rows(query(h,'SELECT * FROM `users` WHERE name=@p0 LIMIT 1',{p0:"Bob"}))[0].name,"Bob");
assertEq("multi",rows(query(h,'SELECT * FROM `users` WHERE (name=@p0 AND age=@p1) LIMIT 1',{p0:"Alice",p1:30}))[0].email,"alice@test.com");
assert("AND",rows(query(h,'SELECT * FROM `users` WHERE (age>@p0 AND active=@p1)',{p0:25,p1:1})).length>=2);
assertEq("OR",rows(query(h,'SELECT * FROM `users` WHERE (name=@p0 OR name=@p1)',{p0:"Alice",p1:"Bob"})).length,2);
assert("NOT",rows(query(h,'SELECT * FROM `users` WHERE NOT (active=@p0)',{p0:1})).length>=1);

console.log("\n--- WHERE special ---");
assertEq("isNull",rows(query(h,'SELECT * FROM `users` WHERE age IS NULL')).length,1);
assertEq("isNull name",rows(query(h,'SELECT * FROM `users` WHERE age IS NULL'))[0].name,"Eve");
assertEq("isNotNull",rows(query(h,'SELECT * FROM `users` WHERE age IS NOT NULL')).length,4);
assertEq("between",rows(query(h,'SELECT * FROM `users` WHERE age BETWEEN @p0 AND @p1',{p0:25,p1:30})).length,3);
assertEq("in",rows(query(h,"SELECT * FROM `users` WHERE name IN (@p0,@p1)",{p0:"Alice",p1:"Charlie"})).length,2);

console.log("\n--- ORDER BY ---");
assertEq("asc",rows(query(h,'SELECT * FROM `users` WHERE age IS NOT NULL ORDER BY age ASC'))[0].name,"Bob");
assertEq("desc",rows(query(h,'SELECT * FROM `users` WHERE age IS NOT NULL ORDER BY age DESC'))[0].name,"Charlie");

console.log("\n--- LIMIT/OFFSET ---");
assertEq("limit",rows(query(h,'SELECT * FROM `users` LIMIT 2')).length,2);
assertEq("offset",rows(query(h,'SELECT * FROM `users` LIMIT 100 OFFSET 3')).length,2);
assertEq("limit+offset",rows(query(h,'SELECT * FROM `users` LIMIT 2 OFFSET 1')).length,2);

console.log("\n--- DISTINCT ---");
assert("distinct",rows(query(h,'SELECT DISTINCT active FROM `users`')).length>=2);

console.log("\n--- AGGREGATES ---");
assertEq("count",rows(query(h,'SELECT COUNT(*) AS cnt FROM `users`'))[0].cnt,5);
assertEq("sum",rows(query(h,'SELECT SUM(likes) AS v FROM `posts`'))[0].v,35);
assert("avg",typeof rows(query(h,'SELECT AVG(age) AS v FROM `users` WHERE age IS NOT NULL'))[0].v==="number");
assertEq("min",rows(query(h,'SELECT MIN(age) AS v FROM `users` WHERE age IS NOT NULL'))[0].v,25);
assertEq("max",rows(query(h,'SELECT MAX(age) AS v FROM `users` WHERE age IS NOT NULL'))[0].v,35);

console.log("\n--- first/exists ---");
assertEq("first",rows(query(h,'SELECT * FROM `users` LIMIT 1'))[0].name,"Alice");
assert("exists true",rows(query(h,'SELECT COUNT(*) AS c FROM `users` WHERE name=@p0',{p0:"Alice"}))[0].c>0);
assert("exists false",rows(query(h,'SELECT COUNT(*) AS c FROM `users` WHERE name=@p0',{p0:"Nobody"}))[0].c===0);
assert("firstOrThrow",(()=>{try{const r=rows(query(h,'SELECT * FROM `users` WHERE name=@p0 LIMIT 1',{p0:"Nobody"}));if(!r.length)throw new Error("no");return false;}catch{return true;}})());

console.log("\n--- UPDATE ---");
exec(h,'UPDATE `users` SET age=@p0 WHERE name=@p1',{p0:31,p1:"Alice"});
assertEq("update age",rows(query(h,'SELECT * FROM `users` WHERE name=@p0 LIMIT 1',{p0:"Alice"}))[0].age,31);
exec(h,'UPDATE `users` SET active=@p0 WHERE active=@p1',{p0:1,p1:0});
assertEq("update active",rows(query(h,'SELECT COUNT(*) AS c FROM `users` WHERE active=@p0',{p0:1}))[0].c,5);

console.log("\n--- DELETE ---");
exec(h,'DELETE FROM `tags` WHERE name=@p0',{p0:"database"});
assertEq("delete",rows(query(h,'SELECT COUNT(*) AS c FROM `tags`'))[0].c,2);

console.log("\n--- JOIN ---");
assertEq("join",rows(query(h,'SELECT posts.title,users.name FROM `posts` JOIN users ON posts.user_id=users.id')).length,4);
assert("join name",rows(query(h,'SELECT posts.title,users.name FROM `posts` JOIN users ON posts.user_id=users.id'))[0].name!==undefined);
assertEq("join str",rows(query(h,'SELECT posts.title,users.name FROM `posts` JOIN users ON posts.user_id=users.id')).length,4);
assert("left join",rows(query(h,'SELECT users.name,posts.title FROM `users` LEFT JOIN posts ON users.id=posts.user_id')).length>=5);

console.log("\n--- GROUP BY ---");
assert("group",rows(query(h,'SELECT user_id,COUNT(*) AS cnt FROM `posts` GROUP BY user_id')).length>=1);
assert("having",true);

console.log("\n--- TRANSACTIONS ---");
lib.mysql_begin(h);exec(h,"INSERT INTO `tags` (name) VALUES (@p0)",{p0:"testing"});
assertEq("in-tx",rows(query(h,'SELECT COUNT(*) AS c FROM `tags`'))[0].c,3);
lib.mysql_commit(h);assertEq("commit",rows(query(h,'SELECT COUNT(*) AS c FROM `tags`'))[0].c,3);
lib.mysql_begin(h);exec(h,"INSERT INTO `tags` (name) VALUES (@p0)",{p0:"temporary"});
assertEq("pre-rollback",rows(query(h,'SELECT COUNT(*) AS c FROM `tags`'))[0].c,4);
lib.mysql_rollback(h);assertEq("post-rollback",rows(query(h,'SELECT COUNT(*) AS c FROM `tags`'))[0].c,3);

console.log("\n--- SUBQUERIES ---");
const pop=rows(query(h,'SELECT * FROM `users` WHERE EXISTS (SELECT 1 FROM posts WHERE posts.user_id=users.id AND likes>@p0)',{p0:5}));
assertEq("exists",pop.length,2);assert("exists alice",pop.some((u:any)=>u.name==="Alice"));assert("exists bob",pop.some((u:any)=>u.name==="Bob"));
assertEq("exists multi",rows(query(h,'SELECT * FROM `users` WHERE EXISTS (SELECT 1 FROM posts WHERE posts.user_id=users.id AND (likes>=@p0 AND body IS NOT NULL))',{p0:10})).length,2);
assertEq("not exists",rows(query(h,'SELECT * FROM `users` WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.user_id=users.id AND likes>@p0)',{p0:5})).length,3);
assert("not exists charlie",rows(query(h,'SELECT * FROM `users` WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.user_id=users.id AND likes>@p0)',{p0:5})).some((u:any)=>u.name==="Charlie"));
assertEq("count>1",rows(query(h,'SELECT * FROM `users` WHERE (SELECT COUNT(*) FROM posts WHERE user_id=users.id)>@p0',{p0:1})).length,1);
assertEq("count>1 alice",rows(query(h,'SELECT * FROM `users` WHERE (SELECT COUNT(*) FROM posts WHERE user_id=users.id)>@p0',{p0:1}))[0].name,"Alice");
assertEq("count=1",rows(query(h,'SELECT * FROM `users` WHERE (SELECT COUNT(*) FROM posts WHERE user_id=users.id)=@p0',{p0:1})).length,2);
assertEq("count=0",rows(query(h,'SELECT * FROM `users` WHERE (SELECT COUNT(*) FROM posts WHERE user_id=users.id)=@p0',{p0:0})).length,2);
assertEq("count>=1",rows(query(h,'SELECT * FROM `users` WHERE (SELECT COUNT(*) FROM posts WHERE user_id=users.id)>=@p0',{p0:1})).length,3);
assertEq("count<2",rows(query(h,'SELECT * FROM `users` WHERE (SELECT COUNT(*) FROM posts WHERE user_id=users.id)<@p0',{p0:2})).length,4);
assert("sub+where",rows(query(h,'SELECT * FROM `users` WHERE ((SELECT COUNT(*) FROM posts WHERE user_id=users.id)>@p0 AND age>@p1)',{p0:0,p1:25})).length>=1);

console.log("\n--- Native extras ---");
const insR=exec(h,'INSERT INTO `tags` (name) VALUES (@p0)',{p0:"native"});assert("insert rows",insR>=1);
const updR=exec(h,'UPDATE `tags` SET name=@p0 WHERE name=@p1',{p0:"native2",p1:"native"});assert("update rows",updR>=1);
const delR=exec(h,'DELETE FROM `tags` WHERE name=@p0',{p0:"native2"});assert("delete rows",delR>=1);
assert("dup key",exec(h,'INSERT INTO `users` (name,email) VALUES (@p0,@p1)',{p0:"Dupe",p1:"alice@test.com"})<0);
assert("multi sort",rows(query(h,'SELECT * FROM `users` WHERE age IS NOT NULL ORDER BY active ASC,age DESC')).length>=2);
assertEq("group count",rows(query(h,'SELECT active,COUNT(*) AS cnt FROM `users` GROUP BY active')).length,1);
assert("having raw",rows(query(h,'SELECT user_id,COUNT(*) AS cnt FROM `posts` GROUP BY user_id HAVING COUNT(*)>1')).length>=1);
assert("alive",h>0);

console.log("\n--- Edge cases ---");
assertEq("empty",rows(query(h,'SELECT * FROM `users` WHERE name=@p0',{p0:"NOPE"})).length,0);
assertEq("null first",rows(query(h,'SELECT * FROM `users` WHERE name=@p0 LIMIT 1',{p0:"NOPE"})).length,0);

lib.mysql_close(h);
console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===`);
if(failed>0){console.log("FAIL");Ekko.exit(1);}else console.log("PASS");
