import { Viewer } from '../Viewer';

/**
 * @summary Base component class
 */
export abstract class AbstractComponent {

  constructor(parent: Viewer | AbstractComponent, className?: string);

  /**
   * @summary Displays the component
   */
  show(options?: any);

  /**
   * @summary Hides the component
   */
  hide(options?: any);

  /**
   * @summary Displays or hides the component
   */
  toggle();

  /**
   * @summary Check if the component is visible
   */
  isVisible(options?: any): boolean;

}
