import type { EquirectangularAdapterConfig, PanoData, PanoDataProvider } from '@photo-sphere-viewer/core';

/**
 * Configuration of a tiled panorama
 */
export type EquirectangularTilesPanorama = {
    /**
     * low resolution panorama loaded before tiles
     */
    baseUrl?: string;
    /**
     * panoData configuration associated to low resolution panorama loaded before tiles
     */
    basePanoData?: PanoData | PanoDataProvider;
    /**
     * complete panorama width (height is always width/2)
     */
    width: number;
    /**
     * number of vertical tiles (must be a power of 2)
     */
    cols: number;
    /**
     * number of horizontal tiles (must be a power of 2)
     */
    rows: number;
    /**
     * function to build a tile url
     */
    tileUrl: (col: number, row: number) => string | null;
};

export type EquirectangularTileLevel = {
    /**
     * @deprecated Not used anymore
     */
    zoomRange?: never;
    /**
     * complete panorama width (height is always width/2)
     */
    width: number;
    /**
     * number of vertical tiles (must be a power of 2)
     */
    cols: number;
    /**
     * number of horizontal tiles (must be a power of 2)
     */
    rows: number;
};

/**
 * Configuration of a tiled panorama with multiple tiles configurations
 */
export type EquirectangularMultiTilesPanorama = {
    /**
     * low resolution panorama loaded before tiles
     */
    baseUrl?: string;
    /**
     * panoData configuration associated to low resolution panorama loaded before tiles
     */
    basePanoData?: PanoData | PanoDataProvider;
    /**
     * Configuration of tiles by zoom level
     */
    levels: EquirectangularTileLevel[];
    /**
     * function to build a tile url
     */
    tileUrl: (col: number, row: number, level: number) => string | null;
};

export type EquirectangularTilesAdapterConfig = Omit<EquirectangularAdapterConfig, 'interpolateBackground' | 'blur'> & {
    /**
     * shows a warning sign on tiles that cannot be loaded
     * @default true
     */
    showErrorTile?: boolean;
    /**
     * applies a blur effect to the low resolution panorama
     * @default true
     */
    baseBlur?: boolean;
    /**
     * applies antialiasing to high resolutions tiles
     * @default true
     */
    antialias?: boolean;
    /**
     * shows debug helpers
     * @default false
     * @internal
     */
    debug?: boolean;
};

export type EquirectangularTilesPanoData = PanoData & {
    baseData: PanoData;
};
