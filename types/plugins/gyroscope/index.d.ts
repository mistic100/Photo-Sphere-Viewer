import { AbstractPlugin, Viewer } from '../..';
import { Event } from 'uevent';

export type GyroscopePluginOptions = {
  touchmove?: boolean;
  absolutePosition?: boolean;
  moveMode?:'smooth' | 'fast'
};

export const EVENTS: {
  GYROSCOPE_UPDATED: 'gyroscope-updated',
};

/**
 * @summary Adds gyroscope controls on mobile devices
 */
export class GyroscopePlugin extends AbstractPlugin {

  static EVENTS: typeof EVENTS;

  constructor(psv: Viewer, options: GyroscopePluginOptions);

  /**
   * @summary Checks if the gyroscope is enabled
   */
  isEnabled(): boolean;

  /**
   * @summary Enables the gyroscope navigation if available
   * @throws {PSVError} if the gyroscope API is not available/granted
   */
  start(): Promise<void>;

  /**
   * @summary Disables the gyroscope navigation
   */
  stop();

  /**
   * @summary Enables or disables the gyroscope navigation
   */
  toggle();

  /**
   * @summary Triggered when the gyroscope mode is enabled/disabled
   */
  on(e: 'gyroscope-updated', cb: (e: Event, enabled: boolean) => void): this;

}
