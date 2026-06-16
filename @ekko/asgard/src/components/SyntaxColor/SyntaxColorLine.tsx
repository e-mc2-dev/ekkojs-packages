// ============================================================================
import { escapeSvgAttr } from '../../_internal';
// SyntaxColorLine — Renders a single line of tokenized code
// Includes optional indent guide lines (vertical scope indicators)
// ============================================================================

import React from 'react';
import type { SyntaxColorLineProps, DiagnosticSeverity } from './types';
import { resolveTokenColor } from './tokenTheme';

/** Renders tab characters as spaces of the given tab size */
function renderText(text: string, tabSize: number): string {
  return text.replace(/\t/g, ' '.repeat(tabSize));
}

/**
 * Generates a squiggly SVG data URL for use as background-image.
 * The wave pattern repeats horizontally.
 */
function squigglyBackground(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3' viewBox='0 0 6 3'><path d='M0 2.5 Q1.5 0 3 2.5 Q4.5 5 6 2.5' fill='none' stroke='${escapeSvgAttr(color)}' stroke-width='1'/></svg>`;
  // URL-encode the SVG so the hex stroke color's '#' (and <,>,spaces) don't break the data URL.
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const SyntaxColorLine: React.FC<SyntaxColorLineProps> = ({
  tokens,
  text: _text,
  isAlternate,
  isHighlighted,
  diffType,
  colorMap,
  tabSize,
  wordWrap,
  fontSize,
  onClick,
  bgPrimary,
  bgSecondary,
  bgHighlight,
  diffAddedBg,
  diffRemovedBg,
  diffModifiedBg,
  isCollapsed,
  collapsedIndicatorColor,
  collapsedBg,
  showIndentGuides,
  indentGuideColors,
  effectiveIndentLevel,
  indentSize,
  charWidth,
  diagnostic,
  diagnosticErrorBg,
  diagnosticWarningBg,
  diagnosticInfoBg,
  diagnosticHintBg,
  diagnosticErrorColor,
  diagnosticWarningColor,
  diagnosticInfoColor,
  diagnosticHintColor,
}) => {
  // Diagnostic color lookups
  const diagnosticBgMap: Record<DiagnosticSeverity, string> = {
    error: diagnosticErrorBg,
    warning: diagnosticWarningBg,
    info: diagnosticInfoBg,
    hint: diagnosticHintBg,
  };
  const diagnosticColorMap: Record<DiagnosticSeverity, string> = {
    error: diagnosticErrorColor,
    warning: diagnosticWarningColor,
    info: diagnosticInfoColor,
    hint: diagnosticHintColor,
  };

  // Determine background color (priority: diagnostic > diff > highlight > alternate > base)
  let backgroundColor = bgPrimary;
  if (isAlternate) backgroundColor = bgSecondary;
  if (isHighlighted) backgroundColor = bgHighlight;
  if (diffType === 'added') backgroundColor = diffAddedBg;
  if (diffType === 'removed') backgroundColor = diffRemovedBg;
  if (diffType === 'modified') backgroundColor = diffModifiedBg;
  if (isCollapsed) backgroundColor = collapsedBg;
  if (diagnostic) backgroundColor = diagnosticBgMap[diagnostic.severity];

  const lineHeight = Math.round(fontSize * 1.6);

  // Squiggly underline positioning
  const hasSquiggly = diagnostic && diagnostic.startColumn !== undefined && diagnostic.endColumn !== undefined;
  const squigglyLeft = hasSquiggly ? (diagnostic.startColumn! - 1) * charWidth : 0;
  const squigglyWidth = hasSquiggly ? (diagnostic.endColumn! - diagnostic.startColumn!) * charWidth : 0;

  const PADDING_LEFT = 6;

  const lineStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    minHeight: `${lineHeight}px`,
    lineHeight: `${lineHeight}px`,
    backgroundColor,
    cursor: onClick ? 'pointer' : 'default',
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: wordWrap ? 'break-all' : 'normal',
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: `${fontSize}px`,
    paddingLeft: `${PADDING_LEFT}px`,
    paddingRight: '16px',
  };

  return (
    <div
      style={lineStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Indent guides — one absolute div per level */}
      {showIndentGuides && effectiveIndentLevel > 0 &&
        Array.from({ length: effectiveIndentLevel }, (_, i) => (
          <div
            key={`g${i}`}
            style={{
              position: 'absolute',
              left: PADDING_LEFT + i * indentSize * charWidth,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: indentGuideColors[i % indentGuideColors.length],
              pointerEvents: 'none',
            }}
          />
        ))
      }

      {/* Squiggly underline for diagnostic range */}
      {hasSquiggly && squigglyWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${PADDING_LEFT + squigglyLeft}px`,
            bottom: '1px',
            width: `${squigglyWidth}px`,
            height: '3px',
            backgroundImage: squigglyBackground(diagnosticColorMap[diagnostic.severity]),
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Token spans */}
      {tokens.map((token, i) => (
        <span
          key={i}
          style={{
            color: resolveTokenColor(token.type, colorMap, colorMap['source'] || bgPrimary),
          }}
        >
          {renderText(token.text, tabSize)}
        </span>
      ))}

      {/* Collapsed fold indicator */}
      {isCollapsed && (
        <span style={{
          marginLeft: '4px',
          padding: '0 4px',
          borderRadius: '3px',
          border: `1px solid ${collapsedIndicatorColor}`,
          color: collapsedIndicatorColor,
          fontSize: `${fontSize - 2}px`,
          lineHeight: `${fontSize + 2}px`,
          cursor: 'default',
          flexShrink: 0,
          opacity: 0.8,
        }}>
          {'\u2026'}
        </span>
      )}

      {/* Ensure empty lines have height */}
      {tokens.length === 0 || (tokens.length === 1 && tokens[0].text === '') ? (
        <span>{'\u00A0'}</span>
      ) : null}

      {/* Inline diagnostic message */}
      {diagnostic && (
        <span style={{
          marginLeft: '16px',
          paddingLeft: '8px',
          paddingRight: '8px',
          borderRadius: '2px',
          backgroundColor: diagnosticBgMap[diagnostic.severity],
          color: diagnosticColorMap[diagnostic.severity],
          fontSize: `${fontSize - 1}px`,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {diagnostic.source ? `${diagnostic.source}: ` : ''}{diagnostic.message}
        </span>
      )}
    </div>
  );
};
