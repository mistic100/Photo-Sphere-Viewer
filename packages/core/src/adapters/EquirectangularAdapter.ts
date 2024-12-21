import { MathUtils, Mesh, MeshBasicMaterial, SphereGeometry, Texture } from 'three';
import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { SPHERE_RADIUS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { EquirectangularPanorama, PanoData, PanoDataProvider, PanoramaPosition, Position, TextureData } from '../model';
import { createTexture, getConfigParser, getXMPValue, isNil, mergePanoData } from '../utils';
import { AbstractAdapter } from './AbstractAdapter';

/**
 * Configuration for {@link EquirectangularAdapter}
 */
export type EquirectangularAdapterConfig = {
    /**
     * number of faces of the sphere geometry, higher values may decrease performances
     * @default 64
     */
    resolution?: number;
    /**
     * read real image size from XMP data
     * @default true
     */
    useXmpData?: boolean;
    /**
     * used for equirectangular tiles adapter
     * @internal
     */
    blur?: boolean;
};

export type EquirectangularMesh = Mesh<SphereGeometry, MeshBasicMaterial>;
export type EquirectangularTextureData = TextureData<Texture, string | EquirectangularPanorama, PanoData>;

const getConfig = getConfigParser<EquirectangularAdapterConfig>(
    {
        resolution: 64,
        useXmpData: true,
        blur: false,
    },
    {
        resolution: (resolution) => {
            if (!resolution || !MathUtils.isPowerOfTwo(resolution)) {
                throw new PSVError('EquirectangularAdapter resolution must be power of two.');
            }
            return resolution;
        },
    },
);

/**
 * Adapter for equirectangular panoramas
 */
export class EquirectangularAdapter extends AbstractAdapter<string | EquirectangularPanorama, PanoData, Texture, EquirectangularMesh> {
    static override readonly id: string = 'equirectangular';
    static override readonly VERSION = PKG_VERSION;
    static override readonly supportsDownload: boolean = true;

    private readonly config: EquirectangularAdapterConfig;

    // @internal
    public readonly SPHERE_SEGMENTS: number;
    // @internal
    public readonly SPHERE_HORIZONTAL_SEGMENTS: number;

    constructor(viewer: Viewer, config?: EquirectangularAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.SPHERE_SEGMENTS = this.config.resolution;
        this.SPHERE_HORIZONTAL_SEGMENTS = this.SPHERE_SEGMENTS / 2;
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: PanoData): Position {
        if (isNil(point.textureX) || isNil(point.textureY)) {
            throw new PSVError(`Texture position is missing 'textureX' or 'textureY'`);
        }

        const relativeX = ((point.textureX + data.croppedX) / data.fullWidth) * Math.PI * 2;
        const relativeY = ((point.textureY + data.croppedY) / data.fullHeight) * Math.PI;

        return {
            yaw: relativeX >= Math.PI ? relativeX - Math.PI : relativeX + Math.PI,
            pitch: Math.PI / 2 - relativeY,
        };
    }

    override sphericalCoordsToTextureCoords(position: Position, data: PanoData): PanoramaPosition {
        const relativeLong = (position.yaw / Math.PI / 2) * data.fullWidth;
        const relativeLat = (position.pitch / Math.PI) * data.fullHeight;

        let textureX = Math.round(position.yaw < Math.PI ? relativeLong + data.fullWidth / 2 : relativeLong - data.fullWidth / 2) - data.croppedX;
        let textureY = Math.round(data.fullHeight / 2 - relativeLat) - data.croppedY;

        if (textureX < 0 || textureX > data.croppedWidth || textureY < 0 || textureY > data.croppedHeight) {
            textureX = textureY = undefined;
        }

        return { textureX, textureY };
    }

    async loadTexture(
        panorama: string | EquirectangularPanorama,
        loader = true,
        newPanoData?: PanoData | PanoDataProvider,
        useXmpPanoData = this.config.useXmpData,
    ): Promise<EquirectangularTextureData> {
        if (typeof panorama !== 'string' && (typeof panorama !== 'object' || !panorama.path)) {
            return Promise.reject(new PSVError('Invalid panorama url, are you using the right adapter?'));
        }

        let cleanPanorama: EquirectangularPanorama;
        if (typeof panorama === 'string') {
            cleanPanorama = {
                path: panorama,
                data: newPanoData,
            };
        } else {
            cleanPanorama = {
                data: newPanoData,
                ...panorama,
            };
        }

        const blob = await this.viewer.textureLoader.loadFile(
            cleanPanorama.path,
            loader ? p => this.viewer.loader.setProgress(p) : null,
            cleanPanorama.path,
        );
        const xmpPanoData = useXmpPanoData ? await this.loadXMP(blob) : null;
        const img = await this.viewer.textureLoader.blobToImage(blob);

        if (typeof cleanPanorama.data === 'function') {
            cleanPanorama.data = cleanPanorama.data(img, xmpPanoData);
        }

        const panoData = mergePanoData(img.width, img.height, cleanPanorama.data, xmpPanoData);

        const texture = this.createEquirectangularTexture(img);

        return {
            panorama,
            texture,
            panoData,
            cacheKey: cleanPanorama.path,
        };
    }

    /**
     * Loads the XMP data of an image
     */
    private async loadXMP(blob: Blob): Promise<PanoData> {
        const binary = await this.loadBlobAsString(blob);

        const a = binary.indexOf('<x:xmpmeta');
        if (a === -1) {
            return null;
        }

        const b = binary.indexOf('</x:xmpmeta>', a);
        if (b === -1) {
            return null;
        }

        const data = binary.substring(a, b);
        if (!data.includes('GPano:')) {
            return null;
        }

        return {
            fullWidth: getXMPValue(data, 'FullPanoWidthPixels'),
            fullHeight: getXMPValue(data, 'FullPanoHeightPixels'),
            croppedWidth: getXMPValue(data, 'CroppedAreaImageWidthPixels'),
            croppedHeight: getXMPValue(data, 'CroppedAreaImageHeightPixels'),
            croppedX: getXMPValue(data, 'CroppedAreaLeftPixels'),
            croppedY: getXMPValue(data, 'CroppedAreaTopPixels'),
            poseHeading: getXMPValue(data, 'PoseHeadingDegrees', false),
            posePitch: getXMPValue(data, 'PosePitchDegrees', false),
            poseRoll: getXMPValue(data, 'PoseRollDegrees', false),
            initialHeading: getXMPValue(data, 'InitialViewHeadingDegrees', false),
            initialPitch: getXMPValue(data, 'InitialViewPitchDegrees', false),
            initialFov: getXMPValue(data, 'InitialHorizontalFOVDegrees', false),
        };
    }

    /**
     * Reads a Blob as a string
     */
    private loadBlobAsString(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(blob);
        });
    }

    /**
     * Creates the final texture from image and panorama data
     */
    private createEquirectangularTexture(img: HTMLImageElement): Texture {
        if (this.config.blur || img.width > SYSTEM.maxTextureWidth) {
            const ratio = Math.min(1, SYSTEM.maxCanvasWidth / img.width);

            const buffer = new OffscreenCanvas(Math.floor(img.width * ratio), Math.floor(img.height * ratio));

            const ctx = buffer.getContext('2d');

            if (this.config.blur) {
                ctx.filter = `blur(${buffer.width / 2048}px)`;
            }

            ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

            return createTexture(buffer);
        }

        return createTexture(img);
    }

    createMesh(panoData: PanoData): EquirectangularMesh {
        const hStart = (panoData.croppedX / panoData.fullWidth) * 2 * Math.PI;
        const hLength = (panoData.croppedWidth / panoData.fullWidth) * 2 * Math.PI;
        const vStart = (panoData.croppedY / panoData.fullHeight) * Math.PI;
        const vLength = (panoData.croppedHeight / panoData.fullHeight) * Math.PI;

        // The middle of the panorama is placed at yaw=0
        const geometry = new SphereGeometry(
            SPHERE_RADIUS,
            Math.round((this.SPHERE_SEGMENTS / (2 * Math.PI)) * hLength),
            Math.round((this.SPHERE_HORIZONTAL_SEGMENTS / Math.PI) * vLength),
            -Math.PI / 2 + hStart,
            hLength,
            vStart,
            vLength,
        ).scale(-1, 1, 1);

        const material = new MeshBasicMaterial({ depthTest: false, depthWrite: false });

        return new Mesh(geometry, material);
    }

    setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTextureData) {
        mesh.material.map = textureData.texture;
    }

    setTextureOpacity(mesh: EquirectangularMesh, opacity: number) {
        mesh.material.opacity = opacity;
        mesh.material.transparent = opacity < 1;
    }

    disposeTexture({ texture }: EquirectangularTextureData) {
        texture.dispose();
    }

    disposeMesh(mesh: EquirectangularMesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
}
