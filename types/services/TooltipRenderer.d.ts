import { Tooltip, TooltipOptions } from '../components/Tooltip';
import { AbstractComponent } from '../components/AbstractComponent';

/**
 * @summary Tooltip renderer
 */
export class TooltipRenderer extends AbstractComponent {

  /**
   * @summary Displays a tooltip on the viewer
   * @throws {PSVError} when the configuration is incorrect
   */
  create(config: TooltipOptions): Tooltip;

}
