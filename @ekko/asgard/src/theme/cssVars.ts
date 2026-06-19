// Theme → CSS custom properties bridge. ThemeProvider/useTheme re-theme Asgard components; this bridge lets
// your OWN markup (SCSS) re-theme on switch too, by mirroring the active theme's tokens onto :root as CSS vars.
// (Task 299 — the "ThemeProvider only themes Asgard, not your page" trap.)
import { useEffect } from "react";
import { useTheme } from "./ThemeContext";
import type { Theme } from "./types";

// Flatten the Theme token tree to CSS custom properties:
//   { "--ekko-background-primary": "#…", "--ekko-accent-primary": "#…", "--ekko-opacity-hover": "0.08", … }
// Dotted token paths become dash-joined names under `prefix` (default "--ekko-"); `name` is excluded.
export function themeToCssVars(theme: Theme, prefix = "--ekko-"): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (node: any, path: string[]) => {
    for (const k in node) {
      if (k === "name") continue;
      const v = (node as any)[k];
      if (v && typeof v === "object") walk(v, path.concat(k));
      else out[prefix + path.concat(k).join("-")] = String(v);
    }
  };
  walk(theme as any, []);
  return out;
}

// Imperatively apply a theme's tokens to document.documentElement (escape hatch / non-React callers). SSR no-op.
export function applyThemeToRoot(theme: Theme, prefix = "--ekko-"): void {
  if (typeof document === "undefined") return;
  const vars = themeToCssVars(theme, prefix);
  const root = document.documentElement;
  for (const name in vars) root.style.setProperty(name, vars[name]);
}

// Drop-in component: place inside <ThemeProvider> and it mirrors the active theme onto :root as CSS vars, so
// your own SCSS (e.g. `var(--ekko-background-primary)`) re-themes on switch. Renders nothing. SSR-safe.
export function ThemeCssVars({ prefix = "--ekko-" }: { prefix?: string }) {
  const { theme } = useTheme();
  useEffect(() => { applyThemeToRoot(theme, prefix); }, [theme, prefix]);
  return null;
}
