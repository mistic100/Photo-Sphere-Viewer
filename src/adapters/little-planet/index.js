import { Euler, MathUtils, Matrix4, Mesh, PlaneBufferGeometry, ShaderMaterial, Texture } from 'three';
import { CONSTANTS, DEFAULTS, EquirectangularAdapter } from '../..';


DEFAULTS.defaultLat = -Math.PI / 2;

const euler = new Euler();


/**
 * @summary Adapter for equirectangular panoramas displayed with little planet effect
 * @memberof PSV.adapters
 * @extends PSV.adapters.AbstractAdapter
 */
export class LittlePlanetAdapter extends EquirectangularAdapter {

  static id = 'little-planet';
  static supportsOverlay = false;

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    this.psv.prop.littlePlanet = true;

    this.psv.on(CONSTANTS.EVENTS.SIZE_UPDATED, this);
    this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
    this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
  }

  /**
   * @override
   */
  supportsTransition() {
    return false;
  }

  /**
   * @override
   */
  supportsPreload() {
    return true;
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case CONSTANTS.EVENTS.SIZE_UPDATED:
        this.__setResolution(e.args[0]);
        break;
      case CONSTANTS.EVENTS.ZOOM_UPDATED:
        this.__setZoom();
        break;
      case CONSTANTS.EVENTS.POSITION_UPDATED:
        this.__setPosition(e.args[0]);
        break;
    }
    /* eslint-enable */
  }

  /**
   * @param {PSV.Size} size
   * @private
   */
  __setResolution(size) {
    this.uniforms.resolution.value = size.width / size.height;
  }

  /**
   * @private
   */
  __setZoom() {
    // mapping values are empirical
    this.uniforms.zoom.value = Math.max(0.1, MathUtils.mapLinear(this.psv.prop.vFov, 90, 30, 50, 2));
  }

  /**
   * @param {PSV.Position} position
   * @private
   */
  __setPosition(position) {
    euler.set(
      Math.PI / 2 + position.latitude,
      0,
      -Math.PI / 2 - position.longitude,
      'ZYX'
    );

    this.uniforms.transform.value.makeRotationFromEuler(euler);
  }

  /**
   * @override
   */
  createMesh() {
    const geometry = new PlaneBufferGeometry(20, 10)
      .translate(0, 0, -1);

    // this one was copied from https://github.com/pchen66/panolens.js
    const material = new ShaderMaterial({
      uniforms: {
        panorama  : { value: new Texture() },
        resolution: { value: 2.0 },
        transform : { value: new Matrix4() },
        zoom      : { value: 10.0 },
        opacity   : { value: 1.0 },
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

  /**
   * @override
   */
  setTexture(mesh, textureData) {
    mesh.material.uniforms.panorama.value.dispose();
    mesh.material.uniforms.panorama.value = textureData.texture;
  }

}
