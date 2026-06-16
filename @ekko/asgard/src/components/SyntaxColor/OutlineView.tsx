// ============================================================================
// OutlineView — Code structure panel showing functions, classes, etc.
// ============================================================================

import React, { useState, useCallback } from 'react';
import { useTheme } from '../../theme';
import type { OutlineViewProps, OutlineEntry } from './types';

/** SVG icons for outline entry kinds */
function getKindIcon(kind: OutlineEntry['kind'], color: string, size: number): React.ReactNode {
  const s = size - 2;
  const common = { width: s, height: s, viewBox: '0 0 16 16', style: { display: 'block', flexShrink: 0 } as React.CSSProperties };

  switch (kind) {
    case 'function':
    case 'method':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">f</text>
        </svg>
      );
    case 'class':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">C</text>
        </svg>
      );
    case 'interface':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">I</text>
        </svg>
      );
    case 'variable':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">v</text>
        </svg>
      );
    case 'enum':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">E</text>
        </svg>
      );
    case 'type':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">T</text>
        </svg>
      );
    case 'import':
      return (
        <svg {...common}>
          <path d="M3 8h10M10 5l3 3-3 3" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'property':
      return (
        <svg {...common}>
          <text x="2" y="12" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">p</text>
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" fill={color} />
        </svg>
      );
  }
}

/** Renders a single outline entry with children */
const OutlineItem: React.FC<{
  entry: OutlineEntry;
  isActive: boolean;
  fontSize: number;
  onEntryClick: (lineNumber: number) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ entry, isActive, fontSize, onEntryClick, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = entry.children && entry.children.length > 0;

  const kindColorMap: Record<OutlineEntry['kind'], string> = {
    function: theme.accent.primary,
    method: theme.accent.primary,
    class: theme.semantic.warning,
    interface: theme.semantic.info,
    variable: theme.text.primary,
    import: theme.text.disabled,
    property: theme.text.secondary,
    enum: theme.semantic.success,
    type: theme.semantic.info,
    other: theme.text.disabled,
  };

  const handleClick = useCallback(() => {
    onEntryClick(entry.lineNumber);
  }, [entry.lineNumber, onEntryClick]);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingLeft: `${entry.depth * 12 + 4}px`,
          paddingRight: '8px',
          height: `${Math.round(fontSize * 1.8)}px`,
          cursor: 'pointer',
          backgroundColor: isActive
            ? theme.interactive.selected
            : isHovered
              ? theme.interactive.hover
              : 'transparent',
          transition: 'background-color 0.1s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Expand/collapse for items with children */}
        {hasChildren ? (
          <div
            onClick={toggleExpand}
            style={{
              width: `${fontSize}px`,
              height: `${fontSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width={fontSize - 4} height={fontSize - 4} viewBox="0 0 16 16">
              {isExpanded ? (
                <path d="M4 6l4 4 4-4" fill="none" stroke={theme.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M6 4l4 4-4 4" fill="none" stroke={theme.text.secondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        ) : (
          <div style={{ width: `${fontSize}px`, flexShrink: 0 }} />
        )}

        {/* Kind icon */}
        {getKindIcon(entry.kind, kindColorMap[entry.kind], fontSize)}

        {/* Label */}
        <span
          style={{
            fontSize: `${fontSize}px`,
            color: isActive ? theme.text.primary : theme.text.secondary,
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.label}
        </span>

        {/* Line number */}
        <span
          style={{
            fontSize: `${fontSize - 2}px`,
            color: theme.text.disabled,
            marginLeft: 'auto',
            flexShrink: 0,
          }}
        >
          :{entry.lineNumber}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && entry.children!.map(child => (
        <OutlineItem
          key={child.id}
          entry={child}
          isActive={false}
          fontSize={fontSize}
          onEntryClick={onEntryClick}
          theme={theme}
        />
      ))}
    </div>
  );
};

export const OutlineView: React.FC<OutlineViewProps> = ({
  entries,
  onEntryClick,
  activeLineNumber,
  fontSize,
}) => {
  const { theme } = useTheme();

  // Find the active entry (closest entry at or before activeLineNumber)
  const activeEntryId = activeLineNumber
    ? findActiveEntry(entries, activeLineNumber)
    : undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.border.divider}`,
        backgroundColor: theme.background.secondary,
        overflow: 'auto',
        minWidth: '160px',
        maxWidth: '250px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '4px 8px',
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          color: theme.text.secondary,
          borderBottom: `1px solid ${theme.border.divider}`,
        }}
      >
        Outline
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {entries.length === 0 ? (
          <div
            style={{
              padding: '8px',
              fontSize: `${fontSize - 1}px`,
              color: theme.text.disabled,
              fontStyle: 'italic',
            }}
          >
            No symbols
          </div>
        ) : (
          entries.map(entry => (
            <OutlineItem
              key={entry.id}
              entry={entry}
              isActive={entry.id === activeEntryId}
              fontSize={fontSize}
              onEntryClick={onEntryClick}
              theme={theme}
            />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Finds the entry ID closest to (and at or before) the given line number.
 */
function findActiveEntry(entries: OutlineEntry[], lineNumber: number): string | undefined {
  let bestId: string | undefined;
  let bestLine = 0;

  function walk(items: OutlineEntry[]): void {
    for (const entry of items) {
      if (entry.lineNumber <= lineNumber && entry.lineNumber > bestLine) {
        bestId = entry.id;
        bestLine = entry.lineNumber;
      }
      if (entry.children) walk(entry.children);
    }
  }

  walk(entries);
  return bestId;
}
