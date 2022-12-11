/**
 * @namespace PSV.constants
 */

/**
 * @summary Default duration of the transition between panoramas
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const DEFAULT_TRANSITION = 1500;

/**
 * @summary Minimum duration of the animations created with {@link Viewer#animate}
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const ANIMATION_MIN_DURATION = 500;

/**
 * @summary Number of pixels bellow which a mouse move will be considered as a click
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const MOVE_THRESHOLD = 4;

/**
 * @summary Delay in milliseconds between two clicks to consider a double click
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const DBLCLICK_DELAY = 300;

/**
 * @summary Delay in milliseconds to emulate a long touch
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const LONGTOUCH_DELAY = 500;

/**
 * @summary Delay in milliseconds to for the two fingers overlay to appear
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const TWOFINGERSOVERLAY_DELAY = 100;

/**
 * @summary Duration in milliseconds of the "ctrl zoom" overlay
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const CTRLZOOM_TIMEOUT = 2000;

/**
 * @summary Time size of the mouse position history used to compute inertia
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const INERTIA_WINDOW = 300;

/**
 * @summary Radius of the THREE.SphereGeometry, Half-length of the THREE.BoxGeometry
 * @memberOf PSV.constants
 * @type {number}
 * @constant
 */
export const SPHERE_RADIUS = 10;

/**
 * @summary Property name added to viewer element
 * @memberOf PSV.constants
 * @type {string}
 * @constant
 */
export const VIEWER_DATA = 'photoSphereViewer';

/**
 * @summary Property added the the main Mesh object
 * @memberOf PSV.constants
 * @type {string}
 * @constant
 */
export const MESH_USER_DATA = 'psvSphere';

/**
 * @summary Available actions
 * @memberOf PSV.constants
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
 * @summary Available events names
 * @memberOf PSV.constants
 * @enum {string}
 * @constant
 */
export const EVENTS = {
  /**
   * @event autorotate
   * @memberof PSV
   * @summary Triggered when the automatic rotation is enabled/disabled
   * @param {boolean} enabled
   */
  AUTOROTATE        : 'autorotate',
  /**
   * @event before-render
   * @memberof PSV
   * @summary Triggered before a render, used to modify the view
   * @param {number} timestamp - time provided by requestAnimationFrame
   * @param {number} elapsed - time elapsed from the previous frame
   */
  BEFORE_RENDER     : 'before-render',
  /**
   * @event before-rotate
   * @memberOf PSV
   * @summary Triggered before a rotate operation, can be cancelled
   * @param {PSV.ExtendedPosition}
   */
  BEFORE_ROTATE     : 'before-rotate',
  /**
   * @event click
   * @memberof PSV
   * @summary Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
   * @param {PSV.ClickData} data
   */
  CLICK             : 'click',
  /**
   * @event close-panel
   * @memberof PSV
   * @summary Triggered when the panel is closed
   * @param {string} [id]
   */
  CLOSE_PANEL       : 'close-panel',
  /**
   * @event config-changed
   * @memberOf PSV
   * @summary Triggered after a call to setOption/setOptions
   * @param {string[]} name of changed options
   */
  CONFIG_CHANGED    : 'config-changed',
  /**
   * @event dblclick
   * @memberof PSV
   * @summary Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`
   * @param {PSV.ClickData} data
   */
  DOUBLE_CLICK      : 'dblclick',
  /**
   * @event fullscreen-updated
   * @memberof PSV
   * @summary Triggered when the fullscreen mode is enabled/disabled
   * @param {boolean} enabled
   */
  FULLSCREEN_UPDATED: 'fullscreen-updated',
  /**
   * @event hide-notification
   * @memberof PSV
   * @summary Triggered when the notification is hidden
   * @param {string} [id]
   */
  HIDE_NOTIFICATION : 'hide-notification',
  /**
   * @event hide-overlay
   * @memberof PSV
   * @summary Triggered when the overlay is hidden
   * @param {string} [id]
   */
  HIDE_OVERLAY      : 'hide-overlay',
  /**
   * @event hide-tooltip
   * @memberof PSV
   * @summary Triggered when the tooltip is hidden
   * @param {*} Data associated to this tooltip
   */
  HIDE_TOOLTIP      : 'hide-tooltip',
  /**
   * @event key-press
   * @memberof PSV
   * @summary Triggered when a key is pressed, can be cancelled
   * @param {string} key
   */
  KEY_PRESS         : 'key-press',
  /**
   * @event load-progress
   * @memberof PSV
   * @summary Triggered when the loader value changes
   * @param {number} value from 0 to 100
   */
  LOAD_PROGRESS     : 'load-progress',
  /**
   * @event open-panel
   * @memberof PSV
   * @summary Triggered when the panel is opened
   * @param {string} [id]
   */
  OPEN_PANEL        : 'open-panel',
  /**
   * @event panorama-loaded
   * @memberof PSV
   * @summary Triggered when a panorama image has been loaded
   * @param {PSV.TextureData} textureData
   */
  PANORAMA_LOADED   : 'panorama-loaded',
  /**
   * @event position-updated
   * @memberof PSV
   * @summary Triggered when the view longitude and/or latitude changes
   * @param {PSV.Position} position
   */
  POSITION_UPDATED  : 'position-updated',
  /**
   * @event ready
   * @memberof PSV
   * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
   */
  READY             : 'ready',
  /**
   * @event render
   * @memberof PSV
   * @summary Triggered on each viewer render, **this event is triggered very often**
   */
  RENDER            : 'render',
  /**
   * @event show-notification
   * @memberof PSV
   * @summary Triggered when the notification is shown
   * @param {string} [id]
   */
  SHOW_NOTIFICATION : 'show-notification',
  /**
   * @event show-overlay
   * @memberof PSV
   * @summary Triggered when the overlay is shown
   * @param {string} [id]
   */
  SHOW_OVERLAY      : 'show-overlay',
  /**
   * @event show-tooltip
   * @memberof PSV
   * @summary Triggered when the tooltip is shown
   * @param {*} Data associated to this tooltip
   * @param {PSV.components.Tooltip} Instance of the tooltip
   */
  SHOW_TOOLTIP      : 'show-tooltip',
  /**
   * @event size-updated
   * @memberof PSV
   * @summary Triggered when the viewer size changes
   * @param {PSV.Size} size
   */
  SIZE_UPDATED      : 'size-updated',
  /**
   * @event stop-all
   * @memberof PSV
   * @summary Triggered when all current animations are stopped
   */
  STOP_ALL          : 'stop-all',
  /**
   * @event zoom-updated
   * @memberof PSV
   * @summary Triggered when the zoom level changes
   * @param {number} zoomLevel
   */
  ZOOM_UPDATED      : 'zoom-updated',
};

/**
 * @summary Available change events names
 * @memberOf PSV.constants
 * @enum {string}
 * @constant
 */
export const CHANGE_EVENTS = {
  /**
   * @event get-animate-position
   * @memberof PSV
   * @param {Position} position
   * @returns {Position}
   * @summary Called to alter the target position of an animation
   */
  GET_ANIMATE_POSITION: 'get-animate-position',
  /**
   * @event get-rotate-position
   * @memberof PSV
   * @param {Position} position
   * @returns {Position}
   * @summary Called to alter the target position of a rotation
   */
  GET_ROTATE_POSITION : 'get-rotate-position',
};

/**
 * @summary Special events emitted to listener using {@link Viewer#observeObjects}
 * @memberOf PSV.constants
 * @constant
 * @package
 */
export const OBJECT_EVENTS = {
  ENTER_OBJECT: 'enter-object',
  HOVER_OBJECT: 'hover-object',
  LEAVE_OBJECT: 'leave-object',
};

/**
 * @summary Internal identifiers for various stuff
 * @memberOf PSV.constants
 * @enum {string}
 * @constant
 */
export const IDS = {
  MENU       : 'menu',
  TWO_FINGERS: 'twoFingers',
  CTRL_ZOOM  : 'ctrlZoom',
  ERROR      : 'error',
  DESCRIPTION: 'description',
};

/* eslint-disable */
// @formatter:off
/**
 * @summary Collection of easing functions
 * @memberOf PSV.constants
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

/**
 * @summary Subset of key codes
 * @memberOf PSV.constants
 * @type {Object<string, string>}
 * @constant
 */
export const KEY_CODES = {
  Enter     : 'Enter',
  Control   : 'Control',
  Escape    : 'Escape',
  Space     : ' ',
  PageUp    : 'PageUp',
  PageDown  : 'PageDown',
  ArrowLeft : 'ArrowLeft',
  ArrowUp   : 'ArrowUp',
  ArrowRight: 'ArrowRight',
  ArrowDown : 'ArrowDown',
  Delete    : 'Delete',
  Plus      : '+',
  Minus     : '-',
};
