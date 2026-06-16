// The single shared mailbox + SMTP controller. Imported by server.tsx (to boot the SMTP server) and by the
// API handlers (to query/mutate mail and control the server). The module cache makes this a singleton, so
// the SMTP server instance and the :memory: DB are the same everywhere.
import { db, Messages, Attachments, getSetting, setSetting } from "./db";
import { SmtpServer, deliverLocal } from "./smtp";
import type { CaughtMessage } from "./smtp";
import { parseMessage, bytesToBase64 } from "./mime";

// Local unique-id generator (avoids needing the crypto permission for a throwaway dev mailbox).
let _uidSeq = 0;
function uid(): string {
  _uidSeq = (_uidSeq + 1) % 0xffffff;
  return Date.now().toString(36) + "-" + _uidSeq.toString(36) + "-" + Math.floor(Math.random() * 0xffffff).toString(36);
}

function rawToString(bytes: Uint8Array): string {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)) as any);
  }
  return s;
}

  // ── ingest a caught message ──
export function storeCaught(msg: CaughtMessage): void {
  const p   = parseMessage(msg.raw);
  const id  = uid();
  const now = Math.floor(Date.now() / 1000);
  db.from(Messages).insert({
    id,
    envelope_from: msg.envelopeFrom,
    envelope_to  : JSON.stringify(msg.recipients),
    from_addr    : p.from || msg.envelopeFrom,
    to_addrs     : JSON.stringify(p.to.length ? p.to : msg.recipients),
    cc_addrs     : JSON.stringify(p.cc),
    subject      : p.subject,
    date_received: now,
    size         : msg.raw.length,
    seen         : 0,
    text_body    : p.text,
    html_body    : p.html,
    has_html     : p.html ? 1                                         : 0,
    attach_count : p.attachments.length,
    raw          : rawToString(msg.raw),
  }).exec();
  for (const a of p.attachments) {
    db.from(Attachments).insert({
      id          : uid(),
      message_id  : id,
      filename    : a.filename,
      content_type: a.contentType,
      size        : a.bytes.length,
      inline      : a.inline ? 1          : 0,
      content_id  : a.contentId,
      content_b64 : bytesToBase64(a.bytes),
    }).exec();
  }
}

// ── queries ──
export function listMessages(): any[] {
  return db.from(Messages)
    .select("id", "from_addr", "envelope_to", "subject", "date_received", "size", "seen", "attach_count", "has_html")
    .orderByDesc("date_received").toArray();
}
export function getMessage(id: string): any | null {
  const m = db.from(Messages).where({ id }).first();
  if (!m) return null;
  const attachments = db.from(Attachments).where({ message_id: id })
    .select("id", "filename", "content_type", "size", "inline", "content_id").toArray();
  return { ...m, attachments };
}
export function getAttachment(id: string): any | null {
  return db.from(Attachments).where({ id }).first();
}
export function markRead(id: string): void {
  db.from(Messages).where({ id }).update({ seen: 1 }).exec();
}
export function deleteMessage(id: string): void {
  db.from(Attachments).where({ message_id: id }).delete().exec();
  db.from(Messages).where({ id }).delete().exec();
}
export function clearAll(): void {
  db.from(Attachments).delete().exec();
  db.from(Messages).delete().exec();
}
export function counts(): { total: number; unread: number } {
  return {
    total: db.from(Messages).count(),
    unread: db.from(Messages).where({ seen: 0 }).count(),
  };
}

// ── compose / send (delivered through the local catch-all, exercising the real SMTP path) ──
export interface OutAttachment { filename: string; contentType: string; b64: string; }
export async function sendMessage(opts: {
  from: string; to: string; subject: string; text?: string; html?: string; attachments?: OutAttachment[];
}): Promise<void> {
  const recipients = opts.to.split(",").map((s) => s.trim()).filter(Boolean);
  const date = new Date().toUTCString();
  const atts = opts.attachments || [];
  let raw: string;
  const headBase =
    `From: ${opts.from}\r\nTo: ${opts.to}\r\nSubject: ${opts.subject}\r\n` +
    `Date: ${date}\r\nMIME-Version: 1.0\r\n`;

  if (atts.length === 0 && !opts.html) {
    raw = headBase + `Content-Type: text/plain; charset=utf-8\r\n\r\n${opts.text || ""}`;
  } else {
    const boundary = "ekkosmtp" + uid().replace(/-/g, "");
    let body = `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    if (opts.html) {
      body += `--${boundary}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${opts.html}\r\n`;
    }
    if (opts.text || !opts.html) {
      body += `--${boundary}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${opts.text || ""}\r\n`;
    }
    for (const a of atts) {
      body += `--${boundary}\r\nContent-Type: ${a.contentType}; name="${a.filename}"\r\n` +
        `Content-Disposition: attachment; filename="${a.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
        `${a.b64}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    raw = headBase + body;
  }

  const fromAddr = (/<([^>]*)>/.exec(opts.from)?.[1]) || opts.from.trim();
  await deliverLocal(smtp.current().host, smtp.current().port, fromAddr, recipients, raw);
}

// ── SMTP server controller (settings page drives this) ──
export const smtp = new SmtpServer(storeCaught);

export function startSmtp(): { ok: boolean; error?: string } {
  try {
    const host = getSetting("smtp_host") || "0.0.0.0";
    const port = parseInt(getSetting("smtp_port") || "1025", 10);
    smtp.start(host, port, getSetting("banner"));
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
export function stopSmtp(): void { smtp.stop(); }
export function restartSmtp(port?: number): { ok: boolean; error?: string } {
  if (port && port > 0) setSetting("smtp_port", String(port));
  stopSmtp();
  return startSmtp();
}
export function smtpStatus() {
  const cur = smtp.current();
  return {
    running: smtp.isRunning(),
    host: cur.host,
    port: cur.port,
    received: smtp.received,
    ssl: getSetting("smtp_ssl") === "1",
    sslAvailable: false, // pending runtime task 279 (TLS on raw TCP listener)
  };
}
