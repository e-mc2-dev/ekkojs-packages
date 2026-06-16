import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../theme';
import type { OpacitySliderProps } from './types';
import { formatColor } from './utils';

export const OpacitySlider: React.FC<OpacitySliderProps> = ({
  value,
  color,
  onChange,
  width,
  height = 12,
  orientation = 'horizontal'
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(width || 280);

  const isHorizontal = orientation === 'horizontal';
  const actualWidth = isHorizontal ? containerWidth : height;
  const actualHeight = isHorizontal ? height : containerWidth;

  // Observe container size when width is not specified
  useEffect(() => {
    if (width !== undefined) return;

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [width]);

  // Draw opacity gradient with checkered background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = actualWidth;
    canvas.height = actualHeight;

    // Draw checkered pattern
    const checkSize = 4;
    for (let y = 0; y < actualHeight; y += checkSize) {
      for (let x = 0; x < actualWidth; x += checkSize) {
        ctx.fillStyle = ((x / checkSize) + (y / checkSize)) % 2 === 0 ? '#ffffff' : '#cccccc';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // Create opacity gradient
    const gradient = isHorizontal
      ? ctx.createLinearGradient(0, 0, actualWidth, 0)
      : ctx.createLinearGradient(0, 0, 0, actualHeight);

    const colorString = formatColor(color, 'rgb', false);
    gradient.addColorStop(0, colorString.replace('rgb', 'rgba').replace(')', ', 0)'));
    gradient.addColorStop(1, colorString.replace('rgb', 'rgba').replace(')', ', 1)'));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, actualWidth, actualHeight);
  }, [actualWidth, actualHeight, isHorizontal, color]);

  // Get position from opacity value
  const getPositionFromOpacity = useCallback(() => {
    return value * (isHorizontal ? actualWidth : actualHeight);
  }, [value, actualWidth, actualHeight, isHorizontal]);

  // Get opacity from position
  const getOpacityFromPosition = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    let position: number;
    let max: number;

    if (isHorizontal) {
      position = Math.max(0, Math.min(clientX - rect.left, actualWidth));
      max = actualWidth;
    } else {
      position = Math.max(0, Math.min(clientY - rect.top, actualHeight));
      max = actualHeight;
    }

    const opacity = position / max;
    onChange(Math.max(0, Math.min(1, opacity)));
  }, [actualWidth, actualHeight, isHorizontal, onChange]);

  // Handle interaction
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    getOpacityFromPosition(clientX, clientY);
  }, [getOpacityFromPosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    getOpacityFromPosition(clientX, clientY);
  }, [isDragging, getOpacityFromPosition]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const pointerPosition = getPositionFromOpacity();

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: isHorizontal ? (width ? `${actualWidth}px` : '100%') : `${actualHeight}px`,
        height: isHorizontal ? `${actualHeight}px` : `${actualWidth}px`,
        cursor: 'pointer',
        borderRadius: '6px',
        overflow: 'hidden',
        border: `1px solid ${theme.border.default}`,
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />

      {/* Slider handle */}
      <div
        style={{
          position: 'absolute',
          [isHorizontal ? 'left' : 'top']: `${pointerPosition}px`,
          [isHorizontal ? 'top' : 'left']: '0',
          width: isHorizontal ? '4px' : '100%',
          height: isHorizontal ? '100%' : '4px',
          backgroundColor: 'white',
          transform: isHorizontal ? 'translate(-50%, 0)' : 'translate(0, -50%)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
          transition: isDragging ? 'none' : (isHorizontal ? 'left 0.1s' : 'top 0.1s')
        }}
      />
    </div>
  );
};
