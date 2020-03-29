import { AbstractPlugin, CONSTANTS, DEFAULTS, registerButton, utils } from 'photo-sphere-viewer';
import * as THREE from 'three';
import 'three/examples/js/controls/DeviceOrientationControls';
import { GyroscopeButton } from './GyroscopeButton';

/**
 * @typedef {Object} external:THREE.DeviceOrientationControls
 * @summary {@link https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/DeviceOrientationControls.js}
 */


// add gyroscope button
DEFAULTS.navbar.splice(-1, 0, GyroscopeButton.id);
DEFAULTS.lang[GyroscopeButton.id] = 'Gyroscope';
registerButton(GyroscopeButton);


/**
 * @summary Adds gyroscope controls on mobile devices
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class GyroscopePlugin extends AbstractPlugin {

  static id = 'gyroscope';

  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.GyroscopePlugin
   * @constant
   */
  static EVENTS = {
    GYROSCOPE_UPDATED: 'gyroscope-updated',
  };

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @member {Object}
     * @private
     * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
     * @property {number} alphaOffset - current alpha offset for gyroscope controls
     * @property {Function} orientationCb - update callback of the device orientation
     * @property {boolean} config_moveInertia - original config "moveInertia"
     */
    this.prop = {
      isSupported       : this.__checkSupport(),
      alphaOffset       : 0,
      orientationCb     : null,
      config_moveInertia: true,
    };

    /**
     * @member {external:THREE.DeviceOrientationControls}
     * @private
     */
    this.controls = null;

    this.psv.on(CONSTANTS.EVENTS.STOP_ALL, this);
    this.psv.on(CONSTANTS.EVENTS.BEFORE_ROTATE, this);
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.STOP_ALL, this);
    this.psv.off(CONSTANTS.EVENTS.BEFORE_ROTATE, this);

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
      case CONSTANTS.EVENTS.BEFORE_ROTATE:
        this.__onRotate(e);
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
    return !!this.prop.orientationCb;
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

        this.__configure();

        /**
         * @event gyroscope-updated
         * @memberof PSV.plugins.GyroscopePlugin
         * @summary Triggered when the gyroscope mode is enabled/disabled
         * @param {boolean} enabled
         */
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

      this.psv.off(CONSTANTS.EVENTS.BEFORE_RENDER, this.prop.orientationCb);
      this.prop.orientationCb = null;

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
   * @summary Attaches the {@link DeviceOrientationControls} to the camera
   * @private
   */
  __configure() {
    if (!this.controls) {
      this.controls = new THREE.DeviceOrientationControls(this.psv.renderer.camera);
    }
    else {
      this.controls.connect();
    }

    const direction = this.psv.renderer.camera.getWorldDirection(new THREE.Vector3());
    const sphericalDirection = this.psv.dataHelper.vector3ToSphericalCoords(direction);
    this.prop.alphaOffset = utils.getShortestArc(this.psv.prop.position.longitude, sphericalDirection.longitude);

    this.prop.orientationCb = () => {
      this.controls.alphaOffset = this.prop.alphaOffset;
      this.controls.update();

      this.psv.renderer.camera.getWorldDirection(this.psv.prop.direction);
      this.psv.prop.direction.multiplyScalar(CONSTANTS.SPHERE_RADIUS);

      const sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(this.psv.prop.direction);
      this.psv.prop.position.longitude = sphericalCoords.longitude;
      this.psv.prop.position.latitude = sphericalCoords.latitude;
      this.psv.needsUpdate();
    };

    this.psv.on(CONSTANTS.EVENTS.BEFORE_RENDER, this.prop.orientationCb);
  }

  /**
   * @summary Intercepts moves and offsets the alpha angle
   * @param {external:uEvent.Event} e
   * @private
   */
  __onRotate(e) {
    if (this.isEnabled()) {
      e.preventDefault();

      this.prop.alphaOffset -= e.args[0].longitude - this.psv.prop.position.longitude;
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
          /* eslint-disable-next-line no-restricted-globals */
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
