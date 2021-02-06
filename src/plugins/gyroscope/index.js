import * as THREE from 'three';
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls';
import { AbstractPlugin, CONSTANTS, DEFAULTS, registerButton, utils } from '../..';
import { GyroscopeButton } from './GyroscopeButton';


/**
 * @typedef {Object} PSV.plugins.GyroscopePlugin.Options
 * @property {boolean} [touchmove=true] - allows to pan horizontally when the gyroscope is enabled (requires global `mousemove=true`)
 * @property {boolean} [absolutePosition=false] - when true the view will ignore the current direction when enabling gyroscope control
 */


// add gyroscope button
DEFAULTS.navbar.splice(-1, 0, GyroscopeButton.id);
DEFAULTS.lang[GyroscopeButton.id] = 'Gyroscope';
registerButton(GyroscopeButton);

const direction = new THREE.Vector3();

/**
 * @summary Adds gyroscope controls on mobile devices
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class GyroscopePlugin extends AbstractPlugin {

  static id = 'gyroscope';

  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.GyroscopePlugin
   * @constant
   */
  static EVENTS = {
    /**
     * @event gyroscope-updated
     * @memberof PSV.plugins.GyroscopePlugin
     * @summary Triggered when the gyroscope mode is enabled/disabled
     * @param {boolean} enabled
     */
    GYROSCOPE_UPDATED: 'gyroscope-updated',
  };

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.GyroscopePlugin.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {Object}
     * @private
     * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
     * @property {number} alphaOffset - current alpha offset for gyroscope controls
     * @property {boolean} enabled
     * @property {boolean} config_moveInertia - original config "moveInertia"
     */
    this.prop = {
      isSupported       : this.__checkSupport(),
      alphaOffset       : 0,
      enabled           : false,
      config_moveInertia: true,
    };

    /**
     * @member {PSV.plugins.GyroscopePlugin.Options}
     * @private
     */
    this.config = {
      touchmove       : true,
      absolutePosition: false,
      ...options,
    };

    /**
     * @member {external:THREE.DeviceOrientationControls}
     * @private
     */
    this.controls = null;

    this.psv.on(CONSTANTS.EVENTS.STOP_ALL, this);
    this.psv.on(CONSTANTS.EVENTS.BEFORE_ROTATE, this);
    this.psv.on(CONSTANTS.EVENTS.BEFORE_RENDER, this);
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.STOP_ALL, this);
    this.psv.off(CONSTANTS.EVENTS.BEFORE_ROTATE, this);
    this.psv.off(CONSTANTS.EVENTS.BEFORE_RENDER, this);

    this.stop();

    delete this.controls;
    delete this.prop;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    switch (e.type) {
      case CONSTANTS.EVENTS.STOP_ALL:
        this.stop();
        break;
      case CONSTANTS.EVENTS.BEFORE_RENDER:
        this.__onBeforeRender();
        break;
      case CONSTANTS.EVENTS.BEFORE_ROTATE:
        this.__onBeforeRotate(e);
        break;
      default:
        break;
    }
  }

  /**
   * @summary Checks if the gyroscope is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.prop.enabled;
  }

  /**
   * @summary Enables the gyroscope navigation if available
   * @returns {Promise}
   * @fires PSV.plugins.GyroscopePlugin.gyroscope-updated
   * @throws {PSV.PSVError} if the gyroscope API is not available/granted
   */
  start() {
    return this.prop.isSupported
      .then((supported) => {
        if (supported) {
          return this.__requestPermission();
        }
        else {
          utils.logWarn('gyroscope not available');
          return Promise.reject();
        }
      })
      .then((granted) => {
        if (granted) {
          return Promise.resolve();
        }
        else {
          utils.logWarn('gyroscope not allowed');
          return Promise.reject();
        }
      })
      .then(() => {
        this.psv.__stopAll();

        // disable inertia
        this.prop.config_moveInertia = this.psv.config.moveInertia;
        this.psv.config.moveInertia = false;

        // enable gyro controls
        if (!this.controls) {
          this.controls = new DeviceOrientationControls(new THREE.Object3D());
        }
        else {
          this.controls.connect();
        }

        // force reset
        this.controls.deviceOrientation = null;
        this.controls.screenOrientation = 0;
        this.controls.alphaOffset = 0;

        this.prop.alphaOffset = this.config.absolutePosition ? 0 : null;
        this.prop.enabled = true;

        this.trigger(GyroscopePlugin.EVENTS.GYROSCOPE_UPDATED, true);
      });
  }

  /**
   * @summary Disables the gyroscope navigation
   * @fires PSV.plugins.GyroscopePlugin.gyroscope-updated
   */
  stop() {
    if (this.isEnabled()) {
      this.controls.disconnect();

      this.prop.enabled = false;
      this.psv.config.moveInertia = this.prop.config_moveInertia;

      this.trigger(GyroscopePlugin.EVENTS.GYROSCOPE_UPDATED, false);
    }
  }

  /**
   * @summary Enables or disables the gyroscope navigation
   */
  toggle() {
    if (this.isEnabled()) {
      this.stop();
    }
    else {
      this.start();
    }
  }

  /**
   * @summary Handles gyro movements
   * @private
   */
  __onBeforeRender() {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.controls.deviceOrientation) {
      return;
    }

    // on first run compute the offset depending on the current viewer position and device orientation
    if (this.prop.alphaOffset === null) {
      this.controls.update();
      this.controls.object.getWorldDirection(direction);

      const sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(direction);
      this.prop.alphaOffset = sphericalCoords.longitude - this.psv.getPosition().longitude;
    }
    else {
      this.controls.alphaOffset = this.prop.alphaOffset;
      this.controls.update();
      this.controls.object.getWorldDirection(direction);

      const sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(direction);
      // TODO use dynamic goto for smooth movement
      this.psv.dynamics.position.setValue({
        longitude: sphericalCoords.longitude,
        latitude : -sphericalCoords.latitude,
      });
    }
  }

  /**
   * @summary Intercepts moves and offsets the alpha angle
   * @param {external:uEvent.Event} e
   * @private
   */
  __onBeforeRotate(e) {
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
  __checkSupport() {
    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
      return Promise.resolve(true);
    }
    else if ('DeviceOrientationEvent' in window) {
      return new Promise((resolve) => {
        const listener = (e) => {
          resolve(e && e.alpha !== null && !isNaN(e.alpha));

          window.removeEventListener('deviceorientation', listener);
        };

        window.addEventListener('deviceorientation', listener, false);

        // after 2 secs, auto-reject the promise
        setTimeout(listener, 2000);
      });
    }
    else {
      return Promise.resolve(false);
    }
  }

  /**
   * @summary Request permission to the motion API
   * @returns {Promise<boolean>}
   * @private
   */
  __requestPermission() {
    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
      return DeviceOrientationEvent.requestPermission()
        .then(response => response === 'granted')
        .catch(() => false);
    }
    else {
      return Promise.resolve(true);
    }
  }

}
