// ============================================================================
// SyntaxColor — Main syntax highlighting component
// ============================================================================

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';
import type { SyntaxColorProps, SyntaxColorSize, FoldRegion, DiffChangeType, LineDiagnostic } from './types';
import { compileLanguage, tokenize } from './monarchTokenizer';
import type { CompiledLanguage } from './monarchTokenizer';
import { buildTokenColorMap } from './tokenTheme';
import { detectFoldRegions, getHiddenLines } from './foldingDetector';
import { SyntaxColorLine } from './SyntaxColorLine';
import { Gutter } from './Gutter';
import { Minimap } from './Minimap';

/** Size configuration */
const sizeConfig: Record<SyntaxColorSize, { fontSize: number; lineHeight: number }> = {
  small: { fontSize: 11, lineHeight: 18 },
  normal: { fontSize: 13, lineHeight: 21 },
  large: { fontSize: 15, lineHeight: 24 },
};

/** Approximate character width multiplier for monospace fonts */
const CHAR_WIDTH_RATIO = 0.6;

/** Adds alpha to a hex color */
function addAlpha(hex: string, alpha: number): string {
  if (hex === 'transparent') return hex;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Clipboard fallback for non-secure contexts where navigator.clipboard is unavailable. */
function fallbackCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** Severity rank for priority when multiple diagnostics on same line */
function severityRank(severity: string): number {
  switch (severity) {
    case 'error': return 4;
    case 'warning': return 3;
    case 'info': return 2;
    case 'hint': return 1;
    default: return 0;
  }
}

export const SyntaxColor: React.FC<SyntaxColorProps> = ({
  code,
  language,
  size = 'normal',
  showLineNumbers = false,
  showIndentGuides = false,
  showFolding = false,
  collapsedLines: controlledCollapsedLines,
  onFoldToggle,
  decorators = [],
  diffInfo = [],
  alternateLineColor = false,
  startLineNumber = 1,
  highlightedLines = [],
  tokenColorMap: customColorMap,
  maxHeight,
  wordWrap = false,
  tabSize = 4,
  trailingLines = 0,
  diagnostics = [],
  showMinimap = false,
  showCopyButton = false,
  onLineClick,
  style,
  className,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  // The copy button sits dim until the pointer is over the code block, then fades in (fast).
  const [hovered, setHovered] = useState(false);

  // Copy the ORIGINAL source (not the tokenized DOM) to the clipboard.
  const handleCopy = useCallback(() => {
    const done = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code) && done());
        return;
      }
    } catch { /* fall through */ }
    if (fallbackCopy(code)) done();
  }, [code]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const charMeasureRef = useRef<HTMLSpanElement>(null);
  const config = sizeConfig[size];
  const fallbackCharWidth = config.fontSize * CHAR_WIDTH_RATIO;

  // Measure actual monospace character width from the DOM
  const [measuredCharWidth, setMeasuredCharWidth] = useState(0);
  const charWidth = measuredCharWidth || fallbackCharWidth;

  // Track scroll position for minimap
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(300);

  useEffect(() => {
    // Measure character width
    const measureEl = charMeasureRef.current;
    if (measureEl) {
      setMeasuredCharWidth(measureEl.getBoundingClientRect().width / 10);
    }

    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    // Measure viewport height
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      ro.disconnect();
    };
  }, []);

  // Compile language once
  const compiled: CompiledLanguage = useMemo(
    () => compileLanguage(language),
    [language]
  );

  // Tokenize
  const tokenizedLines = useMemo(
    () => tokenize(code, compiled, startLineNumber),
    [code, compiled, startLineNumber]
  );

  // Token color map
  const colorMap = useMemo(() => {
    const base = buildTokenColorMap(theme);
    return customColorMap ? { ...base, ...customColorMap } : base;
  }, [theme, customColorMap]);

  // Fold regions
  const foldRegions: FoldRegion[] = useMemo(() => {
    if (!showFolding) return [];
    return detectFoldRegions(code.split('\n'), tabSize);
  }, [code, tabSize, showFolding]);

  // Collapsed lines (controlled/uncontrolled)
  const [internalCollapsed, setInternalCollapsed] = useState<Set<number>>(new Set());
  const collapsedSet = useMemo(() => {
    if (controlledCollapsedLines !== undefined) return new Set(controlledCollapsedLines);
    return internalCollapsed;
  }, [controlledCollapsedLines, internalCollapsed]);

  const handleFoldToggle = useCallback((startLine: number) => {
    const nowCollapsed = !collapsedSet.has(startLine);
    if (controlledCollapsedLines === undefined) {
      setInternalCollapsed(prev => {
        const next = new Set(prev);
        if (nowCollapsed) next.add(startLine);
        else next.delete(startLine);
        return next;
      });
    }
    onFoldToggle?.(startLine, nowCollapsed);
  }, [collapsedSet, controlledCollapsedLines, onFoldToggle]);

  // Hidden lines from folding
  const hiddenLines = useMemo(
    () => getHiddenLines(foldRegions, collapsedSet),
    [foldRegions, collapsedSet]
  );

  // Diff info map
  const diffMap = useMemo(() => {
    const m = new Map<number, DiffChangeType>();
    for (const d of diffInfo) m.set(d.lineNumber, d.type);
    return m;
  }, [diffInfo]);

  // Highlighted lines set
  const highlightedSet = useMemo(() => new Set(highlightedLines), [highlightedLines]);

  // Diagnostic map (line number -> first diagnostic for that line)
  const diagnosticMap = useMemo(() => {
    const m = new Map<number, LineDiagnostic>();
    for (const d of diagnostics) {
      // Keep the highest severity per line (error > warning > info > hint)
      const existing = m.get(d.lineNumber);
      if (!existing || severityRank(d.severity) > severityRank(existing.severity)) {
        m.set(d.lineNumber, d);
      }
    }
    return m;
  }, [diagnostics]);

  // Filter visible lines (skip hidden from folding)
  const visibleLines = useMemo(
    () => tokenizedLines.filter(l => !hiddenLines.has(l.lineNumber)),
    [tokenizedLines, hiddenLines]
  );

  // Auto-detect indent size: find the most common indentation difference
  // between adjacent non-blank lines (ignores comment formatting oddities)
  const detectedIndentSize = useMemo(() => {
    const lines = code.split('\n');
    const diffs = new Map<number, number>(); // diff -> count
    let prevIndent = 0;
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      let spaces = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') spaces++;
        else if (line[i] === '\t') spaces += tabSize;
        else break;
      }
      const diff = Math.abs(spaces - prevIndent);
      if (diff >= 2) {
        diffs.set(diff, (diffs.get(diff) || 0) + 1);
      }
      prevIndent = spaces;
    }
    // Pick the most frequent difference
    let best = tabSize;
    let bestCount = 0;
    for (const [diff, count] of diffs) {
      if (count > bestCount) { best = diff; bestCount = count; }
    }
    return best >= 2 && best <= 8 ? best : tabSize;
  }, [code, tabSize]);

  // Compute effective indent levels (blank lines inherit from surrounding context)
  const effectiveIndentLevels = useMemo(() => {
    if (!showIndentGuides) return [];
    const indentUnit = detectedIndentSize;
    const levels: number[] = visibleLines.map(l => {
      const text = l.text;
      if (text.trim().length === 0) return -1; // blank — to be filled
      let spaces = 0;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') spaces++;
        else if (text[i] === '\t') spaces += tabSize;
        else break;
      }
      return Math.floor(spaces / indentUnit);
    });
    // Fill blank lines: use the minimum of the nearest non-blank above and below
    for (let i = 0; i < levels.length; i++) {
      if (levels[i] !== -1) continue;
      let above = 0;
      for (let j = i - 1; j >= 0; j--) {
        if (levels[j] !== -1) { above = levels[j]; break; }
      }
      let below = 0;
      for (let j = i + 1; j < levels.length; j++) {
        if (levels[j] !== -1) { below = levels[j]; break; }
      }
      levels[i] = Math.min(above, below);
    }
    return levels;
  }, [visibleLines, showIndentGuides, tabSize, detectedIndentSize]);

  // Background colors
  const bgPrimary = theme.background.primary;
  const bgSecondary = theme.background.secondary;
  const bgHighlight = addAlpha(theme.accent.primary, 0.15);
  const diffAddedBg = addAlpha(theme.semantic.success, 0.15);
  const diffRemovedBg = addAlpha(theme.semantic.error, 0.15);
  const diffModifiedBg = addAlpha(theme.semantic.warning, 0.15);
  const collapsedBg = addAlpha(theme.text.disabled, 0.08);

  // Bracket-pair-style indent guide colors (3 cycling colors)
  const indentGuideColors = useMemo(() => [
    addAlpha(theme.accent.primary, 0.35),
    addAlpha(theme.semantic.warning, 0.35),
    addAlpha(theme.semantic.success, 0.35),
  ], [theme.accent.primary, theme.semantic.warning, theme.semantic.success]);

  // Diagnostic colors
  const diagnosticErrorBg = addAlpha(theme.semantic.error, 0.15);
  const diagnosticWarningBg = addAlpha(theme.semantic.warning, 0.15);
  const diagnosticInfoBg = addAlpha(theme.semantic.info, 0.15);
  const diagnosticHintBg = addAlpha(theme.text.disabled, 0.15);
  const diagnosticErrorColor = theme.semantic.error;
  const diagnosticWarningColor = theme.semantic.warning;
  const diagnosticInfoColor = theme.semantic.info;
  const diagnosticHintColor = theme.text.disabled;

  // Gutter visibility
  const showGutter = showLineNumbers || showFolding || decorators.length > 0 || diffInfo.length > 0;

  // Minimap scroll handler
  const handleMinimapScrollTo = useCallback((targetScrollTop: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = targetScrollTop;
    }
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    position: 'relative',
    border: `1px solid ${theme.border.default}`,
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: bgPrimary,
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    fontSize: `${config.fontSize}px`,
    lineHeight: `${config.lineHeight}px`,
    ...style,
  };

  const scrollContainerStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'auto',
    maxHeight: maxHeight !== undefined
      ? typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
      : undefined,
    position: 'relative',
  };

  return (
    <div
      style={containerStyle}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Copy-to-clipboard button (top-right, small inset). Copies the original source. */}
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          title={copied ? 'Copied' : 'Copy code'}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            padding: 0,
            cursor: 'pointer',
            // Dim until the code block is hovered (or after a copy, so the check is always visible).
            opacity: hovered || copied ? 1 : 0.25,
            color: copied ? theme.semantic.success : theme.text.secondary,
            backgroundColor: addAlpha(theme.background.secondary, 0.85),
            border: `1px solid ${theme.border.default}`,
            borderRadius: '4px',
            transition: 'opacity 0.12s ease, color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.background.tertiary; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = addAlpha(theme.background.secondary, 0.85); }}
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      )}

      {/* Hidden span to measure actual monospace character width */}
      <span
        ref={charMeasureRef}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'pre',
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: `${config.fontSize}px`,
        }}
      >{'0000000000'}</span>
      <div style={scrollContainerStyle} ref={scrollRef}>
        {/* Gutter (sticky on horizontal scroll) */}
        {showGutter && (
          <Gutter
            visibleLineNumbers={visibleLines.map(l => l.lineNumber)}
            trailingLineCount={trailingLines}
            showLineNumbers={showLineNumbers}
            showFolding={showFolding}
            foldRegions={foldRegions.filter(r => !hiddenLines.has(r.startLine))}
            collapsedLines={collapsedSet}
            onFoldToggle={handleFoldToggle}
            decorators={decorators.filter(d => !hiddenLines.has(d.lineNumber))}
            diffInfo={diffMap}
            highlightedLines={highlightedSet}
            alternateLineColor={alternateLineColor}
            fontSize={config.fontSize}
            lineHeight={config.lineHeight}
            onLineClick={onLineClick}
          />
        )}

        {/* Code lines */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {visibleLines.map((line, index) => (
            <SyntaxColorLine
              key={line.lineNumber}
              tokens={line.tokens}
              text={line.text}
              isAlternate={alternateLineColor && index % 2 === 1}
              isHighlighted={highlightedSet.has(line.lineNumber)}
              diffType={diffMap.get(line.lineNumber)}
              colorMap={colorMap}
              tabSize={tabSize}
              wordWrap={wordWrap}
              fontSize={config.fontSize}
              onClick={onLineClick ? () => onLineClick(line.lineNumber) : undefined}
              bgPrimary={bgPrimary}
              bgSecondary={bgSecondary}
              bgHighlight={bgHighlight}
              diffAddedBg={diffAddedBg}
              diffRemovedBg={diffRemovedBg}
              diffModifiedBg={diffModifiedBg}
              isCollapsed={collapsedSet.has(line.lineNumber)}
              collapsedIndicatorColor={theme.text.disabled}
              collapsedBg={collapsedBg}
              showIndentGuides={showIndentGuides}
              indentGuideColors={indentGuideColors}
              effectiveIndentLevel={effectiveIndentLevels[index] ?? 0}
              indentSize={detectedIndentSize}
              charWidth={charWidth}
              diagnostic={diagnosticMap.get(line.lineNumber)}
              diagnosticErrorBg={diagnosticErrorBg}
              diagnosticWarningBg={diagnosticWarningBg}
              diagnosticInfoBg={diagnosticInfoBg}
              diagnosticHintBg={diagnosticHintBg}
              diagnosticErrorColor={diagnosticErrorColor}
              diagnosticWarningColor={diagnosticWarningColor}
              diagnosticInfoColor={diagnosticInfoColor}
              diagnosticHintColor={diagnosticHintColor}
            />
          ))}
          {/* Trailing blank lines */}
          {trailingLines > 0 && (
            Array.from({ length: trailingLines }, (_, i) => (
              <div
                key={`trailing-${i}`}
                style={{
                  minHeight: `${config.lineHeight}px`,
                  lineHeight: `${config.lineHeight}px`,
                  paddingLeft: '6px',
                }}
              >
                {'\u00A0'}
              </div>
            ))
          )}
        </div>

        {/* Minimap (inside scroll container, sticky right) */}
        {showMinimap && (
          <Minimap
            lines={visibleLines}
            colorMap={colorMap}
            bgColor={bgPrimary}
            viewportHeight={viewportHeight}
            scrollTop={scrollTop}
            lineHeight={config.lineHeight}
            fontSize={config.fontSize}
            onScrollTo={handleMinimapScrollTo}
            diffInfo={diffMap}
            borderColor={theme.border.divider}
            viewportIndicatorColor={addAlpha(theme.text.primary, 0.1)}
          />
        )}
      </div>
    </div>
  );
};
