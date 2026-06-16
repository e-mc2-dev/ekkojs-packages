import type { Theme } from '../types';

export const nordTheme: Theme = {
  name: 'Nord',

  background: {
    primary: '#2e3440',
    secondary: '#242933',
    tertiary: '#3b4252',
    elevated: '#3b4252',
  },

  text: {
    primary: '#eceff4',
    secondary: '#81a1c1',
    disabled: '#4c566a',
    inverse: '#2e3440',
  },

  border: {
    default: '#4c566a',
    focus: '#88c0d0',
    divider: '#4c566a',
  },

  accent: {
    primary: '#88c0d0',
    primaryHover: 'rgba(136, 192, 208, 0.2)',
    primaryActive: '#6a9fb5',
    secondary: '#81a1c1',
  },

  interactive: {
    hover: 'rgba(136, 192, 208, 0.2)',
    active: '#6a9fb5',
    selected: '#88c0d0',
    focus: '#88c0d0',
  },

  semantic: {
    error: '#bf616a',
    warning: '#ebcb8b',
    success: '#a3be8c',
    info: '#81a1c1',
  },

  components: {
    sidebar: {
      background: '#2b313d',
      itemHover: '#3b4252',
      itemActive: '#6a9fb5',
      border: '#1e222b',
    },

    tab: {
      background: '#242933',
      activeBackground: '#2e3440',
      activeBorder: '#4c566a',
      activeText: '#eceff4',
      inactiveText: '#81a1c1',
      hoverBackground: '#3b4252',
      closeButtonHoverBackground: '#434c5e',
    },

    toolbar: {
      background: '#242933',
      buttonHover: 'rgba(136, 192, 208, 0.2)',
      buttonActive: '#6a9fb5',
      groupBorder: '#4c566a',
      groupLabel: '#81a1c1',
    },

    menu: {
      background: '#3b4252',
      itemHover: 'rgba(136, 192, 208, 0.2)',
      separator: '#4c566a',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#3b4252',
      text: '#eceff4',
      border: '#4c566a',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#3b4252',
      itemHover: 'rgba(136, 192, 208, 0.2)',
      itemSelected: '#88c0d0',
      border: '#4c566a',
    },

    scrollbar: {
      thumb: '#4c566a',
      thumbHover: '#5e6779',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
