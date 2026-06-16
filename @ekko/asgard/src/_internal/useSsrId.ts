import { useId } from "react";
// useSsrId — deterministic, SSR-safe id. Replaces every Date.now()/Math.random() id (which cause
// hydration mismatch). Wraps React's useId (stable across server + client renders of the same tree).
export function useSsrId(prefix?: string): string {
  // React's useId yields ":Rxx:" — the wrapping colons are ILLEGAL in a CSS class selector (parsed as
  // pseudo-classes), which silently breaks scoped styles built from the id (e.g. SDiv's scrollbar rules:
  // `.sdiv-:Rxx:::-webkit-scrollbar` never matches). Strip them; the remaining token stays unique and
  // deterministic (stable across SSR + client), and is valid as an id, a class, AND in a selector.
  const id = useId().replace(/:/g, "");
  return prefix ? `${prefix}-${id}` : id;
}
