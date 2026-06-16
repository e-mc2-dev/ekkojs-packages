import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { TabItem } from './TabHost';

export type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center' | null;

export interface TabDropPosition {
  targetTabId: string | null; // null means drop at end
  position: 'before' | 'after';
}

interface DragState {
  isDragging: boolean;
  draggedTab: TabItem | null;
  sourceTabHostId: string | null;
  hoveredTabHostId: string | null;
  dropZone: DropZone;
}

export type RootSide = 'left' | 'right' | 'top' | 'bottom';

interface DragDropContextType {
  dragState: DragState;
  startDrag: (tab: TabItem, sourceId: string) => void;
  endDrag: () => void;
  setHoveredTabHost: (hostId: string | null, zone: DropZone) => void;
  handleDrop: (targetHostId: string, zone: DropZone, tab: TabItem, sourceId: string) => void;
  handleTabReorder: (tab: TabItem, sourceId: string, targetHostId: string, dropPosition: TabDropPosition) => void;
  handleRootDrop: (side: RootSide, tab: TabItem, sourceId: string) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: ReactNode;
  onTabMove?: (tab: TabItem, sourceId: string, targetId: string, zone: DropZone) => void;
  onTabReorder?: (tab: TabItem, sourceId: string, targetHostId: string, dropPosition: TabDropPosition) => void;
  onRootSplit?: (tab: TabItem, sourceId: string, side: RootSide) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ children, onTabMove, onTabReorder, onRootSplit }) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTab: null,
    sourceTabHostId: null,
    hoveredTabHostId: null,
    dropZone: null
  });

  const startDrag = (tab: TabItem, sourceId: string) => {
    setDragState({
      isDragging: true,
      draggedTab: tab,
      sourceTabHostId: sourceId,
      hoveredTabHostId: null,
      dropZone: null
    });
  };

  const endDrag = () => {
    setDragState({
      isDragging: false,
      draggedTab: null,
      sourceTabHostId: null,
      hoveredTabHostId: null,
      dropZone: null
    });
  };

  const setHoveredTabHost = (hostId: string | null, zone: DropZone) => {
    setDragState(prev => ({
      ...prev,
      hoveredTabHostId: hostId,
      dropZone: zone
    }));
  };

  const handleDrop = (targetHostId: string, zone: DropZone, tab: TabItem, sourceId: string) => {
    setHoveredTabHost(null, null);
    endDrag();
    if (tab && sourceId && onTabMove && zone) {
      onTabMove(tab, sourceId, targetHostId, zone);
    }
  };

  const handleTabReorder = (tab: TabItem, sourceId: string, targetHostId: string, dropPosition: TabDropPosition) => {
    endDrag();
    if (tab && sourceId && onTabReorder) {
      onTabReorder(tab, sourceId, targetHostId, dropPosition);
    }
  };

  const handleRootDrop = (side: RootSide, tab: TabItem, sourceId: string) => {
    endDrag();
    if (tab && sourceId && onRootSplit) {
      onRootSplit(tab, sourceId, side);
    }
  };

  return (
    <DragDropContext.Provider value={{ dragState, startDrag, endDrag, setHoveredTabHost, handleDrop, handleTabReorder, handleRootDrop }}>
      {children}
    </DragDropContext.Provider>
  );
};
