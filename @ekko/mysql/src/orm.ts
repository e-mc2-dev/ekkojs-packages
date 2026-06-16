import { SqlDialect, Connection, Transaction, registerDriver } from "ekko:db/orm";
import { MysqlClient, MysqlClientTransaction } from "./db.ts";

class MysqlDialect extends SqlDialect {
  constructor() { super("mysql"); }

  // param() (boolean→0/1, @-prefix) is inherited from SqlDialect.

  quote(id: string) { return '`' + id + '`'; }
  autoIncrement() { return "AUTO_INCREMENT"; }

  columnType(t: string) {
    if (t === "TEXT") return "VARCHAR(255)";
    if (t === "BOOL") return "TINYINT(1)";
    if (t === "BLOB") return "LONGBLOB";
    return t;
  }

  compileCreateTable(schema: any) {
    const cols: string[] = [];
    for (const k in schema._columns) {
      if (!schema._columns.hasOwnProperty(k)) continue;
      const c = schema._columns[k];
      let s = this.quote(k) + " " + this.columnType(c.type);
      if (c.primaryKey) s += " PRIMARY KEY";
      if (c.autoIncrement) s += " AUTO_INCREMENT";
      if (c.unique) s += " UNIQUE";
      if (!c.nullable && !c.primaryKey && !c.autoIncrement) s += " NOT NULL";
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
    const cols = ix.columns.map((c: string) => this.quote(c)).join(", ");
    return `CREATE FULLTEXT INDEX ${this.quote(ix.name)} ON ${this.quote(schema._name)} (${cols})`;
  }
}

class MysqlConnection extends Connection {
  _client: MysqlClient;

  constructor(config: any) {
    super(new MysqlDialect());
    this._client = new MysqlClient(config);
  }

  execute(q: string, params?: any) { return this._client.exec(q, params); }
  query(q: string, params?: any) { return this._client.query(q, params); }

  beginTransaction() {
    const tx = this._client.beginTransaction();
    return new MysqlOrmTransaction(tx, this.dialect);
  }

  close() { this._client.close(); }
}

class MysqlOrmTransaction extends Transaction {
  _tx: MysqlClientTransaction;

  constructor(tx: MysqlClientTransaction, dialect: any) {
    super(dialect);
    this._tx = tx;
  }

  execute(q: string, params?: any) { return this._tx.exec(q, params); }
  query(q: string, params?: any) { return this._tx.query(q, params); }
  commit() { this._tx.commit(); }
  rollback() { this._tx.rollback(); }
}

export function register() {
  registerDriver("mysql", (config: any) => new MysqlConnection(config));
}

export { MysqlDialect, MysqlConnection, MysqlOrmTransaction as MysqlTransaction };
