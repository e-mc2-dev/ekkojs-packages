// safeUrl — scheme allowlist for any URL that reaches an href/src/navigation sink.
// Rejects javascript:/data:/vbscript: (and control chars) → "#". Mirrors the registry's proven
// logic (ekko-lib/registry/components/Markdown.tsx). Optional baseUrl resolves relative URLs.
export function safeUrl(url: string, baseUrl?: string): string {
  const trimmed = (url || "").trim();
  // Strip control chars (incl. NUL/newlines/tabs used to smuggle "java\nscript:")
  const clean = trimmed.replace(/[\x00-\x1F\x7F]/g, "");
  // Reject dangerous schemes outright (case/space-insensitive)
  if (/^\s*(javascript|data|vbscript|file)\s*:/i.test(clean)) {
    return "#";
  }
  // Absolute (http/https/protocol-relative), root-absolute, or hash → leave as-is
  if (/^(https?:)?\/\//i.test(clean) || clean.startsWith("/") || clean.startsWith("#")) {
    return clean;
  }
  // Relative → resolve against baseUrl when provided, else keep as a relative path
  if (!baseUrl) return clean;
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanUrl = clean.replace(/^\.\//, "");
  return `${cleanBase}/${cleanUrl}`;
}
