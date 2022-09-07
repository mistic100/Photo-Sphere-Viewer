import { AbstractPlugin, Viewer } from '../..';
import { Event } from 'uevent';

export type Resolution = {
  id: string;
  label: string;
  panorama: any;
};

export type ResolutionPluginOptions = {
  resolutions: Resolution[];
  defaultResolution?: string;
  showBadge?: boolean;
};

export const EVENTS: {
  RESOLUTION_CHANGED: 'resolution-changed',
};

/**
 * @summary Adds a setting to choose between multiple resolutions of the panorama.
 */
export class ResolutionPlugin extends AbstractPlugin {

  static EVENTS: typeof EVENTS;

  constructor(psv: Viewer, options: ResolutionPluginOptions);

  /**
   * @summary Changes the available resolutions
   */
  setResolutions(resolutions: Resolution[], defaultResolution?: string);

  /**
   * @summary Changes the current resolution
   * @throws {PSVError} if the resolution does not exist
   */
  setResolution(id: string);

  /**
   * @summary Returns the current resolution
   */
  getResolution(): string;

  /**
   * @summary Triggered when the resolution is changed
   */
  on(e: 'resolution-changed', cb: (e: Event, resolutionId: string) => void): this;

}
