import type { Theme } from '../types';

export const githubDarkTheme: Theme = {
  name: 'GitHub Dark',

  background: {
    primary: '#0d1117',      // Canvas default
    secondary: '#161b22',    // Canvas subtle
    tertiary: '#21262d',     // Canvas inset
    elevated: '#161b22',     // Canvas overlay
  },

  text: {
    primary: '#e6edf3',      // Foreground default
    secondary: '#7d8590',    // Foreground muted
    disabled: '#484f58',     // Foreground subtle
    inverse: '#0d1117',      // Inverse
  },

  border: {
    default: '#30363d',      // Border default
    focus: '#1f6feb',        // Accent emphasis
    divider: '#21262d',      // Border muted
  },

  accent: {
    primary: '#1f6feb',                    // Accent foreground
    primaryHover: 'rgba(31, 111, 235, 0.2)',
    primaryActive: '#1158c7',              // Accent emphasis
    secondary: '#58a6ff',                   // Accent muted
  },

  interactive: {
    hover: 'rgba(177, 186, 196, 0.12)',   // Neutral muted
    active: '#1158c7',                     // Accent emphasis
    selected: '#1f6feb',                   // Accent foreground
    focus: '#1f6feb',                      // Accent emphasis
  },

  semantic: {
    error: '#f85149',       // Danger foreground
    warning: '#d29922',     // Attention foreground
    success: '#3fb950',     // Success foreground
    info: '#58a6ff',        // Accent muted
  },

  components: {
    sidebar: {
      background: '#010409',    // Canvas default darker
      itemHover: '#161b22',     // Canvas subtle
      itemActive: '#21262d',    // Canvas inset
      border: '#0d1117',        // Canvas default
    },

    tab: {
      background: '#010409',       // Canvas default darker
      activeBackground: '#0d1117', // Canvas default
      activeBorder: '#fd8c73',     // Danger muted
      activeText: '#e6edf3',       // Foreground default
      inactiveText: '#7d8590',     // Foreground muted
      hoverBackground: '#161b22',  // Canvas subtle
      closeButtonHoverBackground: '#21262d', // Canvas inset
    },

    toolbar: {
      background: '#161b22',              // Canvas subtle
      buttonHover: 'rgba(177, 186, 196, 0.12)',
      buttonActive: '#1158c7',
      groupBorder: '#30363d',             // Border default
      groupLabel: '#7d8590',              // Foreground muted
    },

    menu: {
      background: '#161b22',              // Canvas overlay
      itemHover: 'rgba(177, 186, 196, 0.12)',
      separator: '#30363d',               // Border default
      shadow: '0 8px 24px rgba(1, 4, 9, 0.4)',
    },

    tooltip: {
      background: '#21262d',    // Canvas inset
      text: '#e6edf3',          // Foreground default
      border: '#30363d',        // Border default
      shadow: '0 8px 24px rgba(1, 4, 9, 0.4)',
    },

    dropdown: {
      background: '#161b22',              // Canvas overlay
      itemHover: 'rgba(177, 186, 196, 0.12)',
      itemSelected: '#1f6feb',            // Accent foreground
      border: '#30363d',                  // Border default
    },

    scrollbar: {
      thumb: '#6e7681',         // Scale gray 5
      thumbHover: '#848d97',    // Scale gray 4
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.12,
    backdrop: 0.5,
  },
};
