import { AbstractZoomButton } from './AbstractZoomButton';

/**
 * @summary Navigation bar zoom-in button class
 * @extends module:components/buttons.AbstractZoomButton
 * @memberof module:components/buttons
 */
class PSVZoomInButton extends AbstractZoomButton {

  static get id() {
    return 'zoomIn';
  }

  static get icon() {
    return 'zoomIn';
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, () => navbar.psv.zoomIn());
  }

}

export { PSVZoomInButton };
