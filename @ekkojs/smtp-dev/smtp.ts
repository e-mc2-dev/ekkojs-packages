// Catch-all SMTP server over ekko:net raw TCP. It accepts every message from any sender to any recipient,
// NEVER relays anything, and hands the raw wire message to `onMessage`. Speaks just enough ESMTP for real
// clients (nodemailer, swaks, app frameworks): EHLO/HELO, MAIL FROM, RCPT TO, DATA → <CRLF>.<CRLF>, RSET,
// NOOP, QUIT, VRFY. Start/stop is controlled at runtime for the settings page.
import { tcp } from "ekko:net";

export interface CaughtMessage {
  envelopeFrom: string;
  recipients: string[];
  raw: Uint8Array;
}

type OnMessage = (msg: CaughtMessage) => void;

function bytesToBinary(arr: number[]): string {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < arr.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, arr.slice(i, i + CHUNK) as any);
  }
  return s;
}
function binaryToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}
function addrOf(arg: string): string {
  const m = /<([^>]*)>/.exec(arg);
  if (m) return m[1].trim();
  return arg.replace(/^[^:]*:/, "").trim();
}

export class SmtpServer {
  private handle: number | null = null;
  private host = "0.0.0.0";
  private port = 1025;
  private banner = "ekko smtp-dev";
  private onMessage: OnMessage;
  received = 0;

  constructor(onMessage: OnMessage) { this.onMessage = onMessage; }

  isRunning(): boolean { return this.handle !== null; }
  current(): { host: string; port: number } { return { host: this.host, port: this.port }; }

  start(host: string, port: number, banner?: string): void {
    if (this.handle !== null) this.stop();
    this.host = host;
    this.port = port;
    if (banner) this.banner = banner;
    this.handle = tcp.listen(host, port, (client: any) => {
      this.handleConnection(client.handle).catch((e) => {
        try { tcp.close(client.handle); } catch { /* already closed */ }
        console.error("[smtp] connection error:", String(e));
      });
    });
  }

  stop(): void {
    if (this.handle !== null) {
      try { tcp.stopServer(this.handle); } catch { /* ignore */ }
      this.handle = null;
    }
  }

  private async handleConnection(h: number): Promise<void> {
    const send = (line: string) => tcp.write(h, line + "\r\n");
    let buffer = "";
    let inData = false;
    let from = "";
    let recipients: string[] = [];
    let dataBuf = "";

    send(`220 ${this.banner} ESMTP ready`);

    const resetTxn = () => { from = ""; recipients = []; dataBuf = ""; inData = false; };

    while (true) {
      let chunk: number[];
      try { chunk = await tcp.read(h, 65536); }
      catch { break; }                          // client dropped the connection — normal, end quietly
      if (!chunk || chunk.length === 0) break; // peer closed
      buffer += bytesToBinary(chunk);

      // Keep draining the buffer: either DATA payload (until <CRLF>.<CRLF>) or whole command lines.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (inData) {
          const term = buffer.indexOf("\r\n.\r\n");
          if (term < 0) { dataBuf += buffer; buffer = ""; break; }
          dataBuf += buffer.slice(0, term);
          buffer = buffer.slice(term + 5);
          inData = false;
          // dot-unstuff: lines that began with ".." → "."
          const unstuffed = dataBuf.replace(/\r\n\.\./g, "\r\n.").replace(/^\.\./, ".");
          const raw = binaryToBytes(unstuffed);
          try { this.onMessage({ envelopeFrom: from, recipients: recipients.slice(), raw }); this.received++; }
          catch (e) { console.error("[smtp] store error:", String(e)); }
          send("250 2.0.0 Ok: message queued");
          resetTxn();
          continue;
        }

        const nl = buffer.indexOf("\r\n");
        if (nl < 0) break;
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);

        const upper = line.toUpperCase();
        const verb = upper.split(/\s+/)[0];
        const arg = line.slice(verb.length).trim();

        if (verb === "EHLO") {
          send(`250-${this.banner} greets ${arg || "you"}`);
          send("250-SIZE 52428800");
          send("250-8BITMIME");
          send("250 HELP");
        } else if (verb === "HELO") {
          send(`250 ${this.banner}`);
        } else if (verb === "MAIL") {
          from = addrOf(arg);
          send("250 2.1.0 Ok");
        } else if (verb === "RCPT") {
          recipients.push(addrOf(arg));     // catch-all: accept EVERY recipient
          send("250 2.1.5 Ok");
        } else if (verb === "DATA") {
          if (!from && recipients.length === 0) { send("503 5.5.1 Need MAIL and RCPT first"); }
          else { inData = true; dataBuf = ""; send("354 End data with <CR><LF>.<CR><LF>"); }
        } else if (verb === "RSET") {
          resetTxn();
          send("250 2.0.0 Ok");
        } else if (verb === "NOOP") {
          send("250 2.0.0 Ok");
        } else if (verb === "VRFY" || verb === "EXPN") {
          send("252 2.1.5 Cannot VRFY user, but will accept message");
        } else if (verb === "QUIT") {
          send(`221 2.0.0 ${this.banner} closing`);
          break;
        } else if (verb === "STARTTLS") {
          send("454 4.7.0 TLS not available (see runtime task 279)");
        } else if (verb === "AUTH") {
          send("235 2.7.0 Authentication accepted"); // dev catch-all: accept any auth
        } else if (verb.length === 0) {
          // ignore blank line
        } else {
          send("500 5.5.2 Command unrecognized");
        }
      }
    }
    try { tcp.close(h); } catch { /* already closed */ }
  }
}

// A tiny SMTP client used by the webmail "Compose" feature: it delivers a raw message to the local catch-all
// over a real SMTP transaction (so the send path is exercised end to end, exactly like an app would).
export async function deliverLocal(
  host: string, port: number, from: string, recipients: string[], raw: string,
): Promise<void> {
  const target = host === "0.0.0.0" ? "127.0.0.1" : host;
  const conn = await tcp.connect(target, port);
  const readLine = async (): Promise<string> => {
    const b: number[] = await tcp.read(conn, 4096);
    return bytesToBinary(b || []);
  };
  const cmd = async (line: string): Promise<string> => { tcp.write(conn, line + "\r\n"); return readLine(); };
  try {
    await readLine();                       // 220 banner
    await cmd("EHLO smtp-dev.local");
    await cmd(`MAIL FROM:<${from}>`);
    for (const r of recipients) await cmd(`RCPT TO:<${r}>`);
    await cmd("DATA");                       // 354
    // dot-stuff lines beginning with "."
    const stuffed = raw.replace(/\r\n\./g, "\r\n..");
    tcp.write(conn, stuffed + "\r\n.\r\n");
    await readLine();                        // 250 queued
    await cmd("QUIT");
  } finally {
    try { tcp.close(conn); } catch { /* ignore */ }
  }
}
