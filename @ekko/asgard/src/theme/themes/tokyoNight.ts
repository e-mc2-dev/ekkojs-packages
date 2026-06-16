import type { Theme } from '../types';

export const tokyoNightTheme: Theme = {
  name: 'Tokyo Night',

  background: {
    primary: '#1a1b26',
    secondary: '#16161e',
    tertiary: '#24283b',
    elevated: '#24283b',
  },

  text: {
    primary: '#a9b1d6',
    secondary: '#565f89',
    disabled: '#3b4261',
    inverse: '#1a1b26',
  },

  border: {
    default: '#3b4261',
    focus: '#7aa2f7',
    divider: '#3b4261',
  },

  accent: {
    primary: '#7aa2f7',
    primaryHover: 'rgba(122, 162, 247, 0.2)',
    primaryActive: '#5f82c6',
    secondary: '#7dcfff',
  },

  interactive: {
    hover: 'rgba(122, 162, 247, 0.2)',
    active: '#5f82c6',
    selected: '#7aa2f7',
    focus: '#7aa2f7',
  },

  semantic: {
    error: '#f7768e',
    warning: '#e0af68',
    success: '#9ece6a',
    info: '#7dcfff',
  },

  components: {
    sidebar: {
      background: '#1a1b24',
      itemHover: '#24283b',
      itemActive: '#5f82c6',
      border: '#0f0f14',
    },

    tab: {
      background: '#16161e',
      activeBackground: '#1a1b26',
      activeBorder: '#3b4261',
      activeText: '#a9b1d6',
      inactiveText: '#565f89',
      hoverBackground: '#24283b',
      closeButtonHoverBackground: '#292e42',
    },

    toolbar: {
      background: '#16161e',
      buttonHover: 'rgba(122, 162, 247, 0.2)',
      buttonActive: '#5f82c6',
      groupBorder: '#3b4261',
      groupLabel: '#565f89',
    },

    menu: {
      background: '#24283b',
      itemHover: 'rgba(122, 162, 247, 0.2)',
      separator: '#3b4261',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    tooltip: {
      background: '#24283b',
      text: '#a9b1d6',
      border: '#3b4261',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    },

    dropdown: {
      background: '#24283b',
      itemHover: 'rgba(122, 162, 247, 0.2)',
      itemSelected: '#7aa2f7',
      border: '#3b4261',
    },

    scrollbar: {
      thumb: '#3b4261',
      thumbHover: '#444b6a',
      track: 'transparent',
    },
  },

  opacity: {
    disabled: 0.2,
    hover: 0.2,
    backdrop: 0.5,
  },
};
