import type { AdapterConstructor, PanoData, PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { utils } from '@photo-sphere-viewer/core';
import { EquirectangularRaycastAdapter, EquirectangularRaycastMesh } from '@photo-sphere-viewer/equirectangular-raycast-adapter';
import { VideoTexture } from 'three';
import { AbstractVideoAdapter, AbstractVideoAdapterConfig, AbstractVideoPanorama } from '../../shared/AbstractVideoAdapter';

export type EquirectangularRaycastVideoPanorama = AbstractVideoPanorama & {
    data?: PanoData | ((image: HTMLVideoElement) => PanoData);
};

export type EquirectangularRaycastVideoAdapterConfig = AbstractVideoAdapterConfig;

type EquirectangularRaycastVideoTextureData = TextureData<VideoTexture, EquirectangularRaycastVideoPanorama, PanoData>;

/**
 * Adapter for equirectangular videos that computes the texture mapping
 * mathematically in the fragment shader instead of relying on UV interpolation
 * across vertices.
 */
export class EquirectangularRaycastVideoAdapter extends AbstractVideoAdapter<
    EquirectangularRaycastVideoPanorama,
    PanoData,
    EquirectangularRaycastMesh
> {
    static override readonly id = 'equirectangular-raycast-video';
    static override readonly VERSION = PKG_VERSION;

    protected override readonly config: EquirectangularRaycastVideoAdapterConfig;

    private adapter: EquirectangularRaycastAdapter;

    static withConfig(config: EquirectangularRaycastVideoAdapterConfig): [AdapterConstructor, any] {
        return [EquirectangularRaycastVideoAdapter, config];
    }

    constructor(viewer: Viewer, config: EquirectangularRaycastVideoAdapterConfig) {
        super(viewer);

        this.config = {
            autoplay: config?.autoplay ?? false,
            muted: config?.muted ?? false,
        };

        this.adapter = new EquirectangularRaycastAdapter(this.viewer);
    }

    override destroy(): void {
        this.adapter.destroy();
        delete this.adapter;
        super.destroy();
    }

    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: PanoData): Position {
        return this.adapter.textureCoordsToSphericalCoords(point, data);
    }

    override sphericalCoordsToTextureCoords(position: Position, data: PanoData): PanoramaPosition {
        return this.adapter.sphericalCoordsToTextureCoords(position, data);
    }

    override async loadTexture(
        panorama: EquirectangularRaycastVideoPanorama,
        _?: boolean,
        newPanoData?: any,
    ): Promise<EquirectangularRaycastVideoTextureData> {
        const { texture } = await super.loadTexture(panorama);
        const video: HTMLVideoElement = texture.image;

        if (panorama.data) {
            newPanoData = panorama.data;
        }
        if (typeof newPanoData === 'function') {
            newPanoData = newPanoData(video);
        }

        const panoData = utils.mergePanoData(video.videoWidth, video.videoHeight, newPanoData);

        return { panorama, texture, panoData };
    }

    createMesh(panoData: PanoData): EquirectangularRaycastMesh {
        return this.adapter.createMesh(panoData);
    }

    setTexture(mesh: EquirectangularRaycastMesh, { texture }: EquirectangularRaycastVideoTextureData) {
        mesh.material.uniforms.map.value = texture;
        this.switchVideo(texture);
    }

    override setTextureOpacity(mesh: EquirectangularRaycastMesh, opacity: number) {
        mesh.material.uniforms.opacity.value = opacity;
    }
}
