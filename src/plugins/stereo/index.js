import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from 'photo-sphere-viewer';
import GyroscopePlugin from 'photo-sphere-viewer/dist/plugins/gyroscope';
import * as THREE from 'three';
import 'three/examples/js/effects/StereoEffect';
import mobileRotateIcon from './mobile-rotate.svg';
import { StereoButton } from './StereoButton';


/**
 * @typedef {Object} external:THREE.StereoEffect
 * @summary {@link https://github.com/mrdoob/three.js/blob/dev/examples/js/effects/StereoEffect.js}
 */

/**
 * @external NoSleep
 * @description {@link https://github.com/richtr/NoSleep.js}
 */


// add stereo button
DEFAULTS.navbar.splice(-1, 0, StereoButton.id);
DEFAULTS.lang[StereoButton.id] = 'Stereo view';
registerButton(StereoButton);

// other lang strings
DEFAULTS.lang.stereoNotification = 'Click anywhere to exit stereo view.';
DEFAULTS.lang.pleaseRotate = ['Please rotate your device', '(or tap to continue)'];


/**
 * @summary Adds stereo view on mobile devices
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class StereoPlugin extends AbstractPlugin {

  static id = 'stereo';

  /**
   * @summary Identifier of the overlay "please rotate your screen"
   * @type {string}
   * @constant
   */
  static ID_OVERLAY_PLEASE_ROTATE = 'pleaseRotate';

  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.StereoPlugin
   * @constant
   */
  static EVENTS = {
    STEREO_UPDATED: 'stereo-updated',
  };

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @type {PSV.plugins.GyroscopePlugin}
     * @readonly
     * @private
     */
    this.gyroscope = GyroscopePlugin ? psv.getPlugin(GyroscopePlugin) : null;

    if (!this.gyroscope) {
      throw new PSVError('Stereo plugin requires the Gyroscope plugin');
    }

    /**
     * @member {Object}
     * @protected
     * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
     * @property {external:THREE.WebGLRenderer} renderer - original renderer
     * @property {external:NoSleep} noSleep
     */
    this.prop = {
      isSupported: this.gyroscope.prop.isSupported,
      renderer   : null,
      noSleep    : null,
    };

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @private
     */
    this.markers = this.psv.getPlugin('markers');

    this.psv.on(CONSTANTS.EVENTS.STOP_ALL, this);
    this.psv.on(CONSTANTS.EVENTS.CLICK, this);
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.STOP_ALL, this);
    this.psv.off(CONSTANTS.EVENTS.CLICK, this);

    this.stop();

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    switch (e.type) {
      case CONSTANTS.EVENTS.STOP_ALL:
      case CONSTANTS.EVENTS.CLICK:
        this.stop();
        break;
      default:
        break;
    }
  }

  /**
   * @summary Checks if the stereo view is enabled
   * @returns {boolean}
   */
  isEnabled() {
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
  start() {
    // Need to be in the main event queue
    this.psv.enterFullscreen();
    this.__startNoSleep();
    this.__lockOrientation();

    return this.gyroscope.start().then(() => {
      // switch renderer
      this.prop.renderer = this.psv.renderer.renderer;
      this.psv.renderer.renderer = new THREE.StereoEffect(this.psv.renderer.renderer);

      this.psv.needsUpdate();

      if (this.markers) {
        this.markers.hide();
      }
      this.psv.navbar.hide();
      this.psv.panel.hide();

      /**
       * @event stereo-updated
       * @memberof PSV.plugins.StereoPlugin
       * @summary Triggered when the stereo view is enabled/disabled
       * @param {boolean} enabled
       */
      this.trigger(StereoPlugin.EVENTS.STEREO_UPDATED, true);

      this.psv.notification.show({
        content: this.psv.config.lang.stereoNotification,
        timeout: 3000,
      });
    }, () => {
      this.__unlockOrientation();
      this.__stopNoSleep();
      this.psv.exitFullscreen();
    });
  }

  /**
   * @summary Disables the stereo view
   * @fires PSV.plugins.StereoPlugin.stereo-updated
   */
  stop() {
    if (this.isEnabled()) {
      this.psv.renderer.renderer = this.prop.renderer;
      this.prop.renderer = null;

      this.psv.needsUpdate();

      if (this.markers) {
        this.markers.show();
      }
      this.psv.navbar.show();

      this.__unlockOrientation();
      this.__stopNoSleep();
      this.psv.exitFullscreen();
      this.gyroscope.stop();

      this.trigger(StereoPlugin.EVENTS.STEREO_UPDATED, false);
    }
  }

  /**
   * @summary Enables or disables the stereo view
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
   * @summary Enables NoSleep.js
   * TODO WakeLock API when available https://web.dev/wakelock
   * @private
   */
  __startNoSleep() {
    if (!('NoSleep' in window)) {
      utils.logWarn('NoSleep is not available');
      return;
    }

    if (!this.prop.noSleep) {
      this.prop.noSleep = new window.NoSleep();
    }

    this.prop.noSleep.enable();
  }

  /**
   * @summary Disables NoSleep.js
   * @private
   */
  __stopNoSleep() {
    if (this.prop.noSleep) {
      this.prop.noSleep.disable();
    }
  }

  /**
   * @summary Tries to lock the device in landscape or display a message
   * @private
   */
  __lockOrientation() {
    let displayRotateMessageTimeout;

    const displayRotateMessage = () => {
      if (this.isEnabled() && window.innerHeight > window.innerWidth) {
        this.psv.overlay.show({
          id     : StereoPlugin.ID_OVERLAY_PLEASE_ROTATE,
          image  : mobileRotateIcon,
          text   : this.psv.config.lang.pleaseRotate[0],
          subtext: this.psv.config.lang.pleaseRotate[1],
        });
      }

      if (displayRotateMessageTimeout) {
        clearTimeout(displayRotateMessageTimeout);
        displayRotateMessageTimeout = null;
      }
    };

    if (window.screen?.orientation) {
      window.screen.orientation.lock('landscape').then(null, () => displayRotateMessage());
      displayRotateMessageTimeout = setTimeout(() => displayRotateMessage(), 500);
    }
    else {
      displayRotateMessage();
    }
  }

  /**
   * @summary Unlock the device orientation
   * @private
   */
  __unlockOrientation() {
    if (window.screen?.orientation) {
      window.screen.orientation.unlock();
    }
    else {
      this.psv.overlay.hide(StereoPlugin.ID_OVERLAY_PLEASE_ROTATE);
    }
  }

}
