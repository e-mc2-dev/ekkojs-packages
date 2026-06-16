import type { Theme } from '../types';

export const catppuccinLatteTheme: Theme = {
  name: 'Catppuccin Latte',

  background: {
    primary: '#eff1f5',      // Base
    secondary: '#e6e9ef',    // Mantle
    tertiary: '#dce0e8',     // Crust
    elevated: '#e6e9ef',     // Mantle
  },

  text: {
    primary: '#4c4f69',      // Text
    secondary: '#5c5f77',    // Subtext1
    disabled: '#9ca0b0',     // Overlay1
    inverse: '#eff1f5',      // Base
  },

  border: {
    default: '#dce0e8',      // Crust
    focus: '#1e66f5',        // Blue
    divider: '#dce0e8',      // Crust
  },

  accent: {
    primary: '#8839ef',                    // Mauve
    primaryHover: 'rgba(136, 57, 239, 0.1)',
    primaryActive: '#7287fd',              // Lavender
    secondary: '#1e66f5',                   // Blue
  },

  interactive: {
    hover: 'rgba(136, 57, 239, 0.1)',     // Mauve hover
    active: '#7287fd',                     // Lavender
    selected: '#8839ef',                   // Mauve
    focus: '#1e66f5',                      // Blue
  },

  semantic: {
    error: '#d20f39',       // Red
    warning: '#df8e1d',     // Yellow
    success: '#40a02b',     // Green
    info: '#04a5e5',        // Sky
  },

  components: {
    sidebar: {
      background: '#e6e9ef',    // Mantle
      itemHover: '#dce0e8',     // Crust
      itemActive: '#ccd0da',    // Surface0
      border: '#dce0e8',        // Crust
    },

    tab: {
      background: '#e6e9ef',       // Mantle
      activeBackground: '#eff1f5', // Base
      activeBorder: '#8839ef',     // Mauve
      activeText: '#4c4f69',       // Text
      inactiveText: '#5c5f77',     // Subtext1
      hoverBackground: '#dce0e8',  // Crust
      closeButtonHoverBackground: '#ccd0da', // Surface0
    },

    toolbar: {
      background: '#e6e9ef',              // Mantle
      buttonHover: 'rgba(136, 57, 239, 0.1)',
      buttonActive: '#7287fd',
      groupBorder: '#dce0e8',             // Crust
      groupLabel: '#5c5f77',              // Subtext1
    },

    menu: {
      background: '#e6e9ef',              // Mantle
      itemHover: 'rgba(136, 57, 239, 0.1)',
      separator: '#dce0e8',               // Crust
      shadow: '0 2px 8px rgba(76, 79, 105, 0.15)',
    },

    tooltip: {
      background: '#dce0e8',    // Crust
      text: '#4c4f69',          // Text
      border: '#ccd0da',        // Surface0
      shadow: '0 2px 8px rgba(76, 79, 105, 0.15)',
    },

    dropdown: {
      background: '#e6e9ef',              // Mantle
      itemHover: 'rgba(136, 57, 239, 0.1)',
      itemSelected: '#8839ef',            // Mauve
      border: '#dce0e8',                  // Crust
    },

    scrollbar: {
      thumb: '#ccd0da',         // Surface0
      thumbHover: '#bcc0cc',    // Surface1
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.3,
    hover: 0.1,
    backdrop: 0.3,
  },
};
