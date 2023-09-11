import type { EquirectangularAdapterConfig, Position, Size, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularAdapter, events } from '@photo-sphere-viewer/core';
import { BufferGeometry, Euler, MathUtils, Matrix4, Mesh, PlaneGeometry, ShaderMaterial, Texture } from 'three';

type EquirectangularMesh = Mesh<BufferGeometry, ShaderMaterial>;
type EquirectangularTexture = TextureData<Texture, string>;

const euler = new Euler();

/**
 * Adapter for equirectangular panoramas displayed with little planet effect
 */
export class LittlePlanetAdapter extends EquirectangularAdapter {
    static override readonly id = 'little-planet';
    static override readonly supportsDownload = true;
    static override readonly supportsOverlay = false;

    private uniforms: ShaderMaterial['uniforms'];

    constructor(viewer: Viewer, config?: EquirectangularAdapterConfig) {
        super(viewer, config);

        this.viewer.state.littlePlanet = true;
    }

    override init() {
        super.init();

        this.viewer.addEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
    }

    override destroy(): void {
        this.viewer.removeEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);

        super.destroy();
    }

    override supportsTransition() {
        return false;
    }

    override supportsPreload() {
        return true;
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.SizeUpdatedEvent) {
            this.__setResolution(e.size);
        } else if (e instanceof events.ZoomUpdatedEvent) {
            this.__setZoom();
        } else if (e instanceof events.PositionUpdatedEvent) {
            this.__setPosition(e.position);
        }
    }

    override createMesh(): EquirectangularMesh {
        const geometry = new PlaneGeometry(20, 10).translate(0, 0, -1) as PlaneGeometry;

        // this one was copied from https://github.com/pchen66/panolens.js
        const material = new ShaderMaterial({
            uniforms: {
                panorama: { value: new Texture() },
                resolution: { value: 2.0 },
                transform: { value: new Matrix4() },
                zoom: { value: 10.0 },
                opacity: { value: 1.0 },
            },

            vertexShader: `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4( position, 1.0 );
}`,

            fragmentShader: `
uniform sampler2D panorama;
uniform float resolution;
uniform mat4 transform;
uniform float zoom;
uniform float opacity;

varying vec2 vUv;

const float PI = 3.1415926535897932384626433832795;

void main() {
  vec2 position = -1.0 + 2.0 * vUv;
  position *= vec2( zoom * resolution, zoom * 0.5 );

  float x2y2 = position.x * position.x + position.y * position.y;
  vec3 sphere_pnt = vec3( 2. * position, x2y2 - 1. ) / ( x2y2 + 1. );
  sphere_pnt = vec3( transform * vec4( sphere_pnt, 1.0 ) );

  vec2 sampleUV = vec2(
    1.0 - (atan(sphere_pnt.y, sphere_pnt.x) / PI + 1.0) * 0.5,
    (asin(sphere_pnt.z) / PI + 0.5)
  );

  gl_FragColor = texture2D( panorama, sampleUV );
  gl_FragColor.a *= opacity;
}`,
        });

        this.uniforms = material.uniforms;

        return new Mesh(geometry, material);
    }

    override setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTexture) {
        mesh.material.uniforms.panorama.value.dispose();
        mesh.material.uniforms.panorama.value = textureData.texture;
    }

    private __setResolution(size: Size) {
        this.uniforms.resolution.value = size.width / size.height;
    }

    private __setZoom() {
        // mapping values are empirical
        this.uniforms.zoom.value = Math.max(0.1, MathUtils.mapLinear(this.viewer.state.vFov, 90, 30, 50, 2));
    }

    private __setPosition(position: Position) {
        euler.set(Math.PI / 2 + position.pitch, 0, -Math.PI / 2 - position.yaw, 'ZYX');

        this.uniforms.transform.value.makeRotationFromEuler(euler);
    }
}
