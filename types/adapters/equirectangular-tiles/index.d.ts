import { AbstractAdapter, Viewer, PanoData, PanoDataProvider } from '../..';

/**
 * @summary Configuration of a tiled panorama
 */
export type EquirectangularTilesPanorama = {
  baseUrl?: string;
  basePanoData?: PanoData | PanoDataProvider;
  width: number;
  cols: number;
  rows: number;
  tileUrl: (col: number, row: number) => string;
};

export type EquirectangularTilesAdapterOptions = {
  resolution?: number,
  showErrorTile?: boolean;
  baseBlur?: boolean;
};

/**
 * @summary Adapter for tiled panoramas
 */
export class EquirectangularTilesAdapter extends AbstractAdapter<EquirectangularTilesPanorama> {

  constructor(psv: Viewer, options: EquirectangularTilesAdapterOptions);

}
