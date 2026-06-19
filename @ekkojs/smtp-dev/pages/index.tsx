import { useState, useEffect } from "@ekko/react";
import { useRouter, Link } from "ekko:rune/router";
import { Button } from "@ekko/asgard";

function fmtDate(epoch: number): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}
// Stable accent color per sender, so the avatar circles are recognizable at a glance.
const AV_COLORS = ["#4c8dff", "#3fb950", "#d29922", "#bc6bff", "#f0506e", "#26a69a", "#a371f7", "#ec6cb9"];
function avatarFor(addr: string): { initial: string; color: string } {
  const name = (addr || "?").replace(/<.*/, "").trim() || addr || "?";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return { initial: (name[0] || "?").toUpperCase(), color: AV_COLORS[h % AV_COLORS.length] };
}

export default function Inbox() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch("/api/messages");
      const d = await r.json();
      setMessages(d.messages || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 3000); // live: catch new mail as it arrives
    return () => clearInterval(iv);
  }, []);

  async function clearAll() {
    if (!confirm("Delete all messages?")) return;
    await fetch("/api/messages", { method: "DELETE" });
    load();
  }

  return (
    <>
      <header className="mail-toolbar">
        <div className="mail-toolbar-title">
          Inbox <span className="count">{messages.length}</span>
        </div>
        <div className="mail-toolbar-actions">
          <Button variant="outlined" size="small" onClick={load}>Refresh</Button>
          <Button variant="ghost" type="error" size="small" disabled={messages.length === 0} onClick={clearAll}>Clear all</Button>
        </div>
      </header>

      <div className="mail-scroll">
        {loading ? (
          <div className="mail-empty">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="mail-empty">
            <div className="mail-empty-mark">✉</div>
            <p>No mail yet.</p>
            <p className="muted">Point your app's SMTP client at this server, or <Link href="/compose">compose a test message</Link>.</p>
          </div>
        ) : (
          <ul className="maillist">
            {messages.map((m) => {
              const av = avatarFor(m.from_addr);
              const to = (m.envelope_to || []).join(", ");
              return (
                <li key={m.id} className={"mailrow" + (m.seen ? "" : " unread")} onClick={() => router.navigate("/message/" + m.id)}>
                  <span className="mailrow-unread" />
                  <span className="avatar" style={{ background: av.color }}>{av.initial}</span>
                  <div className="mailrow-main">
                    <div className="mailrow-line1">
                      <span className="mailrow-from">{m.from_addr || "(unknown)"}</span>
                      <span className="mailrow-date">{fmtDate(m.date_received)}</span>
                    </div>
                    <div className="mailrow-line2">
                      {m.attach_count > 0 ? <span className="clip" title={m.attach_count + " attachment(s)"}>📎</span> : null}
                      <span className="mailrow-subject">{m.subject}</span>
                      {m.snippet ? <span className="mailrow-snippet"> — {m.snippet}</span> : null}
                    </div>
                    {to ? <div className="mailrow-to">to {to}</div> : null}
                  </div>
                  <span className="mailrow-size">{fmtSize(m.size)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
