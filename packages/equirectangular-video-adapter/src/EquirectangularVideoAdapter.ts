import type { PanoData, PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { CONSTANTS, EquirectangularAdapter, PSVError, utils } from '@photo-sphere-viewer/core';
import { MathUtils, Mesh, MeshBasicMaterial, SphereGeometry, VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { EquirectangularVideoAdapterConfig, EquirectangularVideoPanorama } from './model';

type EquirectangularMesh = Mesh<SphereGeometry, MeshBasicMaterial>;
type EquirectangularTexture = TextureData<VideoTexture, EquirectangularVideoPanorama, PanoData>;

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
export class EquirectangularVideoAdapter extends AbstractVideoAdapter<
    EquirectangularVideoPanorama,
    PanoData
> {
    static override readonly id = 'equirectangular-video';
    static override readonly VERSION = PKG_VERSION;

    protected override readonly config: EquirectangularVideoAdapterConfig;

    private readonly SPHERE_SEGMENTS: number;
    private readonly SPHERE_HORIZONTAL_SEGMENTS: number;

    private adapter: EquirectangularAdapter;

    constructor(viewer: Viewer, config: EquirectangularVideoAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.SPHERE_SEGMENTS = this.config.resolution;
        this.SPHERE_HORIZONTAL_SEGMENTS = this.SPHERE_SEGMENTS / 2;
    }

    override destroy(): void {
        this.adapter?.destroy();

        delete this.adapter;

        super.destroy();
    }

    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: PanoData): Position {
        return this.getAdapter().textureCoordsToSphericalCoords(point, data);
    }

    override sphericalCoordsToTextureCoords(position: Position, data: PanoData): PanoramaPosition {
        return this.getAdapter().sphericalCoordsToTextureCoords(position, data);
    }

    override loadTexture(panorama: EquirectangularVideoPanorama): Promise<EquirectangularTexture> {
        return super.loadTexture(panorama).then(({ texture }) => {
            const video: HTMLVideoElement = texture.image;
            const panoData: PanoData = {
                isEquirectangular: true,
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

            return { panorama, texture, panoData };
        });
    }

    createMesh(): EquirectangularMesh {
        const geometry = new SphereGeometry(
            CONSTANTS.SPHERE_RADIUS,
            this.SPHERE_SEGMENTS,
            this.SPHERE_HORIZONTAL_SEGMENTS,
            -Math.PI / 2
        ).scale(-1, 1, 1);

        const material = new MeshBasicMaterial();

        return new Mesh(geometry, material);
    }

    setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTexture) {
        mesh.material.map = textureData.texture;

        this.switchVideo(textureData.texture);
    }

    /**
     * @internal
     */
    getAdapter() {
        if (!this.adapter) {
            this.adapter = new EquirectangularAdapter(this.viewer, { 
                interpolateBackground: false, 
                resolution: this.config.resolution,
            });
        }
        return this.adapter;
    }
}
