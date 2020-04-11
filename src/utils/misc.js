/**
 * @summary Transforms a string to dash-case{@link https://github.com/shahata/dasherize}
 * @memberOf PSV.utils
 * @param {string} str
 * @returns {string}
 */
export function dasherize(str) {
  return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, (s, i) => {
    return (i > 0 ? '-' : '') + s.toLowerCase();
  });
}

/**
 * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
 * @param {Object} src
 * @returns {Object}
 */
export function clone(src) {
  return deepmerge(null, src);
}

/**
 * @summery Test of an object is empty
 * @memberOf PSV.utils
 * @param {object} obj
 * @returns {boolean}
 */
export function isEmpty(obj) {
  return !obj || (Object.keys(obj).length === 0 && obj.constructor === Object);
}

/**
 * @summary Loops over enumerable properties of an object
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
 * @template T
 * @param {T[]} array1
 * @param {T[]} array2
 * @returns {T[]}
 */
export function intersect(array1, array2) {
  return array1.filter(value => array2.indexOf(value) !== -1);
}
