import type { AdapterConstructor, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { CONSTANTS, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, BufferAttribute, Mesh, ShaderMaterial, Texture, Vector2, VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { CubemapVideoAdapterConfig, CubemapVideoData, CubemapVideoPanorama } from './model';
import equiangularFragment from './shaders/equiangular.fragment.glsl';
import equiangularVertex from './shaders/equiangular.vertex.glsl';

type CubemapVideoMesh = Mesh<BoxGeometry, ShaderMaterial>;
type CubemapVideoTextureData = TextureData<VideoTexture, CubemapVideoPanorama, CubemapVideoData>;

type ShaderUniforms = {
    map: { value: Texture };
    equiangular: { value: boolean };
    contCorrect: { value: number };
    faceWH: { value: Vector2 };
    vidWH: { value: Vector2 };
};

const getConfig = utils.getConfigParser<CubemapVideoAdapterConfig>({
    autoplay: false,
    muted: false,
});

/**
 * Adapter for cubemap videos
 */
export class CubemapVideoAdapter extends AbstractVideoAdapter<CubemapVideoPanorama, CubemapVideoData, CubemapVideoMesh> {
    static override readonly id = 'cubemap-video';
    static override readonly VERSION = PKG_VERSION;

    protected override readonly config: CubemapVideoAdapterConfig;

    static withConfig(config: CubemapVideoAdapterConfig): [AdapterConstructor, any] {
        return [CubemapVideoAdapter, config];
    }

    constructor(viewer: Viewer, config: CubemapVideoAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);
    }

    override async loadTexture(panorama: CubemapVideoPanorama): Promise<CubemapVideoTextureData> {
        const { texture } = await super.loadTexture(panorama);

        const panoData: CubemapVideoData = {
            isCubemap: true,
            equiangular: panorama.equiangular ?? true,
        };

        return { panorama, texture, panoData };
    }

    createMesh({ panoData }: CubemapVideoTextureData): CubemapVideoMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2;
        const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1).toNonIndexed() as BoxGeometry;
        this.__setUVs(geometry);

        const material = new ShaderMaterial({
            uniforms: {
                map: { value: null },
                equiangular: { value: panoData.equiangular },
                contCorrect: { value: 1 },
                faceWH: { value: new Vector2(1 / 3, 1 / 2) },
                vidWH: { value: new Vector2(1, 1) },
            } satisfies ShaderUniforms,
            vertexShader: equiangularVertex,
            fragmentShader: equiangularFragment,
            depthTest: false,
            depthWrite: false,
        });

        return new Mesh(geometry, material);
    }

    setTexture(mesh: CubemapVideoMesh, { texture }: CubemapVideoTextureData) {
        const video = texture.image as HTMLVideoElement;
        const uniforms = mesh.material.uniforms as ShaderUniforms;

        uniforms.map.value = texture;
        uniforms.vidWH.value.set(video.videoWidth, video.videoHeight);

        this.switchVideo(texture);
    }

    private __setUVs(geometry: BoxGeometry) {
        geometry.clearGroups();

        const uvs = geometry.getAttribute('uv') as BufferAttribute;

        /*
          Structure of a frame

          1 +---------+---------+---------+
            |         |         |         |
            |  Left   |  Front  |  Right  |
            |         |         |         |
        1/2 +---------+---------+---------+
            |         |         |         |
            | Bottom  |  Back   |   Top   |
            |         |         |         |
          0 +---------+---------+---------+
            0        1/3       2/3        1

           Bottom, Back and Top are rotated 90° clockwise
         */

        // columns
        const a = 0;
        const b = 1 / 3;
        const c = 2 / 3;
        const d = 1;

        // lines
        const A = 1;
        const B = 1 / 2;
        const C = 0;

        // left
        uvs.setXY(0, a, A);
        uvs.setXY(1, a, B);
        uvs.setXY(2, b, A);
        uvs.setXY(3, a, B);
        uvs.setXY(4, b, B);
        uvs.setXY(5, b, A);

        // right
        uvs.setXY(6, c, A);
        uvs.setXY(7, c, B);
        uvs.setXY(8, d, A);
        uvs.setXY(9, c, B);
        uvs.setXY(10, d, B);
        uvs.setXY(11, d, A);

        // top
        uvs.setXY(12, d, B);
        uvs.setXY(13, c, B);
        uvs.setXY(14, d, C);
        uvs.setXY(15, c, B);
        uvs.setXY(16, c, C);
        uvs.setXY(17, d, C);

        // bottom
        uvs.setXY(18, b, B);
        uvs.setXY(19, a, B);
        uvs.setXY(20, b, C);
        uvs.setXY(21, a, B);
        uvs.setXY(22, a, C);
        uvs.setXY(23, b, C);

        // back
        uvs.setXY(24, c, B);
        uvs.setXY(25, b, B);
        uvs.setXY(26, c, C);
        uvs.setXY(27, b, B);
        uvs.setXY(28, b, C);
        uvs.setXY(29, c, C);

        // front
        uvs.setXY(30, b, A);
        uvs.setXY(31, b, B);
        uvs.setXY(32, c, A);
        uvs.setXY(33, b, B);
        uvs.setXY(34, c, B);
        uvs.setXY(35, c, A);
    }
}
