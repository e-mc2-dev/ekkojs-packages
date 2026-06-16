import type { Theme } from '../types';

export const lightTheme: Theme = {
  name: 'Light',

  background: {
    primary: '#ffffff',
    secondary: '#f3f3f3',
    tertiary: '#e8e8e8',
    elevated: '#ffffff',
  },

  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#ffffff',
  },

  border: {
    default: '#d4d4d4',
    focus: '#0078d4',
    divider: '#d4d4d4',
  },

  accent: {
    primary: '#0078d4',
    primaryHover: '#e8f4fd',
    primaryActive: '#005a9e',
    secondary: '#106ebe',
  },

  interactive: {
    hover: '#e8f4fd',
    active: '#cce4f7',
    selected: '#0078d4',
    focus: '#0078d4',
  },

  semantic: {
    error: '#e81123',
    warning: '#ff8c00',
    success: '#107c10',
    info: '#0078d4',
  },

  components: {
    sidebar: {
      background: '#e8e8e8',
      itemHover: '#e8e8e8',
      itemActive: '#cce4f7',
      border: '#e0e0e0',
    },

    tab: {
      background: '#f3f3f3',
      activeBackground: '#ffffff',
      activeBorder: '#d4d4d4',
      activeText: '#0078d4',
      inactiveText: '#444444',
      hoverBackground: '#e8e8e8',
      closeButtonHoverBackground: '#e0e0e0',
    },

    toolbar: {
      background: '#f3f3f3',
      buttonHover: '#e8f4fd',
      buttonActive: '#d0e8f7',
      groupBorder: '#d4d4d4',
      groupLabel: '#666666',
    },

    menu: {
      background: '#ffffff',
      itemHover: '#f0f0f0',
      separator: '#d4d4d4',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    tooltip: {
      background: '#2d2d30',
      text: '#cccccc',
      border: '#454545',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    },

    dropdown: {
      background: '#ffffff',
      itemHover: '#f0f0f0',
      itemSelected: '#e8f4fd',
      border: '#c5c5c5',
    },

    scrollbar: {
      thumb: '#c0c0c0',
      thumbHover: '#a8a8a8',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.4,
    hover: 1,
    backdrop: 0.5,
  },
};
