/**
 * @summary Number of pixels bellow which a mouse move will be considered as a click
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const MOVE_THRESHOLD = 4;

/**
 * @summary Delay in milliseconds between two clicks to consider a double click
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const DBLCLICK_DELAY = 300;

/**
 * @summary Delay in milliseconds to emulate a long touch
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const LONGTOUCH_DELAY = 500;

/**
 * @summary Time size of the mouse position history used to compute inertia
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const INERTIA_WINDOW = 300;

/**
 * @summary Radius of the THREE.SphereGeometry, Half-length of the THREE.BoxGeometry
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const SPHERE_RADIUS = 100;

/**
 * @summary Number of vertice of the THREE.SphereGeometry
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const SPHERE_VERTICES = 64;

/**
 * @summary Number of vertices of each side of the THREE.BoxGeometry
 * @memberOf PSV.CONSTANTS
 * @type {number}
 * @constant
 */
export const CUBE_VERTICES = 8;

/**
 * @summary Order of cube textures for arrays
 * @memberOf PSV.CONSTANTS
 * @type {number[]}
 * @constant
 */
export const CUBE_MAP = [0, 2, 4, 5, 3, 1];

/**
 * @summary Order of cube textures for maps
 * @memberOf PSV.CONSTANTS
 * @type {string[]}
 * @constant
 */
export const CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];

/**
 * @summary Property name added to buttons list
 * @memberOf PSV.CONSTANTS
 * @type {string}
 * @constant
 */
export const BUTTON_DATA = 'psvButton';

/**
 * @summary Property name added to viewer element
 * @memberOf PSV.CONSTANTS
 * @type {string}
 * @constant
 */
export const VIEWER_DATA = 'photoSphereViewer';

/**
 * @summary Available actions
 * @memberOf PSV.CONSTANTS
 * @enum {string}
 * @constant
 */
export const ACTIONS = {
  ROTATE_LAT_UP    : 'rotateLatitudeUp',
  ROTATE_LAT_DOWN  : 'rotateLatitudeDown',
  ROTATE_LONG_RIGHT: 'rotateLongitudeRight',
  ROTATE_LONG_LEFT : 'rotateLongitudeLeft',
  ZOOM_IN          : 'zoomIn',
  ZOOM_OUT         : 'zoomOut',
  TOGGLE_AUTOROTATE: 'toggleAutorotate',
};

/**
 * @summary Available events
 * @memberOf PSV.CONSTANTS
 * @enum {string}
 * @constant
 */
export const EVENTS = {
  AUTOROTATE        : 'autorotate',
  BEFORE_RENDER     : 'before-render',
  BEFORE_ROTATE     : 'before-rotate',
  CLICK             : 'click',
  CLOSE_PANEL       : 'close-panel',
  CONFIG_CHANGED    : 'config-changed',
  DOUBLE_CLICK      : 'dblclick',
  FULLSCREEN_UPDATED: 'fullscreen-updated',
  HIDE_NOTIFICATION : 'hide-notification',
  HIDE_OVERLAY      : 'hide-overlay',
  HIDE_TOOLTIP      : 'hide-tooltip',
  OPEN_PANEL        : 'open-panel',
  PANORAMA_LOADED   : 'panorama-loaded',
  POSITION_UPDATED  : 'position-updated',
  READY             : 'ready',
  RENDER            : 'render',
  SHOW_NOTIFICATION : 'show-notification',
  SHOW_OVERLAY      : 'show-overlay',
  SHOW_TOOLTIP      : 'show-tooltip',
  SIZE_UPDATED      : 'size-updated',
  STOP_ALL          : 'stop-all',
  ZOOM_UPDATED      : 'zoom-updated',
};

/**
 * @summary Available change events
 * @memberOf PSV.CONSTANTS
 * @enum {string}
 * @constant
 */
export const CHANGE_EVENTS = {
  GET_ANIMATE_POSITION: 'get-animate-position',
  GET_ROTATE_POSITION : 'get-rotate-position',
};

/**
 * @summary Internal identifiers for various stuff
 * @memberOf PSV.CONSTANTS
 * @enum {string}
 * @constant
 */
export const IDS = {
  MENU       : 'menu',
  TWO_FINGERS: 'twoFingers',
  ERROR      : 'error',
};

/* eslint-disable */
// @formatter:off
/**
 * @summary Collection of easing functions
 * @memberOf PSV.CONSTANTS
 * @see {@link https://gist.github.com/frederickk/6165768}
 * @type {Object<string, Function>}
 * @constant
 */
export const EASINGS = {
  linear    : (t) => t,

  inQuad    : (t) => t*t,
  outQuad   : (t) => t*(2-t),
  inOutQuad : (t) => t<.5 ? 2*t*t : -1+(4-2*t)*t,

  inCubic   : (t) => t*t*t,
  outCubic  : (t) => (--t)*t*t+1,
  inOutCubic: (t) => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,

  inQuart   : (t) => t*t*t*t,
  outQuart  : (t) => 1-(--t)*t*t*t,
  inOutQuart: (t) => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,

  inQuint   : (t) => t*t*t*t*t,
  outQuint  : (t) => 1+(--t)*t*t*t*t,
  inOutQuint: (t) => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,

  inSine    : (t) => 1-Math.cos(t*(Math.PI/2)),
  outSine   : (t) => Math.sin(t*(Math.PI/2)),
  inOutSine : (t) => .5-.5*Math.cos(Math.PI*t),

  inExpo    : (t) => Math.pow(2, 10*(t-1)),
  outExpo   : (t) => 1-Math.pow(2, -10*t),
  inOutExpo : (t) => (t=t*2-1)<0 ? .5*Math.pow(2, 10*t) : 1-.5*Math.pow(2, -10*t),

  inCirc    : (t) => 1-Math.sqrt(1-t*t),
  outCirc   : (t) => Math.sqrt(1-(t-1)*(t-1)),
  inOutCirc : (t) => (t*=2)<1 ? .5-.5*Math.sqrt(1-t*t) : .5+.5*Math.sqrt(1-(t-=2)*t)
};
// @formatter:on
/* eslint-enable */
