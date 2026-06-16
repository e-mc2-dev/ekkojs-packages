// ============================================================================
// Gutter — Line numbers, fold chevrons, diff indicators, decorators
// Layout: [diff] [decorator] [lineNumber] [fold chevron]
// Fold column shows only a chevron (▸/▾) on fold-start lines.
// ============================================================================

import React, { useCallback, useMemo } from 'react';
import { useTheme } from '../../theme';
import type { GutterProps, DiffChangeType, MarginDecoratorItem } from './types';

// ---------------------------------------------------------------------------
// SVG sub-components
// ---------------------------------------------------------------------------

/** Chevron icon (▸ collapsed / ▾ expanded) */
const FoldChevron: React.FC<{ collapsed: boolean; size: number; color: string }> = ({
  collapsed, size, color,
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: 'block' }}>
    {collapsed ? (
      <path d="M6 4l4 4-4 4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M4 6l4 4 4-4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

/** Diff color bar */
const DiffIndicator: React.FC<{ type: DiffChangeType; height: number; theme: ReturnType<typeof useTheme>['theme'] }> = ({
  type, height, theme,
}) => {
  const colors: Record<DiffChangeType, string> = {
    added: theme.semantic.success,
    removed: theme.semantic.error,
    modified: theme.semantic.warning,
    unchanged: 'transparent',
  };
  return (
    <div style={{ width: '3px', height: `${height}px`, backgroundColor: colors[type], borderRadius: '1px', flexShrink: 0 }} />
  );
};

// ---------------------------------------------------------------------------
// Main Gutter
// ---------------------------------------------------------------------------

export const Gutter: React.FC<GutterProps> = ({
  visibleLineNumbers,
  trailingLineCount,
  showLineNumbers,
  showFolding,
  foldRegions,
  collapsedLines,
  onFoldToggle,
  decorators,
  diffInfo,
  highlightedLines,
  alternateLineColor,
  fontSize,
  lineHeight,
  onLineClick,
}) => {
  const { theme } = useTheme();

  const decoratorMap = useMemo(() => {
    const m = new Map<number, MarginDecoratorItem>();
    for (const d of decorators) m.set(d.lineNumber, d);
    return m;
  }, [decorators]);

  // Build a set of fold-start line numbers for quick lookup
  const foldStartSet = useMemo(() => {
    const s = new Set<number>();
    for (const r of foldRegions) s.add(r.startLine);
    return s;
  }, [foldRegions]);

  const handleFoldClick = useCallback((startLine: number) => {
    onFoldToggle(startLine);
  }, [onFoldToggle]);

  const maxLineNum = visibleLineNumbers.length > 0
    ? Math.max(...visibleLineNumbers)
    : 1;
  const lineNumWidth = Math.max(String(maxLineNum).length * (fontSize * 0.6), 24);
  const foldColWidth = fontSize + 2;

  const hasDiff = diffInfo.size > 0;
  const hasDecorators = decorators.length > 0;
  const foldColor = theme.text.disabled;

  const gutterStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    userSelect: 'none',
    backgroundColor: theme.background.primary,
    position: 'sticky',
    left: 0,
    zIndex: 2,
  };

  const rows: React.ReactNode[] = [];

  // Render rows for actual visible code lines
  for (let i = 0; i < visibleLineNumbers.length; i++) {
    const lineNum = visibleLineNumbers[i];
    const isHighlighted = highlightedLines.has(lineNum);
    const isAlternate = alternateLineColor && i % 2 === 1;
    const decorator = decoratorMap.get(lineNum);
    const isFoldStart = foldStartSet.has(lineNum);
    const isCollapsed = isFoldStart && collapsedLines.has(lineNum);
    const diff = diffInfo.get(lineNum);

    let rowBg = 'transparent';
    if (isAlternate) rowBg = theme.background.tertiary;
    if (isHighlighted) rowBg = theme.interactive.selected;

    rows.push(
      <div
        key={lineNum}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: `${lineHeight}px`,
          backgroundColor: rowBg,
          gap: '2px',
          paddingLeft: '8px',
          paddingRight: '4px',
        }}
      >
        {/* Diff indicator */}
        {hasDiff && (
          <DiffIndicator
            type={diff || 'unchanged'}
            height={lineHeight - 4}
            theme={theme}
          />
        )}

        {/* Margin decorator */}
        {hasDecorators && (
          <div
            style={{
              width: `${fontSize}px`,
              height: `${fontSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: decorator?.onClick ? 'pointer' : 'default',
            }}
            onClick={decorator?.onClick ? () => decorator.onClick!(lineNum) : undefined}
            title={decorator?.tooltip}
          >
            {decorator ? (
              <span style={{ fontSize: `${fontSize - 2}px`, color: decorator.color || theme.text.secondary }}>
                {decorator.icon}
              </span>
            ) : null}
          </div>
        )}

        {/* Line number */}
        {showLineNumbers && (
          <div
            style={{
              width: `${lineNumWidth}px`,
              textAlign: 'right',
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`,
              color: isHighlighted ? theme.text.primary : theme.text.disabled,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              cursor: onLineClick ? 'pointer' : 'default',
            }}
            onClick={onLineClick ? () => onLineClick(lineNum) : undefined}
          >
            {lineNum}
          </div>
        )}

        {/* Fold column: only chevrons on fold-start lines */}
        {showFolding && (
          <div
            style={{
              width: `${foldColWidth}px`,
              height: `${lineHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: '2px',
              cursor: isFoldStart ? 'pointer' : 'default',
            }}
            onClick={isFoldStart ? () => handleFoldClick(lineNum) : undefined}
          >
            {isFoldStart && (
              <FoldChevron
                collapsed={isCollapsed}
                size={fontSize - 2}
                color={foldColor}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Render trailing blank rows
  for (let i = 0; i < trailingLineCount; i++) {
    rows.push(
      <div
        key={`trailing-${i}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: `${lineHeight}px`,
          gap: '2px',
          paddingLeft: '8px',
          paddingRight: '4px',
        }}
      >
        {hasDiff && <DiffIndicator type="unchanged" height={lineHeight - 4} theme={theme} />}
        {hasDecorators && <div style={{ width: `${fontSize}px`, height: `${fontSize}px`, flexShrink: 0 }} />}
        {showLineNumbers && (
          <div style={{ width: `${lineNumWidth}px`, height: `${lineHeight}px` }} />
        )}
        {showFolding && (
          <div style={{ width: `${foldColWidth}px`, height: `${lineHeight}px`, flexShrink: 0, marginLeft: '2px' }} />
        )}
      </div>
    );
  }

  return (
    <div style={gutterStyle}>
      {rows}
    </div>
  );
};
