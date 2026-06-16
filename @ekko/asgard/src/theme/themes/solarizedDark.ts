import type { Theme } from '../types';

export const solarizedDarkTheme: Theme = {
  name: 'Solarized Dark',

  background: {
    primary: '#002b36',
    secondary: '#073642',
    tertiary: '#094656',
    elevated: '#094656',
  },

  text: {
    primary: '#839496',
    secondary: '#586e75',
    disabled: '#073642',
    inverse: '#002b36',
  },

  border: {
    default: '#073642',
    focus: '#268bd2',
    divider: '#073642',
  },

  accent: {
    primary: '#268bd2',
    primaryHover: 'rgba(38, 139, 210, 0.2)',
    primaryActive: '#1e6fa8',
    secondary: '#2aa198',
  },

  interactive: {
    hover: 'rgba(38, 139, 210, 0.2)',
    active: '#1e6fa8',
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
      background: '#083e4b',
      itemHover: '#094656',
      itemActive: '#1e6fa8',
      border: '#002b36',
    },

    tab: {
      background: '#073642',
      activeBackground: '#002b36',
      activeBorder: '#073642',
      activeText: '#839496',
      inactiveText: '#586e75',
      hoverBackground: '#094656',
      closeButtonHoverBackground: '#0a4f5f',
    },

    toolbar: {
      background: '#073642',
      buttonHover: 'rgba(38, 139, 210, 0.2)',
      buttonActive: '#1e6fa8',
      groupBorder: '#073642',
      groupLabel: '#586e75',
    },

    menu: {
      background: '#094656',
      itemHover: 'rgba(38, 139, 210, 0.2)',
      separator: '#073642',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#094656',
      text: '#839496',
      border: '#073642',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#094656',
      itemHover: 'rgba(38, 139, 210, 0.2)',
      itemSelected: '#268bd2',
      border: '#073642',
    },

    scrollbar: {
      thumb: '#094656',
      thumbHover: '#0c5668',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
