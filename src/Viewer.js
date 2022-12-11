import { Cache, MathUtils, Vector3 } from 'three';
import { EventEmitter } from 'uevent';
import { Loader } from './components/Loader';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { Overlay } from './components/Overlay';
import { Panel } from './components/Panel';
import { CONFIG_PARSERS, DEFAULTS, DEPRECATED_OPTIONS, getConfig, READONLY_OPTIONS } from './data/config';
import {
  ANIMATION_MIN_DURATION,
  CHANGE_EVENTS,
  DEFAULT_TRANSITION,
  EVENTS,
  IDS,
  SPHERE_RADIUS,
  VIEWER_DATA
} from './data/constants';
import { SYSTEM } from './data/system';
import errorIcon from './icons/error.svg';
import { AbstractPlugin } from './plugins/AbstractPlugin';
import { PSVError } from './PSVError';
import { DataHelper } from './services/DataHelper';
import { EventsHandler } from './services/EventsHandler';
import { Renderer } from './services/Renderer';
import { TextureLoader } from './services/TextureLoader';
import { TooltipRenderer } from './services/TooltipRenderer';
import {
  Animation,
  Dynamic,
  each,
  exitFullscreen,
  getAbortError,
  getAngle,
  getShortestArc,
  isAbortError,
  isExtendedPosition,
  isFullscreenEnabled,
  isNil,
  logWarn,
  MultiDynamic,
  pluginInterop,
  requestFullscreen,
  throttle,
  toggleClass
} from './utils';

Cache.enabled = true;

/**
 * @summary Main class
 * @memberOf PSV
 * @extends {external:uEvent.EventEmitter}
 */
export class Viewer extends EventEmitter {

  /**
   * @param {PSV.Options} options
   * @fires PSV.ready
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  constructor(options) {
    super();

    SYSTEM.load();

    // must support WebGL
    if (!SYSTEM.isWebGLSupported) {
      throw new PSVError('WebGL is not supported.');
    }

    if (SYSTEM.maxTextureWidth === 0) {
      throw new PSVError('Unable to detect system capabilities');
    }

    /**
     * @summary Internal properties
     * @member {Object}
     * @protected
     * @property {boolean} ready - when all components are loaded
     * @property {boolean} uiRefresh - if the UI needs to be renderer
     * @property {boolean} needsUpdate - if the view needs to be renderer
     * @property {boolean} fullscreen - if the viewer is currently fullscreen
     * @property {external:THREE.Vector3} direction - direction of the camera
     * @property {number} vFov - vertical FOV
     * @property {number} hFov - horizontal FOV
     * @property {number} aspect - viewer aspect ratio
     * @property {boolean} autorotateEnabled - automatic rotation is enabled
     * @property {PSV.utils.Animation} animationPromise - promise of the current animation
     * @property {Promise} loadingPromise - promise of the setPanorama method
     * @property {boolean} littlePlanet - special tweaks for LittlePlanetAdapter
     * @property {number} idleTime - time of the last user action
     * @property {object} objectsObservers
     * @property {PSV.Size} size - size of the container
     * @property {PSV.PanoData} panoData - panorama metadata, if supported
     */
    this.prop = {
      ready            : false,
      uiRefresh        : false,
      needsUpdate      : false,
      fullscreen       : false,
      direction        : new Vector3(0, 0, SPHERE_RADIUS),
      vFov             : null,
      hFov             : null,
      aspect           : null,
      autorotateEnabled: false,
      animationPromise : null,
      loadingPromise   : null,
      littlePlanet     : false,
      idleTime         : -1,
      objectsObservers : {},
      size             : {
        width : 0,
        height: 0,
      },
      panoData         : {
        fullWidth    : 0,
        fullHeight   : 0,
        croppedWidth : 0,
        croppedHeight: 0,
        croppedX     : 0,
        croppedY     : 0,
        poseHeading  : 0,
        posePitch    : 0,
        poseRoll     : 0,
      },
    };

    /**
     * @summary Configuration holder
     * @type {PSV.Options}
     * @readonly
     */
    this.config = getConfig(options);

    /**
     * @summary Top most parent
     * @member {HTMLElement}
     * @readonly
     */
    this.parent = (typeof options.container === 'string') ? document.getElementById(options.container) : options.container;
    this.parent[VIEWER_DATA] = this;

    /**
     * @summary Main container
     * @member {HTMLElement}
     * @readonly
     */
    this.container = document.createElement('div');
    this.container.classList.add('psv-container');
    this.parent.appendChild(this.container);

    /**
     * @summary Render adapter
     * @type {PSV.adapters.AbstractAdapter}
     * @readonly
     * @package
     */
    this.adapter = new this.config.adapter[0](this, this.config.adapter[1]); // eslint-disable-line new-cap

    /**
     * @summary All child components
     * @type {PSV.components.AbstractComponent[]}
     * @readonly
     * @package
     */
    this.children = [];

    /**
     * @summary All plugins
     * @type {Object<string, PSV.plugins.AbstractPlugin>}
     * @readonly
     * @package
     */
    this.plugins = {};

    /**
     * @type {PSV.services.Renderer}
     * @readonly
     */
    this.renderer = new Renderer(this);

    /**
     * @type {PSV.services.TextureLoader}
     * @readonly
     */
    this.textureLoader = new TextureLoader(this);

    /**
     * @type {PSV.services.EventsHandler}
     * @readonly
     */
    this.eventsHandler = new EventsHandler(this);

    /**
     * @type {PSV.services.DataHelper}
     * @readonly
     */
    this.dataHelper = new DataHelper(this);

    /**
     * @member {PSV.components.Loader}
     * @readonly
     */
    this.loader = new Loader(this);

    /**
     * @member {PSV.components.Navbar}
     * @readonly
     */
    this.navbar = new Navbar(this);

    /**
     * @member {PSV.components.Panel}
     * @readonly
     */
    this.panel = new Panel(this);

    /**
     * @member {PSV.services.TooltipRenderer}
     * @readonly
     */
    this.tooltip = new TooltipRenderer(this);

    /**
     * @member {PSV.components.Notification}
     * @readonly
     */
    this.notification = new Notification(this);

    /**
     * @member {PSV.components.Overlay}
     * @readonly
     */
    this.overlay = new Overlay(this);

    /**
     * @member {Record<string, PSV.utils.Dynamic>}
     * @package
     */
    this.dynamics = {
      zoom: new Dynamic((value) => {
        this.prop.vFov = this.dataHelper.zoomLevelToFov(value);
        this.prop.hFov = this.dataHelper.vFovToHFov(this.prop.vFov);
        this.trigger(EVENTS.ZOOM_UPDATED, value);
      }, this.config.defaultZoomLvl, 0, 100),

      position: new MultiDynamic({
        longitude: new Dynamic(null, this.config.defaultLong, 0, 2 * Math.PI, true),
        latitude : this.prop.littlePlanet
          ? new Dynamic(null, this.config.defaultLat, 0, Math.PI * 2, true)
          : new Dynamic(null, this.config.defaultLat, -Math.PI / 2, Math.PI / 2),
      }, (position) => {
        this.dataHelper.sphericalCoordsToVector3(position, this.prop.direction);
        this.trigger(EVENTS.POSITION_UPDATED, position);
      }),
    };

    this.__updateSpeeds();

    this.eventsHandler.init();

    this.__resizeRefresh = throttle(() => this.refreshUi('resize'), 500);

    // apply container size
    this.resize(this.config.size);

    // init plugins
    this.config.plugins.forEach(([plugin, opts]) => {
      this.plugins[plugin.id] = new plugin(this, opts); // eslint-disable-line new-cap
    });
    each(this.plugins, plugin => plugin.init?.());

    // init buttons
    this.navbar.setButtons(this.config.navbar);

    // load panorama
    if (this.config.panorama) {
      this.setPanorama(this.config.panorama);
    }

    toggleClass(this.container, 'psv--is-touch', SYSTEM.isTouchEnabled.initial);
    SYSTEM.isTouchEnabled.promise.then(enabled => toggleClass(this.container, 'psv--is-touch', enabled));

    // enable GUI after first render
    this.once(EVENTS.RENDER, () => {
      if (this.config.navbar) {
        this.container.classList.add('psv--has-navbar');
        this.navbar.show();
      }

      // Queue autorotate
      if (!isNil(this.config.autorotateDelay)) {
        this.prop.idleTime = performance.now();
      }

      this.prop.ready = true;

      setTimeout(() => {
        this.refreshUi('init');

        this.trigger(EVENTS.READY);
      }, 0);
    });
  }

  /**
   * @summary Destroys the viewer
   * @description The memory used by the ThreeJS context is not totally cleared. This will be fixed as soon as possible.
   */
  destroy() {
    this.__stopAll();
    this.stopKeyboardControl();
    this.exitFullscreen();

    each(this.plugins, plugin => plugin.destroy());
    delete this.plugins;

    this.children.slice().forEach(child => child.destroy());
    this.children.length = 0;

    this.eventsHandler.destroy();
    this.renderer.destroy();
    this.textureLoader.destroy();
    this.dataHelper.destroy();
    this.adapter.destroy();

    this.parent.removeChild(this.container);
    delete this.parent[VIEWER_DATA];

    delete this.parent;
    delete this.container;

    delete this.loader;
    delete this.navbar;
    delete this.panel;
    delete this.tooltip;
    delete this.notification;
    delete this.overlay;
    delete this.dynamics;

    delete this.config;
  }

  /**
   * @summary Refresh UI
   * @package
   */
  refreshUi(reason) {
    if (!this.prop.ready) {
      return;
    }

    if (!this.prop.uiRefresh) {
      // console.log(`PhotoSphereViewer: UI Refresh, ${reason}`);

      this.prop.uiRefresh = true;

      this.children.every((child) => {
        child.refreshUi();
        return this.prop.uiRefresh === true;
      });

      this.prop.uiRefresh = false;
    }
    else if (this.prop.uiRefresh !== 'new') {
      this.prop.uiRefresh = 'new';

      // wait for current refresh to cancel
      setTimeout(() => {
        this.prop.uiRefresh = false;
        this.refreshUi(reason);
      });
    }
  }

  /**
   * @summary Returns the instance of a plugin if it exists
   * @param {Class<PSV.plugins.AbstractPlugin>|string} pluginId
   * @returns {PSV.plugins.AbstractPlugin}
   */
  getPlugin(pluginId) {
    if (typeof pluginId === 'string') {
      return this.plugins[pluginId];
    }
    else {
      const pluginCtor = pluginInterop(pluginId, AbstractPlugin);
      return pluginCtor ? this.plugins[pluginCtor.id] : undefined;
    }
  }

  /**
   * @summary Returns the current position of the camera
   * @returns {PSV.Position}
   */
  getPosition() {
    return this.dataHelper.cleanPosition(this.dynamics.position.current);
  }

  /**
   * @summary Returns the current zoom level
   * @returns {number}
   */
  getZoomLevel() {
    return this.dynamics.zoom.current;
  }

  /**
   * @summary Returns the current viewer size
   * @returns {PSV.Size}
   */
  getSize() {
    return { ...this.prop.size };
  }

  /**
   * @summary Checks if the automatic rotation is enabled
   * @returns {boolean}
   */
  isAutorotateEnabled() {
    return this.prop.autorotateEnabled;
  }

  /**
   * @summary Checks if the viewer is in fullscreen
   * @returns {boolean}
   */
  isFullscreenEnabled() {
    if (SYSTEM.fullscreenEvent) {
      return isFullscreenEnabled(this.container);
    }
    else {
      return this.prop.fullscreen;
    }
  }

  /**
   * @summary Flags the view has changed for the next render
   */
  needsUpdate() {
    this.prop.needsUpdate = true;
  }

  /**
   * @summary Resizes the canvas when the window is resized
   * @fires PSV.size-updated
   */
  autoSize() {
    if (this.container.clientWidth !== this.prop.size.width || this.container.clientHeight !== this.prop.size.height) {
      this.prop.size.width = Math.round(this.container.clientWidth);
      this.prop.size.height = Math.round(this.container.clientHeight);
      this.prop.aspect = this.prop.size.width / this.prop.size.height;
      this.prop.hFov = this.dataHelper.vFovToHFov(this.prop.vFov);

      this.trigger(EVENTS.SIZE_UPDATED, this.getSize());
      this.__resizeRefresh();
    }
  }

  /**
   * @summary Loads a new panorama file
   * @description Loads a new panorama file, optionally changing the camera position/zoom and activating the transition animation.<br>
   * If the "options" parameter is not defined, the camera will not move and the ongoing animation will continue.<br>
   * If another loading is already in progress it will be aborted.
   * @param {*} path - URL of the new panorama file
   * @param {PSV.PanoramaOptions} [options]
   * @returns {Promise<boolean>} resolves false if the loading was aborted by another call
   */
  setPanorama(path, options = {}) {
    this.textureLoader.abortLoading();
    this.prop.transitionAnimation?.cancel();

    // apply default parameters on first load
    if (!this.prop.ready) {
      ['sphereCorrection', 'panoData', 'overlay', 'overlayOpacity'].forEach((opt) => {
        if (!(opt in options)) {
          options[opt] = this.config[opt];
        }
      });
    }

    if (options.transition === undefined || options.transition === true) {
      options.transition = DEFAULT_TRANSITION;
    }
    if (options.showLoader === undefined) {
      options.showLoader = true;
    }
    if (options.caption === undefined) {
      options.caption = this.config.caption;
    }
    if (options.description === undefined) {
      options.description = this.config.description;
    }
    if (!options.panoData && typeof this.config.panoData === 'function') {
      options.panoData = this.config.panoData;
    }

    const positionProvided = isExtendedPosition(options);
    const zoomProvided = 'zoom' in options;

    if (positionProvided || zoomProvided) {
      this.__stopAll();
    }

    this.hideError();

    this.config.panorama = path;
    this.config.caption = options.caption;
    this.config.description = options.description;

    const done = (err) => {
      this.loader.hide();

      this.prop.loadingPromise = null;

      if (isAbortError(err)) {
        return false;
      }
      else if (err) {
        this.navbar.setCaption('');
        this.showError(this.config.lang.loadError);
        console.error(err);
        throw err;
      }
      else {
        this.resetIdleTimer();
        this.setOverlay(options.overlay, options.overlayOpacity);
        this.navbar.setCaption(this.config.caption);
        return true;
      }
    };

    this.navbar.setCaption(`<em>${this.config.loadingTxt || ''}</em>`);
    if (options.showLoader || !this.prop.ready) {
      this.loader.show();
    }

    const loadingPromise = this.adapter.loadTexture(this.config.panorama, options.panoData)
      .then((textureData) => {
        // check if another panorama was requested
        if (textureData.panorama !== this.config.panorama) {
          this.adapter.disposeTexture(textureData);
          throw getAbortError();
        }
        return textureData;
      });

    if (!options.transition || !this.prop.ready || !this.adapter.supportsTransition(this.config.panorama)) {
      this.prop.loadingPromise = loadingPromise
        .then((textureData) => {
          this.renderer.show();
          this.renderer.setTexture(textureData);
          this.renderer.setPanoramaPose(textureData.panoData);
          this.renderer.setSphereCorrection(options.sphereCorrection);

          if (zoomProvided) {
            this.zoom(options.zoom);
          }
          if (positionProvided) {
            this.rotate(options);
          }
        })
        .then(done, done);
    }
    else {
      this.prop.loadingPromise = loadingPromise
        .then((textureData) => {
          this.loader.hide();

          this.prop.transitionAnimation = this.renderer.transition(textureData, options);
          return this.prop.transitionAnimation;
        })
        .then((completed) => {
          this.prop.transitionAnimation = null;
          if (!completed) {
            throw getAbortError();
          }
        })
        .then(done, done);
    }

    return this.prop.loadingPromise;
  }

  /**
   * @summary Loads a new overlay
   * @param {*} path - URL of the new overlay file
   * @param {number} [opacity=1]
   * @returns {Promise}
   */
  setOverlay(path, opacity = 1) {
    if (!path) {
      if (this.adapter.constructor.supportsOverlay) {
        this.renderer.setOverlay(null, 0);
      }

      return Promise.resolve();
    }
    else {
      if (!this.adapter.constructor.supportsOverlay) {
        return Promise.reject(new PSVError(`${this.adapter.constructor.id} adapter does not supports overlay`));
      }

      return this.adapter.loadTexture(path, (image) => {
        const p = this.prop.panoData;
        const r = image.width / p.croppedWidth;
        return {
          fullWidth    : r * p.fullWidth,
          fullHeight   : r * p.fullHeight,
          croppedWidth : r * p.croppedWidth,
          croppedHeight: r * p.croppedHeight,
          croppedX     : r * p.croppedX,
          croppedY     : r * p.croppedY,
        };
      }, false)
        .then((textureData) => {
          this.renderer.setOverlay(textureData, opacity);
        });
    }
  }

  /**
   * @summary Update options
   * @param {PSV.Options} options
   * @fires PSV.config-changed
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  setOptions(options) {
    const rawConfig = {
      ...this.config,
      ...options,
    };

    each(options, (value, key) => {
      if (DEPRECATED_OPTIONS[key]) {
        logWarn(DEPRECATED_OPTIONS[key]);
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
        throw new PSVError(`Unknown option ${key}`);
      }

      if (READONLY_OPTIONS[key]) {
        throw new PSVError(READONLY_OPTIONS[key]);
      }

      if (CONFIG_PARSERS[key]) {
        this.config[key] = CONFIG_PARSERS[key](value, rawConfig);
      }
      else {
        this.config[key] = value;
      }

      switch (key) {
        case 'overlay':
        case 'overlayOpacity':
          this.setOverlay(this.config.overlay, this.config.overlayOpacity);
          break;

        case 'caption':
        case 'description':
          this.navbar.setCaption(this.config.caption);
          break;

        case 'size':
          this.resize(value);
          break;

        case 'sphereCorrection':
          this.renderer.setSphereCorrection(value);
          break;

        case 'navbar':
        case 'lang':
          this.navbar.setButtons(this.config.navbar);
          break;

        case 'moveSpeed':
        case 'zoomSpeed':
          this.__updateSpeeds();
          break;

        case 'minFov':
        case 'maxFov':
          this.dynamics.zoom.setValue(this.dataHelper.fovToZoomLevel(this.prop.vFov));
          this.trigger(EVENTS.ZOOM_UPDATED, this.getZoomLevel());
          break;

        case 'canvasBackground':
          this.renderer.canvasContainer.style.background = this.config.canvasBackground;
          break;

        case 'autorotateIdle':
          this.resetIdleTimer();
          break;

        default:
          break;
      }
    });

    this.needsUpdate();
    this.refreshUi('set options');

    this.trigger(EVENTS.CONFIG_CHANGED, Object.keys(options));
  }

  /**
   * @summary Update options
   * @param {string} option
   * @param {any} value
   * @fires PSV.config-changed
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  setOption(option, value) {
    this.setOptions({ [option]: value });
  }

  /**
   * @summary Restarts the idle timer (if `autorotateIdle=true`)
   * @package
   */
  resetIdleTimer() {
    this.prop.idleTime = this.config.autorotateIdle ? performance.now() : -1;
  }

  /**
   * @summary Stops the idle timer
   * @package
   */
  disableIdleTimer() {
    this.prop.idleTime = -1;
  }

  /**
   * @summary Starts the automatic rotation
   * @fires PSV.autorotate
   */
  startAutorotate(refresh = false) {
    if (refresh && !this.isAutorotateEnabled()) {
      return;
    }
    if (!refresh && this.isAutorotateEnabled()) {
      return;
    }

    if (!refresh) {
      this.__stopAll();
    }

    this.dynamics.position.roll({
      longitude: this.config.autorotateSpeed < 0,
    }, Math.abs(this.config.autorotateSpeed / this.config.moveSpeed));

    this.dynamics.position.goto({
      latitude: this.config.autorotateLat,
    }, Math.abs(this.config.autorotateSpeed / this.config.moveSpeed));

    if (this.config.autorotateZoomLvl !== null) {
      this.dynamics.zoom.goto(this.config.autorotateZoomLvl);
    }

    this.prop.autorotateEnabled = true;

    if (!refresh) {
      this.trigger(EVENTS.AUTOROTATE, true);
    }
  }

  /**
   * @summary Stops the automatic rotation
   * @fires PSV.autorotate
   */
  stopAutorotate() {
    if (this.isAutorotateEnabled()) {
      this.dynamics.position.stop();
      this.dynamics.zoom.stop();

      this.prop.autorotateEnabled = false;

      this.trigger(EVENTS.AUTOROTATE, false);
    }
  }

  /**
   * @summary Starts or stops the automatic rotation
   * @fires PSV.autorotate
   */
  toggleAutorotate() {
    if (this.isAutorotateEnabled()) {
      this.stopAutorotate();
    }
    else {
      this.startAutorotate();
    }
  }

  /**
   * @summary Displays an error message over the viewer
   * @param {string} message
   */
  showError(message) {
    this.overlay.show({
      id         : IDS.ERROR,
      image      : errorIcon,
      text       : message,
      dissmisable: false,
    });
  }

  /**
   * @summary Hides the error message
   */
  hideError() {
    this.overlay.hide(IDS.ERROR);
  }

  /**
   * @summary Rotates the view to specific longitude and latitude
   * @param {PSV.ExtendedPosition} position
   * @fires PSV.before-rotate
   * @fires PSV.position-updated
   */
  rotate(position) {
    const e = this.trigger(EVENTS.BEFORE_ROTATE, position);
    if (e.isDefaultPrevented()) {
      return;
    }

    const cleanPosition = this.change(CHANGE_EVENTS.GET_ROTATE_POSITION, this.dataHelper.cleanPosition(position));
    this.dynamics.position.setValue(cleanPosition);
  }

  /**
   * @summary Rotates and zooms the view with a smooth animation
   * @param {PSV.AnimateOptions} options - position and/or zoom level
   * @returns {PSV.utils.Animation}
   */
  animate(options) {
    this.__stopAll();

    const positionProvided = isExtendedPosition(options);
    const zoomProvided = options.zoom !== undefined;

    const animProperties = {};
    let duration;

    // clean/filter position and compute duration
    if (positionProvided) {
      const cleanPosition = this.change(CHANGE_EVENTS.GET_ANIMATE_POSITION, this.dataHelper.cleanPosition(options));
      const currentPosition = this.getPosition();

      // longitude offset for shortest arc
      const tOffset = getShortestArc(currentPosition.longitude, cleanPosition.longitude);

      animProperties.longitude = { start: currentPosition.longitude, end: currentPosition.longitude + tOffset };
      animProperties.latitude = { start: currentPosition.latitude, end: cleanPosition.latitude };

      duration = this.dataHelper.speedToDuration(options.speed, getAngle(currentPosition, cleanPosition));
    }

    // clean/filter zoom and compute duration
    if (zoomProvided) {
      const dZoom = Math.abs(options.zoom - this.getZoomLevel());

      animProperties.zoom = { start: this.getZoomLevel(), end: options.zoom };

      if (!duration) {
        // if animating zoom only and a speed is given, use an arbitrary PI/4 to compute the duration
        duration = this.dataHelper.speedToDuration(options.speed, Math.PI / 4 * dZoom / 100);
      }
    }

    // if no animation needed
    if (!duration) {
      if (positionProvided) {
        this.rotate(options);
      }
      if (zoomProvided) {
        this.zoom(options.zoom);
      }

      return new Animation();
    }

    this.prop.animationPromise = new Animation({
      properties: animProperties,
      duration  : Math.max(ANIMATION_MIN_DURATION, duration),
      easing    : 'inOutSine',
      onTick    : (properties) => {
        if (positionProvided) {
          this.rotate(properties);
        }
        if (zoomProvided) {
          this.zoom(properties.zoom);
        }
      },
    });

    this.prop.animationPromise.then(() => {
      this.prop.animationPromise = null;
      this.resetIdleTimer();
    });

    return this.prop.animationPromise;
  }

  /**
   * @summary Stops the ongoing animation
   * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
   * @returns {Promise} Resolved when the animation has ben cancelled
   */
  stopAnimation() {
    if (this.prop.animationPromise) {
      this.prop.animationPromise.cancel();
      return this.prop.animationPromise;
    }
    else {
      return Promise.resolve();
    }
  }

  /**
   * @summary Zooms to a specific level between `max_fov` and `min_fov`
   * @param {number} level - new zoom level from 0 to 100
   * @fires PSV.zoom-updated
   */
  zoom(level) {
    this.dynamics.zoom.setValue(level);
  }

  /**
   * @summary Increases the zoom level
   * @param {number} [step=1]
   */
  zoomIn(step = 1) {
    this.dynamics.zoom.step(step);
  }

  /**
   * @summary Decreases the zoom level
   * @param {number} [step=1]
   */
  zoomOut(step = 1) {
    this.dynamics.zoom.step(-step);
  }

  /**
   * @summary Resizes the viewer
   * @param {PSV.CssSize} size
   */
  resize(size) {
    ['width', 'height'].forEach((dim) => {
      if (size && size[dim]) {
        if (/^[0-9.]+$/.test(size[dim])) {
          size[dim] += 'px';
        }
        this.parent.style[dim] = size[dim];
      }
    });

    this.autoSize();
  }

  /**
   * @summary Enters the fullscreen mode
   * @fires PSV.fullscreen-updated
   */
  enterFullscreen() {
    if (SYSTEM.fullscreenEvent) {
      requestFullscreen(this.container);
    }
    else {
      this.container.classList.add('psv-container--fullscreen');
      this.autoSize();
      this.eventsHandler.__fullscreenToggled(true);
    }
  }

  /**
   * @summary Exits the fullscreen mode
   * @fires PSV.fullscreen-updated
   */
  exitFullscreen() {
    if (this.isFullscreenEnabled()) {
      if (SYSTEM.fullscreenEvent) {
        exitFullscreen();
      }
      else {
        this.container.classList.remove('psv-container--fullscreen');
        this.autoSize();
        this.eventsHandler.__fullscreenToggled(false);
      }
    }
  }

  /**
   * @summary Enters or exits the fullscreen mode
   * @fires PSV.fullscreen-updated
   */
  toggleFullscreen() {
    if (!this.isFullscreenEnabled()) {
      this.enterFullscreen();
    }
    else {
      this.exitFullscreen();
    }
  }

  /**
   * @summary Enables the keyboard controls (done automatically when entering fullscreen)
   */
  startKeyboardControl() {
    this.eventsHandler.enableKeyboard();
  }

  /**
   * @summary Disables the keyboard controls (done automatically when exiting fullscreen)
   */
  stopKeyboardControl() {
    this.eventsHandler.disableKeyboard();
  }

  /**
   * @summary Subscribes to events on objects in the scene
   * @param {string} userDataKey - only objects with the following `userData` will be emitted
   * @param {EventListener} listener - must implement `handleEvent`
   * @return {function} call to stop the subscription
   * @package
   */
  observeObjects(userDataKey, listener) {
    this.prop.objectsObservers[userDataKey] = { listener };

    return () => {
      delete this.prop.objectsObservers[userDataKey];
    };
  }

  /**
   * @summary Stops all current animations
   * @returns {Promise}
   * @package
   */
  __stopAll() {
    this.trigger(EVENTS.STOP_ALL);

    this.disableIdleTimer();
    this.stopAutorotate();
    return this.stopAnimation();
  }

  /**
   * @summary Recomputes dynamics speeds
   * @private
   */
  __updateSpeeds() {
    this.dynamics.zoom.setSpeed(this.config.zoomSpeed * 50);
    this.dynamics.position.setSpeed(MathUtils.degToRad(this.config.moveSpeed * 50));
  }

}
