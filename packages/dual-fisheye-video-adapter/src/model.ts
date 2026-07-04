import type { PanoData } from '@photo-sphere-viewer/core';
import type { AbstractVideoAdapterConfig, AbstractVideoPanorama } from '../../shared/AbstractVideoAdapter';

/**
 * Configuration of an dual-fisheye video
 */
export type DualFisheyeVideoPanorama = AbstractVideoPanorama & {
    data?: PanoData | ((image: HTMLVideoElement) => PanoData);
};

export type DualFisheyeVideoAdapterConfig = AbstractVideoAdapterConfig & {
    /**
     * (only if `shader=false`)
     * number of faces of the sphere geometry, higher values may decrease performances
     * @default 64
     */
    resolution?: number;
};
