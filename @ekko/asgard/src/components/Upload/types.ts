/**
 * Upload Component Types
 *
 * Comprehensive type definitions for the upload system including:
 * - File upload management
 * - Chunk handling with checksums
 * - Progress tracking
 * - Queue management
 */

export type UploadStatus =
  | 'pending'    // Waiting in queue
  | 'uploading'  // Currently uploading
  | 'paused'     // Upload paused by user
  | 'completed'  // Successfully uploaded
  | 'error'      // Upload failed
  | 'cancelled'; // Upload cancelled by user

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other';

/**
 * Chunk information for chunked uploads
 */
export interface UploadChunk {
  /** Chunk index (0-based) */
  index: number;
  /** Chunk data as ArrayBuffer */
  data: ArrayBuffer;
  /** Start byte position in original file */
  start: number;
  /** End byte position in original file */
  end: number;
  /** Chunk size in bytes */
  size: number;
  /** SHA-256 checksum of chunk data */
  checksum: string;
  /** Upload status of this chunk */
  status: 'pending' | 'uploading' | 'completed' | 'error';
  /** Number of retry attempts */
  retries: number;
  /** Upload progress (0-1) */
  progress: number;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Upload speed in bytes/second */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number;
  /** Number of chunks completed */
  chunksCompleted: number;
  /** Total number of chunks */
  chunksTotal: number;
}

/**
 * File upload item
 */
export interface UploadFile {
  /** Unique identifier */
  id: string;
  /** Original File object */
  file: File;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Detected file type category */
  fileType: FileType;
  /** Upload status */
  status: UploadStatus;
  /** Upload progress information */
  progress: UploadProgress;
  /** Preview URL for images (data URL or object URL) */
  preview?: string;
  /** Error message if upload failed */
  error?: string;
  /** Chunks for chunked upload */
  chunks?: UploadChunk[];
  /** Upload start timestamp */
  startTime?: number;
  /** Upload end timestamp */
  endTime?: number;
  /** Upload priority (higher = upload first) */
  priority: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Upload configuration
 */
export interface UploadConfig {
  /** Chunk size in bytes (default: 1MB) */
  chunkSize: number;
  /** Maximum concurrent uploads (default: 3) */
  maxConcurrent: number;
  /** Maximum file size in bytes (default: 100MB) */
  maxFileSize: number;
  /** Maximum retry attempts per chunk (default: 3) */
  maxRetries: number;
  /** Retry delay in ms (default: 1000) */
  retryDelay: number;
  /** Enable chunked upload (default: true) */
  chunked: boolean;
  /** Calculate checksums (default: true) */
  useChecksum: boolean;
  /** Accepted file types (MIME types) */
  accept?: string[];
  /** Enable multiple file selection */
  multiple: boolean;
  /** Auto-start upload on file select */
  autoUpload: boolean;
  /** Generate preview for images */
  generatePreview: boolean;
  /** Maximum preview size in pixels */
  maxPreviewSize: number;
}

/**
 * Upload queue state
 */
export interface UploadQueueState {
  /** All files in queue */
  files: UploadFile[];
  /** Currently uploading files */
  uploading: UploadFile[];
  /** Completed files */
  completed: UploadFile[];
  /** Failed files */
  failed: UploadFile[];
  /** Total progress across all files */
  totalProgress: number;
  /** Overall upload speed */
  overallSpeed: number;
  /** Overall ETA */
  overallEta: number;
}

/**
 * Upload event handlers
 */
export interface UploadEvents {
  /** Called when files are selected/added */
  onFilesAdd?: (files: UploadFile[]) => void;
  /** Called when a file is removed */
  onFileRemove?: (fileId: string) => void;
  /** Called when upload starts for a file */
  onUploadStart?: (file: UploadFile) => void;
  /** Called on upload progress update */
  onUploadProgress?: (file: UploadFile, progress: UploadProgress) => void;
  /** Called when upload completes successfully */
  onUploadComplete?: (file: UploadFile) => void;
  /** Called when upload fails */
  onUploadError?: (file: UploadFile, error: string) => void;
  /** Called when upload is paused */
  onUploadPause?: (file: UploadFile) => void;
  /** Called when upload is resumed */
  onUploadResume?: (file: UploadFile) => void;
  /** Called when upload is cancelled */
  onUploadCancel?: (file: UploadFile) => void;
  /** Called when a chunk starts uploading */
  onChunkStart?: (file: UploadFile, chunk: UploadChunk) => void;
  /** Called on chunk progress */
  onChunkProgress?: (file: UploadFile, chunk: UploadChunk, loaded: number) => void;
  /** Called when chunk completes */
  onChunkComplete?: (file: UploadFile, chunk: UploadChunk) => void;
  /** Called when chunk fails */
  onChunkError?: (file: UploadFile, chunk: UploadChunk, error: string) => void;
  /** Called when queue state changes */
  onQueueChange?: (state: UploadQueueState) => void;
  /** Called when overall speed changes */
  onSpeedChange?: (speed: number) => void;
}

/**
 * Upload validation result
 */
export interface UploadValidation {
  valid: boolean;
  error?: string;
}

/**
 * File drop event data
 */
export interface FileDropData {
  files: File[];
  items: DataTransferItem[];
}
