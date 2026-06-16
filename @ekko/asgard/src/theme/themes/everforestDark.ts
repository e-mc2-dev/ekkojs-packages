import type { Theme } from '../types';

export const everforestDarkTheme: Theme = {
  name: 'Everforest Dark',

  background: {
    primary: '#2b3339',    // Main background
    secondary: '#323c41',  // Panels, cards
    tertiary: '#3a464c',   // Hover states
    elevated: '#404c51',   // Dropdowns, menus
  },

  text: {
    primary: '#d3c6aa',    // Main text - warm white
    secondary: '#9da9a0',  // Secondary text - muted green
    disabled: '#5a605d',   // Disabled text
    inverse: '#2b3339',    // Text on colored backgrounds
  },

  border: {
    default: '#4a555b',    // Default borders
    focus: '#a7c080',      // Focus borders - green
    divider: '#3a464c',    // Dividers
  },

  accent: {
    primary: '#a7c080',                    // Green - primary accent
    primaryHover: 'rgba(167, 192, 128, 0.2)',  // 20% opacity
    primaryActive: '#98b572',              // Darker green
    secondary: '#dbbc7f',                  // Yellow - secondary accent
  },

  interactive: {
    hover: 'rgba(167, 192, 128, 0.2)',  // Hover background
    active: '#98b572',                   // Active/pressed
    selected: '#a7c080',                 // Selected
    focus: '#a7c080',                    // Focus ring
  },

  semantic: {
    error: '#e67e80',      // Soft red
    warning: '#dbbc7f',    // Yellow/orange
    success: '#a7c080',    // Green
    info: '#7fbbb3',       // Aqua/cyan
  },

  components: {
    sidebar: {
      background: '#272e33',
      itemHover: '#323c41',
      itemActive: '#3a464c',
      border: '#1e2326',
    },

    tab: {
      background: '#272e33',
      activeBackground: '#2b3339',
      activeBorder: '#a7c080',
      activeText: '#d3c6aa',
      inactiveText: '#859289',
      hoverBackground: '#323c41',
      closeButtonHoverBackground: '#475258',
    },

    toolbar: {
      background: '#272e33',
      buttonHover: 'rgba(167, 192, 128, 0.2)',
      buttonActive: '#3a464c',
      groupBorder: '#4a555b',
      groupLabel: '#859289',
    },

    menu: {
      background: '#323c41',
      itemHover: 'rgba(167, 192, 128, 0.2)',
      separator: '#3a464c',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    tooltip: {
      background: '#404c51',
      text: '#d3c6aa',
      border: '#4a555b',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    dropdown: {
      background: '#323c41',
      itemHover: 'rgba(167, 192, 128, 0.2)',
      itemSelected: '#a7c080',
      border: '#4a555b',
    },

    scrollbar: {
      thumb: '#4a555b',
      thumbHover: '#5a605d',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.5,
    hover: 0.2,
    backdrop: 0.5,
  },
};
