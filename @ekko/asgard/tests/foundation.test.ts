import { test, expect } from "ekko:test";
import { createElement } from "react";
import "react-dom/server";                 // registers React's renderToString with ekko:ssr
import { renderToString } from "ekko:ssr";
import { safeUrl, escapeSvgAttr, safeCssUrl, useSsrId, SsrPortal, isBrowser } from "../src/_internal/index";
import { ThemeProvider, useTheme } from "../src/theme/index";

test("safeUrl rejects dangerous schemes, keeps safe ones", () => {
  expect(safeUrl("javascript:alert(1)")).toBe("#");
  expect(safeUrl("  JaVaScRiPt:alert(1)")).toBe("#");
  expect(safeUrl("data:text/html,<script>")).toBe("#");
  expect(safeUrl("vbscript:msgbox")).toBe("#");
  expect(safeUrl("https://x.com/a")).toBe("https://x.com/a");
  expect(safeUrl("/root/path")).toBe("/root/path");
  expect(safeUrl("#frag")).toBe("#frag");
});

test("escapeSvgAttr escapes all five entities", () => {
  expect(escapeSvgAttr("a'\"<>&")).toBe("a&#39;&quot;&lt;&gt;&amp;");
});

test("safeCssUrl strips url() breakout chars", () => {
  const out = safeCssUrl("https://x/a).color:red;(");
  expect(out.includes(")")).toBe(false);
  expect(out.includes("(")).toBe(false);
});

function Probe() {
  const t = useTheme();
  const id = useSsrId("x");
  return createElement("span", { "data-id": id, "data-theme": t.themeName });
}

test("ThemeProvider SSRs deterministically with no browser globals (finding #8)", () => {
  const make = () => createElement(ThemeProvider, null, createElement(Probe));
  const a = renderToString(make());
  const b = renderToString(make());
  expect(a.includes('data-theme="dark"')).toBe(true);  // default theme on the server
  expect(a).toBe(b);                                    // no Date.now()/Math.random() ids
});

test("SsrPortal renders nothing under SSR (finding #9)", () => {
  expect(isBrowser).toBe(false);
  const out = renderToString(createElement(SsrPortal, null, createElement("div", null, "x")));
  expect(out).toBe("");
});
