import type { Cubemap, CubemapAdapterConfig, CubemapData, CubemapPanorama } from '@photo-sphere-viewer/cubemap-adapter';

/**
 * Configuration of a tiled cubemap
 */
export type CubemapTilesPanorama = {
    /**
     * low resolution panorama loaded before tiles
     */
    baseUrl?: CubemapPanorama;
    /**
     * size of a face in pixels
     */
    faceSize: number;
    /**
     * number of tiles on a side of a face
     */
    nbTiles: number;
    /**
     * function to build a tile url
     */
    tileUrl: (face: keyof Cubemap, col: number, row: number) => string | null;
    /**
     * Set to true if the top and bottom faces are not correctly oriented
     * @default false
     */
    flipTopBottom?: boolean;
};

export type CubemapTileLevel = {
    /**
     * @deprecated Not used anymore
     */
    zoomRange?: never;
    /**
     * size of a face in pixels
     */
    faceSize: number;
    /**
     * number of tiles on a side of a face
     */
    nbTiles: number;
};

/**
 * Configuration of a tiled cubemap with multiple tiles configurations
 */
export type CubemapMultiTilesPanorama = {
    /**
     * low resolution panorama loaded before tiles
     */
    baseUrl?: CubemapPanorama;
    /**
     * Configuration of tiles by zoom level
     */
    levels: CubemapTileLevel[];
    /**
     * function to build a tile url
     */
    tileUrl: (face: keyof Cubemap, col: number, row: number, level: number) => string | null;
    /**
     * Set to true if the top and bottom faces are not correctly oriented
     * @default false
     */
    flipTopBottom?: boolean;
};

export type CubemapTilesAdapterConfig = CubemapAdapterConfig & {
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

export type CubemapTilesPanoData = CubemapData & {
    baseData: CubemapData;
};
