import { PSVError } from '@photo-sphere-viewer/core';
import { MathUtils } from 'three';
import { checkTilesLevels, getTileIndexByZoomLevel } from '../../shared/tiles-utils';
import { CubemapMultiTilesPanorama, CubemapTileLevel, CubemapTilesPanorama } from './model';

export type CubemapTileConfig = CubemapTileLevel & {
    level: number;
    tileSize: number;
    facesByTile: number;
};

function isMultiTiles(
    panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama
): panorama is CubemapMultiTilesPanorama {
    return !!(panorama as CubemapMultiTilesPanorama).levels;
}

function computeTileConfig(tile: CubemapTileLevel, level: number, data: { CUBE_SEGMENTS: number }): CubemapTileConfig {
    return {
        ...tile,
        level,
        tileSize: tile.faceSize / tile.nbTiles,
        facesByTile: data.CUBE_SEGMENTS / tile.nbTiles,
    };
}

export function getTileConfig(
    panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama,
    zoomLevel: number,
    data: { CUBE_SEGMENTS: number }
): CubemapTileConfig {
    let tile: CubemapTileLevel;
    let level: number;
    if (!isMultiTiles(panorama)) {
        level = 0;
        tile = {
            ...panorama,
            zoomRange: [0, 100],
        };
    } else {
        level = getTileIndexByZoomLevel(panorama.levels, zoomLevel);
        tile = panorama.levels[level];
    }
    return computeTileConfig(tile, level, data);
}

export function getTileConfigByIndex(
    panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama,
    level: number,
    data: { CUBE_SEGMENTS: number }
): CubemapTileConfig {
    if (!isMultiTiles(panorama) || !panorama.levels[level]) {
        return null;
    } else {
        return computeTileConfig(panorama.levels[level], level, data);
    }
}

export function checkPanoramaConfig(
    panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama,
    data: { CUBE_SEGMENTS: number }
) {
    if (typeof panorama !== 'object' || !panorama.tileUrl) {
        throw new PSVError('Invalid panorama configuration, are you using the right adapter?');
    }
    if (isMultiTiles(panorama)) {
        panorama.levels.forEach((level) => checkTile(level, data));
        checkTilesLevels(panorama.levels);
    } else {
        checkTile(panorama, data);
    }
}

function checkTile(tile: CubemapTilesPanorama | CubemapTileLevel, data: { CUBE_SEGMENTS: number }) {
    if (!tile.faceSize || !tile.nbTiles) {
        throw new PSVError('Invalid panorama configuration, are you using the right adapter?');
    }
    if (tile.nbTiles > data.CUBE_SEGMENTS) {
        throw new PSVError(`Panorama nbTiles must not be greater than ${data.CUBE_SEGMENTS}.`);
    }
    if (!MathUtils.isPowerOfTwo(tile.nbTiles)) {
        throw new PSVError('Panorama nbTiles must be power of 2.');
    }
}

/**
 * Checks if it is the top or bottom tile
 */
export function isTopOrBottom(face: number) {
    return face === 2 || face === 3;
}
