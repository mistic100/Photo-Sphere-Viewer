import type { AdapterConstructor, PanoData, SphereCorrection } from '@photo-sphere-viewer/core';
import type { CubemapPanorama } from '@photo-sphere-viewer/cubemap-adapter';

export type BaseOverlayConfig = {
    id?: string;
    /**
     * @default 1
     */
    opacity?: number;
    /**
     * @default 0
     */
    zIndex?: number;
    /**
     * Sphere correction applied to this overlay. If defined, overrides the global inheritSphereCorrection setting.
     */
    sphereCorrection?: SphereCorrection;
};

/**
 * Overlay applied on a sphere, complete or partial
 */
export type SphereOverlayConfig = BaseOverlayConfig & {
    path: string;
    panoData?: PanoData;
};

/**
 * Overlay applied on a whole cube (6 images)
 */
export type CubeOverlayConfig = BaseOverlayConfig & {
    path: CubemapPanorama;
};

export type OverlayConfig = SphereOverlayConfig | CubeOverlayConfig;

export type OverlaysPluginConfig = {
    /**
     * Initial overlays
     */
    overlays?: OverlayConfig[];
    /**
     * Automatically remove all overlays when the panorama changes
     * @default true
     */
    autoclear?: boolean;
    /**
     * Applies the global "sphereCorrection" to each overlay
     * @default true
     */
    inheritSphereCorrection?: boolean;
    /**
     * Used to display cubemap overlays on equirectangular panoramas
     */
    cubemapAdapter?: AdapterConstructor;
};

export type UpdatableOverlaysPluginConfig = Omit<OverlaysPluginConfig, 'overlays' | 'cubemapAdapter' | 'inheritSphereCorrection'>;
