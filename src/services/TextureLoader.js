import { FileLoader } from 'three';
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
     * @summary THREE file loader
     * @type {external:THREE:FileLoader}
     * @private
     */
    this.loader = new FileLoader();
    this.loader.setResponseType('blob');
    if (this.config.withCredentials) {
      this.loader.setWithCredentials(true);
    }
    if (this.config.requestHeaders && typeof this.config.requestHeaders === 'object') {
      this.loader.setRequestHeader(this.config.requestHeaders);
    }
  }

  /**
   * @override
   */
  destroy() {
    this.abortLoading();
    super.destroy();
  }

  /**
   * @summary Cancels current HTTP requests
   * @package
   */
  abortLoading() {
    // noop implementation waiting for https://github.com/mrdoob/three.js/pull/23070
  }

  /**
   * @summary Loads a Blob with FileLoader
   * @param {string} url
   * @param {function(number)} [onProgress]
   * @returns {Promise<Blob>}
   */
  loadFile(url, onProgress) {
    if (this.config.requestHeaders && typeof this.config.requestHeaders === 'function') {
      this.loader.setRequestHeader(this.config.requestHeaders(url));
    }

    return new Promise((resolve, reject) => {
      let progress = 0;
      onProgress?.(progress);

      this.loader.load(
        url,
        (result) => {
          progress = 100;
          onProgress?.(progress);
          resolve(result);
        },
        (e) => {
          if (e.lengthComputable) {
            const newProgress = e.loaded / e.total * 100;
            if (newProgress > progress) {
              progress = newProgress;
              onProgress?.(progress);
            }
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * @summary Loads an Image using FileLoader to have progress events
   * @param {string} url
   * @param {function(number)} [onProgress]
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(url, onProgress) {
    return this.loadFile(url, onProgress)
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
   * @summary Preload a panorama file without displaying it
   * @param {*} panorama
   * @returns {Promise}
   */
  preloadPanorama(panorama) {
    if (this.psv.adapter.supportsPreload(panorama)) {
      return this.psv.adapter.loadTexture(panorama);
    }
    else {
      return Promise.resolve();
    }
  }

}
