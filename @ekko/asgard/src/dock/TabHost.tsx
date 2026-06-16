import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useDragDrop } from './DragDropContext';
import { DropZoneOverlay } from './DropZoneOverlay';
import { TabBarDropIndicator } from './TabBarDropIndicator';
import { useTheme } from '../theme';
import { SDiv } from '../components/SDiv/SDiv';

export interface TabItem {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  closable?: boolean;
}

interface TabHostProps {
  hostId: string;
  tabs: TabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export const TabHost: React.FC<TabHostProps> = ({
  hostId,
  tabs,
  activeTabId: controlledActiveTabId,
  onTabChange,
  onTabClose
}) => {
  const { theme } = useTheme();
  const [internalActiveTabId, setInternalActiveTabId] = useState(tabs[0]?.id);
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const tabBarRef = React.useRef<HTMLDivElement>(null);
  const { startDrag, dragState } = useDragDrop();

  // Drag threshold tracking
  const dragStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const dragThreshold = 5; // pixels
  const isDragStarted = React.useRef(false);
  const pendingDragTab = React.useRef<TabItem | null>(null);

  const activeTabId = controlledActiveTabId || internalActiveTabId;

  const handleTabClick = (tabId: string) => {
    setInternalActiveTabId(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (onTabClose) {
      onTabClose(tabId);
    }
  };

  const handleScroll = () => {
    if (tabBarRef.current) {
      setScrollPosition(tabBarRef.current.scrollLeft);
    }
  };

  // Use native wheel event with passive: false to allow preventDefault
  useEffect(() => {
    const tabBar = tabBarRef.current;
    if (!tabBar) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      tabBar.scrollLeft += e.deltaY;
    };

    tabBar.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      tabBar.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMouseEnter = () => {
    setScrollbarVisible(true);
  };

  const handleMouseLeave = () => {
    setScrollbarVisible(false);
  };

  const handleTabMouseDown = (e: React.MouseEvent, tab: TabItem, tabElement: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();

    // Record starting position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    isDragStarted.current = false;
    pendingDragTab.current = tab;

    // Set initial opacity
    tabElement.style.opacity = '0.5';
    tabElement.setAttribute('data-tab-dragging', 'true');

    // A small accent pill that follows the cursor while dragging (VS Code-style drag ghost).
    let ghost: HTMLDivElement | null = null;
    const accent = theme.accent.primary;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current || !pendingDragTab.current) return;

      const deltaX = Math.abs(moveEvent.clientX - dragStartPos.current.x);
      const deltaY = Math.abs(moveEvent.clientY - dragStartPos.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Only start drag if moved beyond threshold
      if (distance > dragThreshold && !isDragStarted.current) {
        isDragStarted.current = true;
        startDrag(pendingDragTab.current, hostId);
        document.body.style.cursor = 'grabbing';
        ghost = document.createElement('div');
        ghost.textContent = pendingDragTab.current.title;
        ghost.style.cssText = `position:fixed;z-index:10001;pointer-events:none;padding:5px 14px;border-radius:6px;font-size:12px;font-family:inherit;white-space:nowrap;color:#ffffff;background:${accent};box-shadow:0 4px 16px rgba(0,0,0,0.4)`;
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = `${moveEvent.clientX + 12}px`;
        ghost.style.top = `${moveEvent.clientY + 12}px`;
      }
    };

    const handleMouseUp = () => {
      // Restore opacity if drag never started
      if (!isDragStarted.current) {
        tabElement.style.opacity = '1';
        tabElement.removeAttribute('data-tab-dragging');
      }
      if (ghost) { ghost.remove(); ghost = null; }
      document.body.style.cursor = '';

      // Cleanup
      dragStartPos.current = null;
      isDragStarted.current = false;
      pendingDragTab.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Reset tab opacity when drag ends
  useEffect(() => {
    if (!dragState.isDragging) {
      // Reset opacity on all tabs when drag ends
      document.querySelectorAll('[data-tab-dragging]').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        el.removeAttribute('data-tab-dragging');
      });
    }
  }, [dragState.isDragging]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.background.primary
    }}>
      {/* Tab Bar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          ref={tabBarRef}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            height: '36px',
            padding: '0 4px',
            backgroundColor: theme.components.tab.background,
            borderBottom: `1px solid ${theme.border.default}`,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'relative'
          }}
          className="tab-bar-scrollable"
        >
        <TabBarDropIndicator hostId={hostId} tabs={tabs} tabBarRef={tabBarRef} />
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const isHovered = hoveredTabId === tab.id;
          const dragging = dragState.isDragging && dragState.draggedTab?.id === tab.id;

          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onMouseDown={(e) => {
                handleTabMouseDown(e, tab, e.currentTarget);
              }}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '30px',
                padding: '0 10px',
                borderRadius: '6px 6px 0 0',
                // Active tab: accent underline + raised surface + primary text; inactive: muted, hover-lit.
                backgroundColor: isActive ? theme.components.tab.activeBackground : (isHovered ? theme.components.tab.hoverBackground : 'transparent'),
                color: isActive ? (theme.components.tab.activeText || theme.text.primary) : theme.text.secondary,
                borderBottom: `2px solid ${isActive ? theme.accent.primary : 'transparent'}`,
                cursor: 'grab',
                fontSize: '13px',
                maxWidth: '200px',
                userSelect: 'none',
                transition: 'background-color 0.12s, color 0.12s',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                opacity: dragging ? 0.4 : 1
              }}
            >
              {/* Icon */}
              {tab.icon && (
                <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {tab.icon}
                </div>
              )}

              {/* Title */}
              <div style={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '140px'
              }}>
                {tab.title}
              </div>

              {/* Close Button (revealed on hover or when active) */}
              {tab.closable !== false && (
                <div
                  onClick={(e) => handleTabClose(e, tab.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    fontSize: '15px',
                    lineHeight: 1,
                    flexShrink: 0,
                    cursor: 'pointer',
                    opacity: (isActive || isHovered) ? 0.85 : 0,
                    transition: 'opacity 0.12s, background-color 0.12s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.components.tab.closeButtonHoverBackground;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </div>
              )}
            </div>
          );
        })}
        </div>

        {/* Custom Scrollbar */}
        {tabBarRef.current && tabBarRef.current.scrollWidth > tabBarRef.current.clientWidth && (
          <div style={{
            position: 'absolute',
            bottom: '0px',
            left: '0px',
            right: '0px',
            height: '3px',
            backgroundColor: 'transparent',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              left: `${(scrollPosition / tabBarRef.current.scrollWidth) * 100}%`,
              width: `${(tabBarRef.current.clientWidth / tabBarRef.current.scrollWidth) * 100}%`,
              height: '3px',
              backgroundColor: theme.components.scrollbar.thumb,
              transition: 'opacity 0.3s ease',
              opacity: scrollbarVisible ? 1 : 0
            }} />
          </div>
        )}
      </div>

      {/* Content Area */}
      <SDiv style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: theme.background.primary,
        position: 'relative'
      }}>
        {activeTab?.content}
        <DropZoneOverlay tabHostId={hostId} />
      </SDiv>
    </div>
  );
};
