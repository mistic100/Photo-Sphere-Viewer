import * as THREE from 'three';
import { CUBE_HASHMAP, CUBE_MAP } from '../data/constants';
import { SYSTEM } from '../data/system';
import { PSVError } from '../PSVError';
import { getXMPValue, logWarn, sum } from '../utils';
import { AbstractService } from './AbstractService';

/**
 * @summary Texture loader
 * @extends PSV.services.AbstractService
 * @memberof PSV.services
 */
export class TextureLoader extends AbstractService {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @summary Current HTTP requests
     * @type {XMLHttpRequest[]}
     * @private
     */
    this.requests = [];
  }

  /**
   * @override
   */
  destroy() {
    this.abortLoading();
    super.destroy();
  }

  /**
   * @summary Loads the panorama texture(s)
   * @param {string|string[]|PSV.Cubemap} panorama
   * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
   * @returns {Promise.<PSV.TextureData>}
   * @throws {PSV.PSVError} when the image cannot be loaded
   * @package
   */
  loadTexture(panorama, newPanoData) {
    const tempPanorama = [];

    if (Array.isArray(panorama)) {
      if (panorama.length !== 6) {
        throw new PSVError('Must provide exactly 6 image paths when using cubemap.');
      }

      // reorder images
      for (let i = 0; i < 6; i++) {
        tempPanorama[i] = panorama[CUBE_MAP[i]];
      }

      return this.__loadCubemapTexture(tempPanorama);
    }
    else if (typeof panorama === 'object') {
      if (!CUBE_HASHMAP.every(side => !!panorama[side])) {
        throw new PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.');
      }

      // transform into array
      CUBE_HASHMAP.forEach((side, i) => {
        tempPanorama[i] = panorama[side];
      });

      return this.__loadCubemapTexture(tempPanorama);
    }
    else {
      return this.__loadEquirectangularTexture(panorama, newPanoData);
    }
  }

  /**
   * @summary Cancels current HTTP requests
   */
  abortLoading() {
    [...this.requests].forEach(r => r.abort());
  }

  /**
   * @summary Loads a Blob with FileLoader
   * @param {string} url
   * @param {function(number)} [onProgress]
   * @returns {Promise<Blob>}
   * @private
   */
  __loadFile(url, onProgress) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      onProgress && onProgress(progress);

      const loader = new THREE.FileLoader();

      if (this.config.withCredentials) {
        loader.setWithCredentials(true);
      }

      loader.setResponseType('blob');

      const request = loader.load(
        url,
        (result) => {
          const rIdx = this.requests.indexOf(request);
          if (rIdx !== -1) this.requests.splice(rIdx, 1);

          progress = 100;
          onProgress && onProgress(progress);
          resolve(result);
        },
        (e) => {
          if (e.lengthComputable) {
            const newProgress = e.loaded / e.total * 100;
            if (newProgress > progress) {
              progress = newProgress;
              onProgress && onProgress(progress);
            }
          }
        },
        (err) => {
          const rIdx = this.requests.indexOf(request);
          if (rIdx !== -1) this.requests.splice(rIdx, 1);

          reject(err);
        }
      );

      // when we hit the cache, the result is the cache value
      if (request instanceof XMLHttpRequest) {
        this.requests.push(request);
      }
    });
  }

  /**
   * @summary Loads an Image using FileLoader to have progress events
   * @param {string} url
   * @param {function(number)} [onProgress]
   * @returns {Promise<Image>}
   * @private
   */
  __loadImage(url, onProgress) {
    return this.__loadFile(url, onProgress)
      .then(result => new Promise((resolve, reject) => {
        const img = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(result);
      }));
  }

  /**
   * @summmary read a Blob as string
   * @param {Blob} blob
   * @returns {Promise<string>}
   * @private
   */
  __loadBlobAsString(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  }

  /**
   * @summary Loads the sphere texture
   * @param {string} panorama
   * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
   * @returns {Promise.<PSV.TextureData>}
   * @throws {PSV.PSVError} when the image cannot be loaded
   * @private
   */
  __loadEquirectangularTexture(panorama, newPanoData) {
    /* eslint no-shadow: ["error", {allow: ["newPanoData"]}] */
    if (this.prop.isCubemap === true) {
      throw new PSVError('The viewer was initialized with an cubemap, cannot switch to equirectangular panorama.');
    }

    this.prop.isCubemap = false;

    return (
      newPanoData || !this.config.useXmpData
        ? this.__loadImage(panorama, p => this.psv.loader.setProgress(p))
          .then(img => ({ img, newPanoData }))
        : this.__loadXMP(panorama, p => this.psv.loader.setProgress(p))
          .then(newPanoData => this.__loadImage(panorama).then(img => ({ img, newPanoData })))
    )
      .then(({ img, newPanoData }) => {
        if (typeof newPanoData === 'function') {
          // eslint-disable-next-line no-param-reassign
          newPanoData = newPanoData(img);
        }

        const panoData = newPanoData || {
          fullWidth    : img.width,
          fullHeight   : img.height,
          croppedWidth : img.width,
          croppedHeight: img.height,
          croppedX     : 0,
          croppedY     : 0,
        };

        if (panoData.croppedWidth !== img.width || panoData.croppedHeight !== img.height) {
          logWarn(`Invalid panoData, croppedWidth and/or croppedHeight is not coherent with loaded image
    panoData: ${panoData.croppedWidth}x${panoData.croppedHeight}, image: ${img.width}x${img.height}`);
        }

        const texture = this.__createEquirectangularTexture(img, panoData);

        return { texture, panoData };
      });
  }

  /**
   * @summary Loads the XMP data of an image
   * @param {string} panorama
   * @param {function(number)} [onProgress]
   * @returns {Promise<PSV.PanoData>}
   * @throws {PSV.PSVError} when the image cannot be loaded
   * @private
   */
  __loadXMP(panorama, onProgress) {
    return this.__loadFile(panorama, onProgress)
      .then(blob => this.__loadBlobAsString(blob))
      .then((binary) => {
        const a = binary.indexOf('<x:xmpmeta');
        const b = binary.indexOf('</x:xmpmeta>');
        const data = binary.substring(a, b);
        let panoData = null;

        if (a !== -1 && b !== -1 && data.indexOf('GPano:') !== -1) {
          panoData = {
            fullWidth    : parseInt(getXMPValue(data, 'FullPanoWidthPixels'), 10),
            fullHeight   : parseInt(getXMPValue(data, 'FullPanoHeightPixels'), 10),
            croppedWidth : parseInt(getXMPValue(data, 'CroppedAreaImageWidthPixels'), 10),
            croppedHeight: parseInt(getXMPValue(data, 'CroppedAreaImageHeightPixels'), 10),
            croppedX     : parseInt(getXMPValue(data, 'CroppedAreaLeftPixels'), 10),
            croppedY     : parseInt(getXMPValue(data, 'CroppedAreaTopPixels'), 10),
          };

          if (!panoData.fullWidth || !panoData.fullHeight || !panoData.croppedWidth || !panoData.croppedHeight) {
            logWarn('invalid XMP data');
            panoData = null;
          }
        }

        return panoData;
      });
  }

  /**
   * @summary Creates the final texture from image and panorama data
   * @param {Image} img
   * @param {PSV.PanoData} panoData
   * @returns {external:THREE.Texture}
   * @private
   */
  __createEquirectangularTexture(img, panoData) {
    let texture;

    // resize image / fill cropped parts with black
    if (panoData.fullWidth > SYSTEM.maxTextureWidth
      || panoData.croppedWidth !== panoData.fullWidth
      || panoData.croppedHeight !== panoData.fullHeight
    ) {
      const resizedPanoData = { ...panoData };

      const ratio = SYSTEM.maxCanvasWidth / panoData.fullWidth;

      resizedPanoData.fullWidth *= ratio;
      resizedPanoData.fullHeight *= ratio;
      resizedPanoData.croppedWidth *= ratio;
      resizedPanoData.croppedHeight *= ratio;
      resizedPanoData.croppedX *= ratio;
      resizedPanoData.croppedY *= ratio;

      const buffer = document.createElement('canvas');
      buffer.width = resizedPanoData.fullWidth;
      buffer.height = resizedPanoData.fullHeight;

      const ctx = buffer.getContext('2d');
      ctx.drawImage(img,
        resizedPanoData.croppedX, resizedPanoData.croppedY,
        resizedPanoData.croppedWidth, resizedPanoData.croppedHeight);

      texture = new THREE.Texture(buffer);
    }
    else {
      texture = new THREE.Texture(img);
    }

    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    return texture;
  }

  /**
   * @summary Load the six textures of the cube
   * @param {string[]} panorama
   * @returns {Promise.<PSV.TextureData>}
   * @throws {PSV.PSVError} when the image cannot be loaded
   * @private
   */
  __loadCubemapTexture(panorama) {
    if (this.prop.isCubemap === false) {
      throw new PSVError('The viewer was initialized with an equirectangular panorama, cannot switch to cubemap.');
    }

    if (this.config.fisheye) {
      logWarn('fisheye effect with cubemap texture can generate distorsion');
    }

    this.prop.isCubemap = true;

    const promises = [];
    const progress = [0, 0, 0, 0, 0, 0];

    for (let i = 0; i < 6; i++) {
      promises.push(
        this.__loadImage(panorama[i], (p) => {
          progress[i] = p;
          this.psv.loader.setProgress(sum(progress) / 6);
        })
          .then(img => this.__createCubemapTexture(img))
      );
    }

    return Promise.all(promises)
      .then(texture => ({ texture }));
  }

  /**
   * @summary Creates the final texture from image
   * @param {Image} img
   * @returns {external:THREE.Texture}
   * @private
   */
  __createCubemapTexture(img) {
    let texture;

    // resize image
    if (img.width > SYSTEM.maxTextureWidth) {
      const buffer = document.createElement('canvas');
      const ratio = SYSTEM.maxCanvasWidth / img.width;

      buffer.width = img.width * ratio;
      buffer.height = img.height * ratio;

      const ctx = buffer.getContext('2d');
      ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

      texture = new THREE.Texture(buffer);
    }
    else {
      texture = new THREE.Texture(img);
    }

    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    return texture;
  }

  /**
   * @summary Preload a panorama file without displaying it
   * @param {string} panorama
   * @returns {Promise}
   */
  preloadPanorama(panorama) {
    return this.loadTexture(panorama);
  }

}
