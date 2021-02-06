import { Texture } from 'three';

/**
 * Object defining a point
 */
export type Point = {
  x: number;
  y: number;
}

/**
 * Object defining a size
 */
export type Size = {
  width: number;
  height: number;
}

/**
 * Object defining a size in CSS (px, % or auto)
 */
export type CssSize = {
  width: string;
  height: string;
}

export type SphereCorrection = {
  pan?: number;
  tilt?: number;
  roll?: number;
}

/**
 * Object defining a spherical position
 */
export type Position = {
  longitude: number;
  latitude: number;
}

/**
 * Object defining a spherical or texture position
 */
export type ExtendedPosition = Position | Point;

/**
 * Object defining animation options
 */
export type AnimateOptions = ExtendedPosition & {
  speed: string | number;
  zoom?: number;
};

/**
 * Crop information of the panorama
 */
export type PanoData = {
  fullWidth: number;
  fullHeight: number;
  croppedWidth: number;
  croppedHeight: number;
  croppedX: number;
  croppedY: number;
  poseHeading?: number;
  posePitch?: number;
  poseRoll?: number;
}

/**
 * Function to compute panorama data once the image is loaded
 */
export type PanoDataProvider = (image: HTMLImageElement) => PanoData;

/**
 * Object defining panorama and animation options
 */
export type PanoramaOptions = (ExtendedPosition | {}) & {
  zoom?: number;
  transition?: boolean | number;
  showLoader?: boolean;
  sphereCorrection?: SphereCorrection;
  panoData?: PanoData | PanoDataProvider;
};

/**
 * Result of the AbstractAdapter#loadTexture method
 */
export type TextureData = {
  texture: Texture | Texture[] | Record<string, Texture>;
  panoData?: PanoData;
};

/**
 * Data of the `click` event
 */
export type ClickData = {
  rightclick: boolean;
  clientX: number;
  clientY: number;
  viewerX: number;
  viewerY: number;
  longitude: number;
  latitude: number;
  textureX?: number;
  textureY?: number;
  marker?: any;
}

/**
 * Definition of a custom navbar button
 */
export type NavbarCustomButton = {
  id?: string;
  title?: string;
  content?: string;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  visible?: boolean;
  collapsable?: boolean;
};
