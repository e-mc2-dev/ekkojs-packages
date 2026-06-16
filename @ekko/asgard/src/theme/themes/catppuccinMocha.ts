import type { Theme } from '../types';

export const catppuccinMochaTheme: Theme = {
  name: 'Catppuccin Mocha',

  background: {
    primary: '#1e1e2e',      // Base
    secondary: '#313244',    // Surface0
    tertiary: '#45475a',     // Surface1
    elevated: '#313244',     // Surface0
  },

  text: {
    primary: '#cdd6f4',      // Text
    secondary: '#a6adc8',    // Subtext0
    disabled: '#6c7086',     // Overlay0
    inverse: '#11111b',      // Crust
  },

  border: {
    default: '#45475a',      // Surface1
    focus: '#89b4fa',        // Blue
    divider: '#45475a',      // Surface1
  },

  accent: {
    primary: '#cba6f7',                    // Mauve
    primaryHover: 'rgba(203, 166, 247, 0.2)',
    primaryActive: '#b48ead',              // Darker mauve
    secondary: '#89b4fa',                   // Blue
  },

  interactive: {
    hover: 'rgba(203, 166, 247, 0.2)',    // Mauve hover
    active: '#b48ead',                     // Darker mauve
    selected: '#cba6f7',                   // Mauve
    focus: '#89b4fa',                      // Blue
  },

  semantic: {
    error: '#f38ba8',       // Red
    warning: '#f9e2af',     // Yellow
    success: '#a6e3a1',     // Green
    info: '#89dceb',        // Sky
  },

  components: {
    sidebar: {
      background: '#181825',    // Mantle
      itemHover: '#313244',     // Surface0
      itemActive: '#45475a',    // Surface1
      border: '#11111b',        // Crust
    },

    tab: {
      background: '#181825',       // Mantle
      activeBackground: '#1e1e2e', // Base
      activeBorder: '#cba6f7',     // Mauve
      activeText: '#cdd6f4',       // Text
      inactiveText: '#a6adc8',     // Subtext0
      hoverBackground: '#313244',  // Surface0
      closeButtonHoverBackground: '#45475a', // Surface1
    },

    toolbar: {
      background: '#313244',              // Surface0
      buttonHover: 'rgba(203, 166, 247, 0.2)',
      buttonActive: '#b48ead',
      groupBorder: '#45475a',             // Surface1
      groupLabel: '#a6adc8',              // Subtext0
    },

    menu: {
      background: '#313244',              // Surface0
      itemHover: 'rgba(203, 166, 247, 0.2)',
      separator: '#45475a',               // Surface1
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#181825',    // Mantle
      text: '#cdd6f4',          // Text
      border: '#45475a',        // Surface1
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#313244',              // Surface0
      itemHover: 'rgba(203, 166, 247, 0.2)',
      itemSelected: '#cba6f7',            // Mauve
      border: '#45475a',                  // Surface1
    },

    scrollbar: {
      thumb: '#585b70',         // Surface2
      thumbHover: '#6c7086',    // Overlay0
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
