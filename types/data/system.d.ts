/**
 * @summary General information about the system
 */
export const SYSTEM: {
  loaded: boolean;
  pixelRatio: number;
  isWebGLSupported: boolean;
  maxTextureWidth: number;
  mouseWheelEvent: string;
  fullscreenEvent: string;
  getMaxCanvasWidth: () => number;
  isTouchEnabled: Promise<boolean>;
};
