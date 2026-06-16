// In-memory store for smtp-dev. Everything lives in SQLite :memory: — when the process dies, all mail
// and settings vanish. No disk, no persistence (by design — this is a throwaway dev mailbox).
import { Database } from "ekko:db";
import { connect, defineTable, col, idx } from "ekko:db/orm";

// One caught message. `envelope_*` are the SMTP-level MAIL FROM / RCPT TO (what the client actually sent);
// `from_addr`/`to_addrs` are parsed from the message headers (what a human sees). `raw` keeps the full
// wire message for the "view source" pane. `text_body`/`html_body` are the decoded MIME bodies.
export const Messages = defineTable("messages", {
  id:            col.text().primaryKey(),       // uuid
  envelope_from: col.text().default(""),
  envelope_to:   col.text().default("[]"),      // JSON array of RCPT TO addresses
  from_addr:     col.text().default(""),
  to_addrs:      col.text().default("[]"),      // JSON array (header To)
  cc_addrs:      col.text().default("[]"),      // JSON array (header Cc)
  subject:       col.text().default("(no subject)"),
  date_received: col.int().default(0),          // epoch seconds (server receive time)
  size:          col.int().default(0),          // raw byte size
  seen:          col.int().default(0),          // 0 = unread, 1 = read
  text_body:     col.text().default(""),
  html_body:     col.text().default(""),
  snippet:       col.text().default(""),        // short preview line for the inbox list
  has_html:      col.int().default(0),
  attach_count:  col.int().default(0),
  raw:           col.text().default(""),        // full RFC822 wire message
}, { indexes: [idx("date_received")] });

// One decoded attachment. `content_b64` is the raw bytes base64-encoded (so the API can stream it back).
export const Attachments = defineTable("attachments", {
  id:           col.text().primaryKey(),        // uuid
  message_id:   col.text(),
  filename:     col.text().default("attachment"),
  content_type: col.text().default("application/octet-stream"),
  size:         col.int().default(0),
  inline:       col.int().default(0),           // 1 = inline (cid), 0 = attachment
  content_id:   col.text().default(""),         // Content-ID for inline images
  content_b64:  col.text().default(""),
}, { indexes: [idx("message_id")] });

// Runtime settings (smtp port, ssl on/off, etc.). Seeded with defaults on boot.
export const Settings = defineTable("settings", {
  key:   col.text().primaryKey(),
  value: col.text().default(""),
});

const rawDb = Database(":memory:");
export const db = connect(rawDb);

[Messages, Attachments, Settings].forEach((s) => db.createTable(s));

// ── Default settings (only seeded if absent). Ports/host are env-overridable so the published app can be
// configured at launch: `SMTP_PORT=2525 PORT=8080 ekko run @ekkojs/smtp-dev`. ──
const envGet = (k: string): string | undefined => (typeof Ekko !== "undefined" ? Ekko.env.get(k) : undefined);
export const DEFAULTS: Record<string, string> = {
  smtp_host: envGet("SMTP_HOST") || "0.0.0.0",
  smtp_port: envGet("SMTP_PORT") || "1025",
  smtp_ssl: "0",        // implicit TLS on the SMTP port (needs runtime TLS listener, task 279)
  web_port: envGet("PORT") || "1080",     // webmail UI port
  banner: "ekko smtp-dev",
};

export function seedSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!db.from("settings").where({ key }).exists()) {
      db.from("settings").insert({ key, value }).exec();
    }
  }
}

export function getSetting(key: string): string {
  const row = db.from("settings").where({ key }).select("value").first();
  return row ? row.value : (DEFAULTS[key] ?? "");
}

export function setSetting(key: string, value: string) {
  if (db.from("settings").where({ key }).exists()) {
    db.from("settings").where({ key }).update({ value }).exec();
  } else {
    db.from("settings").insert({ key, value }).exec();
  }
}

seedSettings();
