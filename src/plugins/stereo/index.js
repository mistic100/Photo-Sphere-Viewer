import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from '../..';
import { EVENTS, ID_OVERLAY_PLEASE_ROTATE } from './constants';
import mobileRotateIcon from './mobile-rotate.svg';
import { StereoButton } from './StereoButton';
import { StereoEffect } from './StereoEffect';


/**
 * @external NoSleep
 * @description {@link https://github.com/richtr/NoSleep.js}
 */


// add stereo button
DEFAULTS.lang[StereoButton.id] = 'Stereo view';
registerButton(StereoButton, 'caption:right');

// other lang strings
DEFAULTS.lang.stereoNotification = 'Tap anywhere to exit stereo view.';
DEFAULTS.lang.pleaseRotate = ['Please rotate your device', '(or tap to continue)'];


export { EVENTS } from './constants';


/**
 * @summary Adds stereo view on mobile devices
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class StereoPlugin extends AbstractPlugin {

  static id = 'stereo';

  static EVENTS = EVENTS;

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
    this.gyroscope = null;

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @readonly
     * @private
     */
    this.markers = null;

    /**
     * @type {PSV.plugins.CompassPlugin}
     * @readonly
     * @private
     */
    this.compass = null;

    /**
     * @member {Object}
     * @protected
     * @property {Promise<boolean>} isSupported - indicates of the gyroscope API is available
     * @property {external:THREE.WebGLRenderer} renderer - original renderer
     * @property {external:NoSleep} noSleep
     * @property {WakeLockSentinel} wakeLock
     */
    this.prop = {
      isSupported: false,
      renderer   : null,
      noSleep    : null,
      wakeLock   : null,
    };
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.markers = this.psv.getPlugin('markers');
    this.compass = this.psv.getPlugin('compass');
    this.gyroscope = this.psv.getPlugin('gyroscope');

    if (!this.gyroscope) {
      throw new PSVError('Stereo plugin requires the Gyroscope plugin');
    }

    this.prop.isSupported = this.gyroscope.prop.isSupported;

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

    delete this.markers;
    delete this.compass;
    delete this.gyroscope;

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
      this.psv.renderer.renderer = new StereoEffect(this.psv.renderer.renderer);

      this.psv.needsUpdate();

      this.markers?.hide();
      this.compass?.hide();
      this.psv.navbar.hide();
      this.psv.panel.hide();

      this.trigger(EVENTS.STEREO_UPDATED, true);

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

      this.markers?.show();
      this.compass?.show();
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
  toggle() {
    if (this.isEnabled()) {
      this.stop();
    }
    else {
      this.start();
    }
  }

  /**
   * @summary Enables WakeLock or NoSleep.js
   * @private
   */
  __startNoSleep() {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then((wakeLock) => {
          this.prop.wakeLock = wakeLock;
        })
        .catch(() => utils.logWarn('Cannot acquire WakeLock'));
    }
    else if ('NoSleep' in window) {
      if (!this.prop.noSleep) {
        this.prop.noSleep = new window.NoSleep();
      }
      this.prop.noSleep.enable();
    }
    else {
      utils.logWarn('NoSleep is not available');
    }
  }

  /**
   * @summary Disables WakeLock or NoSleep.js
   * @private
   */
  __stopNoSleep() {
    if (this.prop.wakeLock) {
      this.prop.wakeLock.release();
      this.prop.wakeLock = null;
    }
    else if (this.prop.noSleep) {
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
      if (window.innerHeight > window.innerWidth) {
        this.psv.overlay.show({
          id     : ID_OVERLAY_PLEASE_ROTATE,
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
      this.psv.overlay.hide(ID_OVERLAY_PLEASE_ROTATE);
    }
  }

}
