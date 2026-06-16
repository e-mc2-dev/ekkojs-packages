import type { Theme } from '../types';

export const materialLightTheme: Theme = {
  name: 'Material Light',

  background: {
    primary: '#fafafa',
    secondary: '#ffffff',
    tertiary: '#f5f5f5',
    elevated: '#ffffff',
  },

  text: {
    primary: '#263238',
    secondary: '#546e7a',
    disabled: '#b0bec5',
    inverse: '#ffffff',
  },

  border: {
    default: '#cfd8dc',
    focus: '#00bcd4',
    divider: '#cfd8dc',
  },

  accent: {
    primary: '#00bcd4',
    primaryHover: '#e0f7fa',
    primaryActive: '#00acc1',
    secondary: '#0097a7',
  },

  interactive: {
    hover: '#e0f7fa',
    active: '#b2ebf2',
    selected: '#00bcd4',
    focus: '#00bcd4',
  },

  semantic: {
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    info: '#2196f3',
  },

  components: {
    sidebar: {
      background: '#f5f5f5',
      itemHover: '#f5f5f5',
      itemActive: '#b2ebf2',
      border: '#e8e8e8',
    },

    tab: {
      background: '#ffffff',
      activeBackground: '#fafafa',
      activeBorder: '#cfd8dc',
      activeText: '#263238',
      inactiveText: '#546e7a',
      hoverBackground: '#f5f5f5',
      closeButtonHoverBackground: '#e8e8e8',
    },

    toolbar: {
      background: '#ffffff',
      buttonHover: '#e0f7fa',
      buttonActive: '#b2ebf2',
      groupBorder: '#cfd8dc',
      groupLabel: '#546e7a',
    },

    menu: {
      background: '#ffffff',
      itemHover: '#f5f5f5',
      separator: '#cfd8dc',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    tooltip: {
      background: '#263238',
      text: '#fafafa',
      border: '#37474f',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#ffffff',
      itemHover: '#f5f5f5',
      itemSelected: '#e0f7fa',
      border: '#cfd8dc',
    },

    scrollbar: {
      thumb: '#bdbdbd',
      thumbHover: '#9e9e9e',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.4,
    hover: 1,
    backdrop: 0.5,
  },
};
