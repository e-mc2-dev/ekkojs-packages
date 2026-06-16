# EkkoJS packages

Source for the official EkkoJS packages, published to the [Bifrost registry](https://bifrost.ekkojs.com).
Each package lives under its real scope:

## `@ekko/*`
- **react** — React 19 for EkkoJS.
- **react-dom** — server-render and hydrate React on EkkoJS.
- **asgard** — the official UI component library ([asgard.ekkojs.com](https://asgard.ekkojs.com)).
- **mysql** — connect to MySQL / MariaDB, run queries and transactions.
- **postgres** — connect to PostgreSQL, run queries and transactions.
- **mssql** — connect to Microsoft SQL Server, run queries and transactions.
- **mongodb** — query collections, manage documents, run aggregations.

## `@ekkojs/*`
- **smtp-dev** — a local email server + webmail for testing the mail your app sends.

## Install

```bash
ekko add @ekko/postgres        # or any package above
```

Prebuilt native binaries and packed `.ekl` archives are not committed here (see `.gitignore`); the
database drivers carry their native source under `dotnet/`. Learn more at [ekkojs.com](https://ekkojs.com).
