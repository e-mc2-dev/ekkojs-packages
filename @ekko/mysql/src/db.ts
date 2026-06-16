import { dlopen, types } from "ekko:ffi";

const lib = dlopen("native:self", {
  mysql_connect:  { args: [types.buffer, types.i32], returns: types.i32 },
  mysql_query:    { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.cstring },
  mysql_exec:     { args: [types.i32, types.buffer, types.i32, types.buffer, types.i32], returns: types.i32 },
  mysql_begin:    { args: [types.i32], returns: types.i32 },
  mysql_commit:   { args: [types.i32], returns: types.i32 },
  mysql_rollback: { args: [types.i32], returns: types.i32 },
  mysql_close:    { args: [types.i32], returns: types.void },
});

function toBuffer(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function callQuery(handle: number, sql: string, params: any): any {
  const sqlBuf = toBuffer(sql);
  const paramsBuf = toBuffer(JSON.stringify(params || {}));
  const json = lib.mysql_query(handle, sqlBuf, sqlBuf.length, paramsBuf, paramsBuf.length) as string;
  if (!json) return { columns: [], rows: [] };
  const parsed = JSON.parse(json);
  if (parsed.error) throw new Error(parsed.error);
  return parsed;
}

export function callExec(handle: number, sql: string, params: any): number {
  const sqlBuf = toBuffer(sql);
  const paramsBuf = toBuffer(JSON.stringify(params || {}));
  return lib.mysql_exec(handle, sqlBuf, sqlBuf.length, paramsBuf, paramsBuf.length) as number;
}

export class MysqlClient {
  _handle: number;

  constructor(config: any) {
    const parts: string[] = [];
    if (config.host) parts.push("Server=" + config.host);
    parts.push("Port=" + (config.port || 3306));
    if (config.database) parts.push("Database=" + config.database);
    if (config.user) parts.push("User Id=" + config.user);
    if (config.password) parts.push("Password=" + config.password);
    if (config.ssl) parts.push("SslMode=Required");
    parts.push("Pooling=true");
    parts.push("TreatTinyAsBoolean=false");
    const buf = toBuffer(parts.join(";"));
    this._handle = lib.mysql_connect(buf, buf.length) as number;
    if (this._handle <= 0) throw new Error("MySQL connection failed");
  }

  exec(sql: string, params?: any): { affectedRows: number } {
    const r = callExec(this._handle, sql, params);
    return { affectedRows: r >= 0 ? r : 0 };
  }

  query(sql: string, params?: any): any {
    return callQuery(this._handle, sql, params);
  }

  beginTransaction(): MysqlClientTransaction {
    const r = lib.mysql_begin(this._handle) as number;
    if (r < 0) throw new Error("Failed to begin transaction");
    return new MysqlClientTransaction(this._handle);
  }

  close() { lib.mysql_close(this._handle); }
}

export class MysqlClientTransaction {
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

  commit() { if (!this._done) { lib.mysql_commit(this._handle); this._done = true; } }
  rollback() { if (!this._done) { lib.mysql_rollback(this._handle); this._done = true; } }
}
