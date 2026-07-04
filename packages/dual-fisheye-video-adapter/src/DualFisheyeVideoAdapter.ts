import type { AdapterConstructor, PanoData, PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { DualFisheyeAdapter, utils } from '@photo-sphere-viewer/core';
import { Mesh, MeshBasicMaterial, ShaderMaterial, SphereGeometry, VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { DualFisheyeVideoAdapterConfig, DualFisheyeVideoPanorama } from './model';

type DualFisheyeVideoMesh = Mesh<SphereGeometry, MeshBasicMaterial | ShaderMaterial>;
type DualFisheyeVideoTextureData = TextureData<VideoTexture, DualFisheyeVideoPanorama, PanoData>;

const getConfig = utils.getConfigParser<DualFisheyeVideoAdapterConfig>({
    shader: false,
    resolution: 64,
    autoplay: false,
    muted: false,
});

/**
 * Adapter for dual-fisheye videos
 */
export class DualFisheyeVideoAdapter extends AbstractVideoAdapter<
    DualFisheyeVideoPanorama,
    PanoData,
    DualFisheyeVideoMesh
> {
    static override readonly id = 'dual-fisheye-video';
    static override readonly VERSION = PKG_VERSION;

    protected override readonly config: DualFisheyeVideoAdapterConfig;

    private adapter: DualFisheyeAdapter;

    static withConfig(config: DualFisheyeVideoAdapterConfig): [AdapterConstructor, any] {
        return [DualFisheyeVideoAdapter, config];
    }

    constructor(viewer: Viewer, config: DualFisheyeVideoAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.adapter = new DualFisheyeAdapter(this.viewer, {
            shader: this.config.shader,
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
        panorama: DualFisheyeVideoPanorama,
        _?: boolean,
        newPanoData?: any,
    ): Promise<DualFisheyeVideoTextureData> {
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

    createMesh(panoData: PanoData): DualFisheyeVideoMesh {
        return this.adapter.createMesh(panoData);
    }

    setTexture(mesh: DualFisheyeVideoMesh, { texture }: DualFisheyeVideoTextureData) {
        if (this.config.shader) {
            (mesh.material as ShaderMaterial).uniforms.map.value = texture;
        } else {
            (mesh.material as MeshBasicMaterial).map = texture;
        }

        this.switchVideo(texture);
    }

    override setTextureOpacity(mesh: DualFisheyeVideoMesh, opacity: number): void {
        if (this.config.shader) {
            (mesh.material as ShaderMaterial).uniforms.opacity.value = opacity;
        } else {
            super.setTextureOpacity(mesh, opacity);
        }
    }
}
