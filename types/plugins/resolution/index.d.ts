import { AbstractPlugin, Viewer } from '../..';
import { Event } from 'uevent';

export type Resolution = {
  id: string;
  label: string;
  panorama: any;
};

export type ResolutionPluginOptions = {
  resolutions: Resolution[];
};

/**
 * @summary Adds a setting to choose between multiple resolutions of the panorama.
 */
export class ResolutionPlugin extends AbstractPlugin {

  static EVENTS: {
    RESOLUTION_CHANGED: 'resolution-changed',
  };

  constructor(psv: Viewer, options: ResolutionPluginOptions);

  /**
   * @summary Changes the available resolutions
   */
  setResolutions(resolutions: Resolution[]);

  /**
   * @summary Changes the current resolution
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
