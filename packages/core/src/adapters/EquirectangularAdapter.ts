import { BufferGeometry, Material, MathUtils, Mesh, MeshBasicMaterial, SphereGeometry, Texture } from 'three';
import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { SPHERE_RADIUS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { PanoData, PanoDataProvider, PanoramaPosition, Position, TextureData } from '../model';
import { createTexture, firstNonNull, getConfigParser, getXMPValue, isNil, logWarn } from '../utils';
import { AbstractAdapter } from './AbstractAdapter';
import { interpolationWorkerSrc } from './interpolationWorker';

/**
 * Configuration for {@link EquirectangularAdapter}
 */
export type EquirectangularAdapterConfig = {
    /**
     * Background color of the canvas, which will be visible when using cropped panoramas
     * @default '#000'
     */
    backgroundColor?: string;
    /**
     * Interpolate the missing parts of cropped panoramas (async)
     */
    interpolateBackground?: boolean;
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

type EquirectangularMesh = Mesh<BufferGeometry, Material>;
type EquirectangularTexture = TextureData<Texture, string, PanoData>;

const getConfig = getConfigParser<EquirectangularAdapterConfig>(
    {
        backgroundColor: '#000',
        interpolateBackground: false,
        resolution: 64,
        useXmpData: true,
        blur: false,
    },
    {
        resolution: (resolution) => {
            if (!resolution || !MathUtils.isPowerOfTwo(resolution)) {
                throw new PSVError('EquirectangularAdapter resolution must be power of two');
            }
            return resolution;
        },
    }
);

/**
 * Adapter for equirectangular panoramas
 */
export class EquirectangularAdapter extends AbstractAdapter<string, Texture, PanoData> {
    static override readonly id: string = 'equirectangular';
    static override readonly VERSION = PKG_VERSION;
    static override readonly supportsDownload: boolean = true;

    private readonly config: EquirectangularAdapterConfig;

    private interpolationWorker: Worker;

    readonly SPHERE_SEGMENTS: number;
    readonly SPHERE_HORIZONTAL_SEGMENTS: number;

    constructor(viewer: Viewer, config?: EquirectangularAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        if (this.config.interpolateBackground) {
            if (!window.Worker) {
                logWarn('Web Worker API not available');
                this.config.interpolateBackground = false;
            } else {
                this.interpolationWorker = new Worker(interpolationWorkerSrc, {
                    name: 'photo-sphere-viewer-interpolation',
                });
            }
        }

        this.SPHERE_SEGMENTS = this.config.resolution;
        this.SPHERE_HORIZONTAL_SEGMENTS = this.SPHERE_SEGMENTS / 2;
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    override destroy(): void {
        this.interpolationWorker?.terminate();

        super.destroy();
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

        return {
            textureX:
                Math.round(
                    position.yaw < Math.PI ? relativeLong + data.fullWidth / 2 : relativeLong - data.fullWidth / 2
                ) - data.croppedX,
            textureY: Math.round(data.fullHeight / 2 - relativeLat) - data.croppedY,
        };
    }

    async loadTexture(
        panorama: string,
        loader = true,
        newPanoData?: PanoData | PanoDataProvider,
        useXmpPanoData = this.config.useXmpData
    ): Promise<EquirectangularTexture> {
        if (typeof panorama !== 'string') {
            return Promise.reject(new PSVError('Invalid panorama url, are you using the right adapter?'));
        }

        const blob = await this.viewer.textureLoader.loadFile(
            panorama,
            loader ? (p) => this.viewer.loader.setProgress(p) : null,
            panorama
        );
        const xmpPanoData = useXmpPanoData ? await this.loadXMP(blob) : null;
        const img = await this.viewer.textureLoader.blobToImage(blob);

        if (typeof newPanoData === 'function') {
            newPanoData = newPanoData(img, xmpPanoData);
        }
        if (!newPanoData && !xmpPanoData) {
            newPanoData = this.__defaultPanoData(img);
        }

        const panoData: PanoData = {
            isEquirectangular: true,
            fullWidth: firstNonNull(newPanoData?.fullWidth, xmpPanoData?.fullWidth, img.width),
            fullHeight: firstNonNull(newPanoData?.fullHeight, xmpPanoData?.fullHeight, img.height),
            croppedWidth: firstNonNull(newPanoData?.croppedWidth, xmpPanoData?.croppedWidth, img.width),
            croppedHeight: firstNonNull(newPanoData?.croppedHeight, xmpPanoData?.croppedHeight, img.height),
            croppedX: firstNonNull(newPanoData?.croppedX, xmpPanoData?.croppedX, 0),
            croppedY: firstNonNull(newPanoData?.croppedY, xmpPanoData?.croppedY, 0),
            poseHeading: firstNonNull(newPanoData?.poseHeading, xmpPanoData?.poseHeading, 0),
            posePitch: firstNonNull(newPanoData?.posePitch, xmpPanoData?.posePitch, 0),
            poseRoll: firstNonNull(newPanoData?.poseRoll, xmpPanoData?.poseRoll, 0),
        };

        if (panoData.croppedWidth !== img.width || panoData.croppedHeight !== img.height) {
            logWarn(`Invalid panoData, croppedWidth/croppedHeight is not coherent with the loaded image.
            panoData: ${panoData.croppedWidth}x${panoData.croppedHeight}, image: ${img.width}x${img.height}`);
        }
        if (Math.abs(panoData.fullWidth - panoData.fullHeight * 2) > 1) {
            logWarn('Invalid panoData, fullWidth should be twice fullHeight');
            panoData.fullWidth = panoData.fullHeight * 2;
        }
        if (panoData.croppedX + panoData.croppedWidth > panoData.fullWidth) {
            logWarn('Invalid panoData, croppedX + croppedWidth > fullWidth');
            panoData.croppedX = panoData.fullWidth - panoData.croppedWidth;
        }
        if (panoData.croppedY + panoData.croppedHeight > panoData.fullHeight) {
            logWarn('Invalid panoData, croppedY + croppedHeight > fullHeight');
            panoData.croppedY = panoData.fullHeight - panoData.croppedHeight;
        }

        const texture = this.createEquirectangularTexture(img, panoData);

        return {
            panorama,
            texture,
            panoData,
            cacheKey: panorama,
        };
    }

    /**
     * Loads the XMP data of an image
     */
    private async loadXMP(blob: Blob): Promise<PanoData> {
        const binary = await this.loadBlobAsString(blob);

        const a = binary.indexOf('<x:xmpmeta');
        const b = binary.indexOf('</x:xmpmeta>');
        const data = binary.substring(a, b);

        if (a !== -1 && b !== -1 && data.includes('GPano:')) {
            return {
                isEquirectangular: true,
                fullWidth: getXMPValue(data, 'FullPanoWidthPixels'),
                fullHeight: getXMPValue(data, 'FullPanoHeightPixels'),
                croppedWidth: getXMPValue(data, 'CroppedAreaImageWidthPixels'),
                croppedHeight: getXMPValue(data, 'CroppedAreaImageHeightPixels'),
                croppedX: getXMPValue(data, 'CroppedAreaLeftPixels'),
                croppedY: getXMPValue(data, 'CroppedAreaTopPixels'),
                poseHeading: getXMPValue(data, 'PoseHeadingDegrees'),
                posePitch: getXMPValue(data, 'PosePitchDegrees'),
                poseRoll: getXMPValue(data, 'PoseRollDegrees'),
            };
        }

        return null;
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
    private createEquirectangularTexture(img: HTMLImageElement, panoData: PanoData): Texture {
        // resize image / fill cropped parts with black
        if (this.config.blur
            || panoData.fullWidth > SYSTEM.maxTextureWidth
            || panoData.croppedWidth !== panoData.fullWidth
            || panoData.croppedHeight !== panoData.fullHeight
        ) {
            const ratio = Math.min(1, SYSTEM.maxCanvasWidth / panoData.fullWidth);

            const resizedPanoData = {
                fullWidth: panoData.fullWidth * ratio,
                fullHeight: panoData.fullHeight * ratio,
                croppedWidth: panoData.croppedWidth * ratio,
                croppedHeight: panoData.croppedHeight * ratio,
                croppedX: panoData.croppedX * ratio,
                croppedY: panoData.croppedY * ratio,
            };

            const buffer = document.createElement('canvas');
            buffer.width = resizedPanoData.fullWidth;
            buffer.height = resizedPanoData.fullHeight;

            const ctx = buffer.getContext('2d');

            if (this.config.backgroundColor) {
                ctx.fillStyle = this.config.backgroundColor;
                ctx.fillRect(0, 0, buffer.width, buffer.height);
            }

            if (this.config.blur) {
                const blurSize = buffer.width / 2048;
                const margin = Math.ceil(blurSize * 2);

                // copy edges before applying the blur
                if (resizedPanoData.croppedWidth === buffer.width) {
                    ctx.drawImage(
                        img,
                        0, 0,
                        margin / ratio, img.height,
                        0, resizedPanoData.croppedY,
                        margin, resizedPanoData.croppedHeight
                    );
                    ctx.drawImage(
                        img,
                        img.width - margin / ratio, 0,
                        margin / ratio, img.height,
                        buffer.width - margin, resizedPanoData.croppedY,
                        margin, resizedPanoData.croppedHeight
                    );
                }
                if (resizedPanoData.croppedHeight === buffer.height) {
                    ctx.drawImage(
                        img,
                        0, 0,
                        1, 1,
                        resizedPanoData.croppedX, 0,
                        resizedPanoData.croppedWidth, margin
                    );
                    ctx.drawImage(
                        img,
                        0, img.height - 1,
                        1, 1,
                        resizedPanoData.croppedX, buffer.height - margin,
                        resizedPanoData.croppedWidth, margin
                    );
                }

                ctx.filter = `blur(${blurSize }px)`;
            }

            ctx.drawImage(
                img,
                resizedPanoData.croppedX,
                resizedPanoData.croppedY,
                resizedPanoData.croppedWidth,
                resizedPanoData.croppedHeight
            );

            const t = createTexture(buffer);

            if (this.config.interpolateBackground
                && resizedPanoData.fullWidth <= 8096
                && (
                    panoData.croppedWidth !== panoData.fullWidth
                    || panoData.croppedHeight !== panoData.fullHeight
                )) {
                this.interpolationWorker.postMessage({
                    image: ctx.getImageData(
                        resizedPanoData.croppedX,
                        resizedPanoData.croppedY,
                        resizedPanoData.croppedWidth,
                        resizedPanoData.croppedHeight
                    ),
                    panoData: resizedPanoData,
                });

                this.interpolationWorker.onmessage = (e) => {
                    ctx.putImageData(e.data, 0, 0);
                    t.needsUpdate = true;
                    this.viewer.needsUpdate();
                };
            }

            return t;
        }

        return createTexture(img);
    }

    createMesh(): EquirectangularMesh {
        // The middle of the panorama is placed at yaw=0
        const geometry = new SphereGeometry(
            SPHERE_RADIUS,
            this.SPHERE_SEGMENTS,
            this.SPHERE_HORIZONTAL_SEGMENTS,
            -Math.PI / 2
        ).scale(-1, 1, 1);

        return new Mesh(geometry, new MeshBasicMaterial());
    }

    setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTexture) {
        (mesh.material as MeshBasicMaterial).map = textureData.texture;
    }

    setTextureOpacity(mesh: EquirectangularMesh, opacity: number) {
        mesh.material.opacity = opacity;
        mesh.material.transparent = opacity < 1;
    }

    disposeTexture(textureData: EquirectangularTexture) {
        textureData.texture?.dispose();
    }

    private __defaultPanoData(img: HTMLImageElement): PanoData {
        const fullWidth = Math.max(img.width, img.height * 2);
        const fullHeight = Math.round(fullWidth / 2);
        const croppedX = Math.round((fullWidth - img.width) / 2);
        const croppedY = Math.round((fullHeight - img.height) / 2);

        return {
            isEquirectangular: true,
            fullWidth: fullWidth,
            fullHeight: fullHeight,
            croppedWidth: img.width,
            croppedHeight: img.height,
            croppedX: croppedX,
            croppedY: croppedY,
        };
    }
}
