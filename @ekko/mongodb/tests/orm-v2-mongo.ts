// ORM v2 parity test — MongoDB
// Run: ekko run --allow=fs,ffi:unsafe,net,env ekko-lib/mongodb/tests/orm-v2-mongo.ts
// Requires: docker run -d --name ekko-mongo-test -p 27018:27017 mongo:7 --replSet rs0
//           docker exec ekko-mongo-test mongosh --eval "rs.initiate()"
//
// Exercises the REAL driver from ../src/orm.ts (single implementation — no inline adapter).
// The driver's native binding is normally native:self; the test injects an explicit-path
// lib via config.lib because native:self does not resolve when a test file is run directly.

import { connect, registerDriver } from "ekko:db/orm";
import { dlopen, types } from "ekko:ffi";
import { MongoConnection } from "../src/orm.ts";
import { runOrmTests } from "../../postgres/tests/orm-v2-tests.ts";

const platform = Ekko.platform === "win32" ? "windows-x64" : Ekko.platform === "darwin" ? "macos-arm64" : "linux-x64";
const prefix = Ekko.platform === "win32" ? "" : "lib";
const ext = Ekko.platform === "win32" ? "dll" : Ekko.platform === "darwin" ? "dylib" : "so";
const nativePath = `ekko-lib/mongodb/native/${platform}/${prefix}ekko_mongodb.${ext}`;

const lib = dlopen(nativePath, {
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
});

// Register the real driver, injecting the explicit-path native lib for the test environment.
registerDriver("mongodb", (config: any) => new MongoConnection({ ...config, lib }));

const db = connect("mongodb", {
  host: Ekko.env.get("MONGO_HOST") || "localhost",
  port: parseInt(Ekko.env.get("MONGO_PORT") || "27018"),
  database: Ekko.env.get("MONGO_DB") || "ekko_test",
});

// Clean up from previous runs
try { db.exec(JSON.stringify({ type: "drop", collection: "posts" })); } catch {}
try { db.exec(JSON.stringify({ type: "drop", collection: "tags" })); } catch {}
try { db.exec(JSON.stringify({ type: "drop", collection: "users" })); } catch {}

runOrmTests(db, "mongodb");
