import { createApp, scanRoutes, readManifest } from "ekko:rune";
import { compileSass } from "ekko:ssr/css";
import { readText } from "ekko:fs";

// React SSR activation (same shared instance for JSX factory + renderToString).
import "@ekko/react";
import "@ekko/react-dom/server";

import { getSetting } from "./db";
import * as store from "./store";

// ── API handlers ──
import {
  listMessagesHandler, getMessageHandler, deleteMessageHandler, clearAllHandler,
  downloadAttachmentHandler, sendHandler, statusHandler, controlHandler,
  getSettingsHandler, setSettingsHandler,
} from "./handlers/api";

// ── Pages ──
import RootLayout from "./pages/layout";
import NotFound from "./pages/not-found";
import ErrorPage from "./pages/error";
import * as Inbox from "./pages/index";
import * as MessageView from "./pages/message/[id]";
import * as Compose from "./pages/compose";
import * as SettingsPage from "./pages/settings";

const envGet = (k: string): string | undefined => (typeof Ekko !== "undefined" ? Ekko.env.get(k) : undefined);
const webPort = parseInt(envGet("PORT") || getSetting("web_port") || "1080", 10);

// ── Status endpoint includes mail counts so the header badge is live ──
const statusWithCounts = (req: any, res: any) => res.json({ ...store.smtpStatus(), counts: store.counts() });

const scss = readText("styles/global.scss");
const globalCSS = compileSass(scss);
const head = `<style>${globalCSS}</style><meta name="viewport" content="width=device-width, initial-scale=1">`;

const manifest = readManifest();
const layouts: any = { "": { layouts: [{ render: RootLayout }] } };

const app = createApp({
  port: webPort,
  manifest,
  layouts,
  error: ErrorPage,
  notFound: NotFound,
  ssr: "background",
});

// ── API routes ──
app.api("GET", "/api/messages", listMessagesHandler);
app.api("DELETE", "/api/messages", clearAllHandler);
app.api("GET", "/api/messages/:id", getMessageHandler);
app.api("DELETE", "/api/messages/:id", deleteMessageHandler);
app.api("GET", "/api/attachments/:id", downloadAttachmentHandler);
app.api("POST", "/api/send", sendHandler);
app.api("GET", "/api/smtp/status", statusWithCounts);
app.api("POST", "/api/smtp/control", controlHandler);
app.api("GET", "/api/settings", getSettingsHandler);
app.api("POST", "/api/settings", setSettingsHandler);

// ── Pages ──
const modules: any = {
  "/": Inbox,
  "/message/:id": MessageView,
  "/compose": Compose,
  "/settings": SettingsPage,
};
const routes = scanRoutes("pages");
for (const r of routes) {
  const mod = modules[r.pattern];
  if (mod) app.page(r.pattern, mod, { title: "smtp-dev", page: r.pageKey, head });
}

// ── Boot the catch-all SMTP server, then the webmail ──
const smtpStart = store.startSmtp();
if (!smtpStart.ok) console.error("[smtp-dev] SMTP failed to start:", smtpStart.error);

app.start();

const s = store.smtpStatus();
console.log(`[smtp-dev] webmail on http://localhost:${webPort}  •  catch-all SMTP on ${s.host}:${s.port} (${s.running ? "running" : "stopped"})`);
console.log(`[smtp-dev] in-memory only — all mail is discarded on exit. Never relays.`);
