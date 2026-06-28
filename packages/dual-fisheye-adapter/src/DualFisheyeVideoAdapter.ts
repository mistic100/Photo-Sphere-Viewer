import type { AdapterConstructor, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { utils } from '@photo-sphere-viewer/core';
import { VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { DualFisheyeAdapter, DualFisheyeMesh } from './DualFisheyeAdapter';
import { DualFisheyeVideoAdapterConfig, DualFisheyeVideoPanorama } from './model';

type DualFisheyeVideoTextureData = TextureData<VideoTexture, DualFisheyeVideoPanorama, null>;

const getConfig = utils.getConfigParser<DualFisheyeVideoAdapterConfig>({
    autoplay: false,
    muted: false,
});

/**
 * Adapter for dual-fisheye videos
 */
export class DualFisheyeVideoAdapter extends AbstractVideoAdapter<
    DualFisheyeVideoPanorama,
    null,
    DualFisheyeMesh
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

        this.adapter = new DualFisheyeAdapter(this.viewer);
    }

    override destroy(): void {
        this.adapter.destroy();

        delete this.adapter;

        super.destroy();
    }

    override createMesh(): DualFisheyeMesh {
        return this.adapter.createMesh();
    }

    override setTexture(mesh: DualFisheyeMesh, { texture }: DualFisheyeVideoTextureData) {
        mesh.material.uniforms.map.value = texture;

        this.switchVideo(texture);
    }

    override setTextureOpacity(mesh: DualFisheyeMesh, opacity: number): void {
        mesh.material.uniforms.opacity.value = opacity;
    }
}
