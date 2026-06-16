import React, { useRef, useEffect } from 'react';
import { useDragDrop } from './DragDropContext';
import type { TabDropPosition } from './DragDropContext';
import type { TabItem } from './TabHost';
import { useTheme } from '../theme';

interface TabBarDropIndicatorProps {
  hostId: string;
  tabs: TabItem[];
  tabBarRef: React.RefObject<HTMLDivElement>;
}

export const TabBarDropIndicator: React.FC<TabBarDropIndicatorProps> = ({
  hostId,
  tabs,
  tabBarRef
}) => {
  const { dragState, handleTabReorder } = useDragDrop();
  const { theme } = useTheme();
  const indicatorRef = useRef<HTMLDivElement>(null);
  const dropPositionRef = useRef<TabDropPosition | null>(null);

  useEffect(() => {
    if (!dragState.isDragging || !tabBarRef.current || !indicatorRef.current) {
      return;
    }

    const tabBar = tabBarRef.current;
    const indicator = indicatorRef.current;

    // Hide the dock guides (preview + compass) while the cursor is over the tab bar (reorder, not split).
    const hideAllOverlays = () => {
      document.querySelectorAll('.dropzone-overlay .dock-drop-visual').forEach((v) => {
        (v as HTMLElement).style.display = 'none';
      });
    };

    // Calculate drop position based on mouse position
    const calculateDropPosition = (clientX: number): { position: TabDropPosition; left: number } | null => {
      const tabElements = tabBar.querySelectorAll('[data-tab-id]');

      if (tabElements.length === 0) {
        // No tabs - drop at end
        return {
          position: { targetTabId: null, position: 'after' },
          left: 0
        };
      }

      for (let i = 0; i < tabElements.length; i++) {
        const tabElement = tabElements[i] as HTMLElement;
        const rect = tabElement.getBoundingClientRect();
        const tabId = tabElement.getAttribute('data-tab-id')!;
        const midPoint = rect.left + rect.width / 2;

        if (clientX < midPoint) {
          // Drop before this tab
          return {
            position: { targetTabId: tabId, position: 'before' },
            left: rect.left - tabBar.getBoundingClientRect().left + tabBar.scrollLeft
          };
        } else if (i === tabElements.length - 1) {
          // Last tab, and mouse is on right half - drop after
          return {
            position: { targetTabId: tabId, position: 'after' },
            left: rect.right - tabBar.getBoundingClientRect().left + tabBar.scrollLeft
          };
        }
      }

      return null;
    };

    const handleMouseEnter = () => {
      hideAllOverlays();
      indicator.style.display = 'block';
    };

    const handleMouseMove = (e: MouseEvent) => {
      const result = calculateDropPosition(e.clientX);

      if (result) {
        dropPositionRef.current = result.position;
        indicator.style.left = `${result.left}px`;
        indicator.style.display = 'block';
      } else {
        indicator.style.display = 'none';
      }
    };

    const handleMouseLeave = () => {
      indicator.style.display = 'none';
      dropPositionRef.current = null;
    };

    const handleMouseUp = () => {
      if (dropPositionRef.current && dragState.draggedTab && dragState.sourceTabHostId) {
        const dropPos = dropPositionRef.current;

        // Check if dropping on itself at same position
        if (hostId === dragState.sourceTabHostId &&
            dropPos.targetTabId === dragState.draggedTab.id) {
          // Do nothing - same position
          indicator.style.display = 'none';
          dropPositionRef.current = null;
          return;
        }

        handleTabReorder(dragState.draggedTab, dragState.sourceTabHostId, hostId, dropPos);
      }

      indicator.style.display = 'none';
      dropPositionRef.current = null;
    };

    tabBar.addEventListener('mouseenter', handleMouseEnter);
    tabBar.addEventListener('mousemove', handleMouseMove);
    tabBar.addEventListener('mouseleave', handleMouseLeave);
    tabBar.addEventListener('mouseup', handleMouseUp);

    return () => {
      tabBar.removeEventListener('mouseenter', handleMouseEnter);
      tabBar.removeEventListener('mousemove', handleMouseMove);
      tabBar.removeEventListener('mouseleave', handleMouseLeave);
      tabBar.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, dragState.draggedTab, dragState.sourceTabHostId, hostId, tabBarRef, tabs, handleTabReorder]);

  if (!dragState.isDragging) {
    return null;
  }

  return (
    <div
      ref={indicatorRef}
      style={{
        position: 'absolute',
        top: '4px',
        bottom: '4px',
        width: '2px',
        borderRadius: '2px',
        backgroundColor: theme.accent.primary,
        boxShadow: `0 0 6px ${theme.accent.primary}`,
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'none'
      }}
    />
  );
};
