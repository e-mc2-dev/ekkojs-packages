import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../theme';
import { SDiv } from '../components/SDiv/SDiv';

interface CollapsiblePanelProps {
  title: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  height?: number;
  onHeightChange?: (height: number) => void;
  minHeight?: number;
  maxHeight?: number;
  children?: ReactNode;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  expanded: controlledExpanded,
  onExpandedChange,
  height: controlledHeight,
  onHeightChange,
  minHeight = 100,
  maxHeight = 600,
  children
}) => {
  const { theme } = useTheme();
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [internalHeight, setInternalHeight] = useState(200);
  const [isAnimating, setIsAnimating] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const animationTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const height = controlledHeight !== undefined ? controlledHeight : internalHeight;

  const handleHeaderClick = () => {
    const newExpanded = !isExpanded;

    // Start animation
    setIsAnimating(true);

    // Clear any existing timer
    if (animationTimer.current !== null) {
      window.clearTimeout(animationTimer.current);
    }

    // Reset animation state after 100ms
    animationTimer.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimer.current = null;
    }, 100);

    if (onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!isExpanded || !containerRef.current || !resizeHandleRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    isResizingRef.current = true;
    startY.current = e.clientY;
    startHeight.current = height;

    // Disable transition during resize for smooth performance
    const container = containerRef.current;
    const resizeHandle = resizeHandleRef.current;
    const originalTransition = container.style.transition;
    container.style.transition = 'none';

    // Set resize handle color using DOM
    resizeHandle.style.backgroundColor = theme.accent.primary;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY.current;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.current + delta));

      // Direct DOM manipulation - no React re-render
      const totalHeight = newHeight + 22;
      container.style.height = `${totalHeight}px`;
      container.style.minHeight = `${totalHeight}px`;
      container.style.maxHeight = `${totalHeight}px`;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      isResizingRef.current = false;

      // Restore transition
      container.style.transition = originalTransition;

      // Restore resize handle color
      resizeHandle.style.backgroundColor = 'transparent';

      // Calculate final height and update state
      const delta = upEvent.clientY - startY.current;
      const finalHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.current + delta));

      // Update React state once at the end
      if (onHeightChange) {
        onHeightChange(finalHeight);
      } else {
        setInternalHeight(finalHeight);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.background.secondary,
        borderBottom: `1px solid ${theme.components.scrollbar.thumb}`,
        flexShrink: 0,
        height: isExpanded ? `${height + 22}px` : '22px',
        minHeight: isExpanded ? `${height + 22}px` : '22px',
        maxHeight: isExpanded ? `${height + 22}px` : '22px',
        transition: 'height 100ms ease-out, min-height 100ms ease-out, max-height 100ms ease-out',
        overflow: isAnimating ? 'hidden' : 'visible'
      }}>
      {/* Header */}
      <div
        onClick={handleHeaderClick}
        style={{
          height: '22px',
          minHeight: '22px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          backgroundColor: theme.background.secondary,
          color: theme.text.primary,
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
          letterSpacing: '0.5px',
          flexShrink: 0
        }}
      >
        {/* Chevron Icon */}
        <div style={{
          marginRight: '4px',
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: '10px'
        }}>
          ▶
        </div>
        {title}
      </div>

      {/* Content */}
      {isExpanded && (
        <SDiv style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: isAnimating ? 'hidden' : 'auto',
          backgroundColor: theme.background.secondary
        }}>
          {children}

          {/* Resize Handle */}
          <div
            ref={resizeHandleRef}
            onMouseDown={handleResizeMouseDown}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              cursor: 'row-resize',
              zIndex: 10,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isResizingRef.current) {
                e.currentTarget.style.backgroundColor = theme.accent.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isResizingRef.current) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          />
        </SDiv>
      )}
    </div>
  );
};
