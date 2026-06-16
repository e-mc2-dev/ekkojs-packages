import React, { useRef, useEffect } from 'react';
import { useDragDrop } from './DragDropContext';
import type { DropZone } from './DragDropContext';
import { useTheme } from '../theme';

interface DropZoneOverlayProps {
  tabHostId: string;
}

// VS Code-style dock guide: a small compass (top / left / center / right / bottom) shown centred over the
// pane being hovered, plus a translucent half-pane preview of where the tab will land.
const ZONES: { side: Exclude<DropZone, null>; row: number; col: number }[] = [
  { side: 'top', row: 1, col: 2 },
  { side: 'left', row: 2, col: 1 },
  { side: 'center', row: 2, col: 2 },
  { side: 'right', row: 2, col: 3 },
  { side: 'bottom', row: 2 + 1, col: 2 },
];

function isInRect(x: number, y: number, r: DOMRect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

export function zoneSvg(side: Exclude<DropZone, null>, accent: string, active: boolean): string {
  const f = active ? '#ffffff' : accent;
  const e = active ? 'rgba(255,255,255,0.32)' : 'rgba(127,127,127,0.20)';
  const w = `<svg width="18" height="18" viewBox="0 0 20 20">`;
  switch (side) {
    case 'top': return `${w}<rect x="1" y="1" width="18" height="8" rx="2" fill="${f}"/><rect x="1" y="11" width="18" height="8" rx="2" fill="${e}"/></svg>`;
    case 'bottom': return `${w}<rect x="1" y="1" width="18" height="8" rx="2" fill="${e}"/><rect x="1" y="11" width="18" height="8" rx="2" fill="${f}"/></svg>`;
    case 'left': return `${w}<rect x="1" y="1" width="8" height="18" rx="2" fill="${f}"/><rect x="11" y="1" width="8" height="18" rx="2" fill="${e}"/></svg>`;
    case 'right': return `${w}<rect x="1" y="1" width="8" height="18" rx="2" fill="${e}"/><rect x="11" y="1" width="8" height="18" rx="2" fill="${f}"/></svg>`;
    case 'center': return `${w}<rect x="1" y="1" width="18" height="18" rx="2" fill="${f}"/></svg>`;
  }
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ tabHostId }) => {
  const { theme } = useTheme();
  const { dragState, handleDrop, endDrag } = useDragDrop();
  const contentRef = useRef<HTMLDivElement>(null);

  const getDropZone = (clientX: number, clientY: number, rect: DOMRect): DropZone => {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const leftThreshold = width * 0.3;
    const rightThreshold = width * 0.7;
    const topThreshold = height * 0.3;
    const bottomThreshold = height * 0.7;
    if (x < leftThreshold) return 'left';
    if (x > rightThreshold) return 'right';
    if (y < topThreshold) return 'top';
    if (y > bottomThreshold) return 'bottom';
    return 'center';
  };

  const getZoneRect = (zone: DropZone, w: number, h: number): { left: number, top: number, width: number, height: number } | null => {
    switch (zone) {
      case 'left': return { left: 0, top: 0, width: w * 0.5, height: h };
      case 'right': return { left: w * 0.5, top: 0, width: w * 0.5, height: h };
      case 'top': return { left: 0, top: 0, width: w, height: h * 0.5 };
      case 'bottom': return { left: 0, top: h * 0.5, width: w, height: h * 0.5 };
      case 'center': return { left: 0, top: 0, width: w, height: h };
      default: return null;
    }
  };

  useEffect(() => {
    if (!dragState.isDragging || !contentRef.current) return;

    const accent = theme.accent.primary;
    const rect = contentRef.current.getBoundingClientRect();

    // Hit layer (captures pointer while the ghost is moving); itself invisible.
    const overlayDiv = document.createElement('div');
    overlayDiv.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:10000;pointer-events:all`;
    overlayDiv.setAttribute('data-tabhost-id', tabHostId);
    overlayDiv.className = 'dropzone-overlay';

    // Visual layer (preview + compass), hidden by the tab-bar indicator when the cursor is over the tab bar.
    const visual = document.createElement('div');
    visual.className = 'dock-drop-visual';
    visual.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none';
    overlayDiv.appendChild(visual);

    // Half-pane preview highlight.
    const preview = document.createElement('div');
    preview.style.cssText = `position:absolute;border-radius:4px;pointer-events:none;z-index:1;transition:all 120ms ease;background:color-mix(in srgb, ${accent} 12%, transparent);border:2px solid color-mix(in srgb, ${accent} 42%, transparent)`;
    visual.appendChild(preview);

    // Compass widget.
    const compassWrap = document.createElement('div');
    compassWrap.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2';
    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:36px 36px 36px;grid-template-rows:36px 36px 36px;gap:3px;padding:6px;border-radius:10px;background:${theme.background.elevated};border:1px solid ${theme.border.default};box-shadow:0 8px 28px rgba(0,0,0,0.4)`;
    const cells = new Map<string, HTMLDivElement>();
    const inactiveBg = `color-mix(in srgb, ${theme.text.secondary} 14%, transparent)`;
    for (const { side, row, col } of ZONES) {
      const cell = document.createElement('div');
      cell.style.cssText = `grid-row:${row};grid-column:${col};width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 80ms,border-color 80ms,transform 80ms;border:1.5px solid ${theme.border.default};background:${inactiveBg}`;
      cell.innerHTML = zoneSvg(side, accent, false);
      cells.set(side, cell);
      grid.appendChild(cell);
    }
    compassWrap.appendChild(grid);
    visual.appendChild(compassWrap);

    const setActive = (zone: DropZone) => {
      for (const { side } of ZONES) {
        const cell = cells.get(side)!;
        const on = side === zone;
        cell.style.background = on ? accent : inactiveBg;
        cell.style.borderColor = on ? accent : theme.border.default;
        cell.style.transform = on ? 'scale(1.08)' : 'scale(1)';
        cell.innerHTML = zoneSvg(side, accent, on);
      }
    };

    const hideOthers = () => {
      document.querySelectorAll('.dropzone-overlay .dock-drop-visual').forEach((v) => {
        if (v !== visual) (v as HTMLElement).style.display = 'none';
      });
    };

    // Zone = the compass cell under the cursor if any (you can aim INTO the helper), else edge/center region.
    const computeZone = (x: number, y: number): DropZone => {
      if (visual.style.display !== 'none') {
        for (const { side } of ZONES) {
          const c = cells.get(side);
          if (c && isInRect(x, y, c.getBoundingClientRect())) return side;
        }
      }
      return getDropZone(x, y, rect);
    };

    const onEnter = (e: MouseEvent) => {
      if (e.buttons !== 1) { endDrag(); return; }
      hideOthers();
    };
    const onMove = (e: MouseEvent) => {
      visual.style.display = 'block';
      const zone = computeZone(e.clientX, e.clientY);
      const zr = getZoneRect(zone, rect.width, rect.height);
      if (zr) {
        preview.style.display = 'block';
        preview.style.left = `${zr.left}px`;
        preview.style.top = `${zr.top}px`;
        preview.style.width = `${zr.width}px`;
        preview.style.height = `${zr.height}px`;
      } else {
        preview.style.display = 'none';
      }
      setActive(zone);
    };
    const onLeave = () => { visual.style.display = 'none'; };
    const onUp = (e: MouseEvent) => {
      const zone = computeZone(e.clientX, e.clientY);
      if (dragState.draggedTab && dragState.sourceTabHostId && zone) {
        handleDrop(tabHostId, zone, dragState.draggedTab, dragState.sourceTabHostId);
      } else {
        endDrag();
      }
    };

    overlayDiv.addEventListener('mouseenter', onEnter);
    overlayDiv.addEventListener('mousemove', onMove);
    overlayDiv.addEventListener('mouseleave', onLeave);
    overlayDiv.addEventListener('mouseup', onUp);
    document.body.appendChild(overlayDiv);

    return () => {
      overlayDiv.removeEventListener('mouseenter', onEnter);
      overlayDiv.removeEventListener('mousemove', onMove);
      overlayDiv.removeEventListener('mouseleave', onLeave);
      overlayDiv.removeEventListener('mouseup', onUp);
      if (document.body.contains(overlayDiv)) document.body.removeChild(overlayDiv);
    };
  }, [dragState.isDragging, tabHostId, dragState.draggedTab, dragState.sourceTabHostId, handleDrop, endDrag, theme]);

  // Invisible marker used only to measure the content area's position.
  return (
    <div ref={contentRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: -1 }} />
  );
};
