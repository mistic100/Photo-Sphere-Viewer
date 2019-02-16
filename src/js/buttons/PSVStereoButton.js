import { EVENTS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar gyroscope button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVStereoButton extends AbstractButton {

  static get id() {
    return 'stereo';
  }

  static get icon() {
    return 'stereo';
  }

  get collapsable() {
    return true;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-stereo-button');

    this.psv.on(EVENTS.STEREO_UPATED, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.STEREO_UPATED, this);

    super.destroy();
  }

  /**
   * @override
   */
  checkSupported() {
    if (!SYSTEM.checkTHREE('DeviceOrientationControls')) {
      return false;
    }
    else {
      return { initial: false, promise: SYSTEM.isDeviceOrientationSupported };
    }
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case EVENTS.STEREO_UPATED: this.toggleActive(e.args[0]); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles gyroscope control
   */
  __onClick() {
    this.psv.toggleStereoView();
  }

}

export { PSVStereoButton };
