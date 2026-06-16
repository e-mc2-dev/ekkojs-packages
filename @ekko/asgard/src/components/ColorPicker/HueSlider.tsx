import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../theme';
import type { HueSliderProps } from './types';

export const HueSlider: React.FC<HueSliderProps> = ({
  value,
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

  // Draw hue gradient
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = actualWidth;
    canvas.height = actualHeight;

    // Create gradient
    const gradient = isHorizontal
      ? ctx.createLinearGradient(0, 0, actualWidth, 0)
      : ctx.createLinearGradient(0, 0, 0, actualHeight);

    // Add color stops for full hue range
    const stops = [
      { pos: 0, color: '#FF0000' },      // Red
      { pos: 1/6, color: '#FFFF00' },    // Yellow
      { pos: 2/6, color: '#00FF00' },    // Green
      { pos: 3/6, color: '#00FFFF' },    // Cyan
      { pos: 4/6, color: '#0000FF' },    // Blue
      { pos: 5/6, color: '#FF00FF' },    // Magenta
      { pos: 1, color: '#FF0000' }       // Red
    ];

    stops.forEach(stop => {
      gradient.addColorStop(stop.pos, stop.color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, actualWidth, actualHeight);
  }, [actualWidth, actualHeight, isHorizontal]);

  // Get position from hue value
  const getPositionFromHue = useCallback(() => {
    return (value / 360) * (isHorizontal ? actualWidth : actualHeight);
  }, [value, actualWidth, actualHeight, isHorizontal]);

  // Get hue from position
  const getHueFromPosition = useCallback((clientX: number, clientY: number) => {
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

    const hue = Math.round((position / max) * 360);
    onChange(Math.max(0, Math.min(360, hue)));
  }, [actualWidth, actualHeight, isHorizontal, onChange]);

  // Handle interaction
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    getHueFromPosition(clientX, clientY);
  }, [getHueFromPosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    getHueFromPosition(clientX, clientY);
  }, [isDragging, getHueFromPosition]);

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

  const pointerPosition = getPositionFromHue();

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
