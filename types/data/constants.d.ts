/**
 * @summary Property name added to viewer element
 */
export const VIEWER_DATA: 'photoSphereViewer';

/**
 * @summary Available actions
 */
export const ACTIONS: {
  ROTATE_LAT_UP: 'rotateLatitudeUp',
  ROTATE_LAT_DOWN: 'rotateLatitudeDown',
  ROTATE_LONG_RIGHT: 'rotateLongitudeRight',
  ROTATE_LONG_LEFT: 'rotateLongitudeLeft',
  ZOOM_IN: 'zoomIn',
  ZOOM_OUT: 'zoomOut',
  TOGGLE_AUTOROTATE: 'toggleAutorotate',
};

/**
 * @summary Available events names
 */
export const EVENTS: {
  AUTOROTATE: 'autorotate',
  BEFORE_RENDER: 'before-render',
  BEFORE_ROTATE: 'before-rotate',
  CLICK: 'click',
  CLOSE_PANEL: 'close-panel',
  CONFIG_CHANGED: 'config-changed',
  DOUBLE_CLICK: 'dblclick',
  FULLSCREEN_UPDATED: 'fullscreen-updated',
  HIDE_NOTIFICATION: 'hide-notification',
  HIDE_OVERLAY: 'hide-overlay',
  HIDE_TOOLTIP: 'hide-tooltip',
  OPEN_PANEL: 'open-panel',
  PANORAMA_LOADED: 'panorama-loaded',
  POSITION_UPDATED: 'position-updated',
  READY: 'ready',
  RENDER: 'render',
  SHOW_NOTIFICATION: 'show-notification',
  SHOW_OVERLAY: 'show-overlay',
  SHOW_TOOLTIP: 'show-tooltip',
  SIZE_UPDATED: 'size-updated',
  STOP_ALL: 'stop-all',
  ZOOM_UPDATED: 'zoom-updated',
};

/**
 * @summary Available change events names
 */
export const CHANGE_EVENTS: {
  GET_ANIMATE_POSITION: 'get-animate-position',
  GET_ROTATE_POSITION: 'get-rotate-position',
};

/**
 * @summary Collection of easing functions
 * @see {@link https://gist.github.com/frederickk/6165768}
 */
export const EASINGS: {
  linear: (t: number) => number,

  inQuad: (t: number) => number,
  outQuad: (t: number) => number,
  inOutQuad: (t: number) => number,

  inCubic: (t: number) => number,
  outCubic: (t: number) => number,
  inOutCubic: (t: number) => number,

  inQuart: (t: number) => number,
  outQuart: (t: number) => number,
  inOutQuart: (t: number) => number,

  inQuint: (t: number) => number,
  outQuint: (t: number) => number,
  inOutQuint: (t: number) => number,

  inSine: (t: number) => number,
  outSine: (t: number) => number,
  inOutSine: (t: number) => number,

  inExpo: (t: number) => number,
  outExpo: (t: number) => number,
  inOutExpo: (t: number) => number,

  inCirc: (t: number) => number,
  outCirc: (t: number) => number,
  inOutCirc: (t: number) => number,
};
