import { test, expect } from "ekko:test";
import { createElement as h } from "react";
import "react-dom/server";
import { renderToString } from "ekko:ssr";
import { ThemeProvider } from "../src/theme";
import { Grid, Splitter, DataTable, TreeView, Breadcrumb, Toolbar, SDiv } from "../src/components";

const ssr = (n: any) => renderToString(h(ThemeProvider, null, n));

const cases: Array<[string, any]> = [
  ["SDiv", h(SDiv, null, "x")],
  ["Grid", h(Grid, { container: true }, h(Grid, { item: true }, "a"))],
  ["Splitter", h(Splitter, null, h("div", null, "L"), h("div", null, "R"))],
  ["Breadcrumb", h(Breadcrumb, { items: [{ label: "Home", href: "/" }, { label: "Page" }] })],
  ["DataTable", h(DataTable, { data: [{ id: 1, a: "x" }], columns: [{ id: "a", label: "A", field: "a" }], rowKey: "id" })],
  ["TreeView", h(TreeView, { nodes: [{ id: "1", label: "Root", children: [{ id: "2", label: "Child" }] }] })],
  ["Toolbar", h(Toolbar, null, h("button", null, "b"))],
];

for (const [name, node] of cases) {
  test(`${name} SSR-renders (no throw) + deterministic`, () => {
    const a = ssr(node);
    expect(typeof a === "string" && a.length > 0).toBe(true);
    expect(a).toBe(ssr(node));
  });
}
