import { test, expect } from "ekko:test";
import { createElement as h } from "react";
import "react-dom/server";
import { renderToString } from "ekko:ssr";
import { ThemeProvider } from "../src/theme";
import { DockHost, VerticalPane, SplitContainer, TabHost, DragDropProvider } from "../src/dock";

const ssr = (n: any) => renderToString(h(ThemeProvider, null, n));

const cases: Array<[string, any]> = [
  ["DockHost", h(DockHost, {})],
  ["VerticalPane", h(VerticalPane, null, h("div", null, "pane"))],
  ["SplitContainer", h(SplitContainer, { direction: "horizontal" }, h("div", null, "a"), h("div", null, "b"))],
  ["TabHost", h(DragDropProvider, null, h(TabHost, { tabs: [{ id: "1", title: "Tab", content: h("div", null, "c") }] }))],
];

for (const [name, node] of cases) {
  test(`${name} SSR-renders (no throw) + deterministic`, () => {
    const a = ssr(node);
    expect(typeof a === "string" && a.length > 0).toBe(true);
    expect(a).toBe(ssr(node));
  });
}
