import type { AdapterConstructor, EquirectangularAdapterConfig, EquirectangularPanorama, EquirectangularTextureData, PanoData, PanoDataProvider, PanoramaPosition, Position, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, EquirectangularAdapter } from '@photo-sphere-viewer/core';
import { Mesh, RepeatWrapping, ShaderMaterial, SphereGeometry, Texture, Vector2 } from 'three';

import equirectangularFragment from './equirectangular.fragment.glsl';
import equirectangularVertex from './equirectangular.vertex.glsl';

export type EquirectangularRaycastAdapterConfig = Omit<EquirectangularAdapterConfig, 'resolution'>;

export type ShaderUniforms = {
    map: { value: Texture };
    opacity: { value: number };
    uvOffset: { value: Vector2 };
    uvScale: { value: Vector2 };
    radius: { value: number };
};

export type EquirectangularRaycastMesh = Mesh<SphereGeometry, ShaderMaterial>;

// Minimum tessellation that still wraps the sphere; the shader does the real work per-pixel.
const SPHERE_SEGMENTS = 4;
const SPHERE_HORIZONTAL_SEGMENTS = 2;

/**
 * Adapter for equirectangular panoramas that computes the texture mapping
 * mathematically in the fragment shader instead of relying on UV interpolation
 * across vertices.
 */
export class EquirectangularRaycastAdapter extends AbstractAdapter<
    string | EquirectangularPanorama,
    PanoData,
    Texture,
    EquirectangularRaycastMesh
> {
    static override readonly id: string = 'equirectangular-raycast';
    static override readonly VERSION = PKG_VERSION;
    static override readonly supportsDownload: boolean = true;

    private readonly adapter: EquirectangularAdapter;

    static withConfig(config: EquirectangularRaycastAdapterConfig): [AdapterConstructor, any] {
        return [EquirectangularRaycastAdapter, config];
    }

    constructor(viewer: Viewer, config?: EquirectangularRaycastAdapterConfig) {
        super(viewer);
        this.adapter = new EquirectangularAdapter(viewer, config);
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: PanoData): Position {
        return this.adapter.textureCoordsToSphericalCoords(point, data);
    }

    override sphericalCoordsToTextureCoords(position: Position, data: PanoData): PanoramaPosition {
        return this.adapter.sphericalCoordsToTextureCoords(position, data);
    }

    async loadTexture(
        panorama: string | EquirectangularPanorama,
        loader?: boolean,
        newPanoData?: PanoData | PanoDataProvider,
        useXmpPanoData?: boolean,
    ): Promise<EquirectangularTextureData> {
        const result = await this.adapter.loadTexture(panorama, loader, newPanoData, useXmpPanoData);
        if (result.panoData.croppedWidth === result.panoData.fullWidth) {
            result.texture.wrapS = RepeatWrapping;
        }
        return result;
    }

    createMesh(panoData: PanoData): EquirectangularRaycastMesh {
        const geometry = new SphereGeometry(
            CONSTANTS.SPHERE_RADIUS,
            SPHERE_SEGMENTS,
            SPHERE_HORIZONTAL_SEGMENTS,
        ).scale(-1, 1, 1);

        const uniforms: ShaderUniforms = {
            map: { value: null },
            opacity: { value: 1.0 },
            uvOffset: { value: new Vector2(
                panoData.croppedX / panoData.fullWidth,
                // V is computed bottom-up in the shader (north pole = 1), so
                // the offset is the distance from the bottom of the full pano
                // to the bottom of the cropped region, not the top.
                (panoData.fullHeight - panoData.croppedY - panoData.croppedHeight) / panoData.fullHeight,
            ) },
            uvScale: { value: new Vector2(
                panoData.croppedWidth / panoData.fullWidth,
                panoData.croppedHeight / panoData.fullHeight,
            ) },
            radius: { value: CONSTANTS.SPHERE_RADIUS },
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
    }

    setTexture(mesh: EquirectangularRaycastMesh, textureData: EquirectangularTextureData) {
        mesh.material.uniforms.map.value = textureData.texture;
    }

    setTextureOpacity(mesh: EquirectangularRaycastMesh, opacity: number) {
        mesh.material.uniforms.opacity.value = opacity;
    }

    disposeTexture({ texture }: EquirectangularTextureData) {
        texture.dispose();
    }

    disposeMesh(mesh: EquirectangularRaycastMesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
}
