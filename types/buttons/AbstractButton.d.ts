import { AbstractComponent } from '../components/AbstractComponent';
import { Navbar } from '../components/Navbar';

/**
 * @summary Base navbar button class
 */
export abstract class AbstractButton extends AbstractComponent {

  /**
   * @summary Unique identifier of the button
   */
  static id: string;

  /**
   * @summary SVG icon name injected in the button
   */
  static icon?: string;

  /**
   * @summary SVG icon name injected in the button when it is active
   */
  static iconActive?: string;

  constructor(navbar: Navbar, className?: string, collapsable?: boolean);

  /**
   * @summary Checks if the button can be displayed
   */
  isSupported(): boolean | { initial: boolean, promise: Promise<boolean> };

  /**
   * @summary Changes the active state of the button
   */
  toggleActive(active?: boolean);

  /**
   * @summary Disables the button
   */
  disable();

  /**
   * @summary Enables the button
   */
  enable();

  /**
   * @summary Collapses the button in the navbar menu
   */
  collapse();

  /**
   * @summary Uncollapses the button from the navbar menu
   */
  uncollapse();

}
