# @ekko/mysql

Talk to MySQL or MariaDB from your EkkoJS app. Open a connection, run queries and transactions, and
read results back as plain objects. If you'd rather work with models than write SQL, it plugs into
`ekko:orm`.

## Install

```bash
ekko add @ekko/mysql
```

## Connect and query

```ts
import { MysqlClient } from "@ekko/mysql";

const db = new MysqlClient({
  host: "localhost",
  port: 3306,
  database: "app",
  user: "root",
  password: "secret",
});

const { rows } = db.query(
  "SELECT id, name FROM users WHERE active = @active",
  { active: 1 },
);
for (const u of rows) console.log(u.id, u.name);

db.close();
```

Parameters are named (`@active`) and always sent separately from the SQL, so values from your users
are never glued into the query string. `query` gives you `{ columns, rows }`; `exec` (for
inserts/updates/deletes) gives you `{ affectedRows }`.

## Transactions

```ts
const tx = db.beginTransaction();
try {
  tx.exec("INSERT INTO orders (user_id, total) VALUES (@u, @t)", { u: 1, t: 4200 });
  tx.exec("UPDATE users SET orders = orders + 1 WHERE id = @u", { u: 1 });
  tx.commit();
} catch (e) {
  tx.rollback();
  throw e;
}
```

## Prefer models over SQL?

Register the dialect once and use the [`ekko:orm`](https://ekkojs.com/docs/api/orm) query builder and
entities against the same database:

```ts
import { register } from "@ekko/mysql";
register();
```

## Notes

Works on Linux, macOS, and Windows. Run with `--allow=net` (add `--allow=env` if your connection
details come from environment variables).
