import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../theme';
import { SDiv } from '../components/SDiv/SDiv';

interface VerticalPaneProps {
  position?: 'left' | 'right';
  width?: number;
  header?: ReactNode;
  children?: ReactNode;
  minWidth?: number;
  maxWidth?: number;
}

export const VerticalPane: React.FC<VerticalPaneProps> = ({
  position = 'left',
  width: initialWidth = 230,
  header,
  children,
  minWidth = 170,
  maxWidth = 600
}) => {
  const { theme } = useTheme();
  const [width, setWidth] = useState(initialWidth);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !resizeHandleRef.current) return;

    e.preventDefault();
    isResizingRef.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    const container = containerRef.current;
    const resizeHandle = resizeHandleRef.current;

    // Set resize handle color using DOM
    resizeHandle.style.backgroundColor = theme.accent.primary;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = position === 'left'
        ? moveEvent.clientX - startX.current
        : startX.current - moveEvent.clientX;

      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));

      // Direct DOM manipulation - no React re-render
      container.style.width = `${newWidth}px`;
      container.style.minWidth = `${newWidth}px`;
      container.style.maxWidth = `${newWidth}px`;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      isResizingRef.current = false;

      // Restore resize handle color
      resizeHandle.style.backgroundColor = 'transparent';

      // Calculate final width and update state
      const delta = position === 'left'
        ? upEvent.clientX - startX.current
        : startX.current - upEvent.clientX;

      const finalWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));

      // Update React state once at the end
      setWidth(finalWidth);

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
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`,
        height: '100%',
        backgroundColor: theme.background.secondary,
        display: 'flex',
        flexDirection: 'column',
        borderRight: position === 'left' ? `1px solid ${theme.border.default}` : 'none',
        borderLeft: position === 'right' ? `1px solid ${theme.border.default}` : 'none',
        boxSizing: 'border-box',
        position: 'relative',
        flexShrink: 0
      }}>
      {/* Header Section */}
      {header && (
        <div style={{
          height: '35px',
          backgroundColor: theme.background.secondary,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: `1px solid ${theme.border.default}`,
          fontSize: '11px',
          fontWeight: 600,
          color: theme.text.primary,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flexShrink: 0
        }}>
          {header}
        </div>
      )}

      {/* Content Section - Flex stretched */}
      <SDiv style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: theme.background.secondary,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </SDiv>

      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [position === 'left' ? 'right' : 'left']: 0,
          width: '4px',
          cursor: 'col-resize',
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
    </div>
  );
};
