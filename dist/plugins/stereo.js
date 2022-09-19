/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('photo-sphere-viewer'), require('three')) :
  typeof define === 'function' && define.amd ? define(['exports', 'photo-sphere-viewer', 'three'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.StereoPlugin = {}), global.PhotoSphereViewer, global.THREE));
})(this, (function (exports, photoSphereViewer, three) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
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
   * @memberof PSV.plugins.StereoPlugin
   * @constant
   */
  var EVENTS = {
    /**
     * @event stereo-updated
     * @memberof PSV.plugins.StereoPlugin
     * @summary Triggered when the stereo view is enabled/disabled
     * @param {boolean} enabled
     */
    STEREO_UPDATED: 'stereo-updated'
  };
  /**
   * @type {string}
   * @constant
   * @private
   */

  var ID_OVERLAY_PLEASE_ROTATE = 'pleaseRotate';

  var mobileRotateIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M66.7 19a14 14 0 0 1 13.8 12.1l-3.9-2.7c-.5-.3-1.1-.2-1.4.3-.3.5-.2 1.1.3 1.4l5.7 3.9.6.2c.3 0 .6-.2.8-.4l3.9-5.7c.3-.5.2-1.1-.3-1.4-.5-.3-1.1-.2-1.4.3l-2.4 3.5A16 16 0 0 0 66.7 17c-.6 0-1 .4-1 1s.4 1 1 1zM25 15h10c.6 0 1-.4 1-1s-.4-1-1-1H25c-.6 0-1 .4-1 1s.4 1 1 1zm-6.9 30H16l-2 .2a1 1 0 0 0-.8 1.2c.1.5.5.8 1 .8h.2l1.7-.2h2.1c.6 0 1-.4 1-1s-.5-1-1.1-1zm10 0h-4c-.6 0-1 .4-1 1s.4 1 1 1h4c.6 0 1-.4 1-1s-.4-1-1-1zM84 45H55V16A11 11 0 0 0 44 5H16A11 11 0 0 0 5 16v68a11 11 0 0 0 11 11h68a11 11 0 0 0 11-11V56a11 11 0 0 0-11-11zM16 93c-5 0-9-4-9-9V53.2c.3-.1.6-.3.7-.6a9.8 9.8 0 0 1 2-3c.4-.4.4-1 0-1.4a1 1 0 0 0-1.4 0l-1.2 1.5V16c0-5 4-9 9-9h28c5 0 9 4 9 9v68c0 5-4 9-9 9H16zm77-9c0 5-4 9-9 9H50.3c2.8-2 4.7-5.3 4.7-9V47h29c5 0 9 4 9 9v28zM38.1 45h-4c-.6 0-1 .4-1 1s.4 1 1 1h4c.6 0 1-.4 1-1s-.5-1-1-1zm9.9 0h-4c-.6 0-1 .4-1 1s.4 1 1 1h4c.6 0 1-.4 1-1s-.4-1-1-1zm38 19c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1s1-.4 1-1V65c0-.6-.4-1-1-1z\"/><!--Created by Anthony Bresset from the Noun Project--></svg>\n";

  var stereo = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -2 16 16\"><path fill=\"currentColor\" d=\"M13.104 0H2.896C2.332 0 1 .392 1 .875h14C15 .392 13.668 0 13.104 0zM15 1H1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3.534a2 2 0 0 0 1.821-1.172l1.19-2.618a.5.5 0 0 1 .91 0l1.19 2.618A2 2 0 0 0 11.466 11H15a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM4 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z\"/><!--Created by Idevã Batista from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar stereo button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var StereoButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(StereoButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function StereoButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-stereo-button', true) || this;
      /**
       * @type {PSV.plugins.StereoPlugin}
       * @private
       * @readonly
       */

      _this.plugin = _this.psv.getPlugin('stereo');

      if (_this.plugin) {
        _this.plugin.on(EVENTS.STEREO_UPDATED, _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = StereoButton.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.plugin.off(EVENTS.STEREO_UPDATED, this);
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
      if (e.type === EVENTS.STEREO_UPDATED) {
        this.toggleActive(e.args[0]);
      }
    }
    /**
     * @override
     * @description Toggles stereo control
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.toggle();
    };

    return StereoButton;
  }(photoSphereViewer.AbstractButton);
  StereoButton.id = 'stereo';
  StereoButton.icon = stereo;

  /**
   * Copied from three.js examples
   * @private
   */

  var StereoEffect = function StereoEffect(renderer) {
    var _stereo = new three.StereoCamera();

    _stereo.aspect = 0.5;
    var size = new three.Vector2();

    this.setEyeSeparation = function (eyeSep) {
      _stereo.eyeSep = eyeSep;
    };

    this.setSize = function (width, height) {
      renderer.setSize(width, height);
    };

    this.render = function (scene, camera) {
      scene.updateMatrixWorld();
      if (camera.parent === null) camera.updateMatrixWorld();

      _stereo.update(camera);

      renderer.getSize(size);
      if (renderer.autoClear) renderer.clear();
      renderer.setScissorTest(true);
      renderer.setScissor(0, 0, size.width / 2, size.height);
      renderer.setViewport(0, 0, size.width / 2, size.height);
      renderer.render(scene, _stereo.cameraL);
      renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
      renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
      renderer.render(scene, _stereo.cameraR);
      renderer.setScissorTest(false);
    };
  };

  /**
   * @external NoSleep
   * @description {@link https://github.com/richtr/NoSleep.js}
   */
  // add stereo button

  photoSphereViewer.DEFAULTS.lang[StereoButton.id] = 'Stereo view';
  photoSphereViewer.registerButton(StereoButton, 'caption:right'); // other lang strings

  photoSphereViewer.DEFAULTS.lang.stereoNotification = 'Tap anywhere to exit stereo view.';
  photoSphereViewer.DEFAULTS.lang.pleaseRotate = ['Please rotate your device', '(or tap to continue)'];
  /**
   * @summary Adds stereo view on mobile devices
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var StereoPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(StereoPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     */
    function StereoPlugin(psv) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @type {PSV.plugins.GyroscopePlugin}
       * @readonly
       * @private
       */

      _this.gyroscope = null;
      /**
       * @type {PSV.plugins.MarkersPlugin}
       * @readonly
       * @private
       */

      _this.markers = null;
      /**
       * @type {PSV.plugins.CompassPlugin}
       * @readonly
       * @private
       */

      _this.compass = null;
      /**
       * @member {Object}
       * @protected
       * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
       * @property {external:THREE.WebGLRenderer} renderer - original renderer
       * @property {external:NoSleep} noSleep
       * @property {WakeLockSentinel} wakeLock
       */

      _this.prop = {
        isSupported: false,
        renderer: null,
        noSleep: null,
        wakeLock: null
      };
      return _this;
    }
    /**
     * @package
     */


    var _proto = StereoPlugin.prototype;

    _proto.init = function init() {
      _AbstractPlugin.prototype.init.call(this);

      this.markers = this.psv.getPlugin('markers');
      this.compass = this.psv.getPlugin('compass');
      this.gyroscope = this.psv.getPlugin('gyroscope');

      if (!this.gyroscope) {
        throw new photoSphereViewer.PSVError('Stereo plugin requires the Gyroscope plugin');
      }

      this.prop.isSupported = this.gyroscope.prop.isSupported;
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.STOP_ALL, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.STOP_ALL, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      this.stop();
      delete this.markers;
      delete this.compass;
      delete this.gyroscope;

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.STOP_ALL:
        case photoSphereViewer.CONSTANTS.EVENTS.CLICK:
          this.stop();
          break;
      }
    }
    /**
     * @summary Checks if the stereo view is enabled
     * @returns {boolean}
     */
    ;

    _proto.isEnabled = function isEnabled() {
      return !!this.prop.renderer;
    }
    /**
     * @summary Enables the stereo view
     * @description
     *  - enables NoSleep.js
     *  - enables full screen
     *  - starts gyroscope controle
     *  - hides markers, navbar and panel
     *  - instanciate {@link external:THREE.StereoEffect}
     * @returns {Promise}
     * @fires PSV.plugins.StereoPlugin.stereo-updated
     * @throws {PSV.PSVError} if the gyroscope API is not available/granted
     */
    ;

    _proto.start = function start() {
      var _this2 = this;

      // Need to be in the main event queue
      this.psv.enterFullscreen();

      this.__startNoSleep();

      this.__lockOrientation();

      return this.gyroscope.start().then(function () {
        var _this2$markers, _this2$compass;

        // switch renderer
        _this2.prop.renderer = _this2.psv.renderer.renderer;
        _this2.psv.renderer.renderer = new StereoEffect(_this2.psv.renderer.renderer);

        _this2.psv.needsUpdate();

        (_this2$markers = _this2.markers) == null ? void 0 : _this2$markers.hide();
        (_this2$compass = _this2.compass) == null ? void 0 : _this2$compass.hide();

        _this2.psv.navbar.hide();

        _this2.psv.panel.hide();

        _this2.trigger(EVENTS.STEREO_UPDATED, true);

        _this2.psv.notification.show({
          content: _this2.psv.config.lang.stereoNotification,
          timeout: 3000
        });
      }, function () {
        _this2.__unlockOrientation();

        _this2.__stopNoSleep();

        _this2.psv.exitFullscreen();
      });
    }
    /**
     * @summary Disables the stereo view
     * @fires PSV.plugins.StereoPlugin.stereo-updated
     */
    ;

    _proto.stop = function stop() {
      if (this.isEnabled()) {
        var _this$markers, _this$compass;

        this.psv.renderer.renderer = this.prop.renderer;
        this.prop.renderer = null;
        this.psv.needsUpdate();
        (_this$markers = this.markers) == null ? void 0 : _this$markers.show();
        (_this$compass = this.compass) == null ? void 0 : _this$compass.show();
        this.psv.navbar.show();

        this.__unlockOrientation();

        this.__stopNoSleep();

        this.psv.exitFullscreen();
        this.gyroscope.stop();
        this.trigger(EVENTS.STEREO_UPDATED, false);
      }
    }
    /**
     * @summary Enables or disables the stereo view
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
     * @summary Enables WakeLock or NoSleep.js
     * @private
     */
    ;

    _proto.__startNoSleep = function __startNoSleep() {
      var _this3 = this;

      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(function (wakeLock) {
          _this3.prop.wakeLock = wakeLock;
        }).catch(function () {
          return photoSphereViewer.utils.logWarn('Cannot acquire WakeLock');
        });
      } else if ('NoSleep' in window) {
        if (!this.prop.noSleep) {
          this.prop.noSleep = new window.NoSleep();
        }

        this.prop.noSleep.enable();
      } else {
        photoSphereViewer.utils.logWarn('NoSleep is not available');
      }
    }
    /**
     * @summary Disables WakeLock or NoSleep.js
     * @private
     */
    ;

    _proto.__stopNoSleep = function __stopNoSleep() {
      if (this.prop.wakeLock) {
        this.prop.wakeLock.release();
        this.prop.wakeLock = null;
      } else if (this.prop.noSleep) {
        this.prop.noSleep.disable();
      }
    }
    /**
     * @summary Tries to lock the device in landscape or display a message
     * @private
     */
    ;

    _proto.__lockOrientation = function __lockOrientation() {
      var _this4 = this,
          _window$screen;

      var displayRotateMessageTimeout;

      var displayRotateMessage = function displayRotateMessage() {
        if (window.innerHeight > window.innerWidth) {
          _this4.psv.overlay.show({
            id: ID_OVERLAY_PLEASE_ROTATE,
            image: mobileRotateIcon,
            text: _this4.psv.config.lang.pleaseRotate[0],
            subtext: _this4.psv.config.lang.pleaseRotate[1]
          });
        }

        if (displayRotateMessageTimeout) {
          clearTimeout(displayRotateMessageTimeout);
          displayRotateMessageTimeout = null;
        }
      };

      if ((_window$screen = window.screen) != null && _window$screen.orientation) {
        window.screen.orientation.lock('landscape').then(null, function () {
          return displayRotateMessage();
        });
        displayRotateMessageTimeout = setTimeout(function () {
          return displayRotateMessage();
        }, 500);
      } else {
        displayRotateMessage();
      }
    }
    /**
     * @summary Unlock the device orientation
     * @private
     */
    ;

    _proto.__unlockOrientation = function __unlockOrientation() {
      var _window$screen2;

      if ((_window$screen2 = window.screen) != null && _window$screen2.orientation) {
        window.screen.orientation.unlock();
      } else {
        this.psv.overlay.hide(ID_OVERLAY_PLEASE_ROTATE);
      }
    };

    return StereoPlugin;
  }(photoSphereViewer.AbstractPlugin);
  StereoPlugin.id = 'stereo';
  StereoPlugin.EVENTS = EVENTS;

  exports.EVENTS = EVENTS;
  exports.StereoPlugin = StereoPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=stereo.js.map
