import { atom } from "ekko:rune/mimir";

// Live SMTP server status + mail counts, polled by the layout so the header is always current
// (F5-tolerant via Mimir).
export const statusAtom = atom({
  key: "smtpStatus",
  default: { running: false, host: "", port: 0, received: 0, ssl: false, sslAvailable: false, counts: { total: 0, unread: 0 } } as any,
});
