import type { Theme } from '../types';

export const arcticTheme: Theme = {
  name: 'Arctic',

  background: {
    primary: '#0c1e2e',    // Deep arctic blue
    secondary: '#132736',  // Slightly lighter
    tertiary: '#1a303f',   // Hover states
    elevated: '#203848',   // Dropdowns, menus
  },

  text: {
    primary: '#e0f2ff',    // Ice white - main text
    secondary: '#b3d9f2',  // Light blue - secondary text
    disabled: '#4a6575',   // Disabled text
    inverse: '#0c1e2e',    // Text on colored backgrounds
  },

  border: {
    default: '#2d4858',    // Default borders
    focus: '#5eb3e0',      // Focus borders - arctic blue
    divider: '#1a303f',    // Dividers
  },

  accent: {
    primary: '#5eb3e0',                    // Arctic blue - primary accent
    primaryHover: 'rgba(94, 179, 224, 0.2)',  // 20% opacity
    primaryActive: '#4aa8d8',              // Darker blue
    secondary: '#7ac5ed',                  // Light cyan - secondary accent
  },

  interactive: {
    hover: 'rgba(94, 179, 224, 0.2)',  // Hover background
    active: '#4aa8d8',                  // Active/pressed
    selected: '#5eb3e0',                // Selected
    focus: '#5eb3e0',                   // Focus ring
  },

  semantic: {
    error: '#ff6b6b',      // Soft red
    warning: '#ffa94d',    // Orange
    success: '#51cf66',    // Green
    info: '#5eb3e0',       // Arctic blue
  },

  components: {
    sidebar: {
      background: '#0a1922',
      itemHover: '#132736',
      itemActive: '#1a303f',
      border: '#051116',
    },

    tab: {
      background: '#0a1922',
      activeBackground: '#0c1e2e',
      activeBorder: '#5eb3e0',
      activeText: '#e0f2ff',
      inactiveText: '#8bb8d9',
      hoverBackground: '#132736',
      closeButtonHoverBackground: '#274050',
    },

    toolbar: {
      background: '#0a1922',
      buttonHover: 'rgba(94, 179, 224, 0.2)',
      buttonActive: '#1a303f',
      groupBorder: '#2d4858',
      groupLabel: '#8bb8d9',
    },

    menu: {
      background: '#132736',
      itemHover: 'rgba(94, 179, 224, 0.2)',
      separator: '#1a303f',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#203848',
      text: '#e0f2ff',
      border: '#2d4858',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#132736',
      itemHover: 'rgba(94, 179, 224, 0.2)',
      itemSelected: '#5eb3e0',
      border: '#2d4858',
    },

    scrollbar: {
      thumb: '#2d4858',
      thumbHover: '#3d5868',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.5,
    hover: 0.2,
    backdrop: 0.5,
  },
};
