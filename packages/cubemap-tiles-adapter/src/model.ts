import type { Cubemap, CubemapAdapterConfig, CubemapPanorama } from '@photo-sphere-viewer/cubemap-adapter';

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
};

export type CubemapTileLevel = {
    /**
     * Lower and upper zoom levels (0-100)
     */
    zoomRange: [number, number];
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
