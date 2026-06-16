import type { Theme } from '../types';

export const linuxMintTheme: Theme = {
  name: 'Linux Mint',

  background: {
    primary: '#2f2f2f',    // Main background
    secondary: '#3b3b3b',  // Panels, cards
    tertiary: '#454545',   // Hover states
    elevated: '#505050',   // Dropdowns, menus
  },

  text: {
    primary: '#f5f5f5',    // Main text - off-white
    secondary: '#e5e5e5',  // Secondary text
    disabled: '#808080',   // Disabled text
    inverse: '#2f2f2f',    // Text on colored backgrounds
  },

  border: {
    default: '#606060',    // Default borders
    focus: '#9aca3c',      // Focus borders - mint green
    divider: '#454545',    // Dividers
  },

  accent: {
    primary: '#9aca3c',                    // Linux Mint green - primary accent
    primaryHover: 'rgba(154, 202, 60, 0.2)',  // 20% opacity
    primaryActive: '#8ab830',              // Darker green
    secondary: '#afd752',                  // Lighter green - secondary accent
  },

  interactive: {
    hover: 'rgba(154, 202, 60, 0.2)',  // Hover background
    active: '#8ab830',                  // Active/pressed
    selected: '#9aca3c',                // Selected
    focus: '#9aca3c',                   // Focus ring
  },

  semantic: {
    error: '#e74c3c',      // Red
    warning: '#f39c12',    // Orange
    success: '#9aca3c',    // Mint green
    info: '#3498db',       // Blue
  },

  components: {
    sidebar: {
      background: '#282828',
      itemHover: '#3b3b3b',
      itemActive: '#454545',
      border: '#1f1f1f',
    },

    tab: {
      background: '#282828',
      activeBackground: '#2f2f2f',
      activeBorder: '#9aca3c',
      activeText: '#f5f5f5',
      inactiveText: '#c5c5c5',
      hoverBackground: '#3b3b3b',
      closeButtonHoverBackground: '#5a5a5a',
    },

    toolbar: {
      background: '#282828',
      buttonHover: 'rgba(154, 202, 60, 0.2)',
      buttonActive: '#454545',
      groupBorder: '#606060',
      groupLabel: '#c5c5c5',
    },

    menu: {
      background: '#3b3b3b',
      itemHover: 'rgba(154, 202, 60, 0.2)',
      separator: '#454545',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#505050',
      text: '#f5f5f5',
      border: '#606060',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#3b3b3b',
      itemHover: 'rgba(154, 202, 60, 0.2)',
      itemSelected: '#9aca3c',
      border: '#606060',
    },

    scrollbar: {
      thumb: '#606060',
      thumbHover: '#707070',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.5,
    hover: 0.2,
    backdrop: 0.5,
  },
};
