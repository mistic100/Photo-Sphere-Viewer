import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { CONSTANTS, PSVError, utils } from '@photo-sphere-viewer/core';
import { MathUtils, Mesh, MeshBasicMaterial, SphereGeometry, VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { EquirectangularVideoAdapterConfig, EquirectangularVideoPanorama } from './model';

type EquirectangularMesh = Mesh<SphereGeometry, MeshBasicMaterial>;
type EquirectangularTexture = TextureData<VideoTexture, EquirectangularVideoPanorama>;

const getConfig = utils.getConfigParser<EquirectangularVideoAdapterConfig>(
    {
        resolution: 64,
        autoplay: false,
        muted: false,
    },
    {
        resolution: (resolution) => {
            if (!resolution || !MathUtils.isPowerOfTwo(resolution)) {
                throw new PSVError('EquirectangularTilesAdapter resolution must be power of two');
            }
            return resolution;
        },
    }
);

/**
 * Adapter for equirectangular videos
 */
export class EquirectangularVideoAdapter extends AbstractVideoAdapter<EquirectangularVideoPanorama> {
    static override readonly id = 'equirectangular-video';

    protected override readonly config: EquirectangularVideoAdapterConfig;

    private readonly SPHERE_SEGMENTS: number;
    private readonly SPHERE_HORIZONTAL_SEGMENTS: number;

    constructor(viewer: Viewer, config: EquirectangularVideoAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.SPHERE_SEGMENTS = this.config.resolution;
        this.SPHERE_HORIZONTAL_SEGMENTS = this.SPHERE_SEGMENTS / 2;
    }

    override loadTexture(panorama: EquirectangularVideoPanorama): Promise<EquirectangularTexture> {
        return super.loadTexture(panorama).then(({ texture, cacheKey }) => {
            const video: HTMLVideoElement = texture.image;
            const panoData = {
                fullWidth: video.videoWidth,
                fullHeight: video.videoHeight,
                croppedWidth: video.videoWidth,
                croppedHeight: video.videoHeight,
                croppedX: 0,
                croppedY: 0,
                poseHeading: 0,
                posePitch: 0,
                poseRoll: 0,
            };

            return { panorama, texture, panoData, cacheKey };
        });
    }

    createMesh(scale = 1): EquirectangularMesh {
        const geometry = new SphereGeometry(
            CONSTANTS.SPHERE_RADIUS * scale,
            this.SPHERE_SEGMENTS,
            this.SPHERE_HORIZONTAL_SEGMENTS,
            -Math.PI / 2
        ).scale(-1, 1, 1) as SphereGeometry;

        const material = new MeshBasicMaterial();

        return new Mesh(geometry, material);
    }

    setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTexture) {
        mesh.material.map = textureData.texture;

        this.switchVideo(textureData.texture);
    }
}
