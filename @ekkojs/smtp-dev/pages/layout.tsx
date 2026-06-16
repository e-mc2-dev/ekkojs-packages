import { useEffect } from "@ekko/react";
import { useAtom } from "ekko:rune/mimir";
import { ThemeProvider, Button } from "@ekko/asgard";
import { useRouter } from "ekko:rune/router";
import { statusAtom } from "../atoms/mail";

const InboxIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const PenIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
  </svg>
);

export default function RootLayout({ children }: any) {
  const [status, setStatus] = useAtom(statusAtom);
  const router = useRouter();
  const path = router?.path || (typeof window !== "undefined" ? window.location.pathname : "/");

  // Poll the server status (running? port? unread count?) so the sidebar is always live.
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
  const isInbox = path === "/" || path.startsWith("/message");
  const isSettings = path.startsWith("/settings");

  return (
    <ThemeProvider initialThemeName="githubDark">
      <div className="mail">
        <aside className="sidebar">
          <Link href="/" className="brand"><span className="brand-mark">✉</span><span className="brand-name">smtp&#8209;dev</span></Link>

          <Button variant="filled" type="primary" width="full" onClick={() => router.navigate("/compose")}>
            <span className="compose-btn"><PenIcon /> Compose</span>
          </Button>

          <nav className="side-nav">
            <Link href="/" className={"side-link" + (isInbox ? " active" : "")}>
              <InboxIcon /><span className="side-link-label">Inbox</span>
              {unread > 0 ? <span className="side-badge">{unread}</span> : null}
            </Link>
            <Link href="/settings" className={"side-link" + (isSettings ? " active" : "")}>
              <GearIcon /><span className="side-link-label">Settings</span>
            </Link>
          </nav>

          <div className={"side-status " + (status?.running ? "is-up" : "is-down")}>
            <span className="dot" />
            <div className="side-status-text">
              <span className="side-status-title">{status?.running ? "SMTP running" : "SMTP stopped"}</span>
              {status?.running ? <span className="side-status-sub">{status.host}:{status.port} · {status.received || 0} received</span> : null}
            </div>
          </div>
        </aside>

        <section className="mail-main">{children}</section>
      </div>
    </ThemeProvider>
  );
}
