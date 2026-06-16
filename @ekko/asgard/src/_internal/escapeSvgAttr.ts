// escapeSvgAttr — escape a string for safe interpolation into inline SVG/HTML attribute markup.
// Fixes SVG attr injection (e.g. stroke='${color}' in SyntaxColorLine) — escape, don't just URL-encode.
export function escapeSvgAttr(s: string): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
