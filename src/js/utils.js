/**
 * @module utils
 */

import * as THREE from 'three';
import { PSVError } from './PSVError';

/**
 * @summary Toggles a CSS class
 * @param {HTMLElement|SVGElement} element
 * @param {string} className
 * @param {boolean} [active] - forced state
 */
export function toggleClass(element, className, active) {
  // manual implementation for IE11 and SVGElement
  if (!element.classList) {
    let currentClassName = element.getAttribute('class') || '';
    const currentActive = currentClassName.indexOf(className) !== -1;
    const regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)');

    if ((active === undefined || active) && !currentActive) {
      currentClassName += currentClassName.length > 0 ? ' ' + className : className;
    }
    else if (!active) {
      currentClassName = currentClassName.replace(regex, ' ');
    }

    element.setAttribute('class', currentClassName);
  }
  else if (active === undefined) {
    element.classList.toggle(className);
  }
  else if (active && !element.classList.contains(className)) {
    element.classList.add(className);
  }
  else if (!active) {
    element.classList.remove(className);
  }
}

/**
 * @summary Adds one or several CSS classes to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
export function addClasses(element, className) {
  if (className) {
    className.split(' ').forEach((name) => {
      toggleClass(element, name, true);
    });
  }
}

/**
 * @summary Removes one or several CSS classes to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
export function removeClasses(element, className) {
  if (className) {
    className.split(' ').forEach((name) => {
      toggleClass(element, name, false);
    });
  }
}

/**
 * @summary Searches if an element has a particular parent at any level including itself
 * @param {HTMLElement} el
 * @param {HTMLElement} parent
 * @returns {boolean}
 */
export function hasParent(el, parent) {
  let test = el;

  do {
    if (test === parent) {
      return true;
    }
    test = test.parentNode;
  } while (test);

  return false;
}

/**
 * @summary Gets the closest parent (can by itself)
 * @param {HTMLElement|SVGElement} el
 * @param {string} selector
 * @returns {HTMLElement}
 */
export function getClosest(el, selector) {
  const matches = el.matches || el.msMatchesSelector;
  let test = el;

  do {
    if (matches.bind(test)(selector)) {
      return test;
    }
    test = test instanceof SVGElement ? test.parentNode : test.parentElement;
  } while (test);

  return null;
}

/**
 * @summary Map between keyboard events `keyCode|which` and `key`
 * @type {Object<int, string>}
 * @readonly
 * @private
 */
const KEYMAP = {
  13 : 'Enter',
  27 : 'Escape',
  32 : ' ',
  33 : 'PageUp',
  34 : 'PageDown',
  37 : 'ArrowLeft',
  38 : 'ArrowUp',
  39 : 'ArrowRight',
  40 : 'ArrowDown',
  46 : 'Delete',
  107: '+',
  109: '-',
};

/**
 * @summary Map for non standard keyboard events `key` for IE and Edge
 * @see https://github.com/shvaikalesh/shim-keyboard-event-key
 * @type {Object<string, string>}
 * @readonly
 * @private
 */
const MS_KEYMAP = {
  Add     : '+',
  Del     : 'Delete',
  Down    : 'ArrowDown',
  Esc     : 'Escape',
  Left    : 'ArrowLeft',
  Right   : 'ArrowRight',
  Spacebar: ' ',
  Subtract: '-',
  Up      : 'ArrowUp',
};

/**
 * @summary Returns the key name of a KeyboardEvent
 * @param {KeyboardEvent} evt
 * @returns {string}
 */
export function getEventKey(evt) {
  let key = evt.key || KEYMAP[evt.keyCode || evt.which];

  if (key && MS_KEYMAP[key]) {
    key = MS_KEYMAP[key];
  }

  return key;
}

/**
 * @summary Ensures that a number is in a given interval
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function bound(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

/**
 * @summary Checks if a value is an integer
 * @function
 * @param {*} value
 * @returns {boolean}
 */
export function isInteger(value) {
  if (Number.isInteger) {
    return Number.isInteger(value);
  }
  return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value;
}


/**
 * @summary Computes the sum of an array
 * @param {number[]} array
 * @returns {number}
 */
export function sum(array) {
  return array.reduce((a, b) => a + b, 0);
}

/**
 * @summary Computes the distance between two points
 * @param {PhotoSphereViewer.Point} p1
 * @param {PhotoSphereViewer.Point} p2
 * @returns {number}
 */
export function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * @summary Transforms a string to dash-case
 * {@link https://github.com/shahata/dasherize}
 * @param {string} str
 * @returns {string}
 */
export function dasherize(str) {
  return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, (s, i) => {
    return (i > 0 ? '-' : '') + s.toLowerCase();
  });
}

/**
 * @summary Returns the value of a given attribute in the panorama metadata
 * @param {string} data
 * @param {string} attr
 * @returns (string)
 */
export function getXMPValue(data, attr) {
  // XMP data are stored in children
  let result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>');
  if (result !== null) {
    return result[1];
  }

  // XMP data are stored in attributes
  result = data.match('GPano:' + attr + '="(.*?)"');
  if (result !== null) {
    return result[1];
  }

  return null;
}

/**
 * @summary Detects if fullscreen is enabled
 * @param {HTMLElement} elt
 * @returns {boolean}
 */
export function isFullscreenEnabled(elt) {
  /* eslint-disable-next-line max-len */
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) === elt;
}

/**
 * @summary Enters fullscreen mode
 * @param {HTMLElement} elt
 */
export function requestFullscreen(elt) {
  /* eslint-disable-next-line max-len */
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
}

/**
 * @summary Exits fullscreen mode
 */
export function exitFullscreen() {
  /* eslint-disable-next-line max-len */
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
}

/**
 * @summary Gets an element style
 * @param {HTMLElement} elt
 * @param {string} prop
 * @returns {*}
 */
export function getStyle(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
}

/**
 * @summary Compute the shortest offset between two longitudes
 * @param {number} from
 * @param {number} to
 * @returns {number}
 */
export function getShortestArc(from, to) {
  const tCandidates = [
    0, // direct
    Math.PI * 2, // clock-wise cross zero
    -Math.PI * 2, // counter-clock-wise cross zero
  ];

  return tCandidates.reduce((value, candidate) => {
    const newCandidate = to - from + candidate;
    return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
  }, Infinity);
}

/**
 * @summary Computes the angle between the current position and a target position
 * @param {PhotoSphereViewer.Position} position1
 * @param {PhotoSphereViewer.Position} position2
 * @returns {number}
 */
export function getAngle(position1, position2) {
  return Math.acos(
    Math.cos(position1.latitude)
    * Math.cos(position2.latitude)
    * Math.cos(position1.longitude - position2.longitude)
    + Math.sin(position1.latitude)
    * Math.sin(position2.latitude)
  );
}

const CSS_POSITIONS = {
  top   : '0%',
  bottom: '100%',
  left  : '0%',
  right : '100%',
  center: '50%',
};

/**
 * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @description The implementation is as close as possible to the "background-position" specification
 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
 * @param {string|object} value
 * @returns {PhotoSphereViewer.Point}
 */
export function parsePosition(value) {
  if (!value) {
    return { x: 0.5, y: 0.5 };
  }

  if (typeof value === 'object') {
    return value;
  }

  let tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

  if (tokens.length === 1) {
    if (CSS_POSITIONS[tokens[0]] !== undefined) {
      tokens = [tokens[0], 'center'];
    }
    else {
      tokens = [tokens[0], tokens[0]];
    }
  }

  const xFirst = tokens[1] !== 'left' && tokens[1] !== 'right' && tokens[0] !== 'top' && tokens[0] !== 'bottom';

  tokens = tokens.map(token => CSS_POSITIONS[token] || token);

  if (!xFirst) {
    tokens.reverse();
  }

  const parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

  if (parsed) {
    return {
      x: parseFloat(parsed[1]) / 100,
      y: parseFloat(parsed[2]) / 100,
    };
  }
  else {
    return { x: 0.5, y: 0.5 };
  }
}

/**
 * @summary Parses an speed
 * @param {string|number} speed - The speed, in radians/degrees/revolutions per second/minute
 * @returns {number} radians per second
 * @throws {PSVError} when the speed cannot be parsed
 */
export function parseSpeed(speed) {
  let parsed;

  if (typeof speed === 'string') {
    const speedStr = speed.toString().trim();

    // Speed extraction
    let speedValue = parseFloat(speedStr.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
    const speedUnit = speedStr.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

    // "per minute" -> "per second"
    if (speedUnit.match(/(pm|per minute)$/)) {
      speedValue /= 60;
    }

    // Which unit?
    switch (speedUnit) {
      // Degrees per minute / second
      case 'dpm':
      case 'degrees per minute':
      case 'dps':
      case 'degrees per second':
        parsed = THREE.Math.degToRad(speedValue);
        break;

      // Radians per minute / second
      case 'rdpm':
      case 'radians per minute':
      case 'rdps':
      case 'radians per second':
        parsed = speedValue;
        break;

      // Revolutions per minute / second
      case 'rpm':
      case 'revolutions per minute':
      case 'rps':
      case 'revolutions per second':
        parsed = speedValue * Math.PI * 2;
        break;

      // Unknown unit
      default:
        throw new PSVError('unknown speed unit "' + speedUnit + '"');
    }
  }
  else {
    parsed = speed;
  }

  return parsed;
}

/**
 * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
 * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
 * @param {boolean} [zeroCenter=false] - normalize between -Pi - Pi instead of 0 - 2*Pi
 * @param {boolean} [halfCircle=zeroCenter] - normalize between -Pi/2 - Pi/2 instead of -Pi - Pi
 * @returns {number}
 * @throws {PSVError} when the angle cannot be parsed
 */
export function parseAngle(angle, zeroCenter = false, halfCircle = zeroCenter) {
  let parsed;

  if (typeof angle === 'string') {
    const match = angle.toLowerCase().trim().match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

    if (!match) {
      throw new PSVError('unknown angle "' + angle + '"');
    }

    const value = parseFloat(match[1]);
    const unit = match[2];

    if (unit) {
      switch (unit) {
        case 'deg':
        case 'degs':
          parsed = THREE.Math.degToRad(value);
          break;
        case 'rad':
        case 'rads':
          parsed = value;
          break;
        default:
          throw new PSVError('unknown angle unit "' + unit + '"');
      }
    }
    else {
      parsed = value;
    }
  }
  else if (typeof angle === 'number' && !Number.isNaN(angle)) {
    parsed = angle;
  }
  else {
    throw new PSVError('unknown angle "' + angle + '"');
  }

  parsed = (zeroCenter ? parsed + Math.PI : parsed) % (Math.PI * 2);

  if (parsed < 0) {
    parsed += Math.PI * 2;
  }

  return zeroCenter ? bound(parsed - Math.PI, -Math.PI / (halfCircle ? 2 : 1), Math.PI / (halfCircle ? 2 : 1)) : parsed;
}

/**
 * @summary Calls `dispose` on all objects and textures
 * @param {external:THREE.Object3D} object
 */
export function cleanTHREEScene(object) {
  object.traverse((item) => {
    if (item.geometry) {
      item.geometry.dispose();
    }

    if (item.material) {
      if (Array.isArray(item.material)) {
        item.material.forEach((material) => {
          if (material.map) {
            material.map.dispose();
          }

          material.dispose();
        });
      }
      else {
        if (item.material.map) {
          item.material.map.dispose();
        }

        item.material.dispose();
      }
    }

    if (item.dispose) {
      item.dispose();
    }

    if (item !== object) {
      cleanTHREEScene(item);
    }
  });
}

/**
 * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function throttle(func, wait) {
  /* eslint-disable */
  let self, args, result;
  let timeout;
  let previous = 0;
  const later = function() {
    previous = Date.now();
    timeout = undefined;
    result = func.apply(self, args);
    if (!timeout) {
      self = args = null;
    }
  };
  return function() {
    const now = Date.now();
    if (!previous) {
      previous = now;
    }
    const remaining = wait - (now - previous);
    self = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      previous = now;
      result = func.apply(self, args);
      if (!timeout) {
        self = args = null;
      }
    }
    else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
  /* eslint-enable */
}

/**
 * @summary Test if an object is a plain object
 * @description Test if an object is a plain object, i.e. is constructed
 * by the built-in Object constructor and inherits directly from Object.prototype
 * or null. Some built-in objects pass the test, e.g. Math which is a plain object
 * and some host or exotic objects may pass also.
 * {@link http://stackoverflow.com/a/5878101/1207670}
 * @param {*} obj
 * @returns {boolean}
 */
export function isPlainObject(obj) {
  // Basic check for Type object that's not null
  if (typeof obj === 'object' && obj !== null) {
    // If Object.getPrototypeOf supported, use it
    if (typeof Object.getPrototypeOf === 'function') {
      const proto = Object.getPrototypeOf(obj);
      return proto === Object.prototype || proto === null;
    }

    // Otherwise, use internal class
    // This should be reliable as if getPrototypeOf not supported, is pre-ES5
    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  // Not an object
  return false;
}

/**
 * @summary Merges the enumerable attributes of two objects
 * @description Replaces arrays and alters the target object.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>
 * @param {Object} target
 * @param {Object} src
 * @returns {Object} target
 */
export function deepmerge(target, src) {
  /* eslint-disable */
  let first = src;

  return (function merge(target, src) {
    if (Array.isArray(src)) {
      if (!target || !Array.isArray(target)) {
        target = [];
      }
      else {
        target.length = 0;
      }
      src.forEach(function(e, i) {
        target[i] = merge(null, e);
      });
    }
    else if (typeof src === 'object') {
      if (!target || Array.isArray(target)) {
        target = {};
      }
      Object.keys(src).forEach(function(key) {
        if (typeof src[key] !== 'object' || !src[key] || !isPlainObject(src[key])) {
          target[key] = src[key];
        }
        else if (src[key] != first) {
          if (!target[key]) {
            target[key] = merge(null, src[key]);
          }
          else {
            merge(target[key], src[key]);
          }
        }
      });
    }
    else {
      target = src;
    }

    return target;
  }(target, src));
  /* eslint-enable */
}

/**
 * @summary Deeply clones an object
 * @param {Object} src
 * @returns {Object}
 */
export function clone(src) {
  return deepmerge(null, src);
}

/**
 * @summery Test of an object is empty
 * @param {object} obj
 * @returns {boolean}
 */
export function isEmpty(obj) {
  return !obj || (Object.keys(obj).length === 0 && obj.constructor === Object);
}

/**
 * @summary Normalize mousewheel values accross browsers
 * @description From Facebook's Fixed Data Table
 * {@link https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js}
 * @copyright Facebook
 * @param {MouseWheelEvent} event
 * @returns {{spinX: number, spinY: number, pixelX: number, pixelY: number}}
 */
export function normalizeWheel(event) {
  const PIXEL_STEP = 10;
  const LINE_HEIGHT = 40;
  const PAGE_HEIGHT = 800;

  let spinX = 0;
  let spinY = 0;
  let pixelX = 0;
  let pixelY = 0;

  // Legacy
  if ('detail' in event) {
    spinY = event.detail;
  }
  if ('wheelDelta' in event) {
    spinY = -event.wheelDelta / 120;
  }
  if ('wheelDeltaY' in event) {
    spinY = -event.wheelDeltaY / 120;
  }
  if ('wheelDeltaX' in event) {
    spinX = -event.wheelDeltaX / 120;
  }

  // side scrolling on FF with DOMMouseScroll
  if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
    spinX = spinY;
    spinY = 0;
  }

  pixelX = spinX * PIXEL_STEP;
  pixelY = spinY * PIXEL_STEP;

  if ('deltaY' in event) {
    pixelY = event.deltaY;
  }
  if ('deltaX' in event) {
    pixelX = event.deltaX;
  }

  if ((pixelX || pixelY) && event.deltaMode) {
    // delta in LINE units
    if (event.deltaMode === 1) {
      pixelX *= LINE_HEIGHT;
      pixelY *= LINE_HEIGHT;
    }
    // delta in PAGE units
    else {
      pixelX *= PAGE_HEIGHT;
      pixelY *= PAGE_HEIGHT;
    }
  }

  // Fall-back if spin cannot be determined
  if (pixelX && !spinX) {
    spinX = (pixelX < 1) ? -1 : 1;
  }
  if (pixelY && !spinY) {
    spinY = (pixelY < 1) ? -1 : 1;
  }

  return { spinX, spinY, pixelX, pixelY };
}

/**
 * @summary Loops over enumerable properties of an object
 * @param {Object} object
 * @param {Function} callback
 */
export function each(object, callback) {
  Object.keys(object).forEach((key) => {
    callback(object[key], key);
  });
}

/**
 * @summary Returns the intersection between two arrays
 * @template T
 * @param {T[]} array1
 * @param {T[]} array2
 * @returns {T[]}
 */
export function intersect(array1, array2) {
  return array1.filter(value => array2.indexOf(value) !== -1);
}

/**
 * Displays a warning in the console
 * @param {string} message
 */
export function logWarn(message) {
  console.warn(`PhotoSphereViewer: ${message}`);
}
