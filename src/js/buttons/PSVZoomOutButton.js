import { AbstractZoomButton } from './AbstractZoomButton';

/**
 * @summary Navigation bar zoom-out button class
 * @extends module:components/buttons.AbstractZoomButton
 * @memberof module:components/buttons
 */
class PSVZoomOutButton extends AbstractZoomButton {

  static get id() {
    return 'zoomOut';
  }

  static get icon() {
    return 'zoomOut';
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, () => navbar.psv.zoomOut());
  }

}

export { PSVZoomOutButton };
