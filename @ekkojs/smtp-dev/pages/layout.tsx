import { useEffect } from "@ekko/react";
import { useAtom } from "ekko:rune/mimir";
import { ThemeProvider } from "@ekko/asgard";
import { statusAtom } from "../atoms/mail";

export default function RootLayout({ children }: any) {
  const [status, setStatus] = useAtom(statusAtom);

  // Poll the server status (running? port? unread count?) so the header is always live.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/smtp/status");
        const d = await r.json();
        if (alive) setStatus(d);
      } catch { /* server momentarily unreachable */ }
    };
    tick();
    const iv = setInterval(tick, 4000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const unread = status?.counts?.unread || 0;

  return (
    <ThemeProvider initialThemeName="githubDark">
      <div className="app">
        <header className="topbar">
          <Link href="/" className="brand"><span className="brand-mark">✉</span><span>smtp-dev</span></Link>
          <nav className="nav">
            <Link href="/" className="nav-link">Inbox{unread > 0 ? <span className="badge">{unread}</span> : null}</Link>
            <Link href="/compose" className="nav-link">Compose</Link>
            <Link href="/settings" className="nav-link">Settings</Link>
          </nav>
          <div className={"smtp-status " + (status?.running ? "is-up" : "is-down")}>
            <span className="dot" />
            {status?.running ? `SMTP ${status.host}:${status.port}` : "SMTP stopped"}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </ThemeProvider>
  );
}
