export type AspectRatio = 'free' | '1:1' | '3:4' | '4:3' | '16:9' | '21:9' | '9:16' | 'custom';
export type CropShape = 'rectangle' | 'circle';
export type ImageCropperSize = 'small' | 'normal' | 'large';
export type ImageCropperSemantic = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type OutputFormat = 'png' | 'jpeg' | 'webp';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface CroppedImageData {
  blob: Blob;
  dataUrl: string;
  dimensions: ImageDimensions;
  cropArea: CropArea;
}

export interface ImageTransform {
  zoom: number;
  rotation: number; // in degrees
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
}

export interface HistoryState {
  crop: CropArea;
  transform: ImageTransform;
}

export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se'
  | null;

export interface ImageCropperProps {
  // Image source
  src: string | File | HTMLImageElement;
  alt?: string;

  // Crop configuration
  cropShape?: CropShape; // 'rectangle' or 'circle' (default: 'rectangle')
  aspectRatio?: AspectRatio;
  customAspectRatio?: number; // Used when aspectRatio is 'custom'
  initialCrop?: CropArea;
  minCropSize?: ImageDimensions;
  maxCropSize?: ImageDimensions;

  // Features
  showGrid?: boolean;
  allowRotation?: boolean;
  allowFlip?: boolean;
  showImageAdjustments?: boolean;
  enableHistory?: boolean; // Undo/Redo
  snapToGrid?: boolean;
  gridSize?: number; // Grid size in pixels for snapping (default: 10)
  constrainToImage?: boolean; // Keep crop within visible image boundaries

  // Zoom/Pan
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  zoomSpeed?: number;

  // Appearance
  size?: ImageCropperSize;
  semantic?: ImageCropperSemantic;
  overlayOpacity?: number; // Opacity of darkened area outside crop (0-1)
  handleSize?: number; // Size of resize handles in pixels
  borderWidth?: number; // Width of crop border in pixels

  // Events
  onCropChange?: (crop: CropArea) => void;
  onCropComplete?: (croppedImage: CroppedImageData) => void;
  onZoomChange?: (zoom: number) => void;
  onRotationChange?: (rotation: number) => void;
  onTransformChange?: (transform: ImageTransform) => void;
  onImageLoad?: (dimensions: ImageDimensions) => void;
  onError?: (error: Error) => void;

  // Export (optional)
  enableExport?: boolean;
  outputFormat?: OutputFormat;
  outputQuality?: number; // 0-1 for JPEG/WebP
  exportTransparent?: boolean; // Export areas outside image as transparent (PNG only)

  // Background
  backgroundColor?: string; // Background color for area outside image (default: '#000000')

  // Styling
  className?: string;
  style?: React.CSSProperties;
}

export interface ImageCropperRef {
  getCroppedImage: (format?: OutputFormat, quality?: number) => Promise<CroppedImageData>;
  setCrop: (crop: CropArea) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  rotate90: (direction: 'cw' | 'ccw') => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  resetTransform: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
