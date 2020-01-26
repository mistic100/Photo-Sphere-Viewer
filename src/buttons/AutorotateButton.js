import { EVENTS } from '../data/constants';
import playActive from '../icons/play-active.svg';
import play from '../icons/play.svg';
import { AbstractButton } from './AbstractButton';

import '../styles/buttons/autorotate.scss';

/**
 * @summary Navigation bar autorotate button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class AutorotateButton extends AbstractButton {

  static id = 'autorotate';
  static icon = play;
  static iconActive = playActive;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-autorotate-button', true);

    this.psv.on(EVENTS.AUTOROTATE, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.AUTOROTATE, this);

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
      case EVENTS.AUTOROTATE: this.toggleActive(e.args[0]); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles autorotate
   */
  onClick() {
    this.psv.toggleAutorotate();
  }

}
