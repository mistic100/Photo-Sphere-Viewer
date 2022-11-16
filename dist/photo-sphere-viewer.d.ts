import { Texture, Vector3, Euler, Intersection, Mesh } from 'three';
import { EventEmitter, Event } from 'uevent';

/**
 * @summary Radius of the THREE.SphereGeometry, Half-length of the THREE.BoxGeometry
 */
declare const SPHERE_RADIUS = 10;

/**
 * @summary Property name added to viewer element
 */
declare const VIEWER_DATA: 'photoSphereViewer';

/**
 * @summary Available actions
 */
declare const ACTIONS: {
  ROTATE_LAT_UP: 'rotateLatitudeUp',
  ROTATE_LAT_DOWN: 'rotateLatitudeDown',
  ROTATE_LONG_RIGHT: 'rotateLongitudeRight',
  ROTATE_LONG_LEFT: 'rotateLongitudeLeft',
  ZOOM_IN: 'zoomIn',
  ZOOM_OUT: 'zoomOut',
  TOGGLE_AUTOROTATE: 'toggleAutorotate',
};

/**
 * @summary Available events names
 */
declare const EVENTS: {
  AUTOROTATE: 'autorotate',
  BEFORE_RENDER: 'before-render',
  BEFORE_ROTATE: 'before-rotate',
  CLICK: 'click',
  CLOSE_PANEL: 'close-panel',
  CONFIG_CHANGED: 'config-changed',
  DOUBLE_CLICK: 'dblclick',
  FULLSCREEN_UPDATED: 'fullscreen-updated',
  HIDE_NOTIFICATION: 'hide-notification',
  HIDE_OVERLAY: 'hide-overlay',
  HIDE_TOOLTIP: 'hide-tooltip',
  LOAD_PROGRESS: 'load-progress',
  OPEN_PANEL: 'open-panel',
  PANORAMA_LOADED: 'panorama-loaded',
  POSITION_UPDATED: 'position-updated',
  READY: 'ready',
  RENDER: 'render',
  SHOW_NOTIFICATION: 'show-notification',
  SHOW_OVERLAY: 'show-overlay',
  SHOW_TOOLTIP: 'show-tooltip',
  SIZE_UPDATED: 'size-updated',
  STOP_ALL: 'stop-all',
  ZOOM_UPDATED: 'zoom-updated',
};

/**
 * @summary Available change events names
 */
declare const CHANGE_EVENTS: {
  GET_ANIMATE_POSITION: 'get-animate-position',
  GET_ROTATE_POSITION: 'get-rotate-position',
};

/**
 * @summary Collection of easing functions
 * @see {@link https://gist.github.com/frederickk/6165768}
 */
declare const EASINGS: {
  linear: (t: number) => number,

  inQuad: (t: number) => number,
  outQuad: (t: number) => number,
  inOutQuad: (t: number) => number,

  inCubic: (t: number) => number,
  outCubic: (t: number) => number,
  inOutCubic: (t: number) => number,

  inQuart: (t: number) => number,
  outQuart: (t: number) => number,
  inOutQuart: (t: number) => number,

  inQuint: (t: number) => number,
  outQuint: (t: number) => number,
  inOutQuint: (t: number) => number,

  inSine: (t: number) => number,
  outSine: (t: number) => number,
  inOutSine: (t: number) => number,

  inExpo: (t: number) => number,
  outExpo: (t: number) => number,
  inOutExpo: (t: number) => number,

  inCirc: (t: number) => number,
  outCirc: (t: number) => number,
  inOutCirc: (t: number) => number,
};

/**
 * @summary Subset of key codes
 */
declare const KEY_CODES: {
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

declare const constants_d_SPHERE_RADIUS: typeof SPHERE_RADIUS;
declare const constants_d_VIEWER_DATA: typeof VIEWER_DATA;
declare const constants_d_ACTIONS: typeof ACTIONS;
declare const constants_d_EVENTS: typeof EVENTS;
declare const constants_d_CHANGE_EVENTS: typeof CHANGE_EVENTS;
declare const constants_d_EASINGS: typeof EASINGS;
declare const constants_d_KEY_CODES: typeof KEY_CODES;
declare namespace constants_d {
  export {
    constants_d_SPHERE_RADIUS as SPHERE_RADIUS,
    constants_d_VIEWER_DATA as VIEWER_DATA,
    constants_d_ACTIONS as ACTIONS,
    constants_d_EVENTS as EVENTS,
    constants_d_CHANGE_EVENTS as CHANGE_EVENTS,
    constants_d_EASINGS as EASINGS,
    constants_d_KEY_CODES as KEY_CODES,
  };
}

/**
 * @summary Toggles a CSS class
 */
declare function toggleClass(element: HTMLElement | SVGElement, className: string, active?: boolean);

/**
 * @summary Adds one or several CSS classes to an element
 */
declare function addClasses(element: HTMLElement, className: string);

/**
 * @summary Removes one or several CSS classes to an element
 */
declare function removeClasses(element: HTMLElement, className: string);

/**
 * @summary Searches if an element has a particular parent at any level including itself
 */
declare function hasParent(el: HTMLElement, parent: HTMLElement): boolean;

/**
 * @summary Gets the closest parent (can by itself)
 */
declare function getClosest(el: HTMLElement | SVGElement, selector: string): HTMLElement;

/**
 * @summary Detects if fullscreen is enabled
 */
declare function isFullscreenEnabled(elt: HTMLElement): boolean;

/**
 * @summary Enters fullscreen mode
 */
declare function requestFullscreen(elt: HTMLElement);

/**
 * @summary Exits fullscreen mode
 */
declare function exitFullscreen();

/**
 * @summary Gets an element style
 */
declare function getStyle(elt: HTMLElement, prop: string): any;

/**
 * @summary Normalize mousewheel values accross browsers
 * @description From Facebook's Fixed Data Table
 * {@link https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js}
 * @copyright Facebook
 */
declare function normalizeWheel(event: WheelEvent): { spinX: number, spinY: number, pixelX: number, pixelY: number };

/**
 * Object defining a point
 */
type Point = {
  x: number;
  y: number;
}

/**
 * Object defining a size
 */
type Size = {
  width: number;
  height: number;
}

/**
 * Object defining a size in CSS (px, % or auto)
 */
type CssSize = {
  width: string;
  height: string;
}

type SphereCorrection = {
  pan?: number;
  tilt?: number;
  roll?: number;
}

/**
 * Object defining a spherical position
 */
type Position = {
  longitude: number;
  latitude: number;
}

/**
 * Object defining a spherical or texture position
 */
type ExtendedPosition = Position | Point;

/**
 * Object defining animation options
 */
type AnimateOptions = ExtendedPosition & {
  speed: string | number;
  zoom?: number;
};

/**
 * Crop information of the panorama
 */
type PanoData = {
  fullWidth: number;
  fullHeight: number;
  croppedWidth: number;
  croppedHeight: number;
  croppedX: number;
  croppedY: number;
  poseHeading?: number;
  posePitch?: number;
  poseRoll?: number;
}

/**
 * Function to compute panorama data once the image is loaded
 */
type PanoDataProvider = (image: HTMLImageElement) => PanoData;

/**
 * Object defining panorama and animation options
 */
type PanoramaOptions = (ExtendedPosition | {}) & {
  caption?: string;
  description?: string;
  transition?: boolean | number;
  showLoader?: boolean;
  zoom?: number;
  sphereCorrection?: SphereCorrection;
  panoData?: PanoData | PanoDataProvider;
  overlay?: any;
  overlayOpacity?: number;
};

/**
 * Result of the AbstractAdapter#loadTexture method
 */
type TextureData = {
  panorama: any;
  texture: Texture | Texture[] | Record<string, Texture>;
  panoData?: PanoData;
};

/**
 * Data of the `click` event
 */
type ClickData = {
  rightclick: boolean;
  clientX: number;
  clientY: number;
  viewerX: number;
  viewerY: number;
  longitude: number;
  latitude: number;
  textureX?: number;
  textureY?: number;
  marker?: any;
}

/**
 * Definition of a custom navbar button
 */
type NavbarCustomButton = {
  id?: string;
  title?: string;
  content?: string;
  className?: string;
  onClick: (Viewer) => void;
  disabled?: boolean;
  visible?: boolean;
  collapsable?: boolean;
};

/**
 * @summary Ensures that a number is in a given interval
 */
declare function bound(x: number, min: number, max: number): number;

/**
 * @summary Checks if a value is an integer
 */
declare function isInteger(value: any): boolean;

/**
 * @summary Computes the sum of an array
 */
declare function sum(array: number[]): number;

/**
 * @summary Computes the distance between two points
 */
declare function distance(p1: Point, p2: Point): number;

/**
 * @summary Compute the shortest offset between two longitudes
 */
declare function getShortestArc(from: number, to: number): number;

/**
 * @summary Computes the angle between the current position and a target position
 */
declare function getAngle(position1: Position, position2: Position): number;

/**
 * @summary Returns the distance between two points on a sphere of radius one
 */
declare function greatArcDistance(p1: number[], p2: number[]): number;

/**
 * @summary Transforms a string to dash-case {@link https://github.com/shahata/dasherize}
 */

declare function dasherize(str: string): string;

/**
 * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
 */
declare function throttle(func: Function, wait: number): Function;

/**
 * @summary Test if an object is a plain object
 * @description Test if an object is a plain object, i.e. is constructed
 * by the built-in Object constructor and inherits directly from Object.prototype
 * or null. Some built-in objects pass the test, e.g. Math which is a plain object
 * and some host or exotic objects may pass also.
 * {@link http://stackoverflow.com/a/5878101/1207670}
 */
declare function isPlainObject(obj: any): boolean;

/**
 * @summary Merges the enumerable attributes of two objects
 * @description Replaces arrays and alters the target object.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>
 */
declare function deepmerge(target: object, src: object): object;

/**
 * @summary Deeply clones an object
 */
declare function clone(src: object): object;

/**
 * @summery Test of an object is empty
 */
declare function isEmpty(obj: object): boolean;

/**
 * @summary Loops over enumerable properties of an object
 */
declare function each(object: object, callback: (value: any, key: string) => void);

/**
 * @summary Returns the intersection between two arrays
 */
declare function intersect<T>(array1: T[], array2: T[]): T[];

/**
 * @summary Returns if a valu is null or undefined
 */
declare function isNil(val: any): val is null | undefined;

/**
 * @summary Returns the first non null non undefined parameter
 */
declare function firstNonNull(...values: any[]): any;

/**
 * @summary Displays a warning in the console
 */
declare function logWarn(message: string);

/**
 * @summary Checks if an object is a {PSV.ExtendedPosition}, ie has x/y or longitude/latitude
 */
declare function isExtendedPosition(object: any): object is ExtendedPosition;

/**
 * @summary Returns the value of a given attribute in the panorama metadata
 */
declare function getXMPValue(data: string, attr: string): number | null;

/**
 * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @description The implementation is as close as possible to the "background-position" specification
 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
 */
declare function parsePosition(value: string | Point): Point;

/**
 * @summary Parse a CSS-like position into an array of position keywords among top, bottom, left, right and center
 */
declare function cleanPosition(value: string | string[], options?: { allowCenter: boolean, cssOrder: boolean }): string[];

/**
 * @summary Parses an speed
 * @param speed - The speed, in radians/degrees/revolutions per second/minute
 * @returns radians per second
 * @throws {PSVError} when the speed cannot be parsed
 */
declare function parseSpeed(speed: string | number): number;

/**
 * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
 * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
 * @param {boolean} [zeroCenter=false] - normalize between -Pi - Pi instead of 0 - 2*Pi
 * @param {boolean} [halfCircle=zeroCenter] - normalize between -Pi/2 - Pi/2 instead of -Pi - Pi
 * @throws {PSVError} when the angle cannot be parsed
 */
declare function parseAngle(angle: string | number, zeroCenter?: boolean, halfCircle?: boolean): number;

/**
 * @summary Creates a THREE texture from an image
 */
declare function createTexture(img: HTMLImageElement | HTMLCanvasElement): Texture;

/**
 * @summary Applies the inverse of Euler angles to a vector
 */
declare function applyEulerInverse(vector: Vector3, euler: Euler);

type AnimationOptions<T> = {
  properties: { [key in keyof T]: { start: number, end: number } };
  duration: number;
  delay?: number;
  easing?: string | ((progress: number) => number);
  onTick: (properties: { [key in keyof T]: number }, progress: number) => void;
};

/**
 * @summary Interpolation helper for animations
 * @description
 * Implements the Promise API with an additional "cancel" method.
 * The promise is resolved when the animation is complete and rejected if the animation is cancelled.
 */
declare class Animation<T> implements PromiseLike<boolean> {

  constructor(options: AnimationOptions<T>);

  then<TResult = boolean>(onFulfilled?: ((completed: boolean) => TResult | PromiseLike<TResult>) | undefined | null): PromiseLike<TResult>;

  cancel();

}

declare const index_d_toggleClass: typeof toggleClass;
declare const index_d_addClasses: typeof addClasses;
declare const index_d_removeClasses: typeof removeClasses;
declare const index_d_hasParent: typeof hasParent;
declare const index_d_getClosest: typeof getClosest;
declare const index_d_isFullscreenEnabled: typeof isFullscreenEnabled;
declare const index_d_requestFullscreen: typeof requestFullscreen;
declare const index_d_exitFullscreen: typeof exitFullscreen;
declare const index_d_getStyle: typeof getStyle;
declare const index_d_normalizeWheel: typeof normalizeWheel;
declare const index_d_bound: typeof bound;
declare const index_d_isInteger: typeof isInteger;
declare const index_d_sum: typeof sum;
declare const index_d_distance: typeof distance;
declare const index_d_getShortestArc: typeof getShortestArc;
declare const index_d_getAngle: typeof getAngle;
declare const index_d_greatArcDistance: typeof greatArcDistance;
declare const index_d_dasherize: typeof dasherize;
declare const index_d_throttle: typeof throttle;
declare const index_d_isPlainObject: typeof isPlainObject;
declare const index_d_deepmerge: typeof deepmerge;
declare const index_d_clone: typeof clone;
declare const index_d_isEmpty: typeof isEmpty;
declare const index_d_each: typeof each;
declare const index_d_intersect: typeof intersect;
declare const index_d_isNil: typeof isNil;
declare const index_d_firstNonNull: typeof firstNonNull;
declare const index_d_logWarn: typeof logWarn;
declare const index_d_isExtendedPosition: typeof isExtendedPosition;
declare const index_d_getXMPValue: typeof getXMPValue;
declare const index_d_parsePosition: typeof parsePosition;
declare const index_d_cleanPosition: typeof cleanPosition;
declare const index_d_parseSpeed: typeof parseSpeed;
declare const index_d_parseAngle: typeof parseAngle;
declare const index_d_createTexture: typeof createTexture;
declare const index_d_applyEulerInverse: typeof applyEulerInverse;
type index_d_AnimationOptions<T> = AnimationOptions<T>;
type index_d_Animation<T> = Animation<T>;
declare const index_d_Animation: typeof Animation;
declare namespace index_d {
  export {
    index_d_toggleClass as toggleClass,
    index_d_addClasses as addClasses,
    index_d_removeClasses as removeClasses,
    index_d_hasParent as hasParent,
    index_d_getClosest as getClosest,
    index_d_isFullscreenEnabled as isFullscreenEnabled,
    index_d_requestFullscreen as requestFullscreen,
    index_d_exitFullscreen as exitFullscreen,
    index_d_getStyle as getStyle,
    index_d_normalizeWheel as normalizeWheel,
    index_d_bound as bound,
    index_d_isInteger as isInteger,
    index_d_sum as sum,
    index_d_distance as distance,
    index_d_getShortestArc as getShortestArc,
    index_d_getAngle as getAngle,
    index_d_greatArcDistance as greatArcDistance,
    index_d_dasherize as dasherize,
    index_d_throttle as throttle,
    index_d_isPlainObject as isPlainObject,
    index_d_deepmerge as deepmerge,
    index_d_clone as clone,
    index_d_isEmpty as isEmpty,
    index_d_each as each,
    index_d_intersect as intersect,
    index_d_isNil as isNil,
    index_d_firstNonNull as firstNonNull,
    index_d_logWarn as logWarn,
    index_d_isExtendedPosition as isExtendedPosition,
    index_d_getXMPValue as getXMPValue,
    index_d_parsePosition as parsePosition,
    index_d_cleanPosition as cleanPosition,
    index_d_parseSpeed as parseSpeed,
    index_d_parseAngle as parseAngle,
    index_d_createTexture as createTexture,
    index_d_applyEulerInverse as applyEulerInverse,
    index_d_AnimationOptions as AnimationOptions,
    index_d_Animation as Animation,
  };
}

/**
 * @summary Base component class
 */
declare abstract class AbstractComponent {

  constructor(parent: Viewer | AbstractComponent, className?: string);

  /**
   * @summary Displays the component
   */
  show(options?: any);

  /**
   * @summary Hides the component
   */
  hide(options?: any);

  /**
   * @summary Displays or hides the component
   */
  toggle(visible?: boolean);

  /**
   * @summary Check if the component is visible
   */
  isVisible(options?: any): boolean;

}

/**
 * @summary Loader class
 */
declare class Loader extends AbstractComponent {

  /**
   * @summary Sets the loader progression
   * @param value
   */
  setProgress(value: number);

}

/**
 * @summary Base navbar button class
 */
declare abstract class AbstractButton extends AbstractComponent {

  /**
   * @summary Unique identifier of the button
   */
  static id: string;

  /**
   * @summary Identifier to declare a group of buttons
   */
  static groupId?: string;

  /**
   * @summary SVG icon name injected in the button
   */
  static icon?: string;

  /**
   * @summary SVG icon name injected in the button when it is active
   */
  static iconActive?: string;

  constructor(navbar: Navbar, className?: string, collapsable?: boolean, tabbable?: boolean);

  /**
   * @summary Checks if the button can be displayed
   */
  isSupported(): boolean | { initial: boolean, promise: Promise<boolean> };

  /**
   * @summary Changes the active state of the button
   */
  toggleActive(active?: boolean);

  /**
   * @summary Disables the button
   */
  disable();

  /**
   * @summary Enables the button
   */
  enable();

  /**
   * @summary Collapses the button in the navbar menu
   */
  collapse();

  /**
   * @summary Uncollapses the button from the navbar menu
   */
  uncollapse();

  /**
   * Action when the button is clicked
   */
  abstract onClick();

}

/**
 * @summary Register a new button available for all viewers
 */
declare function registerButton(button: typeof AbstractButton, defaultPosition?: string): void;

/**
 * @summary Navigation bar class
 */
declare class Navbar extends AbstractComponent {

  /**
   * @summary Change the buttons visible on the navbar
   */
  setButtons(buttons: string | Array<string | NavbarCustomButton>);

  /**
   * @summary Sets the bar caption
   */
  setCaption(html: string);

  /**
   * @summary Returns a button by its identifier
   */
  getButton(id: string): AbstractButton;

}

type NotificationOptions = {
  id?: string;
  content: string;
  timeout?: number;
};

/**
 * @summary Notification class
 */
declare class Notification extends AbstractComponent {

  show(config: string | NotificationOptions);

}

type OverlayOptions = {
  id?: string;
  image: string;
  text: string;
  subtext?: string;
  dissmisable?: boolean;
};

/**
 * @summary Overlay class
 */
declare class Overlay extends AbstractComponent {

  show(config: string | OverlayOptions);

  hide(id?: string);

  isVisible(id?: string): boolean;

}

type PanelOptions = {
  id?: string;
  content: string;
  noMargin?: boolean;
  width?: string;
  clickHandler?: (e: MouseEvent) => {};
};

/**
 * @summary Panel class
 */
declare class Panel extends AbstractComponent {

  show(config: string | PanelOptions);

  hide(id?: string);

  isVisible(id?: string): boolean;

}

/**
 * Object defining the tooltip position
 */
type TooltipPosition = {
  top: number;
  left: number;
  position?: string | string[];
  box?: { width: number, height: number };
};

/**
 * Object defining the tooltip configuration
 */
type TooltipOptions = TooltipPosition & {
  content: string;
  className?: string;
  data?: any;
};

declare class Tooltip extends AbstractComponent {

  /**
   * Do not call this method directly, use {@link TooltipRenderer} instead.
   */
  show(options: TooltipOptions);

  /**
   * @summary Moves the tooltip to a new position
   * @throws {PSVError} when the configuration is incorrect
   */
  move(position: TooltipPosition);

}

/**
 * @summary Base plugins class
 */
declare abstract class AbstractPlugin extends EventEmitter {

  /**
   * @summary Unique identifier of the plugin
   */
  static id: string;

  constructor(psv: Viewer);

  /**
   * @summary Initializes the plugin
   */
  init();

  /**
   * @summary Destroys the plugin
   */
  destroy();

}

type PluginConstructor<T extends AbstractPlugin> = new (psv: Viewer, options?: any) => T;

/**
 * @summary Collections of data converters for the current viewer
 */
declare class DataHelper {

  /**
   * @summary Converts vertical FOV to zoom level
   */
  fovToZoomLevel(fov: number): number;

  /**
   * @summary Converts zoom level to vertical FOV
   */
  zoomLevelToFov(level: number): number;

  /**
   * @summary Convert vertical FOV to horizontal FOV
   */
  vFovToHFov(vFov: number): number;

  /**
   * @summary Converts a speed into a duration from current position to a new position
   */
  speedToDuration(value: string | number, angle: number): number;

  /**
   * @summary Converts pixel texture coordinates to spherical radians coordinates
   */
  textureCoordsToSphericalCoords(point: Point): Position;

  /**
   * @summary Converts spherical radians coordinates to pixel texture coordinates
   */
  sphericalCoordsToTextureCoords(position: Position): Point;

  /**
   * @summary Converts spherical radians coordinates to a THREE.Vector3
   */
  sphericalCoordsToVector3(position: Position, vector: Vector3): Vector3;

  /**
   * @summary Converts a THREE.Vector3 to spherical radians coordinates
   */
  vector3ToSphericalCoords(vector: Vector3): Position;

  /**
   * @summary Converts position on the viewer to a THREE.Vector3
   */
  viewerCoordsToVector3(point: Point): Vector3;

  /**
   * @summary Converts a THREE.Vector3 to position on the viewer
   */
  vector3ToViewerCoords(vector: Vector3): Point;

  /**
   * @summary Converts spherical radians coordinates to position on the viewer
   */
  sphericalCoordsToViewerCoords(position: Position): Point;

  /**
   * @summary Returns intersections with objects in the scene
   */
  getIntersections(viewerPoint: Point): Intersection[];

  /**
   * @summary Converts x/y to latitude/longitude if present and ensure boundaries
   */
  cleanPosition(position: ExtendedPosition): Position;

  /**
   * @summary Ensure a SphereCorrection object is valid
   */
  cleanSphereCorrection(sphere: SphereCorrection): SphereCorrection;

  /**
   * @summary Parse the pose angles of the pano data
   */
  cleanPanoramaPose(panoData: PanoData): SphereCorrection;

}

/**
 * @summary Texture loader
 */
declare class TextureLoader {

  /**
   * @summary Cancels current HTTP requests
   */
  abortLoading();

  /**
   * @summary Loads a Blob with FileLoader
   */
  loadFile(url: string, onProgress?: (number) => void): Promise<Blob>;

  /**
   * @summary Loads an Image using FileLoader to have progress events
   */
  loadImage(url: string, onProgress?: (number) => void): Promise<HTMLImageElement>;

  /**
   * @summary Preload a panorama file without displaying it
   */
  preloadPanorama(panorama: any): Promise<void>;

}

/**
 * @summary Tooltip renderer
 */
declare class TooltipRenderer extends AbstractComponent {

  /**
   * @summary Displays a tooltip on the viewer
   * @throws {PSVError} when the configuration is incorrect
   */
  create(config: TooltipOptions): Tooltip;

}

/**
 * @summary Viewer options, see {@link http://photo-sphere-viewer.js.org/guide/config.html}
 */
type ViewerOptions = {
  container: HTMLElement | string;
  panorama?: any;
  adapter?: AdapterConstructor<any> | [AdapterConstructor<any>, any];
  overlay?: any;
  overlayOpacity?: number;
  caption?: string;
  description?: string;
  downloadUrl?: string;
  loadingImg?: string;
  loadingTxt?: string;
  size?: Size;
  fisheye?: boolean | number;
  minFov?: number;
  maxFov?: number;
  defaultZoomLvl?: number;
  defaultLong?: number;
  defaultLat?: number;
  sphereCorrection?: { pan?: number, tilt?: number, roll?: number };
  moveSpeed?: number;
  zoomSpeed?: number;
  autorotateDelay?: number,
  autorotateIdle?: boolean;
  autorotateSpeed?: string | number;
  autorotateLat?: number;
  autorotateZoomLvl?: number;
  moveInertia?: boolean;
  mousewheel?: boolean;
  mousemove?: boolean;
  /**
   * @deprecated
   */
  captureCursor?: boolean;
  mousewheelCtrlKey?: boolean;
  touchmoveTwoFingers?: boolean;
  useXmpData?: boolean;
  panoData?: PanoData | PanoDataProvider;
  requestHeaders?: Record<string, string> | ((url: string) => Record<string, string>);
  canvasBackground?: string;
  withCredentials?: boolean;
  navbar?: string | Array<string | NavbarCustomButton>;
  lang?: Record<string, string>;
  keyboard?: Record<string, string>;
  plugins?: Array<PluginConstructor<any> | [PluginConstructor<any>, any]>;
};

/**
 * Internal properties of the viewer
 */
type ViewerProps = {
  ready: boolean;
  uiRefresh: boolean;
  needsUpdate: boolean;
  fullscreen: boolean;
  direction: Vector3;
  vFov: number;
  hFov: number;
  aspect: number;
  autorotateEnabled: boolean;
  animationPromise: Animation<any>;
  loadingPromise: Promise<void>;
  startTimeout: any;
  size: Size;
  panoData: PanoData;
};

/**
 * Main class
 */
declare class Viewer extends EventEmitter {

  /**
   * Configuration holder
   */
  readonly config: ViewerOptions;

  /**
   * Internal properties
   */
  protected readonly prop: ViewerProps;

  /**
   * Top most parent
   */
  readonly parent: HTMLElement;

  /**
   * Main container
   */
  readonly container: HTMLElement;

  /**
   * Textures loader
   */
  readonly textureLoader: TextureLoader;

  /**
   * Utilities to help converting data
   */
  readonly dataHelper: DataHelper;

  readonly loader: Loader;

  readonly navbar: Navbar;

  readonly panel: Panel;

  readonly tooltip: TooltipRenderer;

  readonly notification: Notification;

  readonly overlay: Overlay;

  /**
   * @throws {PSVError} when the configuration is incorrect
   */
  constructor(options: ViewerOptions);

  /**
   * @summary Destroys the viewer
   * @description The memory used by the ThreeJS context is not totally cleared. This will be fixed as soon as possible.
   */
  destroy();

  /**
   * @summary Returns the instance of a plugin if it exists
   */
  getPlugin<T extends AbstractPlugin>(pluginId: string | PluginConstructor<T>): T | undefined;

  /**
   * @summary Returns the current position of the camera
   */
  getPosition(): Position;

  /**
   * @summary Returns the current zoom level
   */
  getZoomLevel(): number;

  /**
   * @summary Returns the current viewer size
   */
  getSize(): Size;

  /**
   * @summary Checks if the automatic rotation is enabled
   */
  isAutorotateEnabled(): boolean;

  /**
   * @summary Checks if the viewer is in fullscreen
   */
  isFullscreenEnabled(): boolean;

  /**
   * @summary Flags the view has changed for the next render
   */
  needsUpdate();

  /**
   * @summary Resizes the canvas when the window is resized
   */
  autoSize();

  /**
   * @summary Loads a new panorama file
   * @description Loads a new panorama file, optionally changing the camera position/zoom and activating the transition animation.<br>
   * If the "options" parameter is not defined, the camera will not move and the ongoing animation will continue.<br>
   * If another loading is already in progress it will be aborted.
   * @returns resolves false if the loading was aborted by another call
   */
  setPanorama(panorama: any, options?: PanoramaOptions): Promise<boolean>;

  /**
   * @summary Loads a new overlay
   */
  setOverlay(path: any, opacity?: number): Promise<unknown>;

  /**
   * @summary Update options
   */
  setOptions(options: Partial<ViewerOptions>);

  /**
   * @summary Update options
   */
  setOption<K extends keyof ViewerOptions>(option: K, value: ViewerOptions[K]);

  /**
   * @summary Starts the automatic rotation
   */
  startAutorotate();

  /**
   * @summary Stops the automatic rotation
   */
  stopAutorotate();

  /**
   * @summary Starts or stops the automatic rotation
   */
  toggleAutorotate();

  /**
   * @summary Displays an error message
   */
  showError(message: string);

  /**
   * @summary Hides the error message
   */
  hideError();

  /**
   * @summary Rotates the view to specific longitude and latitude
   */
  rotate(position: ExtendedPosition);

  /**
   * @summary Rotates and zooms the view with a smooth animation
   */
  animate(options: AnimateOptions): Animation<any>;

  /**
   * @summary Stops the ongoing animation
   * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
   */
  stopAnimation(): Promise<void>;

  /**
   * @summary Zooms to a specific level between `max_fov` and `min_fov`
   */
  zoom(level: number);

  /**
   * @summary Increases the zoom level
   * @param {number} [step=1]
   */
  zoomIn(step?: number);

  /**
   * @summary Decreases the zoom level
   * @param {number} [step=1]
   */
  zoomOut(step?: number);

  /**
   * @summary Resizes the viewer
   */
  resize(size: CssSize);

  /**
   * @summary Enters the fullscreen mode
   */
  enterFullscreen();

  /**
   * @summary Exits the fullscreen mode
   */
  exitFullscreen();

  /**
   * @summary Enters or exits the fullscreen mode
   */
  toggleFullscreen();

  /**
   * @summary Enables the keyboard controls (done automatically when entering fullscreen)
   */
  startKeyboardControl();

  /**
   * @summary Disables the keyboard controls (done automatically when exiting fullscreen)
   */
  stopKeyboardControl();

  /**
   * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
   */
  once(e: 'ready', cb: (e: Event) => void): this;

  /**
   * @summary Triggered when the automatic rotation is enabled/disabled
   */
  on(e: 'autorotate', cb: (e: Event, enabled: true) => void): this;
  /**
   * @summary Triggered before a render, used to modify the view
   */
  on(e: 'before-render', cb: (e: Event, timestamp: number, elapsed: number) => void): this;
  /**
   * @summary Triggered before a rotate operation, can be cancelled
   */
  on(e: 'before-rotate', cb: (e: Event, position: ExtendedPosition) => void): this;
  /**
   * @summary Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
   */
  on(e: 'click', cb: (e: Event, data: ClickData) => void): this;
  /**
   * @summary Trigered when the panel is closed
   */
  on(e: 'close-panel', cb: (e: Event, id: string | undefined) => void): this;
  /**
   * @summary Triggered after a call to setOption/setOptions
   */
  on(e: 'config-changed', cb: (e: Event, options: string[]) => void): this;
  /**
   * @summary Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`
   */
  on(e: 'dblclick', cb: (e: Event, data: ClickData) => void): this;
  /**
   * @summary Triggered when the fullscreen mode is enabled/disabled
   */
  on(e: 'fullscreen-updated', cb: (e: Event, enabled: true) => void): this;
  /**
   * @summary Called to alter the target position of an animation
   */
  on(e: 'get-animate-position', cb: (e: Event, position: Position) => Position): this;
  /**
   * @summary Called to alter the target position of a rotation
   */
  on(e: 'get-rotate-position', cb: (e: Event, position: Position) => Position): this;
  /**
   * @summary Triggered when the notification is hidden
   */
  on(e: 'hide-notification', cb: (e: Event, id: string | undefined) => void): this;
  /**
   * @summary Triggered when the overlay is hidden
   */
  on(e: 'hide-overlay', cb: (e: Event, id: string | undefined) => void): this;
  /**
   * @summary Triggered when the tooltip is hidden
   */
  on(e: 'hide-tooltip', cb: (e: Event, data: any) => void): this;
  /**
   * @summary Triggered when a key is pressed, can be cancelled
   */
  on(e: 'key-press', cb: (e: Event, key: string) => void): this;
  /**
   * @summary Triggered when the loader value changes
   */
  on(e: 'load-progress', cb: (e: Event, value: number) => void): this;
  /**
   * @summary Triggered when the panel is opened
   */
  on(e: 'open-panel', cb: (e: Event, id: string | undefined) => void): this;
  /**
   * @summary Triggered when a panorama image has been loaded
   */
  on(e: 'panorama-loaded', cb: (e: Event, textureData: TextureData) => void): this;
  /**
   * @summary Triggered when the view longitude and/or latitude changes
   */
  on(e: 'position-updated', cb: (e: Event, position: Position) => void): this;
  /**
   * @summary Triggered on each viewer render, **this event is triggered very often**
   */
  on(e: 'render', cb: (e: Event) => void): this;
  /**
   * @summary Trigered when the notification is shown
   */
  on(e: 'show-notification', cb: (e: Event, id: string | undefined) => void): this;
  /**
   * @summary Trigered when the overlay is shown
   */
  on(e: 'show-overlay', cb: (e: Event, id: string | undefined) => void): this;
  /**
   * @summary Trigered when the tooltip is shown
   */
  on(e: 'show-tooltip', cb: (e: Event, data: any, tooltip: Tooltip) => void): this;
  /**
   * @summary Triggered when the viewer size changes
   */
  on(e: 'size-updated', cb: (e: Event, size: Size) => void): this;
  /**
   * @summary Triggered when all current animations are stopped
   */
  on(e: 'stop-all', cb: (e: Event) => void): this;
  /**
   * @summary Triggered when the zoom level changes
   */
  on(e: 'zoom-updated', cb: (e: Event, zoom: number) => void): this;

}

/**
 * @summary Base adapters class
 * @template T type of the panorama configuration object
 */
declare abstract class AbstractAdapter<T> {

  /**
   * @summary Unique identifier of the adapter
   */
  static id: string;

  /**
   * @summary Indicates if the adapter supports panorama download natively
   */
  static supportsDownload: boolean;

  /**
   * @summary Indicated if the adapter can display an additional transparent image above the panorama
   */
  static supportsOverlay: boolean;

  constructor(parent: Viewer);

  /**
   * @summary Destroys the adapter
   */
  destroy();

  /**
   * @summary Indicates if the adapter supports transitions between panoramas
   */
  supportsTransition(panorama: T): boolean;

  /**
   * @summary Indicates if the adapter supports preload of a panorama
   */
  supportsPreload(panorama: T): boolean;

  /**
   * @summary Loads the panorama texture(s)
   */
  loadTexture(panorama: T, newPanoData?: PanoData | PanoDataProvider, useXmpPanoData?: boolean): Promise<TextureData>;

  /**
   * @summary Creates the cube mesh
   * @param {number} [scale=1]
   */
  createMesh(scale?: number): Mesh;

  /**
   * @summary Applies the texture to the mesh
   */
  setTexture(mesh: Mesh, textureData: TextureData, transition?: boolean);

  /**
   * @summary Changes the opacity of the mesh
   */
  setTextureOpacity(mesh: Mesh, opacity: number);

  /**
   * @summary Cleanup a loaded texture, used on load abort
   */
  disposeTexture(textureData: TextureData);

  /**
   * @summary Applies the overlay to the mesh
   */
  setOverlay(mesh: Mesh, textureData: TextureData, opacity: number);

}

type AdapterConstructor<T extends AbstractAdapter<any>> = new (psv: Viewer, options?: any) => T;

type EquirectangularAdapterOptions = {
  resolution?: number,
};

/**
 * @summary Adapter for equirectangular panoramas
 */
declare class EquirectangularAdapter extends AbstractAdapter<string> {

  constructor(psv: Viewer, options: EquirectangularAdapterOptions);

}

/**
 * @summary Default options
 */
declare const DEFAULTS: ViewerOptions;

/**
 * @summary General information about the system
 */
declare const SYSTEM: {
  loaded: boolean;
  pixelRatio: number;
  isWebGLSupported: boolean;
  maxTextureWidth: number;
  mouseWheelEvent: string;
  fullscreenEvent: string;
  getMaxCanvasWidth: () => number;
  isTouchEnabled: Promise<boolean>;
};

/**
 * @summary Custom error used in the lib
 */
declare class PSVError extends Error {
  name: 'PSVError';
}

export { AbstractAdapter, AbstractButton, AbstractComponent, AbstractPlugin, AdapterConstructor, AnimateOptions, constants_d as CONSTANTS, ClickData, CssSize, DEFAULTS, DataHelper, EquirectangularAdapter, EquirectangularAdapterOptions, ExtendedPosition, Loader, Navbar, NavbarCustomButton, Notification, NotificationOptions, Overlay, OverlayOptions, PSVError, Panel, PanelOptions, PanoData, PanoDataProvider, PanoramaOptions, PluginConstructor, Point, Position, SYSTEM, Size, SphereCorrection, TextureData, TextureLoader, Tooltip, TooltipOptions, TooltipPosition, TooltipRenderer, Viewer, ViewerOptions, ViewerProps, registerButton, index_d as utils };
