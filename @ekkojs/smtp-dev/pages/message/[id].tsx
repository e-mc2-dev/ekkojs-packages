import { useState, useEffect } from "@ekko/react";
import { useParams, useRouter, Link } from "ekko:rune/router";
import { Card, Button, ButtonGroup } from "@ekko/asgard";

function fmtSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

export default function MessageView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id || (typeof window !== "undefined" ? window.location.pathname.split("/message/")[1] : "");
  const [msg, setMsg] = useState<any>(null);
  const [tab, setTab] = useState("html");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch("/api/messages/" + id)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setMsg(d); setTab(d.has_html ? "html" : "text"); })
      .catch(() => setNotFound(true));
  }, [id]);

  async function del() {
    await fetch("/api/messages/" + id, { method: "DELETE" });
    router.navigate("/");
  }

  if (notFound) return <div className="empty">Message not found. <Link href="/">Back to inbox</Link></div>;
  if (!msg) return <div className="empty">Loading…</div>;

  const tabs = [
    ...(msg.has_html ? [{ key: "html", label: "HTML" }] : []),
    { key: "text", label: "Text" },
    { key: "source", label: "Source" },
  ];
  const activeIdx = Math.max(0, tabs.findIndex((t) => t.key === tab));
  const toList = (msg.to_addrs && msg.to_addrs.length ? msg.to_addrs : msg.envelope_to) || [];

  return (
    <div className="msg-view">
      <div className="msg-view-bar">
        <Button variant="outlined" size="small" onClick={() => router.navigate("/")}>← Inbox</Button>
        <Button variant="ghost" type="error" size="small" onClick={del}>Delete</Button>
      </div>

      <Card variant="outlined">
        <div className="msg-headers">
          <h1 className="msg-view-subject">{msg.subject}</h1>
          <div className="hdr"><span className="hdr-k">From</span><span>{msg.from_addr}</span></div>
          <div className="hdr"><span className="hdr-k">To</span><span>{toList.join(", ")}</span></div>
          {msg.cc_addrs && msg.cc_addrs.length ? <div className="hdr"><span className="hdr-k">Cc</span><span>{msg.cc_addrs.join(", ")}</span></div> : null}
          <div className="hdr"><span className="hdr-k">Date</span><span>{new Date(msg.date_received * 1000).toLocaleString()}</span></div>
          <div className="hdr"><span className="hdr-k">Envelope</span><span className="muted">{msg.envelope_from} → {(msg.envelope_to || []).join(", ")}</span></div>
        </div>
      </Card>

      {msg.attachments && msg.attachments.length > 0 && (
        <Card variant="outlined">
          <div className="attachments">
            <div className="attachments-title">Attachments ({msg.attachments.length})</div>
            <div className="attach-grid">
              {msg.attachments.map((a: any) => (
                <a key={a.id} className="attach" href={"/api/attachments/" + a.id + "?dl=1"} target="_blank" rel="noopener">
                  <span className="attach-icon">📄</span>
                  <span className="attach-name">{a.filename}</span>
                  <span className="attach-size muted">{fmtSize(a.size)}</span>
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="body-tabs">
        <ButtonGroup mode="radio" value={activeIdx} onChange={(v: any) => setTab(tabs[v as number]?.key || "text")}>
          {tabs.map((t) => <Button key={t.key} size="small">{t.label}</Button>)}
        </ButtonGroup>
      </div>

      <div className="body-pane">
        {tab === "html" && msg.has_html ? (
          <iframe className="html-frame" sandbox="" srcDoc={msg.html_body} title="message body" />
        ) : tab === "source" ? (
          <pre className="source">{msg.raw}</pre>
        ) : (
          <pre className="text-body">{msg.text_body || "(no text body)"}</pre>
        )}
      </div>
    </div>
  );
}
