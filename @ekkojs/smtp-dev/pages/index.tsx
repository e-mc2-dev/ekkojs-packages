import { useState, useEffect } from "@ekko/react";
import { useRouter } from "ekko:rune/router";
import { DataTable, Button } from "@ekko/asgard";

function fmtDate(epoch: number): string {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  return d.toLocaleString();
}
function fmtSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
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

  const weight = (r: any) => (r.seen ? 400 : 700);
  const columns = [
    {
      id: "from", label: "From", field: "from_addr", width: 240,
      render: (r: any) => <span style={{ fontWeight: weight(r) }}>{r.from_addr || "(unknown)"}</span>,
    },
    {
      id: "subject", label: "Subject",
      render: (r: any) => (
        <span>
          {r.attach_count > 0 ? <span title={r.attach_count + " attachment(s)"} style={{ marginRight: 6 }}>📎</span> : null}
          <span style={{ fontWeight: weight(r) }}>{r.subject}</span>
          <span style={{ opacity: 0.6, marginLeft: 8 }}>to {(r.envelope_to || []).join(", ")}</span>
        </span>
      ),
    },
    { id: "size", label: "Size", field: "size", width: 90, align: "right" as const, render: (r: any) => fmtSize(r.size) },
    { id: "date", label: "Received", width: 170, align: "right" as const, sortable: true, field: "date_received", render: (r: any) => fmtDate(r.date_received) },
  ];

  return (
    <div className="inbox">
      <div className="inbox-head">
        <h1>Inbox <span className="muted">({messages.length})</span></h1>
        <div className="inbox-actions">
          <Button variant="outlined" size="small" onClick={load}>Refresh</Button>
          <Button variant="ghost" type="error" size="small" disabled={messages.length === 0} onClick={clearAll}>Clear all</Button>
        </div>
      </div>

      <DataTable
        data={loading ? [] : messages}
        columns={columns}
        rowKey="id"
        size="comfortable"
        variant="default"
        onRowClick={(r: any) => router.navigate("/message/" + r.id)}
        emptyText={loading ? "Loading…" : "No mail yet — point your app's SMTP here, or compose a test message."}
      />
    </div>
  );
}
