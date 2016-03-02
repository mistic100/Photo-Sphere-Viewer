/**
 * Static utilities for PSV
 */
var PSVUtils = {};

/**
 * Check if some Three.js components are loaded
 * @param components (String...)
 * @returns (boolean)
 */
PSVUtils.checkTHREE = function(/* components */) {
  for (var i = 0, l = arguments.length; i < l; i++) {
    if (!(arguments[i] in THREE)) {
      return false;
    }
  }

  return true;
};

/**
 * Detects whether canvas is supported
 * @return (boolean) true if canvas is supported, false otherwise
 */
PSVUtils.isCanvasSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
};

/**
 * Tries to return a canvas webgl context
 * @return (ctx) if canvas is supported, undefined otherwise
 */
PSVUtils.getWebGLCtx = function() {
  var canvas = document.createElement('canvas'),
  names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'],
  context;

  names.some(function(name) {
    try {
      context = canvas.getContext(name);
      return (context && typeof context.getParameter == 'function');
    } catch (e) {
      return false;
    }
  });

  return context;
};

/**
 * Detects whether WebGL is supported
 * @return (boolean) true if WebGL is supported, false otherwise
 */
PSVUtils.isWebGLSupported = function() {
  if (!!window.WebGLRenderingContext) {
    return PSVUtils.getWebGLCtx() !== undefined;
  }
  // WebGL not supported
  return false;
};

/**
 * Get max texture width in WebGL context
 * @return (int)
 */
PSVUtils.getMaxTextureWidth = function() {
  var ctx = PSVUtils.getWebGLCtx();
  return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
};

/**
 * Search if an element has a particular, at any level including itself
 * @param el (HTMLElement)
 * @param parent (HTMLElement)
 * @return (Boolean)
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
 * Get closest parent (can by itself)
 * @param el (HTMLElement)
 * @param selector (String)
 * @return (HTMLElement)
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
 * Get the event name for mouse wheel
 * @return (string)
 */
PSVUtils.mouseWheelEvent = function() {
  return 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"
    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
      'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
};

/**
 * Get the event name for fullscreen event
 * @return (string)
 */
PSVUtils.fullscreenEvent = function() {
  var map = {
    'exitFullscreen': 'fullscreenchange',
    'webkitExitFullscreen': 'webkitfullscreenchange',
    'mozCancelFullScreen': 'mozfullscreenchange',
    'msExitFullscreen': 'msFullscreenEnabled'
  };

  for (var exit in map) {
    if (exit in document) return map[exit];
  }

  return 'fullscreenchange';
};

/**
 * Ensures that a number is in a given interval
 * @param x (number) The number to check
 * @param min (number) First endpoint
 * @param max (number) Second endpoint
 * @return (number) The checked number
 */
PSVUtils.stayBetween = function(x, min, max) {
  return Math.max(min, Math.min(max, x));
};

/**
 * Returns the value of a given attribute in the panorama metadata
 * @param data (string) The panorama metadata
 * @param attr (string) The wanted attribute
 * @return (string) The value of the attribute
 */
PSVUtils.getXMPValue = function(data, attr) {
  var a, b;
  // XMP data are stored in children
  if ((a = data.indexOf('<GPano:' + attr + '>')) !== -1 && (b = data.indexOf('</GPano:' + attr + '>')) !== -1) {
    return data.substring(a, b).replace('<GPano:' + attr + '>', '');
  }
  // XMP data are stored in attributes
  else if ((a = data.indexOf('GPano:' + attr)) !== -1 && (b = data.indexOf('"', a + attr.length + 8)) !== -1) {
    return data.substring(a + attr.length + 8, b);
  }
  else {
    return null;
  }
};

/**
 * Detects whether fullscreen is enabled or not
 * @return (boolean) true if fullscreen is enabled, false otherwise
 */
PSVUtils.isFullscreenEnabled = function() {
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
};

/**
 * Enters fullscreen mode
 * @param elt (HTMLElement)
 */
PSVUtils.requestFullscreen = function(elt) {
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
};

/**
 * Exits fullscreen mode
 * @param elt (HTMLElement)
 */
PSVUtils.exitFullscreen = function(elt) {
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
};

/**
 * Gets an element style
 * @param elt (HTMLElement)
 * @param prop (string)
 * @return mixed
 */
PSVUtils.getStyle = function(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
};

/**
 * Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @param value (String)
 * @return Object
 */
PSVUtils.parsePosition = function(value) {
  if (!value) {
    return { top: 0.5, left: 0.5 };
  }

  if (typeof value === 'object') {
    return value;
  }

  var e = document.createElement('div');
  document.body.appendChild(e);
  e.style.backgroundPosition = value;
  var parsed = PSVUtils.getStyle(e, 'background-position').match(/^([0-9.]+)% ([0-9.]+)%$/);
  document.body.removeChild(e);

  return {
    left: parsed[1] / 100,
    top: parsed[2] / 100
  };
};

/**
 * Utility for animations
 * @param options (Object)
 *    - properties ({name: {end: number, start: number}})
 *    - duration (int)
 *    - delay (int, optional)
 *    - easing (string|function, optional)
 *    - onTick (function(properties))
 *    - onCancel (function)
 * @returns (D.promise) with an additional "cancel" method
 */
PSVUtils.animation = function(options) {
  var defer = D();
  var start = null;

  if (!options.easing || typeof options.easing == 'string') {
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

      defer.resolve();
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
    if (options.onCancel) {
      options.onCancel();
      defer.reject(defer);
    }
  };
  return promise;
};

/**
 * Collection of easing functions
 * https://gist.github.com/frederickk/6165768
 */
// @formatter:off
// jscs:disable
/* jshint ignore:start */
PSVUtils.animation.easings = {
  // no easing, no acceleration
  linear: function(t) { return t; },

  // accelerating from zero velocity
  inQuad: function(t) { return t*t; },
  // decelerating to zero velocity
  outQuad: function(t) { return t*(2-t); },
  // acceleration until halfway, then deceleration
  inOutQuad: function(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },

  // accelerating from zero velocity
  inCubic: function(t) { return t*t*t; },
  // decelerating to zero velocity
  outCubic: function(t) { return (--t)*t*t+1; },
  // acceleration until halfway, then deceleration
  inOutCubic: function(t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

  // accelerating from zero velocity
  inQuart: function(t) { return t*t*t*t; },
  // decelerating to zero velocity
  outQuart: function(t) { return 1-(--t)*t*t*t; },
  // acceleration until halfway, then deceleration
  inOutQuart: function(t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },

  // accelerating from zero velocity
  inQuint: function(t) { return t*t*t*t*t; },
  // decelerating to zero velocity
  outQuint: function(t) { return 1+(--t)*t*t*t*t; },
  // acceleration until halfway, then deceleration
  inOutQuint: function(t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; },

  // accelerating from zero velocity
  inSine: function(t) { return 1-Math.cos(t*(Math.PI/2)); },
  // decelerating to zero velocity
  outSine: function(t) { return Math.sin(t*(Math.PI/2)); },
  // accelerating until halfway, then decelerating
  inOutSine: function(t) { return .5-.5*Math.cos(Math.PI*t); },

  // accelerating from zero velocity
  inExpo: function(t) { return Math.pow(2, 10*(t-1)); },
  // decelerating to zero velocity
  outExpo: function(t) { return 1-Math.pow(2, -10*t); },
  // accelerating until halfway, then decelerating
  inOutExpo: function(t) { t=t*2-1; return t<0 ? .5*Math.pow(2, 10*t) : 1-.5*Math.pow(2, -10*t); },

  // accelerating from zero velocity
  inCirc: function(t) { return 1-Math.sqrt(1-t*t); },
  // decelerating to zero velocity
  outCirc: function(t) { t--; return Math.sqrt(1-t*t); },
  // acceleration until halfway, then deceleration
  inOutCirc: function(t) { t*=2; return t<1 ? .5-.5*Math.sqrt(1-t*t) : .5+.5*Math.sqrt(1-(t-=2)*t); }
};
// jscs:enable
/* jshint ignore:end */
// @formatter:off

/**
 * Merge the enumerable attributes of two objects.
 * Modified to replace arrays instead of merge.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>"
 * @license MIT
 * @param object
 * @param object
 * @return object
 */
PSVUtils.deepmerge = function(target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    src.forEach(function(e, i) {
      if (typeof dst[i] === 'undefined') {
        dst[i] = e;
      }
      else {
        dst[i] = PSVUtils.deepmerge(null, e);
      }
    });
  }
  else {
    if (target && Array.isArray(target)) {
      target = undefined;
    }
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(function(key) {
        dst[key] = target[key];
      });
    }
    Object.keys(src).forEach(function(key) {
      if (typeof src[key] !== 'object' || !src[key]) {
        dst[key] = src[key];
      }
      else {
        if (!target[key]) {
          dst[key] = src[key];
        }
        else {
          dst[key] = PSVUtils.deepmerge(target[key], src[key]);
        }
      }
    });
  }

  return dst;
};

/**
 * Clone an object
 * @param object
 * @return object
 */
PSVUtils.clone = function(src) {
  return PSVUtils.deepmerge(Array.isArray(src) ? [] : {}, src);
};
