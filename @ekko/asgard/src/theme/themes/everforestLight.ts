import type { Theme } from '../types';

export const everforestLightTheme: Theme = {
  name: 'Everforest Light',

  background: {
    primary: '#fdf6e3',    // Main background - soft cream
    secondary: '#f4f0d9',  // Panels, cards
    tertiary: '#efebd4',   // Hover states
    elevated: '#e6e2cc',   // Dropdowns, menus
  },

  text: {
    primary: '#5c6a72',    // Main text - dark gray-blue
    secondary: '#6f8352',  // Secondary text - forest green
    disabled: '#a6b0a0',   // Disabled text
    inverse: '#fdf6e3',    // Text on colored backgrounds
  },

  border: {
    default: '#d8d3bd',    // Default borders
    focus: '#8da101',      // Focus borders - olive green
    divider: '#e6e2cc',    // Dividers
  },

  accent: {
    primary: '#8da101',                    // Olive green - primary accent
    primaryHover: 'rgba(141, 161, 1, 0.15)',  // 15% opacity
    primaryActive: '#7a8d01',              // Darker olive
    secondary: '#dfa000',                  // Golden yellow - secondary accent
  },

  interactive: {
    hover: 'rgba(141, 161, 1, 0.15)',  // Hover background
    active: '#7a8d01',                  // Active/pressed
    selected: '#8da101',                // Selected
    focus: '#8da101',                   // Focus ring
  },

  semantic: {
    error: '#f85552',      // Bright red
    warning: '#dfa000',    // Golden yellow
    success: '#8da101',    // Olive green
    info: '#35a77c',       // Teal
  },

  components: {
    sidebar: {
      background: '#f4f0d9',
      itemHover: '#efebd4',
      itemActive: '#e6e2cc',
      border: '#e4dfc8',
    },

    tab: {
      background: '#f4f0d9',
      activeBackground: '#fdf6e3',
      activeBorder: '#8da101',
      activeText: '#5c6a72',
      inactiveText: '#879a39',
      hoverBackground: '#efebd4',
      closeButtonHoverBackground: '#ddd8c2',
    },

    toolbar: {
      background: '#f4f0d9',
      buttonHover: 'rgba(141, 161, 1, 0.15)',
      buttonActive: '#e6e2cc',
      groupBorder: '#d8d3bd',
      groupLabel: '#879a39',
    },

    menu: {
      background: '#fdf6e3',
      itemHover: 'rgba(141, 161, 1, 0.15)',
      separator: '#e6e2cc',
      shadow: '0 2px 8px rgba(92, 106, 114, 0.15)',
    },

    tooltip: {
      background: '#e6e2cc',
      text: '#5c6a72',
      border: '#d8d3bd',
      shadow: '0 2px 8px rgba(92, 106, 114, 0.15)',
    },

    dropdown: {
      background: '#fdf6e3',
      itemHover: 'rgba(141, 161, 1, 0.15)',
      itemSelected: '#8da101',
      border: '#d8d3bd',
    },

    scrollbar: {
      thumb: '#d8d3bd',
      thumbHover: '#c8c3ad',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.5,
    hover: 0.15,
    backdrop: 0.5,
  },
};
