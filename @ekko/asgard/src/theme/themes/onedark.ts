import type { Theme } from '../types';

export const oneDarkTheme: Theme = {
  name: 'One Dark',

  background: {
    primary: '#282c34',
    secondary: '#21252b',
    tertiary: '#2c313a',
    elevated: '#2c313a',
  },

  text: {
    primary: '#abb2bf',
    secondary: '#5c6370',
    disabled: '#4b5263',
    inverse: '#282c34',
  },

  border: {
    default: '#3e4451',
    focus: '#61afef',
    divider: '#3e4451',
  },

  accent: {
    primary: '#61afef',
    primaryHover: 'rgba(97, 175, 239, 0.2)',
    primaryActive: '#4d8cbf',
    secondary: '#56b6c2',
  },

  interactive: {
    hover: 'rgba(97, 175, 239, 0.2)',
    active: '#4d8cbf',
    selected: '#61afef',
    focus: '#61afef',
  },

  semantic: {
    error: '#e06c75',
    warning: '#e5c07b',
    success: '#98c379',
    info: '#61afef',
  },

  components: {
    sidebar: {
      background: '#282d35',
      itemHover: '#2c313a',
      itemActive: '#4d8cbf',
      border: '#181a1f',
    },

    tab: {
      background: '#21252b',
      activeBackground: '#282c34',
      activeBorder: '#3e4451',
      activeText: '#abb2bf',
      inactiveText: '#5c6370',
      hoverBackground: '#2c313a',
      closeButtonHoverBackground: '#3e4451',
    },

    toolbar: {
      background: '#21252b',
      buttonHover: 'rgba(97, 175, 239, 0.2)',
      buttonActive: '#4d8cbf',
      groupBorder: '#3e4451',
      groupLabel: '#5c6370',
    },

    menu: {
      background: '#2c313a',
      itemHover: 'rgba(97, 175, 239, 0.2)',
      separator: '#3e4451',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#2c313a',
      text: '#abb2bf',
      border: '#3e4451',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#2c313a',
      itemHover: 'rgba(97, 175, 239, 0.2)',
      itemSelected: '#61afef',
      border: '#3e4451',
    },

    scrollbar: {
      thumb: '#3e4451',
      thumbHover: '#4f5561',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
