// A focused RFC822/MIME parser for the catch-all mailbox. Operates on the raw wire bytes and produces
// decoded header fields, text/html bodies, and attachments (base64 / quoted-printable / 7bit-8bit,
// nested multipart). It is deliberately lenient: dev mail comes from every client under the sun.
import { utf8, base64 } from "ekko:text/encoding";

export interface MailAttachment {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  inline: boolean;
  contentId: string;
}

export interface ParsedMail {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  date: string;
  text: string;
  html: string;
  attachments: MailAttachment[];
}

// ── byte/binary-string helpers (latin1: 1 char per byte, so ASCII delimiters search cleanly) ──
function bytesToBinary(b: Uint8Array): string {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < b.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + CHUNK)) as any);
  }
  return s;
}
function binaryToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}
function decodeText(bytes: Uint8Array, charset: string): string {
  const cs = (charset || "utf-8").toLowerCase();
  if (cs === "utf-8" || cs === "utf8" || cs === "us-ascii" || cs === "ascii") {
    try { return utf8.decode(bytes); } catch { /* fall through */ }
  }
  // latin1 / unknown: map bytes directly
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

// ── transfer-encoding decoders ──
function decodeBase64(data: string): Uint8Array {
  const clean = data.replace(/[^A-Za-z0-9+/=]/g, "");
  if (!clean) return new Uint8Array(0);
  try { return base64.decode(clean); } catch { return new Uint8Array(0); }
}
function decodeQP(s: string): Uint8Array {
  s = s.replace(/=\r?\n/g, ""); // soft line breaks
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "=" && i + 2 < s.length) {
      const hex = s.substr(i + 1, 2);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) { out.push(parseInt(hex, 16)); i += 2; continue; }
    }
    out.push(s.charCodeAt(i) & 0xff);
  }
  return Uint8Array.from(out);
}

// ── header parsing ──
function splitHeaderBody(bin: string): [string, string] {
  let idx = bin.indexOf("\r\n\r\n");
  let sep = 4;
  if (idx < 0) { idx = bin.indexOf("\n\n"); sep = 2; }
  if (idx < 0) return [bin, ""];
  return [bin.slice(0, idx), bin.slice(idx + sep)];
}
function parseHeaders(block: string): Record<string, string> {
  const headers: Record<string, string> = Object.create(null);
  const lines = block.split(/\r?\n/);
  let current = "";
  let key = "";
  const flush = () => { if (key) headers[key] = (headers[key] ? headers[key] + " " : "") + current.trim(); };
  for (const line of lines) {
    if (/^[ \t]/.test(line) && key) { current += " " + line.trim(); continue; } // folded continuation
    flush();
    const m = /^([!-9;-~]+):(.*)$/.exec(line); // header name then value
    if (m) { key = m[1].toLowerCase(); current = m[2]; }
    else { key = ""; current = ""; }
  }
  flush();
  return headers;
}
function getParam(headerValue: string, name: string): string {
  const re = new RegExp(name + '\\s*=\\s*"([^"]*)"', "i");
  const m = re.exec(headerValue || "");
  if (m) return m[1];
  const re2 = new RegExp(name + "\\s*=\\s*([^;\\s]+)", "i");
  const m2 = re2.exec(headerValue || "");
  return m2 ? m2[1] : "";
}

// RFC2047 encoded-words in header values: =?charset?B|Q?data?=
function decodeRFC2047(s: string): string {
  if (!s || s.indexOf("=?") < 0) return s;
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_m, charset, enc, data) => {
    const bytes = enc.toUpperCase() === "B" ? decodeBase64(data) : decodeQP(data.replace(/_/g, " "));
    return decodeText(bytes, charset);
  }).replace(/\?=\s+=\?/g, "?==?"); // join adjacent words separated by whitespace
}

function splitAddresses(v: string): string[] {
  if (!v) return [];
  return v.split(",").map((a) => decodeRFC2047(a).trim()).filter(Boolean);
}

// ── recursive part walk ──
function walkPart(bin: string, result: ParsedMail) {
  const [headerBlock, body] = splitHeaderBody(bin);
  const headers = parseHeaders(headerBlock);
  const ctRaw = headers["content-type"] || "text/plain";
  const ct = ctRaw.split(";")[0].trim().toLowerCase();
  const cte = (headers["content-transfer-encoding"] || "7bit").trim().toLowerCase();
  const disposition = (headers["content-disposition"] || "").toLowerCase();

  if (ct.startsWith("multipart/")) {
    const boundary = getParam(ctRaw, "boundary");
    if (!boundary) return;
    const delim = "--" + boundary;
    const segments = body.split(delim);
    for (let i = 1; i < segments.length; i++) {
      let seg = segments[i];
      if (seg.startsWith("--")) break;           // closing boundary "--boundary--"
      seg = seg.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
      walkPart(seg, result);
    }
    return;
  }

  // Leaf part — decode the body to bytes per transfer-encoding.
  let bytes: Uint8Array;
  if (cte === "base64") bytes = decodeBase64(body);
  else if (cte === "quoted-printable") bytes = decodeQP(body);
  else bytes = binaryToBytes(body);

  const filename = decodeRFC2047(getParam(ctRaw, "name") || getParam(disposition, "filename"));
  const isAttachment = disposition.startsWith("attachment") || (!!filename && !ct.startsWith("text/")) || (!ct.startsWith("text/") && ct !== "");

  if (isAttachment || disposition.startsWith("inline") && filename) {
    result.attachments.push({
      filename: filename || "attachment",
      contentType: ct || "application/octet-stream",
      bytes,
      inline: disposition.startsWith("inline"),
      contentId: (headers["content-id"] || "").replace(/[<>]/g, "").trim(),
    });
    return;
  }

  const charset = getParam(ctRaw, "charset") || "utf-8";
  const textVal = decodeText(bytes, charset);
  if (ct === "text/html") result.html += textVal;
  else result.text += textVal;
}

export function parseMessage(raw: Uint8Array): ParsedMail {
  const bin = bytesToBinary(raw);
  const [headerBlock] = splitHeaderBody(bin);
  const h = parseHeaders(headerBlock);
  const result: ParsedMail = {
    from: decodeRFC2047(h["from"] || ""),
    to: splitAddresses(h["to"] || ""),
    cc: splitAddresses(h["cc"] || ""),
    subject: decodeRFC2047(h["subject"] || "") || "(no subject)",
    date: h["date"] || "",
    text: "",
    html: "",
    attachments: [],
  };
  walkPart(bin, result);
  return result;
}

// Re-encode bytes to base64 for storage in the DB (text column).
export function bytesToBase64(bytes: Uint8Array): string {
  try { return base64.encode(bytes); } catch { return ""; }
}
