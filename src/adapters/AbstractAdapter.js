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
   * @summary Indicates if the adapter supports transitions between panoramas
   * @member {boolean}
   * @readonly
   * @static
   */
  static supportsTransition = false;

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
   * @abstract
   * @summary Loads the panorama texture(s)
   * @param {*} panorama
   * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
   * @returns {Promise.<PSV.TextureData>}
   */
  loadTexture(panorama, newPanoData) { // eslint-disable-line no-unused-vars
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
   */
  setTexture(mesh, textureData) { // eslint-disable-line no-unused-vars
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

}
