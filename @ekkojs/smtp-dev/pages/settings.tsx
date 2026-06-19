import { useState, useEffect } from "@ekko/react";
import { Card, TextBox, Switch, Button, Alert } from "@ekko/asgard";

export default function Settings() {
  const [status, setStatus] = useState<any>(null);
  const [port, setPort] = useState("1025");
  const [host, setHost] = useState("0.0.0.0");
  const [ssl, setSsl] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const r = await fetch("/api/settings");
    const d = await r.json();
    setStatus(d.status);
    setPort(d.smtp_port);
    setHost(d.smtp_host);
    setSsl(d.smtp_ssl === "1");
  }
  useEffect(() => { refresh(); }, []);

  async function saveAndRestart() {
    setBusy(true); setMsg("");
    try {
      await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smtp_host: host, smtp_port: port, smtp_ssl: ssl ? "1" : "0" }),
      });
      const r = await fetch("/api/smtp/control", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart", port }),
      });
      setStatus(await r.json());
      setMsg("SMTP restarted on port " + port + ".");
    } catch (e) { setMsg("Error: " + String(e)); }
    finally { setBusy(false); }
  }
  async function control(action: string) {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/smtp/control", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setStatus(await r.json());
      setMsg("SMTP " + action + "ped.");
    } catch (e) { setMsg("Error: " + String(e)); }
    finally { setBusy(false); }
  }
  async function clearAll() {
    if (!confirm("Delete all messages?")) return;
    await fetch("/api/messages", { method: "DELETE" });
    setMsg("Mailbox cleared.");
  }

  const running = status?.running;

  return (
    <div className="settings">
      <h1>Settings</h1>

      <Card variant="outlined">
        <div className="card-pad">
          <div className="card-title">SMTP server</div>
          <div className="status-line">
            <span className={"dot " + (running ? "on" : "off")} />
            {running ? <>Running on <code>{status.host}:{status.port}</code> — {status.received} message(s) received</> : "Stopped"}
          </div>

          <div className="setting-grid">
            <div className="field"><span>Bind host</span>
              <TextBox value={host} onChange={setHost} width="full" />
            </div>
            <div className="field"><span>SMTP port</span>
              <TextBox value={port} onChange={setPort} type="number" width="full" />
            </div>
          </div>

          <div className="toggle">
            <Switch checked={ssl} disabled={!status?.sslAvailable} onChange={setSsl}
              label="Implicit TLS (SSL)" />
            {!status?.sslAvailable ? <span className="muted">(Coming soon)</span> : null}
          </div>

          <div className="btn-row">
            <Button variant="filled" type="primary" disabled={busy} onClick={saveAndRestart}>Save &amp; restart</Button>
            {running
              ? <Button variant="outlined" disabled={busy} onClick={() => control("stop")}>Stop</Button>
              : <Button variant="outlined" type="success" disabled={busy} onClick={() => control("start")}>Start</Button>}
            <Button variant="outlined" disabled={busy} onClick={() => control("restart")}>Restart</Button>
          </div>
          {msg ? <div style={{ marginTop: 12 }}><Alert severity="info" variant="standard">{msg}</Alert></div> : null}
        </div>
      </Card>

      <Card variant="outlined">
        <div className="card-pad">
          <div className="card-title">Mailbox</div>
          <p className="muted">All mail lives in memory only — it vanishes when this process exits. Nothing is ever relayed.</p>
          <Button variant="ghost" type="error" onClick={clearAll}>Clear mailbox</Button>
        </div>
      </Card>
    </div>
  );
}
