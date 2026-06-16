import type { Theme } from '../types';

export const palenightTheme: Theme = {
  name: 'Palenight',

  background: {
    primary: '#292d3e',      // Background
    secondary: '#32364a',    // Panel background
    tertiary: '#3b3f51',     // Elevated background
    elevated: '#3b3f51',     // Dropdown/overlay
  },

  text: {
    primary: '#a6accd',      // Foreground
    secondary: '#676e95',    // Comment
    disabled: '#4e5579',     // Disabled
    inverse: '#ffffff',      // Inverse
  },

  border: {
    default: '#3b3f51',      // Border
    focus: '#c792ea',        // Purple
    divider: '#3b3f51',      // Divider
  },

  accent: {
    primary: '#c792ea',                    // Purple
    primaryHover: 'rgba(199, 146, 234, 0.2)',
    primaryActive: '#b07fd9',              // Darker purple
    secondary: '#82aaff',                   // Blue
  },

  interactive: {
    hover: 'rgba(199, 146, 234, 0.2)',    // Purple hover
    active: '#b07fd9',                     // Darker purple
    selected: '#c792ea',                   // Purple
    focus: '#82aaff',                      // Blue
  },

  semantic: {
    error: '#ff5370',       // Red
    warning: '#ffcb6b',     // Yellow
    success: '#c3e88d',     // Green
    info: '#89ddff',        // Cyan
  },

  components: {
    sidebar: {
      background: '#262936',    // Darker background
      itemHover: '#32364a',     // Panel background
      itemActive: '#3b3f51',    // Elevated background
      border: '#1f2233',        // Darker border
    },

    tab: {
      background: '#262936',       // Darker background
      activeBackground: '#292d3e', // Background
      activeBorder: '#c792ea',     // Purple
      activeText: '#a6accd',       // Foreground
      inactiveText: '#676e95',     // Comment
      hoverBackground: '#32364a',  // Panel background
      closeButtonHoverBackground: '#3b3f51', // Elevated
    },

    toolbar: {
      background: '#32364a',              // Panel background
      buttonHover: 'rgba(199, 146, 234, 0.2)',
      buttonActive: '#b07fd9',
      groupBorder: '#3b3f51',             // Border
      groupLabel: '#676e95',              // Comment
    },

    menu: {
      background: '#3b3f51',              // Elevated
      itemHover: 'rgba(199, 146, 234, 0.2)',
      separator: '#32364a',               // Panel background
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    tooltip: {
      background: '#3b3f51',    // Elevated
      text: '#a6accd',          // Foreground
      border: '#4e5579',        // Disabled
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    dropdown: {
      background: '#3b3f51',              // Elevated
      itemHover: 'rgba(199, 146, 234, 0.2)',
      itemSelected: '#c792ea',            // Purple
      border: '#4e5579',                  // Disabled
    },

    scrollbar: {
      thumb: '#4e5579',         // Disabled
      thumbHover: '#676e95',    // Comment
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
