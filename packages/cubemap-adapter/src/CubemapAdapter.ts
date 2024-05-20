import type { PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, MathUtils, Mesh, MeshBasicMaterial, Texture, Vector2, Vector3 } from 'three';
import {
    Cubemap,
    CubemapAdapterConfig,
    CubemapData,
    CubemapFaces,
    CubemapNet,
    CubemapPanorama,
    CubemapSeparate,
    CubemapStripe,
} from './model';
import { cleanCubemap, cleanCubemapArray, isCubemap } from './utils';

type CubemapMesh = Mesh<BoxGeometry, MeshBasicMaterial[]>;
type CubemapTexture = TextureData<Texture[], CubemapPanorama, CubemapData>;

const getConfig = utils.getConfigParser<CubemapAdapterConfig>({
    blur: false,
});

const EPS = 0.000001;
const ORIGIN = new Vector3();

/**
 * Adapter for cubemaps
 */
export class CubemapAdapter extends AbstractAdapter<CubemapPanorama, Texture[], CubemapData> {
    static override readonly id = 'cubemap';
    static override readonly VERSION = PKG_VERSION;
    static override readonly supportsDownload = false;

    private readonly config: CubemapAdapterConfig;

    constructor(viewer: Viewer, config: CubemapAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    /**
     * {@link https://github.com/bhautikj/vrProjector/blob/master/vrProjector/CubemapProjection.py#L130}
     */
    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: CubemapData): Position {
        if (utils.isNil(point.textureX) || utils.isNil(point.textureY) || utils.isNil(point.textureFace)) {
            throw new PSVError(`Texture position is missing 'textureX', 'textureY' or 'textureFace'`);
        }

        const u = 2 * (point.textureX / data.faceSize - 0.5);
        const v = 2 * (point.textureY / data.faceSize - 0.5);

        function yawPitch(x: number, y: number, z: number): [number, number] {
            const dv = Math.sqrt(x * x + y * y + z * z);
            return [Math.atan2(y / dv, x / dv), -Math.asin(z / dv)];
        }

        let yaw: number;
        let pitch: number;
        switch (point.textureFace) {
            case 'front':
                [yaw, pitch] = yawPitch(1, u, v);
                break;
            case 'right':
                [yaw, pitch] = yawPitch(-u, 1, v);
                break;
            case 'left':
                [yaw, pitch] = yawPitch(u, -1, v);
                break;
            case 'back':
                [yaw, pitch] = yawPitch(-1, -u, v);
                break;
            case 'bottom':
                [yaw, pitch] = data.flipTopBottom ? yawPitch(-v, u, 1) : yawPitch(v, -u, 1);
                break;
            case 'top':
                [yaw, pitch] = data.flipTopBottom ? yawPitch(v, u, -1) : yawPitch(-v, -u, -1);
                break;
        }

        return { yaw, pitch };
    }

    override sphericalCoordsToTextureCoords(position: Position, data: CubemapData): PanoramaPosition {
        // @ts-ignore
        const raycaster = this.viewer.renderer.raycaster;
        // @ts-ignore
        const mesh = this.viewer.renderer.mesh;
        raycaster.set(ORIGIN, this.viewer.dataHelper.sphericalCoordsToVector3(position));
        const point = raycaster.intersectObject(mesh)[0].point.multiplyScalar(1 / CONSTANTS.SPHERE_RADIUS);

        function mapUV(x: number, a1: number, a2: number): number {
            return Math.round(MathUtils.mapLinear(x, a1, a2, 0, data.faceSize));
        }

        let textureFace: CubemapFaces;
        let textureX: number;
        let textureY: number;
        if (1 - Math.abs(point.z) < EPS) {
            if (point.z > 0) {
                textureFace = 'front';
                textureX = mapUV(point.x, 1, -1);
                textureY = mapUV(point.y, 1, -1);
            } else {
                textureFace = 'back';
                textureX = mapUV(point.x, -1, 1);
                textureY = mapUV(point.y, 1, -1);
            }
        } else if (1 - Math.abs(point.x) < EPS) {
            if (point.x > 0) {
                textureFace = 'left';
                textureX = mapUV(point.z, -1, 1);
                textureY = mapUV(point.y, 1, -1);
            } else {
                textureFace = 'right';
                textureX = mapUV(point.z, 1, -1);
                textureY = mapUV(point.y, 1, -1);
            }
        } else {
            if (point.y > 0) {
                textureFace = 'top';
                textureX = mapUV(point.x, -1, 1);
                textureY = mapUV(point.z, 1, -1);
            } else {
                textureFace = 'bottom';
                textureX = mapUV(point.x, -1, 1);
                textureY = mapUV(point.z, -1, 1);
            }
            if (data.flipTopBottom) {
                textureX = data.faceSize - textureX;
                textureY = data.faceSize - textureY;
            }
        }

        return { textureFace, textureX, textureY };
    }

    async loadTexture(panorama: CubemapPanorama, loader = true): Promise<CubemapTexture> {
        if (this.viewer.config.fisheye) {
            utils.logWarn('fisheye effect with cubemap texture can generate distorsion');
        }

        let cleanPanorama: CubemapSeparate | CubemapStripe | CubemapNet;
        if (Array.isArray(panorama) || isCubemap(panorama)) {
            cleanPanorama = {
                type: 'separate',
                paths: panorama,
            } as CubemapSeparate;
        } else {
            cleanPanorama = panorama as any;
        }

        let result: { textures: Texture[]; flipTopBottom: boolean; cacheKey: string };
        switch (cleanPanorama.type) {
            case 'separate':
                result = await this.loadTexturesSeparate(cleanPanorama, loader);
                break;

            case 'stripe':
                result = await this.loadTexturesStripe(cleanPanorama, loader);
                break;

            case 'net':
                result = await this.loadTexturesNet(cleanPanorama, loader);
                break;

            default:
                throw new PSVError('Invalid cubemap panorama, are you using the right adapter?');
        }

        return {
            panorama,
            texture: result.textures,
            cacheKey: result.cacheKey,
            panoData: {
                isCubemap: true,
                flipTopBottom: result.flipTopBottom,
                faceSize: (result.textures[0].image as HTMLImageElement | HTMLCanvasElement).width,
            },
        };
    }

    private async loadTexturesSeparate(panorama: CubemapSeparate, loader: boolean) {
        let paths: string[];
        if (Array.isArray(panorama.paths)) {
            paths = cleanCubemapArray(panorama.paths as string[]);
        } else {
            paths = cleanCubemap(panorama.paths as Cubemap);
        }

        const cacheKey = paths[0];
        const promises: Array<Promise<Texture>> = [];
        const progress = [0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 6; i++) {
            promises.push(
                this.viewer.textureLoader
                    .loadImage(paths[i], loader ? (p) => {
                        progress[i] = p;
                        this.viewer.loader.setProgress(utils.sum(progress) / 6);
                    } : null, cacheKey)
                    .then((img) => this.createCubemapTexture(img))
            );
        }

        return {
            textures: await Promise.all(promises),
            cacheKey,
            flipTopBottom: panorama.flipTopBottom ?? false,
        };
    }

    private createCubemapTexture(img: HTMLImageElement): Texture {
        if (img.width !== img.height) {
            utils.logWarn('Invalid cubemap image, the width should equal the height');
        }

        // resize image
        if (this.config.blur || img.width > SYSTEM.maxTextureWidth) {
            const ratio = Math.min(1, SYSTEM.maxCanvasWidth / img.width);

            const buffer = document.createElement('canvas');
            buffer.width = img.width * ratio;
            buffer.height = img.height * ratio;

            const ctx = buffer.getContext('2d');

            if (this.config.blur) {
                ctx.filter = `blur(${buffer.width / 512}px)`;
            }

            ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

            return utils.createTexture(buffer);
        }

        return utils.createTexture(img);
    }

    private async loadTexturesStripe(panorama: CubemapStripe, loader: boolean) {
        if (!panorama.order) {
            panorama.order = ['left', 'front', 'right', 'back', 'top', 'bottom'];
        }

        const cacheKey = panorama.path;
        const img = await this.viewer.textureLoader.loadImage(
            panorama.path,
            loader ? (p) => this.viewer.loader.setProgress(p) : null,
            cacheKey
        );

        if (img.width !== img.height * 6) {
            utils.logWarn('Invalid cubemap image, the width should be six times the height');
        }

        const ratio = Math.min(1, SYSTEM.maxCanvasWidth / img.height);
        const tileWidth = img.height * ratio;

        const textures = {} as { [K in CubemapFaces]: Texture };

        for (let i = 0; i < 6; i++) {
            const buffer = document.createElement('canvas');
            buffer.width = tileWidth;
            buffer.height = tileWidth;

            const ctx = buffer.getContext('2d');

            if (this.config.blur) {
                ctx.filter = 'blur(1px)';
            }

            ctx.drawImage(
                img,
                img.height * i, 0,
                img.height, img.height,
                0, 0,
                tileWidth, tileWidth
            );

            textures[panorama.order[i]] = utils.createTexture(buffer);
        }

        return {
            textures: cleanCubemap(textures),
            cacheKey,
            flipTopBottom: panorama.flipTopBottom ?? false,
        };
    }

    private async loadTexturesNet(panorama: CubemapNet, loader: boolean) {
        const cacheKey = panorama.path;
        const img = await this.viewer.textureLoader.loadImage(
            panorama.path,
            loader ? (p) => this.viewer.loader.setProgress(p) : null,
            cacheKey
        );

        if (img.width / 4 !== img.height / 3) {
            utils.logWarn('Invalid cubemap image, the width should be 4/3rd of the height');
        }

        const ratio = Math.min(1, SYSTEM.maxCanvasWidth / (img.width / 4));
        const tileWidth = (img.width / 4) * ratio;

        const pts = [
            [0, 1 / 3], // left
            [1 / 2, 1 / 3], // right
            [1 / 4, 0], // top
            [1 / 4, 2 / 3], // bottom
            [3 / 4, 1 / 3], // back
            [1 / 4, 1 / 3], // front
        ];

        const textures: Texture[] = [];

        for (let i = 0; i < 6; i++) {
            const buffer = document.createElement('canvas');
            buffer.width = tileWidth;
            buffer.height = tileWidth;

            const ctx = buffer.getContext('2d');

            if (this.config.blur) {
                ctx.filter = 'blur(1px)';
            }

            ctx.drawImage(
                img,
                img.width * pts[i][0], img.height * pts[i][1],
                img.width / 4, img.height / 3,
                0, 0,
                tileWidth, tileWidth
            );

            textures[i] = utils.createTexture(buffer);
        }

        return {
            textures,
            cacheKey,
            flipTopBottom: true,
        };
    }

    createMesh(): CubemapMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2;
        const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1);

        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(new MeshBasicMaterial());
        }

        return new Mesh(geometry, materials);
    }

    setTexture(mesh: CubemapMesh, textureData: CubemapTexture) {
        const { texture, panoData } = textureData;

        for (let i = 0; i < 6; i++) {
            if (panoData.flipTopBottom && (i === 2 || i === 3)) {
                texture[i].center = new Vector2(0.5, 0.5);
                texture[i].rotation = Math.PI;
            }

            mesh.material[i].map = texture[i];
        }
    }

    setTextureOpacity(mesh: CubemapMesh, opacity: number) {
        for (let i = 0; i < 6; i++) {
            mesh.material[i].opacity = opacity;
            mesh.material[i].transparent = opacity < 1;
        }
    }

    disposeTexture(textureData: CubemapTexture) {
        textureData.texture?.forEach((texture) => texture.dispose());
    }
}
