import type { Theme } from '../types';

export const draculaTheme: Theme = {
  name: 'Dracula',

  background: {
    primary: '#282a36',
    secondary: '#21222c',
    tertiary: '#343746',
    elevated: '#343746',
  },

  text: {
    primary: '#f8f8f2',
    secondary: '#6272a4',
    disabled: '#44475a',
    inverse: '#282a36',
  },

  border: {
    default: '#44475a',
    focus: '#bd93f9',
    divider: '#44475a',
  },

  accent: {
    primary: '#bd93f9',
    primaryHover: 'rgba(189, 147, 249, 0.2)',
    primaryActive: '#9b71d4',
    secondary: '#8be9fd',
  },

  interactive: {
    hover: 'rgba(189, 147, 249, 0.2)',
    active: '#9b71d4',
    selected: '#bd93f9',
    focus: '#bd93f9',
  },

  semantic: {
    error: '#ff5555',
    warning: '#f1fa8c',
    success: '#50fa7b',
    info: '#8be9fd',
  },

  components: {
    sidebar: {
      background: '#2a2c3a',
      itemHover: '#343746',
      itemActive: '#9b71d4',
      border: '#191a21',
    },

    tab: {
      background: '#21222c',
      activeBackground: '#282a36',
      activeBorder: '#44475a',
      activeText: '#f8f8f2',
      inactiveText: '#6272a4',
      hoverBackground: '#343746',
      closeButtonHoverBackground: '#44475a',
    },

    toolbar: {
      background: '#21222c',
      buttonHover: 'rgba(189, 147, 249, 0.2)',
      buttonActive: '#9b71d4',
      groupBorder: '#44475a',
      groupLabel: '#6272a4',
    },

    menu: {
      background: '#343746',
      itemHover: 'rgba(189, 147, 249, 0.2)',
      separator: '#44475a',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#343746',
      text: '#f8f8f2',
      border: '#44475a',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#343746',
      itemHover: 'rgba(189, 147, 249, 0.2)',
      itemSelected: '#bd93f9',
      border: '#44475a',
    },

    scrollbar: {
      thumb: '#44475a',
      thumbHover: '#565869',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
