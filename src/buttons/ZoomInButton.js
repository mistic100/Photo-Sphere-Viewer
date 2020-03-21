import { AbstractZoomButton } from './AbstractZoomButton';
import zoomIn from '../icons/zoom-in.svg';

/**
 * @summary Navigation bar zoom-in button class
 * @extends PSV.buttons.AbstractZoomButton
 * @memberof PSV.buttons
 */
export class ZoomInButton extends AbstractZoomButton {

  static id = 'zoomIn';
  static icon = zoomIn;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 1);
  }

}
