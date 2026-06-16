import type { Theme } from '../types';

export const ubuntuTheme: Theme = {
  name: 'Ubuntu',

  background: {
    primary: '#2c2c2c',    // Main background
    secondary: '#3c3c3c',  // Panels, cards
    tertiary: '#484848',   // Hover states
    elevated: '#525252',   // Dropdowns, menus
  },

  text: {
    primary: '#ffffff',    // Main text - white
    secondary: '#f2f2f2',  // Secondary text
    disabled: '#7a7a7a',   // Disabled text
    inverse: '#2c2c2c',    // Text on colored backgrounds
  },

  border: {
    default: '#646464',    // Default borders
    focus: '#e95420',      // Focus borders - Ubuntu orange
    divider: '#484848',    // Dividers
  },

  accent: {
    primary: '#e95420',                    // Ubuntu orange - primary accent
    primaryHover: 'rgba(233, 84, 32, 0.2)',  // 20% opacity
    primaryActive: '#d74415',              // Darker orange
    secondary: '#eb6536',                  // Lighter orange - secondary accent
  },

  interactive: {
    hover: 'rgba(233, 84, 32, 0.2)',  // Hover background
    active: '#d74415',                 // Active/pressed
    selected: '#e95420',               // Selected
    focus: '#e95420',                  // Focus ring
  },

  semantic: {
    error: '#ed3146',      // Ubuntu red
    warning: '#f99b11',    // Ubuntu yellow/orange
    success: '#0e8420',    // Ubuntu green
    info: '#19b6ee',       // Ubuntu blue
  },

  components: {
    sidebar: {
      background: '#262626',
      itemHover: '#3c3c3c',
      itemActive: '#484848',
      border: '#1a1a1a',
    },

    tab: {
      background: '#262626',
      activeBackground: '#2c2c2c',
      activeBorder: '#e95420',
      activeText: '#ffffff',
      inactiveText: '#cccccc',
      hoverBackground: '#3c3c3c',
      closeButtonHoverBackground: '#5a5a5a',
    },

    toolbar: {
      background: '#262626',
      buttonHover: 'rgba(233, 84, 32, 0.2)',
      buttonActive: '#484848',
      groupBorder: '#646464',
      groupLabel: '#cccccc',
    },

    menu: {
      background: '#3c3c3c',
      itemHover: 'rgba(233, 84, 32, 0.2)',
      separator: '#484848',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#525252',
      text: '#ffffff',
      border: '#646464',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#3c3c3c',
      itemHover: 'rgba(233, 84, 32, 0.2)',
      itemSelected: '#e95420',
      border: '#646464',
    },

    scrollbar: {
      thumb: '#646464',
      thumbHover: '#747474',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.5,
    hover: 0.2,
    backdrop: 0.5,
  },
};
