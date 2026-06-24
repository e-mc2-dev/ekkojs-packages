// ============================================================================
// Terminal — Barrel Export
// ============================================================================

export { Terminal } from './Terminal';
export type { TerminalProps, AnsiColor, AnsiRun } from './types';
export { parseAnsi, normalizeEscapes, index256ToColor } from './ansi';
