import { useState } from "@ekko/react";
import { useRouter } from "ekko:rune/router";
import { TextBox, Button, UploadZone, Alert } from "@ekko/asgard";

function readAsBase64(file: any): Promise<{ filename: string; contentType: string; b64: string }> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const res = String(fr.result || "");
      const b64 = res.includes(",") ? res.slice(res.indexOf(",") + 1) : res;
      resolve({ filename: file.name, contentType: file.type || "application/octet-stream", b64 });
    };
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

export default function Compose() {
  const router = useRouter();
  const [from, setFrom] = useState("dev@smtp-dev.local");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    setError("");
    if (!to.trim()) { setError("A recipient (To) is required."); return; }
    setSending(true);
    try {
      const attachments = [];
      for (const f of files) attachments.push(await readAsBase64(f));
      const r = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, text, attachments }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "send failed");
      router.navigate("/");
    } catch (err) {
      setError(String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="compose">
      <h1>Compose</h1>
      <p className="muted">Delivered to the local catch-all over real SMTP, so it lands right back in your inbox.</p>

      <div className="compose-form">
        <div className="field"><span>From</span>
          <TextBox value={from} onChange={setFrom} placeholder="you@example.com" width="full" />
        </div>
        <div className="field"><span>To</span>
          <TextBox value={to} onChange={setTo} placeholder="someone@example.com, other@example.com" width="full" />
        </div>
        <div className="field"><span>Subject</span>
          <TextBox value={subject} onChange={setSubject} placeholder="Subject" width="full" />
        </div>
        <div className="field"><span>Message</span>
          <TextBox value={text} onChange={setText} placeholder="Write your message…" multiline rows={9} width="full" />
        </div>
        <div className="field"><span>Attachments</span>
          <UploadZone
            config={{ multiple: true }}
            title="Drop files or click to attach"
            description="Any file type — stored in memory only"
            showFileCount
            height={120}
            onFilesAdd={(added: any[]) => setFiles((prev) => [...prev, ...added.map((u) => u.file)])}
          />
          {files.length > 0 ? <div className="muted">{files.length} file(s) attached</div> : null}
        </div>

        {error ? <Alert severity="error" variant="standard">{error}</Alert> : null}

        <div className="compose-actions">
          <Button variant="filled" type="primary" disabled={sending} onClick={send}>{sending ? "Sending…" : "Send"}</Button>
          <Button variant="outlined" onClick={() => router.navigate("/")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
