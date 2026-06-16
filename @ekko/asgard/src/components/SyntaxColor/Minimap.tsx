// ============================================================================
// Minimap — Pixel-rendering code overview (like VS Code)
// Positioned inside the scroll container as a sticky right overlay.
// Uses canvas for performance. Each character ~2px wide, each line ~3px tall.
// ============================================================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTheme } from '../../theme';
import type { MinimapProps, DiffChangeType } from './types';
import { resolveTokenColor } from './tokenTheme';

const CHAR_WIDTH = 2;
const LINE_HEIGHT = 3;
const MINIMAP_WIDTH = 60;

export const Minimap: React.FC<MinimapProps> = ({
  lines,
  colorMap,
  bgColor,
  viewportHeight,
  scrollTop,
  lineHeight: mainLineHeight,
  onScrollTo,
  diffInfo,
  borderColor,
  viewportIndicatorColor,
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalMinimapHeight = lines.length * LINE_HEIGHT;
  const displayHeight = Math.max(viewportHeight, 50);

  // How many main-view lines fit in the viewport
  const visibleLineCount = Math.floor(viewportHeight / mainLineHeight);
  // Viewport indicator height in minimap px
  const indicatorHeight = Math.max(visibleLineCount * LINE_HEIGHT, 12);
  // Scroll fraction
  const totalMainHeight = lines.length * mainLineHeight;
  const scrollFraction = totalMainHeight > viewportHeight
    ? scrollTop / (totalMainHeight - viewportHeight)
    : 0;
  const indicatorTop = scrollFraction * Math.max(0, totalMinimapHeight - indicatorHeight);

  // Render minimap canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasHeight = Math.max(totalMinimapHeight, displayHeight);
    canvas.width = MINIMAP_WIDTH * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, MINIMAP_WIDTH, canvasHeight);

    // Draw lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const y = i * LINE_HEIGHT;

      // Diff highlight
      const diff = diffInfo.get(line.lineNumber);
      if (diff && diff !== 'unchanged') {
        const diffColors: Record<DiffChangeType, string> = {
          added: theme.semantic.success,
          removed: theme.semantic.error,
          modified: theme.semantic.warning,
          unchanged: 'transparent',
        };
        ctx.fillStyle = diffColors[diff];
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, y, MINIMAP_WIDTH, LINE_HEIGHT);
        ctx.globalAlpha = 1;
      }

      // Draw token pixels
      let x = 0;
      for (const token of line.tokens) {
        if (token.type === 'white') {
          x += token.text.length * CHAR_WIDTH;
          continue;
        }
        const color = resolveTokenColor(token.type, colorMap, theme.text.primary);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        const w = token.text.length * CHAR_WIDTH;
        if (token.text.trim().length > 0) {
          ctx.fillRect(x, y + 0.5, Math.min(w, MINIMAP_WIDTH - x), LINE_HEIGHT - 1);
        }
        x += w;
        if (x >= MINIMAP_WIDTH) break;
      }
      ctx.globalAlpha = 1;
    }
  }, [lines, colorMap, bgColor, totalMinimapHeight, displayHeight, diffInfo, theme]);

  // Click/drag to scroll
  const handleMouseAction = useCallback((clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const y = clientY - rect.top;
    const lineIndex = Math.floor(y / LINE_HEIGHT);
    // Center the viewport on the clicked line
    const targetScroll = Math.max(0, lineIndex * mainLineHeight - viewportHeight / 2);
    onScrollTo(targetScroll);
  }, [mainLineHeight, viewportHeight, onScrollTo]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseAction(e.clientY);
  }, [handleMouseAction]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => handleMouseAction(e.clientY);
    const handleUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, handleMouseAction]);

  const canvasDisplayHeight = Math.max(totalMinimapHeight, displayHeight);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'sticky',
        right: 0,
        top: 0,
        alignSelf: 'flex-start',
        width: `${MINIMAP_WIDTH}px`,
        height: `${displayHeight}px`,
        flexShrink: 0,
        cursor: 'pointer',
        backgroundColor: bgColor,
        overflow: 'hidden',
        zIndex: 3,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Subtle left border */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: borderColor,
        pointerEvents: 'none',
      }} />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: `${MINIMAP_WIDTH}px`,
          height: `${canvasDisplayHeight}px`,
          display: 'block',
        }}
      />

      {/* Viewport indicator */}
      <div
        style={{
          position: 'absolute',
          top: `${indicatorTop}px`,
          left: 0,
          right: 0,
          height: `${indicatorHeight}px`,
          backgroundColor: viewportIndicatorColor,
          borderTop: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
