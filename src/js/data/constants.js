/**
 * @module data/constants
 */

/**
 * @summary Namespace for SVG creation
 * @type {string}
 * @constant
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @summary Number of pixels bellow which a mouse move will be considered as a click
 * @type {number}
 * @constant
 */
export const MOVE_THRESHOLD = 4;

/**
 * @summary Delay in milliseconds between two clicks to consider a double click
 * @type {number}
 * @constant
 */
export const DBLCLICK_DELAY = 300;

/**
 * @summary Time size of the mouse position history used to compute inertia
 * @type {number}
 * @constant
 */
export const INERTIA_WINDOW = 300;

/**
 * @summary Radius of the THREE.SphereGeometry
 * Half-length of the THREE.BoxGeometry
 * @type {number}
 * @constant
 */
export const SPHERE_RADIUS = 100;

/**
 * @summary Number of vertice of the THREE.SphereGeometry
 * @type {number}
 * @constant
 */
export const SPHERE_VERTICES = 64;

/**
 * @summary Number of vertices of each side of the THREE.BoxGeometry
 * @type {number}
 * @constant
 */
export const CUBE_VERTICES = 8;

/**
 * @summary Order of cube textures for arrays
 * @type {number[]}
 * @constant
 */
export const CUBE_MAP = [0, 2, 4, 5, 3, 1];

/**
 * @summary Order of cube textures for maps
 * @type {string[]}
 * @constant
 */
export const CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];

/**
 * @summary Property name added to marker elements
 * @type {string}
 * @constant
 */
export const MARKER_DATA = 'psvMarker';

/**
 * @summary Property name added to buttons list
 * @type {string}
 * @constant
 */
export const BUTTON_DATA = 'psvButton';

/**
 * @summary Property name added to viewer element
 * @type {string}
 * @constant
 */
export const VIEWER_DATA = 'photoSphereViewer';

/**
 * @summary Available actions
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
 * @enum {string}
 * @constant
 */
export const EVENTS = {
  AUTOROTATE            : 'autorotate',
  BEFORE_RENDER         : 'before-render',
  CLICK                 : 'click',
  CLOSE_PANEL           : 'close-panel',
  DOUBLE_CLICK          : 'dblclick',
  FULLSCREEN_UPDATED    : 'fullscreen-updated',
  GOTO_MARKER_DONE      : 'goto-marker-done',
  GYROSCOPE_UPDATED     : 'gyroscope-updated',
  HIDE_HUD              : 'hide-hud',
  HIDE_NOTIFICATION     : 'hide-notification',
  HIDE_OVERLAY          : 'hide-overlay',
  HIDE_TOOLTIP          : 'hide-tooltip',
  LEAVE_MARKER          : 'leave-marker',
  OPEN_PANEL            : 'open-panel',
  OVER_MARKER           : 'over-marker',
  PANORAMA_CACHED       : 'panorama-cached',
  PANORAMA_LOAD_PROGRESS: 'panorama-load-progress',
  PANORAMA_LOADED       : 'panorama-loaded',
  POSITION_UPDATED      : 'position-updated',
  READY                 : 'ready',
  RENDER                : 'render',
  RENDER_MARKERS_LIST   : 'render-markers-list',
  SELECT_MARKER         : 'select-marker',
  SELECT_MARKER_LIST    : 'select-marker-list',
  SHOW_HUD              : 'show-hud',
  SHOW_NOTIFICATION     : 'show-notification',
  SHOW_OVERLAY          : 'show-overlay',
  SHOW_TOOLTIP          : 'show-tooltip',
  SIZE_UPDATED          : 'size-updated',
  STEREO_UPATED         : 'stereo-updated',
  UNSELECT_MARKER       : 'unselect-marker',
  ZOOM_UPDATED          : 'zoom-updated',
};

/**
 * @summary Types of marker
 * @enum {string}
 * @constant
 */
export const MARKER_TYPES = {
  image      : 'image',
  html       : 'html',
  polygonPx  : 'polygonPx',
  polygonRad : 'polygonRad',
  polylinePx : 'polylinePx',
  polylineRad: 'polylineRad',
  square     : 'square',
  rect       : 'rect',
  circle     : 'circle',
  ellipse    : 'ellipse',
  path       : 'path',
};

/**
 * @summary Internal identifiers for various stuff
 * @enum {string}
 * @constant
 */
export const IDS = {
  MARKERS_LIST : 'markersList',
  MARKER       : 'marker',
  MENU         : 'menu',
  PLEASE_ROTATE: 'pleaseRotate',
  TWO_FINGERS  : 'twoFingers',
  ERROR        : 'error',
};

/* eslint-disable */
// @formatter:off
/**
 * @summary Collection of easing functions
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
  inOutExpo : (t) => { t=t*2-1; return t<0 ? .5*Math.pow(2, 10*t) : 1-.5*Math.pow(2, -10*t); },

  inCirc    : (t) => 1-Math.sqrt(1-t*t),
  outCirc   : (t) => Math.sqrt(1-(t-1)*(t-1)),
  inOutCirc : (t) => { t*=2; return t<1 ? .5-.5*Math.sqrt(1-t*t) : .5+.5*Math.sqrt(1-(t-=2)*t); }
};
// @formatter:on
/* eslint-enable */
