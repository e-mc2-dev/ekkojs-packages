import type { Theme } from '../types';

export const materialDarkTheme: Theme = {
  name: 'Material Dark',

  background: {
    primary: '#263238',
    secondary: '#1e272c',
    tertiary: '#2c3b41',
    elevated: '#2c3b41',
  },

  text: {
    primary: '#eeffff',
    secondary: '#546e7a',
    disabled: '#37474f',
    inverse: '#263238',
  },

  border: {
    default: '#37474f',
    focus: '#80cbc4',
    divider: '#37474f',
  },

  accent: {
    primary: '#80cbc4',
    primaryHover: 'rgba(128, 203, 196, 0.2)',
    primaryActive: '#66a39d',
    secondary: '#82aaff',
  },

  interactive: {
    hover: 'rgba(128, 203, 196, 0.2)',
    active: '#66a39d',
    selected: '#80cbc4',
    focus: '#80cbc4',
  },

  semantic: {
    error: '#ff5370',
    warning: '#ffcb6b',
    success: '#c3e88d',
    info: '#82aaff',
  },

  components: {
    sidebar: {
      background: '#232e34',
      itemHover: '#2c3b41',
      itemActive: '#66a39d',
      border: '#151d21',
    },

    tab: {
      background: '#1e272c',
      activeBackground: '#263238',
      activeBorder: '#37474f',
      activeText: '#eeffff',
      inactiveText: '#546e7a',
      hoverBackground: '#2c3b41',
      closeButtonHoverBackground: '#37474f',
    },

    toolbar: {
      background: '#1e272c',
      buttonHover: 'rgba(128, 203, 196, 0.2)',
      buttonActive: '#66a39d',
      groupBorder: '#37474f',
      groupLabel: '#546e7a',
    },

    menu: {
      background: '#2c3b41',
      itemHover: 'rgba(128, 203, 196, 0.2)',
      separator: '#37474f',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#2c3b41',
      text: '#eeffff',
      border: '#37474f',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#2c3b41',
      itemHover: 'rgba(128, 203, 196, 0.2)',
      itemSelected: '#80cbc4',
      border: '#37474f',
    },

    scrollbar: {
      thumb: '#37474f',
      thumbHover: '#455a64',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
