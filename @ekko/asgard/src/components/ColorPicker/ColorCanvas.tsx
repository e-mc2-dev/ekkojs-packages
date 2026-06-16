import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../theme';
import type { ColorCanvasProps } from './types';
import { hslToRgb } from './utils';

export const ColorCanvas: React.FC<ColorCanvasProps> = ({
  hue,
  saturation,
  lightness,
  onChange,
  width = 280,
  height = 200
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Draw the saturation/lightness gradient
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Get the pure hue color
    const { r, g, b } = hslToRgb(hue, 100, 50);
    const hueColor = `rgb(${r}, ${g}, ${b})`;

    // Create white to hue gradient (saturation)
    const satGradient = ctx.createLinearGradient(0, 0, width, 0);
    satGradient.addColorStop(0, 'white');
    satGradient.addColorStop(1, hueColor);

    ctx.fillStyle = satGradient;
    ctx.fillRect(0, 0, width, height);

    // Create transparent to black gradient (lightness)
    const lightGradient = ctx.createLinearGradient(0, 0, 0, height);
    lightGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    lightGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, width, height);
  }, [hue, width, height]);

  // Calculate position from saturation/lightness
  const getPositionFromColor = useCallback(() => {
    const x = (saturation / 100) * width;
    // Lightness goes from 50 (top) to 0 (bottom)
    const y = ((50 - lightness) / 50) * height;
    return { x, y };
  }, [saturation, lightness, width, height]);

  // Calculate saturation/lightness from position
  const getColorFromPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, width));
    const y = Math.max(0, Math.min(clientY - rect.top, height));

    const s = (x / width) * 100;
    // Lightness should go from 50 (top, pure color) to 0 (bottom, black)
    const l = 50 - (y / height) * 50;

    onChange(s, l);
  }, [width, height, onChange]);

  // Handle mouse/touch events
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    getColorFromPosition(clientX, clientY);
  }, [getColorFromPosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    getColorFromPosition(clientX, clientY);
  }, [isDragging, getColorFromPosition]);

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

  const position = getPositionFromColor();

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        cursor: 'crosshair',
        borderRadius: '4px',
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

      {/* Color picker pointer */}
      <div
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '12px',
          height: '12px',
          border: '2px solid white',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'left 0.1s, top 0.1s'
        }}
      />
    </div>
  );
};
