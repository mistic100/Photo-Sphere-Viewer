import { EVENTS } from '../data/constants';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar fullscreen button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVFullscreenButton extends AbstractButton {

  static get id() {
    return 'fullscreen';
  }

  static get icon() {
    return 'fullscreenIn';
  }

  static get iconActive() {
    return 'fullscreenOut';
  }

  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-fullscreen-button');

    this.psv.on(EVENTS.FULLSCREEN_UPDATED, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.FULLSCREEN_UPDATED, this);

    super.destroy();
  }

  /**
   * Handle events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case EVENTS.FULLSCREEN_UPDATED: this.toggleActive(e.args[0]); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles fullscreen
   */
  __onClick() {
    this.psv.toggleFullscreen();
  }

}

export { PSVFullscreenButton };
