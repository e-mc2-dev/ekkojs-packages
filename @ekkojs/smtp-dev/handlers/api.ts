// HTTP/JSON API for the webmail SPA: list/read/delete mail, download attachments, send, and control the
// SMTP server. All data comes from the shared in-memory store.
import * as store from "../store";
import { getSetting, setSetting } from "../db";
import { base64 } from "ekko:text/encoding";

function parseQuery(raw: string): Record<string, string> {
  const out: Record<string, string> = Object.create(null);
  const q = (raw || "").replace(/^\?/, "");
  for (const pair of q.split("&")) {
    if (!pair) continue;
    const i = pair.indexOf("=");
    const k = i < 0 ? pair : pair.slice(0, i);
    const v = i < 0 ? "" : pair.slice(i + 1);
    try { out[decodeURIComponent(k)] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
}
const jarr = (s: string) => { try { return JSON.parse(s || "[]"); } catch { return []; } };

export function listMessagesHandler(_req: any, res: any) {
  const messages = store.listMessages().map((m: any) => ({ ...m, envelope_to: jarr(m.envelope_to) }));
  res.json({ messages, counts: store.counts() });
}

export function getMessageHandler(req: any, res: any) {
  const m = store.getMessage(req.params.id);
  if (!m) return res.status(404).json({ error: "Message not found" });
  store.markRead(req.params.id);
  res.json({
    ...m,
    envelope_to: jarr(m.envelope_to),
    to_addrs: jarr(m.to_addrs),
    cc_addrs: jarr(m.cc_addrs),
  });
}

export function deleteMessageHandler(req: any, res: any) {
  store.deleteMessage(req.params.id);
  res.json({ ok: true });
}

export function clearAllHandler(_req: any, res: any) {
  store.clearAll();
  res.json({ ok: true });
}

export function downloadAttachmentHandler(req: any, res: any) {
  const a = store.getAttachment(req.params.id);
  if (!a) return res.status(404).json({ error: "Attachment not found" });
  let bytes: Uint8Array;
  try { bytes = base64.decode(a.content_b64 || ""); } catch { bytes = new Uint8Array(0); }
  res.header("Content-Type", a.content_type || "application/octet-stream");
  const dl = parseQuery(req.query || "").dl === "1";
  const disp = a.inline && !dl ? "inline" : "attachment";
  res.header("Content-Disposition", `${disp}; filename="${a.filename}"`);
  res.send(bytes);
}

export async function sendHandler(req: any, res: any) {
  const body = req.json() || {};
  if (!body.from || !body.to) return res.status(400).json({ error: "from and to are required" });
  try {
    await store.sendMessage({
      from: body.from, to: body.to, subject: body.subject || "(no subject)",
      text: body.text, html: body.html, attachments: body.attachments || [],
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Send failed: " + String(e) });
  }
}

export function statusHandler(_req: any, res: any) { res.json(store.smtpStatus()); }

export function controlHandler(req: any, res: any) {
  const body = req.json() || {};
  switch (body.action) {
    case "stop": store.stopSmtp(); break;
    case "start": { const r = store.startSmtp(); if (!r.ok) return res.status(500).json(r); break; }
    case "restart": { const r = store.restartSmtp(body.port ? parseInt(String(body.port), 10) : undefined); if (!r.ok) return res.status(500).json(r); break; }
    default: return res.status(400).json({ error: "unknown action" });
  }
  res.json(store.smtpStatus());
}

export function getSettingsHandler(_req: any, res: any) {
  res.json({
    smtp_host: getSetting("smtp_host"),
    smtp_port: getSetting("smtp_port"),
    smtp_ssl: getSetting("smtp_ssl"),
    web_port: getSetting("web_port"),
    banner: getSetting("banner"),
    status: store.smtpStatus(),
  });
}

export function setSettingsHandler(req: any, res: any) {
  const body = req.json() || {};
  for (const k of ["smtp_host", "smtp_port", "smtp_ssl", "banner"]) {
    if (body[k] !== undefined) setSetting(k, String(body[k]));
  }
  res.json({ ok: true });
}
