import { AbstractButton } from '../buttons/AbstractButton';
import { NavbarCustomButton } from '../models';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Register a new button available for all viewers
 */
export function registerButton(button: typeof AbstractButton);

/**
 * @summary Navigation bar class
 */
export class Navbar extends AbstractComponent {

  /**
   * @summary Change the buttons visible on the navbar
   */
  setButtons(buttons: string | Array<string | NavbarCustomButton>);

  /**
   * @summary Sets the bar caption
   */
  setCaption(html: string);

  /**
   * @summary Returns a button by its identifier
   */
  getButton(id: string): AbstractButton;

}
