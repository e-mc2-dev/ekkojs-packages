import type { Theme } from '../types';

export const githubLightTheme: Theme = {
  name: 'GitHub Light',

  background: {
    primary: '#ffffff',      // Canvas default
    secondary: '#f6f8fa',    // Canvas subtle
    tertiary: '#f6f8fa',     // Canvas inset
    elevated: '#ffffff',     // Canvas overlay
  },

  text: {
    primary: '#24292f',      // Foreground default
    secondary: '#57606a',    // Foreground muted
    disabled: '#8c959f',     // Foreground subtle
    inverse: '#ffffff',      // Inverse
  },

  border: {
    default: '#d0d7de',      // Border default
    focus: '#0969da',        // Accent emphasis
    divider: '#d8dee4',      // Border muted
  },

  accent: {
    primary: '#0969da',                    // Accent foreground
    primaryHover: 'rgba(9, 105, 218, 0.1)',
    primaryActive: '#0550ae',              // Accent emphasis
    secondary: '#218bff',                   // Accent muted
  },

  interactive: {
    hover: 'rgba(208, 215, 222, 0.32)',   // Neutral muted
    active: '#0550ae',                     // Accent emphasis
    selected: '#0969da',                   // Accent foreground
    focus: '#0969da',                      // Accent emphasis
  },

  semantic: {
    error: '#d1242f',       // Danger foreground
    warning: '#9a6700',     // Attention foreground
    success: '#1a7f37',     // Success foreground
    info: '#218bff',        // Accent muted
  },

  components: {
    sidebar: {
      background: '#f6f8fa',    // Canvas subtle
      itemHover: '#eaeef2',     // Neutral muted
      itemActive: '#d0d7de',    // Border default
      border: '#d8dee4',        // Border muted
    },

    tab: {
      background: '#f6f8fa',       // Canvas subtle
      activeBackground: '#ffffff', // Canvas default
      activeBorder: '#fd8c73',     // Danger muted
      activeText: '#24292f',       // Foreground default
      inactiveText: '#57606a',     // Foreground muted
      hoverBackground: '#eaeef2',  // Neutral muted
      closeButtonHoverBackground: '#d0d7de',
    },

    toolbar: {
      background: '#f6f8fa',              // Canvas subtle
      buttonHover: 'rgba(208, 215, 222, 0.32)',
      buttonActive: '#0550ae',
      groupBorder: '#d0d7de',             // Border default
      groupLabel: '#57606a',              // Foreground muted
    },

    menu: {
      background: '#ffffff',              // Canvas overlay
      itemHover: 'rgba(208, 215, 222, 0.32)',
      separator: '#d8dee4',               // Border muted
      shadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
    },

    tooltip: {
      background: '#24292f',    // Foreground default (inverted)
      text: '#ffffff',          // Inverse
      border: '#d0d7de',        // Border default
      shadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
    },

    dropdown: {
      background: '#ffffff',              // Canvas overlay
      itemHover: 'rgba(208, 215, 222, 0.32)',
      itemSelected: '#0969da',            // Accent foreground
      border: '#d0d7de',                  // Border default
    },

    scrollbar: {
      thumb: '#d0d7de',         // Border default
      thumbHover: '#afb8c1',    // Scale gray 4
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.3,
    hover: 0.1,
    backdrop: 0.3,
  },
};
