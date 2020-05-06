/**
 * @summary Toggles a CSS class
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
 * @param {HTMLElement|SVGElement} el
 * @param {string} selector
 * @returns {HTMLElement}
 */
export function getClosest(el, selector) {
  const matches = el.matches || el.msMatchesSelector;
  let test = el;
  // When el is document or window, the matches does not exist
  if (!matches) {
    return null;
  }

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
 * @memberOf PSV.utils
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
 * @memberOf PSV.utils
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
 * @summary Detects if fullscreen is enabled
 * @memberOf PSV.utils
 * @param {HTMLElement} elt
 * @returns {boolean}
 */
export function isFullscreenEnabled(elt) {
  /* eslint-disable-next-line max-len */
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) === elt;
}

/**
 * @summary Enters fullscreen mode
 * @memberOf PSV.utils
 * @param {HTMLElement} elt
 */
export function requestFullscreen(elt) {
  /* eslint-disable-next-line max-len */
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
}

/**
 * @summary Exits fullscreen mode
 * @memberOf PSV.utils
 */
export function exitFullscreen() {
  /* eslint-disable-next-line max-len */
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
}

/**
 * @summary Gets an element style
 * @memberOf PSV.utils
 * @param {HTMLElement} elt
 * @param {string} prop
 * @returns {*}
 */
export function getStyle(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
}

/**
 * @summary Normalize mousewheel values accross browsers
 * @memberOf PSV.utils
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
