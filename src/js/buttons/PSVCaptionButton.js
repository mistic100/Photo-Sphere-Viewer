import { AbstractButton } from './AbstractButton';
import { EVENTS } from '../data/constants';

/**
 * @summary Navigation bar caption button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVCaptionButton extends AbstractButton {

  static get id() {
    return 'caption';
  }

  static get icon() {
    return 'info';
  }

  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbarCaption} caption
   */
  constructor(caption) {
    super(caption, 'psv-button--hover-scale psv-caption-button');

    this.psv.on(EVENTS.HIDE_NOTIFICATION, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.HIDE_NOTIFICATION, this);

    super.destroy();
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
      case EVENTS.HIDE_NOTIFICATION: this.toggleActive(false); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles markers list
   */
  __onClick() {
    if (this.psv.notification.prop.visible) {
      this.psv.notification.hide();
    }
    else {
      this.psv.notification.show(this.parent.prop.caption);
      this.toggleActive(true);
    }
  }

}

export { PSVCaptionButton };
