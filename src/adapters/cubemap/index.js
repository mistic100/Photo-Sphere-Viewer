import * as THREE from 'three';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '../..';

/**
 * @typedef {Object} PSV.adapters.CubemapAdapter.Cubemap
 * @summary Object defining a cubemap
 * @property {string} top
 * @property {string} right
 * @property {string} bottom
 * @property {string} left
 * @property {string} front
 * @property {string} back
 */

const CUBE_VERTICES = 8;
const CUBE_MAP = [0, 2, 4, 5, 3, 1];
const CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];

/**
 * @summary Adapter for cubemaps
 * @memberof PSV.adapters
 */
export class CubemapAdapter extends AbstractAdapter {

  static id = 'cubemap';
  static supportsTransition = true;

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
        cleanPanorama[i] = panorama[CUBE_MAP[i]];
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
      .then(texture => ({ texture }));
  }

  /**
   * @summary Creates the final texture from image
   * @param {HTMLImageElement} img
   * @returns {external:THREE.Texture}
   * @private
   */
  __createCubemapTexture(img) {
    let finalImage;

    // resize image
    if (img.width > SYSTEM.maxTextureWidth) {
      const buffer = document.createElement('canvas');
      const ratio = SYSTEM.getMaxCanvasWidth() / img.width;

      buffer.width = img.width * ratio;
      buffer.height = img.height * ratio;

      const ctx = buffer.getContext('2d');
      ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

      finalImage = buffer;
    }
    else {
      finalImage = img;
    }

    return utils.createTexture(finalImage);
  }

  /**
   * @override
   */
  createMesh(scale = 1) {
    const cubeSize = CONSTANTS.SPHERE_RADIUS * 2 * scale;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_VERTICES, CUBE_VERTICES, CUBE_VERTICES);

    const materials = [];
    for (let i = 0; i < 6; i++) {
      materials.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
      }));
    }

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.scale.set(1, 1, -1);

    return mesh;
  }

  /**
   * @override
   */
  setTexture(mesh, textureData) {
    const { texture } = textureData;

    for (let i = 0; i < 6; i++) {
      if (mesh.material[i].map) {
        mesh.material[i].map.dispose();
      }

      mesh.material[i].map = texture[i];
    }
  }

  /**
   * @override
   */
  setTextureOpacity(mesh, opacity) {
    for (let i = 0; i < 6; i++) {
      mesh.material[i].opacity = opacity;
      mesh.material[i].transparent = opacity < 1;
    }
  }

}
