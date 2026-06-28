import { MathUtils, Mesh, MeshBasicMaterial, ShaderMaterial, SphereGeometry, Texture, Vector2 } from 'three';
import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { SPHERE_RADIUS } from '../data/constants';
import { EquirectangularPanorama, PanoData, PanoDataProvider, PanoramaPosition, Position, TextureData } from '../model';
import { createSizedTexture, getConfigParser, getXMPValue, isNil, mergePanoData } from '../utils';
import { AbstractAdapter, AdapterConstructor } from './AbstractAdapter';

import equirectangularFragment from './shaders/equirectangular.fragment.glsl';
import equirectangularVertex from './shaders/equirectangular.vertex.glsl';

/**
 * Configuration for {@link EquirectangularAdapter}
 */
export type EquirectangularAdapterConfig = {
    /**
     * use a raycasting shader for better quality on poles
     * @default false
     */
    shader?: boolean;
    /**
     * (only if `shader=false`)
     * number of faces of the sphere geometry, higher values may decrease performances
     * @default 64
     */
    resolution?: number;
    /**
     * read real image size from XMP data
     * @default true
     */
    useXmpData?: boolean;
};

export type EquirectangularMesh = Mesh<SphereGeometry, MeshBasicMaterial | ShaderMaterial>;
export type EquirectangularTextureData = TextureData<Texture, string | EquirectangularPanorama, PanoData>;

type ShaderUniforms = {
    map: { value: Texture };
    opacity: { value: number };
    radius: { value: number };
    uvOffset: { value: Vector2 };
    uvScale: { value: Vector2 };
};

const getConfig = getConfigParser<EquirectangularAdapterConfig>(
    {
        shader: false,
        resolution: 64,
        useXmpData: true,
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

    static withConfig(config: EquirectangularAdapterConfig): [AdapterConstructor, any] {
        return [EquirectangularAdapter, config];
    }

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
            loader ? p => this.viewer.textureLoader.dispatchProgress(p) : null,
            cleanPanorama.path,
        );
        const xmpPanoData = useXmpPanoData ? await this.loadXMP(blob) : null;
        const img = await this.viewer.textureLoader.blobToImage(blob);

        if (typeof cleanPanorama.data === 'function') {
            cleanPanorama.data = cleanPanorama.data(img, xmpPanoData);
        }

        const panoData = mergePanoData(img.width, img.height, cleanPanorama.data, xmpPanoData);

        const texture = createSizedTexture(img, cleanPanorama.blur ? { factor: 2048 } : null);

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

    createMesh(panoData: PanoData): EquirectangularMesh {
        if (this.config.shader) {
            // Minimum tessellation that still wraps the sphere and is compatible with extreme fisheye values
            const geometry = new SphereGeometry(SPHERE_RADIUS, 32, 16).scale(-1, 1, 1);

            const uniforms: ShaderUniforms = {
                map: { value: null },
                opacity: { value: 1.0 },
                radius: { value: SPHERE_RADIUS },
                uvOffset: {
                    value: new Vector2(
                        panoData.croppedX / panoData.fullWidth,
                        // V is computed bottom-up in the shader (north pole = 1), so
                        // the offset is the distance from the bottom of the full pano
                        // to the bottom of the cropped region, not the top.
                        (panoData.fullHeight - panoData.croppedY - panoData.croppedHeight) / panoData.fullHeight,
                    ),
                },
                uvScale: {
                    value: new Vector2(
                        panoData.croppedWidth / panoData.fullWidth,
                        panoData.croppedHeight / panoData.fullHeight,
                    ),
                },
            };

            const material = new ShaderMaterial({
                uniforms,
                vertexShader: equirectangularVertex,
                fragmentShader: equirectangularFragment,
                depthTest: false,
                depthWrite: false,
                transparent: true,
            });

            return new Mesh(geometry, material);
        } else {
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
    }

    setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTextureData) {
        if (this.config.shader) {
            (mesh.material as ShaderMaterial).uniforms.map.value = textureData.texture;
        } else {
            (mesh.material as MeshBasicMaterial).map = textureData.texture;
        }
    }

    setTextureOpacity(mesh: EquirectangularMesh, opacity: number) {
        if (this.config.shader) {
            (mesh.material as ShaderMaterial).uniforms.opacity.value = opacity;
        } else {
            mesh.material.opacity = opacity;
            mesh.material.transparent = opacity < 1;
        }
    }

    disposeTexture({ texture }: EquirectangularTextureData) {
        texture.dispose();
    }

    disposeMesh(mesh: EquirectangularMesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
}
