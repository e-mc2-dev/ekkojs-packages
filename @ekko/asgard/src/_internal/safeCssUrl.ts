import { safeUrl } from "./safeUrl";
// safeCssUrl — for backgroundImage:url(...). Run through safeUrl, then strip the chars that could
// break out of url(...) and inject extra CSS declarations: parentheses, quotes, backslash, newlines.
export function safeCssUrl(s: string): string {
  const url = safeUrl(s);
  if (url === "#") return "";
  return url.replace(/[()"'\\\r\n\t]/g, "");
}
