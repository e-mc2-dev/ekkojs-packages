import type { Theme } from '../types';

export const darkTheme: Theme = {
  name: 'Dark',

  background: {
    primary: '#1e1e1e',      // Main background
    secondary: '#252526',    // Panels, cards
    tertiary: '#2a2d2e',     // Hover states
    elevated: '#2a2d2e',     // Dropdowns, menus
  },

  text: {
    primary: '#cccccc',      // Main text
    secondary: '#888888',    // Secondary text
    disabled: '#656565',     // Disabled text
    inverse: '#ffffff',      // Text on colored backgrounds
  },

  border: {
    default: '#3c3c3c',      // Default borders
    focus: '#0e639c',        // Focus borders
    divider: '#3c3c3c',      // Dividers
  },

  accent: {
    primary: '#0e639c',               // Primary accent
    primaryHover: 'rgba(14, 99, 156, 0.2)',  // 20% opacity
    primaryActive: '#094771',         // Pressed state
    secondary: '#007acc',             // Secondary accent
  },

  interactive: {
    hover: 'rgba(14, 99, 156, 0.2)',  // Hover background
    active: '#094771',                 // Active/pressed
    selected: '#0e639c',               // Selected
    focus: '#0e639c',                  // Focus ring
  },

  semantic: {
    error: '#f48771',
    warning: '#cca700',
    success: '#89d185',
    info: '#75beff',
  },

  components: {
    sidebar: {
      background: '#333333',
      itemHover: '#2a2d2e',
      itemActive: '#094771',
      border: '#1e1e1e',
    },

    tab: {
      background: '#2d2d30',
      activeBackground: '#1e1e1e',
      activeBorder: '#007acc',
      activeText: '#ffffff',
      inactiveText: '#969696',
      hoverBackground: '#1e1e1e',
      closeButtonHoverBackground: '#3e3e42',
    },

    toolbar: {
      background: '#252526',
      buttonHover: 'rgba(14, 99, 156, 0.2)',
      buttonActive: '#094771',
      groupBorder: '#3c3c3c',
      groupLabel: '#888888',
    },

    menu: {
      background: '#2a2d2e',
      itemHover: 'rgba(14, 99, 156, 0.2)',
      separator: '#3c3c3c',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    tooltip: {
      background: '#2d2d30',
      text: '#cccccc',
      border: '#454545',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    dropdown: {
      background: '#2a2d2e',
      itemHover: 'rgba(14, 99, 156, 0.2)',
      itemSelected: '#0e639c',
      border: '#3c3c3c',
    },

    scrollbar: {
      thumb: '#424242',
      thumbHover: '#4e4e4e',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
