import type { Theme } from '../types';

export const ayuDarkTheme: Theme = {
  name: 'Ayu Dark',

  background: {
    primary: '#0a0e14',
    secondary: '#01060e',
    tertiary: '#0d1016',
    elevated: '#0d1016',
  },

  text: {
    primary: '#b3b1ad',
    secondary: '#626a73',
    disabled: '#4d5566',
    inverse: '#0a0e14',
  },

  border: {
    default: '#1f2430',
    focus: '#39bae6',
    divider: '#1f2430',
  },

  accent: {
    primary: '#39bae6',
    primaryHover: 'rgba(57, 186, 230, 0.2)',
    primaryActive: '#2c95b8',
    secondary: '#59c2ff',
  },

  interactive: {
    hover: 'rgba(57, 186, 230, 0.2)',
    active: '#2c95b8',
    selected: '#39bae6',
    focus: '#39bae6',
  },

  semantic: {
    error: '#f07178',
    warning: '#ffb454',
    success: '#c2d94c',
    info: '#39bae6',
  },

  components: {
    sidebar: {
      background: '#080c12',
      itemHover: '#0d1016',
      itemActive: '#2c95b8',
      border: '#000408',
    },

    tab: {
      background: '#01060e',
      activeBackground: '#0a0e14',
      activeBorder: '#1f2430',
      activeText: '#b3b1ad',
      inactiveText: '#626a73',
      hoverBackground: '#0d1016',
      closeButtonHoverBackground: '#15181e',
    },

    toolbar: {
      background: '#01060e',
      buttonHover: 'rgba(57, 186, 230, 0.2)',
      buttonActive: '#2c95b8',
      groupBorder: '#1f2430',
      groupLabel: '#626a73',
    },

    menu: {
      background: '#0d1016',
      itemHover: 'rgba(57, 186, 230, 0.2)',
      separator: '#1f2430',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
    },

    tooltip: {
      background: '#0d1016',
      text: '#b3b1ad',
      border: '#1f2430',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
    },

    dropdown: {
      background: '#0d1016',
      itemHover: 'rgba(57, 186, 230, 0.2)',
      itemSelected: '#39bae6',
      border: '#1f2430',
    },

    scrollbar: {
      thumb: '#1f2430',
      thumbHover: '#2a2f3e',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
