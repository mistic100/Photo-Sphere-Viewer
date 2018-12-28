import * as THREE from 'three';
import { DEFAULTS } from '../data/config';
import { CUBE_HASHMAP, CUBE_MAP, EVENTS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { PSVError } from '../PSVError';
import { clone, getXMPValue, logWarn, sum } from '../utils';
import { AbstractService } from './AbstractService';

/**
 * @summary Texture loader
 * @extends module:services.AbstractService
 * @memberof module:services
 */
class PSVTextureLoader extends AbstractService {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @member {PhotoSphereViewer.CacheItem[]}
     * @protected
     */
    this.cache = [];
  }

  /**
   * @override
   */
  destroy() {
    this.cache.length = 0;

    super.destroy();
  }

  /**
   * @summary Loads the panorama texture(s)
   * @param {string|string[]} panorama
   * @returns {Promise.<PhotoSphereViewer.TextureData>}
   * @fires module:services.PSVTextureLoader.panorama-load-progress
   * @throws {PSVError} when the image cannot be loaded
   * @package
   */
  loadTexture(panorama) {
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
      return this.__loadEquirectangularTexture(panorama);
    }
  }

  /**
   * @summary Loads the sphere texture
   * @param {string} panorama
   * @returns {Promise.<PhotoSphereViewer.TextureData>}
   * @fires module:services.PSVTextureLoader.panorama-load-progress
   * @throws {PSVError} when the image cannot be loaded
   * @private
   */
  __loadEquirectangularTexture(panorama) {
    if (this.prop.isCubemap === true) {
      throw new PSVError('The viewer was initialized with an cubemap, cannot switch to equirectangular panorama.');
    }

    this.prop.isCubemap = false;

    if (this.config.cacheTexture) {
      const cache = this.getPanoramaCache(panorama);

      if (cache) {
        return Promise.resolve({
          texture : cache.image,
          panoData: cache.panoData,
        });
      }
    }

    return this.__loadXMP(panorama)
      .then(xmpPanoData => new Promise((resolve, reject) => {
        const loader = new THREE.ImageLoader();
        let progress = xmpPanoData ? 100 : 0;

        if (this.config.withCredentials) {
          loader.setCrossOrigin('use-credentials');
        }
        else {
          loader.setCrossOrigin('anonymous');
        }

        const onload = (img) => {
          progress = 100;

          this.psv.loader.setProgress(progress);

          /**
           * @event panorama-load-progress
           * @memberof module:services.PSVTextureLoader
           * @summary Triggered while a panorama image is loading
           * @param {string} panorama
           * @param {number} progress
           */
          this.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama, progress);

          const panoData = xmpPanoData || this.config.panoData || {
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

          let texture;

          const ratio = Math.min(panoData.fullWidth, SYSTEM.maxTextureWidth) / panoData.fullWidth;

          // resize image / fill cropped parts with black
          if (ratio !== 1
            || panoData.croppedWidth !== panoData.fullWidth
            || panoData.croppedHeight !== panoData.fullHeight
          ) {
            const resizedPanoData = clone(panoData);

            resizedPanoData.fullWidth *= ratio;
            resizedPanoData.fullHeight *= ratio;
            resizedPanoData.croppedWidth *= ratio;
            resizedPanoData.croppedHeight *= ratio;
            resizedPanoData.croppedX *= ratio;
            resizedPanoData.croppedY *= ratio;

            img.width = resizedPanoData.croppedWidth;
            img.height = resizedPanoData.croppedHeight;

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

          if (this.config.cacheTexture) {
            this.__putPanoramaCache({
              panorama: panorama,
              image   : texture,
              panoData: clone(panoData),
            });
          }

          resolve({ texture, panoData });
        };

        const onprogress = (e) => {
          if (e.lengthComputable) {
            const newProgress = e.loaded / e.total * 100;

            if (newProgress > progress) {
              progress = newProgress;
              this.psv.loader.setProgress(progress);
              this.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama, progress);
            }
          }
        };

        const onerror = (e) => {
          this.psv.showError(this.config.lang.loadError);
          reject(e);
        };

        loader.load(panorama, onload, onprogress, onerror);
      }));
  }

  /**
   * @summary Load the six textures of the cube
   * @param {string[]} panorama
   * @returns {Promise.<PhotoSphereViewer.TextureData>}
   * @fires module:services.PSVTextureLoader.panorama-load-progress
   * @throws {PSVError} when the image cannot be loaded
   * @private
   */
  __loadCubemapTexture(panorama) {
    if (this.prop.isCubemap === false) {
      throw new PSVError('The viewer was initialized with an equirectangular panorama, cannot switch to cubemap.');
    }

    if (this.config.fisheye) {
      logWarn('fisheye effect with cubemap texture can generate distorsion');
    }

    if (this.config.cacheTexture === DEFAULTS.cacheTexture) {
      this.config.cacheTexture *= 6;
    }

    this.prop.isCubemap = true;

    return new Promise((resolve, reject) => {
      const loader = new THREE.ImageLoader();
      const progress = [0, 0, 0, 0, 0, 0];
      const loaded = [];
      let done = 0;

      if (this.config.withCredentials) {
        loader.setCrossOrigin('use-credentials');
      }
      else {
        loader.setCrossOrigin('anonymous');
      }

      const onend = () => {
        loaded.forEach((img) => {
          img.needsUpdate = true;
          img.minFilter = THREE.LinearFilter;
          img.generateMipmaps = false;
        });

        resolve({ texture: loaded });
      };

      const onload = (i, img) => {
        done++;
        progress[i] = 100;

        this.psv.loader.setProgress(sum(progress) / 6);
        this.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama[i], progress[i]);

        const ratio = Math.min(img.width, SYSTEM.maxTextureWidth / 2) / img.width;

        // resize image
        if (ratio !== 1) {
          const buffer = document.createElement('canvas');
          buffer.width = img.width * ratio;
          buffer.height = img.height * ratio;

          const ctx = buffer.getContext('2d');
          ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

          loaded[i] = new THREE.Texture(buffer);
        }
        else {
          loaded[i] = new THREE.Texture(img);
        }

        if (this.config.cacheTexture) {
          this.__putPanoramaCache({
            panorama: panorama[i],
            image   : loaded[i],
          });
        }

        if (done === 6) {
          onend();
        }
      };

      const onprogress = (i, e) => {
        if (e.lengthComputable) {
          const newProgress = e.loaded / e.total * 100;

          if (newProgress > progress[i]) {
            progress[i] = newProgress;
            this.psv.loader.setProgress(sum(progress) / 6);
            this.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama[i], progress[i]);
          }
        }
      };

      const onerror = (i, e) => {
        this.psv.showError(this.config.lang.loadError);
        reject(e);
      };

      for (let i = 0; i < 6; i++) {
        if (this.config.cacheTexture) {
          const cache = this.getPanoramaCache(panorama[i]);

          if (cache) {
            done++;
            progress[i] = 100;
            loaded[i] = cache.image;
          }
        }

        if (!loaded[i]) {
          loader.load(panorama[i], onload.bind(this, i), onprogress.bind(this, i), onerror.bind(this, i));
        }
      }

      if (done === 6) {
        resolve({ texture: loaded });
      }
    });
  }

  /**
   * @summary Loads the XMP data with AJAX
   * @param {string} panorama
   * @returns {Promise.<PhotoSphereViewer.PanoData>}
   * @throws {PSVError} when the image cannot be loaded
   * @private
   */
  __loadXMP(panorama) {
    if (!this.config.useXmpData || this.config.panoData) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      let progress = 0;

      const xhr = new XMLHttpRequest();
      if (this.config.withCredentials) {
        xhr.withCredentials = true;
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 0) {
            this.psv.loader.setProgress(100);

            const binary = xhr.responseText;
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

            resolve(panoData);
          }
          else {
            this.psv.showError(this.config.lang.loadError);
            reject();
          }
        }
        else if (xhr.readyState === 3) {
          this.psv.loader.setProgress(progress += 10);
        }
      };

      xhr.onprogress = (e) => {
        if (e.lengthComputable) {
          const newProgress = e.loaded / e.total * 100;
          if (newProgress > progress) {
            progress = newProgress;
            this.psv.loader.setProgress(progress);
          }
        }
      };

      xhr.onerror = (e) => {
        this.psv.showError(this.config.lang.loadError);
        reject(e);
      };

      xhr.open('GET', panorama, true);
      xhr.send(null);
    });
  }

  /**
   * @summary Preload a panorama file without displaying it
   * @param {string} panorama
   * @returns {Promise}
   * @throws {PSVError} when the cache is disabled
   */
  preloadPanorama(panorama) {
    if (!this.config.cacheTexture) {
      throw new PSVError('Cannot preload panorama, cacheTexture is disabled');
    }

    return this.loadTexture(panorama);
  }

  /**
   * @summary Removes a panorama from the cache or clears the entire cache
   * @param {string} [panorama]
   * @throws {PSVError} when the cache is disabled
   */
  clearPanoramaCache(panorama) {
    if (!this.config.cacheTexture) {
      throw new PSVError('Cannot clear cache, cacheTexture is disabled');
    }

    if (panorama) {
      for (let i = 0, l = this.cache.length; i < l; i++) {
        if (this.cache[i].panorama === panorama) {
          this.cache.splice(i, 1);
          break;
        }
      }
    }
    else {
      this.cache.length = 0;
    }
  }

  /**
   * @summary Retrieves the cache for a panorama
   * @param {string} panorama
   * @returns {PhotoSphereViewer.CacheItem}
   * @throws {PSVError} when the cache is disabled
   */
  getPanoramaCache(panorama) {
    if (!this.config.cacheTexture) {
      throw new PSVError('Cannot query cache, cacheTexture is disabled');
    }

    return this.cache.filter(cache => cache.panorama === panorama).shift();
  }

  /**
   * @summary Adds a panorama to the cache
   * @param {PhotoSphereViewer.CacheItem} cache
   * @fires module:services.PSVTextureLoader.panorama-cached
   * @throws {PSVError} when the cache is disabled
   * @private
   */
  __putPanoramaCache(cache) {
    if (!this.config.cacheTexture) {
      throw new PSVError('Cannot add panorama to cache, cacheTexture is disabled');
    }

    const existingCache = this.getPanoramaCache(cache.panorama);

    if (existingCache) {
      existingCache.image = cache.image;
      existingCache.panoData = cache.panoData;
    }
    else {
      this.cache.splice(0, 1); // remove most ancient elements
      this.cache.push(cache);
    }

    /**
     * @event panorama-cached
     * @memberof module:services.PSVTextureLoader
     * @summary Triggered when a panorama is stored in the cache
     * @param {string} panorama
     */
    this.psv.trigger(EVENTS.PANORAMA_CACHED, cache.panorama);
  }

}

export { PSVTextureLoader };
