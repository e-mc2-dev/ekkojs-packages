// @ts-nocheck - Pre-existing type issues
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme, getSemanticColor, getContrastTextColor, addAlpha } from '../../theme';
import { Checkbox } from '../Checkbox/Checkbox';
import { TextBox } from '../TextBox/TextBox';
import { Typography } from '../Typography/Typography';

// Types
export type TreeViewSize = 'compact' | 'normal' | 'large';
export type TreeViewSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type TreeViewAnimation = 'none' | 'fade' | 'scroll';
export type TreeViewSelectionMode = 'none' | 'single' | 'multiple' | 'checkbox';

export interface TreeNode<T = any> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode<T>[];
  data?: T;
  disabled?: boolean;
  locked?: boolean;
  customContent?: React.ReactNode;
  lazyLoad?: boolean;
  onLoad?: () => Promise<TreeNode<T>[]>;
}

export interface TreeViewProps<T = any> {
  // Data
  nodes: TreeNode<T>[];

  // Selection
  selectionMode?: TreeViewSelectionMode;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;

  // Expansion
  expandedIds?: string[];
  onExpandedChange?: (expandedIds: string[]) => void;
  defaultExpandedIds?: string[];
  expandAll?: boolean;

  // Appearance
  size?: TreeViewSize;
  semantic?: TreeViewSemantic;
  /** Per-depth label colors: levelColors[depth], clamped to the last entry for deeper nodes. */
  levelColors?: string[];
  showOutline?: boolean;
  animation?: TreeViewAnimation;

  // Features
  allowLabelEdit?: boolean;
  onLabelEdit?: (nodeId: string, newLabel: string) => void;

  allowDragDrop?: boolean;
  onNodeMove?: (nodeId: string, targetId: string | null, position: 'before' | 'after' | 'child') => void;

  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;

  contextMenuItems?: (node: TreeNode<T>) => any[];

  // Virtual scrolling
  virtualScroll?: boolean;
  itemHeight?: number;
  containerHeight?: number;

  // Custom rendering
  renderNode?: (node: TreeNode<T>, defaultRender: React.ReactNode) => React.ReactNode;
  expandIcon?: React.ReactNode;
  collapseIcon?: React.ReactNode;

  // Events
  onNodeClick?: (node: TreeNode<T>) => void;
  onNodeDoubleClick?: (node: TreeNode<T>) => void;
  onNodeExpand?: (node: TreeNode<T>) => void;
  onNodeCollapse?: (node: TreeNode<T>) => void;
  onNodeContextMenu?: (node: TreeNode<T>, event: React.MouseEvent) => void;

  // HTML attributes
  className?: string;
  style?: React.CSSProperties;
}

export const TreeView = <T,>({
  nodes,
  selectionMode = 'single',
  selectedIds = [],
  onSelectionChange,
  expandedIds: controlledExpandedIds,
  onExpandedChange,
  defaultExpandedIds = [],
  expandAll = false,
  size = 'normal',
  semantic = 'primary',
  levelColors,
  showOutline = true,
  animation = 'scroll',
  allowLabelEdit = false,
  onLabelEdit,
  allowDragDrop = false,
  onNodeMove,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearch,
  contextMenuItems,
  virtualScroll = false,
  itemHeight,
  containerHeight = 400,
  renderNode,
  expandIcon,
  collapseIcon,
  onNodeClick,
  onNodeDoubleClick,
  onNodeExpand,
  onNodeCollapse,
  onNodeContextMenu,
  className = '',
  style
}: TreeViewProps<T>) => {
  const { theme } = useTheme();

  // State
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>(
    expandAll ? getAllNodeIds(nodes) : defaultExpandedIds
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ nodeId: string; position: 'before' | 'after' | 'child' } | null>(null);
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  const treeRef = useRef<HTMLDivElement>(null);
  const expandedIds = controlledExpandedIds ?? internalExpandedIds;

  // Size configurations
  const sizeConfig = {
    compact: {
      height: 28,
      fontSize: 12,
      indent: 16,
      iconSize: 14,
      gap: 4,
      padding: '2px 8px'
    },
    normal: {
      height: 36,
      fontSize: 14,
      indent: 20,
      iconSize: 16,
      gap: 6,
      padding: '6px 12px'
    },
    large: {
      height: 44,
      fontSize: 16,
      indent: 24,
      iconSize: 18,
      gap: 8,
      padding: '10px 16px'
    }
  };

  const config = sizeConfig[size];
  const semanticColor = getSemanticColor(semantic, theme);

  // Helper functions
  function getAllNodeIds(nodeList: TreeNode<T>[], ids: string[] = []): string[] {
    nodeList.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        getAllNodeIds(node.children, ids);
      }
    });
    return ids;
  }

  function findNode(nodeList: TreeNode<T>[], id: string): TreeNode<T> | null {
    for (const node of nodeList) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function getNodeDescendants(node: TreeNode<T>, descendants: string[] = []): string[] {
    if (node.children) {
      node.children.forEach(child => {
        descendants.push(child.id);
        getNodeDescendants(child, descendants);
      });
    }
    return descendants;
  }

  function getNodePath(nodeList: TreeNode<T>[], targetId: string, path: string[] = []): string[] | null {
    for (const node of nodeList) {
      const currentPath = [...path, node.id];
      if (node.id === targetId) return currentPath;
      if (node.children) {
        const found = getNodePath(node.children, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  }

  const handleExpand = useCallback((nodeId: string) => {
    const newExpandedIds = [...expandedIds, nodeId];
    if (controlledExpandedIds) {
      onExpandedChange?.(newExpandedIds);
    } else {
      setInternalExpandedIds(newExpandedIds);
    }

    const node = findNode(nodes, nodeId);
    if (node) {
      onNodeExpand?.(node);

      // Handle lazy loading
      if (node.lazyLoad && node.onLoad && !loadingNodes.has(nodeId)) {
        setLoadingNodes(prev => new Set(prev).add(nodeId));
        node.onLoad().then(children => {
          node.children = children;
          setLoadingNodes(prev => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        });
      }
    }
  }, [expandedIds, controlledExpandedIds, onExpandedChange, nodes, onNodeExpand, loadingNodes]);

  const handleCollapse = useCallback((nodeId: string) => {
    const newExpandedIds = expandedIds.filter(id => id !== nodeId);
    if (controlledExpandedIds) {
      onExpandedChange?.(newExpandedIds);
    } else {
      setInternalExpandedIds(newExpandedIds);
    }

    const node = findNode(nodes, nodeId);
    if (node) {
      onNodeCollapse?.(node);
    }
  }, [expandedIds, controlledExpandedIds, onExpandedChange, nodes, onNodeCollapse]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    if (expandedIds.includes(nodeId)) {
      handleCollapse(nodeId);
    } else {
      handleExpand(nodeId);
    }
  }, [expandedIds, handleExpand, handleCollapse]);

  const handleNodeSelect = useCallback((nodeId: string, ctrlKey: boolean = false, shiftKey: boolean = false) => {
    if (selectionMode === 'none') return;

    const node = findNode(nodes, nodeId);
    if (node?.disabled) return;

    let newSelectedIds: string[] = [];

    if (selectionMode === 'single') {
      newSelectedIds = [nodeId];
    } else if (selectionMode === 'multiple') {
      if (ctrlKey) {
        // Toggle selection
        if (selectedIds.includes(nodeId)) {
          newSelectedIds = selectedIds.filter(id => id !== nodeId);
        } else {
          newSelectedIds = [...selectedIds, nodeId];
        }
      } else if (shiftKey && selectedIds.length > 0) {
        // Range selection
        const allIds = getAllNodeIds(nodes);
        const lastSelectedId = selectedIds[selectedIds.length - 1];
        const lastIndex = allIds.indexOf(lastSelectedId);
        const currentIndex = allIds.indexOf(nodeId);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        newSelectedIds = allIds.slice(start, end + 1);
      } else {
        newSelectedIds = [nodeId];
      }
    }

    onSelectionChange?.(newSelectedIds);
  }, [selectionMode, selectedIds, nodes, onSelectionChange]);

  const handleCheckboxChange = useCallback((nodeId: string, checked: boolean) => {
    const node = findNode(nodes, nodeId);
    if (!node) return;

    let newSelectedIds = [...selectedIds];

    if (checked) {
      // Add node and all descendants
      newSelectedIds.push(nodeId);
      const descendants = getNodeDescendants(node);
      newSelectedIds.push(...descendants);
    } else {
      // Remove node and all descendants
      const descendants = getNodeDescendants(node);
      const toRemove = [nodeId, ...descendants];
      newSelectedIds = newSelectedIds.filter(id => !toRemove.includes(id));
    }

    // Deduplicate
    newSelectedIds = Array.from(new Set(newSelectedIds));

    onSelectionChange?.(newSelectedIds);
  }, [selectedIds, nodes, onSelectionChange]);

  const getCheckboxState = useCallback((node: TreeNode<T>): { checked: boolean; indeterminate: boolean } => {
    const descendants = node.children ? getNodeDescendants(node) : [];
    const allIds = [node.id, ...descendants];

    const selectedCount = allIds.filter(id => selectedIds.includes(id)).length;

    if (selectedCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedCount === allIds.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  }, [selectedIds]);

  const handleLabelDoubleClick = useCallback((node: TreeNode<T>) => {
    if (allowLabelEdit && !node.disabled && !node.locked) {
      setEditingNodeId(node.id);
      setEditingValue(node.label);
    }
  }, [allowLabelEdit]);

  const handleLabelEditSave = useCallback(() => {
    if (editingNodeId && editingValue.trim()) {
      onLabelEdit?.(editingNodeId, editingValue.trim());
    }
    setEditingNodeId(null);
    setEditingValue('');
  }, [editingNodeId, editingValue, onLabelEdit]);

  const handleLabelEditCancel = useCallback(() => {
    setEditingNodeId(null);
    setEditingValue('');
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectionMode === 'none' || selectedIds.length === 0) return;

      const allIds = getAllNodeIds(nodes);
      const currentIndex = allIds.indexOf(selectedIds[selectedIds.length - 1]);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, allIds.length - 1);
        handleNodeSelect(allIds[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        handleNodeSelect(allIds[prevIndex]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentId = allIds[currentIndex];
        if (!expandedIds.includes(currentId)) {
          handleExpand(currentId);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentId = allIds[currentIndex];
        if (expandedIds.includes(currentId)) {
          handleCollapse(currentId);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        handleNodeSelect(allIds[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        handleNodeSelect(allIds[allIds.length - 1]);
      }
    };

    const currentRef = treeRef.current;
    currentRef?.addEventListener('keydown', handleKeyDown);

    return () => {
      currentRef?.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds, nodes, selectionMode, expandedIds, handleNodeSelect, handleExpand, handleCollapse]);

  // Search filter
  const filterNodes = useCallback((nodeList: TreeNode<T>[], query: string): TreeNode<T>[] => {
    if (!query) return nodeList;

    return nodeList.filter(node => {
      const matches = node.label.toLowerCase().includes(query.toLowerCase());
      const childrenMatch = node.children && filterNodes(node.children, query).length > 0;
      return matches || childrenMatch;
    }).map(node => ({
      ...node,
      children: node.children ? filterNodes(node.children, query) : undefined
    }));
  }, []);

  const filteredNodes = showSearch && searchQuery ? filterNodes(nodes, searchQuery) : nodes;

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    if (!allowDragDrop) return;
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  }, [allowDragDrop]);

  const handleDragOver = useCallback((e: React.DragEvent, nodeId: string) => {
    if (!allowDragDrop || !draggedNodeId) return;
    e.preventDefault();
    e.stopPropagation();

    // Determine drop position based on mouse Y position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'before' | 'after' | 'child' = 'child';
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    }

    setDropTarget({ nodeId, position });
  }, [allowDragDrop, draggedNodeId]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetNodeId: string) => {
    if (!allowDragDrop || !draggedNodeId || !dropTarget) return;
    e.preventDefault();
    e.stopPropagation();

    // Prevent dropping on itself or its descendants
    const draggedNode = findNode(nodes, draggedNodeId);
    if (draggedNode) {
      const descendants = getNodeDescendants(draggedNode);
      if (targetNodeId === draggedNodeId || descendants.includes(targetNodeId)) {
        setDraggedNodeId(null);
        setDropTarget(null);
        return;
      }
    }

    onNodeMove?.(draggedNodeId, targetNodeId, dropTarget.position);

    setDraggedNodeId(null);
    setDropTarget(null);
  }, [allowDragDrop, draggedNodeId, dropTarget, nodes, onNodeMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedNodeId(null);
    setDropTarget(null);
  }, []);

  // Render node
  const renderTreeNode = useCallback((node: TreeNode<T>, level: number = 0): React.ReactNode => {
    const isExpanded = expandedIds.includes(node.id);
    const isSelected = selectedIds.includes(node.id);
    const isHovered = hoveredNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const isLoading = loadingNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isDragged = draggedNodeId === node.id;
    const isDropTarget = dropTarget?.nodeId === node.id;

    const checkboxState = selectionMode === 'checkbox' ? getCheckboxState(node) : null;

    // Default expand/collapse icons - using a simple right-pointing triangle
    // that will be rotated 90deg when expanded to point down
    const defaultIcon = (
      <svg width={config.iconSize} height={config.iconSize} viewBox="0 0 16 16" fill="currentColor">
        <path d="M6 4l4 4-4 4z" />
      </svg>
    );

    // Use custom icons if provided, otherwise use the default rotated icon
    const expandCollapseIcon = isExpanded ? (collapseIcon || defaultIcon) : (expandIcon || defaultIcon);

    // Node container styles
    const nodeContainerStyle: React.CSSProperties = {
      position: 'relative',
      opacity: isDragged ? 0.5 : 1
    };

    // Node content styles
    const nodeContentStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      height: config.height,
      padding: config.padding,
      paddingLeft: level * config.indent + 8,
      cursor: node.disabled ? 'not-allowed' : 'pointer',
      backgroundColor: isSelected
        ? addAlpha(semanticColor, 0.15)
        : isHovered
          ? addAlpha(theme.text.primary, 0.05)
          : 'transparent',
      borderLeft: isSelected ? `2px solid ${semanticColor}` : '2px solid transparent',
      // levelColors apply only to non-terminal (parent) nodes, to visualize the hierarchy; leaves stay default.
      color: node.disabled
        ? theme.text.disabled
        : (hasChildren && levelColors && levelColors.length ? levelColors[Math.min(level, levelColors.length - 1)] : theme.text.primary),
      transition: animation !== 'none' ? 'all 0.2s ease' : 'none',
      userSelect: 'none'
    };

    // Drop indicator styles
    let dropIndicatorStyle: React.CSSProperties | undefined;
    if (isDropTarget && dropTarget) {
      const indicatorBase: React.CSSProperties = {
        position: 'absolute',
        left: level * config.indent + 8,
        right: 0,
        height: 2,
        backgroundColor: semanticColor,
        pointerEvents: 'none'
      };

      if (dropTarget.position === 'before') {
        dropIndicatorStyle = { ...indicatorBase, top: 0 };
      } else if (dropTarget.position === 'after') {
        dropIndicatorStyle = { ...indicatorBase, bottom: 0 };
      } else {
        dropIndicatorStyle = {
          ...indicatorBase,
          height: '100%',
          opacity: 0.1,
          left: 0
        };
      }
    }

    // Render outline (the vertical guide line connecting a node to its siblings, at the parent's indent).
    // It's absolutely positioned inside the node's container — which also contains this node's expanded
    // children — so it MUST span the full container (bottom:0) to stay continuous down a sibling group.
    // Stopping short when a node was expanded (the old `config.height/2`) broke the line right where a
    // parent had its children open.
    const outlineStyle: React.CSSProperties | undefined = showOutline && level > 0 ? {
      position: 'absolute',
      left: (level - 1) * config.indent + 8 + config.iconSize / 2,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: addAlpha(semanticColor, 0.3)
    } : undefined;

    const defaultNodeContent = (
      <>
        {/* Expand/collapse button (or spacer for leaf alignment) */}
        {(hasChildren || node.lazyLoad) ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!node.disabled) {
                handleToggleExpand(node.id);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: config.iconSize + 8,
              height: config.iconSize + 8,
              marginRight: config.gap,
              cursor: node.disabled ? 'not-allowed' : 'pointer',
              color: semanticColor,
              transition: 'transform 0.2s ease',
              // Only rotate if using default chevron icons, not custom icons
              transform: (!expandIcon && !collapseIcon) ? (isExpanded ? 'rotate(90deg)' : 'rotate(0deg)') : 'none'
            }}
          >
            {isLoading ? (
              <div style={{
                width: config.iconSize,
                height: config.iconSize,
                border: `2px solid ${theme.text.disabled}`,
                borderTopColor: semanticColor,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <div style={{ display: 'flex' }}>
                {expandCollapseIcon}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: config.iconSize + 8, marginRight: config.gap, flexShrink: 0 }} />
        )}

        {/* Checkbox */}
        {selectionMode === 'checkbox' && checkboxState && (
          <div style={{ marginRight: config.gap }} onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={checkboxState.checked}
              indeterminate={checkboxState.indeterminate}
              onChange={(checked) => handleCheckboxChange(node.id, checked)}
              disabled={node.disabled}
              size={size === 'compact' ? 'small' : size === 'large' ? 'large' : 'normal'}
              type={semantic}
            />
          </div>
        )}

        {/* Icon */}
        {node.icon && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: config.gap,
            fontSize: config.iconSize
          }}>
            {node.icon}
          </div>
        )}

        {/* Label */}
        {isEditing ? (
          <div style={{ flex: 1, marginRight: config.gap }} onClick={(e) => e.stopPropagation()}>
            <TextBox
              value={editingValue}
              onChange={(value) => setEditingValue(value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLabelEditSave();
                } else if (e.key === 'Escape') {
                  handleLabelEditCancel();
                }
              }}
              onBlur={handleLabelEditSave}
              size={size === 'compact' ? 'small' : size === 'large' ? 'large' : 'normal'}
              autoFocus
            />
          </div>
        ) : (
          <div
            style={{ flex: 1, fontSize: config.fontSize }}
            onDoubleClick={() => {
              if (allowLabelEdit) {
                handleLabelDoubleClick(node);
              } else {
                onNodeDoubleClick?.(node);
              }
            }}
          >
            {node.customContent || (
              <Typography variant="body2" color="inherit" style={{ fontSize: config.fontSize }}>
                {node.label}
              </Typography>
            )}
          </div>
        )}

        {/* Locked icon */}
        {node.locked && (
          <div style={{
            marginLeft: 'auto',
            paddingLeft: config.gap,
            color: theme.text.secondary,
            fontSize: config.iconSize
          }}>
            <svg width={config.iconSize} height={config.iconSize} viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a2 2 0 0 1 2 2v3h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V3a2 2 0 0 1 2-2zm1 5V3a1 1 0 0 0-2 0v3h2z"/>
            </svg>
          </div>
        )}
      </>
    );

    return (
      <div key={node.id} style={nodeContainerStyle}>
        {/* Outline line */}
        {outlineStyle && <div style={outlineStyle} />}

        {/* Drop indicator */}
        {dropIndicatorStyle && <div style={dropIndicatorStyle} />}

        {/* Node content */}
        <div
          style={nodeContentStyle}
          onClick={(e) => {
            if (!node.disabled) {
              handleNodeSelect(node.id, e.ctrlKey || e.metaKey, e.shiftKey);
              onNodeClick?.(node);
              // A single click on a parent row also toggles expand/collapse (not just the chevron).
              if (hasChildren || node.lazyLoad) {
                handleToggleExpand(node.id);
              }
            }
          }}
          onContextMenu={(e) => {
            if (contextMenuItems || onNodeContextMenu) {
              e.preventDefault();
              onNodeContextMenu?.(node, e);
            }
          }}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          draggable={allowDragDrop && !node.disabled && !node.locked}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id)}
          onDragEnd={handleDragEnd}
        >
          {renderNode ? renderNode(node, defaultNodeContent) : defaultNodeContent}
        </div>

        {/* Children */}
        {hasChildren && (
          <div
            style={{
              overflow: 'hidden',
              maxHeight: animation === 'scroll'
                ? (isExpanded ? '100vh' : '0px')
                : (isExpanded ? 'none' : '0px'),
              transition: animation === 'scroll'
                ? 'max-height 0.3s ease, opacity 0.3s ease'
                : animation === 'fade'
                  ? 'opacity 0.3s ease'
                  : 'none',
              opacity: animation === 'fade'
                ? (isExpanded ? 1 : 0)
                : 1,
              display: animation === 'none' && !isExpanded ? 'none' : 'block'
            }}
          >
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [
    expandedIds, selectedIds, hoveredNodeId, editingNodeId, draggedNodeId, dropTarget, loadingNodes,
    selectionMode, config, theme, semanticColor, levelColors, animation, showOutline, allowLabelEdit, allowDragDrop,
    expandIcon, collapseIcon, renderNode, getCheckboxState, handleToggleExpand, handleCheckboxChange,
    handleLabelDoubleClick, handleNodeSelect, handleDragStart, handleDragOver, handleDragLeave,
    handleDrop, handleDragEnd, onNodeClick, onNodeDoubleClick, onNodeContextMenu, contextMenuItems,
    handleLabelEditSave, handleLabelEditCancel, editingValue, size, semantic
  ]);

  return (
    <div
      ref={treeRef}
      className={className}
      style={{
        ...style,
        outline: 'none'
      }}
      tabIndex={0}
    >
      {/* Search bar */}
      {showSearch && (
        <div style={{ marginBottom: 8 }}>
          <TextBox
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              onSearch?.(value);
            }}
            placeholder={searchPlaceholder}
            size={size === 'compact' ? 'small' : size === 'large' ? 'large' : 'normal'}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            }
          />
        </div>
      )}

      {/* Tree nodes */}
      <div style={{
        overflow: virtualScroll ? 'auto' : 'visible',
        height: virtualScroll ? containerHeight : 'auto'
      }}>
        {filteredNodes.map(node => renderTreeNode(node, 0))}
      </div>

      {/* Keyframe for loading spinner */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

