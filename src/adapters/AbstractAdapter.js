import { ShaderMaterial, Texture } from 'three';
import { PSVError } from '../PSVError';

/**
 * @namespace PSV.adapters
 */


/**
 * @summary Base adapters class
 * @memberof PSV.adapters
 * @abstract
 */
export class AbstractAdapter {

  /**
   * @summary Unique identifier of the adapter
   * @member {string}
   * @readonly
   * @static
   */
  static id = null;

  /**
   * @summary Indicates if the adapter supports panorama download natively
   * @type {boolean}
   * @readonly
   * @static
   */
  static supportsDownload = false;

  /**
   * @summary Indicated if the adapter can display an additional transparent image above the panorama
   * @type {boolean}
   */
  static supportsOverlay = false;

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    /**
     * @summary Reference to main controller
     * @type {PSV.Viewer}
     * @readonly
     */
    this.psv = psv;
  }

  /**
   * @summary Destroys the adapter
   */
  destroy() {
    delete this.psv;
  }

  /**
   * @summary Indicates if the adapter supports transitions between panoramas
   * @param {*} panorama
   * @return {boolean}
   */
  supportsTransition(panorama) { // eslint-disable-line no-unused-vars
    return false;
  }

  /**
   * @summary Indicates if the adapter supports preload of a panorama
   * @param {*} panorama
   * @return {boolean}
   */
  supportsPreload(panorama) { // eslint-disable-line no-unused-vars
    return false;
  }

  /**
   * @abstract
   * @summary Loads the panorama texture(s)
   * @param {*} panorama
   * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
   * @param {boolean} [useXmpPanoData]
   * @returns {Promise.<PSV.TextureData>}
   */
  loadTexture(panorama, newPanoData, useXmpPanoData) { // eslint-disable-line no-unused-vars
    throw new PSVError('loadTexture not implemented');
  }

  /**
   * @abstract
   * @summary Creates the cube mesh
   * @param {number} [scale=1]
   * @returns {external:THREE.Mesh}
   */
  createMesh(scale = 1) { // eslint-disable-line no-unused-vars
    throw new PSVError('createMesh not implemented');
  }

  /**
   * @abstract
   * @summary Applies the texture to the mesh
   * @param {external:THREE.Mesh} mesh
   * @param {PSV.TextureData} textureData
   * @param {boolean} [transition=false]
   */
  setTexture(mesh, textureData, transition = false) { // eslint-disable-line no-unused-vars
    throw new PSVError('setTexture not implemented');
  }

  /**
   * @abstract
   * @summary Changes the opacity of the mesh
   * @param {external:THREE.Mesh} mesh
   * @param {number} opacity
   */
  setTextureOpacity(mesh, opacity) { // eslint-disable-line no-unused-vars
    throw new PSVError('setTextureOpacity not implemented');
  }

  /**
   * @abstract
   * @summary Clear a loaded texture from memory
   * @param {PSV.TextureData} textureData
   */
  disposeTexture(textureData) { // eslint-disable-line no-unused-vars
    throw new PSVError('disposeTexture not implemented');
  }

  /**
   * @abstract
   * @summary Applies the overlay to the mesh
   * @param {external:THREE.Mesh} mesh
   * @param {PSV.TextureData} textureData
   * @param {number} opacity
   */
  setOverlay(mesh, textureData, opacity) { // eslint-disable-line no-unused-vars
    throw new PSVError('setOverlay not implemented');
  }

  /**
   * @internal
   */
  static OVERLAY_UNIFORMS = {
    panorama      : 'panorama',
    overlay       : 'overlay',
    globalOpacity : 'globalOpacity',
    overlayOpacity: 'overlayOpacity',
  };

  /**
   * @internal
   */
  static createOverlayMaterial({ additionalUniforms, overrideVertexShader } = {}) {
    return new ShaderMaterial({
      uniforms: {
        ...additionalUniforms,
        [AbstractAdapter.OVERLAY_UNIFORMS.panorama]      : { value: new Texture() },
        [AbstractAdapter.OVERLAY_UNIFORMS.overlay]       : { value: new Texture() },
        [AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity] : { value: 1.0 },
        [AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity]: { value: 1.0 },
      },

      vertexShader: overrideVertexShader || `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}`,

      fragmentShader: `
uniform sampler2D ${AbstractAdapter.OVERLAY_UNIFORMS.panorama};
uniform sampler2D ${AbstractAdapter.OVERLAY_UNIFORMS.overlay};
uniform float ${AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity};
uniform float ${AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity};

varying vec2 vUv;

void main() {
  vec4 tColor1 = texture2D( ${AbstractAdapter.OVERLAY_UNIFORMS.panorama}, vUv );
  vec4 tColor2 = texture2D( ${AbstractAdapter.OVERLAY_UNIFORMS.overlay}, vUv );
  gl_FragColor = vec4(
    mix( tColor1.rgb, tColor2.rgb, tColor2.a * ${AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity} ),
    ${AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity}
  );
}`,
    });
  }

}
