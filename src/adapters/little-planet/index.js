import { MathUtils, Matrix4, Mesh, PlaneBufferGeometry, Quaternion, ShaderMaterial, Texture, Vector3 } from 'three';
import { CONSTANTS, DEFAULTS, EquirectangularAdapter } from '../..';


DEFAULTS.moveSpeed = 2;

const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);


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

    this.prop = {
      quatA   : new Quaternion(),
      quatB   : new Quaternion(),
      quatC   : new Quaternion(),
      position: { longitude: 0, latitude: 0 },
    };

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
        this.__setZoom(e.args[0]);
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
   * @param {integer} zoom
   * @private
   */
  __setZoom(zoom) {
    this.uniforms.zoom.value = MathUtils.mapLinear(zoom, 0, 100, 50, 2);
  }

  /**
   * @param {PSV.Position} position
   * @private
   */
  __setPosition(position) {
    this.prop.quatA.setFromAxisAngle(AXIS_Y, this.prop.position.longitude - position.longitude);
    this.prop.quatB.setFromAxisAngle(AXIS_X, -this.prop.position.latitude + position.latitude);
    this.prop.quatC.multiply(this.prop.quatA).multiply(this.prop.quatB);
    this.uniforms.transform.value.makeRotationFromQuaternion(this.prop.quatC);
    this.prop.position = position;
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
        tDiffuse  : { value: new Texture() },
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
uniform sampler2D tDiffuse;
uniform float resolution;
uniform mat4 transform;
uniform float zoom;
uniform float opacity;

varying vec2 vUv;

const float PI = 3.1415926535897932384626433832795;

void main() {
  vec2 position = -1.0 +  2.0 * vUv;
  position *= vec2( zoom * resolution, zoom * 0.5 );

  float x2y2 = position.x * position.x + position.y * position.y;
  vec3 sphere_pnt = vec3( 2. * position, x2y2 - 1. ) / ( x2y2 + 1. );
  sphere_pnt = vec3( transform * vec4( sphere_pnt, 1.0 ) );

  vec2 sampleUV = vec2(
    (atan(sphere_pnt.y, sphere_pnt.x) / PI + 1.0) * 0.5,
    (asin(sphere_pnt.z) / PI + 0.5)
  );

  gl_FragColor = texture2D( tDiffuse, sampleUV );
  gl_FragColor.a *= opacity;
}`,
    });

    this.uniforms = material.uniforms;

    this.__setPosition({
      longitude: this.psv.config.defaultLong,
      latitude : this.psv.config.defaultLat,
    });

    this.__setZoom(this.psv.config.defaultZoomLvl);

    return new Mesh(geometry, material);
  }

  /**
   * @override
   */
  setTexture(mesh, textureData) {
    mesh.material.uniforms.tDiffuse.value.dispose();
    mesh.material.uniforms.tDiffuse.value = textureData.texture;
  }

}
