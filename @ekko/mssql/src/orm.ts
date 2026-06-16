import { SqlDialect, Connection, Transaction, registerDriver } from "ekko:db/orm";
import { MssqlClient, MssqlClientTransaction } from "./db.ts";

class MssqlDialect extends SqlDialect {
  constructor() { super("mssql"); }

  // param() (boolean→0/1, @-prefix) is inherited from SqlDialect.

  quote(id: string) { return '[' + id + ']'; }
  autoIncrement() { return "IDENTITY(1,1)"; }

  columnType(t: string) {
    if (t === "TEXT") return "NVARCHAR(255)";
    if (t === "BLOB") return "VARBINARY(MAX)";
    if (t === "REAL") return "FLOAT";
    return t;
  }

  // MSSQL pagination: TOP for limit-only, OFFSET/FETCH otherwise. These two hooks are the
  // ONLY SELECT customization — the rest (joins, where, group/having, order, AND aggregates)
  // comes from SqlDialect, so join-aware COUNT/SUM works here too.
  compileTop(plan: any) {
    return (plan.limit != null && plan.offset == null) ? 'TOP ' + plan.limit + ' ' : '';
  }

  compileLimitOffset(plan: any) {
    if (plan.offset == null) return '';   // limit-only handled by TOP in compileTop
    const hasOrder = plan.orders && plan.orders.length;
    let s = hasOrder ? '' : ' ORDER BY (SELECT NULL)';
    s += ' OFFSET ' + plan.offset + ' ROWS';
    if (plan.limit != null) s += ' FETCH NEXT ' + plan.limit + ' ROWS ONLY';
    return s;
  }

  compileCreateTable(schema: any) {
    const cols: string[] = [];
    for (const k in schema._columns) {
      if (!schema._columns.hasOwnProperty(k)) continue;
      const c = schema._columns[k];
      let s = this.quote(k) + ' ' + this.columnType(c.type);
      if (c.autoIncrement) s += ' IDENTITY(1,1)';
      if (c.primaryKey) s += ' PRIMARY KEY';
      if (c.unique) s += ' UNIQUE';
      if (!c.nullable && !c.primaryKey && !c.autoIncrement) s += ' NOT NULL';
      if (c.default !== undefined) {
        let def = c.default;
        if (typeof def === "boolean") def = def ? 1 : 0;
        s += ' DEFAULT ' + (typeof def === "string" ? "'" + def + "'" : def);
      }
      cols.push(s);
    }
    if (schema._compositePrimaryKey) cols.push('PRIMARY KEY (' + schema._compositePrimaryKey.join(', ') + ')');
    const tn = schema._name;
    return "IF OBJECT_ID(N'" + tn + "', N'U') IS NULL CREATE TABLE " + this.quote(tn) + " (" + cols.join(", ") + ")";
  }

  compileCreateIndexes(schema: any) {
    const stmts: string[] = [];
    for (let i = 0; i < schema._indexes.length; i++) {
      const ix = schema._indexes[i];
      if (ix._fulltext) continue;
      const name = ix._name || ('idx_' + schema._name + '_' + ix.columns.join('_'));
      const unique = ix._unique ? 'UNIQUE ' : '';
      const colList = ix.columns.map((c: string) => c + (ix._desc ? ' DESC' : '')).join(', ');
      stmts.push("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'" + name + "' AND object_id=OBJECT_ID(N'" + schema._name + "')) CREATE " + unique + "INDEX " + name + " ON " + schema._name + " (" + colList + ")");
    }
    return stmts;
  }
}

class MssqlConnection extends Connection {
  _client: MssqlClient;

  constructor(config: any) {
    super(new MssqlDialect());
    this._client = new MssqlClient(config);
  }

  execute(q: string, params?: any) { return this._client.exec(q, params); }
  query(q: string, params?: any) { return this._client.query(q, params); }

  beginTransaction() {
    const tx = this._client.beginTransaction();
    return new MssqlOrmTransaction(tx, this.dialect);
  }

  close() { this._client.close(); }
}

class MssqlOrmTransaction extends Transaction {
  _tx: MssqlClientTransaction;

  constructor(tx: MssqlClientTransaction, dialect: any) {
    super(dialect);
    this._tx = tx;
  }

  execute(q: string, params?: any) { return this._tx.exec(q, params); }
  query(q: string, params?: any) { return this._tx.query(q, params); }
  commit() { this._tx.commit(); }
  rollback() { this._tx.rollback(); }
}

export function register() {
  registerDriver("mssql", (config: any) => new MssqlConnection(config));
}

export { MssqlDialect, MssqlConnection, MssqlOrmTransaction as MssqlTransaction };
