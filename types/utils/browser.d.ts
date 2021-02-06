/**
 * @summary Toggles a CSS class
 */
export function toggleClass(element: HTMLElement | SVGElement, className: string, active?: boolean);

/**
 * @summary Adds one or several CSS classes to an element
 */
export function addClasses(element: HTMLElement, className: string);

/**
 * @summary Removes one or several CSS classes to an element
 */
export function removeClasses(element: HTMLElement, className: string);

/**
 * @summary Searches if an element has a particular parent at any level including itself
 */
export function hasParent(el: HTMLElement, parent: HTMLElement): boolean;

/**
 * @summary Gets the closest parent (can by itself)
 */
export function getClosest(el: HTMLElement | SVGElement, selector: string): HTMLElement;

/**
 * @summary Returns the key name of a KeyboardEvent
 */
export function getEventKey(evt: KeyboardEvent): string;

/**
 * @summary Detects if fullscreen is enabled
 */
export function isFullscreenEnabled(elt: HTMLElement): boolean;

/**
 * @summary Enters fullscreen mode
 */
export function requestFullscreen(elt: HTMLElement);

/**
 * @summary Exits fullscreen mode
 */
export function exitFullscreen();

/**
 * @summary Gets an element style
 */
export function getStyle(elt: HTMLElement, prop: string): any;

/**
 * @summary Normalize mousewheel values accross browsers
 * @description From Facebook's Fixed Data Table
 * {@link https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js}
 * @copyright Facebook
 */
export function normalizeWheel(event: WheelEvent): { spinX: number, spinY: number, pixelX: number, pixelY: number };
