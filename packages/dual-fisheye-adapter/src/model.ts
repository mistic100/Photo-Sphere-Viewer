import type { AbstractVideoAdapterConfig, AbstractVideoPanorama } from '../../shared/AbstractVideoAdapter';

/**
 * Configuration of an dual-fisheye panorama
 */
export type DualFisheyePanorama = {
    path: string;
};

/**
 * Configuration of an dual-fisheye video
 */
export type DualFisheyeVideoPanorama = AbstractVideoPanorama;

export type DualFisheyeAdapterConfig = unknown;

export type DualFisheyeVideoAdapterConfig = AbstractVideoAdapterConfig;
