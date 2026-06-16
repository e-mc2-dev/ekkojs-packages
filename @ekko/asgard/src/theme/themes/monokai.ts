import type { Theme } from '../types';

export const monokaiTheme: Theme = {
  name: 'Monokai',

  background: {
    primary: '#272822',
    secondary: '#1e1f1c',
    tertiary: '#3e3d32',
    elevated: '#3e3d32',
  },

  text: {
    primary: '#f8f8f2',
    secondary: '#75715e',
    disabled: '#49483e',
    inverse: '#272822',
  },

  border: {
    default: '#49483e',
    focus: '#f92672',
    divider: '#49483e',
  },

  accent: {
    primary: '#f92672',
    primaryHover: 'rgba(249, 38, 114, 0.2)',
    primaryActive: '#c91d5e',
    secondary: '#66d9ef',
  },

  interactive: {
    hover: 'rgba(249, 38, 114, 0.2)',
    active: '#c91d5e',
    selected: '#f92672',
    focus: '#f92672',
  },

  semantic: {
    error: '#f92672',
    warning: '#e6db74',
    success: '#a6e22e',
    info: '#66d9ef',
  },

  components: {
    sidebar: {
      background: '#232420',
      itemHover: '#3e3d32',
      itemActive: '#c91d5e',
      border: '#141514',
    },

    tab: {
      background: '#1e1f1c',
      activeBackground: '#272822',
      activeBorder: '#49483e',
      activeText: '#f8f8f2',
      inactiveText: '#75715e',
      hoverBackground: '#3e3d32',
      closeButtonHoverBackground: '#49483e',
    },

    toolbar: {
      background: '#1e1f1c',
      buttonHover: 'rgba(249, 38, 114, 0.2)',
      buttonActive: '#c91d5e',
      groupBorder: '#49483e',
      groupLabel: '#75715e',
    },

    menu: {
      background: '#3e3d32',
      itemHover: 'rgba(249, 38, 114, 0.2)',
      separator: '#49483e',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#3e3d32',
      text: '#f8f8f2',
      border: '#49483e',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#3e3d32',
      itemHover: 'rgba(249, 38, 114, 0.2)',
      itemSelected: '#f92672',
      border: '#49483e',
    },

    scrollbar: {
      thumb: '#49483e',
      thumbHover: '#5a594d',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
