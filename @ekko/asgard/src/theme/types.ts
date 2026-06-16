export interface Theme {
  name: string;

  // Base colors
  background: {
    primary: string;      // Main background
    secondary: string;    // Secondary background (panels, cards)
    tertiary: string;     // Tertiary background (hover states)
    elevated: string;     // Elevated elements (dropdowns, menus)
  };

  // Text colors
  text: {
    primary: string;      // Main text
    secondary: string;    // Secondary text (labels, descriptions)
    disabled: string;     // Disabled text
    inverse: string;      // Text on colored backgrounds
  };

  // Border colors
  border: {
    default: string;      // Default borders
    focus: string;        // Focused element borders
    divider: string;      // Dividers and separators
  };

  // Accent colors
  accent: {
    primary: string;      // Primary accent (buttons, links)
    primaryHover: string; // Primary accent hover
    primaryActive: string;// Primary accent active/pressed
    secondary: string;    // Secondary accent
  };

  // Interactive states
  interactive: {
    hover: string;        // Hover background
    active: string;       // Active/pressed background
    selected: string;     // Selected state
    focus: string;        // Focus ring/outline
  };

  // Semantic colors
  semantic: {
    error: string;
    warning: string;
    success: string;
    info: string;
  };

  // Component-specific
  components: {
    // Sidebar
    sidebar: {
      background: string;
      itemHover: string;
      itemActive: string;
      border: string;
    };

    // Tabs
    tab: {
      background: string;
      activeBackground: string;
      activeBorder: string;
      activeText: string;
      inactiveText: string;
      hoverBackground: string;
      closeButtonHoverBackground: string;
    };

    // Toolbar/Ribbon
    toolbar: {
      background: string;
      buttonHover: string;
      buttonActive: string;
      groupBorder: string;
      groupLabel: string;
    };

    // Context Menu
    menu: {
      background: string;
      itemHover: string;
      separator: string;
      shadow: string;
    };

    // Tooltip
    tooltip: {
      background: string;
      text: string;
      border: string;
      shadow: string;
    };

    // Dropdown
    dropdown: {
      background: string;
      itemHover: string;
      itemSelected: string;
      border: string;
    };

    // Scrollbar
    scrollbar: {
      thumb: string;
      thumbHover: string;
      track: string;
    };
  };

  // Opacity values
  opacity: {
    disabled: number;
    hover: number;
    backdrop: number;
  };
}
