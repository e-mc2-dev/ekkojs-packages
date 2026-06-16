// ORM v2 parity test — SQL Server
// Run: ekko run --allow=fs,ffi,net,env ekko-lib/mssql/tests/orm-v2-mssql.ts
// Requires: docker run -d --name ekko-mssql-test -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD=Ekko123! -p 1434:1433 mcr.microsoft.com/mssql/server:2022-latest
//
// Exercises the REAL production driver from ../src/orm.ts (single implementation — no inline
// adapter). The driver's native binding is native:self, which resolves to @ekko/mssql's lib
// because this test lives inside the package (workspace discovery → mssql owns the caller).

import { connect } from "ekko:db/orm";
import { register } from "../src/orm.ts";
import { runOrmTests } from "../../postgres/tests/orm-v2-tests.ts";

register();

const db = connect("mssql", {
  host: Ekko.env.get("MSSQL_HOST") || "localhost",
  port: parseInt(Ekko.env.get("MSSQL_PORT") || "1434"),
  database: Ekko.env.get("MSSQL_DB") || "ekko_test",
  user: Ekko.env.get("MSSQL_USER") || "sa",
  password: Ekko.env.get("MSSQL_PASS") || "Ekko123!",
});

// Clean up from previous runs
try { db.exec("DROP TABLE IF EXISTS posts"); } catch {}
try { db.exec("DROP TABLE IF EXISTS tags"); } catch {}
try { db.exec("DROP TABLE IF EXISTS users"); } catch {}

runOrmTests(db, "mssql");
