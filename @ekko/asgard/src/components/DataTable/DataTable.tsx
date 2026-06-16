// @ts-nocheck - Pre-existing type issues
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTheme, getSemanticColor, getContrastTextColor, addAlpha } from '../../theme';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { ContextMenu } from '../ContextMenu';
import { TextBox } from '../TextBox/TextBox';
import { Typography } from '../Typography/Typography';

// Types
export type DataTableSize = 'compact' | 'comfortable' | 'spacious';
export type DataTableVariant = 'default' | 'bordered' | 'striped' | 'borderless';
export type DataTableSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type SortDirection = 'asc' | 'desc' | null;
export type ColumnAlignment = 'left' | 'center' | 'right';
export type FilterType = 'text' | 'number' | 'date' | 'select' | 'custom';

export interface DataTableColumn<T = any> {
  id: string;
  label: string;
  field?: keyof T | string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: ColumnAlignment;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: { label: string; value: any }[];
  resizable?: boolean;
  pinned?: 'left' | 'right' | null;
  visible?: boolean;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderFilter?: (value: any, onChange: (value: any) => void) => React.ReactNode;
  format?: (value: any, row: T) => string;
  customSort?: (a: T, b: T, direction: SortDirection) => number;
}

export interface DataTableRowAction<T = any> {
  label: string | ((row: T) => string);
  icon?: React.ReactNode;
  onClick: (row: T, rowIndex: number) => void;
  disabled?: (row: T) => boolean;
  divider?: boolean;
}

export interface DataTableProps<T = any> {
  // Data
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: keyof T | ((row: T) => string | number);

  // Appearance
  size?: DataTableSize;
  variant?: DataTableVariant;
  semantic?: DataTableSemantic;
  zebraStriped?: boolean;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
  showBorder?: boolean;

  // Selection
  selectable?: boolean;
  selectedRows?: (string | number)[];
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;

  // Sorting
  sortBy?: string;
  sortDirection?: SortDirection;
  onSortChange?: (columnId: string, direction: SortDirection) => void;

  // Pagination
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];

  // Filtering
  filtering?: boolean;
  filters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;

  // Row Actions
  rowActions?: DataTableRowAction<T>[];
  onRowClick?: (row: T, rowIndex: number) => void;
  onRowDoubleClick?: (row: T, rowIndex: number) => void;

  // Loading & Empty states
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  emptyIcon?: React.ReactNode;

  // Virtual scrolling
  virtualScroll?: boolean;
  rowHeight?: number;
  containerHeight?: number;

  // Export
  exportable?: boolean;
  exportFormats?: ('csv' | 'json')[];
  onExport?: (format: 'csv' | 'json', data: T[]) => void;

  // Column control
  columnResizable?: boolean;
  columnReorderable?: boolean;
  columnVisibilityControl?: boolean;

  // Footer
  showFooter?: boolean;
  footerContent?: React.ReactNode;

  // Customization
  rowClassName?: (row: T, rowIndex: number) => string;
  rowStyle?: (row: T, rowIndex: number) => React.CSSProperties;
  cellClassName?: (row: T, column: DataTableColumn<T>, value: any) => string;
  cellStyle?: (row: T, column: DataTableColumn<T>, value: any) => React.CSSProperties;

  // Accessibility
  ariaLabel?: string;

  // HTML attributes
  className?: string;
  style?: React.CSSProperties;
}

export const DataTable = <T extends Record<string, any>>({
  data = [],
  columns: initialColumns = [],
  rowKey,
  size = 'comfortable',
  variant = 'default',
  semantic = 'primary',
  zebraStriped = true,
  stickyHeader = true,
  stickyFooter = false,
  showBorder = true,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortBy,
  sortDirection: externalSortDirection,
  onSortChange,
  pagination = true,
  pageSize: externalPageSize = 10,
  currentPage: externalCurrentPage = 1,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  filtering = false,
  filters: externalFilters = {},
  onFiltersChange,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
  rowActions = [],
  onRowClick,
  onRowDoubleClick,
  loading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  emptyIcon,
  virtualScroll = false,
  rowHeight,
  containerHeight = 600,
  exportable = false,
  exportFormats = ['csv', 'json'],
  onExport,
  columnResizable = true,
  columnReorderable = false,
  columnVisibilityControl = true,
  showFooter = false,
  footerContent,
  rowClassName,
  rowStyle,
  cellClassName,
  cellStyle,
  ariaLabel = 'Data table',
  className = '',
  style
}: DataTableProps<T>) => {
  const { theme } = useTheme();

  // Internal state
  const [columns, setColumns] = useState(initialColumns);
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(sortBy);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(externalSortDirection || null);
  const [internalPageSize, setInternalPageSize] = useState(externalPageSize);
  const [internalCurrentPage, setInternalCurrentPage] = useState(externalCurrentPage);
  const [internalFilters, setInternalFilters] = useState(externalFilters);
  const [internalGlobalFilter, setInternalGlobalFilter] = useState(externalGlobalFilter ?? '');
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [contextMenuRow, setContextMenuRow] = useState<{ row: T; index: number; anchorElement: HTMLElement } | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const semanticColor = getSemanticColor(semantic, theme);

  // Use controlled or internal state
  const activeSortBy = sortBy !== undefined ? sortBy : internalSortBy;
  const activeSortDirection = externalSortDirection !== undefined ? externalSortDirection : internalSortDirection;
  const activePageSize = externalPageSize !== undefined ? externalPageSize : internalPageSize;
  const activeCurrentPage = externalCurrentPage !== undefined ? externalCurrentPage : internalCurrentPage;
  const activeFilters = externalFilters !== undefined ? externalFilters : internalFilters;
  const activeGlobalFilter = externalGlobalFilter !== undefined ? externalGlobalFilter : internalGlobalFilter;

  // Size configurations
  const sizeConfig = {
    compact: {
      rowHeight: 32,
      headerHeight: 36,
      footerHeight: 40,
      padding: '4px 12px',
      fontSize: 12,
      iconSize: 16
    },
    comfortable: {
      rowHeight: 48,
      headerHeight: 52,
      footerHeight: 56,
      padding: '12px 16px',
      fontSize: 14,
      iconSize: 20
    },
    spacious: {
      rowHeight: 64,
      headerHeight: 68,
      footerHeight: 72,
      padding: '16px 24px',
      fontSize: 16,
      iconSize: 24
    }
  };

  const config = sizeConfig[size];
  const actualRowHeight = rowHeight || config.rowHeight;

  // Get row key
  const getRowKey = useCallback((row: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return row[rowKey] || index;
  }, [rowKey]);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply global filter
    if (filtering && activeGlobalFilter) {
      result = result.filter(row => {
        return columns.some(col => {
          if (!col.field) return false;
          const value = row[col.field as keyof T];
          return String(value).toLowerCase().includes(activeGlobalFilter.toLowerCase());
        });
      });
    }

    // Apply column filters
    if (filtering && Object.keys(activeFilters).length > 0) {
      result = result.filter(row => {
        return Object.entries(activeFilters).every(([columnId, filterValue]) => {
          if (!filterValue && filterValue !== 0) return true;

          const column = columns.find(col => col.id === columnId);
          if (!column || !column.field) return true;

          const cellValue = row[column.field as keyof T];

          if (typeof filterValue === 'string') {
            return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
          }

          return cellValue === filterValue;
        });
      });
    }

    return result;
  }, [data, columns, filtering, activeGlobalFilter, activeFilters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!activeSortBy || !activeSortDirection) return filteredData;

    const column = columns.find(col => col.id === activeSortBy);
    if (!column) return filteredData;

    const sorted = [...filteredData];

    sorted.sort((a, b) => {
      if (column.customSort) {
        return column.customSort(a, b, activeSortDirection);
      }

      const aValue = column.field ? a[column.field as keyof T] : null;
      const bValue = column.field ? b[column.field as keyof T] : null;

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return activeSortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, activeSortBy, activeSortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (activeCurrentPage - 1) * activePageSize;
    const endIndex = startIndex + activePageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination, activeCurrentPage, activePageSize]);

  const totalPages = pagination ? Math.ceil(sortedData.length / activePageSize) : 1;
  const displayData = virtualScroll ? sortedData : paginatedData;

  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column || !column.sortable) return;

    let newDirection: SortDirection = 'asc';

    if (activeSortBy === columnId) {
      if (activeSortDirection === 'asc') {
        newDirection = 'desc';
      } else if (activeSortDirection === 'desc') {
        newDirection = null;
      }
    }

    if (onSortChange) {
      onSortChange(columnId, newDirection);
    } else {
      setInternalSortBy(newDirection ? columnId : undefined);
      setInternalSortDirection(newDirection);
    }
  }, [columns, activeSortBy, activeSortDirection, onSortChange]);

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      const allKeys = displayData.map((row, index) => getRowKey(row, index));
      onSelectionChange(allKeys);
    } else {
      onSelectionChange([]);
    }
  }, [displayData, getRowKey, onSelectionChange]);

  const handleSelectRow = useCallback((rowKey: string | number, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedRows, rowKey]);
    } else {
      onSelectionChange(selectedRows.filter(key => key !== rowKey));
    }
  }, [selectedRows, onSelectionChange]);

  const isAllSelected = selectable && displayData.length > 0 &&
    displayData.every((row, index) => selectedRows.includes(getRowKey(row, index)));
  const isSomeSelected = selectable && selectedRows.length > 0 && !isAllSelected;

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    } else {
      setInternalPageSize(newPageSize);
      setInternalCurrentPage(1);
    }
  }, [onPageSizeChange]);

  // Handle column resize
  const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    setResizingColumn(columnId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(typeof column.width === 'number' ? column.width : 150);
  }, [columns]);

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);

      setColumns(prev => prev.map(col =>
        col.id === resizingColumn
          ? { ...col, width: Math.min(newWidth, col.maxWidth || Infinity) }
          : col
      ));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // Export functions
  const handleExport = useCallback((format: 'csv' | 'json') => {
    if (onExport) {
      onExport(format, sortedData);
      return;
    }

    if (format === 'csv') {
      const headers = columns.filter(col => col.visible !== false).map(col => col.label).join(',');
      const rows = sortedData.map(row => {
        return columns
          .filter(col => col.visible !== false)
          .map(col => {
            const value = col.field ? row[col.field as keyof T] : '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',');
      });

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const json = JSON.stringify(sortedData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [columns, sortedData, onExport]);

  // Render empty state
  if (!loading && data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          backgroundColor: theme.background.secondary,
          border: showBorder ? `1px solid ${theme.border.default}` : 'none',
          borderRadius: 4,
          ...style
        }}
      >
        {emptyIcon || (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.text.disabled} strokeWidth="1.5">
            <path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
            <path d="M14 2v6h6"/>
            <path d="M9 15h6"/>
          </svg>
        )}
        <Typography variant="body1" color="secondary" weight="medium" style={{ marginTop: 16 }}>
          {emptyText}
        </Typography>
      </div>
    );
  }

  // Get cell value
  const getCellValue = (row: T, column: DataTableColumn<T>) => {
    if (column.render) {
      const rowIndex = data.findIndex(r => getRowKey(r, 0) === getRowKey(row, 0));
      return column.render(row, rowIndex);
    }

    if (column.field) {
      const value = row[column.field as keyof T];
      const displayValue = column.format ? column.format(value, row) : value;

      // Wrap primitive values with Typography
      if (displayValue !== null && displayValue !== undefined && typeof displayValue !== 'object') {
        return (
          <Typography variant="body2" component="span">
            {String(displayValue)}
          </Typography>
        );
      }

      return displayValue;
    }

    return null;
  };

  return (
    <div
      ref={tableRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.background.secondary,
        border: showBorder ? `1px solid ${theme.border.default}` : 'none',
        borderRadius: 4,
        overflow: 'hidden',
        ...style
      }}
      role="table"
      aria-label={ariaLabel}
    >
      {/* Toolbar */}
      {(filtering || exportable || columnVisibilityControl) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 12,
          borderBottom: `1px solid ${theme.border.default}`,
          backgroundColor: theme.background.elevated
        }}>
          {filtering && (
            <TextBox
              value={activeGlobalFilter}
              onChange={(value) => {
                if (onGlobalFilterChange) {
                  onGlobalFilterChange(value);
                } else {
                  setInternalGlobalFilter(value);
                }
              }}
              placeholder="Search..."
              size={size === 'compact' ? 'small' : size === 'spacious' ? 'large' : 'normal'}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              }
              style={{ flex: 1, maxWidth: 300 }}
            />
          )}

          <div style={{ flex: 1 }} />

          {exportable && (
            <div style={{ display: 'flex', gap: 4 }}>
              {exportFormats.includes('csv') && (
                <Button
                  size={size === 'compact' ? 'small' : 'normal'}
                  variant="outlined"
                  type={semantic}
                  onClick={() => handleExport('csv')}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  }
                >
                  CSV
                </Button>
              )}
              {exportFormats.includes('json') && (
                <Button
                  size={size === 'compact' ? 'small' : 'normal'}
                  variant="outlined"
                  type={semantic}
                  onClick={() => handleExport('json')}
                  leftIcon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  }
                >
                  JSON
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table container */}
      <div
        className="datatable-scrollable"
        style={{
          flex: 1,
          overflow: stickyHeader || virtualScroll ? 'auto' : 'visible',
          maxHeight: stickyHeader || virtualScroll ? containerHeight : 'none'
        }}
      >
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: config.fontSize
        }}>
          {/* Header */}
          <thead style={{
            position: stickyHeader ? 'sticky' : 'static',
            top: 0,
            zIndex: 10,
            backgroundColor: theme.background.elevated
          }}>
            <tr>
              {selectable && (
                <th style={{
                  width: 48,
                  padding: config.padding,
                  textAlign: 'center',
                  borderBottom: `2px solid ${theme.border.default}`,
                  backgroundColor: theme.background.elevated
                }}>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleSelectAll}
                    size={size === 'compact' ? 'small' : size === 'spacious' ? 'large' : 'normal'}
                    type={semantic}
                  />
                </th>
              )}

              {columns.filter(col => col.visible !== false).map((column) => (
                <th
                  key={column.id}
                  style={{
                    padding: config.padding,
                    textAlign: column.align || 'left',
                    fontWeight: 600,
                    color: theme.text.primary,
                    borderBottom: `2px solid ${theme.border.default}`,
                    backgroundColor: theme.background.elevated,
                    position: 'relative',
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start'
                  }}>
                    {column.renderHeader ? column.renderHeader() : (
                      <Typography variant="subtitle2" weight="bold" component="span">
                        {column.label}
                      </Typography>
                    )}

                    {column.sortable && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: activeSortBy === column.id ? 1 : 0.3
                      }}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill={activeSortBy === column.id && activeSortDirection === 'asc' ? semanticColor : 'currentColor'}
                        >
                          <path d="M7 14l5-5 5 5z"/>
                        </svg>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill={activeSortBy === column.id && activeSortDirection === 'desc' ? semanticColor : 'currentColor'}
                          style={{ marginTop: -8 }}
                        >
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {columnResizable && column.resizable !== false && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        cursor: 'col-resize',
                        backgroundColor: resizingColumn === column.id ? semanticColor : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseDown={(e) => handleResizeStart(e, column.id)}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = addAlpha(semanticColor, 0.3);
                      }}
                      onMouseLeave={(e) => {
                        if (resizingColumn !== column.id) {
                          (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        }
                      }}
                    />
                  )}
                </th>
              ))}

              {rowActions.length > 0 && (
                <th style={{
                  width: 48,
                  padding: config.padding,
                  textAlign: 'center',
                  borderBottom: `2px solid ${theme.border.default}`,
                  backgroundColor: theme.background.elevated
                }}>
                  <Typography variant="subtitle2" weight="bold" component="span">
                    Actions
                  </Typography>
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.filter(col => col.visible !== false).length +
                    (selectable ? 1 : 0) +
                    (rowActions.length > 0 ? 1 : 0)
                  }
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: theme.text.secondary
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12
                  }}>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke={semanticColor}
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="60"
                        strokeDashoffset="20"
                        strokeLinecap="round"
                      />
                    </svg>
                    <Typography variant="body2" color="secondary" component="span">
                      {loadingText}
                    </Typography>
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const key = getRowKey(row, rowIndex);
                const isSelected = selectedRows.includes(key);
                const isHovered = hoveredRow === rowIndex;

                return (
                  <tr
                    key={key}
                    className={rowClassName?.(row, rowIndex)}
                    style={{
                      backgroundColor: isSelected
                        ? addAlpha(semanticColor, 0.1)
                        : isHovered
                          ? addAlpha(theme.text.primary, 0.03)
                          : zebraStriped && rowIndex % 2 === 1
                            ? theme.background.tertiary
                            : 'transparent',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.15s',
                      ...rowStyle?.(row, rowIndex)
                    }}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    onDoubleClick={() => onRowDoubleClick?.(row, rowIndex)}
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onContextMenu={(e) => {
                      if (rowActions.length > 0) {
                        e.preventDefault();
                        setContextMenuRow({
                          row,
                          index: rowIndex,
                          x: e.clientX,
                          y: e.clientY
                        });
                      }
                    }}
                  >
                    {selectable && (
                      <td style={{
                        padding: config.padding,
                        textAlign: 'center',
                        borderBottom: `1px solid ${theme.border.default}`
                      }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => handleSelectRow(key, checked)}
                          size={size === 'compact' ? 'small' : size === 'spacious' ? 'large' : 'normal'}
                          type={semantic}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}

                    {columns.filter(col => col.visible !== false).map((column) => {
                      const cellValue = getCellValue(row, column);

                      return (
                        <td
                          key={column.id}
                          className={cellClassName?.(row, column, cellValue)}
                          style={{
                            padding: config.padding,
                            textAlign: column.align || 'left',
                            borderBottom: `1px solid ${theme.border.default}`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            ...cellStyle?.(row, column, cellValue)
                          }}
                        >
                          {cellValue}
                        </td>
                      );
                    })}

                    {rowActions.length > 0 && (
                      <td style={{
                        padding: config.padding,
                        textAlign: 'center',
                        borderBottom: `1px solid ${theme.border.default}`
                      }}>
                        <Button
                          size={size === 'compact' ? 'small' : 'normal'}
                          variant="ghost"
                          type={semantic}
                          iconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuRow({
                              row,
                              index: rowIndex,
                              anchorElement: e.currentTarget as HTMLElement
                            });
                          }}
                          leftIcon={
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2"/>
                              <circle cx="12" cy="12" r="2"/>
                              <circle cx="12" cy="19" r="2"/>
                            </svg>
                          }
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer */}
          {showFooter && footerContent && (
            <tfoot style={{
              position: stickyFooter ? 'sticky' : 'static',
              bottom: 0,
              zIndex: 10,
              backgroundColor: theme.background.elevated,
              borderTop: `2px solid ${theme.border.default}`
            }}>
              <tr>
                <td
                  colSpan={
                    columns.filter(col => col.visible !== false).length +
                    (selectable ? 1 : 0) +
                    (rowActions.length > 0 ? 1 : 0)
                  }
                  style={{ padding: config.padding }}
                >
                  {footerContent}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pagination && !loading && displayData.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          borderTop: `1px solid ${theme.border.default}`,
          backgroundColor: theme.background.elevated,
          fontSize: config.fontSize
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Typography variant="body2" color="secondary" component="span">
              Rows per page:
            </Typography>
            <select
              value={activePageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: `1px solid ${theme.border.default}`,
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                fontSize: config.fontSize,
                cursor: 'pointer'
              }}
            >
              {pageSizeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <Typography variant="body2" color="secondary" component="span" style={{ marginLeft: 16 }}>
              {(activeCurrentPage - 1) * activePageSize + 1}-
              {Math.min(activeCurrentPage * activePageSize, sortedData.length)} of{' '}
              {totalItems !== undefined ? totalItems : sortedData.length}
            </Typography>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Button
              size={size === 'compact' ? 'small' : 'normal'}
              variant="ghost"
              type={semantic}
              disabled={activeCurrentPage === 1}
              onClick={() => handlePageChange(1)}
              iconOnly
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="11 17 6 12 11 7"/>
                  <polyline points="18 17 13 12 18 7"/>
                </svg>
              }
            />

            <Button
              size={size === 'compact' ? 'small' : 'normal'}
              variant="ghost"
              type={semantic}
              disabled={activeCurrentPage === 1}
              onClick={() => handlePageChange(activeCurrentPage - 1)}
              iconOnly
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              }
            />

            <Typography variant="body2" weight="medium" component="span" style={{ padding: '0 12px' }}>
              Page {activeCurrentPage} of {totalPages}
            </Typography>

            <Button
              size={size === 'compact' ? 'small' : 'normal'}
              variant="ghost"
              type={semantic}
              disabled={activeCurrentPage === totalPages}
              onClick={() => handlePageChange(activeCurrentPage + 1)}
              iconOnly
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              }
            />

            <Button
              size={size === 'compact' ? 'small' : 'normal'}
              variant="ghost"
              type={semantic}
              disabled={activeCurrentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              iconOnly
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="13 17 18 12 13 7"/>
                  <polyline points="6 17 11 12 6 7"/>
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenuRow && rowActions.length > 0 && (
        <ContextMenu
          items={rowActions.map((action, idx) => ({
            id: `action-${idx}`,
            label: typeof action.label === 'function' ? action.label(contextMenuRow.row) : action.label,
            icon: action.icon,
            onClick: () => {
              action.onClick(contextMenuRow.row, contextMenuRow.index);
              setContextMenuRow(null);
            },
            disabled: action.disabled?.(contextMenuRow.row),
            separator: action.divider
          }))}
          anchorElement={contextMenuRow.anchorElement}
          onClose={() => setContextMenuRow(null)}
        />
      )}

      {/* Animations and scrollbar styling */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          /* Theme-compliant scrollbar styling */
          .datatable-scrollable::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          .datatable-scrollable::-webkit-scrollbar-track {
            background: ${theme.background.secondary};
            border-radius: 4px;
          }

          .datatable-scrollable::-webkit-scrollbar-thumb {
            background: ${addAlpha(theme.text.secondary, 0.3)};
            border-radius: 4px;
            border: 2px solid ${theme.background.secondary};
          }

          .datatable-scrollable::-webkit-scrollbar-thumb:hover {
            background: ${addAlpha(theme.text.secondary, 0.5)};
          }

          .datatable-scrollable::-webkit-scrollbar-thumb:active {
            background: ${addAlpha(semanticColor, 0.6)};
          }

          .datatable-scrollable::-webkit-scrollbar-corner {
            background: ${theme.background.secondary};
          }

          /* Firefox scrollbar styling */
          .datatable-scrollable {
            scrollbar-width: thin;
            scrollbar-color: ${addAlpha(theme.text.secondary, 0.3)} ${theme.background.secondary};
          }
        `}
      </style>
    </div>
  );
};
