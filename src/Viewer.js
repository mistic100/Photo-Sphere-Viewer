import * as THREE from 'three';
import { EventEmitter } from 'uevent';
import { Animation } from './Animation';
import { Loader } from './components/Loader';
import { Navbar } from './components/Navbar';
import { Notification } from './components/Notification';
import { Overlay } from './components/Overlay';
import { Panel } from './components/Panel';
import { CONFIG_PARSERS, DEFAULTS, getConfig, READONLY_OPTIONS } from './data/config';
import { CHANGE_EVENTS, EVENTS, IDS, VIEWER_DATA } from './data/constants';
import { SYSTEM } from './data/system';
import errorIcon from './icons/error.svg';
import { PSVError } from './PSVError';
import { DataHelper } from './services/DataHelper';
import { EventsHandler } from './services/EventsHandler';
import { Renderer } from './services/Renderer';
import { TextureLoader } from './services/TextureLoader';
import { TooltipRenderer } from './services/TooltipRenderer';
import './styles/viewer.scss';
import {
  bound,
  each,
  exitFullscreen,
  getAngle,
  getShortestArc,
  isFullscreenEnabled,
  requestFullscreen,
  throttle,
  toggleClass
} from './utils';

THREE.Cache.enabled = true;

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

    if (SYSTEM.maxCanvasWidth === 0 || SYSTEM.maxTextureWidth === 0) {
      throw new PSVError('Unable to detect system capabilities');
    }

    /**
     * @summary Internal properties
     * @member {Object}
     * @protected
     * @property {boolean} ready - when all components are loaded
     * @property {boolean} needsUpdate - if the view needs to be renderer
     * @property {boolean} isCubemap - if the panorama is a cubemap
     * @property {PSV.Position} position - current direction of the camera
     * @property {external:THREE.Vector3} direction - direction of the camera
     * @property {number} zoomLvl - current zoom level
     * @property {number} vFov - vertical FOV
     * @property {number} hFov - horizontal FOV
     * @property {number} aspect - viewer aspect ratio
     * @property {number} moveSpeed - move speed (computed with pixel ratio and configuration moveSpeed)
     * @property {Function} autorotateCb - update callback of the automatic rotation
     * @property {PSV.Animation} animationPromise - promise of the current animation (either go to position or image transition)
     * @property {Promise} loadingPromise - promise of the setPanorama method
     * @property startTimeout - timeout id of the automatic rotation delay
     * @property {PSV.Size} size - size of the container
     * @property {PSV.PanoData} panoData - panorama metadata
     */
    this.prop = {
      ready           : false,
      uiRefresh       : false,
      needsUpdate     : false,
      fullscreen      : false,
      isCubemap       : undefined,
      position        : {
        longitude: 0,
        latitude : 0,
      },
      direction       : null,
      zoomLvl         : null,
      vFov            : null,
      hFov            : null,
      aspect          : null,
      moveSpeed       : 0.1,
      autorotateCb    : null,
      animationPromise: null,
      loadingPromise  : null,
      startTimeout    : null,
      size            : {
        width : 0,
        height: 0,
      },
      panoData        : {
        fullWidth    : 0,
        fullHeight   : 0,
        croppedWidth : 0,
        croppedHeight: 0,
        croppedX     : 0,
        croppedY     : 0,
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
     * @summary Main render controller
     * @type {PSV.services.Renderer}
     * @readonly
     */
    this.renderer = new Renderer(this);

    /**
     * @summary Textures loader
     * @type {PSV.services.TextureLoader}
     * @readonly
     */
    this.textureLoader = new TextureLoader(this);

    /**
     * @summary Main event handler
     * @type {PSV.services.EventsHandler}
     * @readonly
     */
    this.eventsHandler = new EventsHandler(this);

    /**
     * @summary Utilities to help converting data
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

    this.eventsHandler.init();

    this.__resizeRefresh = throttle(() => this.refreshUi('resize'), 500);

    // apply container size
    this.resize(this.config.size);

    // actual move speed depends on pixel-ratio
    this.prop.moveSpeed = THREE.Math.degToRad(this.config.moveSpeed / SYSTEM.pixelRatio);

    // init plugins
    this.config.plugins.forEach(([plugin, opts]) => {
      this.plugins[plugin.id] = new plugin(this, opts); // eslint-disable-line new-cap
    });

    // init buttons
    this.navbar.setButtons(this.config.navbar);

    // load panorama
    if (this.config.panorama) {
      this.setPanorama(this.config.panorama);
    }

    SYSTEM.isTouchEnabled.then(enabled => toggleClass(this.container, 'psv--is-touch', enabled));

    // enable GUI after first render
    this.once(EVENTS.RENDER, () => {
      if (this.config.navbar) {
        this.container.classList.add('psv--has-navbar');
        this.navbar.show();
      }

      // Queue autorotate
      if (this.config.autorotateDelay) {
        this.prop.startTimeout = setTimeout(() => this.startAutorotate(), this.config.autorotateDelay);
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

    this.eventsHandler.destroy();
    this.renderer.destroy();
    this.textureLoader.destroy();
    this.dataHelper.destroy();

    this.children.slice().forEach(child => child.destroy());
    this.children.length = 0;

    each(this.plugins, plugin => plugin.destroy());
    delete this.plugins;

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
    return pluginId ? this.plugins[typeof pluginId === 'function' ? pluginId.id : pluginId] : null;
  }

  /**
   * @summary Returns the current position of the camera
   * @returns {PSV.Position}
   */
  getPosition() {
    return {
      longitude: this.prop.position.longitude,
      latitude : this.prop.position.latitude,
    };
  }

  /**
   * @summary Returns the current zoom level
   * @returns {number}
   */
  getZoomLevel() {
    return this.prop.zoomLvl;
  }

  /**
   * @summary Returns the current viewer size
   * @returns {PSV.Size}
   */
  getSize() {
    return {
      width : this.prop.size.width,
      height: this.prop.size.height,
    };
  }

  /**
   * @summary Checks if the automatic rotation is enabled
   * @returns {boolean}
   */
  isAutorotateEnabled() {
    return !!this.prop.autorotateCb;
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

    if (!this.renderer.mainReqid && this.renderer.renderer) {
      this.renderer.__renderLoop(+new Date());
    }
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

      this.needsUpdate();
      this.trigger(EVENTS.SIZE_UPDATED, this.getSize());
      this.__resizeRefresh();
    }
  }

  /**
   * @summary Loads a new panorama file
   * @description Loads a new panorama file, optionally changing the camera position/zoom and activating the transition animation.<br>
   * If the "options" parameter is not defined, the camera will not move and the ongoing animation will continue.<br>
   * If another loading is already in progress it will be aborted.
   * @param {string|string[]|PSV.Cubemap} path - URL of the new panorama file
   * @param {PSV.PanoramaOptions} [options]
   * @returns {Promise}
   */
  setPanorama(path, options = {}) {
    if (this.prop.loadingPromise !== null) {
      this.textureLoader.abortLoading();
    }

    if (!this.prop.ready) {
      if (!('longitude' in options) && !this.prop.isCubemap) {
        options.longitude = this.config.defaultLong;
      }
      if (!('latitude' in options) && !this.prop.isCubemap) {
        options.latitude = this.config.defaultLat;
      }
      if (!('zoom' in options)) {
        options.zoom = this.config.defaultZoomLvl;
      }
      if (!('sphereCorrection' in options)) {
        options.sphereCorrection = this.config.sphereCorrection;
      }
      if (!('panoData' in options)) {
        options.panoData = this.config.panoData;
      }
    }

    if (options.transition === undefined || options.transition === true) {
      options.transition = 1500;
    }
    if (options.showLoader === undefined) {
      options.showLoader = true;
    }

    const positionProvided = this.dataHelper.isExtendedPosition(options);
    const zoomProvided = 'zoom' in options;

    if (positionProvided || zoomProvided) {
      this.__stopAll();
    }

    this.hideError();

    this.config.panorama = path;

    const done = (err) => {
      if (err && err.type === 'abort') {
        console.warn(err);
      }
      else if (err) {
        this.showError(this.config.lang.loadError);
        console.error(err);
      }

      this.loader.hide();
      this.renderer.show();

      this.prop.loadingPromise = null;

      if (err) {
        return Promise.reject(err);
      }
      else {
        return true;
      }
    };

    if (!options.transition || !this.prop.ready) {
      if (options.showLoader || !this.prop.ready) {
        this.loader.show();
      }

      this.prop.loadingPromise = this.textureLoader.loadTexture(this.config.panorama, options.panoData)
        .then((textureData) => {
          this.renderer.setTexture(textureData);

          if (options.sphereCorrection) {
            this.renderer.setSphereCorrection(options.sphereCorrection);
          }
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
      if (options.showLoader) {
        this.loader.show();
      }

      this.prop.loadingPromise = this.textureLoader.loadTexture(this.config.panorama)
        .then((textureData) => {
          this.loader.hide();

          return this.renderer.transition(textureData, options);
        })
        .then(done, done);
    }

    return this.prop.loadingPromise;
  }

  /**
   * @summary Update options
   * @param {PSV.Options} options
   * @fires PSV.config-changed
   */
  setOptions(options) {
    each(options, (value, key) => {
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
        throw new PSVError(`Unknown option ${key}`);
      }

      if (READONLY_OPTIONS[key]) {
        throw new PSVError(READONLY_OPTIONS[key]);
      }

      if (CONFIG_PARSERS[key]) {
        this.config[key] = CONFIG_PARSERS[key](value, options);
      }
      else {
        this.config[key] = value;
      }

      switch (key) {
        case 'caption':
          this.navbar.setCaption(value);
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
          this.prop.moveSpeed = THREE.Math.degToRad(value / SYSTEM.pixelRatio);
          break;

        case 'minFov':
        case 'maxFov':
          this.prop.zoomLvl = this.dataHelper.fovToZoomLevel(this.prop.vFov);
          this.trigger(EVENTS.ZOOM_UPDATED, this.getZoomLevel());
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
   */
  setOption(option, value) {
    this.setOptions({ [option]: value });
  }

  /**
   * @summary Starts the automatic rotation
   * @fires PSV.autorotate
   */
  startAutorotate() {
    this.__stopAll();

    this.prop.autorotateCb = (() => {
      let last;
      let elapsed;

      return (e, timestamp) => {
        elapsed = last === undefined ? 0 : timestamp - last;
        last = timestamp;

        this.rotate({
          longitude: this.prop.position.longitude + this.config.autorotateSpeed * elapsed / 1000,
          latitude : this.prop.position.latitude - (this.prop.position.latitude - this.config.autorotateLat) / 200,
        });
      };
    })();

    this.on(EVENTS.BEFORE_RENDER, this.prop.autorotateCb);

    this.trigger(EVENTS.AUTOROTATE, true);
  }

  /**
   * @summary Stops the automatic rotation
   * @fires PSV.autorotate
   */
  stopAutorotate() {
    if (this.prop.startTimeout) {
      clearTimeout(this.prop.startTimeout);
      this.prop.startTimeout = null;
    }

    if (this.isAutorotateEnabled()) {
      this.off(EVENTS.BEFORE_RENDER, this.prop.autorotateCb);
      this.prop.autorotateCb = null;

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
   * @summary Displays an error message
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

    if (this.prop.position.longitude !== cleanPosition.longitude || this.prop.position.latitude !== cleanPosition.latitude) {
      this.prop.position.longitude = cleanPosition.longitude;
      this.prop.position.latitude = cleanPosition.latitude;

      this.needsUpdate();

      this.trigger(EVENTS.POSITION_UPDATED, this.getPosition());
    }
  }

  /**
   * @summary Rotates and zooms the view with a smooth animation
   * @param {PSV.AnimateOptions} options - position and/or zoom level
   * @returns {PSV.Animation}
   */
  animate(options) {
    this.__stopAll();

    const positionProvided = this.dataHelper.isExtendedPosition(options);
    const zoomProvided = 'zoom' in options;

    const animProperties = {};
    let duration;

    // clean/filter position and compute duration
    if (positionProvided) {
      const cleanPosition = this.change(CHANGE_EVENTS.GET_ANIMATE_POSITION, this.dataHelper.cleanPosition(options));

      // longitude offset for shortest arc
      const tOffset = getShortestArc(this.prop.position.longitude, cleanPosition.longitude);

      animProperties.longitude = { start: this.prop.position.longitude, end: this.prop.position.longitude + tOffset };
      animProperties.latitude = { start: this.prop.position.latitude, end: cleanPosition.latitude };

      duration = this.dataHelper.speedToDuration(options.speed, getAngle(this.prop.position, cleanPosition));
    }

    // clean/filter zoom and compute duration
    if (zoomProvided) {
      const dZoom = Math.abs(options.zoom - this.prop.zoomLvl);

      animProperties.zoom = { start: this.prop.zoomLvl, end: options.zoom };

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

      return Animation.resolve();
    }

    this.prop.animationPromise = new Animation({
      properties: animProperties,
      duration  : duration,
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

    return this.prop.animationPromise;
  }

  /**
   * @summary Stops the ongoing animation
   * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
   * @returns {Promise} Resolved when the animation has ben cancelled
   */
  stopAnimation() {
    if (this.prop.animationPromise) {
      return new Promise((resolve) => {
        this.prop.animationPromise.finally(resolve);
        this.prop.animationPromise.cancel();
        this.prop.animationPromise = null;
      });
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
    const newZoomLvl = bound(level, 0, 100);

    if (this.prop.zoomLvl !== newZoomLvl) {
      this.prop.zoomLvl = newZoomLvl;
      this.prop.vFov = this.dataHelper.zoomLevelToFov(this.prop.zoomLvl);
      this.prop.hFov = this.dataHelper.vFovToHFov(this.prop.vFov);

      this.needsUpdate();
      this.trigger(EVENTS.ZOOM_UPDATED, this.getZoomLevel());
      this.rotate(this.prop.position);
    }
  }

  /**
   * @summary Increases the zoom level by 1
   */
  zoomIn() {
    this.zoom(this.prop.zoomLvl + this.config.zoomButtonIncrement);
  }

  /**
   * @summary Decreases the zoom level by 1
   */
  zoomOut() {
    this.zoom(this.prop.zoomLvl - this.config.zoomButtonIncrement);
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
   * @summary Stops all current animations
   * @private
   */
  __stopAll() {
    this.stopAutorotate();
    this.stopAnimation();

    this.trigger(EVENTS.STOP_ALL);
  }

}
