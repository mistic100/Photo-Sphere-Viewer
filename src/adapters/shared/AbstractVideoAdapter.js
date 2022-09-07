import { VideoTexture } from 'three';
import { AbstractAdapter, CONSTANTS, PSVError } from '../..';

/**
 * @typedef {Object} PSV.adapters.AbstractVideoAdapter.Video
 * @summary Object defining a video
 * @property {string} source
 */

/**
 * @typedef {Object} PSV.adapters.AbstractVideoAdapter.Options
 * @property {boolean} [autoplay=false] - automatically start the video
 * @property {boolean} [muted=autoplay] - initially mute the video
 */

/**
 * @summary Base video adapters class
 * @memberof PSV.adapters
 * @abstract
 * @private
 */
export class AbstractVideoAdapter extends AbstractAdapter {

  constructor(psv, options) {
    super(psv);

    /**
     * @member {PSV.adapters.AbstractVideoAdapter.Options}
     * @private
     */
    this.config = {
      autoplay: false,
      muted   : options?.autoplay ?? false,
      ...options,
    };

    /**
     * @member {HTMLVideoElement}
     * @private
     */
    this.video = null;

    this.psv.on(CONSTANTS.EVENTS.BEFORE_RENDER, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.BEFORE_RENDER, this);

    this.__removeVideo();

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case CONSTANTS.EVENTS.BEFORE_RENDER:
        if (this.video) {
          this.psv.needsUpdate();
        }
        break;
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @param {PSV.adapters.AbstractVideoAdapter.Video} panorama
   * @returns {Promise.<PSV.TextureData>}
   */
  loadTexture(panorama) {
    if (typeof panorama !== 'object' || !panorama.source) {
      return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?'));
    }

    if (!this.psv.getPlugin('video')) {
      return Promise.reject(new PSVError('Video adapters require VideoPlugin to be loaded too.'));
    }

    const video = this.__createVideo(panorama.source);

    return this.__videoLoadPromise(video)
      .then(() => {
        const texture = new VideoTexture(video);
        return { panorama, texture };
      });
  }

  /**
   * @override
   */
  __switchVideo(texture) {
    let currentTime;
    let duration;
    let paused = !this.config.autoplay;
    let muted = this.config.muted;
    let volume = 1;
    if (this.video) {
      ({ currentTime, duration, paused, muted, volume } = this.video);
    }

    this.__removeVideo();
    this.video = texture.image;

    // keep current time when switching resolution
    if (this.video.duration === duration) {
      this.video.currentTime = currentTime;
    }

    // keep volume
    this.video.muted = muted;
    this.video.volume = volume;

    // play
    if (!paused) {
      this.video.play();
    }
  }

  /**
   * @override
   */
  disposeTexture(textureData) {
    if (textureData.texture) {
      const video = textureData.texture.image;
      video.pause();
      this.psv.container.removeChild(video);
    }
    textureData.texture?.dispose();
  }

  /**
   * @summary Removes the current video element
   * @private
   */
  __removeVideo() {
    if (this.video) {
      this.video.pause();
      this.psv.container.removeChild(this.video);
      delete this.video;
    }
  }

  /**
   * @summary Creates a new video element
   * @memberOf PSV.adapters
   * @param {string} src
   * @return {HTMLVideoElement}
   * @private
   */
  __createVideo(src) {
    const video = document.createElement('video');
    video.crossOrigin = this.psv.config.withCredentials ? 'use-credentials' : 'anonymous';
    video.loop = true;
    video.playsinline = true;
    video.style.display = 'none';
    video.muted = this.config.muted;
    video.src = src;
    video.preload = 'metadata';

    this.psv.container.appendChild(video);

    return video;
  }

  /**
   * @private
   */
  __videoLoadPromise(video) {
    const self = this;

    return new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', function onLoaded() {
        if (this.video && video.duration === this.video.duration) {
          resolve(self.__videoBufferPromise(video, this.video.currentTime));
        }
        else {
          resolve();
        }
        video.removeEventListener('loadedmetadata', onLoaded);
      });

      video.addEventListener('error', function onError(err) {
        reject(err);
        video.removeEventListener('error', onError);
      });
    });
  }

  /**
   * @private
   */
  __videoBufferPromise(video, currentTime) {
    return new Promise((resolve) => {
      function onBuffer() {
        const buffer = video.buffered;
        for (let i = 0, l = buffer.length; i < l; i++) {
          if (buffer.start(i) <= video.currentTime && buffer.end(i) >= video.currentTime) {
            video.pause();
            video.removeEventListener('buffer', onBuffer);
            video.removeEventListener('progress', onBuffer);
            resolve();
            break;
          }
        }
      }

      // try to reduce the switching time by preloading in advance
      // FIXME find a better way ?
      video.currentTime = Math.min(currentTime + 2000, video.duration.currentTime);
      video.muted = true;

      video.addEventListener('buffer', onBuffer);
      video.addEventListener('progress', onBuffer);

      video.play();
    });
  }

}
