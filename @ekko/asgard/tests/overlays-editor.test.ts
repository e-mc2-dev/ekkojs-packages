import { test, expect } from "ekko:test";
import { createElement as h } from "react";
import "react-dom/server";
import { renderToString } from "ekko:ssr";
import {
  ThemeProvider, MarkdownRenderer, SyntaxColor, Tooltip, Drawer, ToastProvider, ColorPicker, typescriptLanguage,
} from "../src/index";

const ssr = (n: any) => renderToString(h(ThemeProvider, null, n));

// ── 259 overlays (SSR-safe: closed overlays render inert/children; portals guarded) ──
test("Tooltip SSR renders its child", () => {
  const o = ssr(h(Tooltip, { content: "tip" }, h("button", null, "btn")));
  expect(o.includes("btn")).toBe(true);
});
test("Drawer SSR (open:false) no throw", () => {
  expect(typeof ssr(h(Drawer, { open: false }, "body")) === "string").toBe(true);
});
test("ToastProvider SSR renders app tree", () => {
  expect(ssr(h(ToastProvider, null, h("div", null, "app"))).includes("app")).toBe(true);
});

// ── 260 editor & rich ──
test("MarkdownRenderer SSR", () => {
  const o = ssr(h(MarkdownRenderer, { markdown: "# Title\n\nHello **world**" }));
  expect(o.includes("Title")).toBe(true);
});
test("SyntaxColor SSR", () => {
  expect(ssr(h(SyntaxColor, { code: "const x = 1;", language: typescriptLanguage })).length > 0).toBe(true);
});
test("ColorPicker SSR no throw + deterministic", () => {
  const a = ssr(h(ColorPicker, {}));
  expect(a.length > 0).toBe(true);
  expect(a).toBe(ssr(h(ColorPicker, {})));
});

// ── 262 SECURITY regressions (the §5 hardening) ──
test("Markdown rejects javascript: links + images (#1/#2)", () => {
  const o = ssr(h(MarkdownRenderer, { markdown: "[x](javascript:alert(1))\n\n![y](javascript:alert(2))" }));
  expect(o.includes("javascript:")).toBe(false);
});
test("Markdown deep-nesting recursion bomb is bounded, no stack overflow (#7)", () => {
  const deep = "*".repeat(400) + "x" + "*".repeat(400);
  const o = ssr(h(MarkdownRenderer, { markdown: deep }));
  expect(typeof o === "string").toBe(true);
});
test("Markdown deep link-nesting bomb bounded (#7)", () => {
  const bomb = "[".repeat(400) + "x" + "]()".repeat(400);
  const o = ssr(h(MarkdownRenderer, { markdown: bomb }));
  expect(typeof o === "string").toBe(true);
});
