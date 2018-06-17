/**
 * Static utilities for PSV
 * @namespace
 */
var PSVUtils = {};

/**
 * @summary exposes {@link PSVUtils}
 * @member {object}
 * @memberof PhotoSphereViewer
 * @readonly
 */
PhotoSphereViewer.Utils = PSVUtils;

/**
 * @summary Short-Hand for PI*2
 * @type {float}
 * @readonly
 */
PSVUtils.TwoPI = Math.PI * 2.0;

/**
 * @summary Short-Hand for PI/2
 * @type {float}
 * @readonly
 */
PSVUtils.HalfPI = Math.PI / 2.0;

/**
 * @summary Namespace for SVG creation
 * @type {string}
 * @readonly
 */
PSVUtils.svgNS = 'http://www.w3.org/2000/svg';

/**
 * @summary Checks if some three.js components are loaded
 * @param {...string} components
 * @returns {boolean}
 */
PSVUtils.checkTHREE = function(components) {
  for (var i = 0, l = arguments.length; i < l; i++) {
    if (!(arguments[i] in THREE)) {
      return false;
    }
  }

  return true;
};

/**
 * @summary Detects if canvas is supported
 * @returns {boolean}
 */
PSVUtils.isCanvasSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
};

/**
 * @summary Tries to return a canvas webgl context
 * @returns {WebGLRenderingContext}
 */
PSVUtils.getWebGLCtx = function() {
  var canvas = document.createElement('canvas');
  var names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
  var context = null;

  if (!canvas.getContext) {
    return null;
  }

  if (names.some(function(name) {
      try {
        context = canvas.getContext(name);
        return (context && typeof context.getParameter === 'function');
      } catch (e) {
        return false;
      }
    })) {
    return context;
  }
  else {
    return null;
  }
};

/**
 * @summary Detects if WebGL is supported
 * @returns {boolean}
 */
PSVUtils.isWebGLSupported = function() {
  return !!window.WebGLRenderingContext && PSVUtils.getWebGLCtx() !== null;
};

/**
 * @summary Detects if device orientation is supported
 * @description We can only be sure device orientation is supported once received an event with coherent data
 * @returns {Promise}
 */
PSVUtils.isDeviceOrientationSupported = function() {
  var defer = D();

  if ('DeviceOrientationEvent' in window) {
    var listener = function(event) {
      if (event && event.alpha !== null && !isNaN(event.alpha)) {
        defer.resolve();
      }
      else {
        defer.reject();
      }

      window.removeEventListener('deviceorientation', listener);
    };

    window.addEventListener('deviceorientation', listener, false);

    setTimeout(function() {
      if (defer.promise.isPending()) {
        listener(null);
      }
    }, 2000);
  }
  else {
    defer.reject();
  }

  return defer.promise;
};

/**
 * @summary Detects if the user is using a touch screen
 * @returns {Promise}
 */
PSVUtils.isTouchEnabled = function() {
  var defer = D();

  var listener = function(e) {
    if (e) {
      defer.resolve();
    }
    else {
      defer.reject();
    }

    window.removeEventListener('touchstart', listener);
  };

  window.addEventListener('touchstart', listener, false);

  setTimeout(function() {
    if (defer.promise.isPending()) {
      listener(null);
    }
  }, 10000); // this is totally arbitrary

  return defer.promise;
};

/**
 * @summary Gets max texture width in WebGL context
 * @returns {int}
 */
PSVUtils.getMaxTextureWidth = function() {
  var ctx = PSVUtils.getWebGLCtx();
  if (ctx !== null) {
    return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
  }
  else {
    return 0;
  }
};

/**
 * @summary Toggles a CSS class
 * @param {HTMLElement|SVGElement} element
 * @param {string} className
 * @param {boolean} [active] - forced state
 */
PSVUtils.toggleClass = function(element, className, active) {
  // manual implementation for IE11 and SVGElement
  if (!element.classList) {
    var currentClassName = element.getAttribute('class') || '';
    var currentActive = currentClassName.indexOf(className) !== -1;
    var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)');

    if ((active === undefined || active) && !currentActive) {
      currentClassName += currentClassName.length > 0 ? ' ' + className : className;
    }
    else if (!active) {
      currentClassName = currentClassName.replace(regex, ' ');
    }

    element.setAttribute('class', currentClassName);
  }
  else {
    if (active === undefined) {
      element.classList.toggle(className);
    }
    else if (active && !element.classList.contains(className)) {
      element.classList.add(className);
    }
    else if (!active) {
      element.classList.remove(className);
    }
  }
};

/**
 * @summary Adds one or several CSS classes to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
PSVUtils.addClasses = function(element, className) {
  if (!className) {
    return;
  }
  className.split(' ').forEach(function(name) {
    PSVUtils.toggleClass(element, name, true);
  });
};

/**
 * @summary Removes one or several CSS classes to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
PSVUtils.removeClasses = function(element, className) {
  if (!className) {
    return;
  }
  className.split(' ').forEach(function(name) {
    PSVUtils.toggleClass(element, name, false);
  });
};

/**
 * @summary Searches if an element has a particular parent at any level including itself
 * @param {HTMLElement} el
 * @param {HTMLElement} parent
 * @returns {boolean}
 */
PSVUtils.hasParent = function(el, parent) {
  do {
    if (el === parent) {
      return true;
    }
  } while (!!(el = el.parentNode));

  return false;
};

/**
 * @summary Gets the closest parent (can by itself)
 * @param {HTMLElement} el (HTMLElement)
 * @param {string} selector
 * @returns {HTMLElement}
 */
PSVUtils.getClosest = function(el, selector) {
  var matches = el.matches || el.msMatchesSelector;

  do {
    if (matches.bind(el)(selector)) {
      return el;
    }
  } while (!!(el = el.parentElement));

  return null;
};

/**
 * @summary Gets the event name for mouse wheel
 * @returns {string}
 */
PSVUtils.mouseWheelEvent = function() {
  return 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"
    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
      'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
};

/**
 * @summary  Gets the event name for fullscreen
 * @returns {string}
 */
PSVUtils.fullscreenEvent = function() {
  var map = {
    'exitFullscreen': 'fullscreenchange',
    'webkitExitFullscreen': 'webkitfullscreenchange',
    'mozCancelFullScreen': 'mozfullscreenchange',
    'msExitFullscreen': 'MSFullscreenChange'
  };

  for (var exit in map) {
    if (map.hasOwnProperty(exit) && exit in document) {
      return map[exit];
    }
  }

  return null;
};

/**
 * @summary Ensures that a number is in a given interval
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
PSVUtils.bound = function(x, min, max) {
  return Math.max(min, Math.min(max, x));
};

/**
 * @summary Checks if a value is an integer
 * @function
 * @param {*} value
 * @returns {boolean}
 */
PSVUtils.isInteger = Number.isInteger || function(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };

/**
 * @summary Computes the sum of an array
 * @param {number[]} array
 * @returns {number}
 */
PSVUtils.sum = function(array) {
  return array.reduce(function(a, b) {
    return a + b;
  }, 0);
};

/**
 * @summary Transforms a string to dash-case
 * {@link https://github.com/shahata/dasherize}
 * @param {string} str
 * @returns {string}
 */
PSVUtils.dasherize = function(str) {
  return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, function(s, i) {
    return (i > 0 ? '-' : '') + s.toLowerCase();
  });
};

/**
 * @summary Returns the value of a given attribute in the panorama metadata
 * @param {string} data
 * @param {string} attr
 * @returns (string)
 */
PSVUtils.getXMPValue = function(data, attr) {
  var result;
  // XMP data are stored in children
  if ((result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>')) !== null) {
    return result[1];
  }
  // XMP data are stored in attributes
  else if ((result = data.match('GPano:' + attr + '="(.*?)"')) !== null) {
    return result[1];
  }
  else {
    return null;
  }
};

/**
 * @summary Detects if fullscreen is enabled
 * @param {HTMLElement} elt
 * @returns {boolean}
 */
PSVUtils.isFullscreenEnabled = function(elt) {
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) === elt;
};

/**
 * @summary Enters fullscreen mode
 * @param {HTMLElement} elt
 */
PSVUtils.requestFullscreen = function(elt) {
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
};

/**
 * @summary Exits fullscreen mode
 */
PSVUtils.exitFullscreen = function() {
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
};

/**
 * @summary Gets an element style
 * @param {HTMLElement} elt
 * @param {string} prop
 * @returns {*}
 */
PSVUtils.getStyle = function(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
};

/**
 * @summary Compute the shortest offset between two longitudes
 * @param {float} from
 * @param {float} to
 * @returns {float}
 */
PSVUtils.getShortestArc = function(from, to) {
  var tCandidates = [
    0, // direct
    PSVUtils.TwoPI, // clock-wise cross zero
    -PSVUtils.TwoPI // counter-clock-wise cross zero
  ];

  return tCandidates.reduce(function(value, candidate) {
    candidate = to - from + candidate;
    return Math.abs(candidate) < Math.abs(value) ? candidate : value;
  }, Infinity);
};

/**
 * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @description The implementation is as close as possible to the "background-position" specification
 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
 * @param {string} value
 * @returns {{top: float, left: float}}
 */
PSVUtils.parsePosition = function(value) {
  if (!value) {
    return { top: 0.5, left: 0.5 };
  }

  if (typeof value === 'object') {
    return value;
  }

  var tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

  if (tokens.length === 1) {
    if (PSVUtils.parsePosition.positions[tokens[0]] !== undefined) {
      tokens = [tokens[0], 'center'];
    }
    else {
      tokens = [tokens[0], tokens[0]];
    }
  }

  var xFirst = tokens[1] !== 'left' && tokens[1] !== 'right' && tokens[0] !== 'top' && tokens[0] !== 'bottom';

  tokens = tokens.map(function(token) {
    return PSVUtils.parsePosition.positions[token] || token;
  });

  if (!xFirst) {
    tokens.reverse();
  }

  var parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

  if (parsed) {
    return {
      left: parsed[1] / 100,
      top: parsed[2] / 100
    };
  }
  else {
    return { top: 0.5, left: 0.5 };
  }
};

PSVUtils.parsePosition.positions = { 'top': '0%', 'bottom': '100%', 'left': '0%', 'right': '100%', 'center': '50%' };

/**
 * @summary Parses an speed
 * @param {string} speed - The speed, in radians/degrees/revolutions per second/minute
 * @returns {float} radians per second
 * @throws {PSVError} when the speed cannot be parsed
 */
PSVUtils.parseSpeed = function(speed) {
  if (typeof speed === 'string') {
    speed = speed.toString().trim();

    // Speed extraction
    var speed_value = parseFloat(speed.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
    var speed_unit = speed.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

    // "per minute" -> "per second"
    if (speed_unit.match(/(pm|per minute)$/)) {
      speed_value /= 60;
    }

    // Which unit?
    switch (speed_unit) {
      // Degrees per minute / second
      case 'dpm':
      case 'degrees per minute':
      case 'dps':
      case 'degrees per second':
        speed = THREE.Math.degToRad(speed_value);
        break;

      // Radians per minute / second
      case 'radians per minute':
      case 'radians per second':
        speed = speed_value;
        break;

      // Revolutions per minute / second
      case 'rpm':
      case 'revolutions per minute':
      case 'rps':
      case 'revolutions per second':
        speed = speed_value * PSVUtils.TwoPI;
        break;

      // Unknown unit
      default:
        throw new PSVError('unknown speed unit "' + speed_unit + '"');
    }
  }

  return speed;
};

/**
 * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
 * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
 * @param {boolean} [zeroCenter=false] - normalize between -Pi/2 - Pi/2 instead of 0 - 2*Pi
 * @returns {float}
 * @throws {PSVError} when the angle cannot be parsed
 */
PSVUtils.parseAngle = function(angle, zeroCenter) {
  if (typeof angle === 'string') {
    var match = angle.toLowerCase().trim().match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

    if (!match) {
      throw new PSVError('unknown angle "' + angle + '"');
    }

    var value = parseFloat(match[1]);
    var unit = match[2];

    if (unit) {
      switch (unit) {
        case 'deg':
        case 'degs':
          angle = THREE.Math.degToRad(value);
          break;
        case 'rad':
        case 'rads':
          angle = value;
          break;
        default:
          throw new PSVError('unknown angle unit "' + unit + '"');
      }
    }
    else {
      angle = value;
    }
  }

  angle = (zeroCenter ? angle + Math.PI : angle) % PSVUtils.TwoPI;

  if (angle < 0) {
    angle = PSVUtils.TwoPI + angle;
  }

  return zeroCenter ? PSVUtils.bound(angle - Math.PI, -PSVUtils.HalfPI, PSVUtils.HalfPI) : angle;
};

/**
 * @summary Removes all children of a three.js scene and dispose all textures
 * @param {THREE.Scene} scene
 */
PSVUtils.cleanTHREEScene = function(scene) {
  scene.children.forEach(function(item) {
    if (item instanceof THREE.Mesh) {
      if (item.geometry) {
        item.geometry.dispose();
        item.geometry = null;
      }

      if (item.material) {
        if (item.material.materials) {
          item.material.materials.forEach(function(material) {
            if (material.map) {
              material.map.dispose();
              material.map = null;
            }

            material.dispose();
          });

          item.material.materials.length = 0;
        }
        else {
          if (item.material.map) {
            item.material.map.dispose();
            item.material.map = null;
          }

          item.material.dispose();
        }

        item.material = null;
      }
    }
  });
  scene.children.length = 0;
};

/**
 * @callback AnimationOnTick
 * @memberOf PSVUtils
 * @param {Object} properties - current values
 * @param {float} progress - 0 to 1
 */

/**
 * @summary Interpolates each property with an easing and optional delay
 * @param {Object} options
 * @param {Object[]} options.properties
 * @param {number} options.properties[].start
 * @param {number} options.properties[].end
 * @param {int} options.duration
 * @param {int} [options.delay=0]
 * @param {string} [options.easing='linear']
 * @param {AnimationOnTick} options.onTick - called on each frame
 * @returns {Promise} Promise with an additional "cancel" method
 */
PSVUtils.animation = function(options) {
  var defer = D(false); // alwaysAsync = false to allow immediate resolution of "cancel"
  var start = null;

  if (!options.easing || typeof options.easing === 'string') {
    options.easing = PSVUtils.animation.easings[options.easing || 'linear'];
  }

  function run(timestamp) {
    // the animation has been cancelled
    if (defer.promise.getStatus() === -1) {
      return;
    }

    // first iteration
    if (start === null) {
      start = timestamp;
    }

    // compute progress
    var progress = (timestamp - start) / options.duration;
    var current = {};
    var name;

    if (progress < 1.0) {
      // interpolate properties
      for (name in options.properties) {
        current[name] = options.properties[name].start + (options.properties[name].end - options.properties[name].start) * options.easing(progress);
      }

      options.onTick(current, progress);

      window.requestAnimationFrame(run);
    }
    else {
      // call onTick one last time with final values
      for (name in options.properties) {
        current[name] = options.properties[name].end;
      }

      options.onTick(current, 1.0);

      window.requestAnimationFrame(function() {
        defer.resolve();
      });
    }
  }

  if (options.delay !== undefined) {
    window.setTimeout(function() {
      window.requestAnimationFrame(run);
    }, options.delay);
  }
  else {
    window.requestAnimationFrame(run);
  }

  // add a "cancel" to the promise
  var promise = defer.promise;
  promise.cancel = function() {
    defer.reject();
  };
  return promise;
};

/**
 * @summary Collection of easing functions
 * {@link https://gist.github.com/frederickk/6165768}
 * @type {Object.<string, Function>}
 */
// @formatter:off
// jscs:disable
/* jshint ignore:start */
PSVUtils.animation.easings = {
  linear: function(t) { return t; },

  inQuad: function(t) { return t*t; },
  outQuad: function(t) { return t*(2-t); },
  inOutQuad: function(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },

  inCubic: function(t) { return t*t*t; },
  outCubic: function(t) { return (--t)*t*t+1; },
  inOutCubic: function(t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

  inQuart: function(t) { return t*t*t*t; },
  outQuart: function(t) { return 1-(--t)*t*t*t; },
  inOutQuart: function(t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },

  inQuint: function(t) { return t*t*t*t*t; },
  outQuint: function(t) { return 1+(--t)*t*t*t*t; },
  inOutQuint: function(t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; },

  inSine: function(t) { return 1-Math.cos(t*(Math.PI/2)); },
  outSine: function(t) { return Math.sin(t*(Math.PI/2)); },
  inOutSine: function(t) { return .5-.5*Math.cos(Math.PI*t); },

  inExpo: function(t) { return Math.pow(2, 10*(t-1)); },
  outExpo: function(t) { return 1-Math.pow(2, -10*t); },
  inOutExpo: function(t) { t=t*2-1; return t<0 ? .5*Math.pow(2, 10*t) : 1-.5*Math.pow(2, -10*t); },

  inCirc: function(t) { return 1-Math.sqrt(1-t*t); },
  outCirc: function(t) { t--; return Math.sqrt(1-t*t); },
  inOutCirc: function(t) { t*=2; return t<1 ? .5-.5*Math.sqrt(1-t*t) : .5+.5*Math.sqrt(1-(t-=2)*t); }
};
/* jshint ignore:end */
// jscs:enable
// @formatter:off

/**
 * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
 * @param {Function} func
 * @param {int} wait
 * @returns {Function}
 */
PSVUtils.throttle = function(func, wait) {
  var self, args, result;
  var timeout = null;
  var previous = 0;
  var later = function() {
    previous = Date.now();
    timeout = null;
    result = func.apply(self, args);
    if (!timeout) {
      self = args = null;
    }
  };
  return function() {
    var now = Date.now();
    if (!previous) {
      previous = now;
    }
    var remaining = wait - (now - previous);
    self = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
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
};

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
PSVUtils.isPlainObject = function(obj) {
  // Basic check for Type object that's not null
  if (typeof obj === 'object' && obj !== null) {
    // If Object.getPrototypeOf supported, use it
    if (typeof Object.getPrototypeOf === 'function') {
      var proto = Object.getPrototypeOf(obj);
      return proto === Object.prototype || proto === null;
    }

    // Otherwise, use internal class
    // This should be reliable as if getPrototypeOf not supported, is pre-ES5
    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  // Not an object
  return false;
};

/**
 * @summary Merges the enumerable attributes of two objects
 * @description Replaces arrays and alters the target object.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>
 * @param {Object} target
 * @param {Object} src
 * @returns {Object} target
 */
PSVUtils.deepmerge = function(target, src) {
  var first = src;

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
        if (typeof src[key] !== 'object' || !src[key] || !PSVUtils.isPlainObject(src[key])) {
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
};

/**
 * @summary Clones an object
 * @param {Object} src
 * @returns {Object}
 */
PSVUtils.clone = function(src) {
  return PSVUtils.deepmerge(null, src);
};

/**
 * @summary Normalize mousewheel values accross browsers
 * @description From Facebook's Fixed Data Table
 * {@link https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js}
 * @copyright Facebook
 * @param {MouseWheelEvent} event
 * @returns {{spinX: number, spinY: number, pixelX: number, pixelY: number}}
 */
PSVUtils.normalizeWheel = function(event) {
  var PIXEL_STEP  = 10;
  var LINE_HEIGHT = 40;
  var PAGE_HEIGHT = 800;

  var sX = 0, sY = 0; // spinX, spinY
  var pX = 0, pY = 0; // pixelX, pixelY

  // Legacy
  if ('detail'      in event) { sY = event.detail; }
  if ('wheelDelta'  in event) { sY = -event.wheelDelta / 120; }
  if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 120; }
  if ('wheelDeltaX' in event) { sX = -event.wheelDeltaX / 120; }

  // side scrolling on FF with DOMMouseScroll
  if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
    sX = sY;
    sY = 0;
  }

  pX = sX * PIXEL_STEP;
  pY = sY * PIXEL_STEP;

  if ('deltaY' in event) { pY = event.deltaY; }
  if ('deltaX' in event) { pX = event.deltaX; }

  if ((pX || pY) && event.deltaMode) {
    if (event.deltaMode === 1) { // delta in LINE units
      pX *= LINE_HEIGHT;
      pY *= LINE_HEIGHT;
    }
    else {                      // delta in PAGE units
      pX *= PAGE_HEIGHT;
      pY *= PAGE_HEIGHT;
    }
  }

  // Fall-back if spin cannot be determined
  if (pX && !sX) { sX = (pX < 1) ? -1 : 1; }
  if (pY && !sY) { sY = (pY < 1) ? -1 : 1; }

  return {
    spinX: sX,
    spinY: sY,
    pixelX: pX,
    pixelY: pY
  };
};

/**
 * @callback ForEach
 * @memberOf PSVUtils
 * @param {*} value
 * @param {string} key
 */

/**
 * Loops over enumerable properties of an object
 * @param {object} object
 * @param {ForEach} callback
 */
PSVUtils.forEach = function(object, callback) {
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      callback(object[key], key);
    }
  }
};
