/**
 * Upload Utility Functions
 *
 * Core utilities for file upload handling including:
 * - File type detection
 * - Chunking
 * - Checksum calculation
 * - Preview generation
 * - File validation
 */

import type { FileType, UploadChunk, UploadFile, UploadConfig, UploadValidation } from './types';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect file type category from MIME type
 */
export function detectFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) return 'code';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') ||
      mimeType.includes('excel') || mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'document';
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') ||
      mimeType.includes('gz') || mimeType.includes('7z')) {
    return 'archive';
  }
  return 'other';
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: FileType): string {
  const icons: Record<FileType, string> = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    archive: '📦',
    code: '💻',
    other: '📁'
  };
  return icons[fileType];
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format speed to human-readable string
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * Calculate SHA-256 checksum of data
 */
export async function calculateChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Split file into chunks
 */
export async function createChunks(
  file: File,
  chunkSize: number,
  useChecksum: boolean
): Promise<UploadChunk[]> {
  const chunks: UploadChunk[] = [];
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);
    const data = await blob.arrayBuffer();

    const chunk: UploadChunk = {
      index: i,
      data,
      start,
      end,
      size: end - start,
      checksum: useChecksum ? await calculateChecksum(data) : '',
      status: 'pending',
      retries: 0,
      progress: 0
    };

    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Generate preview for image file
 */
export async function generatePreview(
  file: File,
  maxSize: number
): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => resolve(undefined);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

/**
 * Validate file against config
 */
export function validateFile(file: File, config: UploadConfig): UploadValidation {
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(config.maxFileSize)})`
    };
  }

  // Check file type if accept list is provided
  if (config.accept && config.accept.length > 0) {
    const accepted = config.accept.some(acceptType => {
      if (acceptType.endsWith('/*')) {
        const category = acceptType.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === acceptType;
    });

    if (!accepted) {
      return {
        valid: false,
        error: `File type "${file.type}" is not accepted`
      };
    }
  }

  return { valid: true };
}

/**
 * Create UploadFile from File object
 */
export async function createUploadFile(
  file: File,
  config: UploadConfig,
  priority: number = 0
): Promise<UploadFile> {
  const id = generateId();
  const fileType = detectFileType(file.type);

  // Generate preview for images
  const preview = config.generatePreview && fileType === 'image'
    ? await generatePreview(file, config.maxPreviewSize)
    : undefined;

  // Create chunks if chunking is enabled
  const chunks = config.chunked
    ? await createChunks(file, config.chunkSize, config.useChecksum)
    : undefined;

  return {
    id,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    fileType,
    status: 'pending',
    progress: {
      loaded: 0,
      total: file.size,
      percentage: 0,
      speed: 0,
      eta: 0,
      chunksCompleted: 0,
      chunksTotal: chunks?.length || 1
    },
    preview,
    chunks,
    priority
  };
}

/**
 * Check if File System Access API is available
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window;
}

/**
 * Open file picker using File System Access API
 */
export async function openFilePicker(
  multiple: boolean = false,
  accept?: string[]
): Promise<File[]> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported');
  }

  try {
    const options: any = {
      multiple,
      types: accept ? [{
        description: 'Files',
        accept: accept.reduce((acc, type) => {
          const [_category] = type.split('/');
          if (!acc[type]) acc[type] = [];
          return acc;
        }, {} as Record<string, string[]>)
      }] : undefined
    };

    const handles = await (window as any).showOpenFilePicker(options);
    const files: File[] = [];

    for (const handle of handles) {
      const file = await handle.getFile();
      files.push(file);
    }

    return files;
  } catch (error) {
    // User cancelled or error occurred
    return [];
  }
}

/**
 * Fallback file picker using input element
 */
export function openFilePickerFallback(
  multiple: boolean = false,
  accept?: string[]
): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept) {
      input.accept = accept.join(',');
    }

    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve(files);
    };

    input.oncancel = () => resolve([]);

    input.click();
  });
}

/**
 * Extract files from DataTransfer (drag & drop)
 */
export async function extractFilesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);

  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  return files;
}

/**
 * Simulate a fake API call for demo purposes
 */
export function waitFakeCall(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
