import type { AdapterConstructor, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, utils } from '@photo-sphere-viewer/core';
import { Mesh, ShaderMaterial, SphereGeometry, Texture } from 'three';
import { DualFisheyeAdapterConfig, DualFisheyePanorama } from './model';

import dualFisheyeFragment from './shaders/dual-fisheye.fragment.glsl';
import dualFisheyeVertex from './shaders/dual-fisheye.vertex.glsl';

export type DualFisheyeMesh = Mesh<SphereGeometry, ShaderMaterial>;
type DualFisheyeTextureData = TextureData<Texture, string | DualFisheyePanorama, null>;

/**
 * Adapter for dual-fisheye panoramas
 * @see https://github.com/acalcutt/Gear360_html5_viewer
 */
export class DualFisheyeAdapter extends AbstractAdapter<string | DualFisheyePanorama, null, Texture, DualFisheyeMesh> {
    static override readonly id: string = 'dual-fisheye';
    static override readonly VERSION = PKG_VERSION;
    static override readonly supportsDownload = true;

    static withConfig(config: DualFisheyeAdapterConfig): [AdapterConstructor, any] {
        return [DualFisheyeAdapter, config];
    }

    constructor(viewer: Viewer) {
        super(viewer);
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    override async loadTexture(panorama: string | DualFisheyePanorama, loader?: boolean): Promise<DualFisheyeTextureData> {
        if (typeof panorama !== 'string' && (typeof panorama !== 'object' || !panorama.path)) {
            return Promise.reject(new PSVError('Invalid panorama url, are you using the right adapter?'));
        }

        let cleanPanorama: DualFisheyePanorama;
        if (typeof panorama === 'string') {
            cleanPanorama = {
                path: panorama,
            };
        } else {
            cleanPanorama = {
                ...panorama,
            };
        }

        const img = await this.viewer.textureLoader.loadImage(
            cleanPanorama.path,
            loader ? p => this.viewer.textureLoader.dispatchProgress(p) : null,
            cleanPanorama.path,
        );

        const texture = utils.createSizedTexture(img);

        return {
            panorama,
            texture,
        };
    }

    override createMesh(): DualFisheyeMesh {
        const geometry = new SphereGeometry(CONSTANTS.SPHERE_RADIUS, 32, 16).scale(-1, 1, 1);

        geometry.rotateX(-Math.PI / 2);
        geometry.rotateY(Math.PI);

        const material = new ShaderMaterial({
            uniforms: {
                map: { value: null },
                opacity: { value: 1.0 },
            },
            vertexShader: dualFisheyeVertex,
            fragmentShader: dualFisheyeFragment,
            depthTest: false,
            depthWrite: false,
            transparent: true,
        });

        return new Mesh(geometry, material);
    }

    override setTexture(mesh: DualFisheyeMesh, textureData: DualFisheyeTextureData) {
        mesh.material.uniforms.map.value = textureData.texture;
    }

    override setTextureOpacity(mesh: DualFisheyeMesh, opacity: number) {
        mesh.material.uniforms.opacity.value = opacity;
    }

    override disposeTexture({ texture }: DualFisheyeTextureData) {
        texture.dispose();
    }

    override disposeMesh(mesh: DualFisheyeMesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
}
