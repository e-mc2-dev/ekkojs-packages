import { dlopen, types } from "ekko:ffi";

const lib = dlopen("native:self", {
  mssql_connect:  { args: [types.buffer, types.i32], returns: types.i32 },
  mssql_query:    { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mssql_exec:     { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mssql_begin:    { args: [types.i32], returns: types.i32 },
  mssql_commit:   { args: [types.i32], returns: types.i32 },
  mssql_rollback: { args: [types.i32], returns: types.i32 },
  mssql_close:    { args: [types.i32], returns: types.void },
});

function toBuffer(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function callQuery(handle: number, sql: string, params: any): any {
  const sqlBuf = toBuffer(sql);
  const paramsBuf = toBuffer(JSON.stringify(params || {}));
  const json = lib.mssql_query(handle, sqlBuf, sqlBuf.length, paramsBuf, paramsBuf.length) as string;
  if (!json) return { columns: [], rows: [] };
  const parsed = JSON.parse(json);
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}

export function callExec(handle: number, sql: string, params: any): number {
  const sqlBuf = toBuffer(sql);
  const paramsBuf = toBuffer(JSON.stringify(params || {}));
  return lib.mssql_exec(handle, sqlBuf, sqlBuf.length, paramsBuf, paramsBuf.length) as number;
}

export class MssqlClient {
  _handle: number;

  constructor(config: any) {
    const parts: string[] = [];
    if (config.host) parts.push("Server=" + config.host + (config.port ? "," + config.port : ""));
    if (config.database) parts.push("Database=" + config.database);
    if (config.user) parts.push("User Id=" + config.user);
    if (config.password) parts.push("Password=" + config.password);
    parts.push("TrustServerCertificate=True");
    parts.push("Pooling=true");
    const buf = toBuffer(parts.join(";"));
    this._handle = lib.mssql_connect(buf, buf.length) as number;
    if (this._handle <= 0) throw new Error("SQL Server connection failed");
  }

  exec(sql: string, params?: any): { affectedRows: number } {
    const r = callExec(this._handle, sql, params);
    return { affectedRows: r >= 0 ? r : 0 };
  }

  query(sql: string, params?: any): any {
    return callQuery(this._handle, sql, params);
  }

  beginTransaction(): MssqlClientTransaction {
    const r = lib.mssql_begin(this._handle) as number;
    if (r < 0) throw new Error("Failed to begin transaction");
    return new MssqlClientTransaction(this._handle);
  }

  close() { lib.mssql_close(this._handle); }
}

export class MssqlClientTransaction {
  _handle: number;
  _done: boolean;

  constructor(handle: number) { this._handle = handle; this._done = false; }

  exec(sql: string, params?: any): { affectedRows: number } {
    if (this._done) throw new Error("Transaction already ended");
    return { affectedRows: Math.max(0, callExec(this._handle, sql, params)) };
  }

  query(sql: string, params?: any): any {
    if (this._done) throw new Error("Transaction already ended");
    return callQuery(this._handle, sql, params);
  }

  commit() { if (!this._done) { lib.mssql_commit(this._handle); this._done = true; } }
  rollback() { if (!this._done) { lib.mssql_rollback(this._handle); this._done = true; } }
}
