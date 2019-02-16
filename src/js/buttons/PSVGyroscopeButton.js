import { SYSTEM } from '../data/system';
import { AbstractButton } from './AbstractButton';
import { EVENTS } from '../data/constants';

/**
 * @summary Navigation bar gyroscope button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVGyroscopeButton extends AbstractButton {

  static get id() {
    return 'gyroscope';
  }

  static get icon() {
    return 'compass';
  }

  get collapsable() {
    return true;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-gyroscope-button');

    this.psv.on(EVENTS.GYROSCOPE_UPDATED, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.GYROSCOPE_UPDATED, this);

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
      case EVENTS.GYROSCOPE_UPDATED: this.toggleActive(e.args[0]); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles gyroscope control
   */
  __onClick() {
    this.psv.toggleGyroscopeControl();
  }

}

export { PSVGyroscopeButton };
