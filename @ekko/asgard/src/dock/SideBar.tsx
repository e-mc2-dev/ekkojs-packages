import React, { useState, useRef } from 'react';
import { SideBarIcon } from './SideBarIcon';
import { ContextMenu } from '../components/ContextMenu';
import type { MenuItem } from '../components/ContextMenu';
import { useTheme } from '../theme';

export interface SideBarIconConfig {
  id: string;
  icon: React.ReactNode;
  position?: 'top' | 'bottom';
  onClick?: () => void;
}

export interface SideBarProps {
  position?: 'left' | 'right';
  /** Custom icons for the sidebar. If not provided, default VS Code-like icons are shown */
  icons?: SideBarIconConfig[];
  /** Menu items for the hamburger menu. If not provided, a default menu is shown */
  menuItems?: MenuItem[];
  /** Whether to show the hamburger menu icon (default: true) */
  showMenu?: boolean;
  /** Icons to render before the hamburger menu */
  preMenuIcons?: SideBarIconConfig[];
  /** Callback when sidebar icon is selected */
  onIconSelect?: (iconId: string) => void;
  /** Initially selected icon ID */
  selectedIconId?: string;
}

// Default SVG icons
const defaultFilesIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" />
    <path d="M13 2V9H20" />
  </svg>
);

const defaultSearchIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21L16.65 16.65" />
  </svg>
);

const defaultGitIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2V9" />
    <path d="M12 15V22" />
    <path d="M4.93 4.93L9.17 9.17" />
    <path d="M14.83 14.83L19.07 19.07" />
  </svg>
);

const defaultSettingsIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
  </svg>
);

const defaultAccountIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const defaultIcons: SideBarIconConfig[] = [
  { id: 'files', icon: defaultFilesIcon, position: 'top' },
  { id: 'search', icon: defaultSearchIcon, position: 'top' },
  { id: 'git', icon: defaultGitIcon, position: 'top' },
  { id: 'settings', icon: defaultSettingsIcon, position: 'bottom' },
  { id: 'account', icon: defaultAccountIcon, position: 'bottom' },
];

const defaultMenuItems: MenuItem[] = [
  {
    id: 'file',
    label: 'File',
    shortcutKey: 'F',
    submenu: [
      { id: 'new', label: 'New File', shortcutKey: 'N', keyboardShortcut: 'Ctrl+N', onClick: () => {} },
      { id: 'open', label: 'Open File...', shortcutKey: 'O', keyboardShortcut: 'Ctrl+O', onClick: () => {} },
      { id: 'sep1', label: '', separator: true },
      { id: 'save', label: 'Save', shortcutKey: 'S', keyboardShortcut: 'Ctrl+S', onClick: () => {} },
      { id: 'save-as', label: 'Save As...', keyboardShortcut: 'Ctrl+Shift+S', onClick: () => {} },
    ]
  },
  {
    id: 'edit',
    label: 'Edit',
    shortcutKey: 'E',
    submenu: [
      { id: 'undo', label: 'Undo', shortcutKey: 'U', keyboardShortcut: 'Ctrl+Z', onClick: () => {} },
      { id: 'redo', label: 'Redo', shortcutKey: 'R', keyboardShortcut: 'Ctrl+Y', onClick: () => {} },
    ]
  },
  {
    id: 'help',
    label: 'Help',
    shortcutKey: 'H',
    submenu: [
      { id: 'about', label: 'About', onClick: () => {} },
    ]
  }
];

export const SideBar: React.FC<SideBarProps> = ({
  position = 'left',
  icons = defaultIcons,
  menuItems = defaultMenuItems,
  showMenu = true,
  preMenuIcons = [],
  onIconSelect,
  selectedIconId: controlledSelectedId
}) => {
  const { theme } = useTheme();
  const [internalSelectedIcon, setInternalSelectedIcon] = useState<string>(icons[0]?.id || '');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuIconRef = useRef<HTMLDivElement>(null);

  const selectedIcon = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedIcon;

  const handleIconClick = (iconId: string) => {
    setInternalSelectedIcon(iconId);
    if (onIconSelect) {
      onIconSelect(iconId);
    }
  };

  const handleMenuClick = () => {
    if (menuIconRef.current) {
      setMenuAnchor(menuIconRef.current);
    }
  };

  const topIcons = icons.filter(i => i.position !== 'bottom');
  const bottomIcons = icons.filter(i => i.position === 'bottom');

  return (
    <div style={{
      width: '48px',
      minWidth: '48px',
      maxWidth: '48px',
      height: '100%',
      backgroundColor: theme.components.sidebar.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderRight: position === 'left' ? `1px solid ${theme.components.sidebar.border}` : 'none',
      borderLeft: position === 'right' ? `1px solid ${theme.components.sidebar.border}` : 'none',
      boxSizing: 'border-box',
      flexShrink: 0
    }}>
      {/* Top Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Pre-menu Icons */}
        {preMenuIcons.map(iconConfig => (
          <SideBarIcon
            key={iconConfig.id}
            selected={false}
            onClick={() => {
              if (iconConfig.onClick) iconConfig.onClick();
            }}
            position={position}
            icon={iconConfig.icon}
          />
        ))}

        {/* Menu Icon */}
        {showMenu && (
          <div
            ref={menuIconRef}
            onClick={handleMenuClick}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: theme.text.primary,
              transition: 'background-color 0.2s',
              backgroundColor: menuAnchor ? theme.interactive.hover : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!menuAnchor) {
                e.currentTarget.style.backgroundColor = theme.interactive.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!menuAnchor) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Top Icons */}
        {topIcons.map(iconConfig => (
          <SideBarIcon
            key={iconConfig.id}
            selected={selectedIcon === iconConfig.id}
            onClick={() => {
              handleIconClick(iconConfig.id);
              if (iconConfig.onClick) iconConfig.onClick();
            }}
            position={position}
            icon={iconConfig.icon}
          />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {bottomIcons.map(iconConfig => (
          <SideBarIcon
            key={iconConfig.id}
            selected={selectedIcon === iconConfig.id}
            onClick={() => {
              handleIconClick(iconConfig.id);
              if (iconConfig.onClick) iconConfig.onClick();
            }}
            position={position}
            icon={iconConfig.icon}
          />
        ))}
      </div>

      {/* Context Menu */}
      {menuAnchor && (
        <ContextMenu
          items={menuItems}
          anchorElement={menuAnchor}
          onClose={() => setMenuAnchor(null)}
        />
      )}
    </div>
  );
};
