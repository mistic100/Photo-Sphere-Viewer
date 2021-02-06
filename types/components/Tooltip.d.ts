import { AbstractComponent } from './AbstractComponent';

/**
 * Object defining the tooltip position
 */
export type TooltipPosition = {
  top: number;
  left: number;
  position?: string | string[];
  box?: { width: number, height: number };
};

/**
 * Object defining the tooltip configuration
 */
export type TooltipOptions = TooltipPosition & {
  content: string;
  className?: string;
  data?: any;
};

export class Tooltip extends AbstractComponent {

  /**
   * Do not call this method directly, use {@link TooltipRenderer} instead.
   */
  show(options: TooltipOptions);

  /**
   * @summary Moves the tooltip to a new position
   * @throws {PSVError} when the configuration is incorrect
   */
  move(position: TooltipPosition);

}
