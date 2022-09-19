import { Vector3 } from 'three';
import { Event, EventEmitter } from 'uevent';
import { AdapterConstructor } from './adapters/AbstractAdapter';
import { Animation } from './utils/Animation';
import { Loader } from './components/Loader';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { Overlay } from './components/Overlay';
import { Panel } from './components/Panel';
import { Tooltip } from './components/Tooltip';
import {
  AnimateOptions,
  ClickData,
  CssSize,
  ExtendedPosition,
  NavbarCustomButton,
  PanoData,
  PanoDataProvider,
  PanoramaOptions,
  Position,
  Size,
  TextureData
} from './models';
import { AbstractPlugin, PluginConstructor } from './plugins/AbstractPlugin';
import { DataHelper } from './services/DataHelper';
import { TextureLoader } from './services/TextureLoader';
import { TooltipRenderer } from './services/TooltipRenderer';

/**
 * @summary Viewer options, see {@link http://photo-sphere-viewer.js.org/guide/config.html}
 */
export type ViewerOptions = {
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
export type ViewerProps = {
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
export class Viewer extends EventEmitter {

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
