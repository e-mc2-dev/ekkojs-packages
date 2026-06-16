/**
 * Upload Manager
 *
 * Core upload logic handling:
 * - Queue management
 * - Chunked uploads with retry
 * - Progress tracking
 * - Speed calculation
 * - Pause/Resume/Cancel
 */

import type { UploadFile, UploadConfig, UploadEvents, UploadStatus, UploadChunk, UploadQueueState } from './types';
import { waitFakeCall } from './utils';

/**
 * Default upload configuration
 */
export const DEFAULT_CONFIG: UploadConfig = {
  chunkSize: 1024 * 1024, // 1MB
  maxConcurrent: 3,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxRetries: 3,
  retryDelay: 1000,
  chunked: true,
  useChecksum: true,
  multiple: true,
  autoUpload: false,
  generatePreview: true,
  maxPreviewSize: 300
};

/**
 * Upload Manager Class
 */
export class UploadManager {
  private files: Map<string, UploadFile> = new Map();
  private uploadingFiles: Set<string> = new Set();
  private abortControllers: Map<string, AbortController> = new Map();
  private speedTrackers: Map<string, { bytes: number; timestamp: number }[]> = new Map();
  private config: UploadConfig;
  public events: UploadEvents;

  // Explicit fields + assignments (StripOnly doesn't transform constructor parameter properties).
  constructor(
    config: UploadConfig = DEFAULT_CONFIG,
    events: UploadEvents = {}
  ) {
    this.config = config;
    this.events = events;
  }

  /**
   * Add files to upload queue
   */
  addFiles(uploadFiles: UploadFile[]): void {
    uploadFiles.forEach(file => {
      this.files.set(file.id, file);
    });

    this.events.onFilesAdd?.(uploadFiles);
    this.emitQueueChange();

    if (this.config.autoUpload) {
      this.startQueue();
    }
  }

  /**
   * Remove file from queue
   */
  removeFile(fileId: string): void {
    const file = this.files.get(fileId);
    if (!file) return;

    // Cancel upload if in progress
    if (file.status === 'uploading') {
      this.cancelUpload(fileId);
    }

    this.files.delete(fileId);
    this.events.onFileRemove?.(fileId);
    this.emitQueueChange();
  }

  /**
   * Start upload queue
   */
  startQueue(): void {
    const pending = this.getPendingFiles();
    const canStart = this.config.maxConcurrent - this.uploadingFiles.size;

    for (let i = 0; i < Math.min(canStart, pending.length); i++) {
      this.startUpload(pending[i].id);
    }
  }

  /**
   * Start upload for a specific file
   */
  async startUpload(fileId: string): Promise<void> {
    const file = this.files.get(fileId);
    if (!file || file.status !== 'pending') return;

    // Check concurrent limit
    if (this.uploadingFiles.size >= this.config.maxConcurrent) {
      return;
    }

    this.uploadingFiles.add(fileId);
    this.updateFileStatus(fileId, 'uploading');
    file.startTime = Date.now();

    const abortController = new AbortController();
    this.abortControllers.set(fileId, abortController);

    this.events.onUploadStart?.(file);

    try {
      if (this.config.chunked && file.chunks) {
        await this.uploadChunked(file, abortController.signal);
      } else {
        await this.uploadWhole(file, abortController.signal);
      }

      // Upload completed successfully
      file.endTime = Date.now();
      this.updateFileStatus(fileId, 'completed');
      this.uploadingFiles.delete(fileId);
      this.abortControllers.delete(fileId);

      this.events.onUploadComplete?.(file);

      // Start next in queue
      this.startQueue();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Upload was cancelled
        return;
      }

      // Upload failed
      file.error = error.message || 'Upload failed';
      this.updateFileStatus(fileId, 'error');
      this.uploadingFiles.delete(fileId);
      this.abortControllers.delete(fileId);

      this.events.onUploadError?.(file, file.error || 'Unknown error');

      // Start next in queue
      this.startQueue();
    }
  }

  /**
   * Upload file in chunks
   */
  private async uploadChunked(file: UploadFile, signal: AbortSignal): Promise<void> {
    if (!file.chunks) return;

    const totalChunks = file.chunks.length;

    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const chunk = file.chunks[i];
      let retries = 0;
      let uploaded = false;

      while (!uploaded && retries <= this.config.maxRetries) {
        try {
          chunk.status = 'uploading';
          this.events.onChunkStart?.(file, chunk);

          // Simulate chunk upload (in real implementation, this would be an API call)
          await this.simulateChunkUpload(file, chunk, signal);

          chunk.status = 'completed';
          chunk.progress = 1;
          uploaded = true;

          this.events.onChunkComplete?.(file, chunk);
        } catch (error: any) {
          if (signal.aborted) {
            throw error;
          }

          retries++;
          chunk.retries = retries;

          if (retries > this.config.maxRetries) {
            chunk.status = 'error';
            this.events.onChunkError?.(file, chunk, error.message);
            throw new Error(`Chunk ${i} failed after ${this.config.maxRetries} retries`);
          }

          // Wait before retry
          await waitFakeCall(this.config.retryDelay * retries);
        }
      }

      // Update file progress
      this.updateFileProgress(file);
    }
  }

  /**
   * Upload entire file at once
   */
  private async uploadWhole(file: UploadFile, signal: AbortSignal): Promise<void> {
    // Simulate whole file upload
    const totalBytes = file.size;
    const chunkSize = Math.min(this.config.chunkSize, totalBytes);
    let uploadedBytes = 0;

    while (uploadedBytes < totalBytes) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const bytesToUpload = Math.min(chunkSize, totalBytes - uploadedBytes);

      // Simulate upload progress
      await waitFakeCall(50);

      uploadedBytes += bytesToUpload;
      file.progress.loaded = uploadedBytes;
      this.updateFileProgress(file);
    }
  }

  /**
   * Simulate chunk upload with progress (demo only)
   */
  private async simulateChunkUpload(
    file: UploadFile,
    chunk: UploadChunk,
    signal: AbortSignal
  ): Promise<void> {
    const chunkSize = chunk.size;
    const steps = 10;
    const stepSize = chunkSize / steps;
    let uploaded = 0;

    for (let i = 0; i < steps; i++) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      await waitFakeCall(Math.random() * 50 + 50); // 50-100ms per step

      uploaded += stepSize;
      chunk.progress = uploaded / chunkSize;

      // Track speed
      this.trackSpeed(file.id, stepSize);

      // Update file progress
      file.progress.loaded = chunk.start + uploaded;
      this.updateFileProgress(file);

      this.events.onChunkProgress?.(file, chunk, uploaded);
    }
  }

  /**
   * Track upload speed
   */
  private trackSpeed(fileId: string, bytes: number): void {
    if (!this.speedTrackers.has(fileId)) {
      this.speedTrackers.set(fileId, []);
    }

    const tracker = this.speedTrackers.get(fileId)!;
    const now = Date.now();

    tracker.push({ bytes, timestamp: now });

    // Keep only last 5 seconds of data
    const fiveSecondsAgo = now - 5000;
    while (tracker.length > 0 && tracker[0].timestamp < fiveSecondsAgo) {
      tracker.shift();
    }
  }

  /**
   * Calculate upload speed for a file
   */
  private calculateSpeed(fileId: string): number {
    const tracker = this.speedTrackers.get(fileId);
    if (!tracker || tracker.length < 2) return 0;

    const totalBytes = tracker.reduce((sum, t) => sum + t.bytes, 0);
    const timeSpan = (tracker[tracker.length - 1].timestamp - tracker[0].timestamp) / 1000;

    return timeSpan > 0 ? totalBytes / timeSpan : 0;
  }

  /**
   * Update file progress
   */
  private updateFileProgress(file: UploadFile): void {
    const { loaded, total } = file.progress;
    const percentage = total > 0 ? (loaded / total) * 100 : 0;
    const speed = this.calculateSpeed(file.id);
    const remaining = total - loaded;
    const eta = speed > 0 ? remaining / speed : 0;

    const chunksCompleted = file.chunks?.filter(c => c.status === 'completed').length || 0;

    file.progress = {
      ...file.progress,
      percentage,
      speed,
      eta,
      chunksCompleted
    };

    this.events.onUploadProgress?.(file, file.progress);
    this.events.onSpeedChange?.(speed);
    this.emitQueueChange();
  }

  /**
   * Pause upload
   */
  pauseUpload(fileId: string): void {
    const file = this.files.get(fileId);
    if (!file || file.status !== 'uploading') return;

    const controller = this.abortControllers.get(fileId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(fileId);
    }

    this.updateFileStatus(fileId, 'paused');
    this.uploadingFiles.delete(fileId);
    this.events.onUploadPause?.(file);
    this.emitQueueChange();

    // Start next in queue
    this.startQueue();
  }

  /**
   * Resume upload
   */
  resumeUpload(fileId: string): void {
    const file = this.files.get(fileId);
    if (!file || file.status !== 'paused') return;

    this.updateFileStatus(fileId, 'pending');
    this.events.onUploadResume?.(file);
    this.startUpload(fileId);
  }

  /**
   * Cancel upload
   */
  cancelUpload(fileId: string): void {
    const file = this.files.get(fileId);
    if (!file) return;

    const controller = this.abortControllers.get(fileId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(fileId);
    }

    this.updateFileStatus(fileId, 'cancelled');
    this.uploadingFiles.delete(fileId);
    this.speedTrackers.delete(fileId);
    this.events.onUploadCancel?.(file);
    this.emitQueueChange();

    // Start next in queue
    this.startQueue();
  }

  /**
   * Retry failed upload
   */
  retryUpload(fileId: string): void {
    const file = this.files.get(fileId);
    if (!file || file.status !== 'error') return;

    // Reset file state
    file.error = undefined;
    file.progress.loaded = 0;
    file.progress.percentage = 0;
    file.progress.speed = 0;
    file.progress.eta = 0;
    file.progress.chunksCompleted = 0;

    // Reset chunks
    if (file.chunks) {
      file.chunks.forEach(chunk => {
        chunk.status = 'pending';
        chunk.progress = 0;
        chunk.retries = 0;
      });
    }

    this.updateFileStatus(fileId, 'pending');
    this.startUpload(fileId);
  }

  /**
   * Clear completed/failed uploads
   */
  clearCompleted(): void {
    const toRemove: string[] = [];

    this.files.forEach((file, id) => {
      if (file.status === 'completed' || file.status === 'error' || file.status === 'cancelled') {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => this.removeFile(id));
  }

  /**
   * Get queue state
   */
  getQueueState(): UploadQueueState {
    const files = Array.from(this.files.values());
    const uploading = files.filter(f => f.status === 'uploading');
    const completed = files.filter(f => f.status === 'completed');
    const failed = files.filter(f => f.status === 'error');

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const loadedBytes = files.reduce((sum, f) => sum + f.progress.loaded, 0);
    const totalProgress = totalBytes > 0 ? (loadedBytes / totalBytes) * 100 : 0;

    const overallSpeed = uploading.reduce((sum, f) => sum + f.progress.speed, 0);
    const remaining = totalBytes - loadedBytes;
    const overallEta = overallSpeed > 0 ? remaining / overallSpeed : 0;

    return {
      files,
      uploading,
      completed,
      failed,
      totalProgress,
      overallSpeed,
      overallEta
    };
  }

  /**
   * Get pending files sorted by priority
   */
  private getPendingFiles(): UploadFile[] {
    return Array.from(this.files.values())
      .filter(f => f.status === 'pending')
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Update file status
   */
  private updateFileStatus(fileId: string, status: UploadStatus): void {
    const file = this.files.get(fileId);
    if (file) {
      file.status = status;
      this.emitQueueChange();
    }
  }

  /**
   * Emit queue change event
   */
  private emitQueueChange(): void {
    this.events.onQueueChange?.(this.getQueueState());
  }

  /**
   * Get file by ID
   */
  getFile(fileId: string): UploadFile | undefined {
    return this.files.get(fileId);
  }

  /**
   * Get all files
   */
  getAllFiles(): UploadFile[] {
    return Array.from(this.files.values());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy manager and cleanup
   */
  destroy(): void {
    // Cancel all uploads
    this.uploadingFiles.forEach(id => this.cancelUpload(id));
    this.files.clear();
    this.uploadingFiles.clear();
    this.abortControllers.clear();
    this.speedTrackers.clear();
  }
}
