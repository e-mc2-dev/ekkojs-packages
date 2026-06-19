import { test, expect } from "ekko:test";
import { createElement } from "react";
import "react-dom/server";                 // registers React's renderToString with ekko:ssr
import { renderToString } from "ekko:ssr";
import { themeToCssVars, applyThemeToRoot, ThemeCssVars } from "../src/theme/cssVars";
import { ThemeProvider } from "../src/theme/ThemeContext";
import { themes } from "../src/theme/themes";

// Task 299 — the theme → CSS-variables bridge (so your own SCSS re-themes on switch, not just Asgard widgets).

test("themeToCssVars flattens the token tree to --ekko-* custom properties", () => {
  const vars = themeToCssVars(themes.nord);
  expect(vars["--ekko-background-primary"]).toBe(themes.nord.background.primary);
  expect(vars["--ekko-text-primary"]).toBe(themes.nord.text.primary);
  expect(vars["--ekko-accent-primary"]).toBe(themes.nord.accent.primary);
  expect(vars["--ekko-border-default"]).toBe(themes.nord.border.default);
  expect(vars["--ekko-semantic-error"]).toBe(themes.nord.semantic.error);
  // nested components.* are flattened too
  expect(typeof vars["--ekko-components-sidebar-background"]).toBe("string");
});

test("themeToCssVars excludes `name` and stringifies numeric opacity tokens", () => {
  const vars = themeToCssVars(themes.dracula);
  expect(vars["--ekko-name"]).toBeUndefined();
  // opacity.* are numbers in the Theme → must be emitted as strings
  expect(typeof vars["--ekko-opacity-hover"]).toBe("string");
  expect(vars["--ekko-opacity-hover"]).toBe(String(themes.dracula.opacity.hover));
});

test("themeToCssVars honors a custom prefix", () => {
  const vars = themeToCssVars(themes.nord, "--x-");
  expect(vars["--x-background-primary"]).toBe(themes.nord.background.primary);
  expect(vars["--ekko-background-primary"]).toBeUndefined();
});

test("applyThemeToRoot is a no-op under SSR (no document) and does not throw", () => {
  // In the test isolate there is no DOM; the guard must make this a safe no-op.
  let threw = false;
  try { applyThemeToRoot(themes.nord); } catch (_) { threw = true; }
  expect(threw).toBe(false);
});

test("ThemeCssVars renders nothing (returns null) inside a ThemeProvider", () => {
  const html = renderToString(
    createElement(ThemeProvider, { theme: themes.nord },
      createElement(ThemeCssVars, {}),
      createElement("div", { id: "after" }, "ok"),
    ),
  );
  // It injects via a useEffect (client only); server output contains only the sibling, no stray markup.
  expect(html.includes('id="after"')).toBe(true);
  expect(html.includes("ThemeCssVars")).toBe(false);
});
