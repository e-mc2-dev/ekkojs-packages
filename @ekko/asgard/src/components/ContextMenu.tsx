import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../theme';

export interface MenuItem {
  id: string;
  label: string;
  shortcutKey?: string; // Underlined letter (e.g., 'F' in 'File')
  keyboardShortcut?: string; // Display like "Ctrl+Shift+P"
  icon?: ReactNode;
  disabled?: boolean;
  checked?: boolean; // For toggle items
  separator?: boolean; // Render as separator
  submenu?: MenuItem[];
  onClick?: () => void;
}

interface ContextMenuProps {
  items: MenuItem[];
  anchorElement: HTMLElement | null;
  onClose: () => void;
  parentMenuRef?: React.RefObject<HTMLDivElement>; // For submenu positioning
}

interface MenuPosition {
  top: number;
  left: number;
  maxHeight?: number;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  anchorElement,
  onClose,
  parentMenuRef
}) => {
  const { theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState<boolean>(false); // Hide until positioned
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const [showSubmenu, setShowSubmenu] = useState<{ [key: string]: boolean }>({});
  const submenuOpenTimeoutRef = useRef<number | null>(null);
  const submenuCloseTimeoutRef = useRef<number | null>(null);
  const menuJustOpenedRef = useRef<boolean>(true); // Prevent immediate submenu opening
  const submenuOpenedByClickRef = useRef<boolean>(false); // Track if submenu was opened by click

  // Calculate menu position based on anchor element and viewport
  useEffect(() => {
    if (!anchorElement || !menuRef.current) return;

    const anchorRect = anchorElement.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = anchorRect.bottom;
    let left = anchorRect.left;

    // If this is a submenu, position to the right of parent
    if (parentMenuRef?.current) {
      const parentRect = parentMenuRef.current.getBoundingClientRect();
      left = parentRect.right;
      top = anchorRect.top;

      // If submenu would go off right edge, show on left instead
      if (left + menuRect.width > viewportWidth) {
        left = parentRect.left - menuRect.width;
      }
    } else {
      // For top-level menu (no parent), position to the right of the anchor
      left = anchorRect.right;
      top = anchorRect.top;

      // If menu would go off right edge, show on left instead
      if (left + menuRect.width > viewportWidth) {
        left = anchorRect.left - menuRect.width;
      }
    }

    // Adjust horizontal position if menu would go off right edge
    if (left + menuRect.width > viewportWidth) {
      left = viewportWidth - menuRect.width - 8;
    }

    // Ensure menu doesn't go off left edge
    if (left < 8) {
      left = 8;
    }

    // Adjust vertical position if menu would go off bottom
    if (top + menuRect.height > viewportHeight) {
      // Try positioning above anchor instead
      const topAbove = anchorRect.top - menuRect.height;
      if (topAbove >= 8) {
        top = topAbove;
      } else {
        // If doesn't fit above either, constrain height and add scroll
        top = 8;
        const maxHeight = viewportHeight - 16;
        setPosition({ top, left, maxHeight });
        setIsPositioned(true);
        return;
      }
    }

    // Ensure menu doesn't go off top
    if (top < 8) {
      top = 8;
    }

    setPosition({ top, left });
    setIsPositioned(true);
  }, [anchorElement, parentMenuRef]);

  // Close menu on click outside and cleanup
  useEffect(() => {
    // Clear the "just opened" flag after a short delay to allow submenus
    const justOpenedTimeout = window.setTimeout(() => {
      menuJustOpenedRef.current = false;
    }, 100);

    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if click is inside this menu
      if (menuRef.current?.contains(e.target as Node)) return;
      // Don't close if click is inside any context menu (including submenus)
      if ((e.target as Element).closest?.('.context-menu, .context-menu-submenu')) return;
      onClose();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.clearTimeout(justOpenedTimeout);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);

      // Cleanup timeouts on unmount
      if (submenuOpenTimeoutRef.current !== null) {
        window.clearTimeout(submenuOpenTimeoutRef.current);
      }
      if (submenuCloseTimeoutRef.current !== null) {
        window.clearTimeout(submenuCloseTimeoutRef.current);
      }
    };
  }, [onClose]);

  const handleItemMouseEnter = (item: MenuItem) => {
    setHoveredItemId(item.id);

    // Don't open submenus if menu just opened (prevents immediate submenu on hover)
    if (menuJustOpenedRef.current) {
      return;
    }

    // Clear any existing open timeout
    if (submenuOpenTimeoutRef.current !== null) {
      window.clearTimeout(submenuOpenTimeoutRef.current);
      submenuOpenTimeoutRef.current = null;
    }

    // Clear any pending close timeout (bounce delay)
    if (submenuCloseTimeoutRef.current !== null) {
      window.clearTimeout(submenuCloseTimeoutRef.current);
      submenuCloseTimeoutRef.current = null;
    }

    if (item.submenu) {
      // If a different submenu is open, delay closing it (bounce effect)
      // BUT only if it wasn't opened by click
      if (openSubmenuId && openSubmenuId !== item.id && !submenuOpenedByClickRef.current) {
        const submenuIdToClose = openSubmenuId; // Capture the ID to close
        // Bounce delay: keep old submenu open for 300ms to allow reaching it
        submenuCloseTimeoutRef.current = window.setTimeout(() => {
          // Only close if this specific submenu is still open (hasn't been replaced)
          setOpenSubmenuId(currentId => {
            if (currentId === submenuIdToClose) {
              setShowSubmenu(prev => {
                const newState = { ...prev };
                delete newState[submenuIdToClose];
                return newState;
              });
              return null;
            }
            return currentId;
          });
        }, 300);
      }

      // Open submenu after 200ms delay (only if still hovering)
      submenuOpenTimeoutRef.current = window.setTimeout(() => {
        // Only open if this item is still hovered
        setHoveredItemId(currentHovered => {
          if (currentHovered === item.id) {
            // Clear the close timeout since we're opening a new submenu
            if (submenuCloseTimeoutRef.current !== null) {
              window.clearTimeout(submenuCloseTimeoutRef.current);
              submenuCloseTimeoutRef.current = null;
            }
            setOpenSubmenuId(item.id);
            setShowSubmenu(prev => ({ ...prev, [item.id]: true }));
            submenuOpenedByClickRef.current = false; // Opened by hover, not click
          }
          return currentHovered;
        });
      }, 200);
    } else {
      // No submenu, but delay closing any open submenu (bounce effect)
      // BUT only if it wasn't opened by click
      if (openSubmenuId && !submenuOpenedByClickRef.current) {
        const submenuIdToClose = openSubmenuId; // Capture the ID to close
        submenuCloseTimeoutRef.current = window.setTimeout(() => {
          // Only close if this specific submenu is still open (hasn't been replaced)
          setOpenSubmenuId(currentId => {
            if (currentId === submenuIdToClose) {
              setShowSubmenu({});
              return null;
            }
            return currentId;
          });
        }, 300);
      }
    }
  };

  const handleItemClick = (item: MenuItem, e: React.MouseEvent) => {
    if (item.disabled) return;

    // If item has submenu, ONLY open it (never close, multiple clicks do nothing)
    if (item.submenu) {
      e.stopPropagation(); // Prevent event from bubbling to click-outside handler
      e.preventDefault();

      // Click is a user action, so clear the "just opened" flag to allow immediate opening
      menuJustOpenedRef.current = false;

      // Clear any pending timeouts
      if (submenuOpenTimeoutRef.current !== null) {
        window.clearTimeout(submenuOpenTimeoutRef.current);
        submenuOpenTimeoutRef.current = null;
      }
      if (submenuCloseTimeoutRef.current !== null) {
        window.clearTimeout(submenuCloseTimeoutRef.current);
        submenuCloseTimeoutRef.current = null;
      }

      // Only open if not already open (multiple clicks do nothing)
      if (openSubmenuId !== item.id || !showSubmenu[item.id]) {
        setOpenSubmenuId(item.id);
        setShowSubmenu(prev => ({ ...prev, [item.id]: true }));
        submenuOpenedByClickRef.current = true; // Mark as opened by click
      }
      return; // IMPORTANT: Don't close the entire menu, just handle the submenu
    }

    // Execute click handler for non-submenu items
    if (item.onClick) {
      item.onClick();
    }

    // Only close the entire menu for non-submenu items
    onClose();
  };

  const renderLabel = (label: string, shortcutKey?: string) => {
    if (!shortcutKey) return label;

    const index = label.toLowerCase().indexOf(shortcutKey.toLowerCase());
    if (index === -1) return label;

    return (
      <>
        {label.substring(0, index)}
        <span style={{ textDecoration: 'underline' }}>
          {label[index]}
        </span>
        {label.substring(index + 1)}
      </>
    );
  };

  return (
    <>
      <div
        ref={menuRef}
        className={parentMenuRef ? 'context-menu-submenu' : 'context-menu'}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined,
          overflow: position.maxHeight ? 'auto' : undefined,
          backgroundColor: theme.components.menu.background,
          border: `1px solid ${theme.border.default}`,
          boxShadow: theme.components.menu.shadow,
          minWidth: '220px',
          padding: '4px 0',
          zIndex: 10000,
          borderRadius: '4px',
          visibility: isPositioned ? 'visible' : 'hidden'
        }}
      >
        {items.map((item) => {
          if (item.separator) {
            return (
              <div
                key={item.id}
                style={{
                  height: '1px',
                  backgroundColor: theme.components.menu.separator,
                  margin: '4px 8px'
                }}
              />
            );
          }

          const isHovered = hoveredItemId === item.id;
          const hasSubmenu = !!item.submenu;

          return (
            <div
              key={item.id}
              data-item-id={item.id}
              onMouseEnter={() => handleItemMouseEnter(item)}
              onMouseDown={(e) => handleItemClick(item, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                cursor: item.disabled ? 'default' : 'pointer',
                backgroundColor: isHovered && !item.disabled ? theme.components.menu.itemHover : 'transparent',
                color: item.disabled ? theme.text.disabled : theme.text.primary,
                fontSize: '13px',
                position: 'relative',
                userSelect: 'none'
              }}
            >
              {/* Checkbox/Icon area */}
              <div style={{ width: '20px', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                {item.checked && (
                  <span style={{ fontSize: '12px' }}>✓</span>
                )}
                {item.icon && !item.checked && item.icon}
              </div>

              {/* Label with shortcut key underline */}
              <div style={{ flex: 1 }}>
                {renderLabel(item.label, item.shortcutKey)}
              </div>

              {/* Keyboard shortcut or submenu arrow */}
              <div style={{ marginLeft: '24px', fontSize: '11px', color: theme.text.secondary }}>
                {hasSubmenu ? (
                  <span>▶</span>
                ) : (
                  item.keyboardShortcut
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Render submenus outside the main menu container */}
      {items.map((item) => {
        if (!item.submenu || openSubmenuId !== item.id || !showSubmenu[item.id]) return null;

        return (
          <ContextMenu
            key={`submenu-${item.id}`}
            items={item.submenu}
            anchorElement={menuRef.current?.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement || anchorElement}
            onClose={onClose}
            parentMenuRef={menuRef}
          />
        );
      })}
    </>
  );
};
