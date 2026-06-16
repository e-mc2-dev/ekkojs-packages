import { test, expect } from "ekko:test";
import { createElement as h } from "react";
import "react-dom/server";                 // registers React renderToString with ekko:ssr
import { renderToString } from "ekko:ssr";
import { ThemeProvider } from "../src/theme";
import {
  Button, IconButton, ToggleButton, ButtonGroup,
  Card, CardHeader, CardContent, CardActions, CardMedia,
  Typography, Checkbox, CheckboxGroup, Radio, RadioGroup,
  Switch, Alert, TextBox, Select, Slider, Stepper,
  Accordion, AccordionGroup, LinearProgress, CircularProgress,
} from "../src/components";

const ssr = (node: any) => renderToString(h(ThemeProvider, null, node));

// Each primitive must SSR-render: produce HTML, throw no ReferenceError (no document/window at
// render), and be deterministic across two renders (no Math.random()/Date.now() ids — finding #10).
const cases: Array<[string, any]> = [
  ["Button", h(Button, { children: "Click" })],
  ["IconButton", h(IconButton, { children: "x" })],
  ["ToggleButton", h(ToggleButton, { children: "t" })],
  ["ButtonGroup", h(ButtonGroup, null, h(Button, { children: "a" }), h(Button, { children: "b" }))],
  ["Card", h(Card, null, h(CardHeader, { title: "H" }), h(CardContent, null, "body"))],
  ["Typography", h(Typography, { variant: "h1", children: "Title" })],
  ["Checkbox", h(Checkbox, { label: "c" })],
  ["Radio", h(Radio, { label: "r", value: "1" })],
  ["Switch", h(Switch, { label: "s" })],
  ["Alert", h(Alert, { severity: "info", children: "msg" })],
  ["TextBox", h(TextBox, { value: "v" })],
  ["Slider", h(Slider, { value: 50 })],
  ["Stepper", h(Stepper, { steps: [{ label: "One" }, { label: "Two" }], activeStep: 0 })],
  ["LinearProgress", h(LinearProgress, { value: 40 })],
  ["CircularProgress", h(CircularProgress, { value: 60 })],
];

for (const [name, node] of cases) {
  test(`${name} SSR-renders (no throw) + deterministic`, () => {
    const a = ssr(node);
    expect(typeof a === "string" && a.length > 0).toBe(true);
    const b = ssr(node);
    expect(a).toBe(b); // deterministic ids (useSsrId) → no hydration mismatch
  });
}

test("CardMedia sanitizes dangerous image URLs (finding #4)", () => {
  const out = renderToString(h(ThemeProvider, null, h(CardMedia, { component: "img", image: "javascript:alert(1)" })));
  expect(out.includes("javascript:")).toBe(false);
  const bg = renderToString(h(ThemeProvider, null, h(CardMedia, { component: "div", image: "https://x/a).evil" })));
  expect(bg.includes(").evil")).toBe(false);
});
