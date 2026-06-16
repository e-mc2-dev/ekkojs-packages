/**
 * UploadZone Component
 *
 * Drag & drop upload zone with file selection
 * Features:
 * - Drag and drop files
 * - Click to select files
 * - Visual feedback on drag over
 * - Empty state
 * - File validation
 * - Preview support
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useTheme } from '../../theme';
import { Button } from '../Button/Button';
import { Typography } from '../Typography/Typography';
import type { UploadConfig, UploadFile } from './types';
import {
  validateFile,
  createUploadFile,
  extractFilesFromDataTransfer,
  openFilePickerFallback,
  isFileSystemAccessSupported,
  openFilePicker
} from './utils';
import { DEFAULT_CONFIG } from './uploader';

export interface UploadZoneProps {
  /** Upload configuration */
  config?: Partial<UploadConfig>;
  /** Called when files are added */
  onFilesAdd?: (files: UploadFile[]) => void;
  /** Called when validation fails */
  onValidationError?: (file: File, error: string) => void;
  /** Show file count */
  showFileCount?: boolean;
  /** Custom empty state content */
  emptyContent?: React.ReactNode;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Height of the zone */
  height?: number | string;
  /** Children to render instead of empty state */
  children?: React.ReactNode;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  config: userConfig,
  onFilesAdd,
  onValidationError,
  showFileCount = false,
  emptyContent,
  icon,
  title = 'Drop files here',
  description = 'or click to browse',
  disabled = false,
  height = 300,
  children
}) => {
  const { theme } = useTheme();
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const [isDragging, setIsDragging] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [, setHasOverflow] = useState(false);
  const [useHorizontalLayout, setUseHorizontalLayout] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure container size and detect overflow
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();

        setContainerSize({ width: containerRect.width, height: containerRect.height });

        // Check if content overflows container
        const overflowsVertically = contentRect.height > containerRect.height;
        const overflowsHorizontally = contentRect.width > containerRect.width;

        setHasOverflow(overflowsVertically || overflowsHorizontally);

        // If vertical layout overflows, try horizontal
        if (overflowsVertically && !useHorizontalLayout) {
          setUseHorizontalLayout(true);
        } else if (!overflowsVertically && useHorizontalLayout && containerRect.height < 150) {
          // If horizontal is used but vertical fits again, switch back for tall containers
          setUseHorizontalLayout(false);
        }
      }
    };

    checkOverflow();

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Fallback for older browsers
    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [useHorizontalLayout]);

  /**
   * Handle file selection
   */
  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return;

    const validFiles: File[] = [];
    const errors: { file: File; error: string }[] = [];

    // Validate files
    for (const file of files) {
      const validation = validateFile(file, config);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push({ file, error: validation.error || 'Invalid file' });
      }
    }

    // Report validation errors
    errors.forEach(({ file, error }) => {
      onValidationError?.(file, error);
    });

    if (validFiles.length === 0) return;

    // Create UploadFile objects
    const uploadFiles = await Promise.all(
      validFiles.map(file => createUploadFile(file, config))
    );

    setFileCount(prev => prev + uploadFiles.length);
    onFilesAdd?.(uploadFiles);
  }, [config, disabled, onFilesAdd, onValidationError]);

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, [disabled]);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setIsDragging(false);
    dragCounter.current = 0;

    const files = await extractFilesFromDataTransfer(e.dataTransfer);
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [disabled, handleFiles]);

  /**
   * Handle click to browse
   */
  const handleClick = useCallback(async () => {
    if (disabled) return;

    try {
      let files: File[] = [];

      if (isFileSystemAccessSupported()) {
        files = await openFilePicker(config.multiple, config.accept);
      } else {
        files = await openFilePickerFallback(config.multiple, config.accept);
      }

      if (files.length > 0) {
        await handleFiles(files);
      }
    } catch (error) {
      console.error('File selection error:', error);
    }
  }, [config.multiple, config.accept, disabled, handleFiles]);

  /**
   * Handle input change (fallback)
   */
  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [handleFiles]);

  const borderColor = isDragging
    ? theme.accent.primary
    : theme.border.default;

  const backgroundColor = isDragging
    ? theme.accent.primary + '10'
    : theme.background.secondary;

  // Determine layout based on container size and overflow detection
  const { width: w, height: h } = containerSize;

  // Determine base layout size
  const isCompact = h > 0 && h < 100;
  const isSmall = h > 0 && h >= 100 && h < 150;
  const isMedium = h > 0 && h >= 150 && h < 200;
  const isFull = h === 0 || h >= 200; // default to full if not measured yet

  // Choose layout direction based on overflow
  const shouldUseHorizontal = useHorizontalLayout || isCompact;

  return (
    <div
      ref={containerRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={children ? undefined : handleClick}
      style={{
        height,
        border: `2px dashed ${borderColor}`,
        borderRadius: '8px',
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        padding: isCompact ? '8px 16px' : isMedium ? '12px' : '24px',
        position: 'relative',
        opacity: disabled ? 0.5 : 1,
        overflow: 'hidden'
      }}
    >
      {/* Hidden file input for fallback */}
      <input
        ref={inputRef}
        type="file"
        multiple={config.multiple}
        accept={config.accept?.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {children || (
        <>
          {emptyContent || (
            <div
              ref={contentRef}
              style={{
                display: 'flex',
                flexDirection: shouldUseHorizontal ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: shouldUseHorizontal ? '12px' : (isSmall ? '8px' : isMedium ? '10px' : '16px'),
                width: '100%',
                textAlign: shouldUseHorizontal ? 'left' : 'center',
                flexWrap: 'nowrap'
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: isCompact ? '24px' : isSmall ? '32px' : isMedium ? '40px' : '64px',
                opacity: 0.6,
                animation: isDragging ? 'pulse 1s infinite' : 'none',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {icon || '📁'}
              </div>

              {/* Text content */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: shouldUseHorizontal ? 'flex-start' : 'center',
                gap: '4px',
                flex: shouldUseHorizontal ? 1 : undefined,
                minWidth: 0,
                width: shouldUseHorizontal ? undefined : '100%'
              }}>
                {/* Title */}
                <Typography
                  variant={isFull && !shouldUseHorizontal ? 'h3' : 'body1'}
                  style={{
                    color: theme.text.primary,
                    fontSize: isCompact ? '13px' : isSmall ? '14px' : isMedium ? '15px' : undefined,
                    whiteSpace: shouldUseHorizontal ? 'nowrap' : 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}
                >
                  {title}
                </Typography>

                {/* Description - hide in compact mode */}
                {!isCompact && (
                  <Typography
                    variant="body2"
                    style={{
                      color: theme.text.secondary,
                      fontSize: isSmall ? '11px' : isMedium ? '12px' : undefined,
                      whiteSpace: shouldUseHorizontal ? 'nowrap' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%'
                    }}
                  >
                    {description}
                  </Typography>
                )}
              </div>

              {/* Button - show for medium and full layouts, unless horizontal and space is tight */}
              {(isMedium || isFull) && (!shouldUseHorizontal || w > 400) && (
                <Button
                  type="primary"
                  variant={isFull && !shouldUseHorizontal ? 'filled' : 'outlined'}
                  size={isMedium || shouldUseHorizontal ? 'small' : 'normal'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  disabled={disabled}
                  style={{
                    flexShrink: 0
                  }}
                >
                  {shouldUseHorizontal ? 'Browse' : 'Browse Files'}
                </Button>
              )}

              {/* Extra info - only in full vertical layout */}
              {isFull && !shouldUseHorizontal && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%'
                }}>
                  {/* File count */}
                  {showFileCount && fileCount > 0 && (
                    <Typography
                      variant="body2"
                      style={{
                        color: theme.semantic.success
                      }}
                    >
                      {fileCount} {fileCount === 1 ? 'file' : 'files'} added
                    </Typography>
                  )}

                  {/* Accept info */}
                  {config.accept && config.accept.length > 0 && (
                    <Typography
                      variant="body2"
                      style={{
                        color: theme.text.secondary,
                        fontSize: '12px'
                      }}
                    >
                      Accepted: {config.accept.join(', ')}
                    </Typography>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
