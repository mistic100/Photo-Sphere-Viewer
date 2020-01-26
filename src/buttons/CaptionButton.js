import { AbstractButton } from './AbstractButton';
import { EVENTS } from '../data/constants';
import info from '../icons/info.svg';

/**
 * @summary Navigation bar caption button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class CaptionButton extends AbstractButton {

  static id = 'caption';
  static icon = info;

  /**
   * @param {PSV.components.NavbarCaption} caption
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
   * @description Toggles caption
   */
  onClick() {
    if (this.psv.notification.prop.visible) {
      this.psv.notification.hide();
    }
    else {
      this.psv.notification.show(this.parent.prop.caption);
      this.toggleActive(true);
    }
  }

}
