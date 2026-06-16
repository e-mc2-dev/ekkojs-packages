// ORM v2 parity test — MySQL
// Run: ekko run --allow=fs,ffi,net,env ekko-lib/mysql/tests/orm-v2-mysql.ts
// Requires: docker run -d --name ekko-mysql-test -e MYSQL_ROOT_PASSWORD=ekko -e MYSQL_DATABASE=ekko_test -p 3307:3306 mysql:8
//
// Exercises the REAL production driver from ../src/orm.ts (single implementation — no inline
// adapter). The driver's native binding is native:self, which resolves to @ekko/mysql's lib
// because this test lives inside the package (workspace discovery → mysql owns the caller).

import { connect } from "ekko:db/orm";
import { register } from "../src/orm.ts";
import { runOrmTests } from "../../postgres/tests/orm-v2-tests.ts";

register();

const db = connect("mysql", {
  host: Ekko.env.get("MYSQL_HOST") || "localhost",
  port: parseInt(Ekko.env.get("MYSQL_PORT") || "3307"),
  database: Ekko.env.get("MYSQL_DB") || "ekko_test",
  user: Ekko.env.get("MYSQL_USER") || "root",
  password: Ekko.env.get("MYSQL_PASS") || "ekko",
});

// Clean up from previous runs
try { db.exec("DROP TABLE IF EXISTS posts"); } catch {}
try { db.exec("DROP TABLE IF EXISTS tags"); } catch {}
try { db.exec("DROP TABLE IF EXISTS users"); } catch {}

runOrmTests(db, "mysql");
