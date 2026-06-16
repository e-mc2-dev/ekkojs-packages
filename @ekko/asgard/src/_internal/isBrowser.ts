// isBrowser — true only in a real browser. Guard every document/window/localStorage/matchMedia access
// so components render under rune SSR (Node-less, browser-less) without throwing ReferenceError.
export const isBrowser: boolean =
  typeof window !== "undefined" && typeof document !== "undefined";
