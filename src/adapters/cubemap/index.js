import { BoxGeometry, Mesh, Texture } from 'three';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '../..';


/**
 * @typedef {Object} PSV.adapters.CubemapAdapter.Cubemap
 * @summary Object defining a cubemap
 * @property {string} left
 * @property {string} front
 * @property {string} right
 * @property {string} back
 * @property {string} top
 * @property {string} bottom
 */

/**
 * @typedef {Object} PSV.adapters.CubemapAdapter.Options
 * @property {boolean} [flipTopBottom=false] - set to true if the top and bottom faces are not correctly oriented
 */


// PSV faces order is left, front, right, back, top, bottom
// 3JS faces order is left, right, top, bottom, back, front
export const CUBE_ARRAY = [0, 2, 4, 5, 3, 1];
export const CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];


/**
 * @summary Adapter for cubemaps
 * @memberof PSV.adapters
 * @extends PSV.adapters.AbstractAdapter
 */
export class CubemapAdapter extends AbstractAdapter {

  static id = 'cubemap';
  static supportsDownload = false;
  static supportsOverlay = true;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.adapters.CubemapAdapter.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {PSV.adapters.CubemapAdapter.Options}
     * @private
     */
    this.config = {
      flipTopBottom: false,
      ...options,
    };
  }

  /**
   * @override
   */
  supportsTransition() {
    return true;
  }

  /**
   * @override
   */
  supportsPreload() {
    return true;
  }

  /**
   * @override
   * @param {string[] | PSV.adapters.CubemapAdapter.Cubemap} panorama
   * @returns {Promise.<PSV.TextureData>}
   */
  loadTexture(panorama) {
    const cleanPanorama = [];

    if (Array.isArray(panorama)) {
      if (panorama.length !== 6) {
        return Promise.reject(new PSVError('Must provide exactly 6 image paths when using cubemap.'));
      }

      // reorder images
      for (let i = 0; i < 6; i++) {
        cleanPanorama[i] = panorama[CUBE_ARRAY[i]];
      }
    }
    else if (typeof panorama === 'object') {
      if (!CUBE_HASHMAP.every(side => !!panorama[side])) {
        return Promise.reject(new PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.'));
      }

      // transform into array
      CUBE_HASHMAP.forEach((side, i) => {
        cleanPanorama[i] = panorama[side];
      });
    }
    else {
      return Promise.reject(new PSVError('Invalid cubemap panorama, are you using the right adapter?'));
    }

    if (this.psv.config.fisheye) {
      utils.logWarn('fisheye effect with cubemap texture can generate distorsion');
    }

    const promises = [];
    const progress = [0, 0, 0, 0, 0, 0];

    for (let i = 0; i < 6; i++) {
      promises.push(
        this.psv.textureLoader.loadImage(cleanPanorama[i], (p) => {
          progress[i] = p;
          this.psv.loader.setProgress(utils.sum(progress) / 6);
        })
          .then(img => this.__createCubemapTexture(img))
      );
    }

    return Promise.all(promises)
      .then(texture => ({ panorama, texture }));
  }

  /**
   * @summary Creates the final texture from image
   * @param {HTMLImageElement} img
   * @returns {external:THREE.Texture}
   * @private
   */
  __createCubemapTexture(img) {
    if (img.width !== img.height) {
      utils.logWarn('Invalid base image, the width equal the height');
    }

    // resize image
    if (img.width > SYSTEM.maxTextureWidth) {
      const ratio = SYSTEM.getMaxCanvasWidth() / img.width;

      const buffer = document.createElement('canvas');
      buffer.width = img.width * ratio;
      buffer.height = img.height * ratio;

      const ctx = buffer.getContext('2d');
      ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

      return utils.createTexture(buffer);
    }

    return utils.createTexture(img);
  }

  /**
   * @override
   */
  createMesh(scale = 1) {
    const cubeSize = CONSTANTS.SPHERE_RADIUS * 2 * scale;
    const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize)
      .scale(1, 1, -1);

    const materials = [];
    for (let i = 0; i < 6; i++) {
      materials.push(AbstractAdapter.createOverlayMaterial({
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
      }));
    }

    return new Mesh(geometry, materials);
  }

  /**
   * @override
   */
  setTexture(mesh, textureData) {
    const { texture } = textureData;

    for (let i = 0; i < 6; i++) {
      if (this.config.flipTopBottom && (i === 2 || i === 3)) {
        this.__setUniform(mesh, i, 'rotation', Math.PI);
      }

      this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.panorama, texture[i]);
    }

    this.setOverlay(mesh, null);
  }

  /**
   * @override
   */
  setOverlay(mesh, textureData, opacity) {
    for (let i = 0; i < 6; i++) {
      this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity, opacity);
      if (!textureData) {
        this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlay, new Texture());
      }
      else {
        this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlay, textureData.texture[i]);
      }
    }
  }

  /**
   * @override
   */
  setTextureOpacity(mesh, opacity) {
    for (let i = 0; i < 6; i++) {
      this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity, opacity);
      mesh.material[i].transparent = opacity < 1;
    }
  }

  /**
   * @override
   */
  disposeTexture(textureData) {
    textureData.texture?.forEach(texture => texture.dispose());
  }

  /**
   * @param {external:THREE.Mesh} mesh
   * @param {number} index
   * @param {string} uniform
   * @param {*} value
   * @private
   */
  __setUniform(mesh, index, uniform, value) {
    if (mesh.material[index].uniforms[uniform].value instanceof Texture) {
      mesh.material[index].uniforms[uniform].value.dispose();
    }
    mesh.material[index].uniforms[uniform].value = value;
  }

}
