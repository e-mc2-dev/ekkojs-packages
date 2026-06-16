// ORM v2 parity test — PostgreSQL
// Run: ekko run --allow=fs,ffi,net,env ekko-lib/postgres/tests/orm-v2-postgres.ts
// Requires: docker run -d --name ekko-pg-test -e POSTGRES_USER=ekko -e POSTGRES_PASSWORD=ekko -e POSTGRES_DB=ekko_test -p 5433:5432 postgres:17-alpine
//
// Exercises the REAL production driver from ../src/orm.ts (single implementation — no inline
// adapter). The driver's native binding is native:self, which resolves to @ekko/postgres's lib
// because this test lives inside the package (workspace discovery → postgres owns the caller).

import { connect } from "ekko:db/orm";
import { register } from "../src/orm.ts";
import { runOrmTests } from "./orm-v2-tests.ts";

register();

const db = connect("postgres", {
  host: Ekko.env.get("PG_HOST") || "localhost",
  port: parseInt(Ekko.env.get("PG_PORT") || "5433"),
  database: Ekko.env.get("PG_DB") || "ekko_test",
  user: Ekko.env.get("PG_USER") || "ekko",
  password: Ekko.env.get("PG_PASS") || "ekko",
});

// Clean up from previous runs
try { db.exec("DROP TABLE IF EXISTS posts"); } catch {}
try { db.exec("DROP TABLE IF EXISTS tags"); } catch {}
try { db.exec("DROP TABLE IF EXISTS users"); } catch {}

runOrmTests(db, "postgres");
