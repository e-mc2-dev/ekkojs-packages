import type { Theme } from '../types';

export const solarizedLightTheme: Theme = {
  name: 'Solarized Light',

  background: {
    primary: '#fdf6e3',
    secondary: '#eee8d5',
    tertiary: '#e3dcc8',
    elevated: '#fdf6e3',
  },

  text: {
    primary: '#657b83',
    secondary: '#93a1a1',
    disabled: '#93a1a1',
    inverse: '#fdf6e3',
  },

  border: {
    default: '#eee8d5',
    focus: '#268bd2',
    divider: '#eee8d5',
  },

  accent: {
    primary: '#268bd2',
    primaryHover: '#d9ebf7',
    primaryActive: '#1e6fa8',
    secondary: '#2aa198',
  },

  interactive: {
    hover: '#d9ebf7',
    active: '#b8dcf0',
    selected: '#268bd2',
    focus: '#268bd2',
  },

  semantic: {
    error: '#dc322f',
    warning: '#b58900',
    success: '#859900',
    info: '#268bd2',
  },

  components: {
    sidebar: {
      background: '#e3dcc8',
      itemHover: '#e3dcc8',
      itemActive: '#b8dcf0',
      border: '#ddd6c1',
    },

    tab: {
      background: '#eee8d5',
      activeBackground: '#fdf6e3',
      activeBorder: '#eee8d5',
      activeText: '#657b83',
      inactiveText: '#93a1a1',
      hoverBackground: '#e3dcc8',
      closeButtonHoverBackground: '#ddd6c1',
    },

    toolbar: {
      background: '#eee8d5',
      buttonHover: '#d9ebf7',
      buttonActive: '#b8dcf0',
      groupBorder: '#eee8d5',
      groupLabel: '#93a1a1',
    },

    menu: {
      background: '#fdf6e3',
      itemHover: '#e3dcc8',
      separator: '#eee8d5',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    tooltip: {
      background: '#094656',
      text: '#839496',
      border: '#073642',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#fdf6e3',
      itemHover: '#e3dcc8',
      itemSelected: '#d9ebf7',
      border: '#eee8d5',
    },

    scrollbar: {
      thumb: '#ddd6c1',
      thumbHover: '#ccc5af',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.4,
    hover: 1,
    backdrop: 0.5,
  },
};
