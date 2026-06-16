// ============================================================================
// SyntaxColor - Types & Interfaces
// ============================================================================

import React from 'react';

// ---------------------------------------------------------------------------
// Monarch Language Definition (Monaco-compatible subset)
// ---------------------------------------------------------------------------

/** Action taken when a Monarch rule matches */
export interface MonarchAction {
  /** Token type to assign (e.g. 'keyword', 'comment', 'string') */
  token: string;
  /** State to transition to */
  next?: string;
  /** Push current state and switch to another */
  switchTo?: string;
  /** Go back N characters */
  goBack?: number;
  /** Log message (debug) */
  log?: string;
}

/**
 * A single Monarch tokenizer rule.
 * Can be:
 * - [regex, tokenType]
 * - [regex, tokenType, nextState]
 * - [regex, MonarchAction]
 * - { include: stateName } to include rules from another state
 */
export type MonarchRule =
  | [RegExp | string, string | MonarchAction]
  | [RegExp | string, string | MonarchAction, string]
  | { include: string };

/**
 * Monarch-compatible language definition.
 * Designed for drop-in compatibility with Monaco Editor language definitions.
 */
export interface MonarchLanguage {
  /** Default token type for unmatched text */
  defaultToken?: string;
  /** Token postfix (appended to all token names) */
  tokenPostfix?: string;
  /** List of keywords (referenced as @keywords in rules) */
  keywords?: string[];
  /** List of type keywords */
  typeKeywords?: string[];
  /** List of operators */
  operators?: string[];
  /** List of built-in constants */
  builtins?: string[];
  /** Symbol pattern for operator matching */
  symbols?: RegExp;
  /** Escape sequence pattern */
  escapes?: RegExp;
  /** Digit patterns */
  digits?: RegExp;
  /** Tokenizer rules grouped by state */
  tokenizer: Record<string, MonarchRule[]>;
  /** Whether the language ignores case */
  ignoreCase?: boolean;
  /** Brackets definition for matching */
  brackets?: Array<{ open: string; close: string; token: string }>;
}

// ---------------------------------------------------------------------------
// Token & Line Types
// ---------------------------------------------------------------------------

/** A single token produced by the tokenizer */
export interface SyntaxToken {
  /** The text content of this token */
  text: string;
  /** The token type (e.g. 'keyword', 'string', 'comment') */
  type: string;
}

/** A tokenized line of source code */
export interface TokenizedLine {
  /** Line number (1-based) */
  lineNumber: number;
  /** Tokens making up this line */
  tokens: SyntaxToken[];
  /** Raw text of the line */
  text: string;
}

// ---------------------------------------------------------------------------
// Feature Types
// ---------------------------------------------------------------------------

/** A foldable region in the source code */
export interface FoldRegion {
  /** Start line (1-based, inclusive) */
  startLine: number;
  /** End line (1-based, inclusive) */
  endLine: number;
  /** Indentation level that triggered this fold */
  indent: number;
}

/** Diff change type for a line */
export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

/** Per-line diff information */
export interface LineDiffInfo {
  /** 1-based line number */
  lineNumber: number;
  /** Type of change */
  type: DiffChangeType;
}

/** Diagnostic severity level */
export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

/** Inline diagnostic annotation for a specific line (like VS Code inline errors/warnings) */
export interface LineDiagnostic {
  /** 1-based line number */
  lineNumber: number;
  /** Severity of the diagnostic */
  severity: DiagnosticSeverity;
  /** Diagnostic message text displayed inline after the code */
  message: string;
  /** Optional source identifier (e.g. 'ts', 'eslint') */
  source?: string;
  /** 1-based start column for the squiggly underline (inclusive) */
  startColumn?: number;
  /** 1-based end column for the squiggly underline (exclusive) */
  endColumn?: number;
}

/** Margin icon decorator for a specific line */
export interface MarginDecoratorItem {
  /** 1-based line number */
  lineNumber: number;
  /** Icon to render (ReactNode — typically an SVG or emoji) */
  icon: React.ReactNode;
  /** Tooltip text for the icon */
  tooltip?: string;
  /** Click handler */
  onClick?: (lineNumber: number) => void;
  /** Color override (defaults to theme text.secondary) */
  color?: string;
}

/** Outline entry for the code structure panel */
export interface OutlineEntry {
  /** Unique id */
  id: string;
  /** Display label (e.g. function name) */
  label: string;
  /** Entry kind for icon selection */
  kind: 'function' | 'class' | 'interface' | 'variable' | 'import' | 'property' | 'method' | 'enum' | 'type' | 'other';
  /** 1-based line number */
  lineNumber: number;
  /** Nesting depth (0 = top level) */
  depth: number;
  /** Child entries */
  children?: OutlineEntry[];
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

/** Size variants for the SyntaxColor component */
export type SyntaxColorSize = 'small' | 'normal' | 'large';

/** Props for the SyntaxColor component */
export interface SyntaxColorProps {
  /** Source code to display */
  code: string;

  /** Monarch language definition for tokenization */
  language: MonarchLanguage;

  /** Size variant */
  size?: SyntaxColorSize;

  // --- Optional features ---

  /** Show line numbers in the gutter */
  showLineNumbers?: boolean;

  /** Show indent guide lines (vertical scope indicators) */
  showIndentGuides?: boolean;

  /** Enable scope folding */
  showFolding?: boolean;

  /** Externally controlled collapsed fold regions (line numbers of fold starts) */
  collapsedLines?: number[];

  /** Called when a fold region is toggled */
  onFoldToggle?: (startLine: number, collapsed: boolean) => void;

  /** Margin icon decorators */
  decorators?: MarginDecoratorItem[];

  /** Git-diff information per line */
  diffInfo?: LineDiffInfo[];

  /** Alternate (zebra-stripe) line background coloring */
  alternateLineColor?: boolean;

  /** Starting line number (default 1) — useful for showing code excerpts */
  startLineNumber?: number;

  /** Highlighted line numbers (e.g. current execution line) */
  highlightedLines?: number[];

  /** Custom token-to-color mapping override */
  tokenColorMap?: Record<string, string>;

  /** Max height before scrolling (default: none — grows to fit) */
  maxHeight?: number | string;

  /** Whether to wrap long lines */
  wordWrap?: boolean;

  /** Tab size for rendering (default 4) */
  tabSize?: number;

  /** Number of blank trailing lines after the code (default 0) */
  trailingLines?: number;

  /** Inline diagnostic annotations (errors, warnings displayed after the code) */
  diagnostics?: LineDiagnostic[];

  /** Show the minimap on the right side */
  showMinimap?: boolean;

  /** Line click handler */
  onLineClick?: (lineNumber: number) => void;

  /** Standard style/className */
  style?: React.CSSProperties;
  className?: string;
}

/** Props for the internal SyntaxColorLine component */
export interface SyntaxColorLineProps {
  /** Tokens for this line */
  tokens: SyntaxToken[];
  /** Raw text of the line (for indent guide calculation) */
  text: string;
  /** Whether this is an alternate-colored line */
  isAlternate: boolean;
  /** Whether this line is highlighted */
  isHighlighted: boolean;
  /** Diff type for this line */
  diffType?: DiffChangeType;
  /** Token-to-color map (resolved from theme) */
  colorMap: Record<string, string>;
  /** Tab size */
  tabSize: number;
  /** Word wrap */
  wordWrap: boolean;
  /** Font size */
  fontSize: number;
  /** Click handler */
  onClick?: () => void;
  /** Background colors from theme */
  bgPrimary: string;
  bgSecondary: string;
  bgHighlight: string;
  /** Diff background colors */
  diffAddedBg: string;
  diffRemovedBg: string;
  diffModifiedBg: string;
  /** Whether this line is a collapsed fold start (show … indicator) */
  isCollapsed: boolean;
  /** Color for the collapse indicator */
  collapsedIndicatorColor: string;
  /** Background color for collapsed fold-start lines (VS Code-style tint) */
  collapsedBg: string;
  /** Show indent guide lines */
  showIndentGuides: boolean;
  /** Cycling colors for indent guide lines (bracket-pair style) */
  indentGuideColors: string[];
  /** Pre-computed effective indent level (carries through blank lines) */
  effectiveIndentLevel: number;
  /** Detected indent size in spaces (auto-detected from source code) */
  indentSize: number;
  /** Character width in px (for indent positioning) */
  charWidth: number;
  /** Inline diagnostic for this line (if any) */
  diagnostic?: LineDiagnostic;
  /** Background colors for diagnostic severities */
  diagnosticErrorBg: string;
  diagnosticWarningBg: string;
  diagnosticInfoBg: string;
  diagnosticHintBg: string;
  /** Text colors for diagnostic messages */
  diagnosticErrorColor: string;
  diagnosticWarningColor: string;
  diagnosticInfoColor: string;
  diagnosticHintColor: string;
}

/** Props for the Gutter sub-component */
export interface GutterProps {
  /** Actual visible line numbers in display order (e.g. [1, 2, 3, 8, 9, 10] when 4-7 are folded) */
  visibleLineNumbers: number[];
  /** Number of trailing blank lines after code */
  trailingLineCount: number;
  /** Whether to show line numbers */
  showLineNumbers: boolean;
  /** Whether to show fold markers */
  showFolding: boolean;
  /** Fold regions detected in the code */
  foldRegions: FoldRegion[];
  /** Currently collapsed fold start lines */
  collapsedLines: Set<number>;
  /** Toggle fold callback */
  onFoldToggle: (startLine: number) => void;
  /** Margin decorators */
  decorators: MarginDecoratorItem[];
  /** Diff info per line */
  diffInfo: Map<number, DiffChangeType>;
  /** Highlighted lines */
  highlightedLines: Set<number>;
  /** Alternate coloring */
  alternateLineColor: boolean;
  /** Size config */
  fontSize: number;
  lineHeight: number;
  /** Line click */
  onLineClick?: (lineNumber: number) => void;
}

/** Props for the OutlineView sub-component */
export interface OutlineViewProps {
  /** Outline entries */
  entries: OutlineEntry[];
  /** Callback when an entry is clicked (navigates to line) */
  onEntryClick: (lineNumber: number) => void;
  /** Currently active/visible line number */
  activeLineNumber?: number;
  /** Font size */
  fontSize: number;
}

/** Props for the Minimap sub-component */
export interface MinimapProps {
  /** All tokenized lines (visible) */
  lines: TokenizedLine[];
  /** Token color map */
  colorMap: Record<string, string>;
  /** Background color */
  bgColor: string;
  /** Total visible height of the code viewport */
  viewportHeight: number;
  /** Current scroll top */
  scrollTop: number;
  /** Line height in the main view */
  lineHeight: number;
  /** Font size of the main view */
  fontSize: number;
  /** Called when user clicks/drags on minimap to scroll */
  onScrollTo: (scrollTop: number) => void;
  /** Diff info */
  diffInfo: Map<number, DiffChangeType>;
  /** Theme for colors */
  borderColor: string;
  viewportIndicatorColor: string;
}
