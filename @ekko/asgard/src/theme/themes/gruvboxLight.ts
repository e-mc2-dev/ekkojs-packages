import type { Theme } from '../types';

export const gruvboxLightTheme: Theme = {
  name: 'Gruvbox Light',

  background: {
    primary: '#fbf1c7',
    secondary: '#f2e5bc',
    tertiary: '#ebdbb2',
    elevated: '#fbf1c7',
  },

  text: {
    primary: '#3c3836',
    secondary: '#7c6f64',
    disabled: '#a89984',
    inverse: '#fbf1c7',
  },

  border: {
    default: '#d5c4a1',
    focus: '#076678',
    divider: '#d5c4a1',
  },

  accent: {
    primary: '#076678',
    primaryHover: '#d5e5ec',
    primaryActive: '#065260',
    secondary: '#427b58',
  },

  interactive: {
    hover: '#d5e5ec',
    active: '#b5d5e2',
    selected: '#076678',
    focus: '#076678',
  },

  semantic: {
    error: '#cc241d',
    warning: '#d79921',
    success: '#98971a',
    info: '#076678',
  },

  components: {
    sidebar: {
      background: '#ebdbb2',
      itemHover: '#ebdbb2',
      itemActive: '#b5d5e2',
      border: '#e5d5a8',
    },

    tab: {
      background: '#f2e5bc',
      activeBackground: '#fbf1c7',
      activeBorder: '#d5c4a1',
      activeText: '#3c3836',
      inactiveText: '#7c6f64',
      hoverBackground: '#ebdbb2',
      closeButtonHoverBackground: '#e5d5a8',
    },

    toolbar: {
      background: '#f2e5bc',
      buttonHover: '#d5e5ec',
      buttonActive: '#b5d5e2',
      groupBorder: '#d5c4a1',
      groupLabel: '#7c6f64',
    },

    menu: {
      background: '#fbf1c7',
      itemHover: '#ebdbb2',
      separator: '#d5c4a1',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    tooltip: {
      background: '#3c3836',
      text: '#ebdbb2',
      border: '#504945',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#fbf1c7',
      itemHover: '#ebdbb2',
      itemSelected: '#d5e5ec',
      border: '#d5c4a1',
    },

    scrollbar: {
      thumb: '#d5c4a1',
      thumbHover: '#bdac85',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.4,
    hover: 1,
    backdrop: 0.5,
  },
};
