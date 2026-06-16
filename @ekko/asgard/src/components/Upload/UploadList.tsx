/**
import { safeUrl } from '../../_internal';
 * UploadList Component
 *
 * List view of upload files with progress bars
 */

import React from 'react';
import { useTheme } from '../../theme';
import { SDiv } from '../SDiv/SDiv';
import { Button } from '../Button/Button';
import { LinearProgress } from '../ProgressBar/LinearProgress';
import { Typography } from '../Typography/Typography';
import type { UploadFile } from './types';
import { formatFileSize, formatSpeed, formatDuration, getFileIcon } from './utils';

export interface UploadListProps {
  files: UploadFile[];
  onPause?: (fileId: string) => void;
  onResume?: (fileId: string) => void;
  onCancel?: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onRemove?: (fileId: string) => void;
  showPreview?: boolean;
  compact?: boolean;
}

export const UploadList: React.FC<UploadListProps> = ({
  files,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  showPreview = true,
  compact = false
}) => {
  const { theme } = useTheme();

  if (files.length === 0) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.text.secondary
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
        <Typography variant="body1">No files uploaded</Typography>
      </div>
    );
  }

  return (
    <SDiv style={{ maxHeight: '600px', overflow: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
        {files.map(file => (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: compact ? '12px' : '16px',
              backgroundColor: theme.background.secondary,
              border: `1px solid ${theme.border.default}`,
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Preview/Icon */}
            {showPreview && (
              <div style={{
                width: compact ? 40 : 56,
                height: compact ? 40 : 56,
                flexShrink: 0,
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: theme.background.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: compact ? '24px' : '32px'
              }}>
                {file.preview ? (
                  <img
                    src={safeUrl(file.preview)}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  getFileIcon(file.fileType)
                )}
              </div>
            )}

            {/* File Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* File name */}
              <Typography
                variant="body1"
                style={{
                  color: theme.text.primary,
                  fontWeight: 500,
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {file.name}
              </Typography>

              {/* File size and status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Typography variant="body2" style={{ color: theme.text.secondary, fontSize: '12px' }}>
                  {formatFileSize(file.size)}
                </Typography>

                {file.status === 'uploading' && (
                  <>
                    <span style={{ color: theme.text.secondary }}>•</span>
                    <Typography variant="body2" style={{ color: theme.text.secondary, fontSize: '12px' }}>
                      {formatSpeed(file.progress.speed)}
                    </Typography>
                    <span style={{ color: theme.text.secondary }}>•</span>
                    <Typography variant="body2" style={{ color: theme.text.secondary, fontSize: '12px' }}>
                      ETA: {formatDuration(file.progress.eta)}
                    </Typography>
                  </>
                )}

                {file.status === 'completed' && (
                  <>
                    <span style={{ color: theme.text.secondary }}>•</span>
                    <Typography variant="body2" style={{ color: theme.semantic.success, fontSize: '12px' }}>
                      ✓ Completed
                    </Typography>
                  </>
                )}

                {file.status === 'error' && (
                  <>
                    <span style={{ color: theme.text.secondary }}>•</span>
                    <Typography variant="body2" style={{ color: theme.semantic.error, fontSize: '12px' }}>
                      ✗ {file.error || 'Failed'}
                    </Typography>
                  </>
                )}

                {file.status === 'paused' && (
                  <>
                    <span style={{ color: theme.text.secondary }}>•</span>
                    <Typography variant="body2" style={{ color: theme.semantic.warning, fontSize: '12px' }}>
                      ⏸ Paused
                    </Typography>
                  </>
                )}

                {file.status === 'cancelled' && (
                  <>
                    <span style={{ color: theme.text.secondary }}>•</span>
                    <Typography variant="body2" style={{ color: theme.text.secondary, fontSize: '12px' }}>
                      Cancelled
                    </Typography>
                  </>
                )}
              </div>

              {/* Progress bar */}
              {(file.status === 'uploading' || file.status === 'paused') && (
                <div style={{ marginBottom: '4px' }}>
                  <LinearProgress
                    value={file.progress.percentage}
                    size="small"
                    showLabel={false}
                    type={file.status === 'paused' ? 'warning' : 'primary'}
                  />
                </div>
              )}

              {file.status === 'completed' && (
                <div style={{ marginBottom: '4px' }}>
                  <LinearProgress
                    value={100}
                    size="small"
                    showLabel={false}
                    type="success"
                  />
                </div>
              )}

              {file.status === 'error' && (
                <div style={{ marginBottom: '4px' }}>
                  <LinearProgress
                    value={file.progress.percentage}
                    size="small"
                    showLabel={false}
                    type="error"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {file.status === 'uploading' && (
                <>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => onPause?.(file.id)}
                    title="Pause"
                  >
                    ⏸
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    type="error"
                    onClick={() => onCancel?.(file.id)}
                    title="Cancel"
                  >
                    ✕
                  </Button>
                </>
              )}

              {file.status === 'paused' && (
                <>
                  <Button
                    size="small"
                    variant="ghost"
                    type="primary"
                    onClick={() => onResume?.(file.id)}
                    title="Resume"
                  >
                    ▶
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    type="error"
                    onClick={() => onCancel?.(file.id)}
                    title="Cancel"
                  >
                    ✕
                  </Button>
                </>
              )}

              {file.status === 'error' && (
                <>
                  <Button
                    size="small"
                    variant="ghost"
                    type="primary"
                    onClick={() => onRetry?.(file.id)}
                    title="Retry"
                  >
                    ↻
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    type="error"
                    onClick={() => onRemove?.(file.id)}
                    title="Remove"
                  >
                    ✕
                  </Button>
                </>
              )}

              {(file.status === 'completed' || file.status === 'cancelled') && (
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => onRemove?.(file.id)}
                  title="Remove"
                >
                  ✕
                </Button>
              )}

              {file.status === 'pending' && (
                <Button
                  size="small"
                  variant="ghost"
                  type="error"
                  onClick={() => onRemove?.(file.id)}
                  title="Remove"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </SDiv>
  );
};
