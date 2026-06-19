// ============================================================================
// ImageLightbox — full-screen, zoomable image viewer for MarkdownRenderer images.
// LinkedIn-style: click a picture / SVG diagram to open it full-screen and zoom in. Because host
// pages are often pinch-zoom-locked, zoom/pan is implemented in JS (CSS transform), not native zoom:
// pinch + double-tap + drag on touch; wheel + double-click + drag on desktop. Self-contained (inline
// styles + theme), portal-rendered, SSR-safe.
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { isBrowser } from '../../_internal';

export interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const MIN = 1, MAX = 6;

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const tf = useRef({ scale: 1, x: 0, y: 0 });               // current transform (kept off state for smoothness)
  const pts = useRef<Map<number, { x: number; y: number }>>(new Map()); // active pointers
  const start = useRef<any>(null);                            // gesture anchor
  const lastTap = useRef(0);

  const clamp = (s: number) => Math.min(MAX, Math.max(MIN, s));
  const apply = (animate?: boolean) => {
    const el = imgRef.current; if (!el) return;
    el.style.transition = animate ? 'transform .2s ease' : 'none';
    const t = tf.current;
    el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    el.style.cursor = t.scale > 1 ? 'grab' : 'zoom-in';
  };

  useEffect(() => {
    apply();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';                 // freeze the page behind the overlay
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a: any, b: any) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = [...pts.current.values()];
    if (a.length === 2) {
      start.current = { mode: 'pinch', d: dist(a[0], a[1]), s: tf.current.scale, c: mid(a[0], a[1]), ox: tf.current.x, oy: tf.current.y };
    } else if (a.length === 1) {
      start.current = { mode: 'pan', x: e.clientX, y: e.clientY, ox: tf.current.x, oy: tf.current.y, moved: false, onImg: e.target === imgRef.current };
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = [...pts.current.values()]; const s = start.current; if (!s) return;
    if (s.mode === 'pinch' && a.length >= 2) {
      const nd = dist(a[0], a[1]), nc = mid(a[0], a[1]);
      tf.current.scale = clamp(s.s * (nd / s.d));
      tf.current.x = s.ox + (nc.x - s.c.x);
      tf.current.y = s.oy + (nc.y - s.c.y);
      apply();
    } else if (s.mode === 'pan' && a.length === 1) {
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.moved = true;
      if (tf.current.scale > 1) { tf.current.x = s.ox + dx; tf.current.y = s.oy + dy; apply(); }
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    pts.current.delete(e.pointerId);
    if (s && s.mode === 'pan' && !s.moved && pts.current.size === 0) {
      if (!s.onImg) { onClose(); return; }                   // tap on the dark backdrop closes
      const now = Date.now();
      if (now - lastTap.current < 300) {                     // double-tap toggles zoom
        lastTap.current = 0;
        tf.current = tf.current.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 };
        apply(true);
      } else { lastTap.current = now; }
    }
    if (pts.current.size === 1) {                            // pinch -> single-finger pan handoff
      const p = [...pts.current.values()][0];
      start.current = { mode: 'pan', x: p.x, y: p.y, ox: tf.current.x, oy: tf.current.y, moved: true, onImg: true };
    } else if (pts.current.size === 0) {
      start.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    tf.current.scale = clamp(tf.current.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
    if (tf.current.scale === 1) { tf.current.x = 0; tf.current.y = 0; }
    apply();
  };

  if (!isBrowser) return null;

  return createPortal(
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        touchAction: 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          fontSize: '24px',
          lineHeight: 1,
          color: '#fff',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        ×
      </button>
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        draggable={false}
        onDoubleClick={() => {
          tf.current = tf.current.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 };
          apply(true);
        }}
        style={{
          maxWidth: '92vw',
          maxHeight: '92vh',
          objectFit: 'contain',
          borderRadius: '4px',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.85)',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          padding: '4px 10px',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      >
        Pinch or double-tap to zoom · drag to pan · tap outside to close
      </div>
    </div>,
    document.body
  );
};
