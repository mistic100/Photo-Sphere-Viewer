import { AbstractZoomButton } from './AbstractZoomButton';

/**
 * @summary Navigation bar zoom-in button class
 * @extends PSV.buttons.AbstractZoomButton
 * @memberof PSV.buttons
 */
export class ZoomInButton extends AbstractZoomButton {

  static get id() {
    return 'zoomIn';
  }

  static get icon() {
    return 'zoomIn';
  }

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, () => navbar.psv.zoomIn());
  }

}
