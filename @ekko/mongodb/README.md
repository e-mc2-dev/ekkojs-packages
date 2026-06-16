# @ekko/mongodb

Work with MongoDB from your EkkoJS app. Connect to a database, query and update collections, and run
aggregations. If you'd rather work with models, it plugs into `ekko:orm`.

## Install

```bash
ekko add @ekko/mongodb
```

## Connect and use a collection

```ts
import { MongoClient } from "@ekko/mongodb";

const client = new MongoClient("mongodb://localhost:27017");
const users = client.db("app").collection("users");

const { insertedId } = users.insertOne({ name: "Ada", active: true });

const active = users.find({ active: true }, { sort: { name: 1 }, limit: 20 });
const one = users.findOne({ _id: insertedId });

users.updateOne({ _id: insertedId }, { $set: { active: false } });
users.deleteOne({ _id: insertedId });

client.close();
```

## Aggregations

```ts
const byStatus = users.aggregate([
  { $group: { _id: "$active", count: { $sum: 1 } } },
]);
```

Filters, updates, and pipelines use the MongoDB operators you already know (`$set`, `$group`,
`$match`, …). `insertOne` returns the new `insertedId`; `find` returns an array of documents.

## Prefer models?

Register the dialect once and use [`ekko:orm`](https://ekkojs.com/docs/api/orm) over your collections:

```ts
import { register } from "@ekko/mongodb";
register();
```

## Notes

Works on Linux, macOS, and Windows. Run with `--allow=net` (add `--allow=env` if your connection
string comes from an environment variable).
