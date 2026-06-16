import type { Theme } from '../types';

export const ayuLightTheme: Theme = {
  name: 'Ayu Light',

  background: {
    primary: '#fafafa',      // Background
    secondary: '#f3f4f5',    // Panel background
    tertiary: '#ededee',     // Selection inactive
    elevated: '#ffffff',     // Dropdown/overlay
  },

  text: {
    primary: '#5c6166',      // Foreground
    secondary: '#828c99',    // Comment
    disabled: '#9da4ab',     // Disabled
    inverse: '#ffffff',      // Inverse
  },

  border: {
    default: '#d9d9d9',      // Border
    focus: '#ff9940',        // Orange
    divider: '#e6e6e6',      // Divider
  },

  accent: {
    primary: '#ff9940',                    // Orange
    primaryHover: 'rgba(255, 153, 64, 0.15)',
    primaryActive: '#e88c2e',              // Darker orange
    secondary: '#4cbf99',                   // Teal
  },

  interactive: {
    hover: 'rgba(255, 153, 64, 0.15)',    // Orange hover
    active: '#e88c2e',                     // Darker orange
    selected: '#ff9940',                   // Orange
    focus: '#ff9940',                      // Orange
  },

  semantic: {
    error: '#f27983',       // Red
    warning: '#ffb454',     // Yellow
    success: '#86b300',     // Green
    info: '#55b4d4',        // Cyan
  },

  components: {
    sidebar: {
      background: '#f0f0f0',    // Slightly darker
      itemHover: '#e6e6e6',     // Hover
      itemActive: '#d9d9d9',    // Active
      border: '#e0e0e0',        // Border
    },

    tab: {
      background: '#f3f4f5',       // Panel background
      activeBackground: '#fafafa', // Background
      activeBorder: '#ff9940',     // Orange
      activeText: '#5c6166',       // Foreground
      inactiveText: '#828c99',     // Comment
      hoverBackground: '#ededee',  // Selection inactive
      closeButtonHoverBackground: '#e0e0e0',
    },

    toolbar: {
      background: '#f3f4f5',              // Panel background
      buttonHover: 'rgba(255, 153, 64, 0.15)',
      buttonActive: '#e88c2e',
      groupBorder: '#d9d9d9',             // Border
      groupLabel: '#828c99',              // Comment
    },

    menu: {
      background: '#ffffff',              // Elevated
      itemHover: 'rgba(255, 153, 64, 0.15)',
      separator: '#e6e6e6',               // Divider
      shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },

    tooltip: {
      background: '#f3f4f5',    // Panel
      text: '#5c6166',          // Foreground
      border: '#d9d9d9',        // Border
      shadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },

    dropdown: {
      background: '#ffffff',              // Elevated
      itemHover: 'rgba(255, 153, 64, 0.15)',
      itemSelected: '#ff9940',            // Orange
      border: '#d9d9d9',                  // Border
    },

    scrollbar: {
      thumb: '#c9c9c9',         // Scrollbar
      thumbHover: '#b3b3b3',    // Scrollbar hover
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.3,
    hover: 0.15,
    backdrop: 0.4,
  },
};
