/*!
* Photo Sphere Viewer 4.8.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('uevent')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'uevent'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.PhotoSphereViewer = {}, global.THREE, global.uEvent));
})(this, (function (exports, three, uevent) { 'use strict';

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };
    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  /**
   * @summary Custom error used in the lib
   * @param {string} message
   * @constructor
   * @memberOf PSV
   */
  function PSVError(message) {
    this.message = message; // Use V8's native method if available, otherwise fallback

    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, PSVError);
    } else {
      this.stack = new Error().stack;
    }
  }

  PSVError.prototype = Object.create(Error.prototype);
  PSVError.prototype.name = 'PSVError';
  PSVError.prototype.constructor = PSVError;

  /**
   * @namespace PSV.adapters
   */

  /**
   * @summary Base adapters class
   * @memberof PSV.adapters
   * @abstract
   */

  var AbstractAdapter = /*#__PURE__*/function () {
    /**
     * @summary Unique identifier of the adapter
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @summary Indicates if the adapter supports panorama download natively
     * @type {boolean}
     * @readonly
     * @static
     */

    /**
     * @summary Indicated if the adapter can display an additional transparent image above the panorama
     * @type {boolean}
     */

    /**
     * @param {PSV.Viewer} psv
     */
    function AbstractAdapter(psv) {
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */
      this.psv = psv;
    }
    /**
     * @summary Destroys the adapter
     */


    var _proto = AbstractAdapter.prototype;

    _proto.destroy = function destroy() {
      delete this.psv;
    }
    /**
     * @summary Indicates if the adapter supports transitions between panoramas
     * @param {*} panorama
     * @return {boolean}
     */
    ;

    _proto.supportsTransition = function supportsTransition(panorama) {
      // eslint-disable-line no-unused-vars
      return false;
    }
    /**
     * @summary Indicates if the adapter supports preload of a panorama
     * @param {*} panorama
     * @return {boolean}
     */
    ;

    _proto.supportsPreload = function supportsPreload(panorama) {
      // eslint-disable-line no-unused-vars
      return false;
    }
    /**
     * @abstract
     * @summary Loads the panorama texture(s)
     * @param {*} panorama
     * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
     * @param {boolean} [useXmpPanoData]
     * @returns {Promise.<PSV.TextureData>}
     */
    ;

    _proto.loadTexture = function loadTexture(panorama, newPanoData, useXmpPanoData) {
      // eslint-disable-line no-unused-vars
      throw new PSVError('loadTexture not implemented');
    }
    /**
     * @abstract
     * @summary Creates the cube mesh
     * @param {number} [scale=1]
     * @returns {external:THREE.Mesh}
     */
    ;

    _proto.createMesh = function createMesh(scale) {

      // eslint-disable-line no-unused-vars
      throw new PSVError('createMesh not implemented');
    }
    /**
     * @abstract
     * @summary Applies the texture to the mesh
     * @param {external:THREE.Mesh} mesh
     * @param {PSV.TextureData} textureData
     * @param {boolean} [transition=false]
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData, transition) {

      // eslint-disable-line no-unused-vars
      throw new PSVError('setTexture not implemented');
    }
    /**
     * @abstract
     * @summary Changes the opacity of the mesh
     * @param {external:THREE.Mesh} mesh
     * @param {number} opacity
     */
    ;

    _proto.setTextureOpacity = function setTextureOpacity(mesh, opacity) {
      // eslint-disable-line no-unused-vars
      throw new PSVError('setTextureOpacity not implemented');
    }
    /**
     * @abstract
     * @summary Clear a loaded texture from memory
     * @param {PSV.TextureData} textureData
     */
    ;

    _proto.disposeTexture = function disposeTexture(textureData) {
      // eslint-disable-line no-unused-vars
      throw new PSVError('disposeTexture not implemented');
    }
    /**
     * @abstract
     * @summary Applies the overlay to the mesh
     * @param {external:THREE.Mesh} mesh
     * @param {PSV.TextureData} textureData
     * @param {number} opacity
     */
    ;

    _proto.setOverlay = function setOverlay(mesh, textureData, opacity) {
      // eslint-disable-line no-unused-vars
      throw new PSVError('setOverlay not implemented');
    }
    /**
     * @internal
     */
    ;

    /**
     * @internal
     */
    AbstractAdapter.createOverlayMaterial = function createOverlayMaterial(_temp) {
      var _extends2;

      var _ref = _temp === void 0 ? {} : _temp,
          additionalUniforms = _ref.additionalUniforms,
          overrideVertexShader = _ref.overrideVertexShader;

      return new three.ShaderMaterial({
        uniforms: _extends({}, additionalUniforms, (_extends2 = {}, _extends2[AbstractAdapter.OVERLAY_UNIFORMS.panorama] = {
          value: new three.Texture()
        }, _extends2[AbstractAdapter.OVERLAY_UNIFORMS.overlay] = {
          value: new three.Texture()
        }, _extends2[AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity] = {
          value: 1.0
        }, _extends2[AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity] = {
          value: 1.0
        }, _extends2)),
        vertexShader: overrideVertexShader || "\nvarying vec2 vUv;\n\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );\n}",
        fragmentShader: "\nuniform sampler2D " + AbstractAdapter.OVERLAY_UNIFORMS.panorama + ";\nuniform sampler2D " + AbstractAdapter.OVERLAY_UNIFORMS.overlay + ";\nuniform float " + AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity + ";\nuniform float " + AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity + ";\n\nvarying vec2 vUv;\n\nvoid main() {\n  vec4 tColor1 = texture2D( " + AbstractAdapter.OVERLAY_UNIFORMS.panorama + ", vUv );\n  vec4 tColor2 = texture2D( " + AbstractAdapter.OVERLAY_UNIFORMS.overlay + ", vUv );\n  gl_FragColor = vec4(\n    mix( tColor1.rgb, tColor2.rgb, tColor2.a * " + AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity + " ),\n    " + AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity + "\n  );\n}"
      });
    };

    return AbstractAdapter;
  }();
  AbstractAdapter.id = null;
  AbstractAdapter.supportsDownload = false;
  AbstractAdapter.supportsOverlay = false;
  AbstractAdapter.OVERLAY_UNIFORMS = {
    panorama: 'panorama',
    overlay: 'overlay',
    globalOpacity: 'globalOpacity',
    overlayOpacity: 'overlayOpacity'
  };

  /**
   * @namespace PSV.constants
   */

  /**
   * @summary Default duration of the transition between panoramas
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */
  var DEFAULT_TRANSITION = 1500;
  /**
   * @summary Minimum duration of the animations created with {@link Viewer#animate}
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var ANIMATION_MIN_DURATION = 500;
  /**
   * @summary Number of pixels bellow which a mouse move will be considered as a click
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var MOVE_THRESHOLD = 4;
  /**
   * @summary Delay in milliseconds between two clicks to consider a double click
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var DBLCLICK_DELAY = 300;
  /**
   * @summary Delay in milliseconds to emulate a long touch
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var LONGTOUCH_DELAY = 500;
  /**
   * @summary Delay in milliseconds to for the two fingers overlay to appear
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var TWOFINGERSOVERLAY_DELAY = 100;
  /**
   * @summary Duration in milliseconds of the "ctrl zoom" overlay
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var CTRLZOOM_TIMEOUT = 2000;
  /**
   * @summary Time size of the mouse position history used to compute inertia
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var INERTIA_WINDOW = 300;
  /**
   * @summary Radius of the THREE.SphereGeometry, Half-length of the THREE.BoxGeometry
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var SPHERE_RADIUS = 10;
  /**
   * @summary Property name added to viewer element
   * @memberOf PSV.constants
   * @type {string}
   * @constant
   */

  var VIEWER_DATA = 'photoSphereViewer';
  /**
   * @summary Property added the the main Mesh object
   * @memberOf PSV.constants
   * @type {string}
   * @constant
   */

  var MESH_USER_DATA = 'psvSphere';
  /**
   * @summary Available actions
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var ACTIONS = {
    ROTATE_LAT_UP: 'rotateLatitudeUp',
    ROTATE_LAT_DOWN: 'rotateLatitudeDown',
    ROTATE_LONG_RIGHT: 'rotateLongitudeRight',
    ROTATE_LONG_LEFT: 'rotateLongitudeLeft',
    ZOOM_IN: 'zoomIn',
    ZOOM_OUT: 'zoomOut',
    TOGGLE_AUTOROTATE: 'toggleAutorotate'
  };
  /**
   * @summary Available events names
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var EVENTS = {
    /**
     * @event autorotate
     * @memberof PSV
     * @summary Triggered when the automatic rotation is enabled/disabled
     * @param {boolean} enabled
     */
    AUTOROTATE: 'autorotate',

    /**
     * @event before-render
     * @memberof PSV
     * @summary Triggered before a render, used to modify the view
     * @param {number} timestamp - time provided by requestAnimationFrame
     * @param {number} elapsed - time elapsed from the previous frame
     */
    BEFORE_RENDER: 'before-render',

    /**
     * @event before-rotate
     * @memberOf PSV
     * @summary Triggered before a rotate operation, can be cancelled
     * @param {PSV.ExtendedPosition}
     */
    BEFORE_ROTATE: 'before-rotate',

    /**
     * @event click
     * @memberof PSV
     * @summary Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
     * @param {PSV.ClickData} data
     */
    CLICK: 'click',

    /**
     * @event close-panel
     * @memberof PSV
     * @summary Triggered when the panel is closed
     * @param {string} [id]
     */
    CLOSE_PANEL: 'close-panel',

    /**
     * @event config-changed
     * @memberOf PSV
     * @summary Triggered after a call to setOption/setOptions
     * @param {string[]} name of changed options
     */
    CONFIG_CHANGED: 'config-changed',

    /**
     * @event dblclick
     * @memberof PSV
     * @summary Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`
     * @param {PSV.ClickData} data
     */
    DOUBLE_CLICK: 'dblclick',

    /**
     * @event fullscreen-updated
     * @memberof PSV
     * @summary Triggered when the fullscreen mode is enabled/disabled
     * @param {boolean} enabled
     */
    FULLSCREEN_UPDATED: 'fullscreen-updated',

    /**
     * @event hide-notification
     * @memberof PSV
     * @summary Triggered when the notification is hidden
     * @param {string} [id]
     */
    HIDE_NOTIFICATION: 'hide-notification',

    /**
     * @event hide-overlay
     * @memberof PSV
     * @summary Triggered when the overlay is hidden
     * @param {string} [id]
     */
    HIDE_OVERLAY: 'hide-overlay',

    /**
     * @event hide-tooltip
     * @memberof PSV
     * @summary Triggered when the tooltip is hidden
     * @param {*} Data associated to this tooltip
     */
    HIDE_TOOLTIP: 'hide-tooltip',

    /**
     * @event key-press
     * @memberof PSV
     * @summary Triggered when a key is pressed, can be cancelled
     * @param {string} key
     */
    KEY_PRESS: 'key-press',

    /**
     * @event load-progress
     * @memberof PSV
     * @summary Triggered when the loader value changes
     * @param {number} value from 0 to 100
     */
    LOAD_PROGRESS: 'load-progress',

    /**
     * @event open-panel
     * @memberof PSV
     * @summary Triggered when the panel is opened
     * @param {string} [id]
     */
    OPEN_PANEL: 'open-panel',

    /**
     * @event panorama-loaded
     * @memberof PSV
     * @summary Triggered when a panorama image has been loaded
     * @param {PSV.TextureData} textureData
     */
    PANORAMA_LOADED: 'panorama-loaded',

    /**
     * @event position-updated
     * @memberof PSV
     * @summary Triggered when the view longitude and/or latitude changes
     * @param {PSV.Position} position
     */
    POSITION_UPDATED: 'position-updated',

    /**
     * @event ready
     * @memberof PSV
     * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
     */
    READY: 'ready',

    /**
     * @event render
     * @memberof PSV
     * @summary Triggered on each viewer render, **this event is triggered very often**
     */
    RENDER: 'render',

    /**
     * @event show-notification
     * @memberof PSV
     * @summary Triggered when the notification is shown
     * @param {string} [id]
     */
    SHOW_NOTIFICATION: 'show-notification',

    /**
     * @event show-overlay
     * @memberof PSV
     * @summary Triggered when the overlay is shown
     * @param {string} [id]
     */
    SHOW_OVERLAY: 'show-overlay',

    /**
     * @event show-tooltip
     * @memberof PSV
     * @summary Triggered when the tooltip is shown
     * @param {*} Data associated to this tooltip
     * @param {PSV.components.Tooltip} Instance of the tooltip
     */
    SHOW_TOOLTIP: 'show-tooltip',

    /**
     * @event size-updated
     * @memberof PSV
     * @summary Triggered when the viewer size changes
     * @param {PSV.Size} size
     */
    SIZE_UPDATED: 'size-updated',

    /**
     * @event stop-all
     * @memberof PSV
     * @summary Triggered when all current animations are stopped
     */
    STOP_ALL: 'stop-all',

    /**
     * @event zoom-updated
     * @memberof PSV
     * @summary Triggered when the zoom level changes
     * @param {number} zoomLevel
     */
    ZOOM_UPDATED: 'zoom-updated'
  };
  /**
   * @summary Available change events names
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var CHANGE_EVENTS = {
    /**
     * @event get-animate-position
     * @memberof PSV
     * @param {Position} position
     * @returns {Position}
     * @summary Called to alter the target position of an animation
     */
    GET_ANIMATE_POSITION: 'get-animate-position',

    /**
     * @event get-rotate-position
     * @memberof PSV
     * @param {Position} position
     * @returns {Position}
     * @summary Called to alter the target position of a rotation
     */
    GET_ROTATE_POSITION: 'get-rotate-position'
  };
  /**
   * @summary Special events emitted to listener using {@link Viewer#observeObjects}
   * @memberOf PSV.constants
   * @constant
   * @package
   */

  var OBJECT_EVENTS = {
    ENTER_OBJECT: 'enter-object',
    HOVER_OBJECT: 'hover-object',
    LEAVE_OBJECT: 'leave-object'
  };
  /**
   * @summary Internal identifiers for various stuff
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var IDS = {
    MENU: 'menu',
    TWO_FINGERS: 'twoFingers',
    CTRL_ZOOM: 'ctrlZoom',
    ERROR: 'error',
    DESCRIPTION: 'description'
  };
  /* eslint-disable */
  // @formatter:off

  /**
   * @summary Collection of easing functions
   * @memberOf PSV.constants
   * @see {@link https://gist.github.com/frederickk/6165768}
   * @type {Object<string, Function>}
   * @constant
   */

  var EASINGS = {
    linear: function linear(t) {
      return t;
    },
    inQuad: function inQuad(t) {
      return t * t;
    },
    outQuad: function outQuad(t) {
      return t * (2 - t);
    },
    inOutQuad: function inOutQuad(t) {
      return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    inCubic: function inCubic(t) {
      return t * t * t;
    },
    outCubic: function outCubic(t) {
      return --t * t * t + 1;
    },
    inOutCubic: function inOutCubic(t) {
      return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    inQuart: function inQuart(t) {
      return t * t * t * t;
    },
    outQuart: function outQuart(t) {
      return 1 - --t * t * t * t;
    },
    inOutQuart: function inOutQuart(t) {
      return t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    inQuint: function inQuint(t) {
      return t * t * t * t * t;
    },
    outQuint: function outQuint(t) {
      return 1 + --t * t * t * t * t;
    },
    inOutQuint: function inOutQuint(t) {
      return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    },
    inSine: function inSine(t) {
      return 1 - Math.cos(t * (Math.PI / 2));
    },
    outSine: function outSine(t) {
      return Math.sin(t * (Math.PI / 2));
    },
    inOutSine: function inOutSine(t) {
      return .5 - .5 * Math.cos(Math.PI * t);
    },
    inExpo: function inExpo(t) {
      return Math.pow(2, 10 * (t - 1));
    },
    outExpo: function outExpo(t) {
      return 1 - Math.pow(2, -10 * t);
    },
    inOutExpo: function inOutExpo(t) {
      return (t = t * 2 - 1) < 0 ? .5 * Math.pow(2, 10 * t) : 1 - .5 * Math.pow(2, -10 * t);
    },
    inCirc: function inCirc(t) {
      return 1 - Math.sqrt(1 - t * t);
    },
    outCirc: function outCirc(t) {
      return Math.sqrt(1 - (t - 1) * (t - 1));
    },
    inOutCirc: function inOutCirc(t) {
      return (t *= 2) < 1 ? .5 - .5 * Math.sqrt(1 - t * t) : .5 + .5 * Math.sqrt(1 - (t -= 2) * t);
    }
  }; // @formatter:on

  /* eslint-enable */

  /**
   * @summary Subset of key codes
   * @memberOf PSV.constants
   * @type {Object<string, string>}
   * @constant
   */

  var KEY_CODES = {
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
    Minus: '-'
  };

  var constants = /*#__PURE__*/Object.freeze({
    __proto__: null,
    DEFAULT_TRANSITION: DEFAULT_TRANSITION,
    ANIMATION_MIN_DURATION: ANIMATION_MIN_DURATION,
    MOVE_THRESHOLD: MOVE_THRESHOLD,
    DBLCLICK_DELAY: DBLCLICK_DELAY,
    LONGTOUCH_DELAY: LONGTOUCH_DELAY,
    TWOFINGERSOVERLAY_DELAY: TWOFINGERSOVERLAY_DELAY,
    CTRLZOOM_TIMEOUT: CTRLZOOM_TIMEOUT,
    INERTIA_WINDOW: INERTIA_WINDOW,
    SPHERE_RADIUS: SPHERE_RADIUS,
    VIEWER_DATA: VIEWER_DATA,
    MESH_USER_DATA: MESH_USER_DATA,
    ACTIONS: ACTIONS,
    EVENTS: EVENTS,
    CHANGE_EVENTS: CHANGE_EVENTS,
    OBJECT_EVENTS: OBJECT_EVENTS,
    IDS: IDS,
    EASINGS: EASINGS,
    KEY_CODES: KEY_CODES
  });

  var LOCALSTORAGE_TOUCH_SUPPORT = VIEWER_DATA + "_touchSupport";
  /**
   * @summary General information about the system
   * @constant
   * @memberOf PSV
   * @property {boolean} loaded - Indicates if the system data has been loaded
   * @property {Function} load - Loads the system if not already loaded
   * @property {number} pixelRatio
   * @property {boolean} isWebGLSupported
   * @property {number} maxCanvasWidth
   * @property {string} mouseWheelEvent
   * @property {string} fullscreenEvent
   * @property {Function} getMaxCanvasWidth - Returns the max width of a canvas allowed by the browser
   * @property {{initial: boolean, promise: Promise<boolean>}} isTouchEnabled
   */

  var SYSTEM = {
    loaded: false,
    pixelRatio: 1,
    isWebGLSupported: false,
    isTouchEnabled: null,
    maxTextureWidth: 0,
    mouseWheelEvent: null,
    fullscreenEvent: null
  };
  /**
   * @summary Loads the system if not already loaded
   */

  SYSTEM.load = function () {
    if (!SYSTEM.loaded) {
      var ctx = getWebGLCtx();
      SYSTEM.loaded = true;
      SYSTEM.pixelRatio = window.devicePixelRatio || 1;
      SYSTEM.isWebGLSupported = ctx != null;
      SYSTEM.isTouchEnabled = isTouchEnabled();
      SYSTEM.maxTextureWidth = getMaxTextureWidth(ctx);
      SYSTEM.mouseWheelEvent = getMouseWheelEvent();
      SYSTEM.fullscreenEvent = getFullscreenEvent();
    }
  };

  var maxCanvasWidth = null;

  SYSTEM.getMaxCanvasWidth = function () {
    if (maxCanvasWidth === null) {
      maxCanvasWidth = getMaxCanvasWidth(SYSTEM.maxTextureWidth);
    }

    return maxCanvasWidth;
  };
  /**
   * @summary Tries to return a canvas webgl context
   * @returns {WebGLRenderingContext}
   * @private
   */


  function getWebGLCtx() {
    var canvas = document.createElement('canvas');
    var names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
    var context = null;

    if (!canvas.getContext) {
      return null;
    }

    if (names.some(function (name) {
      try {
        context = canvas.getContext(name);
        return context !== null;
      } catch (e) {
        return false;
      }
    })) {
      return context;
    } else {
      return null;
    }
  }
  /**
   * @summary Detects if the user is using a touch screen
   * @returns {{initial: boolean, promise: Promise<boolean>}}
   * @private
   */


  function isTouchEnabled() {
    var initial = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (LOCALSTORAGE_TOUCH_SUPPORT in localStorage) {
      initial = localStorage[LOCALSTORAGE_TOUCH_SUPPORT] === 'true';
    }

    var promise = new Promise(function (resolve) {
      var clear;

      var listenerMouse = function listenerMouse() {
        clear();
        localStorage[LOCALSTORAGE_TOUCH_SUPPORT] = false;
        resolve(false);
      };

      var listenerTouch = function listenerTouch() {
        clear();
        localStorage[LOCALSTORAGE_TOUCH_SUPPORT] = true;
        resolve(true);
      };

      var listenerTimeout = function listenerTimeout() {
        clear();
        localStorage[LOCALSTORAGE_TOUCH_SUPPORT] = initial;
        resolve(initial);
      };

      window.addEventListener('mousedown', listenerMouse, false);
      window.addEventListener('touchstart', listenerTouch, false);
      var listenerTimeoutId = setTimeout(listenerTimeout, 10000);

      clear = function clear() {
        window.removeEventListener('mousedown', listenerMouse);
        window.removeEventListener('touchstart', listenerTouch);
        clearTimeout(listenerTimeoutId);
      };
    });
    return {
      initial: initial,
      promise: promise
    };
  }
  /**
   * @summary Gets max texture width in WebGL context
   * @returns {number}
   * @private
   */


  function getMaxTextureWidth(ctx) {
    if (ctx !== null) {
      return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
    } else {
      return 0;
    }
  }
  /**
   * @summary Gets max canvas width supported by the browser.
   * We only test powers of 2 and height = width / 2 because that's what we need to generate WebGL textures
   * @param maxWidth
   * @return {number}
   * @private
   */


  function getMaxCanvasWidth(maxWidth) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = maxWidth;
    canvas.height = maxWidth / 2;

    while (canvas.width > 1024) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1, 1);

      try {
        if (ctx.getImageData(0, 0, 1, 1).data[0] > 0) {
          return canvas.width;
        }
      } catch (e) {// continue
      }

      canvas.width /= 2;
      canvas.height /= 2;
    }

    throw new PSVError('Unable to detect system capabilities');
  }
  /**
   * @summary Gets the event name for mouse wheel
   * @returns {string}
   * @private
   */


  function getMouseWheelEvent() {
    if ('onwheel' in document.createElement('div')) {
      // Modern browsers support "wheel"
      return 'wheel';
    } else if (document.onmousewheel !== undefined) {
      // Webkit and IE support at least "mousewheel"
      return 'mousewheel';
    } else {
      // let's assume that remaining browsers are older Firefox
      return 'DOMMouseScroll';
    }
  }
  /**
   * @summary Map between fullsceen method and fullscreen event name
   * @type {Object<string, string>}
   * @readonly
   * @private
   */


  var FULLSCREEN_EVT_MAP = {
    exitFullscreen: 'fullscreenchange',
    webkitExitFullscreen: 'webkitfullscreenchange',
    mozCancelFullScreen: 'mozfullscreenchange',
    msExitFullscreen: 'MSFullscreenChange'
  };
  /**
   * @summary  Gets the event name for fullscreen
   * @returns {string}
   * @private
   */

  function getFullscreenEvent() {
    var validExits = Object.keys(FULLSCREEN_EVT_MAP).filter(function (exit) {
      return exit in document;
    });

    if (validExits.length) {
      return FULLSCREEN_EVT_MAP[validExits[0]];
    } else {
      return null;
    }
  }

  /**
   * @summary Toggles a CSS class
   * @memberOf PSV.utils
   * @param {HTMLElement|SVGElement} element
   * @param {string} className
   * @param {boolean} [active] - forced state
   */
  function toggleClass(element, className, active) {
    if (active === undefined) {
      element.classList.toggle(className);
    } else if (active) {
      element.classList.add(className);
    } else if (!active) {
      element.classList.remove(className);
    }
  }
  /**
   * @summary Adds one or several CSS classes to an element
   * @memberOf PSV.utils
   * @param {HTMLElement} element
   * @param {string} className
   */

  function addClasses(element, className) {
    var _element$classList;

    (_element$classList = element.classList).add.apply(_element$classList, className.split(' '));
  }
  /**
   * @summary Removes one or several CSS classes to an element
   * @memberOf PSV.utils
   * @param {HTMLElement} element
   * @param {string} className
   */

  function removeClasses(element, className) {
    var _element$classList2;

    (_element$classList2 = element.classList).remove.apply(_element$classList2, className.split(' '));
  }
  /**
   * @summary Searches if an element has a particular parent at any level including itself
   * @memberOf PSV.utils
   * @param {HTMLElement} el
   * @param {HTMLElement} parent
   * @returns {boolean}
   */

  function hasParent(el, parent) {
    var test = el;

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

  function getClosest(el, selector) {
    // When el is document or window, the matches does not exist
    if (!(el != null && el.matches)) {
      return null;
    }

    var test = el;

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

  function getPosition(el) {
    var left = 0;
    var top = 0;
    var test = el;

    while (test) {
      left += test.offsetLeft - test.scrollLeft + test.clientLeft;
      top += test.offsetTop - test.scrollTop + test.clientTop;
      test = test.offsetParent;
    }

    return {
      left: left,
      top: top
    };
  }
  /**
   * @summary Detects if fullscreen is enabled
   * @memberOf PSV.utils
   * @param {HTMLElement} elt
   * @returns {boolean}
   */

  function isFullscreenEnabled(elt) {
    return (document.fullscreenElement || document.webkitFullscreenElement) === elt;
  }
  /**
   * @summary Enters fullscreen mode
   * @memberOf PSV.utils
   * @param {HTMLElement} elt
   */

  function requestFullscreen(elt) {
    (elt.requestFullscreen || elt.webkitRequestFullscreen).call(elt);
  }
  /**
   * @summary Exits fullscreen mode
   * @memberOf PSV.utils
   */

  function exitFullscreen() {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }
  /**
   * @summary Gets an element style
   * @memberOf PSV.utils
   * @param {HTMLElement} elt
   * @param {string} prop
   * @returns {*}
   */

  function getStyle(elt, prop) {
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

  function normalizeWheel(event) {
    var PIXEL_STEP = 10;
    var LINE_HEIGHT = 40;
    var PAGE_HEIGHT = 800;
    var spinX = 0;
    var spinY = 0;
    var pixelX = 0;
    var pixelY = 0; // Legacy

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
    } // side scrolling on FF with DOMMouseScroll


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
      } // delta in PAGE units
      else {
        pixelX *= PAGE_HEIGHT;
        pixelY *= PAGE_HEIGHT;
      }
    } // Fall-back if spin cannot be determined


    if (pixelX && !spinX) {
      spinX = pixelX < 1 ? -1 : 1;
    }

    if (pixelY && !spinY) {
      spinY = pixelY < 1 ? -1 : 1;
    }

    return {
      spinX: spinX,
      spinY: spinY,
      pixelX: pixelX,
      pixelY: pixelY
    };
  }

  /**
   * @deprecated use THREE.MathUtils.clamp
   */

  function bound(x, min, max) {
    return three.MathUtils.clamp(x, min, max);
  }
  /**
   * @summary Ensure a value is within 0 and `max`
   * @param {number} value
   * @param {number} max
   * @return {number}
   */

  function loop(value, max) {
    var result = value % max;

    if (result < 0) {
      result += max;
    }

    return result;
  }
  /**
   * @deprecated Use THREE.MathUtils.isPowerOfTwo
   */

  function isPowerOfTwo(x) {
    return three.MathUtils.isPowerOfTwo(x);
  }
  /**
   * @summary Computes the sum of an array
   * @memberOf PSV.utils
   * @param {number[]} array
   * @returns {number}
   */

  function sum(array) {
    return array.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  /**
   * @summary Computes the distance between two points
   * @memberOf PSV.utils
   * @param {PSV.Point} p1
   * @param {PSV.Point} p2
   * @returns {number}
   */

  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
  /**
   * @summary Compute the shortest offset between two longitudes
   * @memberOf PSV.utils
   * @param {number} from
   * @param {number} to
   * @returns {number}
   */

  function getShortestArc(from, to) {
    var tCandidates = [0, // direct
    Math.PI * 2, // clock-wise cross zero
    -Math.PI * 2 // counter-clock-wise cross zero
    ];
    return tCandidates.reduce(function (value, candidate) {
      var newCandidate = to - from + candidate;
      return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
    }, Infinity);
  }
  /**
   * @summary Computes the angle between the current position and a target position
   * @memberOf PSV.utils
   * @param {PSV.Position} position1
   * @param {PSV.Position} position2
   * @returns {number}
   */

  function getAngle(position1, position2) {
    return Math.acos(Math.cos(position1.latitude) * Math.cos(position2.latitude) * Math.cos(position1.longitude - position2.longitude) + Math.sin(position1.latitude) * Math.sin(position2.latitude));
  }
  /**
   * @summary Returns the distance between two points on a sphere of radius one
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   * @memberOf PSV.utils
   * @param {number[]} p1
   * @param {number[]} p2
   * @returns {number}
   */

  function greatArcDistance(p1, p2) {
    var λ1 = p1[0],
        φ1 = p1[1];
    var λ2 = p2[0],
        φ2 = p2[1];
    var x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
    var y = φ2 - φ1;
    return Math.sqrt(x * x + y * y);
  }

  /**
   * @summary Transforms a string to dash-case {@link https://github.com/shahata/dasherize}
   * @memberOf PSV.utils
   * @param {string} str
   * @returns {string}
   */
  function dasherize(str) {
    return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, function (s, i) {
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

  function throttle(func, wait) {
    /* eslint-disable */
    var self, args, result;
    var timeout;
    var previous = 0;

    var later = function later() {
      previous = Date.now();
      timeout = undefined;
      result = func.apply(self, args);

      if (!timeout) {
        self = args = null;
      }
    };

    return function () {
      var now = Date.now();

      if (!previous) {
        previous = now;
      }

      var remaining = wait - (now - previous);
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
      } else if (!timeout) {
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

  function isPlainObject(obj) {
    // Basic check for Type object that's not null
    if (typeof obj === 'object' && obj !== null) {
      // If Object.getPrototypeOf supported, use it
      if (typeof Object.getPrototypeOf === 'function') {
        var proto = Object.getPrototypeOf(obj);
        return proto === Object.prototype || proto === null;
      } // Otherwise, use internal class
      // This should be reliable as if getPrototypeOf not supported, is pre-ES5


      return Object.prototype.toString.call(obj) === '[object Object]';
    } // Not an object


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

  function deepmerge(target, src) {
    /* eslint-disable */
    var first = src;
    return function merge(target, src) {
      if (Array.isArray(src)) {
        if (!target || !Array.isArray(target)) {
          target = [];
        } else {
          target.length = 0;
        }

        src.forEach(function (e, i) {
          target[i] = merge(null, e);
        });
      } else if (typeof src === 'object') {
        if (!target || Array.isArray(target)) {
          target = {};
        }

        Object.keys(src).forEach(function (key) {
          if (typeof src[key] !== 'object' || !src[key] || !isPlainObject(src[key])) {
            target[key] = src[key];
          } else if (src[key] != first) {
            if (!target[key]) {
              target[key] = merge(null, src[key]);
            } else {
              merge(target[key], src[key]);
            }
          }
        });
      } else {
        target = src;
      }

      return target;
    }(target, src);
    /* eslint-enable */
  }
  /**
   * @summary Deeply clones an object
   * @memberOf PSV.utils
   * @param {Object} src
   * @returns {Object}
   */

  function clone(src) {
    return deepmerge(null, src);
  }
  /**
   * @summery Test of an object is empty
   * @memberOf PSV.utils
   * @param {object} obj
   * @returns {boolean}
   */

  function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  /**
   * @summary Loops over enumerable properties of an object
   * @memberOf PSV.utils
   * @param {Object} object
   * @param {Function} callback
   */

  function each(object, callback) {
    Object.keys(object).forEach(function (key) {
      callback(object[key], key);
    });
  }
  /**
   * @summary Returns if a valu is null or undefined
   * @memberOf PSV.utils
   * @param {*} val
   * @return {boolean}
   */

  function isNil(val) {
    return val === null || val === undefined;
  }
  /**
   * @summary Returns the first non null non undefined parameter
   * @memberOf PSV.utils
   * @param {*} values
   * @return {*}
   */

  function firstNonNull() {
    for (var _len = arguments.length, values = new Array(_len), _key = 0; _key < _len; _key++) {
      values[_key] = arguments[_key];
    }

    for (var _i = 0, _values = values; _i < _values.length; _i++) {
      var val = _values[_i];

      if (!isNil(val)) {
        return val;
      }
    }

    return undefined;
  }
  /**
   * @summary Returns deep equality between objects
   * {@link https://gist.github.com/egardner/efd34f270cc33db67c0246e837689cb9}
   * @param obj1
   * @param obj2
   * @return {boolean}
   * @private
   */

  function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
      return true;
    } else if (isObject(obj1) && isObject(obj2)) {
      if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
      }

      for (var _i2 = 0, _Object$keys = Object.keys(obj1); _i2 < _Object$keys.length; _i2++) {
        var prop = _Object$keys[_i2];

        if (!deepEqual(obj1[prop], obj2[prop])) {
          return false;
        }
      }

      return true;
    } else {
      return false;
    }
  }

  function isObject(obj) {
    return typeof obj === 'object' && obj != null;
  }

  /**
   * @summary Returns the plugin constructor from the imported object
   * For retrocompatibility with previous default exports
   * @memberOf PSV.utils
   * @package
   */

  function pluginInterop(plugin, target) {
    if (plugin) {
      for (var _i = 0, _arr = [['_', plugin]].concat(Object.entries(plugin)); _i < _arr.length; _i++) {
        var _arr$_i = _arr[_i],
            p = _arr$_i[1];

        if (p.prototype instanceof target) {
          return p;
        }
      }
    }

    return null;
  }
  /**
   * @summary Builds an Error with name 'AbortError'
   * @memberOf PSV.utils
   * @return {Error}
   */

  function getAbortError() {
    var error = new Error('Loading was aborted.');
    error.name = 'AbortError';
    return error;
  }
  /**
   * @summary Tests if an Error has name 'AbortError'
   * @memberOf PSV.utils
   * @param {Error} err
   * @return {boolean}
   */

  function isAbortError(err) {
    return (err == null ? void 0 : err.name) === 'AbortError';
  }
  /**
   * @summary Displays a warning in the console
   * @memberOf PSV.utils
   * @param {string} message
   */

  function logWarn(message) {
    console.warn("PhotoSphereViewer: " + message);
  }
  /**
   * @summary Checks if an object is a {PSV.ExtendedPosition}, ie has x/y or longitude/latitude
   * @memberOf PSV.utils
   * @param {object} object
   * @returns {boolean}
   */

  function isExtendedPosition(object) {
    return [['x', 'y'], ['longitude', 'latitude']].some(function (_ref) {
      var key1 = _ref[0],
          key2 = _ref[1];
      return object[key1] !== undefined && object[key2] !== undefined;
    });
  }
  /**
   * @summary Returns the value of a given attribute in the panorama metadata
   * @memberOf PSV.utils
   * @param {string} data
   * @param {string} attr
   * @returns (number)
   */

  function getXMPValue(data, attr) {
    // XMP data are stored in children
    var result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>');

    if (result !== null) {
      var val = parseInt(result[1], 10);
      return isNaN(val) ? null : val;
    } // XMP data are stored in attributes


    result = data.match('GPano:' + attr + '="(.*?)"');

    if (result !== null) {
      var _val = parseInt(result[1], 10);

      return isNaN(_val) ? null : _val;
    }

    return null;
  }
  /**
   * @readonly
   * @private
   * @type {{top: string, left: string, bottom: string, center: string, right: string}}
   */

  var CSS_POSITIONS = {
    top: '0%',
    bottom: '100%',
    left: '0%',
    right: '100%',
    center: '50%'
  };
  /**
   * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
   * @memberOf PSV.utils
   * @description The implementation is as close as possible to the "background-position" specification
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
   * @param {string|PSV.Point} value
   * @returns {PSV.Point}
   */

  function parsePosition(value) {
    if (!value) {
      return {
        x: 0.5,
        y: 0.5
      };
    }

    if (typeof value === 'object') {
      return value;
    }

    var tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

    if (tokens.length === 1) {
      if (CSS_POSITIONS[tokens[0]] !== undefined) {
        tokens = [tokens[0], 'center'];
      } else {
        tokens = [tokens[0], tokens[0]];
      }
    }

    var xFirst = tokens[1] !== 'left' && tokens[1] !== 'right' && tokens[0] !== 'top' && tokens[0] !== 'bottom';
    tokens = tokens.map(function (token) {
      return CSS_POSITIONS[token] || token;
    });

    if (!xFirst) {
      tokens.reverse();
    }

    var parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

    if (parsed) {
      return {
        x: parseFloat(parsed[1]) / 100,
        y: parseFloat(parsed[2]) / 100
      };
    } else {
      return {
        x: 0.5,
        y: 0.5
      };
    }
  }
  /**
   * @readonly
   * @private
   */

  var X_VALUES = ['left', 'center', 'right'];
  /**
   * @readonly
   * @private
   */

  var Y_VALUES = ['top', 'center', 'bottom'];
  /**
   * @readonly
   * @private
   */

  var POS_VALUES = [].concat(X_VALUES, Y_VALUES);
  /**
   * @readonly
   * @private
   */

  var CENTER = 'center';
  /**
   * @summary Parse a CSS-like position into an array of position keywords among top, bottom, left, right and center
   * @memberOf PSV.utils
   * @param {string | string[]} value
   * @param {object} [options]
   * @param {boolean} [options.allowCenter=true] allow "center center"
   * @param {boolean} [options.cssOrder=true] force CSS order (y axis then x axis)
   * @return {string[]}
   */

  function cleanPosition(value, _temp) {
    var _ref2 = _temp === void 0 ? {
      allowCenter: true,
      cssOrder: true
    } : _temp,
        allowCenter = _ref2.allowCenter,
        cssOrder = _ref2.cssOrder;

    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      value = value.split(' ');
    }

    if (value.length === 1) {
      if (value[0] === CENTER) {
        value = [CENTER, CENTER];
      } else if (X_VALUES.indexOf(value[0]) !== -1) {
        value = [CENTER, value[0]];
      } else if (Y_VALUES.indexOf(value[0]) !== -1) {
        value = [value[0], CENTER];
      }
    }

    if (value.length !== 2 || POS_VALUES.indexOf(value[0]) === -1 || POS_VALUES.indexOf(value[1]) === -1) {
      logWarn("Unparsable position " + value);
      return null;
    }

    if (!allowCenter && value[0] === CENTER && value[1] === CENTER) {
      logWarn("Invalid position center center");
      return null;
    }

    if (cssOrder && !positionIsOrdered(value)) {
      value = [value[1], value[0]];
    }

    if (value[1] === CENTER && X_VALUES.indexOf(value[0]) !== -1) {
      value = [CENTER, value[0]];
    }

    if (value[0] === CENTER && Y_VALUES.indexOf(value[1]) !== -1) {
      value = [value[1], CENTER];
    }

    return value;
  }
  /**
   * @summary Checks if an array of two positions is ordered (y axis then x axis)
   * @param {string[]} value
   * @return {boolean}
   */

  function positionIsOrdered(value) {
    return Y_VALUES.indexOf(value[0]) !== -1 && X_VALUES.indexOf(value[1]) !== -1;
  }
  /**
   * @summary Parses an speed
   * @memberOf PSV.utils
   * @param {string|number} speed - The speed, in radians/degrees/revolutions per second/minute
   * @returns {number} radians per second
   * @throws {PSV.PSVError} when the speed cannot be parsed
   */

  function parseSpeed(speed) {
    var parsed;

    if (typeof speed === 'string') {
      var speedStr = speed.toString().trim(); // Speed extraction

      var speedValue = parseFloat(speedStr.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
      var speedUnit = speedStr.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim(); // "per minute" -> "per second"

      if (speedUnit.match(/(pm|per minute)$/)) {
        speedValue /= 60;
      } // Which unit?


      switch (speedUnit) {
        // Degrees per minute / second
        case 'dpm':
        case 'degrees per minute':
        case 'dps':
        case 'degrees per second':
          parsed = three.MathUtils.degToRad(speedValue);
          break;
        // Radians per minute / second

        case 'rdpm':
        case 'radians per minute':
        case 'rdps':
        case 'radians per second':
          parsed = speedValue;
          break;
        // Revolutions per minute / second

        case 'rpm':
        case 'revolutions per minute':
        case 'rps':
        case 'revolutions per second':
          parsed = speedValue * Math.PI * 2;
          break;
        // Unknown unit

        default:
          throw new PSVError('Unknown speed unit "' + speedUnit + '"');
      }
    } else {
      parsed = speed;
    }

    return parsed;
  }
  /**
   * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
   * @memberOf PSV.utils
   * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
   * @param {boolean} [zeroCenter=false] - normalize between -Pi - Pi instead of 0 - 2*Pi
   * @param {boolean} [halfCircle=zeroCenter] - normalize between -Pi/2 - Pi/2 instead of -Pi - Pi
   * @returns {number}
   * @throws {PSV.PSVError} when the angle cannot be parsed
   */

  function parseAngle(angle, zeroCenter, halfCircle) {
    if (zeroCenter === void 0) {
      zeroCenter = false;
    }

    if (halfCircle === void 0) {
      halfCircle = zeroCenter;
    }

    var parsed;

    if (typeof angle === 'string') {
      var match = angle.toLowerCase().trim().match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

      if (!match) {
        throw new PSVError('Unknown angle "' + angle + '"');
      }

      var value = parseFloat(match[1]);
      var unit = match[2];

      if (unit) {
        switch (unit) {
          case 'deg':
          case 'degs':
            parsed = three.MathUtils.degToRad(value);
            break;

          case 'rad':
          case 'rads':
            parsed = value;
            break;

          default:
            throw new PSVError('Unknown angle unit "' + unit + '"');
        }
      } else {
        parsed = value;
      }
    } else if (typeof angle === 'number' && !isNaN(angle)) {
      parsed = angle;
    } else {
      throw new PSVError('Unknown angle "' + angle + '"');
    }

    parsed = loop(zeroCenter ? parsed + Math.PI : parsed, Math.PI * 2);
    return zeroCenter ? three.MathUtils.clamp(parsed - Math.PI, -Math.PI / (halfCircle ? 2 : 1), Math.PI / (halfCircle ? 2 : 1)) : parsed;
  }
  /**
   * @summary Creates a THREE texture from an image
   * @memberOf PSV.utils
   * @param {HTMLImageElement | HTMLCanvasElement} img
   * @return {external:THREE.Texture}
   */

  function createTexture(img) {
    var texture = new three.Texture(img);
    texture.needsUpdate = true;
    texture.minFilter = three.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }
  var quaternion = new three.Quaternion();
  /**
   * @summary Applies the inverse of Euler angles to a vector
   * @memberOf PSV.utils
   * @param {external:THREE.Vector3} vector
   * @param {external:THREE.Euler} euler
   */

  function applyEulerInverse(vector, euler) {
    quaternion.setFromEuler(euler).invert();
    vector.applyQuaternion(quaternion);
  }

  /**
   * @callback OnTick
   * @summary Function called for each animation frame with computed properties
   * @memberOf PSV.utils.Animation
   * @param {Object.<string, number>} properties - current values
   * @param {float} progress - 0 to 1
   */

  /**
   * @summary Interpolation helper for animations
   * @memberOf PSV.utils
   * @description
   * Implements the Promise API with an additional "cancel" method.
   * The promise is resolved with `true` when the animation is completed and `false` if the animation is cancelled.
   * @example
   * const anim = new Animation({
   *     properties: {
   *         width: {start: 100, end: 200}
   *     },
   *     duration: 5000,
   *     onTick: (properties) => element.style.width = `${properties.width}px`;
   * });
   *
   * anim.then((completed) => ...);
   *
   * anim.cancel()
   */

  var Animation = /*#__PURE__*/function () {
    /**
     * @param {Object} options
     * @param {Object.<string, Object>} options.properties
     * @param {number} options.properties[].start
     * @param {number} options.properties[].end
     * @param {number} options.duration
     * @param {number} [options.delay=0]
     * @param {string} [options.easing='linear']
     * @param {PSV.utils.Animation.OnTick} options.onTick - called on each frame
     */
    function Animation(options) {
      var _this = this;

      this.__callbacks = [];

      if (options) {
        if (!options.easing || typeof options.easing === 'string') {
          options.easing = EASINGS[options.easing || 'linear'];
        }

        this.__start = null;
        this.options = options;

        if (options.delay) {
          this.__delayTimeout = setTimeout(function () {
            _this.__delayTimeout = null;
            _this.__animationFrame = window.requestAnimationFrame(function (t) {
              return _this.__run(t);
            });
          }, options.delay);
        } else {
          this.__animationFrame = window.requestAnimationFrame(function (t) {
            return _this.__run(t);
          });
        }
      } else {
        this.__resolved = true;
      }
    }
    /**
     * @summary Main loop for the animation
     * @param {number} timestamp
     * @private
     */


    var _proto = Animation.prototype;

    _proto.__run = function __run(timestamp) {
      var _this2 = this;

      if (this.__cancelled) {
        return;
      } // first iteration


      if (this.__start === null) {
        this.__start = timestamp;
      } // compute progress


      var progress = (timestamp - this.__start) / this.options.duration;
      var current = {};

      if (progress < 1.0) {
        // interpolate properties
        each(this.options.properties, function (prop, name) {
          if (prop) {
            current[name] = prop.start + (prop.end - prop.start) * _this2.options.easing(progress);
          }
        });
        this.options.onTick(current, progress);
        this.__animationFrame = window.requestAnimationFrame(function (t) {
          return _this2.__run(t);
        });
      } else {
        // call onTick one last time with final values
        each(this.options.properties, function (prop, name) {
          if (prop) {
            current[name] = prop.end;
          }
        });
        this.options.onTick(current, 1.0);
        this.__animationFrame = window.requestAnimationFrame(function () {
          _this2.__resolved = true;

          _this2.__resolve(true);
        });
      }
    }
    /**
     * @private
     */
    ;

    _proto.__resolve = function __resolve(value) {
      this.__callbacks.forEach(function (cb) {
        return cb(value);
      });

      this.__callbacks.length = 0;
    }
    /**
     * @summary Promise chaining
     * @param {Function} [onFulfilled] - Called when the animation is complete (true) or cancelled (false)
     * @returns {Promise}
     */
    ;

    _proto.then = function then(onFulfilled) {
      var _this3 = this;

      if (this.__resolved || this.__cancelled) {
        return Promise.resolve(this.__resolved).then(onFulfilled);
      }

      return new Promise(function (resolve) {
        _this3.__callbacks.push(resolve);
      }).then(onFulfilled);
    }
    /**
     * @summary Cancels the animation
     */
    ;

    _proto.cancel = function cancel() {
      if (!this.__cancelled && !this.__resolved) {
        this.__cancelled = true;

        this.__resolve(false);

        if (this.__delayTimeout) {
          window.clearTimeout(this.__delayTimeout);
          this.__delayTimeout = null;
        }

        if (this.__animationFrame) {
          window.cancelAnimationFrame(this.__animationFrame);
          this.__animationFrame = null;
        }
      }
    };

    return Animation;
  }();

  /**
   * @summary Represents a variable that can dynamically change with time (using requestAnimationFrame)
   * @memberOf PSV.utils
   */

  var Dynamic = /*#__PURE__*/function () {
    /**
     * @param {Function} [fn] Callback function
     * @param {number} [defaultValue] Default position
     * @param {number} [min] Minimum position
     * @param {number} [max] Maximum position
     * @param {boolean} [loopValue] Loop value between min and max
     */
    function Dynamic(fn, defaultValue, min, max, loopValue) {
      if (defaultValue === void 0) {
        defaultValue = 0;
      }

      if (min === void 0) {
        min = -Infinity;
      }

      if (max === void 0) {
        max = Infinity;
      }

      if (loopValue === void 0) {
        loopValue = false;
      }

      /**
       * @type {Function}
       * @private
       * @readonly
       */
      this.fn = fn;
      /**
       * @type {number}
       * @private
       */

      this.mode = Dynamic.STOP;
      /**
       * @type {number}
       * @private
       */

      this.speed = 0;
      /**
       * @type {number}
       * @private
       */

      this.speedMult = 1;
      /**
       * @type {number}
       * @private
       */

      this.currentSpeed = 0;
      /**
       * @type {number}
       * @private
       */

      this.target = 0;
      /**
       * @type {number}
       * @readonly
       */

      this.current = defaultValue;
      /**
       * @type {number}
       * @private
       */

      this.min = min;
      /**
       * @type {number}
       * @private
       */

      this.max = max;
      /**
       * @type {boolean}
       * @private
       */

      this.loopValue = loopValue;

      if (loopValue && min !== 0) {
        throw new PSVError('invalid config');
      }

      if (this.fn) {
        this.fn(defaultValue);
      }
    }
    /**
     * Changes base speed
     * @param {number} speed
     */


    var _proto = Dynamic.prototype;

    _proto.setSpeed = function setSpeed(speed) {
      this.speed = speed;
    }
    /**
     * Defines the target position
     * @param {number} position
     * @param {number} [speedMult=1]
     */
    ;

    _proto.goto = function goto(position, speedMult) {
      if (speedMult === void 0) {
        speedMult = 1;
      }

      this.mode = Dynamic.POSITION;
      this.target = this.loopValue ? loop(position, this.max) : three.MathUtils.clamp(position, this.min, this.max);
      this.speedMult = speedMult;
    }
    /**
     * Increase/decrease the target position
     * @param {number} step
     * @param {number} [speedMult=1]
     */
    ;

    _proto.step = function step(_step, speedMult) {
      if (speedMult === void 0) {
        speedMult = 1;
      }

      if (this.mode !== Dynamic.POSITION) {
        this.target = this.current;
      }

      this.goto(this.target + _step, speedMult);
    }
    /**
     * Starts infinite movement
     * @param {boolean} [invert=false]
     * @param {number} [speedMult=1]
     */
    ;

    _proto.roll = function roll(invert, speedMult) {
      if (invert === void 0) {
        invert = false;
      }

      if (speedMult === void 0) {
        speedMult = 1;
      }

      this.mode = Dynamic.INFINITE;
      this.target = invert ? -Infinity : Infinity;
      this.speedMult = speedMult;
    }
    /**
     * Stops movement
     */
    ;

    _proto.stop = function stop() {
      this.mode = Dynamic.STOP;
    }
    /**
     * Defines the current position and immediately stops movement
     * @param {number} value
     */
    ;

    _proto.setValue = function setValue(value) {
      this.target = this.loopValue ? loop(value, this.max) : three.MathUtils.clamp(value, this.min, this.max);
      this.mode = Dynamic.STOP;

      if (this.target !== this.current) {
        this.current = this.target;

        if (this.fn) {
          this.fn(this.current);
        }

        return true;
      }

      return false;
    }
    /**
     * @package
     */
    ;

    _proto.update = function update(elapsed) {
      // in position mode switch to stop mode when in the decceleration window
      if (this.mode === Dynamic.POSITION) {
        // in loop mode, alter "current" to avoid crossing the origin
        if (this.loopValue && Math.abs(this.target - this.current) > this.max / 2) {
          this.current = this.current < this.target ? this.current + this.max : this.current - this.max;
        }

        var dstStop = this.currentSpeed * this.currentSpeed / (this.speed * this.speedMult * 4);

        if (Math.abs(this.target - this.current) <= dstStop) {
          this.mode = Dynamic.STOP;
        }
      } // compute speed


      var targetSpeed = this.mode === Dynamic.STOP ? 0 : this.speed * this.speedMult;

      if (this.target < this.current) {
        targetSpeed = -targetSpeed;
      }

      if (this.currentSpeed < targetSpeed) {
        this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + elapsed / 1000 * this.speed * this.speedMult * 2);
      } else if (this.currentSpeed > targetSpeed) {
        this.currentSpeed = Math.max(targetSpeed, this.currentSpeed - elapsed / 1000 * this.speed * this.speedMult * 2);
      } // compute new position


      var next = null;

      if (this.current > this.target && this.currentSpeed) {
        next = Math.max(this.target, this.current + this.currentSpeed * elapsed / 1000);
      } else if (this.current < this.target && this.currentSpeed) {
        next = Math.min(this.target, this.current + this.currentSpeed * elapsed / 1000);
      } // apply value


      if (next !== null) {
        next = this.loopValue ? loop(next, this.max) : three.MathUtils.clamp(next, this.min, this.max);

        if (next !== this.current) {
          this.current = next;

          if (this.fn) {
            this.fn(this.current);
          }

          return true;
        }
      }

      return false;
    };

    return Dynamic;
  }();
  Dynamic.STOP = 0;
  Dynamic.INFINITE = 1;
  Dynamic.POSITION = 2;

  /**
   * @summary Wrapper for multiple {@link PSV.utils.Dynamic} evolving together
   * @memberOf PSV.utils
   */

  var MultiDynamic = /*#__PURE__*/function () {
    /**
     * @param {Record<string, PSV.utils.Dynamic>} dynamics
     * @param {Function} [fn] Callback function
     */
    function MultiDynamic(dynamics, fn) {
      /**
       * @type {Function}
       * @private
       * @readonly
       */
      this.fn = fn;
      /**
       * @type {Record<string, PSV.utils.Dynamic>}
       * @private
       * @readonly
       */

      this.dynamics = dynamics;

      if (this.fn) {
        this.fn(this.current);
      }
    }
    /**
     * Changes base speed
     * @param {number} speed
     */


    var _proto = MultiDynamic.prototype;

    _proto.setSpeed = function setSpeed(speed) {
      each(this.dynamics, function (d) {
        d.setSpeed(speed);
      });
    }
    /**
     * Defines the target positions
     * @param {Record<string, number>} positions
     * @param {number} [speedMult=1]
     */
    ;

    _proto.goto = function goto(positions, speedMult) {
      var _this = this;

      if (speedMult === void 0) {
        speedMult = 1;
      }

      each(positions, function (position, name) {
        _this.dynamics[name].goto(position, speedMult);
      });
    }
    /**
     * Increase/decrease the target positions
     * @param {Record<string, number>} steps
     * @param {number} [speedMult=1]
     */
    ;

    _proto.step = function step(steps, speedMult) {
      var _this2 = this;

      if (speedMult === void 0) {
        speedMult = 1;
      }

      each(steps, function (step, name) {
        _this2.dynamics[name].step(step, speedMult);
      });
    }
    /**
     * Starts infinite movements
     * @param {Record<string, boolean>} rolls
     * @param {number} [speedMult=1]
     */
    ;

    _proto.roll = function roll(rolls, speedMult) {
      var _this3 = this;

      if (speedMult === void 0) {
        speedMult = 1;
      }

      each(rolls, function (roll, name) {
        _this3.dynamics[name].roll(roll, speedMult);
      });
    }
    /**
     * Stops movements
     */
    ;

    _proto.stop = function stop() {
      each(this.dynamics, function (d) {
        return d.stop();
      });
    }
    /**
     * Defines the current positions and immediately stops movements
     * @param {Record<string, number>} values
     */
    ;

    _proto.setValue = function setValue(values) {
      var _this4 = this;

      var hasUpdates = false;
      each(values, function (value, name) {
        hasUpdates |= _this4.dynamics[name].setValue(value);
      });

      if (hasUpdates && this.fn) {
        this.fn(this.current);
      }

      return hasUpdates;
    }
    /**
     * @package
     */
    ;

    _proto.update = function update(elapsed) {
      var hasUpdates = false;
      each(this.dynamics, function (dynamic) {
        hasUpdates |= dynamic.update(elapsed);
      });

      if (hasUpdates && this.fn) {
        this.fn(this.current);
      }

      return hasUpdates;
    };

    _createClass(MultiDynamic, [{
      key: "current",
      get:
      /**
       * @type {Object<string, number>}
       * @readonly
       */
      function get() {
        var values = {};
        each(this.dynamics, function (dynamic, name) {
          values[name] = dynamic.current;
        });
        return values;
      }
    }]);

    return MultiDynamic;
  }();

  /**
   * @summary Helper to make sliders elements
   * @memberOf PSV.utils
   */

  var Slider = /*#__PURE__*/function (_EventEmitter) {
    _inheritsLoose(Slider, _EventEmitter);

    function Slider(_ref) {
      var _this;

      var psv = _ref.psv,
          container = _ref.container,
          direction = _ref.direction,
          onUpdate = _ref.onUpdate;
      _this = _EventEmitter.call(this) || this;
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */

      _this.psv = psv;
      /**
       * @member {HTMLElement}
       * @readonly
       */

      _this.container = container;
      /**
       * @summary Internal properties
       * @member {Object}
       * @protected
       * @property {boolean} mousedown
       * @property {number} mediaMinWidth
       */

      _this.prop = {
        onUpdate: onUpdate,
        direction: direction,
        mousedown: false,
        mouseover: false
      };

      _this.container.addEventListener('click', _assertThisInitialized(_this));

      _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

      _this.container.addEventListener('mouseenter', _assertThisInitialized(_this));

      _this.container.addEventListener('mouseleave', _assertThisInitialized(_this));

      _this.container.addEventListener('touchstart', _assertThisInitialized(_this));

      _this.container.addEventListener('mousemove', _assertThisInitialized(_this), true);

      _this.container.addEventListener('touchmove', _assertThisInitialized(_this), true);

      window.addEventListener('mouseup', _assertThisInitialized(_this));
      window.addEventListener('touchend', _assertThisInitialized(_this));
      return _this;
    }
    /**
     * @protected
     */


    var _proto = Slider.prototype;

    _proto.destroy = function destroy() {
      window.removeEventListener('mouseup', this);
      window.removeEventListener('touchend', this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'click':
          e.stopPropagation();
          break;

        case 'mousedown':
          this.__onMouseDown(e);

          break;

        case 'mouseenter':
          this.__onMouseEnter(e);

          break;

        case 'mouseleave':
          this.__onMouseLeave(e);

          break;

        case 'touchstart':
          this.__onTouchStart(e);

          break;

        case 'mousemove':
          this.__onMouseMove(e);

          break;

        case 'touchmove':
          this.__onTouchMove(e);

          break;

        case 'mouseup':
          this.__onMouseUp(e);

          break;

        case 'touchend':
          this.__onTouchEnd(e);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      this.prop.mousedown = true;

      this.__update(evt, true);
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseEnter = function __onMouseEnter(evt) {
      this.prop.mouseover = true;

      this.__update(evt, true);
    }
    /**
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      this.prop.mouseover = true;
      this.prop.mousedown = true;

      this.__update(evt.changedTouches[0], true);
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (this.prop.mousedown || this.prop.mouseover) {
        evt.stopPropagation();

        this.__update(evt, true);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      if (this.prop.mousedown || this.prop.mouseover) {
        evt.stopPropagation();

        this.__update(evt.changedTouches[0], true);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      if (this.prop.mousedown) {
        this.prop.mousedown = false;

        this.__update(evt, false);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseLeave = function __onMouseLeave(evt) {
      if (this.prop.mouseover) {
        this.prop.mouseover = false;

        this.__update(evt, true);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__onTouchEnd = function __onTouchEnd(evt) {
      if (this.prop.mousedown) {
        this.prop.mouseover = false;
        this.prop.mousedown = false;

        this.__update(evt.changedTouches[0], false);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__update = function __update(evt, moving) {
      var boundingClientRect = this.container.getBoundingClientRect();
      var cursor = evt[this.vertical ? 'clientY' : 'clientX'];
      var pos = boundingClientRect[this.vertical ? 'bottom' : 'left'];
      var size = boundingClientRect[this.vertical ? 'height' : 'width'];
      var val = Math.abs((pos - cursor) / size);
      this.prop.onUpdate({
        value: val,
        click: !moving,
        mousedown: this.prop.mousedown,
        mouseover: this.prop.mouseover,
        cursor: evt
      });
    };

    _createClass(Slider, [{
      key: "vertical",
      get:
      /**
       * @type {boolean}
       * @readonly
       */
      function get() {
        return this.prop.direction === Slider.VERTICAL;
      }
    }]);

    return Slider;
  }(uevent.EventEmitter);
  Slider.VERTICAL = 1;
  Slider.HORIZONTAL = 2;

  /**
   * @namespace PSV.utils
   */

  var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    toggleClass: toggleClass,
    addClasses: addClasses,
    removeClasses: removeClasses,
    hasParent: hasParent,
    getClosest: getClosest,
    getPosition: getPosition,
    isFullscreenEnabled: isFullscreenEnabled,
    requestFullscreen: requestFullscreen,
    exitFullscreen: exitFullscreen,
    getStyle: getStyle,
    normalizeWheel: normalizeWheel,
    bound: bound,
    loop: loop,
    isPowerOfTwo: isPowerOfTwo,
    sum: sum,
    distance: distance,
    getShortestArc: getShortestArc,
    getAngle: getAngle,
    greatArcDistance: greatArcDistance,
    dasherize: dasherize,
    throttle: throttle,
    isPlainObject: isPlainObject,
    deepmerge: deepmerge,
    clone: clone,
    isEmpty: isEmpty,
    each: each,
    isNil: isNil,
    firstNonNull: firstNonNull,
    deepEqual: deepEqual,
    pluginInterop: pluginInterop,
    getAbortError: getAbortError,
    isAbortError: isAbortError,
    logWarn: logWarn,
    isExtendedPosition: isExtendedPosition,
    getXMPValue: getXMPValue,
    parsePosition: parsePosition,
    cleanPosition: cleanPosition,
    positionIsOrdered: positionIsOrdered,
    parseSpeed: parseSpeed,
    parseAngle: parseAngle,
    createTexture: createTexture,
    applyEulerInverse: applyEulerInverse,
    Animation: Animation,
    Dynamic: Dynamic,
    MultiDynamic: MultiDynamic,
    Slider: Slider
  });

  /**
   * @typedef {Object} PSV.adapters.EquirectangularAdapter.Options
   * @property {number} [resolution=64] - number of faces of the sphere geometry, higher values may decrease performances
   */

  /**
   * @summary Adapter for equirectangular panoramas
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var EquirectangularAdapter = /*#__PURE__*/function (_AbstractAdapter) {
    _inheritsLoose(EquirectangularAdapter, _AbstractAdapter);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.adapters.EquirectangularAdapter.Options} options
     */
    function EquirectangularAdapter(psv, options) {
      var _this;

      _this = _AbstractAdapter.call(this, psv) || this;
      /**
       * @member {PSV.adapters.EquirectangularAdapter.Options}
       * @private
       */

      _this.config = _extends({
        resolution: 64
      }, options);

      if (!three.MathUtils.isPowerOfTwo(_this.config.resolution)) {
        throw new PSVError('EquirectangularAdapter resolution must be power of two');
      }

      _this.SPHERE_SEGMENTS = _this.config.resolution;
      _this.SPHERE_HORIZONTAL_SEGMENTS = _this.SPHERE_SEGMENTS / 2;
      return _this;
    }
    /**
     * @override
     */


    var _proto = EquirectangularAdapter.prototype;

    _proto.supportsTransition = function supportsTransition() {
      return true;
    }
    /**
     * @override
     */
    ;

    _proto.supportsPreload = function supportsPreload() {
      return true;
    }
    /**
     * @override
     * @param {string} panorama
     * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
     * @param {boolean} [useXmpPanoData]
     * @returns {Promise.<PSV.TextureData>}
     */
    ;

    _proto.loadTexture = function loadTexture(panorama, newPanoData, useXmpPanoData) {
      var _this2 = this;

      if (useXmpPanoData === void 0) {
        useXmpPanoData = this.psv.config.useXmpData;
      }

      if (typeof panorama !== 'string') {
        if (Array.isArray(panorama) || typeof panorama === 'object' && !!panorama.left) {
          logWarn('Cubemap support now requires an additional adapter, see https://photo-sphere-viewer.js.org/guide/adapters');
        }

        return Promise.reject(new PSVError('Invalid panorama url, are you using the right adapter?'));
      }

      return (useXmpPanoData ? this.__loadXMP(panorama, function (p) {
        return _this2.psv.loader.setProgress(p);
      }).then(function (xmpPanoData) {
        return _this2.psv.textureLoader.loadImage(panorama).then(function (img) {
          return {
            img: img,
            xmpPanoData: xmpPanoData
          };
        });
      }) : this.psv.textureLoader.loadImage(panorama, function (p) {
        return _this2.psv.loader.setProgress(p);
      }).then(function (img) {
        return {
          img: img,
          xmpPanoData: null
        };
      })).then(function (_ref) {
        var _newPanoData, _newPanoData2, _newPanoData3, _newPanoData4, _newPanoData5, _newPanoData6, _newPanoData7, _newPanoData8, _newPanoData9;

        var img = _ref.img,
            xmpPanoData = _ref.xmpPanoData;

        if (typeof newPanoData === 'function') {
          newPanoData = newPanoData(img);
        }

        var panoData = {
          fullWidth: firstNonNull((_newPanoData = newPanoData) == null ? void 0 : _newPanoData.fullWidth, xmpPanoData == null ? void 0 : xmpPanoData.fullWidth, img.width),
          fullHeight: firstNonNull((_newPanoData2 = newPanoData) == null ? void 0 : _newPanoData2.fullHeight, xmpPanoData == null ? void 0 : xmpPanoData.fullHeight, img.height),
          croppedWidth: firstNonNull((_newPanoData3 = newPanoData) == null ? void 0 : _newPanoData3.croppedWidth, xmpPanoData == null ? void 0 : xmpPanoData.croppedWidth, img.width),
          croppedHeight: firstNonNull((_newPanoData4 = newPanoData) == null ? void 0 : _newPanoData4.croppedHeight, xmpPanoData == null ? void 0 : xmpPanoData.croppedHeight, img.height),
          croppedX: firstNonNull((_newPanoData5 = newPanoData) == null ? void 0 : _newPanoData5.croppedX, xmpPanoData == null ? void 0 : xmpPanoData.croppedX, 0),
          croppedY: firstNonNull((_newPanoData6 = newPanoData) == null ? void 0 : _newPanoData6.croppedY, xmpPanoData == null ? void 0 : xmpPanoData.croppedY, 0),
          poseHeading: firstNonNull((_newPanoData7 = newPanoData) == null ? void 0 : _newPanoData7.poseHeading, xmpPanoData == null ? void 0 : xmpPanoData.poseHeading, 0),
          posePitch: firstNonNull((_newPanoData8 = newPanoData) == null ? void 0 : _newPanoData8.posePitch, xmpPanoData == null ? void 0 : xmpPanoData.posePitch, 0),
          poseRoll: firstNonNull((_newPanoData9 = newPanoData) == null ? void 0 : _newPanoData9.poseRoll, xmpPanoData == null ? void 0 : xmpPanoData.poseRoll, 0)
        };

        if (panoData.croppedWidth !== img.width || panoData.croppedHeight !== img.height) {
          logWarn("Invalid panoData, croppedWidth and/or croppedHeight is not coherent with loaded image.\n    panoData: " + panoData.croppedWidth + "x" + panoData.croppedHeight + ", image: " + img.width + "x" + img.height);
        }

        if ((newPanoData || xmpPanoData) && panoData.fullWidth !== panoData.fullHeight * 2) {
          logWarn('Invalid panoData, fullWidth should be twice fullHeight');
        }

        var texture = _this2.__createEquirectangularTexture(img, panoData);

        return {
          panorama: panorama,
          texture: texture,
          panoData: panoData
        };
      });
    }
    /**
     * @summary Loads the XMP data of an image
     * @param {string} panorama
     * @param {function(number)} [onProgress]
     * @returns {Promise<PSV.PanoData>}
     * @throws {PSV.PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadXMP = function __loadXMP(panorama, onProgress) {
      var _this3 = this;

      return this.psv.textureLoader.loadFile(panorama, onProgress).then(function (blob) {
        return _this3.__loadBlobAsString(blob);
      }).then(function (binary) {
        var a = binary.indexOf('<x:xmpmeta');
        var b = binary.indexOf('</x:xmpmeta>');
        var data = binary.substring(a, b);

        if (a !== -1 && b !== -1 && data.includes('GPano:')) {
          return {
            fullWidth: getXMPValue(data, 'FullPanoWidthPixels'),
            fullHeight: getXMPValue(data, 'FullPanoHeightPixels'),
            croppedWidth: getXMPValue(data, 'CroppedAreaImageWidthPixels'),
            croppedHeight: getXMPValue(data, 'CroppedAreaImageHeightPixels'),
            croppedX: getXMPValue(data, 'CroppedAreaLeftPixels'),
            croppedY: getXMPValue(data, 'CroppedAreaTopPixels'),
            poseHeading: getXMPValue(data, 'PoseHeadingDegrees'),
            posePitch: getXMPValue(data, 'PosePitchDegrees'),
            poseRoll: getXMPValue(data, 'PoseRollDegrees')
          };
        }

        return null;
      });
    }
    /**
     * @summmary read a Blob as string
     * @param {Blob} blob
     * @returns {Promise<string>}
     * @private
     */
    ;

    _proto.__loadBlobAsString = function __loadBlobAsString(blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();

        reader.onload = function () {
          return resolve(reader.result);
        };

        reader.onerror = reject;
        reader.readAsText(blob);
      });
    }
    /**
     * @summary Creates the final texture from image and panorama data
     * @param {Image} img
     * @param {PSV.PanoData} panoData
     * @returns {external:THREE.Texture}
     * @private
     */
    ;

    _proto.__createEquirectangularTexture = function __createEquirectangularTexture(img, panoData) {
      // resize image / fill cropped parts with black
      if (panoData.fullWidth > SYSTEM.maxTextureWidth || panoData.croppedWidth !== panoData.fullWidth || panoData.croppedHeight !== panoData.fullHeight) {
        var ratio = SYSTEM.getMaxCanvasWidth() / panoData.fullWidth;

        var resizedPanoData = _extends({}, panoData);

        if (ratio < 1) {
          resizedPanoData.fullWidth *= ratio;
          resizedPanoData.fullHeight *= ratio;
          resizedPanoData.croppedWidth *= ratio;
          resizedPanoData.croppedHeight *= ratio;
          resizedPanoData.croppedX *= ratio;
          resizedPanoData.croppedY *= ratio;
        }

        var buffer = document.createElement('canvas');
        buffer.width = resizedPanoData.fullWidth;
        buffer.height = resizedPanoData.fullHeight;
        var ctx = buffer.getContext('2d');
        ctx.drawImage(img, resizedPanoData.croppedX, resizedPanoData.croppedY, resizedPanoData.croppedWidth, resizedPanoData.croppedHeight);
        return createTexture(buffer);
      }

      return createTexture(img);
    }
    /**
     * @override
     */
    ;

    _proto.createMesh = function createMesh(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      // The middle of the panorama is placed at longitude=0
      var geometry = new three.SphereGeometry(SPHERE_RADIUS * scale, this.SPHERE_SEGMENTS, this.SPHERE_HORIZONTAL_SEGMENTS, -Math.PI / 2).scale(-1, 1, 1);
      var material = AbstractAdapter.createOverlayMaterial();
      return new three.Mesh(geometry, material);
    }
    /**
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData) {
      this.__setUniform(mesh, AbstractAdapter.OVERLAY_UNIFORMS.panorama, textureData.texture);

      this.setOverlay(mesh, null);
    }
    /**
     * @override
     */
    ;

    _proto.setOverlay = function setOverlay(mesh, textureData, opacity) {
      this.__setUniform(mesh, AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity, opacity);

      if (!textureData) {
        this.__setUniform(mesh, AbstractAdapter.OVERLAY_UNIFORMS.overlay, new three.Texture());
      } else {
        this.__setUniform(mesh, AbstractAdapter.OVERLAY_UNIFORMS.overlay, textureData.texture);
      }
    }
    /**
     * @override
     */
    ;

    _proto.setTextureOpacity = function setTextureOpacity(mesh, opacity) {
      this.__setUniform(mesh, AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity, opacity);

      mesh.material.transparent = opacity < 1;
    }
    /**
     * @override
     */
    ;

    _proto.disposeTexture = function disposeTexture(textureData) {
      var _textureData$texture;

      (_textureData$texture = textureData.texture) == null ? void 0 : _textureData$texture.dispose();
    }
    /**
     * @param {external:THREE.Mesh} mesh
     * @param {string} uniform
     * @param {*} value
     * @private
     */
    ;

    _proto.__setUniform = function __setUniform(mesh, uniform, value) {
      if (mesh.material.uniforms[uniform].value instanceof three.Texture) {
        mesh.material.uniforms[uniform].value.dispose();
      }

      mesh.material.uniforms[uniform].value = value;
    };

    return EquirectangularAdapter;
  }(AbstractAdapter);
  EquirectangularAdapter.id = 'equirectangular';
  EquirectangularAdapter.supportsDownload = true;
  EquirectangularAdapter.supportsOverlay = true;

  /**
   * @namespace PSV.components
   */

  /**
   * @summary Base component class
   * @memberof PSV.components
   * @abstract
   */
  var AbstractComponent = /*#__PURE__*/function () {
    /**
     * @param {PSV.Viewer | PSV.components.AbstractComponent} parent
     * @param {string} className - CSS class added to the component's container
     */
    function AbstractComponent(parent, className) {
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */
      this.psv = parent.psv || parent;
      /**
       * @member {PSV.Viewer|PSV.components.AbstractComponent}
       * @readonly
       */

      this.parent = parent;
      this.parent.children.push(this);
      /**
       * @summary All child components
       * @type {PSV.components.AbstractComponent[]}
       * @readonly
       * @package
       */

      this.children = [];
      /**
       * @summary Internal properties
       * @member {Object}
       * @protected
       * @property {boolean} visible - Visibility of the component
       */

      this.prop = {
        visible: true
      };
      /**
       * @member {HTMLElement}
       * @readonly
       */

      this.container = document.createElement('div');
      this.container.className = className;
      this.parent.container.appendChild(this.container);
    }
    /**
     * @summary Destroys the component
     * @protected
     */


    var _proto = AbstractComponent.prototype;

    _proto.destroy = function destroy() {
      this.parent.container.removeChild(this.container);
      var childIdx = this.parent.children.indexOf(this);

      if (childIdx !== -1) {
        this.parent.children.splice(childIdx, 1);
      }

      this.children.slice().forEach(function (child) {
        return child.destroy();
      });
      this.children.length = 0;
      delete this.container;
      delete this.parent;
      delete this.psv;
      delete this.prop;
    }
    /**
     * @summary Refresh UI
     * @description Must be be a very lightweight operation
     * @package
     */
    ;

    _proto.refreshUi = function refreshUi() {
      var _this = this;

      this.children.every(function (child) {
        child.refreshUi();
        return _this.psv.prop.uiRefresh === true;
      });
    }
    /**
     * @summary Displays or hides the component
     * @param {boolean} [visible] - forced state
     */
    ;

    _proto.toggle = function toggle(visible) {
      if (visible === false || visible === undefined && this.isVisible()) {
        this.hide();
      } else if (visible === true || visible === undefined && !this.isVisible()) {
        this.show();
      }
    }
    /**
     * @summary Hides the component
     */
    ;

    _proto.hide = function hide() {
      this.container.style.display = 'none';
      this.prop.visible = false;
    }
    /**
     * @summary Displays the component
     */
    ;

    _proto.show = function show() {
      this.container.style.display = '';
      this.prop.visible = true;
    }
    /**
     * @summary Checks if the component is visible
     * @returns {boolean}
     */
    ;

    _proto.isVisible = function isVisible() {
      return this.prop.visible;
    };

    return AbstractComponent;
  }();

  /**
   * @namespace PSV.buttons
   */

  /**
   * @summary Base navbar button class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.buttons
   * @abstract
   */

  var AbstractButton = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(AbstractButton, _AbstractComponent);

    /**
     * @summary Unique identifier of the button
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @summary Identifier to declare a group of buttons
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @summary SVG icon name injected in the button
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @summary SVG icon name injected in the button when it is active
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {string} [className] - Additional CSS classes
     * @param {boolean} [collapsable=false] - `true` if the button can be moved to menu when the navbar is too small
     * @param {boolean} [tabbable=true] - `true` if the button is accessible with the keyboard
     */
    function AbstractButton(navbar, className, collapsable, tabbable) {
      var _this;

      if (className === void 0) {
        className = '';
      }

      if (collapsable === void 0) {
        collapsable = false;
      }

      if (tabbable === void 0) {
        tabbable = true;
      }

      _this = _AbstractComponent.call(this, navbar, 'psv-button ' + className) || this;
      /**
       * @override
       * @property {string} id - Unique identifier of the button
       * @property {boolean} enabled
       * @property {boolean} supported
       * @property {boolean} collapsed
       * @property {boolean} active
       * @property {number} width
       */

      _this.prop = _extends({}, _this.prop, {
        id: _this.constructor.id,
        collapsable: collapsable,
        enabled: true,
        supported: true,
        collapsed: false,
        active: false,
        width: _this.container.offsetWidth
      });

      if (_this.constructor.icon) {
        _this.__setIcon(_this.constructor.icon);
      }

      if (_this.prop.id && _this.psv.config.lang[_this.prop.id]) {
        _this.container.title = _this.psv.config.lang[_this.prop.id];
      }

      if (tabbable) {
        _this.container.tabIndex = 0;
      }

      _this.container.addEventListener('click', function (e) {
        if (_this.prop.enabled) {
          _this.onClick();
        }

        e.stopPropagation();
      });

      _this.container.addEventListener('keydown', function (e) {
        if (e.key === KEY_CODES.Enter && _this.prop.enabled) {
          _this.onClick();

          e.stopPropagation();
        }
      });

      return _this;
    }
    /**
     * @package
     */


    var _proto = AbstractButton.prototype;

    _proto.checkSupported = function checkSupported() {
      var _this2 = this;

      var supportedOrObject = this.isSupported();

      if (isPlainObject(supportedOrObject)) {
        if (supportedOrObject.initial === false) {
          this.hide();
          this.prop.supported = false;
        }

        supportedOrObject.promise.then(function (supported) {
          if (!_this2.prop) {
            return; // the component has been destroyed
          }

          _this2.prop.supported = supported;

          _this2.toggle(supported);
        });
      } else {
        this.prop.supported = supportedOrObject;

        if (!supportedOrObject) {
          this.hide();
        }
      }
    }
    /**
     * @summary Checks if the button can be displayed
     * @returns {boolean|{initial: boolean, promise: Promise<boolean>}}
     */
    ;

    _proto.isSupported = function isSupported() {
      return true;
    }
    /**
     * @summary Changes the active state of the button
     * @param {boolean} [active] - forced state
     */
    ;

    _proto.toggleActive = function toggleActive(active) {
      this.prop.active = active !== undefined ? active : !this.prop.active;
      toggleClass(this.container, 'psv-button--active', this.prop.active);

      if (this.constructor.iconActive) {
        this.__setIcon(this.prop.active ? this.constructor.iconActive : this.constructor.icon);
      }
    }
    /**
     * @override
     */
    ;

    _proto.show = function show(refresh) {
      if (refresh === void 0) {
        refresh = true;
      }

      if (!this.isVisible()) {
        this.prop.visible = true;

        if (!this.prop.collapsed) {
          this.container.style.display = '';
        }

        if (refresh) {
          this.psv.refreshUi("show button " + this.prop.id);
        }
      }
    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide(refresh) {
      if (refresh === void 0) {
        refresh = true;
      }

      if (this.isVisible()) {
        this.prop.visible = false;
        this.container.style.display = 'none';

        if (refresh) {
          this.psv.refreshUi("hide button " + this.prop.id);
        }
      }
    }
    /**
     * @summary Disables the button
     */
    ;

    _proto.disable = function disable() {
      this.container.classList.add('psv-button--disabled');
      this.prop.enabled = false;
    }
    /**
     * @summary Enables the button
     */
    ;

    _proto.enable = function enable() {
      this.container.classList.remove('psv-button--disabled');
      this.prop.enabled = true;
    }
    /**
     * @summary Collapses the button in the navbar menu
     */
    ;

    _proto.collapse = function collapse() {
      this.prop.collapsed = true;
      this.container.style.display = 'none';
    }
    /**
     * @summary Uncollapses the button from the navbar menu
     */
    ;

    _proto.uncollapse = function uncollapse() {
      this.prop.collapsed = false;

      if (this.prop.visible) {
        this.container.style.display = '';
      }
    }
    /**
     * @summary Set the button icon
     * @param {string} icon SVG
     * @param {HTMLElement} [container] - default is the main button container
     * @private
     */
    ;

    _proto.__setIcon = function __setIcon(icon, container) {
      if (container === void 0) {
        container = this.container;
      }

      if (icon) {
        container.innerHTML = icon; // className is read-only on SVGElement

        container.querySelector('svg').classList.add('psv-button-svg');
      } else {
        container.innerHTML = '';
      }
    }
    /**
     * @summary Action when the button is clicked
     * @private
     * @abstract
     */
    ;

    _proto.onClick = function onClick() {
      throw new PSVError("onClick not implemented for button \"" + this.prop.id + "\".");
    };

    return AbstractButton;
  }(AbstractComponent);
  AbstractButton.id = null;
  AbstractButton.groupId = null;
  AbstractButton.icon = null;
  AbstractButton.iconActive = null;

  var playActive = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41 41\"><path fill=\"currentColor\" d=\"M40.5 14.1c-.1-.1-1.2-.5-2.898-1-.102 0-.202-.1-.202-.2C34.5 6.5 28 2 20.5 2S6.6 6.5 3.7 12.9c0 .1-.1.1-.2.2-1.7.6-2.8 1-2.9 1l-.6.3v12.1l.6.2c.1 0 1.1.399 2.7.899.1 0 .2.101.2.199C6.3 34.4 12.9 39 20.5 39c7.602 0 14.102-4.6 16.9-11.1 0-.102.1-.102.199-.2 1.699-.601 2.699-1 2.801-1l.6-.3V14.3l-.5-.2zM6.701 11.5C9.7 7 14.8 4 20.5 4c5.8 0 10.9 3 13.8 7.5.2.3-.1.6-.399.5-3.799-1-8.799-2-13.6-2-4.7 0-9.5 1-13.2 2-.3.1-.5-.2-.4-.5zM25.1 20.3L18.7 24c-.3.2-.7 0-.7-.5v-7.4c0-.4.4-.6.7-.4l6.399 3.8c.301.1.301.6.001.8zm9.4 8.901A16.421 16.421 0 0 1 20.5 37c-5.9 0-11.1-3.1-14-7.898-.2-.302.1-.602.4-.5 3.9 1 8.9 2.1 13.6 2.1 5 0 9.9-1 13.602-2 .298-.1.5.198.398.499z\"/><!--Created by Nick Bluth from the Noun Project--></svg>\n";

  var play = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41 41\"><path fill=\"currentColor\" d=\"M40.5 14.1c-.1-.1-1.2-.5-2.899-1-.101 0-.2-.1-.2-.2C34.5 6.5 28 2 20.5 2S6.6 6.5 3.7 12.9c0 .1-.1.1-.2.2-1.7.6-2.8 1-2.9 1l-.6.3v12.1l.6.2c.1 0 1.1.4 2.7.9.1 0 .2.1.2.199C6.3 34.4 12.9 39 20.5 39c7.601 0 14.101-4.6 16.9-11.1 0-.101.1-.101.2-.2 1.699-.6 2.699-1 2.8-1l.6-.3V14.3l-.5-.2zM20.5 4c5.8 0 10.9 3 13.8 7.5.2.3-.1.6-.399.5-3.8-1-8.8-2-13.6-2-4.7 0-9.5 1-13.2 2-.3.1-.5-.2-.4-.5C9.7 7 14.8 4 20.5 4zm0 33c-5.9 0-11.1-3.1-14-7.899-.2-.301.1-.601.4-.5 3.9 1 8.9 2.1 13.6 2.1 5 0 9.9-1 13.601-2 .3-.1.5.2.399.5A16.422 16.422 0 0 1 20.5 37zm18.601-12.1c0 .1-.101.3-.2.3-2.5.9-10.4 3.6-18.4 3.6-7.1 0-15.6-2.699-18.3-3.6C2.1 25.2 2 25 2 24.9V16c0-.1.1-.3.2-.3 2.6-.9 10.6-3.6 18.2-3.6 7.5 0 15.899 2.7 18.5 3.6.1 0 .2.2.2.3v8.9z\"/><path fill=\"currentColor\" d=\"M18.7 24l6.4-3.7c.3-.2.3-.7 0-.8l-6.4-3.8c-.3-.2-.7 0-.7.4v7.4c0 .5.4.7.7.5z\"/><!--Created by Nick Bluth from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar autorotate button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var AutorotateButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(AutorotateButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function AutorotateButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-autorotate-button', true) || this;

      _this.psv.on(EVENTS.AUTOROTATE, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = AutorotateButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.AUTOROTATE, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.AUTOROTATE:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles autorotate
     */
    ;

    _proto.onClick = function onClick() {
      if (this.psv.isAutorotateEnabled()) {
        this.psv.config.autorotateIdle = false;
        this.psv.resetIdleTimer();
      }

      this.psv.toggleAutorotate();
    };

    return AutorotateButton;
  }(AbstractButton);
  AutorotateButton.id = 'autorotate';
  AutorotateButton.icon = play;
  AutorotateButton.iconActive = playActive;

  /**
   * @summary Navigation bar custom button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var CustomButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(CustomButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {PSV.NavbarCustomButton} config
     */
    function CustomButton(navbar, config) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-custom-button', config.collapsable !== false, config.tabbable !== false) || this;
      /**
       * @member {Object}
       * @readonly
       * @private
       */

      _this.config = config;

      if (_this.config.id) {
        _this.prop.id = _this.config.id;
      } else {
        _this.prop.id = 'psvButton-' + Math.random().toString(36).substr(2, 9);
      }

      if (_this.config.className) {
        addClasses(_this.container, _this.config.className);
      }

      if (_this.config.title) {
        _this.container.title = _this.config.title;
      }

      if (_this.config.content) {
        _this.container.innerHTML = _this.config.content;
      }

      _this.prop.width = _this.container.offsetWidth;

      if (_this.config.enabled === false) {
        _this.disable();
      }

      if (_this.config.visible === false) {
        _this.hide();
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = CustomButton.prototype;

    _proto.destroy = function destroy() {
      delete this.config;

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     * @description Calls user method
     */
    ;

    _proto.onClick = function onClick() {
      if (this.config.onClick) {
        this.config.onClick.call(this.psv, this.psv);
      }
    };

    return CustomButton;
  }(AbstractButton);

  var info = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><path fill=\"currentColor\" d=\"M28.3 26.1c-1 2.6-1.9 4.8-2.6 7-2.5 7.4-5 14.7-7.2 22-1.3 4.4.5 7.2 4.3 7.8 1.3.2 2.8.2 4.2-.1 8.2-2 11.9-8.6 15.7-15.2l-2.2 2a18.8 18.8 0 0 1-7.4 5.2 2 2 0 0 1-1.6-.2c-.2-.1 0-1 0-1.4l.8-1.8L41.9 28c.5-1.4.9-3 .7-4.4-.2-2.6-3-4.4-6.3-4.4-8.8.2-15 4.5-19.5 11.8-.2.3-.2.6-.3 1.3 3.7-2.8 6.8-6.1 11.8-6.2z\"/><circle fill=\"currentColor\" cx=\"39.3\" cy=\"9.2\" r=\"8.2\"/><!--Created by Arafat Uddin from the Noun Project--></svg>\n";

  var MODE_NOTIF = 1;
  var MODE_PANEL = 2;
  /**
   * @summary Navigation bar description button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var DescriptionButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(DescriptionButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function DescriptionButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-description-button') || this;
      /**
       * @override
       * @property {string} mode - notification or panel
       */

      _this.prop = _extends({}, _this.prop, {
        mode: null
      });

      _this.psv.on(EVENTS.HIDE_NOTIFICATION, _assertThisInitialized(_this));

      _this.psv.on(EVENTS.SHOW_NOTIFICATION, _assertThisInitialized(_this));

      _this.psv.on(EVENTS.CLOSE_PANEL, _assertThisInitialized(_this));

      _this.psv.on(EVENTS.OPEN_PANEL, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = DescriptionButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.HIDE_NOTIFICATION, this);
      this.psv.off(EVENTS.SHOW_NOTIFICATION, this);
      this.psv.off(EVENTS.CLOSE_PANEL, this);
      this.psv.off(EVENTS.OPEN_PANEL, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      if (!this.prop.mode) {
        return;
      }

      var closed = false;

      switch (e.type) {
        case EVENTS.HIDE_NOTIFICATION:
          closed = this.prop.mode === MODE_NOTIF;
          break;

        case EVENTS.SHOW_NOTIFICATION:
          closed = this.prop.mode === MODE_NOTIF && e.args[0] !== IDS.DESCRIPTION;
          break;

        case EVENTS.CLOSE_PANEL:
          closed = this.prop.mode === MODE_PANEL;
          break;

        case EVENTS.OPEN_PANEL:
          closed = this.prop.mode === MODE_PANEL && e.args[0] !== IDS.DESCRIPTION;
          break;
      }

      if (closed) {
        this.toggleActive(false);
        this.prop.mode = null;
      }
    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide(refresh) {
      _AbstractButton.prototype.hide.call(this, refresh);

      if (this.prop.mode) {
        this.__close();
      }
    }
    /**
     * This button can only be refresh from NavbarCaption
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi(refresh) {
      if (refresh === void 0) {
        refresh = false;
      }

      if (refresh) {
        var caption = this.psv.navbar.getButton('caption', false);
        var captionHidden = caption && !caption.isVisible();
        var hasDescription = !!this.psv.config.description;

        if (captionHidden || hasDescription) {
          this.show(false);
        } else {
          this.hide(false);
        }
      }
    }
    /**
     * @override
     * @description Toggles caption
     */
    ;

    _proto.onClick = function onClick() {
      if (this.prop.mode) {
        this.__close();
      } else {
        this.__open();
      }
    }
    /**
     * @private
     */
    ;

    _proto.__close = function __close() {
      switch (this.prop.mode) {
        case MODE_NOTIF:
          this.psv.notification.hide(IDS.DESCRIPTION);
          break;

        case MODE_PANEL:
          this.psv.panel.hide(IDS.DESCRIPTION);
          break;
      }
    }
    /**
     * @private
     */
    ;

    _proto.__open = function __open() {
      this.toggleActive(true);

      if (this.psv.config.description) {
        this.prop.mode = MODE_PANEL;
        this.psv.panel.show({
          id: IDS.DESCRIPTION,
          content: "" + (this.psv.config.caption ? "<p>" + this.psv.config.caption + "</p>" : '') + this.psv.config.description
        });
      } else {
        this.prop.mode = MODE_NOTIF;
        this.psv.notification.show({
          id: IDS.DESCRIPTION,
          content: this.psv.config.caption
        });
      }
    };

    return DescriptionButton;
  }(AbstractButton);
  DescriptionButton.id = 'description';
  DescriptionButton.icon = info;

  var download = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M83.3 35.6h-17V3H32.2v32.6H16.6l33.6 32.7 33-32.7z\"/><path fill=\"currentColor\" d=\"M83.3 64.2v16.3H16.6V64.2H-.1v32.6H100V64.2H83.3z\"/><!--Created by Michael Zenaty from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar download button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var DownloadButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(DownloadButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function DownloadButton(navbar) {
      return _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-download-button', true) || this;
    }
    /**
     * @override
     * @description Asks the browser to download the panorama source file
     */


    var _proto = DownloadButton.prototype;

    _proto.onClick = function onClick() {
      var _this = this;

      var link = document.createElement('a');
      link.href = this.psv.config.downloadUrl || this.psv.config.panorama;
      link.download = link.href.split('/').pop();
      this.psv.container.appendChild(link);
      link.click();
      setTimeout(function () {
        _this.psv.container.removeChild(link);
      }, 100);
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      var supported = this.psv.adapter.constructor.supportsDownload || this.psv.config.downloadUrl;

      if (supported && !this.prop.visible) {
        this.show();
      } else if (!supported && this.prop.visible) {
        this.hide();
      }
    };

    return DownloadButton;
  }(AbstractButton);
  DownloadButton.id = 'download';
  DownloadButton.icon = download;

  var fullscreenIn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M100 40H87.1V18.8h-21V6H100zM100 93.2H66V80.3h21.1v-21H100zM34 93.2H0v-34h12.9v21.1h21zM12.9 40H0V6h34v12.9H12.8z\"/><!--Created by Garrett Knoll from the Noun Project--></svg>\n";

  var fullscreenOut = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M66 7h13v21h21v13H66zM66 60.3h34v12.9H79v21H66zM0 60.3h34v34H21V73.1H0zM21 7h13v34H0V28h21z\"/><!--Created by Garrett Knoll from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar fullscreen button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var FullscreenButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(FullscreenButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function FullscreenButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-fullscreen-button') || this;

      _this.psv.on(EVENTS.FULLSCREEN_UPDATED, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = FullscreenButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.FULLSCREEN_UPDATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * Handle events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.FULLSCREEN_UPDATED:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles fullscreen
     */
    ;

    _proto.onClick = function onClick() {
      this.psv.toggleFullscreen();
    };

    return FullscreenButton;
  }(AbstractButton);
  FullscreenButton.id = 'fullscreen';
  FullscreenButton.icon = fullscreenIn;
  FullscreenButton.iconActive = fullscreenOut;

  var menuIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"10 10 80 80\"><g fill=\"currentColor\"><circle r=\"10\" cx=\"20\" cy=\"20\"/><circle r=\"10\" cx=\"50\" cy=\"20\"/><circle r=\"10\" cx=\"80\" cy=\"20\"/><circle r=\"10\" cx=\"20\" cy=\"50\"/><circle r=\"10\" cx=\"50\" cy=\"50\"/><circle r=\"10\" cx=\"80\" cy=\"50\"/><circle r=\"10\" cx=\"20\" cy=\"80\"/><circle r=\"10\" cx=\"50\" cy=\"80\"/><circle r=\"10\" cx=\"80\" cy=\"80\"/></g><!-- Created by Richard Kunák from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar menu button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var MenuButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(MenuButton, _AbstractButton);

    /**
     * @summary Property name added to buttons list
     * @type {string}
     * @constant
     */

    /**
     * @summary Menu template
     * @param {AbstractButton[]} buttons
     * @param {PSV.Viewer} psv
     * @param {string} dataKey
     * @returns {string}
     */

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MenuButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-menu-button') || this;

      _this.psv.on(EVENTS.OPEN_PANEL, _assertThisInitialized(_this));

      _this.psv.on(EVENTS.CLOSE_PANEL, _assertThisInitialized(_this));

      _AbstractButton.prototype.hide.call(_assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = MenuButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.OPEN_PANEL, this);
      this.psv.off(EVENTS.CLOSE_PANEL, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.OPEN_PANEL:
          this.toggleActive(e.args[0] === IDS.MENU);
          break;

        case EVENTS.CLOSE_PANEL:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide(refresh) {
      _AbstractButton.prototype.hide.call(this, refresh);

      this.__hideMenu();
    }
    /**
     * @override
     */
    ;

    _proto.show = function show(refresh) {
      _AbstractButton.prototype.show.call(this, refresh);

      if (this.prop.active) {
        this.__showMenu();
      }
    }
    /**
     * @override
     * @description Toggles menu
     */
    ;

    _proto.onClick = function onClick() {
      if (this.prop.active) {
        this.__hideMenu();
      } else {
        this.__showMenu();
      }
    };

    _proto.__showMenu = function __showMenu() {
      var _this2 = this;

      this.psv.panel.show({
        id: IDS.MENU,
        content: MenuButton.MENU_TEMPLATE(this.parent.collapsed, this.psv, dasherize(MenuButton.BUTTON_DATA)),
        noMargin: true,
        clickHandler: function clickHandler(e) {
          var li = e.target ? getClosest(e.target, 'li') : undefined;
          var buttonId = li ? li.dataset[MenuButton.BUTTON_DATA] : undefined;

          if (buttonId) {
            _this2.parent.getButton(buttonId).onClick();

            _this2.__hideMenu();
          }
        }
      });
    };

    _proto.__hideMenu = function __hideMenu() {
      this.psv.panel.hide(IDS.MENU);
    };

    return MenuButton;
  }(AbstractButton);
  MenuButton.id = 'menu';
  MenuButton.icon = menuIcon;
  MenuButton.BUTTON_DATA = 'psvButton';

  MenuButton.MENU_TEMPLATE = function (buttons, psv, dataKey) {
    return "\n<div class=\"psv-panel-menu psv-panel-menu--stripped\">\n  <h1 class=\"psv-panel-menu-title\">" + menuIcon + " " + psv.config.lang.menu + "</h1>\n  <ul class=\"psv-panel-menu-list\">\n    " + buttons.map(function (button) {
      return "\n    <li data-" + dataKey + "=\"" + button.prop.id + "\" class=\"psv-panel-menu-item\" tabindex=\"0\">\n      <span class=\"psv-panel-menu-item-icon\">" + button.container.innerHTML + "</span>\n      <span class=\"psv-panel-menu-item-label\">" + button.container.title + "</span>\n    </li>\n    ";
    }).join('') + "\n  </ul>\n</div>\n";
  };

  var arrow = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"40 40 432 432\"><g transform=\"rotate(0, 256, 256)\"><path fill=\"currentColor\" d=\"M425.23 210.55H227.39a5 5 0 01-3.53-8.53l56.56-56.57a45.5 45.5 0 000-64.28 45.15 45.15 0 00-32.13-13.3 45.15 45.15 0 00-32.14 13.3L41.32 256l174.83 174.83a45.15 45.15 0 0032.14 13.3 45.15 45.15 0 0032.13-13.3 45.5 45.5 0 000-64.28l-56.57-56.57a5 5 0 013.54-8.53h197.84c25.06 0 45.45-20.39 45.45-45.45s-20.4-45.45-45.45-45.45z\"/></g><!-- Created by Flatart from the Noun Project --></svg>\n";

  /**
   * @summary Helper for pressable things (buttons, keyboard)
   * @description When the pressed thing goes up and was not pressed long enough, wait a bit more before execution
   * @private
   */
  var PressHandler = /*#__PURE__*/function () {
    function PressHandler(delay) {
      if (delay === void 0) {
        delay = 200;
      }

      this.delay = delay;
      this.time = 0;
      this.timeout = null;
    }

    var _proto = PressHandler.prototype;

    _proto.down = function down() {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      this.time = new Date().getTime();
    };

    _proto.up = function up(cb) {
      var _this = this;

      if (!this.time) {
        return;
      }

      var elapsed = new Date().getTime() - this.time;

      if (elapsed < this.delay) {
        this.timeout = setTimeout(function () {
          cb();
          _this.timeout = null;
          _this.time = 0;
        }, this.delay);
      } else {
        cb();
        this.time = 0;
      }
    };

    return PressHandler;
  }();

  function getOrientedArrow(direction) {
    var angle = 0;

    switch (direction) {
      // @formatter:off
      case 'up':
        angle = 90;
        break;

      case 'right':
        angle = 180;
        break;

      case 'down':
        angle = -90;
        break;

      default:
        angle = 0;
        break;
      // @formatter:on
    }

    return arrow.replace('rotate(0', "rotate(" + angle);
  }
  /**
   * @summary Navigation bar move button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var AbstractMoveButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(AbstractMoveButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {number} value
     */
    function AbstractMoveButton(navbar, value) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-move-button') || this;
      _this.container.title = _this.psv.config.lang.move;
      /**
       * @override
       * @property {{longitude: boolean, latitude: boolean}} value
       * @property {PressHandler} handler
       */

      _this.prop = _extends({}, _this.prop, {
        value: value,
        handler: new PressHandler()
      });

      _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

      _this.container.addEventListener('keydown', _assertThisInitialized(_this));

      _this.container.addEventListener('keyup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = AbstractMoveButton.prototype;

    _proto.destroy = function destroy() {
      this.__onMouseUp();

      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__onMouseDown();

          break;

        case 'mouseup':
          this.__onMouseUp();

          break;

        case 'touchend':
          this.__onMouseUp();

          break;

        case 'keydown':
          e.key === KEY_CODES.Enter && this.__onMouseDown();
          break;

        case 'keyup':
          e.key === KEY_CODES.Enter && this.__onMouseUp();
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return {
        initial: !SYSTEM.isTouchEnabled.initial,
        promise: SYSTEM.isTouchEnabled.promise.then(function (enabled) {
          return !enabled;
        })
      };
    }
    /**
     * @override
     */
    ;

    _proto.onClick = function onClick() {// nothing
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown() {
      if (!this.prop.enabled) {
        return;
      }

      this.psv.__stopAll();

      this.psv.dynamics.position.roll(this.prop.value);
      this.prop.handler.down();
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp() {
      var _this2 = this;

      if (!this.prop.enabled) {
        return;
      }

      this.prop.handler.up(function () {
        _this2.psv.dynamics.position.stop();

        _this2.psv.resetIdleTimer();
      });
    };

    return AbstractMoveButton;
  }(AbstractButton);
  AbstractMoveButton.groupId = 'move';

  /**
   * @summary Navigation bar move down button class
   * @extends PSV.buttons.AbstractMoveButton
   * @memberof PSV.buttons
   */

  var MoveDownButton = /*#__PURE__*/function (_AbstractMoveButton) {
    _inheritsLoose(MoveDownButton, _AbstractMoveButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MoveDownButton(navbar) {
      return _AbstractMoveButton.call(this, navbar, {
        latitude: true
      }) || this;
    }

    return MoveDownButton;
  }(AbstractMoveButton);
  MoveDownButton.id = 'moveDown';
  MoveDownButton.icon = getOrientedArrow('down');

  /**
   * @summary Navigation bar move left button class
   * @extends PSV.buttons.AbstractMoveButton
   * @memberof PSV.buttons
   */

  var MoveLeftButton = /*#__PURE__*/function (_AbstractMoveButton) {
    _inheritsLoose(MoveLeftButton, _AbstractMoveButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MoveLeftButton(navbar) {
      return _AbstractMoveButton.call(this, navbar, {
        longitude: true
      }) || this;
    }

    return MoveLeftButton;
  }(AbstractMoveButton);
  MoveLeftButton.id = 'moveLeft';
  MoveLeftButton.icon = getOrientedArrow('left');

  /**
   * @summary Navigation bar move right button class
   * @extends PSV.buttons.AbstractMoveButton
   * @memberof PSV.buttons
   */

  var MoveRightButton = /*#__PURE__*/function (_AbstractMoveButton) {
    _inheritsLoose(MoveRightButton, _AbstractMoveButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MoveRightButton(navbar) {
      return _AbstractMoveButton.call(this, navbar, {
        longitude: false
      }) || this;
    }

    return MoveRightButton;
  }(AbstractMoveButton);
  MoveRightButton.id = 'moveRight';
  MoveRightButton.icon = getOrientedArrow('right');

  /**
   * @summary Navigation bar move up button class
   * @extends PSV.buttons.AbstractMoveButton
   * @memberof PSV.buttons
   */

  var MoveUpButton = /*#__PURE__*/function (_AbstractMoveButton) {
    _inheritsLoose(MoveUpButton, _AbstractMoveButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MoveUpButton(navbar) {
      return _AbstractMoveButton.call(this, navbar, {
        latitude: false
      }) || this;
    }

    return MoveUpButton;
  }(AbstractMoveButton);
  MoveUpButton.id = 'moveUp';
  MoveUpButton.icon = getOrientedArrow('up');

  /**
   * @summary Navigation bar zoom button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var AbstractZoomButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(AbstractZoomButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {number} value
     */
    function AbstractZoomButton(navbar, value) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-zoom-button') || this;
      /**
       * @override
       * @property {boolean} value
       * @property {PressHandler} handler
       */

      _this.prop = _extends({}, _this.prop, {
        value: value,
        handler: new PressHandler()
      });

      _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

      _this.container.addEventListener('keydown', _assertThisInitialized(_this));

      _this.container.addEventListener('keyup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = AbstractZoomButton.prototype;

    _proto.destroy = function destroy() {
      this.__onMouseUp();

      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__onMouseDown();

          break;

        case 'mouseup':
          this.__onMouseUp();

          break;

        case 'touchend':
          this.__onMouseUp();

          break;

        case 'keydown':
          e.key === KEY_CODES.Enter && this.__onMouseDown();
          break;

        case 'keyup':
          e.key === KEY_CODES.Enter && this.__onMouseUp();
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return {
        initial: !SYSTEM.isTouchEnabled.initial,
        promise: SYSTEM.isTouchEnabled.promise.then(function (enabled) {
          return !enabled;
        })
      };
    }
    /**
     * @override
     */
    ;

    _proto.onClick = function onClick() {// nothing
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown() {
      if (!this.prop.enabled) {
        return;
      }

      this.psv.dynamics.zoom.roll(this.prop.value);
      this.prop.handler.down();
    }
    /**
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp() {
      var _this2 = this;

      if (!this.prop.enabled) {
        return;
      }

      this.prop.handler.up(function () {
        return _this2.psv.dynamics.zoom.stop();
      });
    };

    return AbstractZoomButton;
  }(AbstractButton);
  AbstractZoomButton.groupId = 'zoom';

  var zoomIn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path fill=\"currentColor\" d=\"M14.043 12.22a7.738 7.738 0 1 0-1.823 1.822l4.985 4.985c.503.504 1.32.504 1.822 0a1.285 1.285 0 0 0 0-1.822l-4.984-4.985zm-6.305 1.043a5.527 5.527 0 1 1 0-11.053 5.527 5.527 0 0 1 0 11.053z\"/><path fill=\"currentColor\" d=\"M8.728 4.009H6.744v2.737H4.006V8.73h2.738v2.736h1.984V8.73h2.737V6.746H8.728z\"/><!--Created by Ryan Canning from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar zoom-in button class
   * @extends PSV.buttons.AbstractZoomButton
   * @memberof PSV.buttons
   */

  var ZoomInButton = /*#__PURE__*/function (_AbstractZoomButton) {
    _inheritsLoose(ZoomInButton, _AbstractZoomButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function ZoomInButton(navbar) {
      return _AbstractZoomButton.call(this, navbar, false) || this;
    }

    return ZoomInButton;
  }(AbstractZoomButton);
  ZoomInButton.id = 'zoomIn';
  ZoomInButton.icon = zoomIn;

  var zoomOut = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path fill=\"currentColor\" d=\"M14.043 12.22a7.738 7.738 0 1 0-1.823 1.822l4.985 4.985c.503.504 1.32.504 1.822 0a1.285 1.285 0 0 0 0-1.822l-4.984-4.985zm-6.305 1.043a5.527 5.527 0 1 1 0-11.053 5.527 5.527 0 0 1 0 11.053z\"/><path fill=\"currentColor\" d=\"M4.006 6.746h7.459V8.73H4.006z\"/><!--Created by Ryan Canning from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar zoom-out button class
   * @extends PSV.buttons.AbstractZoomButton
   * @memberof PSV.buttons
   */

  var ZoomOutButton = /*#__PURE__*/function (_AbstractZoomButton) {
    _inheritsLoose(ZoomOutButton, _AbstractZoomButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function ZoomOutButton(navbar) {
      return _AbstractZoomButton.call(this, navbar, true) || this;
    }

    return ZoomOutButton;
  }(AbstractZoomButton);
  ZoomOutButton.id = 'zoomOut';
  ZoomOutButton.icon = zoomOut;

  /**
   * @summary Navigation bar zoom button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var ZoomRangeButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(ZoomRangeButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function ZoomRangeButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-zoom-range', false, false) || this;
      /**
       * @override
       * @property {number} mediaMinWidth
       */

      _this.prop = _extends({}, _this.prop, {
        mediaMinWidth: 0
      });
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.zoomRange = document.createElement('div');
      _this.zoomRange.className = 'psv-zoom-range-line';

      _this.container.appendChild(_this.zoomRange);
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.zoomValue = document.createElement('div');
      _this.zoomValue.className = 'psv-zoom-range-handle';

      _this.zoomRange.appendChild(_this.zoomValue);
      /**
       * @member {PSV.Slider}
       * @readonly
       * @private
       */


      _this.slider = new Slider({
        container: _this.container,
        direction: Slider.HORIZONTAL,
        onUpdate: function onUpdate(e) {
          return _this.__onSliderUpdate(e);
        }
      });
      _this.prop.mediaMinWidth = parseInt(getStyle(_this.container, 'maxWidth'), 10);

      _this.psv.on(EVENTS.ZOOM_UPDATED, _assertThisInitialized(_this));

      if (_this.psv.prop.ready) {
        _this.__moveZoomValue(_this.psv.getZoomLevel());
      } else {
        _this.psv.once(EVENTS.READY, _assertThisInitialized(_this));
      }

      _this.refreshUi();

      return _this;
    }
    /**
     * @override
     */


    var _proto = ZoomRangeButton.prototype;

    _proto.destroy = function destroy() {
      this.slider.destroy();
      delete this.zoomRange;
      delete this.zoomValue;
      this.psv.off(EVENTS.ZOOM_UPDATED, this);
      this.psv.off(EVENTS.READY, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.ZOOM_UPDATED:
          this.__moveZoomValue(e.args[0]);

          break;

        case EVENTS.READY:
          this.__moveZoomValue(this.psv.getZoomLevel());

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return {
        initial: !SYSTEM.isTouchEnabled.initial,
        promise: SYSTEM.isTouchEnabled.promise.then(function (enabled) {
          return !enabled;
        })
      };
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      if (this.prop.supported) {
        if (this.psv.prop.size.width <= this.prop.mediaMinWidth && this.prop.visible) {
          this.hide();
        } else if (this.psv.prop.size.width > this.prop.mediaMinWidth && !this.prop.visible) {
          this.show();
        }
      }
    }
    /**
     * @override
     */
    ;

    _proto.onClick = function onClick() {// nothing
    }
    /**
     * @summary Moves the zoom cursor
     * @param {number} level
     * @private
     */
    ;

    _proto.__moveZoomValue = function __moveZoomValue(level) {
      this.zoomValue.style.left = level / 100 * this.zoomRange.offsetWidth - this.zoomValue.offsetWidth / 2 + 'px';
    }
    /**
     * @summary Zoom change
     * @private
     */
    ;

    _proto.__onSliderUpdate = function __onSliderUpdate(e) {
      if (e.mousedown) {
        this.psv.zoom(e.value * 100);
      }
    };

    return ZoomRangeButton;
  }(AbstractButton);
  ZoomRangeButton.id = 'zoomRange';
  ZoomRangeButton.groupId = 'zoom';

  /**
   * @namespace PSV.plugins
   */

  /**
   * @summary Base plugins class
   * @memberof PSV.plugins
   * @abstract
   */

  var AbstractPlugin = /*#__PURE__*/function (_EventEmitter) {
    _inheritsLoose(AbstractPlugin, _EventEmitter);

    /**
     * @summary Unique identifier of the plugin
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @param {PSV.Viewer} psv
     */
    function AbstractPlugin(psv) {
      var _this;

      _this = _EventEmitter.call(this) || this;
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */

      _this.psv = psv;
      return _this;
    }
    /**
     * @summary Initializes the plugin
     * @package
     */


    var _proto = AbstractPlugin.prototype;

    _proto.init = function init() {}
    /**
     * @summary Destroys the plugin
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      delete this.psv;
    };

    return AbstractPlugin;
  }(uevent.EventEmitter);
  AbstractPlugin.id = null;

  var _keyboard;
  /**
   * @summary Default options
   * @type {PSV.Options}
   * @memberOf PSV
   * @constant
   */

  var DEFAULTS = {
    panorama: null,
    overlay: null,
    overlayOpacity: 1,
    container: null,
    adapter: null,
    plugins: [],
    caption: null,
    description: null,
    downloadUrl: null,
    loadingImg: null,
    loadingTxt: 'Loading...',
    size: null,
    fisheye: false,
    minFov: 30,
    maxFov: 90,
    defaultZoomLvl: 50,
    defaultLong: 0,
    defaultLat: 0,
    sphereCorrection: null,
    moveSpeed: 1,
    zoomSpeed: 1,
    autorotateDelay: null,
    autorotateIdle: false,
    autorotateSpeed: '2rpm',
    autorotateLat: null,
    autorotateZoomLvl: null,
    moveInertia: true,
    mousewheel: true,
    mousemove: true,
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,
    useXmpData: true,
    panoData: null,
    requestHeaders: null,
    canvasBackground: '#000',
    withCredentials: false,
    navbar: ['autorotate', 'zoom', 'move', 'download', 'description', 'caption', 'fullscreen'],
    lang: {
      autorotate: 'Automatic rotation',
      zoom: 'Zoom',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      move: 'Move',
      download: 'Download',
      fullscreen: 'Fullscreen',
      menu: 'Menu',
      twoFingers: 'Use two fingers to navigate',
      ctrlZoom: 'Use ctrl + scroll to zoom the image',
      loadError: 'The panorama can\'t be loaded'
    },
    keyboard: (_keyboard = {}, _keyboard[KEY_CODES.ArrowUp] = ACTIONS.ROTATE_LAT_UP, _keyboard[KEY_CODES.ArrowDown] = ACTIONS.ROTATE_LAT_DOWN, _keyboard[KEY_CODES.ArrowRight] = ACTIONS.ROTATE_LONG_RIGHT, _keyboard[KEY_CODES.ArrowLeft] = ACTIONS.ROTATE_LONG_LEFT, _keyboard[KEY_CODES.PageUp] = ACTIONS.ZOOM_IN, _keyboard[KEY_CODES.PageDown] = ACTIONS.ZOOM_OUT, _keyboard[KEY_CODES.Plus] = ACTIONS.ZOOM_IN, _keyboard[KEY_CODES.Minus] = ACTIONS.ZOOM_OUT, _keyboard[KEY_CODES.Space] = ACTIONS.TOGGLE_AUTOROTATE, _keyboard)
  };
  /**
   * @summary List of unmodifiable options and their error messages
   * @private
   */

  var READONLY_OPTIONS = {
    panorama: 'Use setPanorama method to change the panorama',
    panoData: 'Use setPanorama method to change the panorama',
    container: 'Cannot change viewer container',
    adapter: 'Cannot change adapter',
    plugins: 'Cannot change plugins'
  };
  /**
   * @summary List of deprecated options and their warning messages
   * @private
   */

  var DEPRECATED_OPTIONS = {
    captureCursor: 'captureCursor is deprecated'
  };
  /**
   * @summary Parsers/validators for each option
   * @private
   */

  var CONFIG_PARSERS = {
    container: function container(_container) {
      if (!_container) {
        throw new PSVError('No value given for container.');
      }

      return _container;
    },
    adapter: function adapter(_adapter) {
      if (!_adapter) {
        _adapter = [EquirectangularAdapter];
      } else if (Array.isArray(_adapter)) {
        _adapter = [pluginInterop(_adapter[0], AbstractAdapter), _adapter[1]];
      } else {
        _adapter = [pluginInterop(_adapter, AbstractAdapter)];
      }

      if (!_adapter[0]) {
        throw new PSVError('Un undefined value with given for adapter.');
      }

      return _adapter;
    },
    overlayOpacity: function overlayOpacity(_overlayOpacity) {
      return three.MathUtils.clamp(_overlayOpacity, 0, 1);
    },
    defaultLong: function defaultLong(_defaultLong) {
      // defaultLat is between 0 and PI
      return parseAngle(_defaultLong);
    },
    defaultLat: function defaultLat(_defaultLat) {
      // defaultLat is between -PI/2 and PI/2
      return parseAngle(_defaultLat, true);
    },
    defaultZoomLvl: function defaultZoomLvl(_defaultZoomLvl) {
      return three.MathUtils.clamp(_defaultZoomLvl, 0, 100);
    },
    minFov: function minFov(_minFov, config) {
      // minFov and maxFov must be ordered
      if (config.maxFov < _minFov) {
        logWarn('maxFov cannot be lower than minFov');
        _minFov = config.maxFov;
      } // minFov between 1 and 179


      return three.MathUtils.clamp(_minFov, 1, 179);
    },
    maxFov: function maxFov(_maxFov, config) {
      // minFov and maxFov must be ordered
      if (_maxFov < config.minFov) {
        _maxFov = config.minFov;
      } // maxFov between 1 and 179


      return three.MathUtils.clamp(_maxFov, 1, 179);
    },
    lang: function lang(_lang) {
      if (Array.isArray(_lang.twoFingers)) {
        logWarn('lang.twoFingers must not be an array');
        _lang.twoFingers = _lang.twoFingers[0];
      }

      return _extends({}, DEFAULTS.lang, _lang);
    },
    keyboard: function keyboard(_keyboard2) {
      // keyboard=true becomes the default map
      if (_keyboard2 === true) {
        return clone(DEFAULTS.keyboard);
      }

      return _keyboard2;
    },
    autorotateLat: function autorotateLat(_autorotateLat, config) {
      // default autorotateLat is defaultLat
      if (_autorotateLat === null) {
        return parseAngle(config.defaultLat, true);
      } // autorotateLat is between -PI/2 and PI/2
      else {
        return parseAngle(_autorotateLat, true);
      }
    },
    autorotateZoomLvl: function autorotateZoomLvl(_autorotateZoomLvl) {
      if (isNil(_autorotateZoomLvl)) {
        return null;
      } else {
        return three.MathUtils.clamp(_autorotateZoomLvl, 0, 100);
      }
    },
    autorotateSpeed: function autorotateSpeed(_autorotateSpeed) {
      return parseSpeed(_autorotateSpeed);
    },
    autorotateIdle: function autorotateIdle(_autorotateIdle, config) {
      if (_autorotateIdle && isNil(config.autorotateDelay)) {
        logWarn('autorotateIdle requires a non null autorotateDelay');
        return false;
      }

      return _autorotateIdle;
    },
    fisheye: function fisheye(_fisheye) {
      // translate boolean fisheye to amount
      if (_fisheye === true) {
        return 1;
      } else if (_fisheye === false) {
        return 0;
      }

      return _fisheye;
    },
    plugins: function plugins(_plugins) {
      return _plugins.map(function (plugin) {
        if (Array.isArray(plugin)) {
          plugin = [pluginInterop(plugin[0], AbstractPlugin), plugin[1]];
        } else {
          plugin = [pluginInterop(plugin, AbstractPlugin)];
        }

        if (!plugin[0]) {
          throw new PSVError('Un undefined value was given for plugins.');
        }

        return plugin;
      });
    }
  };
  /**
   * @summary Merge user config with default config and performs validation
   * @param {PSV.Options} options
   * @returns {PSV.Options}
   * @memberOf PSV
   * @private
   */

  function getConfig(options) {
    var tempConfig = clone(DEFAULTS);
    deepmerge(tempConfig, options);
    var config = {};
    each(tempConfig, function (value, key) {
      if (DEPRECATED_OPTIONS[key]) {
        logWarn(DEPRECATED_OPTIONS[key]);
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
        throw new PSVError("Unknown option " + key);
      }

      if (CONFIG_PARSERS[key]) {
        config[key] = CONFIG_PARSERS[key](value, tempConfig);
      } else {
        config[key] = value;
      }
    });
    return config;
  }

  /**
   * @summary Navbar caption class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var NavbarCaption = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(NavbarCaption, _AbstractComponent);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {string} caption
     */
    function NavbarCaption(navbar, caption) {
      var _this;

      _this = _AbstractComponent.call(this, navbar, 'psv-caption') || this;
      /**
       * @override
       * @property {string} id
       * @property {boolean} collapsable
       * @property {number} width
       * @property {number} contentWidth - width of the caption content
       */

      _this.prop = _extends({}, _this.prop, {
        id: _this.constructor.id,
        collapsable: false,
        width: 0,
        contentWidth: 0
      });
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-caption-content';

      _this.container.appendChild(_this.content);

      _this.setCaption(caption);

      return _this;
    }
    /**
     * @override
     */


    var _proto = NavbarCaption.prototype;

    _proto.destroy = function destroy() {
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Sets the bar caption
     * @param {string} html
     */
    ;

    _proto.setCaption = function setCaption(html) {
      this.show();
      this.content.innerHTML = html;
      this.prop.contentWidth = html ? this.content.offsetWidth : 0;
      this.refreshUi();
    }
    /**
     * @summary Toggles content and icon depending on available space
     * @private
     */
    ;

    _proto.refreshUi = function refreshUi() {
      this.toggle(this.container.offsetWidth >= this.prop.contentWidth);

      this.__refreshButton();
    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide() {
      this.content.style.display = 'none';
      this.prop.visible = false;
    }
    /**
     * @override
     */
    ;

    _proto.show = function show() {
      this.content.style.display = '';
      this.prop.visible = true;
    }
    /**
     * @private
     */
    ;

    _proto.__refreshButton = function __refreshButton() {
      var _this$psv$navbar$getB;

      (_this$psv$navbar$getB = this.psv.navbar.getButton(DescriptionButton.id, false)) == null ? void 0 : _this$psv$navbar$getB.refreshUi(true);
    };

    return NavbarCaption;
  }(AbstractComponent);
  NavbarCaption.id = 'caption';

  /**
   * @summary List of available buttons
   * @type {Object<string, Class<PSV.buttons.AbstractButton>>}
   * @private
   */

  var AVAILABLE_BUTTONS = {};
  /**
   * @summary List of available buttons
   * @type {Object<string, Array<Class<PSV.buttons.AbstractButton>>>}
   * @private
   */

  var AVAILABLE_GROUPS = {};
  /**
   * @summary Register a new button available for all viewers
   * @param {Class<PSV.buttons.AbstractButton>} button
   * @param {'start' | 'end' | '[id]:left' | '[id]:right'} [defaultPosition]
   *    If provided the default configuration of the navbar will be modified.
   * @memberOf PSV
   */

  function registerButton(button, defaultPosition) {
    if (!button.id) {
      throw new PSVError('Button ID is required');
    }

    AVAILABLE_BUTTONS[button.id] = button;

    if (button.groupId) {
      AVAILABLE_GROUPS[button.groupId] = AVAILABLE_GROUPS[button.groupId] || [];
      AVAILABLE_GROUPS[button.groupId].push(button);
    }

    if (typeof defaultPosition === 'string') {
      switch (defaultPosition) {
        case 'start':
          DEFAULTS.navbar.unshift(button.id);
          break;

        case 'end':
          DEFAULTS.navbar.push(button.id);
          break;

        default:
          var _defaultPosition$spli = defaultPosition.split(':'),
              id = _defaultPosition$spli[0],
              pos = _defaultPosition$spli[1];

          DEFAULTS.navbar.splice(DEFAULTS.navbar.indexOf(id) + (pos === 'right' ? 1 : 0), 0, button.id);
      }
    }
  }
  [AutorotateButton, ZoomOutButton, ZoomRangeButton, ZoomInButton, DescriptionButton, DownloadButton, FullscreenButton, MoveLeftButton, MoveRightButton, MoveUpButton, MoveDownButton].forEach(registerButton);
  /**
   * @summary Navigation bar component
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Navbar = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Navbar, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Navbar(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-navbar psv--capture-event') || this;
      /**
       * @summary List of buttons of the navbar
       * @member {PSV.buttons.AbstractButton[]}
       * @override
       */

      _this.children = [];
      /**
       * @summary List of collapsed buttons
       * @member {PSV.buttons.AbstractButton[]}
       * @private
       */

      _this.collapsed = [];
      return _this;
    }
    /**
     * @summary Change the buttons visible on the navbar
     * @param {string|Array<string|PSV.NavbarCustomButton>} buttons
     * @throws {PSV.PSVError} when a button is unknown
     */


    var _proto = Navbar.prototype;

    _proto.setButtons = function setButtons(buttons) {
      var _this2 = this;

      this.children.slice().forEach(function (item) {
        return item.destroy();
      });
      this.children.length = 0;

      var cleanedButtons = this.__cleanButtons(buttons); // force description button if caption is present (used on narrow screens)


      if (cleanedButtons.indexOf(NavbarCaption.id) !== -1 && cleanedButtons.indexOf(DescriptionButton.id) === -1) {
        cleanedButtons.splice(cleanedButtons.indexOf(NavbarCaption.id), 0, DescriptionButton.id);
      }
      /* eslint-disable no-new */


      cleanedButtons.forEach(function (button) {
        if (typeof button === 'object') {
          new CustomButton(_this2, button);
        } else if (AVAILABLE_BUTTONS[button]) {
          new AVAILABLE_BUTTONS[button](_this2);
        } else if (AVAILABLE_GROUPS[button]) {
          AVAILABLE_GROUPS[button].forEach(function (buttonCtor) {
            return new buttonCtor(_this2);
          }); // eslint-disable-line new-cap
        } else if (button === NavbarCaption.id) {
          new NavbarCaption(_this2, _this2.psv.config.caption);
        } else {
          throw new PSVError('Unknown button ' + button);
        }
      });
      new MenuButton(this);
      /* eslint-enable no-new */

      this.children.forEach(function (item) {
        if (typeof item.checkSupported === 'function') {
          item.checkSupported();
        }
      });
    }
    /**
     * @summary Sets the bar caption
     * @param {string} html
     */
    ;

    _proto.setCaption = function setCaption(html) {
      var caption = this.getButton(NavbarCaption.id, false);
      caption == null ? void 0 : caption.setCaption(html);
    }
    /**
     * @summary Returns a button by its identifier
     * @param {string} id
     * @param {boolean} [warnNotFound=true]
     * @returns {PSV.buttons.AbstractButton}
     */
    ;

    _proto.getButton = function getButton(id, warnNotFound) {
      if (warnNotFound === void 0) {
        warnNotFound = true;
      }

      var button = null;
      this.children.some(function (item) {
        if (item.prop.id === id) {
          button = item;
          return true;
        } else {
          return false;
        }
      });

      if (!button && warnNotFound) {
        logWarn("button \"" + id + "\" not found in the navbar");
      }

      return button;
    }
    /**
     * @summary Shows the navbar
     */
    ;

    _proto.show = function show() {
      this.container.classList.add('psv-navbar--open');
      this.prop.visible = true;
    }
    /**
     * @summary Hides the navbar
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-navbar--open');
      this.prop.visible = false;
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      _AbstractComponent.prototype.refreshUi.call(this);

      if (this.psv.prop.uiRefresh === true) {
        var availableWidth = this.container.offsetWidth;
        var totalWidth = 0;
        var visibleButtons = [];
        var collapsableButtons = [];
        this.children.forEach(function (item) {
          if (item.prop.visible) {
            totalWidth += item.prop.width;
            visibleButtons.push(item);

            if (item.prop.collapsable) {
              collapsableButtons.push(item);
            }
          }
        });

        if (!visibleButtons.length) {
          return;
        }

        if (availableWidth < totalWidth && collapsableButtons.length > 0) {
          collapsableButtons.forEach(function (item) {
            return item.collapse();
          });
          this.collapsed = collapsableButtons;
          this.getButton(MenuButton.id).show(false);
        } else if (availableWidth >= totalWidth && this.collapsed.length > 0) {
          this.collapsed.forEach(function (item) {
            return item.uncollapse();
          });
          this.collapsed = [];
          this.getButton(MenuButton.id).hide(false);
        }

        var caption = this.getButton(NavbarCaption.id, false);

        if (caption) {
          caption.refreshUi();
        }
      }
    }
    /**
     * @summary Ensure the buttons configuration is correct
     * @private
     */
    ;

    _proto.__cleanButtons = function __cleanButtons(buttons) {
      // true becomes the default array
      if (buttons === true) {
        return clone(DEFAULTS.navbar);
      } // can be a space or coma separated list
      else if (typeof buttons === 'string') {
        return buttons.split(/[ ,]/);
      } else {
        return buttons || [];
      }
    };

    return Navbar;
  }(AbstractComponent);

  /**
   * @summary Loader component
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Loader = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Loader, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Loader(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-loader-container') || this;
      /**
       * @summary Inner container for vertical center
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.loader = document.createElement('div');
      _this.loader.className = 'psv-loader';

      _this.container.appendChild(_this.loader);
      /**
       * @summary Animation canvas
       * @member {HTMLCanvasElement}
       * @readonly
       * @private
       */


      _this.canvas = document.createElement('canvas');
      _this.canvas.className = 'psv-loader-canvas';
      _this.canvas.width = _this.loader.clientWidth * SYSTEM.pixelRatio;
      _this.canvas.height = _this.loader.clientWidth * SYSTEM.pixelRatio;

      _this.loader.appendChild(_this.canvas);
      /**
       * @override
       * @property {number} thickness
       * @property {string} current
       */


      _this.prop = _extends({}, _this.prop, {
        tickness: (_this.loader.offsetWidth - _this.loader.clientWidth) / 2 * SYSTEM.pixelRatio,
        current: null
      });

      _this.refreshUi();

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = Loader.prototype;

    _proto.destroy = function destroy() {
      delete this.loader;
      delete this.canvas;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      if (this.prop.current !== (this.psv.config.loadingImg || this.psv.config.loadingTxt)) {
        if (this.prop.current) {
          this.loader.removeChild(this.loader.lastChild);
        }

        var inner;

        if (this.psv.config.loadingImg) {
          inner = document.createElement('img');
          inner.className = 'psv-loader-image';
          inner.src = this.psv.config.loadingImg;
        } else if (this.psv.config.loadingTxt) {
          inner = document.createElement('div');
          inner.className = 'psv-loader-text';
          inner.innerHTML = this.psv.config.loadingTxt;
        }

        if (inner) {
          var size = Math.round(Math.sqrt(2 * Math.pow((this.canvas.width / 2 - this.prop.tickness / 2) / SYSTEM.pixelRatio, 2)));
          inner.style.maxWidth = size + 'px';
          inner.style.maxHeight = size + 'px';
          this.loader.appendChild(inner);
        }

        this.prop.current = this.psv.config.loadingImg || this.psv.config.loadingTxt;
      }
    }
    /**
     * @summary Sets the loader progression
     * @param {number} value - from 0 to 100
     */
    ;

    _proto.setProgress = function setProgress(value) {
      var context = this.canvas.getContext('2d');
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.lineWidth = this.prop.tickness;
      context.strokeStyle = getStyle(this.loader, 'color');
      context.beginPath();
      context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2 - this.prop.tickness / 2, -Math.PI / 2, three.MathUtils.clamp(value, 0, 100) / 100 * 2 * Math.PI - Math.PI / 2);
      context.stroke();
      this.psv.trigger(EVENTS.LOAD_PROGRESS, Math.round(value));
    };

    return Loader;
  }(AbstractComponent);

  /**
   * @summary Notification component
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Notification = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Notification, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Notification(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-notification') || this;
      /**
       * @override
       * @property {*} timeout
       */

      _this.prop = _extends({}, _this.prop, {
        visible: false,
        contentId: undefined,
        timeout: null
      });
      /**
       * Notification content
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-notification-content';

      _this.container.appendChild(_this.content);

      _this.content.addEventListener('click', function () {
        return _this.hide();
      });

      return _this;
    }
    /**
     * @override
     */


    var _proto = Notification.prototype;

    _proto.destroy = function destroy() {
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @override
     * @param {string} [id]
     */
    ;

    _proto.isVisible = function isVisible(id) {
      return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
    }
    /**
     * @override
     * @summary This method is not supported
     * @throws {PSV.PSVError} always
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Notification cannot be toggled');
    }
    /**
     * @summary Displays a notification on the viewer
     * @param {Object|string} config
     * @param {string} [config.id] - unique identifier to use with "hide"
     * @param {string} config.content
     * @param {number} [config.timeout]
     * @fires PSV.show-notification
     *
     * @example
     * viewer.showNotification({ content: 'Hello world', timeout: 5000 })
     * @example
     * viewer.showNotification('Hello world')
     */
    ;

    _proto.show = function show(config) {
      var _this2 = this;

      if (this.prop.timeout) {
        clearTimeout(this.prop.timeout);
        this.prop.timeout = null;
      }

      if (typeof config === 'string') {
        config = {
          content: config
        };
      }

      this.prop.contentId = config.id;
      this.content.innerHTML = config.content;
      this.container.classList.add('psv-notification--visible');
      this.prop.visible = true;
      this.psv.trigger(EVENTS.SHOW_NOTIFICATION, config.id);

      if (config.timeout) {
        this.prop.timeout = setTimeout(function () {
          return _this2.hide(config.id);
        }, config.timeout);
      }
    }
    /**
     * @summary Hides the notification
     * @param {string} [id]
     * @fires PSV.hide-notification
     */
    ;

    _proto.hide = function hide(id) {
      if (this.isVisible(id)) {
        var contentId = this.prop.contentId;
        this.container.classList.remove('psv-notification--visible');
        this.prop.visible = false;
        this.prop.contentId = undefined;
        this.psv.trigger(EVENTS.HIDE_NOTIFICATION, contentId);
      }
    };

    return Notification;
  }(AbstractComponent);

  /**
   * @summary Overlay component
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Overlay = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Overlay, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Overlay(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-overlay') || this;
      /**
       * @override
       * @property {string} contentId
       * @property {boolean} dissmisable
       */

      _this.prop = _extends({}, _this.prop, {
        contentId: undefined,
        dissmisable: true
      });
      /**
       * Image container
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.image = document.createElement('div');
      _this.image.className = 'psv-overlay-image';

      _this.container.appendChild(_this.image);
      /**
       * Text container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.text = document.createElement('div');
      _this.text.className = 'psv-overlay-text';

      _this.container.appendChild(_this.text);
      /**
       * Subtext container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.subtext = document.createElement('div');
      _this.subtext.className = 'psv-overlay-subtext';

      _this.container.appendChild(_this.subtext);

      _this.psv.on(EVENTS.CLICK, _assertThisInitialized(_this));

      _this.psv.on(EVENTS.KEY_PRESS, _assertThisInitialized(_this));

      _AbstractComponent.prototype.hide.call(_assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = Overlay.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.CLICK, this);
      this.psv.off(EVENTS.KEY_PRESS, this);
      delete this.image;
      delete this.text;
      delete this.subtext;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case EVENTS.CLICK:
          if (this.isVisible() && this.prop.dissmisable) {
            this.hide();
            e.stopPropagation();
          }

          break;

        case EVENTS.KEY_PRESS:
          if (this.isVisible() && this.prop.dissmisable && e.args[0] === KEY_CODES.Escape) {
            this.hide();
            e.preventDefault();
          }

          break;
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @param {string} [id]
     */
    ;

    _proto.isVisible = function isVisible(id) {
      return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
    }
    /**
     * @override
     * @summary This method is not supported
     * @throws {PSV.PSVError} always
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Overlay cannot be toggled');
    }
    /**
     * @summary Displays an overlay on the viewer
     * @param {Object|string} config
     * @param {string} [config.id] - unique identifier to use with "hide"
     * @param {string} config.image - SVG image/icon displayed above the text
     * @param {string} config.text - main message
     * @param {string} [config.subtext] - secondary message
     * @param {boolean} [config.dissmisable=true] - if the user can hide the overlay by clicking
     * @fires PSV.show-overlay
     */
    ;

    _proto.show = function show(config) {
      if (typeof config === 'string') {
        config = {
          text: config
        };
      }

      this.prop.contentId = config.id;
      this.prop.dissmisable = config.dissmisable !== false;
      this.image.innerHTML = config.image || '';
      this.text.innerHTML = config.text || '';
      this.subtext.innerHTML = config.subtext || '';

      _AbstractComponent.prototype.show.call(this);

      this.psv.trigger(EVENTS.SHOW_OVERLAY, config.id);
    }
    /**
     * @summary Hides the overlay
     * @param {string} [id]
     * @fires PSV.hide-overlay
     */
    ;

    _proto.hide = function hide(id) {
      if (this.isVisible(id)) {
        var contentId = this.prop.contentId;

        _AbstractComponent.prototype.hide.call(this);

        this.prop.contentId = undefined;
        this.psv.trigger(EVENTS.HIDE_OVERLAY, contentId);
      }
    };

    return Overlay;
  }(AbstractComponent);

  /**
   * @summary Minimum width of the panel
   * @type {number}
   * @constant
   * @private
   */

  var PANEL_MIN_WIDTH = 200;
  /**
   * @summary Panel component
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Panel = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Panel, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Panel(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-panel psv--capture-event') || this;
      /**
       * @override
       * @property {string} contentId
       * @property {number} mouseX
       * @property {number} mouseY
       * @property {boolean} mousedown
       * @property {function} clickHandler
       * @property {function} keyHandler
       */

      _this.prop = _extends({}, _this.prop, {
        visible: false,
        contentId: undefined,
        mouseX: 0,
        mouseY: 0,
        mousedown: false,
        clickHandler: null,
        keyHandler: null,
        width: {}
      });
      var resizer = document.createElement('div');
      resizer.className = 'psv-panel-resizer';

      _this.container.appendChild(resizer);

      var closeBtn = document.createElement('div');
      closeBtn.className = 'psv-panel-close-button';

      _this.container.appendChild(closeBtn);
      /**
       * @summary Content container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.content = document.createElement('div');
      _this.content.className = 'psv-panel-content';

      _this.container.appendChild(_this.content); // Stop wheel event bubbling from panel


      _this.container.addEventListener(SYSTEM.mouseWheelEvent, function (e) {
        return e.stopPropagation();
      });

      closeBtn.addEventListener('click', function () {
        return _this.hide();
      }); // Event for panel resizing + stop bubling

      resizer.addEventListener('mousedown', _assertThisInitialized(_this));
      resizer.addEventListener('touchstart', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mousemove', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchmove', _assertThisInitialized(_this));

      _this.psv.on(EVENTS.KEY_PRESS, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = Panel.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.KEY_PRESS, this);
      this.psv.container.removeEventListener('mousemove', this);
      this.psv.container.removeEventListener('touchmove', this);
      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);
      delete this.prop;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__onMouseDown(e);

          break;

        case 'touchstart':
          this.__onTouchStart(e);

          break;

        case 'mousemove':
          this.__onMouseMove(e);

          break;

        case 'touchmove':
          this.__onTouchMove(e);

          break;

        case 'mouseup':
          this.__onMouseUp(e);

          break;

        case 'touchend':
          this.__onMouseUp(e);

          break;

        case EVENTS.KEY_PRESS:
          if (this.isVisible() && e.args[0] === KEY_CODES.Escape) {
            this.hide();
            e.preventDefault();
          }

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @param {string} [id]
     */
    ;

    _proto.isVisible = function isVisible(id) {
      return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
    }
    /**
     * @override
     * @summary This method is not supported
     * @throws {PSV.PSVError} always
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Panel cannot be toggled');
    }
    /**
     * @summary Shows the panel
     * @param {string|Object} config
     * @param {string} [config.id] - unique identifier to use with "hide" and to store the user desired width
     * @param {string} config.content - HTML content of the panel
     * @param {boolean} [config.noMargin=false] - remove the default margins
     * @param {string} [config.width] - initial width
     * @param {Function} [config.clickHandler] - called when the user clicks inside the panel or presses the Enter key while an element focused
     * @fires PSV.open-panel
     */
    ;

    _proto.show = function show(config) {
      var _this2 = this;

      var wasVisible = this.isVisible(config.id);

      if (typeof config === 'string') {
        config = {
          content: config
        };
      }

      this.prop.contentId = config.id;
      this.prop.visible = true;

      if (this.prop.clickHandler) {
        this.content.removeEventListener('click', this.prop.clickHandler);
        this.content.removeEventListener('keydown', this.prop.keyHandler);
        this.prop.clickHandler = null;
        this.prop.keyHandler = null;
      }

      if (config.id && this.prop.width[config.id]) {
        this.container.style.width = this.prop.width[config.id];
      } else if (config.width) {
        this.container.style.width = config.width;
      } else {
        this.container.style.width = null;
      }

      this.content.innerHTML = config.content;
      this.content.scrollTop = 0;
      this.container.classList.add('psv-panel--open');
      toggleClass(this.content, 'psv-panel-content--no-margin', config.noMargin === true);

      if (config.clickHandler) {
        this.prop.clickHandler = config.clickHandler;

        this.prop.keyHandler = function (e) {
          if (e.key === KEY_CODES.Enter) {
            config.clickHandler(e);
          }
        };

        this.content.addEventListener('click', this.prop.clickHandler);
        this.content.addEventListener('keydown', this.prop.keyHandler); // focus the first element if possible, after animation ends

        if (!wasVisible) {
          setTimeout(function () {
            var _this2$content$queryS;

            (_this2$content$queryS = _this2.content.querySelector('a,button,[tabindex]')) == null ? void 0 : _this2$content$queryS.focus();
          }, 300);
        }
      }

      this.psv.trigger(EVENTS.OPEN_PANEL, config.id);
    }
    /**
     * @summary Hides the panel
     * @param {string} [id]
     * @fires PSV.close-panel
     */
    ;

    _proto.hide = function hide(id) {
      if (this.isVisible(id)) {
        var contentId = this.prop.contentId;
        this.prop.visible = false;
        this.prop.contentId = undefined;
        this.content.innerHTML = null;
        this.container.classList.remove('psv-panel--open');

        if (this.prop.clickHandler) {
          this.content.removeEventListener('click', this.prop.clickHandler);
          this.prop.clickHandler = null;
        }

        this.psv.trigger(EVENTS.CLOSE_PANEL, contentId);
      }
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      evt.stopPropagation();

      this.__startResize(evt);
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      evt.stopPropagation();

      this.__startResize(evt.changedTouches[0]);
    }
    /**
     * @summary Handles mouse up events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      if (this.prop.mousedown) {
        evt.stopPropagation();
        this.prop.mousedown = false;
        this.content.classList.remove('psv-panel-content--no-interaction');
      }
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (this.prop.mousedown) {
        evt.stopPropagation();

        this.__resize(evt);
      }
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      if (this.prop.mousedown) {
        this.__resize(evt.touches[0]);
      }
    }
    /**
     * @summary Initializes the panel resize
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__startResize = function __startResize(evt) {
      this.prop.mouseX = evt.clientX;
      this.prop.mouseY = evt.clientY;
      this.prop.mousedown = true;
      this.content.classList.add('psv-panel-content--no-interaction');
    }
    /**
     * @summary Resizes the panel
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__resize = function __resize(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      var width = Math.max(PANEL_MIN_WIDTH, this.container.offsetWidth - (x - this.prop.mouseX)) + 'px';

      if (this.prop.contentId) {
        this.prop.width[this.prop.contentId] = width;
      }

      this.container.style.width = width;
      this.prop.mouseX = x;
      this.prop.mouseY = y;
    };

    return Panel;
  }(AbstractComponent);

  var errorIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"15 15 70 70\"><path fill=\"currentColor\" d=\"M50,16.2c-18.6,0-33.8,15.1-33.8,33.8S31.4,83.7,50,83.7S83.8,68.6,83.8,50S68.6,16.2,50,16.2z M50,80.2c-16.7,0-30.2-13.6-30.2-30.2S33.3,19.7,50,19.7S80.3,33.3,80.3,50S66.7,80.2,50,80.2z\"/><rect fill=\"currentColor\" x=\"48\" y=\"31.7\" width=\"4\" height=\"28\"/><rect fill=\"currentColor\" x=\"48\" y=\"63.2\" width=\"4\" height=\"5\"/><!--Created by Shastry from the Noun Project--></svg>\n";

  /**
   * @namespace PSV.services
   */

  /**
   * @summary Base services class
   * @memberof PSV.services
   * @abstract
   */
  var AbstractService = /*#__PURE__*/function () {
    /**
     * @param {PSV.Viewer} psv
     */
    function AbstractService(psv) {
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */
      this.psv = psv;
      /**
       * @summary Configuration holder
       * @type {PSV.Options}
       * @readonly
       */

      this.config = psv.config;
      /**
       * @summary Properties holder
       * @type {Object}
       * @readonly
       */

      this.prop = psv.prop;
    }
    /**
     * @summary Destroys the service
     */


    var _proto = AbstractService.prototype;

    _proto.destroy = function destroy() {
      delete this.psv;
      delete this.config;
      delete this.prop;
    };

    return AbstractService;
  }();

  var vector2 = new three.Vector2();
  var vector3 = new three.Vector3();
  var eulerZero = new three.Euler(0, 0, 0, 'ZXY');
  /**
   * @summary Collections of data converters for the current viewer
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var DataHelper = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(DataHelper, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function DataHelper(psv) {
      return _AbstractService.call(this, psv) || this;
    }
    /**
     * @summary Converts vertical FOV to zoom level
     * @param {number} fov
     * @returns {number}
     */


    var _proto = DataHelper.prototype;

    _proto.fovToZoomLevel = function fovToZoomLevel(fov) {
      var temp = Math.round((fov - this.config.minFov) / (this.config.maxFov - this.config.minFov) * 100);
      return temp - 2 * (temp - 50);
    }
    /**
     * @summary Converts zoom level to vertical FOV
     * @param {number} level
     * @returns {number}
     */
    ;

    _proto.zoomLevelToFov = function zoomLevelToFov(level) {
      return this.config.maxFov + level / 100 * (this.config.minFov - this.config.maxFov);
    }
    /**
     * @summary Convert vertical FOV to horizontal FOV
     * @param {number} vFov
     * @returns {number}
     */
    ;

    _proto.vFovToHFov = function vFovToHFov(vFov) {
      return three.MathUtils.radToDeg(2 * Math.atan(Math.tan(three.MathUtils.degToRad(vFov) / 2) * this.prop.aspect));
    }
    /**
     * @summary Converts a speed into a duration from current position to a new position
     * @param {string|number} value
     * @param {number} angle
     * @returns {number}
     */
    ;

    _proto.speedToDuration = function speedToDuration(value, angle) {
      if (!value || typeof value !== 'number') {
        // desired radial speed
        var speed = value ? parseSpeed(value) : this.config.autorotateSpeed; // compute duration

        return angle / Math.abs(speed) * 1000;
      } else {
        return Math.abs(value);
      }
    }
    /**
     * @summary Converts pixel texture coordinates to spherical radians coordinates
     * @param {PSV.Point} point
     * @returns {PSV.Position}
     * @throws {PSV.PSVError} when the current adapter does not support texture coordinates
     */
    ;

    _proto.textureCoordsToSphericalCoords = function textureCoordsToSphericalCoords(point) {
      var panoData = this.prop.panoData;

      if (!panoData) {
        throw new PSVError('Current adapter does not support texture coordinates.');
      }

      var relativeX = (point.x + panoData.croppedX) / panoData.fullWidth * Math.PI * 2;
      var relativeY = (point.y + panoData.croppedY) / panoData.fullHeight * Math.PI;
      var result = {
        longitude: relativeX >= Math.PI ? relativeX - Math.PI : relativeX + Math.PI,
        latitude: Math.PI / 2 - relativeY
      }; // Apply panoData pose and sphereCorrection

      if (!eulerZero.equals(this.psv.renderer.mesh.rotation) || !eulerZero.equals(this.psv.renderer.meshContainer.rotation)) {
        this.sphericalCoordsToVector3(result, vector3);
        vector3.applyEuler(this.psv.renderer.mesh.rotation);
        vector3.applyEuler(this.psv.renderer.meshContainer.rotation);
        return this.vector3ToSphericalCoords(vector3);
      } else {
        return result;
      }
    }
    /**
     * @summary Converts spherical radians coordinates to pixel texture coordinates
     * @param {PSV.Position} position
     * @returns {PSV.Point}
     * @throws {PSV.PSVError} when the current adapter does not support texture coordinates
     */
    ;

    _proto.sphericalCoordsToTextureCoords = function sphericalCoordsToTextureCoords(position) {
      var panoData = this.prop.panoData;

      if (!panoData) {
        throw new PSVError('Current adapter does not support texture coordinates.');
      } // Apply panoData pose and sphereCorrection


      if (!eulerZero.equals(this.psv.renderer.mesh.rotation) || !eulerZero.equals(this.psv.renderer.meshContainer.rotation)) {
        this.sphericalCoordsToVector3(position, vector3);
        applyEulerInverse(vector3, this.psv.renderer.meshContainer.rotation);
        applyEulerInverse(vector3, this.psv.renderer.mesh.rotation);
        position = this.vector3ToSphericalCoords(vector3);
      }

      var relativeLong = position.longitude / Math.PI / 2 * panoData.fullWidth;
      var relativeLat = position.latitude / Math.PI * panoData.fullHeight;
      return {
        x: Math.round(position.longitude < Math.PI ? relativeLong + panoData.fullWidth / 2 : relativeLong - panoData.fullWidth / 2) - panoData.croppedX,
        y: Math.round(panoData.fullHeight / 2 - relativeLat) - panoData.croppedY
      };
    }
    /**
     * @summary Converts spherical radians coordinates to a THREE.Vector3
     * @param {PSV.Position} position
     * @param {external:THREE.Vector3} [vector]
     * @returns {external:THREE.Vector3}
     */
    ;

    _proto.sphericalCoordsToVector3 = function sphericalCoordsToVector3(position, vector) {
      if (!vector) {
        vector = new three.Vector3();
      }

      vector.x = SPHERE_RADIUS * -Math.cos(position.latitude) * Math.sin(position.longitude);
      vector.y = SPHERE_RADIUS * Math.sin(position.latitude);
      vector.z = SPHERE_RADIUS * Math.cos(position.latitude) * Math.cos(position.longitude);
      return vector;
    }
    /**
     * @summary Converts a THREE.Vector3 to spherical radians coordinates
     * @param {external:THREE.Vector3} vector
     * @returns {PSV.Position}
     */
    ;

    _proto.vector3ToSphericalCoords = function vector3ToSphericalCoords(vector) {
      var phi = Math.acos(vector.y / Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z));
      var theta = Math.atan2(vector.x, vector.z);
      return {
        longitude: theta < 0 ? -theta : Math.PI * 2 - theta,
        latitude: Math.PI / 2 - phi
      };
    }
    /**
     * @summary Converts position on the viewer to a THREE.Vector3
     * @param {PSV.Point} viewerPoint
     * @returns {external:THREE.Vector3}
     */
    ;

    _proto.viewerCoordsToVector3 = function viewerCoordsToVector3(viewerPoint) {
      var sphereIntersect = this.getIntersections(viewerPoint).filter(function (i) {
        return i.object.userData[MESH_USER_DATA];
      });

      if (sphereIntersect.length) {
        return sphereIntersect[0].point;
      } else {
        return null;
      }
    }
    /**
     * @summary Converts a THREE.Vector3 to position on the viewer
     * @param {external:THREE.Vector3} vector
     * @returns {PSV.Point}
     */
    ;

    _proto.vector3ToViewerCoords = function vector3ToViewerCoords(vector) {
      var vectorClone = vector.clone();
      vectorClone.project(this.psv.renderer.camera);
      return {
        x: Math.round((vectorClone.x + 1) / 2 * this.prop.size.width),
        y: Math.round((1 - vectorClone.y) / 2 * this.prop.size.height)
      };
    }
    /**
     * @summary Converts spherical radians coordinates to position on the viewer
     * @param {PSV.Position} position
     * @returns {PSV.Point}
     */
    ;

    _proto.sphericalCoordsToViewerCoords = function sphericalCoordsToViewerCoords(position) {
      return this.vector3ToViewerCoords(this.sphericalCoordsToVector3(position, vector3));
    }
    /**
     * @summary Returns intersections with objects in the scene
     * @param {PSV.Point} viewerPoint
     * @return {external:THREE.Intersection[]}
     */
    ;

    _proto.getIntersections = function getIntersections(viewerPoint) {
      vector2.x = 2 * viewerPoint.x / this.prop.size.width - 1;
      vector2.y = -2 * viewerPoint.y / this.prop.size.height + 1;
      this.psv.renderer.raycaster.setFromCamera(vector2, this.psv.renderer.camera);
      return this.psv.renderer.raycaster.intersectObjects(this.psv.renderer.scene.children, true).filter(function (i) {
        return !!i.object.userData;
      });
    }
    /**
     * @summary Converts x/y to latitude/longitude if present and ensure boundaries
     * @param {PSV.ExtendedPosition} position
     * @returns {PSV.Position}
     */
    ;

    _proto.cleanPosition = function cleanPosition(position) {
      if (position.x !== undefined && position.y !== undefined) {
        return this.textureCoordsToSphericalCoords(position);
      } else {
        return {
          longitude: parseAngle(position.longitude),
          latitude: parseAngle(position.latitude, !this.prop.littlePlanet)
        };
      }
    }
    /**
     * @summary Ensure a SphereCorrection object is valid
     * @param {PSV.SphereCorrection} sphereCorrection
     * @returns {PSV.SphereCorrection}
     */
    ;

    _proto.cleanSphereCorrection = function cleanSphereCorrection(sphereCorrection) {
      return {
        pan: parseAngle((sphereCorrection == null ? void 0 : sphereCorrection.pan) || 0),
        tilt: parseAngle((sphereCorrection == null ? void 0 : sphereCorrection.tilt) || 0, true),
        roll: parseAngle((sphereCorrection == null ? void 0 : sphereCorrection.roll) || 0, true, false)
      };
    }
    /**
     * @summary Parse the pose angles of the pano data
     * @param {PSV.PanoData} panoData
     * @returns {PSV.SphereCorrection}
     */
    ;

    _proto.cleanPanoramaPose = function cleanPanoramaPose(panoData) {
      return {
        pan: three.MathUtils.degToRad((panoData == null ? void 0 : panoData.poseHeading) || 0),
        tilt: three.MathUtils.degToRad((panoData == null ? void 0 : panoData.posePitch) || 0),
        roll: three.MathUtils.degToRad((panoData == null ? void 0 : panoData.poseRoll) || 0)
      };
    };

    return DataHelper;
  }(AbstractService);

  var gestureIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M33.38 33.2a1.96 1.96 0 0 0 1.5-3.23 10.61 10.61 0 0 1 7.18-17.51c.7-.06 1.31-.49 1.61-1.12a13.02 13.02 0 0 1 11.74-7.43c7.14 0 12.96 5.8 12.96 12.9 0 3.07-1.1 6.05-3.1 8.38-.7.82-.61 2.05.21 2.76.83.7 2.07.6 2.78-.22a16.77 16.77 0 0 0 4.04-10.91C72.3 7.54 64.72 0 55.4 0a16.98 16.98 0 0 0-14.79 8.7 14.6 14.6 0 0 0-12.23 14.36c0 3.46 1.25 6.82 3.5 9.45.4.45.94.69 1.5.69m45.74 43.55a22.13 22.13 0 0 1-5.23 12.4c-4 4.55-9.53 6.86-16.42 6.86-12.6 0-20.1-10.8-20.17-10.91a1.82 1.82 0 0 0-.08-.1c-5.3-6.83-14.55-23.82-17.27-28.87-.05-.1 0-.21.02-.23a6.3 6.3 0 0 1 8.24 1.85l9.38 12.59a1.97 1.97 0 0 0 3.54-1.17V25.34a4 4 0 0 1 1.19-2.87 3.32 3.32 0 0 1 2.4-.95c1.88.05 3.4 1.82 3.4 3.94v24.32a1.96 1.96 0 0 0 3.93 0v-33.1a3.5 3.5 0 0 1 7 0v35.39a1.96 1.96 0 0 0 3.93 0v-.44c.05-2.05 1.6-3.7 3.49-3.7 1.93 0 3.5 1.7 3.5 3.82v5.63c0 .24.04.48.13.71l.1.26a1.97 1.97 0 0 0 3.76-.37c.33-1.78 1.77-3.07 3.43-3.07 1.9 0 3.45 1.67 3.5 3.74l-1.77 18.1zM77.39 51c-1.25 0-2.45.32-3.5.9v-.15c0-4.27-3.33-7.74-7.42-7.74-1.26 0-2.45.33-3.5.9V16.69a7.42 7.42 0 0 0-14.85 0v1.86a7 7 0 0 0-3.28-.94 7.21 7.21 0 0 0-5.26 2.07 7.92 7.92 0 0 0-2.38 5.67v37.9l-5.83-7.82a10.2 10.2 0 0 0-13.35-2.92 4.1 4.1 0 0 0-1.53 5.48C20 64.52 28.74 80.45 34.07 87.34c.72 1.04 9.02 12.59 23.4 12.59 7.96 0 14.66-2.84 19.38-8.2a26.06 26.06 0 0 0 6.18-14.6l1.78-18.2v-.2c0-4.26-3.32-7.73-7.42-7.73z\"/><!--Created by AomAm from the Noun Project--></svg>\n";

  var mousewheelIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"10 17 79 79\"><path fill=\"currentColor\" d=\"M38.1 29.27c-.24 0-.44.2-.44.45v10.7a.45.45 0 00.9 0v-10.7c0-.25-.2-.45-.45-.45zm10.2 26.66a11.54 11.54 0 01-8.48-6.14.45.45 0 10-.8.41 12.45 12.45 0 009.22 6.62.45.45 0 00.07-.9zm24.55-13.08a23.04 23.04 0 00-22.56-23v7.07l-.01.05a2.83 2.83 0 012.39 2.78v14.03l.09-.02h8.84v-9.22a.45.45 0 11.9 0v9.22h10.35v-.9zm0 27.33V44.66H62.5c-.02 2.01-.52 4-1.47 5.76a.45.45 0 01-.61.18.45.45 0 01-.19-.61 11.54 11.54 0 001.36-5.33h-8.83l-.1-.01a2.83 2.83 0 01-2.83 2.84h-.04-.04a2.83 2.83 0 01-2.83-2.83v-14.9a2.82 2.82 0 012.47-2.8v-7.11a23.04 23.04 0 00-22.57 23v.91h14.72V29.88a8.2 8.2 0 015.02-7.57c.22-.1.5.01.59.24.1.23-.01.5-.24.6a7.3 7.3 0 00-4.47 6.73v13.88h3.9a.45.45 0 110 .9h-3.9v.15a7.32 7.32 0 0011.23 6.17.45.45 0 01.49.76 8.22 8.22 0 01-12.62-6.93v-.15H26.82v25.52a23.04 23.04 0 0023.01 23.01 23.04 23.04 0 0023.02-23.01zm1.8-27.33v27.33A24.85 24.85 0 0149.84 95a24.85 24.85 0 01-24.82-24.82V42.85a24.85 24.85 0 0124.82-24.82 24.85 24.85 0 0124.83 24.82zM57.98 29.88v9.36a.45.45 0 11-.9 0v-9.36a7.28 7.28 0 00-3.4-6.17.45.45 0 01.49-.76 8.18 8.18 0 013.8 6.93z\"/><!-- Created by Icon Island from the Noun Project --></svg>\n";

  var IDLE = 0;
  var MOVING = 1;
  var INERTIA = 2;
  /**
   * @summary Events handler
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var EventsHandler = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(EventsHandler, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function EventsHandler(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @summary Internal properties
       * @member {Object}
       * @property {number} moveThreshold - computed threshold based on device pixel ratio
       * @property {number} step
       * @property {boolean} mousedown - before moving past the threshold
       * @property {number} startMouseX - start x position of the click/touch
       * @property {number} startMouseY - start y position of the click/touch
       * @property {number} mouseX - current x position of the cursor
       * @property {number} mouseY - current y position of the cursor
       * @property {number[][]} mouseHistory - list of latest positions of the cursor, [time, x, y]
       * @property {number} pinchDist - distance between fingers when zooming
       * @property {PressHandler} keyHandler
       * @property {boolean} ctrlKeyDown - when the Ctrl key is pressed
       * @property {PSV.ClickData} dblclickData - temporary storage of click data between two clicks
       * @property {number} dblclickTimeout - timeout id for double click
       * @property {number} twofingersTimeout - timeout id for "two fingers" overlay
       * @property {number} ctrlZoomTimeout - timeout id for "ctrol zoom" overlay
       * @protected
       */

      _this.state = {
        moveThreshold: MOVE_THRESHOLD * SYSTEM.pixelRatio,
        keyboardEnabled: false,
        step: IDLE,
        mousedown: false,
        startMouseX: 0,
        startMouseY: 0,
        mouseX: 0,
        mouseY: 0,
        mouseHistory: [],
        pinchDist: 0,
        keyHandler: new PressHandler(),
        ctrlKeyDown: false,
        dblclickData: null,
        dblclickTimeout: null,
        longtouchTimeout: null,
        twofingersTimeout: null,
        ctrlZoomTimeout: null
      };
      /**
       * @summary Throttled wrapper of {@link PSV.Viewer#autoSize}
       * @type {Function}
       * @private
       */

      _this.__onResize = throttle(function () {
        return _this.psv.autoSize();
      }, 50);
      return _this;
    }
    /**
     * @summary Initializes event handlers
     * @protected
     */


    var _proto = EventsHandler.prototype;

    _proto.init = function init() {
      window.addEventListener('resize', this);
      window.addEventListener('keydown', this, {
        passive: false
      });
      window.addEventListener('keyup', this);
      this.psv.container.addEventListener('mousedown', this);
      window.addEventListener('mousemove', this, {
        passive: false
      });
      window.addEventListener('mouseup', this);
      this.psv.container.addEventListener('touchstart', this, {
        passive: false
      });
      window.addEventListener('touchmove', this, {
        passive: false
      });
      window.addEventListener('touchend', this, {
        passive: false
      });
      this.psv.container.addEventListener(SYSTEM.mouseWheelEvent, this, {
        passive: false
      });

      if (SYSTEM.fullscreenEvent) {
        document.addEventListener(SYSTEM.fullscreenEvent, this);
      }
    }
    /**
     * @override
     */
    ;

    _proto.destroy = function destroy() {
      window.removeEventListener('resize', this);
      window.removeEventListener('keydown', this);
      window.removeEventListener('keyup', this);
      this.psv.container.removeEventListener('mousedown', this);
      window.removeEventListener('mousemove', this);
      window.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchstart', this);
      window.removeEventListener('touchmove', this);
      window.removeEventListener('touchend', this);
      this.psv.container.removeEventListener(SYSTEM.mouseWheelEvent, this);

      if (SYSTEM.fullscreenEvent) {
        document.removeEventListener(SYSTEM.fullscreenEvent, this);
      }

      clearTimeout(this.state.dblclickTimeout);
      clearTimeout(this.state.longtouchTimeout);
      clearTimeout(this.state.twofingersTimeout);
      clearTimeout(this.state.ctrlZoomTimeout);
      delete this.state;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} evt
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(evt) {
      /* eslint-disable */
      switch (evt.type) {
        // @formatter:off
        case 'resize':
          this.__onResize();

          break;

        case 'keydown':
          this.__onKeyDown(evt);

          break;

        case 'keyup':
          this.__onKeyUp();

          break;

        case 'mousemove':
          this.__onMouseMove(evt);

          break;

        case 'mouseup':
          this.__onMouseUp(evt);

          break;

        case 'touchmove':
          this.__onTouchMove(evt);

          break;

        case 'touchend':
          this.__onTouchEnd(evt);

          break;

        case SYSTEM.fullscreenEvent:
          this.__fullscreenToggled();

          break;
        // @formatter:on
      }
      /* eslint-enable */


      if (!getClosest(evt.target, '.psv--capture-event')) {
        /* eslint-disable */
        switch (evt.type) {
          // @formatter:off
          case 'mousedown':
            this.__onMouseDown(evt);

            break;

          case 'touchstart':
            this.__onTouchStart(evt);

            break;

          case SYSTEM.mouseWheelEvent:
            this.__onMouseWheel(evt);

            break;
          // @formatter:on
        }
        /* eslint-enable */

      }
    }
    /**
     * @summary Enables the keyboard controls
     * @protected
     */
    ;

    _proto.enableKeyboard = function enableKeyboard() {
      this.state.keyboardEnabled = true;
    }
    /**
     * @summary Disables the keyboard controls
     * @protected
     */
    ;

    _proto.disableKeyboard = function disableKeyboard() {
      this.state.keyboardEnabled = false;
    }
    /**
     * @summary Handles keyboard events
     * @param {KeyboardEvent} e
     * @private
     */
    ;

    _proto.__onKeyDown = function __onKeyDown(e) {
      if (this.config.mousewheelCtrlKey) {
        this.state.ctrlKeyDown = e.key === KEY_CODES.Control;

        if (this.state.ctrlKeyDown) {
          clearTimeout(this.state.ctrlZoomTimeout);
          this.psv.overlay.hide(IDS.CTRL_ZOOM);
        }
      }

      var e2 = this.psv.trigger(EVENTS.KEY_PRESS, e.key);

      if (e2.isDefaultPrevented()) {
        return;
      }

      if (!this.state.keyboardEnabled) {
        return;
      }

      var action = this.config.keyboard[e.key];

      if (action === ACTIONS.TOGGLE_AUTOROTATE) {
        this.psv.toggleAutorotate();
        e.preventDefault();
      } else if (action && !this.state.keyHandler.time) {
        if (action !== ACTIONS.ZOOM_IN && action !== ACTIONS.ZOOM_OUT) {
          this.psv.__stopAll();
        }
        /* eslint-disable */


        switch (action) {
          // @formatter:off
          case ACTIONS.ROTATE_LAT_UP:
            this.psv.dynamics.position.roll({
              latitude: false
            });
            break;

          case ACTIONS.ROTATE_LAT_DOWN:
            this.psv.dynamics.position.roll({
              latitude: true
            });
            break;

          case ACTIONS.ROTATE_LONG_RIGHT:
            this.psv.dynamics.position.roll({
              longitude: false
            });
            break;

          case ACTIONS.ROTATE_LONG_LEFT:
            this.psv.dynamics.position.roll({
              longitude: true
            });
            break;

          case ACTIONS.ZOOM_IN:
            this.psv.dynamics.zoom.roll(false);
            break;

          case ACTIONS.ZOOM_OUT:
            this.psv.dynamics.zoom.roll(true);
            break;
          // @formatter:on
        }
        /* eslint-enable */


        this.state.keyHandler.down();
        e.preventDefault();
      }
    }
    /**
     * @summary Handles keyboard events
     * @private
     */
    ;

    _proto.__onKeyUp = function __onKeyUp() {
      var _this2 = this;

      this.state.ctrlKeyDown = false;

      if (!this.state.keyboardEnabled) {
        return;
      }

      this.state.keyHandler.up(function () {
        _this2.psv.dynamics.position.stop();

        _this2.psv.dynamics.zoom.stop();

        _this2.psv.resetIdleTimer();
      });
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      this.state.mousedown = true;
      this.state.startMouseX = evt.clientX;
      this.state.startMouseY = evt.clientY;
    }
    /**
     * @summary Handles mouse up events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      if (this.state.mousedown || this.state.step === MOVING) {
        this.__stopMove(evt.clientX, evt.clientY, evt.target, evt.button === 2);
      }
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (this.config.mousemove && (this.state.mousedown || this.state.step === MOVING)) {
        evt.preventDefault();

        this.__move(evt.clientX, evt.clientY);
      }

      if (!isEmpty(this.prop.objectsObservers) && hasParent(evt.target, this.psv.container)) {
        var viewerPos = getPosition(this.psv.container);
        var viewerPoint = {
          x: evt.clientX - viewerPos.left,
          y: evt.clientY - viewerPos.top
        };
        var intersections = this.psv.dataHelper.getIntersections(viewerPoint);

        var emit = function emit(observer, key, type) {
          observer.listener.handleEvent(new CustomEvent(type, {
            detail: {
              originalEvent: evt,
              object: observer.object,
              data: observer.object.userData[key],
              viewerPoint: viewerPoint
            }
          }));
        };

        each(this.prop.objectsObservers, function (observer, key) {
          var intersection = intersections.find(function (i) {
            return i.object.userData[key];
          });

          if (intersection) {
            if (observer.object && intersection.object !== observer.object) {
              emit(observer, key, OBJECT_EVENTS.LEAVE_OBJECT);
              delete observer.object;
            }

            if (!observer.object) {
              observer.object = intersection.object;
              emit(observer, key, OBJECT_EVENTS.ENTER_OBJECT);
            } else {
              emit(observer, key, OBJECT_EVENTS.HOVER_OBJECT);
            }
          } else if (observer.object) {
            emit(observer, key, OBJECT_EVENTS.LEAVE_OBJECT);
            delete observer.object;
          }
        });
      }
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      var _this3 = this;

      if (evt.touches.length === 1) {
        this.state.mousedown = true;
        this.state.startMouseX = evt.touches[0].clientX;
        this.state.startMouseY = evt.touches[0].clientY;

        if (!this.prop.longtouchTimeout) {
          this.prop.longtouchTimeout = setTimeout(function () {
            var touch = evt.touches[0];

            _this3.__stopMove(touch.clientX, touch.clientY, touch.target, true);

            _this3.prop.longtouchTimeout = null;
          }, LONGTOUCH_DELAY);
        }
      } else if (evt.touches.length === 2) {
        this.state.mousedown = false;

        this.__cancelLongTouch();

        if (this.config.mousemove) {
          this.__cancelTwoFingersOverlay();

          this.__startMoveZoom(evt);

          evt.preventDefault();
        }
      }
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchEnd = function __onTouchEnd(evt) {
      this.__cancelLongTouch();

      if (this.state.mousedown || this.state.step === MOVING) {
        evt.preventDefault();

        this.__cancelTwoFingersOverlay();

        if (evt.touches.length === 1) {
          this.__stopMove(this.state.mouseX, this.state.mouseY);
        } else if (evt.touches.length === 0) {
          var touch = evt.changedTouches[0];

          this.__stopMove(touch.clientX, touch.clientY, touch.target);
        }
      }
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      var _this4 = this;

      this.__cancelLongTouch();

      if (!this.config.mousemove) {
        return;
      }

      if (evt.touches.length === 1) {
        if (this.config.touchmoveTwoFingers) {
          if (this.state.mousedown && !this.prop.twofingersTimeout) {
            this.prop.twofingersTimeout = setTimeout(function () {
              _this4.psv.overlay.show({
                id: IDS.TWO_FINGERS,
                image: gestureIcon,
                text: _this4.config.lang.twoFingers
              });
            }, TWOFINGERSOVERLAY_DELAY);
          }
        } else if (this.state.mousedown || this.state.step === MOVING) {
          evt.preventDefault();
          var touch = evt.touches[0];

          this.__move(touch.clientX, touch.clientY);
        }
      } else {
        this.__moveZoom(evt);

        this.__cancelTwoFingersOverlay();
      }
    }
    /**
     * @summary Cancel the long touch timer if any
     * @private
     */
    ;

    _proto.__cancelLongTouch = function __cancelLongTouch() {
      if (this.prop.longtouchTimeout) {
        clearTimeout(this.prop.longtouchTimeout);
        this.prop.longtouchTimeout = null;
      }
    }
    /**
     * @summary Cancel the two fingers overlay timer if any
     * @private
     */
    ;

    _proto.__cancelTwoFingersOverlay = function __cancelTwoFingersOverlay() {
      if (this.config.touchmoveTwoFingers) {
        if (this.prop.twofingersTimeout) {
          clearTimeout(this.prop.twofingersTimeout);
          this.prop.twofingersTimeout = null;
        }

        this.psv.overlay.hide(IDS.TWO_FINGERS);
      }
    }
    /**
     * @summary Handles mouse wheel events
     * @param {WheelEvent} evt
     * @private
     */
    ;

    _proto.__onMouseWheel = function __onMouseWheel(evt) {
      var _this5 = this;

      if (!this.config.mousewheel) {
        return;
      }

      if (this.config.mousewheelCtrlKey && !this.state.ctrlKeyDown) {
        this.psv.overlay.show({
          id: IDS.CTRL_ZOOM,
          image: mousewheelIcon,
          text: this.config.lang.ctrlZoom
        });
        clearTimeout(this.state.ctrlZoomTimeout);
        this.state.ctrlZoomTimeout = setTimeout(function () {
          return _this5.psv.overlay.hide(IDS.CTRL_ZOOM);
        }, CTRLZOOM_TIMEOUT);
        return;
      }

      evt.preventDefault();
      evt.stopPropagation();
      var delta = normalizeWheel(evt).spinY * 5 * this.config.zoomSpeed;

      if (delta !== 0) {
        this.psv.dynamics.zoom.step(-delta, 5);
      }
    }
    /**
     * @summary Handles fullscreen events
     * @param {boolean} [force] force state
     * @fires PSV.fullscreen-updated
     * @package
     */
    ;

    _proto.__fullscreenToggled = function __fullscreenToggled(force) {
      this.prop.fullscreen = force !== undefined ? force : isFullscreenEnabled(this.psv.container);

      if (this.config.keyboard) {
        if (this.prop.fullscreen) {
          this.psv.startKeyboardControl();
        } else {
          this.psv.stopKeyboardControl();
        }
      }

      this.psv.trigger(EVENTS.FULLSCREEN_UPDATED, this.prop.fullscreen);
    }
    /**
     * @summary Resets all state variables
     * @private
     */
    ;

    _proto.__resetMove = function __resetMove() {
      this.state.step = IDLE;
      this.state.mousedown = false;
      this.state.mouseX = 0;
      this.state.mouseY = 0;
      this.state.startMouseX = 0;
      this.state.startMouseY = 0;
      this.state.mouseHistory.length = 0;
    }
    /**
     * @summary Initializes the combines move and zoom
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__startMoveZoom = function __startMoveZoom(evt) {
      this.psv.__stopAll();

      this.__resetMove();

      var p1 = {
        x: evt.touches[0].clientX,
        y: evt.touches[0].clientY
      };
      var p2 = {
        x: evt.touches[1].clientX,
        y: evt.touches[1].clientY
      };
      this.state.step = MOVING;
      this.state.pinchDist = distance(p1, p2);
      this.state.mouseX = (p1.x + p2.x) / 2;
      this.state.mouseY = (p1.y + p2.y) / 2;

      this.__logMouseMove(this.state.mouseX, this.state.mouseY);
    }
    /**
     * @summary Stops the movement
     * @description If the move threshold was not reached a click event is triggered, otherwise an animation is launched to simulate inertia
     * @param {int} clientX
     * @param {int} clientY
     * @param {EventTarget} [target]
     * @param {boolean} [rightclick=false]
     * @private
     */
    ;

    _proto.__stopMove = function __stopMove(clientX, clientY, target, rightclick) {
      if (target === void 0) {
        target = null;
      }

      if (rightclick === void 0) {
        rightclick = false;
      }

      if (this.state.step === MOVING) {
        if (this.config.moveInertia) {
          this.__logMouseMove(clientX, clientY);

          this.__stopMoveInertia(clientX, clientY);
        } else {
          this.__resetMove();

          this.psv.resetIdleTimer();
        }
      } else if (this.state.mousedown) {
        this.psv.stopAnimation();

        this.__click(clientX, clientY, target, rightclick);

        this.__resetMove();

        this.psv.resetIdleTimer();
      }
    }
    /**
     * @summary Performs an animation to simulate inertia when the movement stops
     * @param {int} clientX
     * @param {int} clientY
     * @private
     */
    ;

    _proto.__stopMoveInertia = function __stopMoveInertia(clientX, clientY) {
      var _this6 = this;

      // get direction at end of movement
      var curve = new three.SplineCurve(this.state.mouseHistory.map(function (_ref) {
        var x = _ref[1],
            y = _ref[2];
        return new three.Vector2(x, y);
      }));
      var direction = curve.getTangent(1); // average speed

      var speed = this.state.mouseHistory.slice(1).reduce(function (_ref2, curr) {
        var total = _ref2.total,
            prev = _ref2.prev;
        return {
          total: total + distance({
            x: prev[1],
            y: prev[2]
          }, {
            x: curr[1],
            y: curr[2]
          }) / (curr[0] - prev[0]),
          prev: curr
        };
      }, {
        total: 0,
        prev: this.state.mouseHistory[0]
      }).total / this.state.mouseHistory.length;

      if (!speed) {
        this.__resetMove();

        this.psv.resetIdleTimer();
        return;
      }

      this.state.step = INERTIA;
      var currentClientX = clientX;
      var currentClientY = clientY;
      this.prop.animationPromise = new Animation({
        properties: {
          speed: {
            start: speed,
            end: 0
          }
        },
        duration: 1000,
        easing: 'outQuad',
        onTick: function onTick(properties) {
          // 3 is a magic number
          currentClientX += properties.speed * direction.x * 3 * SYSTEM.pixelRatio;
          currentClientY += properties.speed * direction.y * 3 * SYSTEM.pixelRatio;

          _this6.__applyMove(currentClientX, currentClientY);
        }
      });
      this.prop.animationPromise.then(function (done) {
        _this6.prop.animationPromise = null;

        if (done) {
          _this6.__resetMove();

          _this6.psv.resetIdleTimer();
        }
      });
    }
    /**
     * @summary Triggers an event with all coordinates when a simple click is performed
     * @param {int} clientX
     * @param {int} clientY
     * @param {EventTarget} target
     * @param {boolean} [rightclick=false]
     * @fires PSV.click
     * @fires PSV.dblclick
     * @private
     */
    ;

    _proto.__click = function __click(clientX, clientY, target, rightclick) {
      var _this7 = this;

      if (rightclick === void 0) {
        rightclick = false;
      }

      var boundingRect = this.psv.container.getBoundingClientRect();
      /**
       * @type {PSV.ClickData}
       */

      var data = {
        rightclick: rightclick,
        target: target,
        clientX: clientX,
        clientY: clientY,
        viewerX: clientX - boundingRect.left,
        viewerY: clientY - boundingRect.top
      };
      var intersections = this.psv.dataHelper.getIntersections({
        x: data.viewerX,
        y: data.viewerY
      });
      var sphereIntersection = intersections.find(function (i) {
        return i.object.userData[MESH_USER_DATA];
      });

      if (sphereIntersection) {
        var sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(sphereIntersection.point);
        data.longitude = sphericalCoords.longitude;
        data.latitude = sphericalCoords.latitude;
        data.objects = intersections.map(function (i) {
          return i.object;
        }).filter(function (o) {
          return !o.userData[MESH_USER_DATA];
        });

        try {
          var textureCoords = this.psv.dataHelper.sphericalCoordsToTextureCoords(data);
          data.textureX = textureCoords.x;
          data.textureY = textureCoords.y;
        } catch (e) {
          data.textureX = NaN;
          data.textureY = NaN;
        }

        if (!this.state.dblclickTimeout) {
          this.psv.trigger(EVENTS.CLICK, data);
          this.state.dblclickData = clone(data);
          this.state.dblclickTimeout = setTimeout(function () {
            _this7.state.dblclickTimeout = null;
            _this7.state.dblclickData = null;
          }, DBLCLICK_DELAY);
        } else {
          if (Math.abs(this.state.dblclickData.clientX - data.clientX) < this.state.moveThreshold && Math.abs(this.state.dblclickData.clientY - data.clientY) < this.state.moveThreshold) {
            this.psv.trigger(EVENTS.DOUBLE_CLICK, this.state.dblclickData);
          }

          clearTimeout(this.state.dblclickTimeout);
          this.state.dblclickTimeout = null;
          this.state.dblclickData = null;
        }
      }
    }
    /**
     * @summary Starts moving when crossing moveThreshold and performs movement
     * @param {int} clientX
     * @param {int} clientY
     * @private
     */
    ;

    _proto.__move = function __move(clientX, clientY) {
      if (this.state.mousedown && (Math.abs(clientX - this.state.startMouseX) >= this.state.moveThreshold || Math.abs(clientY - this.state.startMouseY) >= this.state.moveThreshold)) {
        this.psv.__stopAll();

        this.__resetMove();

        this.state.step = MOVING;
        this.state.mouseX = clientX;
        this.state.mouseY = clientY;

        this.__logMouseMove(clientX, clientY);
      } else if (this.state.step === MOVING) {
        this.__applyMove(clientX, clientY);

        this.__logMouseMove(clientX, clientY);
      }
    }
    /**
     * @summary Raw method for movement, called from mouse event and move inertia
     * @param {int} clientX
     * @param {int} clientY
     * @private
     */
    ;

    _proto.__applyMove = function __applyMove(clientX, clientY) {
      var rotation = {
        longitude: (clientX - this.state.mouseX) / this.prop.size.width * this.config.moveSpeed * three.MathUtils.degToRad(this.prop.littlePlanet ? 90 : this.prop.hFov),
        latitude: (clientY - this.state.mouseY) / this.prop.size.height * this.config.moveSpeed * three.MathUtils.degToRad(this.prop.littlePlanet ? 90 : this.prop.vFov)
      };
      var currentPosition = this.psv.getPosition();
      this.psv.rotate({
        longitude: currentPosition.longitude - rotation.longitude,
        latitude: currentPosition.latitude + rotation.latitude
      });
      this.state.mouseX = clientX;
      this.state.mouseY = clientY;
    }
    /**
     * @summary Perfoms combined move and zoom
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__moveZoom = function __moveZoom(evt) {
      if (this.state.step === MOVING) {
        evt.preventDefault();
        var p1 = {
          x: evt.touches[0].clientX,
          y: evt.touches[0].clientY
        };
        var p2 = {
          x: evt.touches[1].clientX,
          y: evt.touches[1].clientY
        };
        var p = distance(p1, p2);
        var delta = (p - this.state.pinchDist) / SYSTEM.pixelRatio * this.config.zoomSpeed;
        this.psv.zoom(this.psv.getZoomLevel() + delta);

        this.__move((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);

        this.state.pinchDist = p;
      }
    }
    /**
     * @summary Stores each mouse position during a mouse move
     * @description Positions older than "INERTIA_WINDOW" are removed<br>
     *     Positions before a pause of "INERTIA_WINDOW" / 10 are removed
     * @param {int} clientX
     * @param {int} clientY
     * @private
     */
    ;

    _proto.__logMouseMove = function __logMouseMove(clientX, clientY) {
      var now = Date.now();
      var last = this.state.mouseHistory.length ? this.state.mouseHistory[this.state.mouseHistory.length - 1] : [0, -1, -1]; // avoid duplicates

      if (last[1] === clientX && last[2] === clientY) {
        last[0] = now;
      } else if (now === last[0]) {
        last[1] = clientX;
        last[2] = clientY;
      } else {
        this.state.mouseHistory.push([now, clientX, clientY]);
      }

      var previous = null;

      for (var i = 0; i < this.state.mouseHistory.length;) {
        if (this.state.mouseHistory[i][0] < now - INERTIA_WINDOW) {
          this.state.mouseHistory.splice(i, 1);
        } else if (previous && this.state.mouseHistory[i][0] - previous > INERTIA_WINDOW / 10) {
          this.state.mouseHistory.splice(0, i);
          i = 0;
          previous = this.state.mouseHistory[i][0];
        } else {
          previous = this.state.mouseHistory[i][0];
          i++;
        }
      }
    };

    return EventsHandler;
  }(AbstractService);

  /**
   * @summary Viewer and renderer
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var Renderer = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(Renderer, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function Renderer(psv) {
      var _this$mesh$userData;

      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @member {external:THREE.WebGLRenderer}
       * @readonly
       * @protected
       */

      _this.renderer = new three.WebGLRenderer({
        alpha: true,
        antialias: true
      });

      _this.renderer.setPixelRatio(SYSTEM.pixelRatio);

      _this.renderer.domElement.className = 'psv-canvas';
      /**
       * @member {external:THREE.Scene}
       * @readonly
       * @protected
       */

      _this.scene = new three.Scene();
      /**
       * @member {external:THREE.PerspectiveCamera}
       * @readonly
       * @protected
       */

      _this.camera = new three.PerspectiveCamera(50, 16 / 9, 0.1, 2 * SPHERE_RADIUS);
      /**
       * @member {external:THREE.Mesh}
       * @readonly
       * @protected
       */

      _this.mesh = _this.psv.adapter.createMesh();
      _this.mesh.userData = (_this$mesh$userData = {}, _this$mesh$userData[MESH_USER_DATA] = true, _this$mesh$userData);
      /**
       * @member {external:THREE.Group}
       * @readonly
       * @private
       */

      _this.meshContainer = new three.Group();

      _this.meshContainer.add(_this.mesh);

      _this.scene.add(_this.meshContainer);
      /**
       * @member {external:THREE.Raycaster}
       * @readonly
       * @protected
       */


      _this.raycaster = new three.Raycaster();
      /**
       * @member {number}
       * @private
       */

      _this.timestamp = null;
      /**
       * @member {boolean}
       * @private
       */

      _this.ready = false;
      /**
       * @member {HTMLElement}
       * @readonly
       * @package
       */

      _this.canvasContainer = document.createElement('div');
      _this.canvasContainer.className = 'psv-canvas-container';
      _this.canvasContainer.style.background = _this.psv.config.canvasBackground;
      _this.canvasContainer.style.cursor = _this.psv.config.mousemove ? 'move' : 'default';

      _this.canvasContainer.appendChild(_this.renderer.domElement);

      _this.psv.container.appendChild(_this.canvasContainer);

      psv.on(EVENTS.SIZE_UPDATED, _assertThisInitialized(_this));
      psv.on(EVENTS.ZOOM_UPDATED, _assertThisInitialized(_this));
      psv.on(EVENTS.POSITION_UPDATED, _assertThisInitialized(_this));
      psv.on(EVENTS.CONFIG_CHANGED, _assertThisInitialized(_this));

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = Renderer.prototype;

    _proto.destroy = function destroy() {
      // cancel render loop
      this.renderer.setAnimationLoop(null); // destroy ThreeJS view

      this.__cleanTHREEScene(this.scene); // remove container


      this.psv.container.removeChild(this.canvasContainer);
      delete this.canvasContainer;
      delete this.renderer;
      delete this.scene;
      delete this.camera;
      delete this.mesh;
      delete this.meshContainer;
      delete this.raycaster;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} evt
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(evt) {
      /* eslint-disable */
      switch (evt.type) {
        // @formatter:off
        case EVENTS.SIZE_UPDATED:
          this.__onSizeUpdated();

          break;

        case EVENTS.ZOOM_UPDATED:
          this.__onZoomUpdated();

          break;

        case EVENTS.POSITION_UPDATED:
          this.__onPositionUpdated();

          break;

        case EVENTS.CONFIG_CHANGED:
          if (evt.args[0].includes('fisheye')) {
            this.__onPositionUpdated();
          }

          if (evt.args[0].includes('mousemove')) {
            this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
          }

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Hides the viewer
     */
    ;

    _proto.hide = function hide() {
      this.canvasContainer.style.opacity = 0;
    }
    /**
     * @summary Shows the viewer
     */
    ;

    _proto.show = function show() {
      this.canvasContainer.style.opacity = 1;
    }
    /**
     * @summary Updates the size of the renderer and the aspect of the camera
     * @private
     */
    ;

    _proto.__onSizeUpdated = function __onSizeUpdated() {
      this.renderer.setSize(this.prop.size.width, this.prop.size.height);
      this.camera.aspect = this.prop.aspect;
      this.camera.updateProjectionMatrix();
      this.prop.needsUpdate = true;
    }
    /**
     * @summary Updates the fov of the camera
     * @private
     */
    ;

    _proto.__onZoomUpdated = function __onZoomUpdated() {
      this.camera.fov = this.prop.vFov;
      this.camera.updateProjectionMatrix();
      this.prop.needsUpdate = true;
    }
    /**
     * @summary Updates the position of the camera
     * @private
     */
    ;

    _proto.__onPositionUpdated = function __onPositionUpdated() {
      this.camera.position.set(0, 0, 0);
      this.camera.lookAt(this.prop.direction);

      if (this.config.fisheye) {
        this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
      }

      this.prop.needsUpdate = true;
    }
    /**
     * @summary Main event loop, calls {@link render} if `prop.needsUpdate` is true
     * @param {number} timestamp
     * @fires PSV.before-render
     * @private
     */
    ;

    _proto.__renderLoop = function __renderLoop(timestamp) {
      var elapsed = this.timestamp !== null ? timestamp - this.timestamp : 0;
      this.timestamp = timestamp;
      this.psv.trigger(EVENTS.BEFORE_RENDER, timestamp, elapsed);
      each(this.psv.dynamics, function (d) {
        return d.update(elapsed);
      });

      if (this.prop.idleTime > 0 && timestamp - this.prop.idleTime > this.config.autorotateDelay) {
        this.psv.startAutorotate();
      }

      if (this.prop.needsUpdate) {
        this.render();
        this.prop.needsUpdate = false;
      }
    }
    /**
     * @summary Performs a render
     * @description Do not call this method directly, instead call
     * {@link PSV.Viewer#needsUpdate} on {@link PSV.event:before-render}.
     * @fires PSV.render
     */
    ;

    _proto.render = function render() {
      this.renderer.render(this.scene, this.camera);
      this.psv.trigger(EVENTS.RENDER);
    }
    /**
     * @summary Applies the texture to the scene, creates the scene if needed
     * @param {PSV.TextureData} textureData
     * @fires PSV.panorama-loaded
     * @package
     */
    ;

    _proto.setTexture = function setTexture(textureData) {
      var _this2 = this;

      this.prop.panoData = textureData.panoData;
      this.psv.adapter.setTexture(this.mesh, textureData);

      if (!this.ready) {
        this.renderer.setAnimationLoop(function (t) {
          return _this2.__renderLoop(t);
        });
        this.ready = true;
      }

      this.psv.needsUpdate();
      this.psv.trigger(EVENTS.PANORAMA_LOADED, textureData);
    }
    /**
     * @summary Applies the overlay to the mesh
     * @param {PSV.TextureData} textureData
     * @param {number} opacity
     * @package
     */
    ;

    _proto.setOverlay = function setOverlay(textureData, opacity) {
      this.psv.adapter.setOverlay(this.mesh, textureData, opacity);
      this.psv.needsUpdate();
    }
    /**
     * @summary Apply a panorama data pose to a Mesh
     * @param {PSV.PanoData} [panoData]
     * @param {external:THREE.Mesh} [mesh=this.mesh]
     * @package
     */
    ;

    _proto.setPanoramaPose = function setPanoramaPose(panoData, mesh) {
      if (mesh === void 0) {
        mesh = this.mesh;
      }

      // By Google documentation the angles are applied on the camera in order : heading, pitch, roll
      // here we apply the reverse transformation on the sphere
      var cleanCorrection = this.psv.dataHelper.cleanPanoramaPose(panoData);
      mesh.rotation.set(-cleanCorrection.tilt, -cleanCorrection.pan, -cleanCorrection.roll, 'ZXY');
    }
    /**
     * @summary Apply a SphereCorrection to a Mesh
     * @param {PSV.SphereCorrection} [sphereCorrection]
     * @param {external:THREE.Mesh} [mesh=this.meshContainer]
     * @package
     */
    ;

    _proto.setSphereCorrection = function setSphereCorrection(sphereCorrection, mesh) {
      if (mesh === void 0) {
        mesh = this.meshContainer;
      }

      var cleanCorrection = this.psv.dataHelper.cleanSphereCorrection(sphereCorrection);
      mesh.rotation.set(cleanCorrection.tilt, cleanCorrection.pan, cleanCorrection.roll, 'ZXY');
    }
    /**
     * @summary Performs transition between the current and a new texture
     * @param {PSV.TextureData} textureData
     * @param {PSV.PanoramaOptions} options
     * @returns {PSV.utils.Animation}
     * @package
     */
    ;

    _proto.transition = function transition(textureData, options) {
      var _this3 = this;

      var positionProvided = isExtendedPosition(options);
      var zoomProvided = ('zoom' in options); // create temp group and new mesh, half size to be in "front" of the first one

      var group = new three.Group();
      var mesh = this.psv.adapter.createMesh(0.5);
      this.psv.adapter.setTexture(mesh, textureData, true);
      this.psv.adapter.setTextureOpacity(mesh, 0);
      this.setPanoramaPose(textureData.panoData, mesh);
      this.setSphereCorrection(options.sphereCorrection, group); // rotate the new sphere to make the target position face the camera

      if (positionProvided) {
        var cleanPosition = this.psv.dataHelper.cleanPosition(options);
        var currentPosition = this.psv.getPosition(); // Longitude rotation along the vertical axis

        var verticalAxis = new three.Vector3(0, 1, 0);
        group.rotateOnWorldAxis(verticalAxis, cleanPosition.longitude - currentPosition.longitude); // Latitude rotation along the camera horizontal axis

        var horizontalAxis = new three.Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new three.Vector3())).normalize();
        group.rotateOnWorldAxis(horizontalAxis, cleanPosition.latitude - currentPosition.latitude);
      }

      group.add(mesh);
      this.scene.add(group);
      var animation = new Animation({
        properties: {
          opacity: {
            start: 0.0,
            end: 1.0
          },
          zoom: zoomProvided ? {
            start: this.psv.getZoomLevel(),
            end: options.zoom
          } : undefined
        },
        duration: options.transition,
        easing: 'outCubic',
        onTick: function onTick(properties) {
          _this3.psv.adapter.setTextureOpacity(mesh, properties.opacity);

          _this3.psv.adapter.setTextureOpacity(_this3.mesh, 1 - properties.opacity);

          if (zoomProvided) {
            _this3.psv.zoom(properties.zoom);
          }

          _this3.psv.needsUpdate();
        }
      });
      animation.then(function (completed) {
        if (completed) {
          // remove temp sphere and transfer the texture to the main mesh
          _this3.setTexture(textureData);

          _this3.psv.adapter.setTextureOpacity(_this3.mesh, 1);

          _this3.setPanoramaPose(textureData.panoData);

          _this3.setSphereCorrection(options.sphereCorrection); // actually rotate the camera


          if (positionProvided) {
            _this3.psv.rotate(options);
          }
        } else {
          _this3.psv.adapter.disposeTexture(textureData);
        }

        _this3.scene.remove(group);

        mesh.geometry.dispose();
        mesh.geometry = null;
      });
      return animation;
    }
    /**
     * @summary Calls `dispose` on all objects and textures
     * @param {external:THREE.Object3D} object
     * @private
     */
    ;

    _proto.__cleanTHREEScene = function __cleanTHREEScene(object) {
      var _this4 = this;

      object.traverse(function (item) {
        if (item.geometry) {
          item.geometry.dispose();
        }

        if (item.material) {
          if (Array.isArray(item.material)) {
            item.material.forEach(function (material) {
              if (material.map) {
                material.map.dispose();
              }

              material.dispose();
            });
          } else {
            if (item.material.map) {
              item.material.map.dispose();
            }

            item.material.dispose();
          }
        }

        if (item.dispose && !(item instanceof three.Scene)) {
          item.dispose();
        }

        if (item !== object) {
          _this4.__cleanTHREEScene(item);
        }
      });
    };

    return Renderer;
  }(AbstractService);

  /**
   * @summary Texture loader
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var TextureLoader = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(TextureLoader, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function TextureLoader(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @summary THREE file loader
       * @type {external:THREE:FileLoader}
       * @private
       */

      _this.loader = new three.FileLoader();

      _this.loader.setResponseType('blob');

      if (_this.config.withCredentials) {
        _this.loader.setWithCredentials(true);
      }

      if (_this.config.requestHeaders && typeof _this.config.requestHeaders === 'object') {
        _this.loader.setRequestHeader(_this.config.requestHeaders);
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = TextureLoader.prototype;

    _proto.destroy = function destroy() {
      this.abortLoading();

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Cancels current HTTP requests
     * @package
     */
    ;

    _proto.abortLoading = function abortLoading() {// noop implementation waiting for https://github.com/mrdoob/three.js/pull/23070
    }
    /**
     * @summary Loads a Blob with FileLoader
     * @param {string} url
     * @param {function(number)} [onProgress]
     * @returns {Promise<Blob>}
     */
    ;

    _proto.loadFile = function loadFile(url, onProgress) {
      var _this2 = this;

      if (this.config.requestHeaders && typeof this.config.requestHeaders === 'function') {
        this.loader.setRequestHeader(this.config.requestHeaders(url));
      }

      return new Promise(function (resolve, reject) {
        var progress = 0;
        onProgress == null ? void 0 : onProgress(progress);

        _this2.loader.load(url, function (result) {
          progress = 100;
          onProgress == null ? void 0 : onProgress(progress);
          resolve(result);
        }, function (e) {
          if (e.lengthComputable) {
            var newProgress = e.loaded / e.total * 100;

            if (newProgress > progress) {
              progress = newProgress;
              onProgress == null ? void 0 : onProgress(progress);
            }
          }
        }, function (err) {
          reject(err);
        });
      });
    }
    /**
     * @summary Loads an Image using FileLoader to have progress events
     * @param {string} url
     * @param {function(number)} [onProgress]
     * @returns {Promise<HTMLImageElement>}
     */
    ;

    _proto.loadImage = function loadImage(url, onProgress) {
      return this.loadFile(url, onProgress).then(function (result) {
        return new Promise(function (resolve, reject) {
          var img = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');

          img.onload = function () {
            URL.revokeObjectURL(img.src);
            resolve(img);
          };

          img.onerror = reject;
          img.src = URL.createObjectURL(result);
        });
      });
    }
    /**
     * @summary Preload a panorama file without displaying it
     * @param {*} panorama
     * @returns {Promise}
     */
    ;

    _proto.preloadPanorama = function preloadPanorama(panorama) {
      if (this.psv.adapter.supportsPreload(panorama)) {
        return this.psv.adapter.loadTexture(panorama);
      } else {
        return Promise.resolve();
      }
    };

    return TextureLoader;
  }(AbstractService);

  var STATE = {
    NONE: 0,
    SHOWING: 1,
    HIDING: 2,
    READY: 3
  };
  /**
   * @typedef {Object} PSV.components.Tooltip.Position
   * @summary Object defining the tooltip position
   * @property {number} top - Position of the tip of the arrow of the tooltip, in pixels
   * @property {number} left - Position of the tip of the arrow of the tooltip, in pixels
   * @property {string|string[]} [position='top center'] - Tooltip position toward it's arrow tip.
   *           Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`
   * @property {Object} [box] - Used when displaying a tooltip on a marker
   * @property {number} [box.width=0]
   * @property {number} [box.height=0]
   */

  /**
   * @typedef {PSV.components.Tooltip.Position} PSV.components.Tooltip.Config
   * @summary Object defining the tooltip configuration
   * @property {string} content - HTML content of the tooltip
   * @property {string} [className] - Additional CSS class added to the tooltip
   * @property {*} [data] - Userdata associated to the tooltip
   */

  /**
   * @summary Tooltip component
   * @description Never instanciate tooltips directly use {@link PSV.services.TooltipRenderer} instead
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Tooltip = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Tooltip, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     * @param {{arrow: number, border: number}} size
     */
    function Tooltip(psv, size) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-tooltip') || this;
      /**
       * @override
       * @property {number} arrow
       * @property {number} border
       * @property {number} width
       * @property {number} height
       * @property {string} pos
       * @property {string} state
       * @property {*} data
       */

      _this.prop = _extends({}, _this.prop, size, {
        state: STATE.NONE,
        width: 0,
        height: 0,
        pos: '',
        config: null,
        data: null
      });
      /**
       * Tooltip content
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-tooltip-content';

      _this.container.appendChild(_this.content);
      /**
       * Tooltip arrow
       * @member {HTMLElement}
       * @readonly
       * @package
       */


      _this.arrow = document.createElement('div');
      _this.arrow.className = 'psv-tooltip-arrow';

      _this.container.appendChild(_this.arrow);

      _this.container.addEventListener('transitionend', _assertThisInitialized(_this));

      _this.container.style.top = '-1000px';
      _this.container.style.left = '-1000px';
      return _this;
    }
    /**
     * @override
     */


    var _proto = Tooltip.prototype;

    _proto.destroy = function destroy() {
      delete this.arrow;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'transitionend':
          this.__onTransitionEnd(e);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @summary This method is not supported
     * @throws {PSV.PSVError} always
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Tooltip cannot be toggled');
    }
    /**
     * @summary Displays the tooltip on the viewer
     * Do not call this method directly, use {@link PSV.services.TooltipRenderer} instead.
     * @param {PSV.components.Tooltip.Config} config
     *
     * @fires PSV.show-tooltip
     * @throws {PSV.PSVError} when the configuration is incorrect
     *
     * @package
     */
    ;

    _proto.show = function show(config) {
      if (this.prop.state !== STATE.NONE) {
        throw new PSVError('Initialized tooltip cannot be re-initialized');
      }

      if (config.className) {
        addClasses(this.container, config.className);
      }

      this.content.innerHTML = config.content;
      var rect = this.container.getBoundingClientRect();
      this.prop.width = rect.right - rect.left;
      this.prop.height = rect.bottom - rect.top;
      this.prop.state = STATE.READY;
      this.move(config);
      this.prop.data = config.data;
      this.prop.state = STATE.SHOWING;
      this.psv.trigger(EVENTS.SHOW_TOOLTIP, this.prop.data, this);

      this.__waitImages();
    }
    /**
     * @summary Moves the tooltip to a new position
     * @param {PSV.components.Tooltip.Position} config
     *
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    ;

    _proto.move = function move(config) {
      if (this.prop.state !== STATE.SHOWING && this.prop.state !== STATE.READY) {
        throw new PSVError('Uninitialized tooltip cannot be moved');
      }

      if (!config.box) {
        config.box = {
          width: 0,
          height: 0
        };
      }

      this.config = config;
      var t = this.container;
      var a = this.arrow; // compute size

      var style = {
        posClass: cleanPosition(config.position, {
          allowCenter: false,
          cssOrder: false
        }) || ['top', 'center'],
        width: this.prop.width,
        height: this.prop.height,
        top: 0,
        left: 0,
        arrowTop: 0,
        arrowLeft: 0
      }; // set initial position

      this.__computeTooltipPosition(style, config); // correct position if overflow


      var swapY = null;
      var swapX = null;

      if (style.top < 0) {
        swapY = 'bottom';
      } else if (style.top + style.height > this.psv.prop.size.height) {
        swapY = 'top';
      }

      if (style.left < 0) {
        swapX = 'right';
      } else if (style.left + style.width > this.psv.prop.size.width) {
        swapX = 'left';
      }

      if (swapX || swapY) {
        var ordered = positionIsOrdered(style.posClass);

        if (swapY) {
          style.posClass[ordered ? 0 : 1] = swapY;
        }

        if (swapX) {
          style.posClass[ordered ? 1 : 0] = swapX;
        }

        this.__computeTooltipPosition(style, config);
      } // apply position


      t.style.top = style.top + 'px';
      t.style.left = style.left + 'px';
      a.style.top = style.arrowTop + 'px';
      a.style.left = style.arrowLeft + 'px';
      var newPos = style.posClass.join('-');

      if (newPos !== this.prop.pos) {
        t.classList.remove("psv-tooltip--" + this.prop.pos);
        this.prop.pos = newPos;
        t.classList.add("psv-tooltip--" + this.prop.pos);
      }
    }
    /**
     * @summary Hides the tooltip
     * @fires PSV.hide-tooltip
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-tooltip--visible');
      this.prop.state = STATE.HIDING;
      this.psv.trigger(EVENTS.HIDE_TOOLTIP, this.prop.data);
    }
    /**
     * @summary Finalize transition
     * @param {TransitionEvent} e
     * @private
     */
    ;

    _proto.__onTransitionEnd = function __onTransitionEnd(e) {
      if (e.propertyName === 'transform') {
        switch (this.prop.state) {
          case STATE.SHOWING:
            this.container.classList.add('psv-tooltip--visible');
            this.prop.state = STATE.READY;
            break;

          case STATE.HIDING:
            this.prop.state = STATE.NONE;
            this.destroy();
            break;

        }
      }
    }
    /**
     * @summary Computes the position of the tooltip and its arrow
     * @param {Object} style
     * @param {Object} config
     * @private
     */
    ;

    _proto.__computeTooltipPosition = function __computeTooltipPosition(style, config) {
      var arrow = this.prop.arrow;
      var top = config.top;
      var height = style.height;
      var left = config.left;
      var width = style.width;
      var offsetSide = arrow + this.prop.border;
      var offsetX = config.box.width / 2 + arrow * 2;
      var offsetY = config.box.height / 2 + arrow * 2;

      switch (style.posClass.join('-')) {
        case 'top-left':
          style.top = top - offsetY - height;
          style.left = left + offsetSide - width;
          style.arrowTop = height;
          style.arrowLeft = width - offsetSide - arrow;
          break;

        case 'top-center':
          style.top = top - offsetY - height;
          style.left = left - width / 2;
          style.arrowTop = height;
          style.arrowLeft = width / 2 - arrow;
          break;

        case 'top-right':
          style.top = top - offsetY - height;
          style.left = left - offsetSide;
          style.arrowTop = height;
          style.arrowLeft = arrow;
          break;

        case 'bottom-left':
          style.top = top + offsetY;
          style.left = left + offsetSide - width;
          style.arrowTop = -arrow * 2;
          style.arrowLeft = width - offsetSide - arrow;
          break;

        case 'bottom-center':
          style.top = top + offsetY;
          style.left = left - width / 2;
          style.arrowTop = -arrow * 2;
          style.arrowLeft = width / 2 - arrow;
          break;

        case 'bottom-right':
          style.top = top + offsetY;
          style.left = left - offsetSide;
          style.arrowTop = -arrow * 2;
          style.arrowLeft = arrow;
          break;

        case 'left-top':
          style.top = top + offsetSide - height;
          style.left = left - offsetX - width;
          style.arrowTop = height - offsetSide - arrow;
          style.arrowLeft = width;
          break;

        case 'center-left':
          style.top = top - height / 2;
          style.left = left - offsetX - width;
          style.arrowTop = height / 2 - arrow;
          style.arrowLeft = width;
          break;

        case 'left-bottom':
          style.top = top - offsetSide;
          style.left = left - offsetX - width;
          style.arrowTop = arrow;
          style.arrowLeft = width;
          break;

        case 'right-top':
          style.top = top + offsetSide - height;
          style.left = left + offsetX;
          style.arrowTop = height - offsetSide - arrow;
          style.arrowLeft = -arrow * 2;
          break;

        case 'center-right':
          style.top = top - height / 2;
          style.left = left + offsetX;
          style.arrowTop = height / 2 - arrow;
          style.arrowLeft = -arrow * 2;
          break;

        case 'right-bottom':
          style.top = top - offsetSide;
          style.left = left + offsetX;
          style.arrowTop = arrow;
          style.arrowLeft = -arrow * 2;
          break;
        // no default
      }
    }
    /**
     * @summary If the tooltip contains images, recompute its size once they are loaded
     * @private
     */
    ;

    _proto.__waitImages = function __waitImages() {
      var _this2 = this;

      var images = this.content.querySelectorAll('img');

      if (images.length > 0) {
        var promises = [];
        images.forEach(function (image) {
          promises.push(new Promise(function (resolve) {
            image.onload = resolve;
            image.onerror = resolve;
          }));
        });
        Promise.all(promises).then(function () {
          if (_this2.prop.state === STATE.SHOWING || _this2.prop.state === STATE.READY) {
            var rect = _this2.container.getBoundingClientRect();

            _this2.prop.width = rect.right - rect.left;
            _this2.prop.height = rect.bottom - rect.top;

            _this2.move(_this2.config);
          }
        });
      }
    };

    return Tooltip;
  }(AbstractComponent);

  /**
   * @summary Tooltip renderer
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var TooltipRenderer = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(TooltipRenderer, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function TooltipRenderer(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      var testTooltip = new Tooltip(_this.psv, {
        arrow: 0,
        border: 0
      });
      /**
       * @summary Computed static sizes
       * @member {Object}
       * @package
       * @property {number} arrow
       * @property {number} border
       */

      _this.size = {
        arrow: parseInt(getStyle(testTooltip.arrow, 'borderTopWidth'), 10),
        border: parseInt(getStyle(testTooltip.container, 'borderTopLeftRadius'), 10)
      };
      testTooltip.destroy();
      return _this;
    }
    /**
     * @override
     */


    var _proto = TooltipRenderer.prototype;

    _proto.destroy = function destroy() {
      delete this.size;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Displays a tooltip on the viewer
     * @param {PSV.components.Tooltip.Config} config
     * @returns {PSV.components.Tooltip}
     *
     * @fires PSV.show-tooltip
     * @throws {PSV.PSVError} when the configuration is incorrect
     *
     * @example
     * viewer.tooltip.create({ content: 'Hello world', top: 200, left: 450, position: 'center bottom'})
     */
    ;

    _proto.create = function create(config) {
      var tooltip = new Tooltip(this.psv, this.size);
      tooltip.show(config);
      return tooltip;
    };

    return TooltipRenderer;
  }(AbstractService);

  three.Cache.enabled = true;
  /**
   * @summary Main class
   * @memberOf PSV
   * @extends {external:uEvent.EventEmitter}
   */

  var Viewer = /*#__PURE__*/function (_EventEmitter) {
    _inheritsLoose(Viewer, _EventEmitter);

    /**
     * @param {PSV.Options} options
     * @fires PSV.ready
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    function Viewer(options) {
      var _this;

      _this = _EventEmitter.call(this) || this;
      SYSTEM.load(); // must support WebGL

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


      _this.prop = {
        ready: false,
        uiRefresh: false,
        needsUpdate: false,
        fullscreen: false,
        direction: new three.Vector3(0, 0, SPHERE_RADIUS),
        vFov: null,
        hFov: null,
        aspect: null,
        autorotateEnabled: false,
        animationPromise: null,
        loadingPromise: null,
        littlePlanet: false,
        idleTime: -1,
        objectsObservers: {},
        size: {
          width: 0,
          height: 0
        },
        panoData: {
          fullWidth: 0,
          fullHeight: 0,
          croppedWidth: 0,
          croppedHeight: 0,
          croppedX: 0,
          croppedY: 0,
          poseHeading: 0,
          posePitch: 0,
          poseRoll: 0
        }
      };
      /**
       * @summary Configuration holder
       * @type {PSV.Options}
       * @readonly
       */

      _this.config = getConfig(options);
      /**
       * @summary Top most parent
       * @member {HTMLElement}
       * @readonly
       */

      _this.parent = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
      _this.parent[VIEWER_DATA] = _assertThisInitialized(_this);
      /**
       * @summary Main container
       * @member {HTMLElement}
       * @readonly
       */

      _this.container = document.createElement('div');

      _this.container.classList.add('psv-container');

      _this.parent.appendChild(_this.container);
      /**
       * @summary Render adapter
       * @type {PSV.adapters.AbstractAdapter}
       * @readonly
       * @package
       */


      _this.adapter = new _this.config.adapter[0](_assertThisInitialized(_this), _this.config.adapter[1]); // eslint-disable-line new-cap

      /**
       * @summary All child components
       * @type {PSV.components.AbstractComponent[]}
       * @readonly
       * @package
       */

      _this.children = [];
      /**
       * @summary All plugins
       * @type {Object<string, PSV.plugins.AbstractPlugin>}
       * @readonly
       * @package
       */

      _this.plugins = {};
      /**
       * @type {PSV.services.Renderer}
       * @readonly
       */

      _this.renderer = new Renderer(_assertThisInitialized(_this));
      /**
       * @type {PSV.services.TextureLoader}
       * @readonly
       */

      _this.textureLoader = new TextureLoader(_assertThisInitialized(_this));
      /**
       * @type {PSV.services.EventsHandler}
       * @readonly
       */

      _this.eventsHandler = new EventsHandler(_assertThisInitialized(_this));
      /**
       * @type {PSV.services.DataHelper}
       * @readonly
       */

      _this.dataHelper = new DataHelper(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Loader}
       * @readonly
       */

      _this.loader = new Loader(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Navbar}
       * @readonly
       */

      _this.navbar = new Navbar(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Panel}
       * @readonly
       */

      _this.panel = new Panel(_assertThisInitialized(_this));
      /**
       * @member {PSV.services.TooltipRenderer}
       * @readonly
       */

      _this.tooltip = new TooltipRenderer(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Notification}
       * @readonly
       */

      _this.notification = new Notification(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Overlay}
       * @readonly
       */

      _this.overlay = new Overlay(_assertThisInitialized(_this));
      /**
       * @member {Record<string, PSV.utils.Dynamic>}
       * @package
       */

      _this.dynamics = {
        zoom: new Dynamic(function (value) {
          _this.prop.vFov = _this.dataHelper.zoomLevelToFov(value);
          _this.prop.hFov = _this.dataHelper.vFovToHFov(_this.prop.vFov);

          _this.trigger(EVENTS.ZOOM_UPDATED, value);
        }, _this.config.defaultZoomLvl, 0, 100),
        position: new MultiDynamic({
          longitude: new Dynamic(null, _this.config.defaultLong, 0, 2 * Math.PI, true),
          latitude: _this.prop.littlePlanet ? new Dynamic(null, _this.config.defaultLat, 0, Math.PI * 2, true) : new Dynamic(null, _this.config.defaultLat, -Math.PI / 2, Math.PI / 2)
        }, function (position) {
          _this.dataHelper.sphericalCoordsToVector3(position, _this.prop.direction);

          _this.trigger(EVENTS.POSITION_UPDATED, position);
        })
      };

      _this.__updateSpeeds();

      _this.eventsHandler.init();

      _this.__resizeRefresh = throttle(function () {
        return _this.refreshUi('resize');
      }, 500); // apply container size

      _this.resize(_this.config.size); // init plugins


      _this.config.plugins.forEach(function (_ref) {
        var plugin = _ref[0],
            opts = _ref[1];
        _this.plugins[plugin.id] = new plugin(_assertThisInitialized(_this), opts); // eslint-disable-line new-cap
      });

      each(_this.plugins, function (plugin) {
        return plugin.init == null ? void 0 : plugin.init();
      }); // init buttons

      _this.navbar.setButtons(_this.config.navbar); // load panorama


      if (_this.config.panorama) {
        _this.setPanorama(_this.config.panorama);
      }

      toggleClass(_this.container, 'psv--is-touch', SYSTEM.isTouchEnabled.initial);
      SYSTEM.isTouchEnabled.promise.then(function (enabled) {
        return toggleClass(_this.container, 'psv--is-touch', enabled);
      }); // enable GUI after first render

      _this.once(EVENTS.RENDER, function () {
        if (_this.config.navbar) {
          _this.container.classList.add('psv--has-navbar');

          _this.navbar.show();
        } // Queue autorotate


        if (!isNil(_this.config.autorotateDelay)) {
          _this.prop.idleTime = performance.now();
        }

        _this.prop.ready = true;
        setTimeout(function () {
          _this.refreshUi('init');

          _this.trigger(EVENTS.READY);
        }, 0);
      });

      return _this;
    }
    /**
     * @summary Destroys the viewer
     * @description The memory used by the ThreeJS context is not totally cleared. This will be fixed as soon as possible.
     */


    var _proto = Viewer.prototype;

    _proto.destroy = function destroy() {
      this.__stopAll();

      this.stopKeyboardControl();
      this.exitFullscreen();
      each(this.plugins, function (plugin) {
        return plugin.destroy();
      });
      delete this.plugins;
      this.children.slice().forEach(function (child) {
        return child.destroy();
      });
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
    ;

    _proto.refreshUi = function refreshUi(reason) {
      var _this2 = this;

      if (!this.prop.ready) {
        return;
      }

      if (!this.prop.uiRefresh) {
        // console.log(`PhotoSphereViewer: UI Refresh, ${reason}`);
        this.prop.uiRefresh = true;
        this.children.every(function (child) {
          child.refreshUi();
          return _this2.prop.uiRefresh === true;
        });
        this.prop.uiRefresh = false;
      } else if (this.prop.uiRefresh !== 'new') {
        this.prop.uiRefresh = 'new'; // wait for current refresh to cancel

        setTimeout(function () {
          _this2.prop.uiRefresh = false;

          _this2.refreshUi(reason);
        });
      }
    }
    /**
     * @summary Returns the instance of a plugin if it exists
     * @param {Class<PSV.plugins.AbstractPlugin>|string} pluginId
     * @returns {PSV.plugins.AbstractPlugin}
     */
    ;

    _proto.getPlugin = function getPlugin(pluginId) {
      if (typeof pluginId === 'string') {
        return this.plugins[pluginId];
      } else {
        var pluginCtor = pluginInterop(pluginId, AbstractPlugin);
        return pluginCtor ? this.plugins[pluginCtor.id] : undefined;
      }
    }
    /**
     * @summary Returns the current position of the camera
     * @returns {PSV.Position}
     */
    ;

    _proto.getPosition = function getPosition() {
      return this.dataHelper.cleanPosition(this.dynamics.position.current);
    }
    /**
     * @summary Returns the current zoom level
     * @returns {number}
     */
    ;

    _proto.getZoomLevel = function getZoomLevel() {
      return this.dynamics.zoom.current;
    }
    /**
     * @summary Returns the current viewer size
     * @returns {PSV.Size}
     */
    ;

    _proto.getSize = function getSize() {
      return _extends({}, this.prop.size);
    }
    /**
     * @summary Checks if the automatic rotation is enabled
     * @returns {boolean}
     */
    ;

    _proto.isAutorotateEnabled = function isAutorotateEnabled() {
      return this.prop.autorotateEnabled;
    }
    /**
     * @summary Checks if the viewer is in fullscreen
     * @returns {boolean}
     */
    ;

    _proto.isFullscreenEnabled = function isFullscreenEnabled$1() {
      if (SYSTEM.fullscreenEvent) {
        return isFullscreenEnabled(this.container);
      } else {
        return this.prop.fullscreen;
      }
    }
    /**
     * @summary Flags the view has changed for the next render
     */
    ;

    _proto.needsUpdate = function needsUpdate() {
      this.prop.needsUpdate = true;
    }
    /**
     * @summary Resizes the canvas when the window is resized
     * @fires PSV.size-updated
     */
    ;

    _proto.autoSize = function autoSize() {
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
    ;

    _proto.setPanorama = function setPanorama(path, options) {
      var _this$prop$transition,
          _this3 = this;

      if (options === void 0) {
        options = {};
      }

      this.textureLoader.abortLoading();
      (_this$prop$transition = this.prop.transitionAnimation) == null ? void 0 : _this$prop$transition.cancel(); // apply default parameters on first load

      if (!this.prop.ready) {
        ['sphereCorrection', 'panoData', 'overlay', 'overlayOpacity'].forEach(function (opt) {
          if (!(opt in options)) {
            options[opt] = _this3.config[opt];
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

      var positionProvided = isExtendedPosition(options);
      var zoomProvided = ('zoom' in options);

      if (positionProvided || zoomProvided) {
        this.__stopAll();
      }

      this.hideError();
      this.config.panorama = path;
      this.config.caption = options.caption;
      this.config.description = options.description;

      var done = function done(err) {
        _this3.loader.hide();

        _this3.prop.loadingPromise = null;

        if (isAbortError(err)) {
          return false;
        } else if (err) {
          _this3.navbar.setCaption('');

          _this3.showError(_this3.config.lang.loadError);

          console.error(err);
          throw err;
        } else {
          _this3.resetIdleTimer();

          _this3.setOverlay(options.overlay, options.overlayOpacity);

          _this3.navbar.setCaption(_this3.config.caption);

          return true;
        }
      };

      this.navbar.setCaption("<em>" + (this.config.loadingTxt || '') + "</em>");

      if (options.showLoader || !this.prop.ready) {
        this.loader.show();
      }

      var loadingPromise = this.adapter.loadTexture(this.config.panorama, options.panoData).then(function (textureData) {
        // check if another panorama was requested
        if (textureData.panorama !== _this3.config.panorama) {
          _this3.adapter.disposeTexture(textureData);

          throw getAbortError();
        }

        return textureData;
      });

      if (!options.transition || !this.prop.ready || !this.adapter.supportsTransition(this.config.panorama)) {
        this.prop.loadingPromise = loadingPromise.then(function (textureData) {
          _this3.renderer.show();

          _this3.renderer.setTexture(textureData);

          _this3.renderer.setPanoramaPose(textureData.panoData);

          _this3.renderer.setSphereCorrection(options.sphereCorrection);

          if (zoomProvided) {
            _this3.zoom(options.zoom);
          }

          if (positionProvided) {
            _this3.rotate(options);
          }
        }).then(done, done);
      } else {
        this.prop.loadingPromise = loadingPromise.then(function (textureData) {
          _this3.loader.hide();

          _this3.prop.transitionAnimation = _this3.renderer.transition(textureData, options);
          return _this3.prop.transitionAnimation;
        }).then(function (completed) {
          _this3.prop.transitionAnimation = null;

          if (!completed) {
            throw getAbortError();
          }
        }).then(done, done);
      }

      return this.prop.loadingPromise;
    }
    /**
     * @summary Loads a new overlay
     * @param {*} path - URL of the new overlay file
     * @param {number} [opacity=1]
     * @returns {Promise}
     */
    ;

    _proto.setOverlay = function setOverlay(path, opacity) {
      var _this4 = this;

      if (opacity === void 0) {
        opacity = 1;
      }

      if (!path) {
        if (this.adapter.constructor.supportsOverlay) {
          this.renderer.setOverlay(null, 0);
        }

        return Promise.resolve();
      } else {
        if (!this.adapter.constructor.supportsOverlay) {
          return Promise.reject(new PSVError(this.adapter.constructor.id + " adapter does not supports overlay"));
        }

        return this.adapter.loadTexture(path, function (image) {
          var p = _this4.prop.panoData;
          var r = image.width / p.croppedWidth;
          return {
            fullWidth: r * p.fullWidth,
            fullHeight: r * p.fullHeight,
            croppedWidth: r * p.croppedWidth,
            croppedHeight: r * p.croppedHeight,
            croppedX: r * p.croppedX,
            croppedY: r * p.croppedY
          };
        }, false).then(function (textureData) {
          _this4.renderer.setOverlay(textureData, opacity);
        });
      }
    }
    /**
     * @summary Update options
     * @param {PSV.Options} options
     * @fires PSV.config-changed
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    ;

    _proto.setOptions = function setOptions(options) {
      var _this5 = this;

      var rawConfig = _extends({}, this.config, options);

      each(options, function (value, key) {
        if (DEPRECATED_OPTIONS[key]) {
          logWarn(DEPRECATED_OPTIONS[key]);
          return;
        }

        if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
          throw new PSVError("Unknown option " + key);
        }

        if (READONLY_OPTIONS[key]) {
          throw new PSVError(READONLY_OPTIONS[key]);
        }

        if (CONFIG_PARSERS[key]) {
          _this5.config[key] = CONFIG_PARSERS[key](value, rawConfig);
        } else {
          _this5.config[key] = value;
        }

        switch (key) {
          case 'overlay':
          case 'overlayOpacity':
            _this5.setOverlay(_this5.config.overlay, _this5.config.overlayOpacity);

            break;

          case 'caption':
          case 'description':
            _this5.navbar.setCaption(_this5.config.caption);

            break;

          case 'size':
            _this5.resize(value);

            break;

          case 'sphereCorrection':
            _this5.renderer.setSphereCorrection(value);

            break;

          case 'navbar':
          case 'lang':
            _this5.navbar.setButtons(_this5.config.navbar);

            break;

          case 'moveSpeed':
          case 'zoomSpeed':
            _this5.__updateSpeeds();

            break;

          case 'minFov':
          case 'maxFov':
            _this5.dynamics.zoom.setValue(_this5.dataHelper.fovToZoomLevel(_this5.prop.vFov));

            _this5.trigger(EVENTS.ZOOM_UPDATED, _this5.getZoomLevel());

            break;

          case 'canvasBackground':
            _this5.renderer.canvasContainer.style.background = _this5.config.canvasBackground;
            break;

          case 'autorotateIdle':
            _this5.resetIdleTimer();

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
    ;

    _proto.setOption = function setOption(option, value) {
      var _this$setOptions;

      this.setOptions((_this$setOptions = {}, _this$setOptions[option] = value, _this$setOptions));
    }
    /**
     * @summary Restarts the idle timer (if `autorotateIdle=true`)
     * @package
     */
    ;

    _proto.resetIdleTimer = function resetIdleTimer() {
      this.prop.idleTime = this.config.autorotateIdle ? performance.now() : -1;
    }
    /**
     * @summary Stops the idle timer
     * @package
     */
    ;

    _proto.disableIdleTimer = function disableIdleTimer() {
      this.prop.idleTime = -1;
    }
    /**
     * @summary Starts the automatic rotation
     * @fires PSV.autorotate
     */
    ;

    _proto.startAutorotate = function startAutorotate(refresh) {
      if (refresh === void 0) {
        refresh = false;
      }

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
        longitude: this.config.autorotateSpeed < 0
      }, Math.abs(this.config.autorotateSpeed / this.config.moveSpeed));
      this.dynamics.position.goto({
        latitude: this.config.autorotateLat
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
    ;

    _proto.stopAutorotate = function stopAutorotate() {
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
    ;

    _proto.toggleAutorotate = function toggleAutorotate() {
      if (this.isAutorotateEnabled()) {
        this.stopAutorotate();
      } else {
        this.startAutorotate();
      }
    }
    /**
     * @summary Displays an error message over the viewer
     * @param {string} message
     */
    ;

    _proto.showError = function showError(message) {
      this.overlay.show({
        id: IDS.ERROR,
        image: errorIcon,
        text: message,
        dissmisable: false
      });
    }
    /**
     * @summary Hides the error message
     */
    ;

    _proto.hideError = function hideError() {
      this.overlay.hide(IDS.ERROR);
    }
    /**
     * @summary Rotates the view to specific longitude and latitude
     * @param {PSV.ExtendedPosition} position
     * @fires PSV.before-rotate
     * @fires PSV.position-updated
     */
    ;

    _proto.rotate = function rotate(position) {
      var e = this.trigger(EVENTS.BEFORE_ROTATE, position);

      if (e.isDefaultPrevented()) {
        return;
      }

      var cleanPosition = this.change(CHANGE_EVENTS.GET_ROTATE_POSITION, this.dataHelper.cleanPosition(position));
      this.dynamics.position.setValue(cleanPosition);
    }
    /**
     * @summary Rotates and zooms the view with a smooth animation
     * @param {PSV.AnimateOptions} options - position and/or zoom level
     * @returns {PSV.utils.Animation}
     */
    ;

    _proto.animate = function animate(options) {
      var _this6 = this;

      this.__stopAll();

      var positionProvided = isExtendedPosition(options);
      var zoomProvided = options.zoom !== undefined;
      var animProperties = {};
      var duration; // clean/filter position and compute duration

      if (positionProvided) {
        var cleanPosition = this.change(CHANGE_EVENTS.GET_ANIMATE_POSITION, this.dataHelper.cleanPosition(options));
        var currentPosition = this.getPosition(); // longitude offset for shortest arc

        var tOffset = getShortestArc(currentPosition.longitude, cleanPosition.longitude);
        animProperties.longitude = {
          start: currentPosition.longitude,
          end: currentPosition.longitude + tOffset
        };
        animProperties.latitude = {
          start: currentPosition.latitude,
          end: cleanPosition.latitude
        };
        duration = this.dataHelper.speedToDuration(options.speed, getAngle(currentPosition, cleanPosition));
      } // clean/filter zoom and compute duration


      if (zoomProvided) {
        var dZoom = Math.abs(options.zoom - this.getZoomLevel());
        animProperties.zoom = {
          start: this.getZoomLevel(),
          end: options.zoom
        };

        if (!duration) {
          // if animating zoom only and a speed is given, use an arbitrary PI/4 to compute the duration
          duration = this.dataHelper.speedToDuration(options.speed, Math.PI / 4 * dZoom / 100);
        }
      } // if no animation needed


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
        duration: Math.max(ANIMATION_MIN_DURATION, duration),
        easing: 'inOutSine',
        onTick: function onTick(properties) {
          if (positionProvided) {
            _this6.rotate(properties);
          }

          if (zoomProvided) {
            _this6.zoom(properties.zoom);
          }
        }
      });
      this.prop.animationPromise.then(function () {
        _this6.prop.animationPromise = null;

        _this6.resetIdleTimer();
      });
      return this.prop.animationPromise;
    }
    /**
     * @summary Stops the ongoing animation
     * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
     * @returns {Promise} Resolved when the animation has ben cancelled
     */
    ;

    _proto.stopAnimation = function stopAnimation() {
      if (this.prop.animationPromise) {
        this.prop.animationPromise.cancel();
        return this.prop.animationPromise;
      } else {
        return Promise.resolve();
      }
    }
    /**
     * @summary Zooms to a specific level between `max_fov` and `min_fov`
     * @param {number} level - new zoom level from 0 to 100
     * @fires PSV.zoom-updated
     */
    ;

    _proto.zoom = function zoom(level) {
      this.dynamics.zoom.setValue(level);
    }
    /**
     * @summary Increases the zoom level
     * @param {number} [step=1]
     */
    ;

    _proto.zoomIn = function zoomIn(step) {
      if (step === void 0) {
        step = 1;
      }

      this.dynamics.zoom.step(step);
    }
    /**
     * @summary Decreases the zoom level
     * @param {number} [step=1]
     */
    ;

    _proto.zoomOut = function zoomOut(step) {
      if (step === void 0) {
        step = 1;
      }

      this.dynamics.zoom.step(-step);
    }
    /**
     * @summary Resizes the viewer
     * @param {PSV.CssSize} size
     */
    ;

    _proto.resize = function resize(size) {
      var _this7 = this;

      ['width', 'height'].forEach(function (dim) {
        if (size && size[dim]) {
          if (/^[0-9.]+$/.test(size[dim])) {
            size[dim] += 'px';
          }

          _this7.parent.style[dim] = size[dim];
        }
      });
      this.autoSize();
    }
    /**
     * @summary Enters the fullscreen mode
     * @fires PSV.fullscreen-updated
     */
    ;

    _proto.enterFullscreen = function enterFullscreen() {
      if (SYSTEM.fullscreenEvent) {
        requestFullscreen(this.container);
      } else {
        this.container.classList.add('psv-container--fullscreen');
        this.autoSize();

        this.eventsHandler.__fullscreenToggled(true);
      }
    }
    /**
     * @summary Exits the fullscreen mode
     * @fires PSV.fullscreen-updated
     */
    ;

    _proto.exitFullscreen = function exitFullscreen$1() {
      if (this.isFullscreenEnabled()) {
        if (SYSTEM.fullscreenEvent) {
          exitFullscreen();
        } else {
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
    ;

    _proto.toggleFullscreen = function toggleFullscreen() {
      if (!this.isFullscreenEnabled()) {
        this.enterFullscreen();
      } else {
        this.exitFullscreen();
      }
    }
    /**
     * @summary Enables the keyboard controls (done automatically when entering fullscreen)
     */
    ;

    _proto.startKeyboardControl = function startKeyboardControl() {
      this.eventsHandler.enableKeyboard();
    }
    /**
     * @summary Disables the keyboard controls (done automatically when exiting fullscreen)
     */
    ;

    _proto.stopKeyboardControl = function stopKeyboardControl() {
      this.eventsHandler.disableKeyboard();
    }
    /**
     * @summary Subscribes to events on objects in the scene
     * @param {string} userDataKey - only objects with the following `userData` will be emitted
     * @param {EventListener} listener - must implement `handleEvent`
     * @return {function} call to stop the subscription
     * @package
     */
    ;

    _proto.observeObjects = function observeObjects(userDataKey, listener) {
      var _this8 = this;

      this.prop.objectsObservers[userDataKey] = {
        listener: listener
      };
      return function () {
        delete _this8.prop.objectsObservers[userDataKey];
      };
    }
    /**
     * @summary Stops all current animations
     * @returns {Promise}
     * @package
     */
    ;

    _proto.__stopAll = function __stopAll() {
      this.trigger(EVENTS.STOP_ALL);
      this.disableIdleTimer();
      this.stopAutorotate();
      return this.stopAnimation();
    }
    /**
     * @summary Recomputes dynamics speeds
     * @private
     */
    ;

    _proto.__updateSpeeds = function __updateSpeeds() {
      this.dynamics.zoom.setSpeed(this.config.zoomSpeed * 50);
      this.dynamics.position.setSpeed(three.MathUtils.degToRad(this.config.moveSpeed * 50));
    };

    return Viewer;
  }(uevent.EventEmitter);

  exports.AbstractAdapter = AbstractAdapter;
  exports.AbstractButton = AbstractButton;
  exports.AbstractComponent = AbstractComponent;
  exports.AbstractPlugin = AbstractPlugin;
  exports.CONSTANTS = constants;
  exports.DEFAULTS = DEFAULTS;
  exports.EquirectangularAdapter = EquirectangularAdapter;
  exports.PSVError = PSVError;
  exports.SYSTEM = SYSTEM;
  exports.Viewer = Viewer;
  exports.registerButton = registerButton;
  exports.utils = index;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=photo-sphere-viewer.js.map
