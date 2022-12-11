/*!
* Photo Sphere Viewer 4.8.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.GyroscopePlugin = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

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
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.GyroscopePlugin
   * @constant
   */
  var EVENTS = {
    /**
     * @event gyroscope-updated
     * @memberof PSV.plugins.GyroscopePlugin
     * @summary Triggered when the gyroscope mode is enabled/disabled
     * @param {boolean} enabled
     */
    GYROSCOPE_UPDATED: 'gyroscope-updated'
  };

  var _zee = new three.Vector3(0, 0, 1);

  var _euler = new three.Euler();

  var _q0 = new three.Quaternion();

  var _q1 = new three.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // - PI/2 around the x-axis

  /**
   * Copied from three.js examples before deletion in r134
   * (deleted because of constructors/OS inconsistencies)
   * @private
   */


  var DeviceOrientationControls = function DeviceOrientationControls(object) {
    if (window.isSecureContext === false) {
      console.error('THREE.DeviceOrientationControls: DeviceOrientationEvent is only available in secure contexts (https)');
    }

    var scope = this;
    var EPS = 0.000001;
    var lastQuaternion = new three.Quaternion();
    this.object = object;
    this.object.rotation.reorder('YXZ');
    this.enabled = true;
    this.deviceOrientation = {};
    this.screenOrientation = 0;
    this.alphaOffset = 0; // radians

    var onDeviceOrientationChangeEvent = function onDeviceOrientationChangeEvent(event) {
      scope.deviceOrientation = event;
    };

    var onScreenOrientationChangeEvent = function onScreenOrientationChangeEvent() {
      scope.screenOrientation = window.orientation || 0;
    }; // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''


    var setObjectQuaternion = function setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
      _euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us


      quaternion.setFromEuler(_euler); // orient the device

      quaternion.multiply(_q1); // camera looks out the back of the device, not the top

      quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient)); // adjust for screen orientation
    };

    this.connect = function () {
      onScreenOrientationChangeEvent(); // run once on load
      // iOS 13+

      if (window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
        window.DeviceOrientationEvent.requestPermission().then(function (response) {
          if (response == 'granted') {
            window.addEventListener('orientationchange', onScreenOrientationChangeEvent);
            window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent);
          }
        }).catch(function (error) {
          console.error('THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error);
        });
      } else {
        window.addEventListener('orientationchange', onScreenOrientationChangeEvent);
        window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent);
      }

      scope.enabled = true;
    };

    this.disconnect = function () {
      window.removeEventListener('orientationchange', onScreenOrientationChangeEvent);
      window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent);
      scope.enabled = false;
    };

    this.update = function () {
      if (scope.enabled === false) return;
      var device = scope.deviceOrientation;

      if (device) {
        var alpha = device.alpha ? three.MathUtils.degToRad(device.alpha) + scope.alphaOffset : 0; // Z

        var beta = device.beta ? three.MathUtils.degToRad(device.beta) : 0; // X'

        var gamma = device.gamma ? three.MathUtils.degToRad(device.gamma) : 0; // Y''

        var orient = scope.screenOrientation ? three.MathUtils.degToRad(scope.screenOrientation) : 0; // O

        setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);

        if (8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
          lastQuaternion.copy(scope.object.quaternion);
        }
      }
    };

    this.dispose = function () {
      scope.disconnect();
    };

    this.connect();
  };

  var compass = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M50 0a50 50 0 1 0 0 100A50 50 0 0 0 50 0zm0 88.81a38.86 38.86 0 0 1-38.81-38.8 38.86 38.86 0 0 1 38.8-38.82A38.86 38.86 0 0 1 88.82 50 38.87 38.87 0 0 1 50 88.81z\"/><path fill=\"currentColor\" d=\"M72.07 25.9L40.25 41.06 27.92 74.12l31.82-15.18v-.01l12.32-33.03zM57.84 54.4L44.9 42.58l21.1-10.06-8.17 21.9z\"/><!--Created by iconoci from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar gyroscope button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var GyroscopeButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(GyroscopeButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function GyroscopeButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-gyroscope-button', true) || this;
      /**
       * @type {PSV.plugins.GyroscopePlugin}
       * @readonly
       * @private
       */

      _this.plugin = _this.psv.getPlugin('gyroscope');

      if (_this.plugin) {
        _this.plugin.on(EVENTS.GYROSCOPE_UPDATED, _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = GyroscopeButton.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.plugin.off(EVENTS.GYROSCOPE_UPDATED, this);
      }

      delete this.plugin;

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return !this.plugin ? false : {
        initial: false,
        promise: this.plugin.prop.isSupported
      };
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      if (e.type === EVENTS.GYROSCOPE_UPDATED) {
        this.toggleActive(e.args[0]);
      }
    }
    /**
     * @override
     * @description Toggles gyroscope control
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.toggle();
    };

    return GyroscopeButton;
  }(photoSphereViewer.AbstractButton);
  GyroscopeButton.id = 'gyroscope';
  GyroscopeButton.icon = compass;

  /**
   * @typedef {Object} PSV.plugins.GyroscopePlugin.Options
   * @property {boolean} [touchmove=true] - allows to pan horizontally when the gyroscope is enabled (requires global `mousemove=true`)
   * @property {boolean} [absolutePosition=false] - when true the view will ignore the current direction when enabling gyroscope control
   * @property {'smooth' | 'fast'} [moveMode='smooth'] - How the gyroscope data is used to rotate the panorama.
   */
  // add gyroscope button

  photoSphereViewer.DEFAULTS.lang[GyroscopeButton.id] = 'Gyroscope';
  photoSphereViewer.registerButton(GyroscopeButton, 'caption:right');
  var direction = new three.Vector3();
  /**
   * @summary Adds gyroscope controls on mobile devices
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var GyroscopePlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(GyroscopePlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.GyroscopePlugin.Options} options
     */
    function GyroscopePlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {Object}
       * @private
       * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
       * @property {number} alphaOffset - current alpha offset for gyroscope controls
       * @property {boolean} enabled
       * @property {boolean} config_moveInertia - original config "moveInertia"
       */

      _this.prop = {
        isSupported: _this.__checkSupport(),
        alphaOffset: 0,
        enabled: false,
        config_moveInertia: true
      };
      /**
       * @member {PSV.plugins.GyroscopePlugin.Options}
       * @private
       */

      _this.config = _extends({
        touchmove: true,
        absolutePosition: false,
        moveMode: 'smooth'
      }, options);
      /**
       * @member {DeviceOrientationControls}
       * @private
       */

      _this.controls = null;
      return _this;
    }
    /**
     * @package
     */


    var _proto = GyroscopePlugin.prototype;

    _proto.init = function init() {
      _AbstractPlugin.prototype.init.call(this);

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.STOP_ALL, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_ROTATE, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.STOP_ALL, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_ROTATE, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);
      this.stop();
      delete this.controls;

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.STOP_ALL:
          this.stop();
          break;

        case photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER:
          this.__onBeforeRender();

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.BEFORE_ROTATE:
          this.__onBeforeRotate(e);

          break;
      }
    }
    /**
     * @summary Checks if the gyroscope is enabled
     * @returns {boolean}
     */
    ;

    _proto.isEnabled = function isEnabled() {
      return this.prop.enabled;
    }
    /**
     * @summary Enables the gyroscope navigation if available
     * @returns {Promise}
     * @fires PSV.plugins.GyroscopePlugin.gyroscope-updated
     * @throws {PSV.PSVError} if the gyroscope API is not available/granted
     */
    ;

    _proto.start = function start() {
      var _this2 = this;

      return this.prop.isSupported.then(function (supported) {
        if (supported) {
          return _this2.__requestPermission();
        } else {
          photoSphereViewer.utils.logWarn('gyroscope not available');
          return Promise.reject();
        }
      }).then(function (granted) {
        if (granted) {
          return Promise.resolve();
        } else {
          photoSphereViewer.utils.logWarn('gyroscope not allowed');
          return Promise.reject();
        }
      }).then(function () {
        _this2.psv.__stopAll(); // disable inertia


        _this2.prop.config_moveInertia = _this2.psv.config.moveInertia;
        _this2.psv.config.moveInertia = false; // enable gyro controls

        if (!_this2.controls) {
          _this2.controls = new DeviceOrientationControls(new three.Object3D());
        } else {
          _this2.controls.connect();
        } // force reset


        _this2.controls.deviceOrientation = null;
        _this2.controls.screenOrientation = 0;
        _this2.controls.alphaOffset = 0;
        _this2.prop.alphaOffset = _this2.config.absolutePosition ? 0 : null;
        _this2.prop.enabled = true;

        _this2.trigger(EVENTS.GYROSCOPE_UPDATED, true);
      });
    }
    /**
     * @summary Disables the gyroscope navigation
     * @fires PSV.plugins.GyroscopePlugin.gyroscope-updated
     */
    ;

    _proto.stop = function stop() {
      if (this.isEnabled()) {
        this.controls.disconnect();
        this.prop.enabled = false;
        this.psv.config.moveInertia = this.prop.config_moveInertia;
        this.trigger(EVENTS.GYROSCOPE_UPDATED, false);
        this.psv.resetIdleTimer();
      }
    }
    /**
     * @summary Enables or disables the gyroscope navigation
     */
    ;

    _proto.toggle = function toggle() {
      if (this.isEnabled()) {
        this.stop();
      } else {
        this.start();
      }
    }
    /**
     * @summary Handles gyro movements
     * @private
     */
    ;

    _proto.__onBeforeRender = function __onBeforeRender() {
      if (!this.isEnabled()) {
        return;
      }

      if (!this.controls.deviceOrientation) {
        return;
      }

      var position = this.psv.getPosition(); // on first run compute the offset depending on the current viewer position and device orientation

      if (this.prop.alphaOffset === null) {
        this.controls.update();
        this.controls.object.getWorldDirection(direction);
        var sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(direction);
        this.prop.alphaOffset = sphericalCoords.longitude - position.longitude;
      } else {
        this.controls.alphaOffset = this.prop.alphaOffset;
        this.controls.update();
        this.controls.object.getWorldDirection(direction);

        var _sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(direction);

        var target = {
          longitude: _sphericalCoords.longitude,
          latitude: -_sphericalCoords.latitude
        }; // having a slow speed on smalls movements allows to absorb the device/hand vibrations

        var step = this.config.moveMode === 'smooth' ? 3 : 10;
        this.psv.dynamics.position.goto(target, photoSphereViewer.utils.getAngle(position, target) < 0.01 ? 1 : step);
      }
    }
    /**
     * @summary Intercepts moves and offsets the alpha angle
     * @param {external:uEvent.Event} e
     * @private
     */
    ;

    _proto.__onBeforeRotate = function __onBeforeRotate(e) {
      if (this.isEnabled()) {
        e.preventDefault();

        if (this.config.touchmove) {
          this.prop.alphaOffset -= e.args[0].longitude - this.psv.getPosition().longitude;
        }
      }
    }
    /**
     * @summary Detects if device orientation is supported
     * @returns {Promise<boolean>}
     * @private
     */
    ;

    _proto.__checkSupport = function __checkSupport() {
      if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
        return Promise.resolve(true);
      } else if ('DeviceOrientationEvent' in window) {
        return new Promise(function (resolve) {
          var listener = function listener(e) {
            resolve(e && e.alpha !== null && !isNaN(e.alpha));
            window.removeEventListener('deviceorientation', listener);
          };

          window.addEventListener('deviceorientation', listener, false);
          setTimeout(listener, 10000);
        });
      } else {
        return Promise.resolve(false);
      }
    }
    /**
     * @summary Request permission to the motion API
     * @returns {Promise<boolean>}
     * @private
     */
    ;

    _proto.__requestPermission = function __requestPermission() {
      if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
        return DeviceOrientationEvent.requestPermission().then(function (response) {
          return response === 'granted';
        }).catch(function () {
          return false;
        });
      } else {
        return Promise.resolve(true);
      }
    };

    return GyroscopePlugin;
  }(photoSphereViewer.AbstractPlugin);
  GyroscopePlugin.id = 'gyroscope';
  GyroscopePlugin.EVENTS = EVENTS;

  exports.EVENTS = EVENTS;
  exports.GyroscopePlugin = GyroscopePlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=gyroscope.js.map
