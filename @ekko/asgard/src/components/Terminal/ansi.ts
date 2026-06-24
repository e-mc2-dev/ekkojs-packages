// ============================================================================
// ANSI parser — turns ANSI/SGR text into styled runs.
// Pure (no React/DOM) so it is unit-testable on its own.
// Semantics are a 1:1 port of the runtime's Rust parser
// (crates/ekko-tui/src/core/ansi_parser.rs: apply_sgr + index_256_to_col),
// so the web renders exactly what the terminal does.
// ============================================================================

import type { AnsiColor, AnsiRun } from './types';

const DEFAULT: AnsiColor = { kind: 'default' };

/**
 * Normalize the textual representations of the ESC byte to a real ESC (0x1b):
 * ``, `\x1b`/`\x1B`, `\033`, `\e`. Real ESC bytes are left untouched.
 */
export function normalizeEscapes(input: string): string {
  return input
    .replace(/\\u001b/g, '\x1b')
    .replace(/\\x1b/gi, '\x1b')
    .replace(/\\033/g, '\x1b')
    .replace(/\\e/g, '\x1b');
}

function clampByte(s: string): number {
  const n = parseInt(s, 10);
  if (isNaN(n)) return 0;
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

/** xterm 256-color index → AnsiColor. Port of ansi_parser.rs:468 index_256_to_col. */
export function index256ToColor(idx: number): AnsiColor {
  if (idx < 16) return { kind: 'named', index: idx };
  if (idx >= 232) {
    const v = 8 + (idx - 232) * 10;
    return { kind: 'rgb', r: v, g: v, b: v };
  }
  const i = idx - 16;
  const STEPS = [0, 95, 135, 175, 215, 255];
  return {
    kind: 'rgb',
    r: STEPS[Math.floor(i / 36)],
    g: STEPS[Math.floor(i / 6) % 6],
    b: STEPS[i % 6],
  };
}

interface SgrState {
  fg: AnsiColor;
  bg: AnsiColor;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  reverse: boolean;
}

function freshState(): SgrState {
  return { fg: DEFAULT, bg: DEFAULT, bold: false, italic: false, underline: false, reverse: false };
}

/** Apply one SGR sequence's params (already split on ';'). Port of apply_sgr (ansi_parser.rs:251). */
function applySgr(st: SgrState, parts: string[]): void {
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    st.fg = DEFAULT; st.bg = DEFAULT; st.bold = st.italic = st.underline = st.reverse = false;
    return;
  }
  let i = 0;
  while (i < parts.length) {
    const n = parseInt(parts[i], 10) || 0;
    if (n === 0) { st.fg = DEFAULT; st.bg = DEFAULT; st.bold = st.italic = st.underline = st.reverse = false; }
    else if (n === 1) st.bold = true;
    else if (n === 3) st.italic = true;
    else if (n === 4) st.underline = true;
    else if (n === 7) st.reverse = true;
    else if (n === 22) st.bold = false;
    else if (n === 23) st.italic = false;
    else if (n === 24) st.underline = false;
    else if (n === 27) st.reverse = false;
    else if (n >= 30 && n <= 37) st.fg = { kind: 'named', index: n - 30 };
    else if (n === 38) {
      if (parts[i + 1] === '5' && i + 2 < parts.length) { st.fg = index256ToColor(parseInt(parts[i + 2], 10) || 0); i += 2; }
      else if (parts[i + 1] === '2' && i + 4 < parts.length) { st.fg = { kind: 'rgb', r: clampByte(parts[i + 2]), g: clampByte(parts[i + 3]), b: clampByte(parts[i + 4]) }; i += 4; }
    }
    else if (n === 39) st.fg = DEFAULT;
    else if (n >= 40 && n <= 47) st.bg = { kind: 'named', index: n - 40 };
    else if (n === 48) {
      if (parts[i + 1] === '5' && i + 2 < parts.length) { st.bg = index256ToColor(parseInt(parts[i + 2], 10) || 0); i += 2; }
      else if (parts[i + 1] === '2' && i + 4 < parts.length) { st.bg = { kind: 'rgb', r: clampByte(parts[i + 2]), g: clampByte(parts[i + 3]), b: clampByte(parts[i + 4]) }; i += 4; }
    }
    else if (n === 49) st.bg = DEFAULT;
    else if (n >= 90 && n <= 97) st.fg = { kind: 'named', index: 8 + (n - 90) };
    else if (n >= 100 && n <= 107) st.bg = { kind: 'named', index: 8 + (n - 100) };
    // any other code: ignored (e.g. 2 dim, 5 blink) — matches the Rust default arm
    i += 1;
  }
}

/**
 * Parse ANSI text into styled runs. Non-SGR escape sequences (cursor moves, erase,
 * OSC, etc.) are skipped. Never throws on malformed input.
 */
export function parseAnsi(input: string): AnsiRun[] {
  const text = normalizeEscapes(input ?? '');
  const runs: AnsiRun[] = [];
  const st = freshState();
  let buf = '';
  const flush = () => {
    if (buf.length === 0) return;
    runs.push({ text: buf, fg: st.fg, bg: st.bg, bold: st.bold, italic: st.italic, underline: st.underline, reverse: st.reverse });
    buf = '';
  };
  const ESC = '\x1b';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === ESC && text[i + 1] === '[') {
      // CSI: collect params until a final byte (0x40-0x7e).
      let j = i + 2;
      let params = '';
      while (j < text.length) {
        const code = text.charCodeAt(j);
        if (code >= 0x40 && code <= 0x7e) break;
        params += text[j];
        j++;
      }
      const finalByte = text[j];
      if (finalByte === 'm') { flush(); applySgr(st, params.split(';')); }
      // other final bytes (cursor/erase/scroll): ignore, but consume the sequence
      i = j + 1;
      continue;
    }
    if (c === ESC) {
      // Lone ESC or a non-CSI escape (e.g. OSC `ESC ]`): drop the ESC; the body
      // renders as text. Docs frames don't rely on these; this keeps us robust.
      i += 1;
      continue;
    }
    buf += c;
    i += 1;
  }
  flush();
  return runs;
}
