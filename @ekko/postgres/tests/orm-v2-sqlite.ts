// ORM v2 parity test — SQLite
// Run: ekko run --allow=fs ekko-lib/postgres/tests/orm-v2-sqlite.ts

import { Database } from "ekko:db";
import { connect } from "ekko:db/orm";
import { runOrmTests } from "./orm-v2-tests.ts";

const db = connect(Database(":memory:"));
runOrmTests(db, "sqlite");
