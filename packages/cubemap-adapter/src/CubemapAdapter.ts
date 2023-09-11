import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, Mesh, ShaderMaterial, Texture } from 'three';
import {
    Cubemap,
    CubemapAdapterConfig,
    CubemapFaces,
    CubemapNet,
    CubemapPanorama,
    CubemapSeparate,
    CubemapStripe,
} from './model';
import { cleanCubemap, cleanCubemapArray, isCubemap } from './utils';

type CubemapMesh = Mesh<BoxGeometry, ShaderMaterial[]>;
type CubemapTexture = TextureData<Texture[], CubemapPanorama>;

const getConfig = utils.getConfigParser<CubemapAdapterConfig>({
    flipTopBottom: false,
    blur: false,
});

/**
 * Adapter for cubemaps
 */
export class CubemapAdapter extends AbstractAdapter<CubemapPanorama, Texture[]> {
    static override readonly id = 'cubemap';
    static override readonly supportsDownload = false;
    static override readonly supportsOverlay = true;

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

    async loadTexture(panorama: CubemapPanorama): Promise<CubemapTexture> {
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

        let texture: Texture[];
        let cacheKey: string;
        switch (cleanPanorama.type) {
            case 'separate': {
                let paths: string[];
                if (Array.isArray(cleanPanorama.paths)) {
                    paths = cleanCubemapArray(cleanPanorama.paths as string[]);
                } else {
                    paths = cleanCubemap(cleanPanorama.paths as Cubemap);
                }

                cacheKey = paths[0];
                texture = await this.loadTexturesSeparate(paths, cacheKey);
                break;
            }

            case 'stripe':
                cacheKey = cleanPanorama.path;
                texture = await this.loadTexturesStripe(cleanPanorama.path, cleanPanorama.order, cacheKey);
                break;

            case 'net':
                cacheKey = cleanPanorama.path;
                texture = await this.loadTexturesNet(cleanPanorama.path, cacheKey);
                break;

            default:
                throw new PSVError('Invalid cubemap panorama, are you using the right adapter?');
        }

        return { panorama, texture, cacheKey };
    }

    private loadTexturesSeparate(paths: string[], cacheKey: string): Promise<Texture[]> {
        const promises: Array<Promise<Texture>> = [];
        const progress = [0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 6; i++) {
            promises.push(
                this.viewer.textureLoader
                    .loadImage(paths[i], (p) => {
                        progress[i] = p;
                        this.viewer.loader.setProgress(utils.sum(progress) / 6);
                    }, cacheKey)
                    .then((img) => this.createCubemapTexture(img))
            );
        }

        return Promise.all(promises);
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

    private async loadTexturesStripe(
        path: string,
        order: CubemapStripe['order'] = ['left', 'front', 'right', 'back', 'top', 'bottom'],
        cacheKey: string
    ): Promise<Texture[]> {
        const img = await this.viewer.textureLoader.loadImage(path, (p) => this.viewer.loader.setProgress(p), cacheKey);

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

            textures[order[i]] = utils.createTexture(buffer);
        }

        return cleanCubemap(textures);
    }

    private async loadTexturesNet(path: string, cacheKey: string): Promise<Texture[]> {
        const img = await this.viewer.textureLoader.loadImage(path, (p) => this.viewer.loader.setProgress(p), cacheKey);

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

        return textures;
    }

    createMesh(scale = 1): CubemapMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2 * scale;
        const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1) as BoxGeometry;

        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(
                AbstractAdapter.createOverlayMaterial({
                    additionalUniforms: {
                        rotation: { value: 0.0 },
                    },
                    overrideVertexShader: `
uniform float rotation;
varying vec2 vUv;
const float mid = 0.5;
void main() {
  if (rotation == 0.0) {
    vUv = uv;
  } else {
    vUv = vec2(
      cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
      cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
  }
  gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}`,
                })
            );
        }

        return new Mesh(geometry, materials);
    }

    setTexture(mesh: CubemapMesh, textureData: CubemapTexture) {
        const { texture, panorama } = textureData;
        const isNet = (panorama as CubemapNet).type === 'net';
        const flipTopBottom = isNet ? !this.config.flipTopBottom : this.config.flipTopBottom;

        for (let i = 0; i < 6; i++) {
            if (flipTopBottom && (i === 2 || i === 3)) {
                this.__setUniform(mesh, i, 'rotation', Math.PI);
            }

            this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.panorama, texture[i]);
        }
    }

    setOverlay(mesh: CubemapMesh, textureData: CubemapTexture, opacity: number) {
        for (let i = 0; i < 6; i++) {
            this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity, opacity);
            if (!textureData) {
                this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlay, null);
            } else {
                this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlay, textureData.texture[i]);
            }
        }
    }

    setTextureOpacity(mesh: CubemapMesh, opacity: number) {
        for (let i = 0; i < 6; i++) {
            this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity, opacity);
            mesh.material[i].transparent = opacity < 1;
        }
    }

    disposeTexture(textureData: CubemapTexture) {
        textureData.texture?.forEach((texture) => texture.dispose());
    }

    private __setUniform(mesh: CubemapMesh, index: number, uniform: string, value: any) {
        mesh.material[index].uniforms[uniform].value = value;
    }
}
