import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';

export interface RibbonProps {
  children: React.ReactNode;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({
  children,
  defaultTab,
  onTabChange
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>(defaultTab || '');
  const [collapsed, setCollapsed] = useState(false);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract tabs and their content from children
  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement => React.isValidElement(child)
  );

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (contentRef.current) {
      const scrollAmount = contentRef.current.clientWidth * 0.8; // 80% of visible width
      contentRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Check scroll position and overflow
  const updateScrollButtons = () => {
    if (contentRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = contentRef.current;
      const hasOverflow = scrollWidth > clientWidth;

      // Show left button if scrolled right and has overflow
      setShowLeftScroll(hasOverflow && scrollLeft > 1);

      // Show right button if not at end and has overflow
      setShowRightScroll(hasOverflow && scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Check for overflow on mount, resize, and content changes
  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [children, collapsed]);

  // Update buttons when scrolling
  useEffect(() => {
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', updateScrollButtons);
      return () => contentElement.removeEventListener('scroll', updateScrollButtons);
    }
    return undefined;
  }, []);

  const activeTabContent = tabs.find(tab => tab.props.id === activeTab);

  return (
    <div
      style={{
        backgroundColor: theme.background.secondary,
        borderBottom: `1px solid ${theme.border.default}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Tab Headers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '24px',
          paddingLeft: '8px',
          backgroundColor: theme.background.secondary,
          borderBottom: `1px solid ${theme.border.default}`
        }}
      >
        {tabs.map((tab) => {
          const tabId = tab.props.id;
          const label = tab.props.label;
          const isActive = tabId === activeTab;

          return (
            <div
              key={tabId}
              onClick={() => handleTabClick(tabId)}
              style={{
                padding: '4px 16px',
                fontSize: '11px',
                color: theme.text.primary,
                backgroundColor: isActive ? theme.components.tab.activeBackground : 'transparent',
                border: isActive ? `1px solid ${theme.border.default}` : '1px solid transparent',
                borderBottom: isActive ? `1px solid ${theme.components.tab.activeBackground}` : '1px solid transparent',
                borderTopLeftRadius: '2px',
                borderTopRightRadius: '2px',
                cursor: 'pointer',
                userSelect: 'none',
                fontWeight: isActive ? 600 : 400,
                marginBottom: '-1px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = theme.components.tab.hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {label}
            </div>
          );
        })}

        {/* Collapse button */}
        <div
          style={{
            marginLeft: 'auto',
            marginRight: '8px',
            fontSize: '10px',
            cursor: 'pointer',
            padding: '4px 8px',
            color: theme.text.primary
          }}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand ribbon' : 'Collapse ribbon'}
        >
          {collapsed ? '▲' : '▼'}
        </div>
      </div>

      {/* Tab Content */}
      {!collapsed && activeTabContent && (
        <div
          style={{
            backgroundColor: theme.background.primary,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {/* Scroll Left Button */}
          {showLeftScroll && (
            <div
              onClick={() => handleScroll('left')}
              style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.background.secondary,
                border: `1px solid ${theme.border.default}`,
                borderRadius: '2px',
                cursor: 'pointer',
                color: theme.text.primary,
                fontSize: '12px',
                userSelect: 'none',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.interactive.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.background.secondary;
              }}
              title="Scroll left"
            >
              ‹
            </div>
          )}

          {/* Scrollable Content */}
          <div
            ref={contentRef}
            style={{
              flex: 1,
              overflowX: 'hidden',
              overflowY: 'hidden',
              padding: '8px',
              display: 'flex',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {activeTabContent}
          </div>

          {/* Scroll Right Button */}
          {showRightScroll && (
            <div
              onClick={() => handleScroll('right')}
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.background.secondary,
                border: `1px solid ${theme.border.default}`,
                borderRadius: '2px',
                cursor: 'pointer',
                color: theme.text.primary,
                fontSize: '12px',
                userSelect: 'none',
                boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.interactive.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.background.secondary;
              }}
              title="Scroll right"
            >
              ›
            </div>
          )}
        </div>
      )}
    </div>
  );
};
