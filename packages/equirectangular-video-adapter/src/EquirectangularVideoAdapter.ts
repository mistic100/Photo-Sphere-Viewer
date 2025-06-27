import type { AdapterConstructor, PanoData, PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularAdapter, utils } from '@photo-sphere-viewer/core';
import { Mesh, MeshBasicMaterial, SphereGeometry, VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { EquirectangularVideoAdapterConfig, EquirectangularVideoPanorama } from './model';

type EquirectangularVideoMesh = Mesh<SphereGeometry, MeshBasicMaterial>;
type EquirectangularVideoTextureData = TextureData<VideoTexture, EquirectangularVideoPanorama, PanoData>;

const getConfig = utils.getConfigParser<EquirectangularVideoAdapterConfig>({
    resolution: 64,
    autoplay: false,
    muted: false,
});

/**
 * Adapter for equirectangular videos
 */
export class EquirectangularVideoAdapter extends AbstractVideoAdapter<
    EquirectangularVideoPanorama,
    PanoData,
    EquirectangularVideoMesh
> {
    static override readonly id = 'equirectangular-video';
    static override readonly VERSION = PKG_VERSION;

    protected override readonly config: EquirectangularVideoAdapterConfig;

    private adapter: EquirectangularAdapter;

    static withConfig(config: EquirectangularVideoAdapterConfig): [AdapterConstructor, any] {
        return [EquirectangularVideoAdapter, config];
    }

    constructor(viewer: Viewer, config: EquirectangularVideoAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.adapter = new EquirectangularAdapter(this.viewer, {
            resolution: this.config.resolution,
        });
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
        panorama: EquirectangularVideoPanorama,
        _?: boolean,
        newPanoData?: any,
    ): Promise<EquirectangularVideoTextureData> {
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

    createMesh({ panoData }: EquirectangularVideoTextureData): EquirectangularVideoMesh {
        return this.adapter.createMesh({ panoData });
    }

    setTexture(mesh: EquirectangularVideoMesh, { texture }: EquirectangularVideoTextureData) {
        mesh.material.map = texture;

        this.switchVideo(texture);
    }
}
