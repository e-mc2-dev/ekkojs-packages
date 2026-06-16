import { SqlDialect, Connection, Transaction, registerDriver } from "ekko:db/orm";
import { PgClient, PgClientTransaction } from "./db.ts";

class PgDialect extends SqlDialect {
  constructor() { super("postgres"); }

  // param() (boolean→0/1, @-prefix) is inherited from SqlDialect.

  quote(id: string) { return '"' + id + '"'; }
  autoIncrement() { return "SERIAL"; }
  returning(fields: string[]) { return "RETURNING " + fields.join(", "); }

  columnType(t: string) {
    if (t === "INT") return "INTEGER";
    if (t === "DOUBLE") return "DOUBLE PRECISION";
    if (t === "BLOB") return "BYTEA";
    if (t === "BOOL") return "BOOLEAN";
    return t;
  }

  compileCreateTable(schema: any) {
    const cols: string[] = [];
    for (const k in schema._columns) {
      if (!schema._columns.hasOwnProperty(k)) continue;
      const c = schema._columns[k];
      let s: string;
      if (c.autoIncrement) {
        s = this.quote(k) + " SERIAL";
      } else {
        s = this.quote(k) + " " + this.columnType(c.type);
      }
      if (c.primaryKey) s += " PRIMARY KEY";
      if (c.unique) s += " UNIQUE";
      if (!c.nullable && !c.primaryKey) s += " NOT NULL";
      if (c.default !== undefined) {
        let def = c.default;
        if (typeof def === "boolean") def = def ? 1 : 0;
        s += " DEFAULT " + (typeof def === "string" ? "'" + def + "'" : def);
      }
      cols.push(s);
    }
    if (schema._compositePrimaryKey) cols.push("PRIMARY KEY (" + schema._compositePrimaryKey.join(", ") + ")");
    return "CREATE TABLE IF NOT EXISTS " + this.quote(schema._name) + " (" + cols.join(", ") + ")";
  }

  compileFulltextIndex(schema: any, ix: any) {
    const cols = ix.columns.map((c: string) => this.quote(c)).join(" || ' ' || ");
    return `CREATE INDEX IF NOT EXISTS ${this.quote(ix.name)} ON ${this.quote(schema._name)} USING GIN (to_tsvector('english', ${cols}))`;
  }
}

class PgConnection extends Connection {
  _client: PgClient;

  constructor(config: any) {
    super(new PgDialect());
    this._client = new PgClient(config);
  }

  execute(q: string, params?: any) { return this._client.exec(q, params); }
  query(q: string, params?: any) { return this._client.query(q, params); }

  beginTransaction() {
    const tx = this._client.beginTransaction();
    return new PgOrmTransaction(tx, this.dialect);
  }

  close() { this._client.close(); }
}

class PgOrmTransaction extends Transaction {
  _tx: PgClientTransaction;

  constructor(tx: PgClientTransaction, dialect: any) {
    super(dialect);
    this._tx = tx;
  }

  execute(q: string, params?: any) { return this._tx.exec(q, params); }
  query(q: string, params?: any) { return this._tx.query(q, params); }
  commit() { this._tx.commit(); }
  rollback() { this._tx.rollback(); }
}

export function register() {
  registerDriver("postgres", (config: any) => new PgConnection(config));
}

export { PgDialect, PgConnection, PgOrmTransaction as PgTransaction };
