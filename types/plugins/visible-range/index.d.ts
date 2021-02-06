import { AbstractPlugin, Viewer } from '../..';

export type VisibleRangePluginOptions = {
  latitudeRange?: number[] | string[];
  longitudeRange?: number[] | string[];
  usePanoData: boolean;
};

/**
 * @summary Locks visible longitude and/or latitude
 */
export class VisibleRangePlugin extends AbstractPlugin {

  constructor(psv: Viewer, options: VisibleRangePluginOptions);

  /**
   * @summary Changes the latitude range
   */
  setLatitudeRange(range: number[] | string[]);

  /**
   * @summary Changes the longitude range
   */
  setLongitudeRange(range: number[] | string[]);

  /**
   * @summary Changes the latitude and longitude ranges according the current panorama cropping data
   */
  setRangesFromPanoData()

}
