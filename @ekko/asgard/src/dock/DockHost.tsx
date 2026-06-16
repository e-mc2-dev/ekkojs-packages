import React, { useState, useCallback } from 'react';
import { SideBar } from './SideBar';
import type { SideBarProps } from './SideBar';
import { VerticalPane } from './VerticalPane';
import { TabHost } from './TabHost';
import type { TabItem } from './TabHost';
import { DragDropProvider } from './DragDropContext';
import type { DropZone, RootSide } from './DragDropContext';
import { RootDropZones } from './RootDropZones';
import { SplitContainer } from './SplitContainer';
import type { SplitDirection } from './SplitContainer';
import { useTheme } from '../theme';
import { ToastProvider } from '../components/Toast/ToastContext';
import { ToastContainer } from '../components/Toast/ToastContainer';

// Layout tree structures
export interface TabHostData {
  id: string;
  tabs: TabItem[];
  activeTabId?: string;
}

export interface SplitNode {
  type: 'split';
  direction: SplitDirection;
  first: LayoutNode;
  second: LayoutNode;
  sizes?: number[];
}

export type LayoutNode = TabHostData | SplitNode;

export interface DockHostProps {
  /** Initial tabs to display in the center area */
  initialTabs?: TabItem[];
  /** Initial layout tree (overrides initialTabs if provided) */
  initialLayout?: LayoutNode;
  /** Content for the left vertical pane */
  leftPanelHeader?: React.ReactNode;
  leftPanelContent?: React.ReactNode;
  /** Content for the right vertical pane */
  rightPanelHeader?: React.ReactNode;
  rightPanelContent?: React.ReactNode;
  /** Props for left sidebar */
  leftSideBar?: SideBarProps;
  /** Props for right sidebar */
  rightSideBar?: SideBarProps;
  /** Whether to show left sidebar (default: true) */
  showLeftSideBar?: boolean;
  /** Whether to show right sidebar (default: true) */
  showRightSideBar?: boolean;
  /** Whether to show left panel (default: true) */
  showLeftPanel?: boolean;
  /** Whether to show right panel (default: true) */
  showRightPanel?: boolean;
  /** Initial width of left panel in pixels */
  leftPanelWidth?: number;
  /** Initial width of right panel in pixels */
  rightPanelWidth?: number;
  /** Callback when active tab changes */
  onActiveTabChange?: (hostId: string, tabId: string) => void;
  /** Callback when a tab is closed */
  onTabClose?: (tabId: string) => void;
  /** External layout state (controlled mode) */
  layout?: LayoutNode;
  /** Layout change handler (controlled mode) */
  onLayoutChange?: (layout: LayoutNode) => void;
}

// Helper: check if a node is a SplitNode
const isSplitNode = (node: LayoutNode): node is SplitNode => {
  return 'type' in node && node.type === 'split';
};

// Helper: Deep clone layout tree, preserving React elements in tabs
const cloneLayout = (node: LayoutNode): LayoutNode => {
  if (isSplitNode(node)) {
    return {
      type: 'split',
      direction: node.direction,
      first: cloneLayout(node.first),
      second: cloneLayout(node.second),
      sizes: node.sizes ? [...node.sizes] : undefined
    };
  } else {
    const tabHost = node as TabHostData;
    return {
      id: tabHost.id,
      tabs: tabHost.tabs.map(t => ({ ...t })),
      activeTabId: tabHost.activeTabId
    };
  }
};

// Helper: Find a TabHost by ID in the layout tree
const findTabHost = (node: LayoutNode, hostId: string): TabHostData | null => {
  if (isSplitNode(node)) {
    return findTabHost(node.first, hostId) || findTabHost(node.second, hostId);
  } else {
    const tabHost = node as TabHostData;
    return tabHost.id === hostId ? tabHost : null;
  }
};

// Helper: Find and replace a TabHost in the layout tree
const findAndReplaceTabHost = (node: LayoutNode, hostId: string, replacement: LayoutNode): LayoutNode => {
  if (isSplitNode(node)) {
    return {
      type: 'split',
      direction: node.direction,
      first: findAndReplaceTabHost(node.first, hostId, replacement),
      second: findAndReplaceTabHost(node.second, hostId, replacement),
      sizes: node.sizes
    };
  } else {
    const tabHost = node as TabHostData;
    return tabHost.id === hostId ? replacement : node;
  }
};

// Helper: Clean up empty TabHosts and collapse unnecessary splits
const cleanupEmptyTabHosts = (node: LayoutNode): LayoutNode | null => {
  if (isSplitNode(node)) {
    const cleanedFirst = cleanupEmptyTabHosts(node.first);
    const cleanedSecond = cleanupEmptyTabHosts(node.second);

    if (!cleanedFirst && !cleanedSecond) return null;
    if (!cleanedFirst) return cleanedSecond;
    if (!cleanedSecond) return cleanedFirst;

    return {
      type: 'split',
      direction: node.direction,
      first: cleanedFirst,
      second: cleanedSecond,
      sizes: node.sizes
    };
  } else {
    const tabHost = node as TabHostData;
    return tabHost.tabs.length === 0 ? null : node;
  }
};

// Helper: Find the active tab across all TabHosts
export const findActiveTab = (node: LayoutNode): { hostId: string; tabId: string } | null => {
  if (isSplitNode(node)) {
    return findActiveTab(node.first) || findActiveTab(node.second);
  } else {
    const tabHost = node as TabHostData;
    if (tabHost.activeTabId) {
      return { hostId: tabHost.id, tabId: tabHost.activeTabId };
    }
    return null;
  }
};

// Helper: Add or focus a tab in the layout
export const addOrFocusTab = (layout: LayoutNode, tab: TabItem, targetHostId?: string): LayoutNode => {
  const cloned = cloneLayout(layout);

  // Check if tab already exists in any TabHost
  const existingHost = findTabHostContainingTab(cloned, tab.id);
  if (existingHost) {
    existingHost.activeTabId = tab.id;
    return cloned;
  }

  // Add to specified host or first available
  const target = targetHostId ? findTabHost(cloned, targetHostId) : findFirstTabHost(cloned);
  if (target) {
    target.tabs.push(tab);
    target.activeTabId = tab.id;
  }

  return cloned;
};

// Helper: Find TabHost containing a specific tab
const findTabHostContainingTab = (node: LayoutNode, tabId: string): TabHostData | null => {
  if (isSplitNode(node)) {
    return findTabHostContainingTab(node.first, tabId) || findTabHostContainingTab(node.second, tabId);
  } else {
    const tabHost = node as TabHostData;
    return tabHost.tabs.some(t => t.id === tabId) ? tabHost : null;
  }
};

// Helper: Find the first TabHost in the layout tree
const findFirstTabHost = (node: LayoutNode): TabHostData | null => {
  if (isSplitNode(node)) {
    return findFirstTabHost(node.first) || findFirstTabHost(node.second);
  } else {
    return node as TabHostData;
  }
};

export const DockHost: React.FC<DockHostProps> = ({
  initialTabs = [],
  initialLayout,
  leftPanelHeader,
  leftPanelContent,
  rightPanelHeader,
  rightPanelContent,
  leftSideBar,
  rightSideBar,
  showLeftSideBar = true,
  showRightSideBar = true,
  showLeftPanel = true,
  showRightPanel = true,
  leftPanelWidth,
  rightPanelWidth,
  onActiveTabChange,
  onTabClose,
  layout: controlledLayout,
  onLayoutChange
}) => {
  const { theme } = useTheme();
  const centerRef = React.useRef<HTMLDivElement>(null);

  const defaultLayout: LayoutNode = initialLayout || {
    id: 'main-tabhost',
    tabs: initialTabs,
    activeTabId: initialTabs[initialTabs.length - 1]?.id
  };

  const [internalLayout, setInternalLayout] = useState<LayoutNode>(defaultLayout);

  const layout = controlledLayout || internalLayout;
  const setLayout = useCallback((updater: LayoutNode | ((prev: LayoutNode) => LayoutNode)) => {
    if (onLayoutChange && controlledLayout) {
      if (typeof updater === 'function') {
        onLayoutChange(updater(controlledLayout));
      } else {
        onLayoutChange(updater);
      }
    } else {
      setInternalLayout(updater as any);
    }
  }, [onLayoutChange, controlledLayout]);

  // Move tab to center zone (add to existing TabHost)
  const moveTabToCenter = (tab: TabItem, sourceId: string, targetId: string) => {
    setLayout(prevLayout => {
      const cloned = cloneLayout(prevLayout);
      const sourceHost = findTabHost(cloned, sourceId);
      const targetHost = findTabHost(cloned, targetId);

      if (!sourceHost || !targetHost) return prevLayout;

      sourceHost.tabs = sourceHost.tabs.filter(t => t.id !== tab.id);
      if (sourceHost.activeTabId === tab.id) {
        sourceHost.activeTabId = sourceHost.tabs[sourceHost.tabs.length - 1]?.id;
      }
      if (!targetHost.tabs.find(t => t.id === tab.id)) {
        targetHost.tabs.push(tab);
      }
      targetHost.activeTabId = tab.id;

      const cleaned = cleanupEmptyTabHosts(cloned);
      return cleaned || prevLayout;
    });
  };

  // Create split for edge zone drops
  const createSplit = (tab: TabItem, sourceId: string, targetId: string, zone: DropZone) => {
    setLayout(prevLayout => {
      const cloned = cloneLayout(prevLayout);
      const sourceHost = findTabHost(cloned, sourceId);
      if (!sourceHost) return prevLayout;

      sourceHost.tabs = sourceHost.tabs.filter(t => t.id !== tab.id);
      if (sourceHost.activeTabId === tab.id) {
        sourceHost.activeTabId = sourceHost.tabs[sourceHost.tabs.length - 1]?.id;
      }

      const newHostId = `tabhost-${Date.now()}`;
      const newTabHost: TabHostData = {
        id: newHostId,
        tabs: [tab],
        activeTabId: tab.id
      };

      let direction: SplitDirection;
      let first: LayoutNode;
      let second: LayoutNode;

      const targetNode = findTabHost(cloned, targetId);
      if (!targetNode) return prevLayout;

      if (zone === 'left' || zone === 'right') {
        direction = 'horizontal';
        if (zone === 'left') {
          first = newTabHost;
          second = targetNode;
        } else {
          first = targetNode;
          second = newTabHost;
        }
      } else {
        direction = 'vertical';
        if (zone === 'top') {
          first = newTabHost;
          second = targetNode;
        } else {
          first = targetNode;
          second = newTabHost;
        }
      }

      const splitNode: SplitNode = {
        type: 'split',
        direction,
        first,
        second,
        sizes: [50, 50]
      };

      const replaced = findAndReplaceTabHost(cloned, targetId, splitNode);
      const cleaned = cleanupEmptyTabHosts(replaced);
      return cleaned || prevLayout;
    });
  };

  const handleTabMove = (tab: TabItem, sourceId: string, targetId: string, zone: DropZone) => {
    if (zone === 'center') {
      moveTabToCenter(tab, sourceId, targetId);
    } else if (zone === 'left' || zone === 'right' || zone === 'top' || zone === 'bottom') {
      createSplit(tab, sourceId, targetId, zone);
    }
  };

  // Root-split: dock the tab against a full edge of the WHOLE layout (the extremity drop zones).
  const handleRootSplit = (tab: TabItem, sourceId: string, side: RootSide) => {
    setLayout(prevLayout => {
      const cloned = cloneLayout(prevLayout);
      const sourceHost = findTabHost(cloned, sourceId);
      if (!sourceHost) return prevLayout;

      sourceHost.tabs = sourceHost.tabs.filter(t => t.id !== tab.id);
      if (sourceHost.activeTabId === tab.id) {
        sourceHost.activeTabId = sourceHost.tabs[sourceHost.tabs.length - 1]?.id;
      }

      const newHost: TabHostData = { id: `tabhost-${Date.now()}`, tabs: [tab], activeTabId: tab.id };
      const base = cleanupEmptyTabHosts(cloned);
      if (!base) return newHost; // the dragged tab was the only content

      const horizontal = side === 'left' || side === 'right';
      const newFirst = side === 'left' || side === 'top';
      const splitNode: SplitNode = {
        type: 'split',
        direction: horizontal ? 'horizontal' : 'vertical',
        first: newFirst ? newHost : base,
        second: newFirst ? base : newHost,
        sizes: newFirst ? [30, 70] : [70, 30]
      };
      return splitNode;
    });
  };

  const handleTabReorder = (tab: TabItem, sourceId: string, targetHostId: string, dropPosition: { targetTabId: string | null; position: 'before' | 'after' }) => {
    setLayout(prevLayout => {
      const cloned = cloneLayout(prevLayout);
      const sourceHost = findTabHost(cloned, sourceId);
      const targetHost = findTabHost(cloned, targetHostId);

      if (!sourceHost || !targetHost) return prevLayout;

      sourceHost.tabs = sourceHost.tabs.filter(t => t.id !== tab.id);
      if (sourceHost.activeTabId === tab.id) {
        sourceHost.activeTabId = sourceHost.tabs[sourceHost.tabs.length - 1]?.id;
      }

      let insertIndex: number;
      if (dropPosition.targetTabId === null) {
        insertIndex = targetHost.tabs.length;
      } else {
        const targetTabIndex = targetHost.tabs.findIndex(t => t.id === dropPosition.targetTabId);
        if (targetTabIndex === -1) {
          insertIndex = targetHost.tabs.length;
        } else {
          insertIndex = dropPosition.position === 'before' ? targetTabIndex : targetTabIndex + 1;
        }
      }

      targetHost.tabs.splice(insertIndex, 0, tab);
      targetHost.activeTabId = tab.id;

      const cleaned = cleanupEmptyTabHosts(cloned);
      return cleaned || prevLayout;
    });
  };

  const handleTabChange = (hostId: string, tabId: string) => {
    setLayout(prevLayout => {
      const cloned = cloneLayout(prevLayout);
      const targetHost = findTabHost(cloned, hostId);
      if (targetHost) {
        targetHost.activeTabId = tabId;
      }
      return cloned;
    });

    if (onActiveTabChange) {
      onActiveTabChange(hostId, tabId);
    }
  };

  const handleTabClose = (hostId: string, tabId: string) => {
    setLayout(prevLayout => {
      const cloned = cloneLayout(prevLayout);
      const host = findTabHost(cloned, hostId);
      if (!host) return prevLayout;

      host.tabs = host.tabs.filter(t => t.id !== tabId);
      if (host.activeTabId === tabId) {
        host.activeTabId = host.tabs[host.tabs.length - 1]?.id;
      }

      // Clean up empty hosts from splits, but allow an empty root TabHost
      const cleaned = cleanupEmptyTabHosts(cloned);
      return cleaned || { id: host.id, tabs: [], activeTabId: undefined } as TabHostData;
    });

    if (onTabClose) {
      onTabClose(tabId);
    }
  };

  const renderLayout = (node: LayoutNode): React.ReactNode => {
    if (isSplitNode(node)) {
      return (
        <SplitContainer
          direction={node.direction}
          initialSizes={node.sizes}
        >
          {renderLayout(node.first)}
          {renderLayout(node.second)}
        </SplitContainer>
      );
    } else {
      const tabHostData = node as TabHostData;
      return (
        <TabHost
          hostId={tabHostData.id}
          tabs={tabHostData.tabs}
          activeTabId={tabHostData.activeTabId}
          onTabChange={(tabId) => handleTabChange(tabHostData.id, tabId)}
          onTabClose={(tabId) => handleTabClose(tabHostData.id, tabId)}
        />
      );
    }
  };

  return (
    <ToastProvider>
      <DragDropProvider onTabMove={handleTabMove} onTabReorder={handleTabReorder} onRootSplit={handleRootSplit}>
        <div style={{
          position: 'fixed',
          top: '0px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          overflow: 'hidden',
          backgroundColor: theme.background.primary,
          display: 'flex',
          flexDirection: 'row'
        }}>
          {showLeftSideBar && <SideBar position="left" {...leftSideBar} />}

          {showLeftPanel && (
            <VerticalPane
              position="left"
              header={leftPanelHeader}
              {...(leftPanelWidth != null ? { width: leftPanelWidth } : {})}
            >
              {leftPanelContent}
            </VerticalPane>
          )}

          {/* Center Layout Container */}
          <div ref={centerRef} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {renderLayout(layout)}
            <RootDropZones containerRef={centerRef} />
          </div>

          {showRightPanel && (
            <VerticalPane
              position="right"
              header={rightPanelHeader}
              {...(rightPanelWidth != null ? { width: rightPanelWidth } : {})}
            >
              {rightPanelContent}
            </VerticalPane>
          )}

          {showRightSideBar && <SideBar position="right" {...rightSideBar} />}
        </div>
        <ToastContainer />
      </DragDropProvider>
    </ToastProvider>
  );
};
