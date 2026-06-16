import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../theme';
import type { OverlayType, HighlightType, HighlightStyle } from './types';

interface TourOverlayProps {
  targetRect: DOMRect | null;
  overlayType: OverlayType;
  overlayOpacity: number;
  highlightType: HighlightType;
  highlightStyle: HighlightStyle;
  highlightPadding: number;
  pulseAnimation?: boolean;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  targetRect,
  overlayType,
  overlayOpacity,
  highlightType,
  highlightStyle,
  highlightPadding,
  pulseAnimation = false
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const pulseTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to viewport
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const draw = (timestamp: number) => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw overlay
      if (overlayType !== 'none' && targetRect) {
        ctx.save();

        // Create full screen overlay
        ctx.fillStyle = getOverlayColor();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cut out the target area (create mask)
        ctx.globalCompositeOperation = 'destination-out';
        const padding = highlightPadding;
        const x = targetRect.left - padding;
        const y = targetRect.top - padding;
        const w = targetRect.width + padding * 2;
        const h = targetRect.height + padding * 2;

        // Rounded rectangle for cutout
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Draw highlight
      if (highlightType !== 'none' && targetRect) {
        ctx.save();

        const padding = highlightPadding;
        const x = targetRect.left - padding;
        const y = targetRect.top - padding;
        const w = targetRect.width + padding * 2;
        const h = targetRect.height + padding * 2;

        if (highlightType === 'spotlight') {
          // Create radial gradient glow
          const centerX = x + w / 2;
          const centerY = y + h / 2;
          const radius = Math.max(w, h) / 2;

          const pulseScale = pulseAnimation ? 1 + Math.sin(pulseTimeRef.current * 0.003) * 0.1 : 1;

          const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.8 * pulseScale,
            centerX, centerY, radius * 1.2 * pulseScale
          );

          gradient.addColorStop(0, `${theme.accent.primary}00`);
          gradient.addColorStop(0.5, `${theme.accent.primary}40`);
          gradient.addColorStop(1, `${theme.accent.primary}00`);

          ctx.fillStyle = gradient;
          ctx.fillRect(x - radius, y - radius, w + radius * 2, h + radius * 2);

          // Inner glow border
          ctx.strokeStyle = theme.accent.primary;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 20;
          ctx.shadowColor = theme.accent.primary;
          roundRect(ctx, x, y, w, h, 8);
          ctx.stroke();

        } else if (highlightType === 'outline') {
          // Draw outline border
          ctx.strokeStyle = theme.accent.primary;
          ctx.lineWidth = 3;

          if (highlightStyle === 'dashed') {
            ctx.setLineDash([10, 5]);
          } else if (highlightStyle === 'dotted') {
            ctx.setLineDash([2, 5]);
          }

          if (pulseAnimation) {
            const pulseAlpha = 0.5 + Math.sin(pulseTimeRef.current * 0.005) * 0.5;
            ctx.globalAlpha = pulseAlpha;
          }

          roundRect(ctx, x, y, w, h, 8);
          ctx.stroke();

        } else if (highlightType === 'pulse') {
          // Animated pulse effect
          const pulseScale = 1 + Math.sin(pulseTimeRef.current * 0.005) * 0.15;
          const pulseAlpha = 0.3 + Math.sin(pulseTimeRef.current * 0.005) * 0.3;

          ctx.strokeStyle = theme.accent.primary;
          ctx.lineWidth = 4;
          ctx.globalAlpha = pulseAlpha;

          const scaledW = w * pulseScale;
          const scaledH = h * pulseScale;
          const offsetX = (scaledW - w) / 2;
          const offsetY = (scaledH - h) / 2;

          roundRect(ctx, x - offsetX, y - offsetY, scaledW, scaledH, 8);
          ctx.stroke();

          // Inner solid border
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2;
          roundRect(ctx, x, y, w, h, 8);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Continue animation for pulse effects
      if (pulseAnimation || highlightType === 'pulse') {
        pulseTimeRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetRect, overlayType, overlayOpacity, highlightType, highlightStyle, highlightPadding, pulseAnimation, theme]);

  const getOverlayColor = (): string => {
    const alpha = Math.round(overlayOpacity * 255).toString(16).padStart(2, '0');

    switch (overlayType) {
      case 'dark':
        return `#000000${alpha}`;
      case 'blur':
        return `${theme.background.primary}${alpha}`;
      case 'gradient':
        return `#000000${alpha}`;
      default:
        return 'transparent';
    }
  };

  // Helper function to draw rounded rectangle
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Events handled at window level
        zIndex: 10001,
        backdropFilter: overlayType === 'blur' ? 'blur(4px)' : undefined
      }}
    />
  );
};
