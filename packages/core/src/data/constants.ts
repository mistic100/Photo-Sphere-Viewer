import arrow from '../icons/arrow.svg';
import close from '../icons/close.svg';
import download from '../icons/download.svg';
import fullscreenIn from '../icons/fullscreen-in.svg';
import fullscreenOut from '../icons/fullscreen-out.svg';
import info from '../icons/info.svg';
import menu from '../icons/menu.svg';
import zoomIn from '../icons/zoom-in.svg';
import zoomOut from '../icons/zoom-out.svg';

/**
 * Default duration of the transition between panoramas
 */
export const DEFAULT_TRANSITION = 1500;

/**
 *  Minimum duration of the animations created with {@link Viewer#animate}
 */
export const ANIMATION_MIN_DURATION = 500;

/**
 * Number of pixels bellow which a mouse move will be considered as a click
 */
export const MOVE_THRESHOLD = 4;

/**
 * Delay in milliseconds between two clicks to consider a double click
 */
export const DBLCLICK_DELAY = 300;

/**
 * Delay in milliseconds to emulate a long touch
 */
export const LONGTOUCH_DELAY = 500;

/**
 * Delay in milliseconds to for the two fingers overlay to appear
 */
export const TWOFINGERSOVERLAY_DELAY = 100;

/**
 * Duration in milliseconds of the "ctrl zoom" overlay
 */
export const CTRLZOOM_TIMEOUT = 2000;

/**
 * Duration of the mouse position history used to compute inertia
 */
export const INERTIA_WINDOW = 300;

/**
 * Radius of the SphereGeometry, Half-length of the BoxGeometry
 */
export const SPHERE_RADIUS = 10;

/**
 * Property name added to viewer element
 */
export const VIEWER_DATA = 'photoSphereViewer';

/**
 * CSS class that must be applied on elements whose mouse events must not bubble to the viewer itself
 */
export const CAPTURE_EVENTS_CLASS = 'psv--capture-event';

/**
 * Actions available for {@link ViewerConfig['keyboard']} configuration
 */
export enum ACTIONS {
    ROTATE_UP = 'ROTATE_UP',
    ROTATE_DOWN = 'ROTATE_DOWN',
    ROTATE_RIGHT = 'ROTATE_RIGHT',
    ROTATE_LEFT = 'ROTATE_LEFT',
    ZOOM_IN = 'ZOOM_IN',
    ZOOM_OUT = 'ZOOM_OUT',
}

/**
 * Internal identifiers for various stuff
 * @internal
 */
export const IDS = {
    MENU: 'menu',
    TWO_FINGERS: 'twoFingers',
    CTRL_ZOOM: 'ctrlZoom',
    ERROR: 'error',
    DESCRIPTION: 'description',
};

/**
 * Subset of keyboard codes
 */
export const KEY_CODES = {
    Enter: 'Enter',
    Control: 'Control',
    Escape: 'Escape',
    Space: ' ',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowLeft: 'ArrowLeft',
    ArrowUp: 'ArrowUp',
    ArrowRight: 'ArrowRight',
    ArrowDown: 'ArrowDown',
    Delete: 'Delete',
    Plus: '+',
    Minus: '-',
};

/**
 * Collection of SVG icons
 */
export const ICONS = {
    arrow,
    close,
    download,
    fullscreenIn,
    fullscreenOut,
    info,
    menu,
    zoomIn,
    zoomOut,
};

/**
 * Collection of easing functions
 * @link https://gist.github.com/frederickk/6165768
 */
// @formatter:off
// prettier-ignore
export const EASINGS: Record<string, (t: number) => number> = {
    linear: (t: number) => t,

    inQuad: (t: number) => t * t,
    outQuad: (t: number) => t * (2 - t),
    inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

    inCubic: (t: number) => t * t * t,
    outCubic: (t: number) => --t * t * t + 1,
    inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

    inQuart: (t: number) => t * t * t * t,
    outQuart: (t: number) => 1 - --t * t * t * t,
    inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

    inQuint: (t: number) => t * t * t * t * t,
    outQuint: (t: number) => 1 + --t * t * t * t * t,
    inOutQuint: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t),

    inSine: (t: number) => 1 - Math.cos(t * (Math.PI / 2)),
    outSine: (t: number) => Math.sin(t * (Math.PI / 2)),
    inOutSine: (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t),

    inExpo: (t: number) => Math.pow(2, 10 * (t - 1)),
    outExpo: (t: number) => 1 - Math.pow(2, -10 * t),
    inOutExpo: (t: number) => ((t = t * 2 - 1) < 0 ? 0.5 * Math.pow(2, 10 * t) : 1 - 0.5 * Math.pow(2, -10 * t)),

    inCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
    outCirc: (t: number) => Math.sqrt(1 - (t - 1) * (t - 1)),
    inOutCirc: (t: number) => (t *= 2) < 1 ? 0.5 - 0.5 * Math.sqrt(1 - t * t) : 0.5 + 0.5 * Math.sqrt(1 - (t -= 2) * t),
};
// @formatter:on
