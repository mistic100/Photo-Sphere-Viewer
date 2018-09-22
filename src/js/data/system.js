/**
 * @module data/system
 */

import * as THREE from 'three';

/**
 * @summary General information about the system
 * @constant
 * @property {boolean} loaded - Indicates if the system has been loaded yet
 * @property {Function} load - Loads the system if not already loaded
 * @property {Function} checkTHREE - Checks if one or more THREE modules are available
 * @property {number} pixelRatio
 * @property {boolean} isWebGLSupported
 * @property {boolean} isCanvasSupported
 * @property {number} maxTextureWidth
 * @property {string} mouseWheelEvent
 * @property {string} fullscreenEvent
 * @property {Promise<boolean>} isDeviceOrientationSupported
 * @property {Promise<boolean>} isTouchEnabled
 */
const SYSTEM = {
  loaded                      : false,
  checkTHREE                  : checkTHREE,
  pixelRatio                  : 1,
  isWebGLSupported            : false,
  isCanvasSupported           : false,
  isDeviceOrientationSupported: null,
  isTouchEnabled              : null,
  maxTextureWidth             : 0,
  mouseWheelEvent             : null,
  fullscreenEvent             : null,
};

/**
 * @summary Loads the system if not already loaded
 */
SYSTEM.load = () => {
  if (!SYSTEM.loaded) {
    SYSTEM.loaded = true;
    SYSTEM.pixelRatio = window.devicePixelRatio || 1;
    SYSTEM.isWebGLSupported = isWebGLSupported();
    SYSTEM.isCanvasSupported = isCanvasSupported();
    SYSTEM.isDeviceOrientationSupported = isDeviceOrientationSupported();
    SYSTEM.isTouchEnabled = isTouchEnabled();
    SYSTEM.maxTextureWidth = SYSTEM.isWebGLSupported ? getMaxTextureWidth() : 4096;
    SYSTEM.mouseWheelEvent = getMouseWheelEvent();
    SYSTEM.fullscreenEvent = getFullscreenEvent();
  }
};

/**
 * @summary Checks if some three.js components are loaded
 * @param {...string} components
 * @returns {boolean}
 * @private
 */
function checkTHREE(...components) {
  return !components.some(component => !(component in THREE));
}

/**
 * @summary Detects if canvas is supported
 * @returns {boolean}
 * @private
 */
function isCanvasSupported() {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

/**
 * @summary Tries to return a canvas webgl context
 * @returns {WebGLRenderingContext}
 * @private
 */
function getWebGLCtx() {
  const canvas = document.createElement('canvas');
  const names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
  let context = null;

  if (!canvas.getContext) {
    return null;
  }

  if (names.some((name) => {
    try {
      context = canvas.getContext(name);
      return true;
    }
    catch (e) {
      return false;
    }
  })) {
    return context;
  }
  else {
    return null;
  }
}

/**
 * @summary Detects if WebGL is supported
 * @returns {boolean}
 * @private
 */
function isWebGLSupported() {
  return 'WebGLRenderingContext' in window && getWebGLCtx() !== null;
}

/**
 * @summary Detects if device orientation is supported
 * @description We can only be sure device orientation is supported once received an event with coherent data
 * @returns {Promise<boolean>}
 * @private
 */
function isDeviceOrientationSupported() {
  return new Promise((resolve) => {
    if ('DeviceOrientationEvent' in window) {
      const listener = (e) => {
        /* eslint-disable-next-line no-restricted-globals */
        if (e && e.alpha !== null && !isNaN(e.alpha)) {
          resolve(true);
        }
        else {
          resolve(false);
        }

        window.removeEventListener('deviceorientation', listener);
      };

      window.addEventListener('deviceorientation', listener, false);

      // after 2 secs, auto-reject the promise
      setTimeout(listener, 2000);
    }
    else {
      resolve(false);
    }
  });
}

/**
 * @summary Detects if the user is using a touch screen
 * @returns {Promise<boolean>}
 * @private
 */
function isTouchEnabled() {
  return new Promise((resolve) => {
    const listener = (e) => {
      if (e) {
        resolve(true);
      }
      else {
        resolve(false);
      }

      window.removeEventListener('touchstart', listener);
    };

    window.addEventListener('touchstart', listener, false);

    // after 10 secs auto-reject the promise
    setTimeout(listener, 10000);
  });
}

/**
 * @summary Gets max texture width in WebGL context
 * @returns {number}
 * @private
 */
function getMaxTextureWidth() {
  const ctx = getWebGLCtx();
  if (ctx !== null) {
    return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
  }
  else {
    return 0;
  }
}

/**
 * @summary Gets the event name for mouse wheel
 * @returns {string}
 * @private
 */
function getMouseWheelEvent() {
  if ('onwheel' in document.createElement('div')) { // Modern browsers support "wheel"
    return 'wheel';
  }
  else if (document.onmousewheel !== undefined) { // Webkit and IE support at least "mousewheel"
    return 'mousewheel';
  }
  else { // let's assume that remaining browsers are older Firefox
    return 'DOMMouseScroll';
  }
}

/**
 * @summary Map between fullsceen method and fullscreen event name
 * @type {Object<string, string>}
 * @readonly
 * @private
 */
const FULLSCREEN_EVT_MAP = {
  exitFullscreen      : 'fullscreenchange',
  webkitExitFullscreen: 'webkitfullscreenchange',
  mozCancelFullScreen : 'mozfullscreenchange',
  msExitFullscreen    : 'MSFullscreenChange',
};


/**
 * @summary  Gets the event name for fullscreen
 * @returns {string}
 * @private
 */
function getFullscreenEvent() {
  const validExits = Object.keys(FULLSCREEN_EVT_MAP).filter(exit => exit in document);

  if (validExits.length) {
    return FULLSCREEN_EVT_MAP[validExits[0]];
  }
  else {
    return null;
  }
}

export { SYSTEM };
