import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';

export type SplitDirection = 'horizontal' | 'vertical';

interface SplitContainerProps {
  direction: SplitDirection;
  initialSizes?: number[]; // Percentages (e.g., [50, 50])
  children: [ReactNode, ReactNode];
}

export const SplitContainer: React.FC<SplitContainerProps> = ({
  direction,
  initialSizes = [50, 50],
  children
}) => {
  const [sizes, setSizes] = useState(initialSizes);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstPanelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef(0);
  const startSizes = useRef<number[]>([]);
  const isResizingRef = useRef(false);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!containerRef.current || !firstPanelRef.current || !resizerRef.current) return;

    e.preventDefault();
    isResizingRef.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizes.current = [...sizes];

    const container = containerRef.current;
    const firstPanel = firstPanelRef.current;
    const resizer = resizerRef.current;
    const rect = container.getBoundingClientRect();

    // Set resizer color using DOM
    resizer.style.backgroundColor = '#007acc';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const totalSize = direction === 'horizontal' ? rect.width : rect.height;
      const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - startPos.current;
      const deltaPercent = (delta / totalSize) * 100;

      const newFirst = Math.max(10, Math.min(90, startSizes.current[0] + deltaPercent));

      // Direct DOM manipulation - no React re-render
      if (direction === 'horizontal') {
        firstPanel.style.width = `${newFirst}%`;
      } else {
        firstPanel.style.height = `${newFirst}%`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      isResizingRef.current = false;

      // Restore resizer color
      resizer.style.backgroundColor = '#3c3c3c';

      // Calculate final sizes and update state
      const totalSize = direction === 'horizontal' ? rect.width : rect.height;
      const currentPos = direction === 'horizontal' ? upEvent.clientX : upEvent.clientY;
      const delta = currentPos - startPos.current;
      const deltaPercent = (delta / totalSize) * 100;

      const newFirst = Math.max(10, Math.min(90, startSizes.current[0] + deltaPercent));
      const newSecond = 100 - newFirst;

      // Update React state once at the end
      setSizes([newFirst, newSecond]);

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
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* First Panel */}
      <div
        ref={firstPanelRef}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${sizes[0]}%`,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {children[0]}
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        onMouseDown={handleResizeStart}
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: '1px',
          backgroundColor: '#3c3c3c',
          cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Invisible hover zone for easier grabbing */}
        <div
          style={{
            position: 'absolute',
            [direction === 'horizontal' ? 'left' : 'top']: '-2px',
            [direction === 'horizontal' ? 'width' : 'height']: '5px',
            [direction === 'horizontal' ? 'height' : 'width']: '100%',
            cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize'
          }}
          onMouseEnter={(e) => {
            if (!isResizingRef.current) {
              (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = '#007acc';
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizingRef.current) {
              (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = '#3c3c3c';
            }
          }}
        />
      </div>

      {/* Second Panel */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {children[1]}
      </div>
    </div>
  );
};
