import type { Theme } from '../types';

export const gruvboxDarkTheme: Theme = {
  name: 'Gruvbox Dark',

  background: {
    primary: '#282828',
    secondary: '#1d2021',
    tertiary: '#3c3836',
    elevated: '#3c3836',
  },

  text: {
    primary: '#ebdbb2',
    secondary: '#a89984',
    disabled: '#504945',
    inverse: '#282828',
  },

  border: {
    default: '#504945',
    focus: '#83a598',
    divider: '#504945',
  },

  accent: {
    primary: '#83a598',
    primaryHover: 'rgba(131, 165, 152, 0.2)',
    primaryActive: '#6a847a',
    secondary: '#8ec07c',
  },

  interactive: {
    hover: 'rgba(131, 165, 152, 0.2)',
    active: '#6a847a',
    selected: '#83a598',
    focus: '#83a598',
  },

  semantic: {
    error: '#fb4934',
    warning: '#fabd2f',
    success: '#b8bb26',
    info: '#83a598',
  },

  components: {
    sidebar: {
      background: '#242728',
      itemHover: '#3c3836',
      itemActive: '#6a847a',
      border: '#141617',
    },

    tab: {
      background: '#1d2021',
      activeBackground: '#282828',
      activeBorder: '#504945',
      activeText: '#ebdbb2',
      inactiveText: '#a89984',
      hoverBackground: '#3c3836',
      closeButtonHoverBackground: '#504945',
    },

    toolbar: {
      background: '#1d2021',
      buttonHover: 'rgba(131, 165, 152, 0.2)',
      buttonActive: '#6a847a',
      groupBorder: '#504945',
      groupLabel: '#a89984',
    },

    menu: {
      background: '#3c3836',
      itemHover: 'rgba(131, 165, 152, 0.2)',
      separator: '#504945',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#3c3836',
      text: '#ebdbb2',
      border: '#504945',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#3c3836',
      itemHover: 'rgba(131, 165, 152, 0.2)',
      itemSelected: '#83a598',
      border: '#504945',
    },

    scrollbar: {
      thumb: '#504945',
      thumbHover: '#665c54',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
