import type { Theme } from '../types';

export const rosePineTheme: Theme = {
  name: 'Rose Pine',

  background: {
    primary: '#191724',      // Base
    secondary: '#1f1d2e',    // Surface
    tertiary: '#26233a',     // Overlay
    elevated: '#1f1d2e',     // Surface
  },

  text: {
    primary: '#e0def4',      // Text
    secondary: '#908caa',    // Subtle
    disabled: '#6e6a86',     // Muted
    inverse: '#191724',      // Base
  },

  border: {
    default: '#26233a',      // Overlay
    focus: '#ebbcba',        // Rose
    divider: '#26233a',      // Overlay
  },

  accent: {
    primary: '#ebbcba',                    // Rose
    primaryHover: 'rgba(235, 188, 186, 0.2)',
    primaryActive: '#eb6f92',              // Love
    secondary: '#c4a7e7',                   // Iris
  },

  interactive: {
    hover: 'rgba(235, 188, 186, 0.2)',    // Rose hover
    active: '#eb6f92',                     // Love
    selected: '#ebbcba',                   // Rose
    focus: '#c4a7e7',                      // Iris
  },

  semantic: {
    error: '#eb6f92',       // Love
    warning: '#f6c177',     // Gold
    success: '#9ccfd8',     // Foam
    info: '#31748f',        // Pine
  },

  components: {
    sidebar: {
      background: '#1a1726',    // Darker base
      itemHover: '#1f1d2e',     // Surface
      itemActive: '#26233a',    // Overlay
      border: '#1a1726',        // Darker base
    },

    tab: {
      background: '#1a1726',       // Darker base
      activeBackground: '#191724', // Base
      activeBorder: '#ebbcba',     // Rose
      activeText: '#e0def4',       // Text
      inactiveText: '#908caa',     // Subtle
      hoverBackground: '#1f1d2e',  // Surface
      closeButtonHoverBackground: '#26233a', // Overlay
    },

    toolbar: {
      background: '#1f1d2e',              // Surface
      buttonHover: 'rgba(235, 188, 186, 0.2)',
      buttonActive: '#eb6f92',
      groupBorder: '#26233a',             // Overlay
      groupLabel: '#908caa',              // Subtle
    },

    menu: {
      background: '#1f1d2e',              // Surface
      itemHover: 'rgba(235, 188, 186, 0.2)',
      separator: '#26233a',               // Overlay
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#26233a',    // Overlay
      text: '#e0def4',          // Text
      border: '#403d52',        // Highlighted overlay
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#1f1d2e',              // Surface
      itemHover: 'rgba(235, 188, 186, 0.2)',
      itemSelected: '#ebbcba',            // Rose
      border: '#26233a',                  // Overlay
    },

    scrollbar: {
      thumb: '#403d52',         // Highlighted overlay
      thumbHover: '#524f67',    // Muted
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
