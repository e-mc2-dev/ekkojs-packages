import React, { useEffect } from 'react';
import { useDragDrop } from './DragDropContext';
import type { RootSide } from './DragDropContext';
import { zoneSvg } from './DropZoneOverlay';
import { useTheme } from '../theme';

// Always-visible dock targets at the four extremities of the workspace (like VS Code / remote-mngr).
// Dropping on one docks the tab as a full-edge split of the WHOLE layout (root-split), not a single pane.
const SIDES: RootSide[] = ['top', 'right', 'bottom', 'left'];

export const RootDropZones: React.FC<{ containerRef: React.RefObject<HTMLDivElement> }> = ({ containerRef }) => {
  const { theme } = useTheme();
  const { dragState, handleRootDrop } = useDragDrop();

  useEffect(() => {
    if (!dragState.isDragging || !containerRef.current) return;

    const accent = theme.accent.primary;
    const inactiveBg = theme.background.elevated;
    const rect = containerRef.current.getBoundingClientRect();

    // Full-edge preview, shown while a root zone is hovered.
    const preview = document.createElement('div');
    preview.style.cssText = `position:fixed;border-radius:4px;pointer-events:none;z-index:10003;display:none;transition:all 120ms ease;background:color-mix(in srgb, ${accent} 12%, transparent);border:2px solid color-mix(in srgb, ${accent} 42%, transparent)`;
    document.body.appendChild(preview);

    const previewRect = (side: RootSide) => {
      const w = rect.width, h = rect.height;
      switch (side) {
        case 'left': return { left: rect.left, top: rect.top, width: w * 0.3, height: h };
        case 'right': return { left: rect.left + w * 0.7, top: rect.top, width: w * 0.3, height: h };
        case 'top': return { left: rect.left, top: rect.top, width: w, height: h * 0.3 };
        case 'bottom': return { left: rect.left, top: rect.top + h * 0.7, width: w, height: h * 0.3 };
      }
    };

    const buttonPos = (side: RootSide): string => {
      const cx = rect.left + rect.width / 2 - 19;
      const cy = rect.top + rect.height / 2 - 19;
      switch (side) {
        case 'top': return `left:${cx}px;top:${rect.top + 10}px`;
        case 'bottom': return `left:${cx}px;top:${rect.top + rect.height - 48}px`;
        case 'left': return `left:${rect.left + 10}px;top:${cy}px`;
        case 'right': return `left:${rect.left + rect.width - 48}px;top:${cy}px`;
      }
    };

    const buttons: HTMLDivElement[] = [];
    for (const side of SIDES) {
      const btn = document.createElement('div');
      btn.style.cssText = `position:fixed;${buttonPos(side)};width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;z-index:10004;pointer-events:all;background:${inactiveBg};border:1.5px solid ${theme.border.default};box-shadow:0 4px 16px rgba(0,0,0,0.4);transition:background 80ms,border-color 80ms,transform 80ms`;
      btn.innerHTML = zoneSvg(side, accent, false);

      const onEnter = () => {
        btn.style.background = accent;
        btn.style.borderColor = accent;
        btn.style.transform = 'scale(1.1)';
        btn.innerHTML = zoneSvg(side, accent, true);
        const pr = previewRect(side)!;
        preview.style.display = 'block';
        preview.style.left = `${pr.left}px`;
        preview.style.top = `${pr.top}px`;
        preview.style.width = `${pr.width}px`;
        preview.style.height = `${pr.height}px`;
      };
      const onLeave = () => {
        btn.style.background = inactiveBg;
        btn.style.borderColor = theme.border.default;
        btn.style.transform = 'scale(1)';
        btn.innerHTML = zoneSvg(side, accent, false);
        preview.style.display = 'none';
      };
      const onUp = () => {
        if (dragState.draggedTab && dragState.sourceTabHostId) {
          handleRootDrop(side, dragState.draggedTab, dragState.sourceTabHostId);
        }
      };
      btn.addEventListener('mouseenter', onEnter);
      btn.addEventListener('mouseleave', onLeave);
      btn.addEventListener('mouseup', onUp);
      (btn as any)._cleanup = () => {
        btn.removeEventListener('mouseenter', onEnter);
        btn.removeEventListener('mouseleave', onLeave);
        btn.removeEventListener('mouseup', onUp);
      };
      document.body.appendChild(btn);
      buttons.push(btn);
    }

    return () => {
      buttons.forEach((b) => { (b as any)._cleanup?.(); if (document.body.contains(b)) document.body.removeChild(b); });
      if (document.body.contains(preview)) document.body.removeChild(preview);
    };
  }, [dragState.isDragging, dragState.draggedTab, dragState.sourceTabHostId, handleRootDrop, theme, containerRef]);

  return null;
};
