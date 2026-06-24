// ============================================================================
// Terminal — types for the ANSI terminal renderer
// ============================================================================

export interface TerminalProps {
  /**
   * ANSI text to render. Accepts either real ESC bytes (`\x1b[..m`) or the
   * printable escape forms (`\e[..m`, `\x1b[..m`, `[..m`, `\033[..m`),
   * so captured terminal output and hand-authored docs both work.
   */
  content: string;
  /** Optional caption shown above the frame (e.g. a command line). */
  title?: string;
  /** Wrap long lines instead of horizontal scroll. Default: false (terminal frames are pre-formatted). */
  wrap?: boolean;
  /** Extra class name on the root element. */
  className?: string;
  /** Accessible label for the rendered frame. Default: "terminal output". */
  ariaLabel?: string;
}

/** A resolved-but-abstract terminal color (kept theme/palette-independent so parsing is pure). */
export type AnsiColor =
  | { kind: 'default' }
  | { kind: 'named'; index: number }            // 0..15 (the 16-color palette)
  | { kind: 'rgb'; r: number; g: number; b: number };

/** A run of text sharing one set of SGR attributes. */
export interface AnsiRun {
  text: string;
  fg: AnsiColor;
  bg: AnsiColor;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  reverse: boolean;
}
