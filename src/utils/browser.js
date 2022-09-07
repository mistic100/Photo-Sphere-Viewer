/**
 * @summary Toggles a CSS class
 * @memberOf PSV.utils
 * @param {HTMLElement|SVGElement} element
 * @param {string} className
 * @param {boolean} [active] - forced state
 */
export function toggleClass(element, className, active) {
  if (active === undefined) {
    element.classList.toggle(className);
  }
  else if (active) {
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
  element.classList.add(...className.split(' '));
}

/**
 * @summary Removes one or several CSS classes to an element
 * @memberOf PSV.utils
 * @param {HTMLElement} element
 * @param {string} className
 */
export function removeClasses(element, className) {
  element.classList.remove(...className.split(' '));
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
  // When el is document or window, the matches does not exist
  if (!el?.matches) {
    return null;
  }

  let test = el;

  do {
    if (test.matches(selector)) {
      return test;
    }
    test = test instanceof SVGElement ? test.parentNode : test.parentElement;
  } while (test);

  return null;
}

/**
 * @summary Gets the position of an element in the viewer without reflow
 * @description Will gives the same result as getBoundingClientRect() as soon as there are no CSS transforms
 * @memberOf PSV.utils
 * @param {HTMLElement} el
 * @return {{left: number, top: number}}
 */
export function getPosition(el) {
  let left = 0;
  let top = 0;
  let test = el;

  while (test) {
    left += (test.offsetLeft - test.scrollLeft + test.clientLeft);
    top += (test.offsetTop - test.scrollTop + test.clientTop);
    test = test.offsetParent;
  }

  return { left, top };
}

/**
 * @summary Detects if fullscreen is enabled
 * @memberOf PSV.utils
 * @param {HTMLElement} elt
 * @returns {boolean}
 */
export function isFullscreenEnabled(elt) {
  return (document.fullscreenElement || document.webkitFullscreenElement) === elt;
}

/**
 * @summary Enters fullscreen mode
 * @memberOf PSV.utils
 * @param {HTMLElement} elt
 */
export function requestFullscreen(elt) {
  (elt.requestFullscreen || elt.webkitRequestFullscreen).call(elt);
}

/**
 * @summary Exits fullscreen mode
 * @memberOf PSV.utils
 */
export function exitFullscreen() {
  (document.exitFullscreen || document.webkitExitFullscreen).call(document);
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
 * @param {WheelEvent} event
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
