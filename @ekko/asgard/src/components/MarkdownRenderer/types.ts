// ============================================================================
// MarkdownRenderer - Types & Interfaces
// ============================================================================

import React from 'react';

/** Size variants for the MarkdownRenderer */
export type MarkdownRendererSize = 'small' | 'normal' | 'large';

/** A parsed markdown node */
export type MarkdownNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'blockquote'; children: MarkdownNode[] }
  | { type: 'code_block'; language: string; code: string }
  | { type: 'unordered_list'; items: ListItemNode[] }
  | { type: 'ordered_list'; start: number; items: ListItemNode[] }
  | { type: 'horizontal_rule' }
  | { type: 'table'; headers: InlineNode[][]; rows: InlineNode[][][] };

/** A list item containing inline nodes */
export interface ListItemNode {
  children: InlineNode[];
}

/** Inline content nodes */
export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'bold_italic'; children: InlineNode[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'strikethrough'; children: InlineNode[] }
  | { type: 'line_break' };

/** Props for the MarkdownRenderer component */
export interface MarkdownRendererProps {
  /** Markdown source text */
  markdown: string;

  /** Size variant */
  size?: MarkdownRendererSize;

  /** Whether to render code blocks with SyntaxColor (requires language definitions) */
  syntaxHighlight?: boolean;

  /** Show a copy-to-clipboard button on highlighted code blocks. Default false. */
  codeCopyButton?: boolean;

  /** Open images in a full-screen, zoomable lightbox on click (LinkedIn-style). Default false. */
  imageLightbox?: boolean;

  /** Override token colors for code blocks (merged over the theme defaults, e.g. `{ comment: "#6b8fb5" }`). */
  codeColorMap?: Record<string, string>;

  /** Custom link click handler (prevents default navigation when provided) */
  onLinkClick?: (href: string) => void;

  /** Standard style/className */
  style?: React.CSSProperties;
  className?: string;
}
