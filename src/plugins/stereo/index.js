import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from 'photo-sphere-viewer';
import * as THREE from 'three';
import mobileRotateIcon from '../../icons/mobile-rotate.svg';
import '../../three-examples/effects/StereoEffect';
import { StereoButton } from './StereoButton';


// add stereo button
DEFAULTS.navbar.splice(-1, 0, StereoButton.id);
DEFAULTS.lang[StereoButton.id] = 'Stereo view';
registerButton(StereoButton);

// other lang strings
DEFAULTS.lang.stereoNotification = 'Click anywhere to exit stereo view.';
DEFAULTS.lang.pleaseRotate = ['Please rotate your device', '(or tap to continue)'];

const ID_PLEASE_ROTATE = 'pleaseRotate';


/**
 * @summary Adds stereo controls on mobile devices
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class StereoPlugin extends AbstractPlugin {

  static get id() {
    return 'stereo';
  }

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
     */
    this.gyroscope = psv.getPlugin('gyroscope');

    if (!this.gyroscope) {
      throw new PSVError('Stereo plugins requires the gyroscope plugin');
    }

    /**
     * @member {Object}
     * @protected
     * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
     * @property {external:THREE.StereoEffect} stereoEffect
     * @property {external:NoSleep} noSleep
     */
    this.prop = {
      isSupported: this.gyroscope.prop.isSupported,
      renderer   : null,
      noSleep    : null,
    };

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
        this.stop();
        break;
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
    return !!this.prop.stereoEffect;
  }

  /**
   * @summary Enables the stereo view
   * @description
   *  - enables NoSleep.js
   *  - enables full screen
   *  - starts gyroscope controle
   *  - hides hud, navbar and panel
   *  - instanciate StereoEffect
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

      this.psv.hud.hide();
      this.psv.navbar.hide();
      this.psv.panel.hide();

      /**
       * @event stereo-updated
       * @memberof PSV.plugins.StereoPlugin
       * @summary Triggered when the stereo view is enabled/disabled
       * @param {boolean} enabled
       */
      this.trigger(StereoPlugin.EVENTS.STEREO_UPATED, true);

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

      this.psv.hud.show();
      this.psv.navbar.show();

      this.__unlockOrientation();
      this.__stopNoSleep();
      this.psv.exitFullscreen();
      this.gyroscope.stop();

      this.trigger(StereoPlugin.EVENTS.STEREO_UPATED, false);
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
          id     : ID_PLEASE_ROTATE,
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

    if (window.screen && window.screen.orientation) {
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
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.unlock();
    }
    else {
      this.psv.overlay.hide(ID_PLEASE_ROTATE);
    }
  }

}
