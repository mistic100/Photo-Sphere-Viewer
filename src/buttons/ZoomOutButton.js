import { AbstractZoomButton } from './AbstractZoomButton';
import zoomOut from '../icons/zoom-out.svg';

/**
 * @summary Navigation bar zoom-out button class
 * @extends PSV.buttons.AbstractZoomButton
 * @memberof PSV.buttons
 */
export class ZoomOutButton extends AbstractZoomButton {

  static id = 'zoomOut';
  static icon = zoomOut;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, -1);
  }

}
