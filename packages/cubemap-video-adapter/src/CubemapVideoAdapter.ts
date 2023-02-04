import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { CONSTANTS, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, BufferAttribute, Mesh, ShaderMaterial, Vector2, VideoTexture } from 'three';
import { AbstractVideoAdapter } from '../../shared/AbstractVideoAdapter';
import { CubemapVideoAdapterConfig, CubemapVideoPanorama } from './model';

type CubemapMesh = Mesh<BoxGeometry, ShaderMaterial>;
type CubemapTexture = TextureData<VideoTexture>;

const getConfig = utils.getConfigParser<CubemapVideoAdapterConfig>({
    equiangular: true,
    autoplay: false,
    muted: false,
});

/**
 * Adapter for cubemap videos
 */
export class CubemapVideoAdapter extends AbstractVideoAdapter<CubemapVideoPanorama> {
    static override readonly id = 'cubemap-video';

    protected override readonly config: CubemapVideoAdapterConfig;

    constructor(viewer: Viewer, config: CubemapVideoAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);
    }

    createMesh(scale = 1): CubemapMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2 * scale;
        const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1).toNonIndexed() as BoxGeometry;

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

        // shamelessly copied from https://github.com/videojs/videojs-vr
        const material = new ShaderMaterial({
            uniforms: {
                mapped: { value: null },
                contCorrect: { value: 1 },
                faceWH: { value: new Vector2(1 / 3, 1 / 2) },
                vidWH: { value: new Vector2(1, 1) },
            },
            vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`,
            fragmentShader: `
varying vec2 vUv;
uniform sampler2D mapped;
uniform vec2 faceWH;
uniform vec2 vidWH;
uniform float contCorrect;

const float PI = 3.1415926535897932384626433832795;

void main() {
  vec2 corner = vUv - mod(vUv, faceWH) + vec2(0, contCorrect / vidWH.y);
  vec2 faceWHadj = faceWH - vec2(0, contCorrect * 2. / vidWH.y);
  vec2 p = (vUv - corner) / faceWHadj - .5;
  vec2 q = ${this.config.equiangular ? '2. / PI * atan(2. * p) + .5' : 'p + .5'};
  vec2 eUv = corner + q * faceWHadj;
  gl_FragColor = texture2D(mapped, eUv);
}`,
        });

        return new Mesh(geometry, material);
    }

    setTexture(mesh: CubemapMesh, textureData: CubemapTexture) {
        const { texture } = textureData;
        const video: HTMLVideoElement = texture.image;

        mesh.material.uniforms.mapped.value?.dispose();
        mesh.material.uniforms.mapped.value = texture;
        mesh.material.uniforms.vidWH.value.set(video.videoWidth, video.videoHeight);

        this.switchVideo(textureData.texture);
    }
}
