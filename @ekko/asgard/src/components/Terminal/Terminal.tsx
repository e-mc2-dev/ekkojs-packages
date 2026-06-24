// ============================================================================
// Terminal — renders ANSI/SGR text as a styled, theme-aware terminal frame.
// Used by MarkdownRenderer for ```ansi fenced code blocks (CLI/TUI docs).
// SSR-safe: pure render, no DOM access.
// ============================================================================

import React, { useMemo } from 'react';
import { useTheme } from '../../theme';
import type { TerminalProps, AnsiColor } from './types';
import { parseAnsi } from './ansi';

/**
 * Fixed 16-color palette (terminals have a fixed palette, independent of the site
 * theme). Matches a standard integrated-terminal palette so output reads as a terminal.
 */
const PALETTE: string[] = [
  '#000000', '#cd3131', '#0dbc79', '#e5e510', '#2472c8', '#bc3fbc', '#11a8cd', '#e5e5e5',
  '#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff',
];

// A console-grade monospace stack: prefer the OS terminal font, then fonts with full-cell box-drawing
// and block glyphs (so │ ─ ┌ █ ░ connect cleanly), falling back to the generic monospace.
const MONO = "ui-monospace, 'Cascadia Code', 'Cascadia Mono', 'SF Mono', 'DejaVu Sans Mono', Menlo, Consolas, monospace";

function colorToCss(c: AnsiColor): string | null {
  if (c.kind === 'default') return null;
  if (c.kind === 'named') return PALETTE[c.index] ?? null;
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

export function Terminal({ content, title, wrap = false, className, ariaLabel = 'terminal output' }: TerminalProps) {
  const { theme } = useTheme();
  const runs = useMemo(() => parseAnsi(content ?? ''), [content]);

  const blockBg = theme.background.secondary;
  const defaultFg = theme.text.primary;

  return (
    <div
      className={'ek-terminal' + (className ? ' ' + className : '')}
      role="img"
      aria-label={ariaLabel}
      style={{
        background: blockBg,
        border: `1px solid ${theme.border.default}`,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {title ? (
        <div
          style={{
            padding: '6px 10px',
            fontFamily: MONO,
            fontSize: 12,
            color: theme.text.secondary,
            background: theme.background.tertiary,
            borderBottom: `1px solid ${theme.border.default}`,
          }}
        >
          {title}
        </div>
      ) : null}
      <pre
        style={{
          margin: 0,
          padding: '10px 12px',
          whiteSpace: wrap ? 'pre-wrap' : 'pre',
          overflowX: wrap ? 'visible' : 'auto',
          fontFamily: MONO,
          fontSize: 13,
          // Tight line box so box-drawing (│ ┌ └) and block glyphs connect vertically with no gap,
          // the way a real terminal stacks rows. 1.5 left visible gaps between lines.
          lineHeight: 1.2,
          color: defaultFg,
          tabSize: 4,
        }}
      >
        {runs.map((run, idx) => {
          let fg = run.fg.kind === 'default' ? defaultFg : (colorToCss(run.fg) ?? defaultFg);
          let bg = colorToCss(run.bg); // null when default (block background shows through)
          if (run.reverse) {
            const newFg = bg ?? blockBg;
            const newBg = fg;
            fg = newFg;
            bg = newBg;
          }
          const style: React.CSSProperties = { color: fg };
          if (bg) style.background = bg;
          if (run.bold) style.fontWeight = 700;
          if (run.italic) style.fontStyle = 'italic';
          if (run.underline) style.textDecoration = 'underline';
          return (
            <span key={idx} style={style}>
              {run.text}
            </span>
          );
        })}
      </pre>
    </div>
  );
}
