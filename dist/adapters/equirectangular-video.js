/*!
* Photo Sphere Viewer 4.8.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.EquirectangularVideoAdapter = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

  function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };
    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

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

  var AbstractVideoAdapter = /*#__PURE__*/function (_AbstractAdapter) {
    _inheritsLoose(AbstractVideoAdapter, _AbstractAdapter);

    function AbstractVideoAdapter(psv, options) {
      var _options$autoplay;

      var _this;

      _this = _AbstractAdapter.call(this, psv) || this;
      /**
       * @member {PSV.adapters.AbstractVideoAdapter.Options}
       * @private
       */

      _this.config = _extends({
        autoplay: false,
        muted: (_options$autoplay = options == null ? void 0 : options.autoplay) != null ? _options$autoplay : false
      }, options);
      /**
       * @member {HTMLVideoElement}
       * @private
       */

      _this.video = null;

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = AbstractVideoAdapter.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);

      this.__removeVideo();

      _AbstractAdapter.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER:
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
    ;

    _proto.loadTexture = function loadTexture(panorama) {
      if (typeof panorama !== 'object' || !panorama.source) {
        return Promise.reject(new photoSphereViewer.PSVError('Invalid panorama configuration, are you using the right adapter?'));
      }

      if (!this.psv.getPlugin('video')) {
        return Promise.reject(new photoSphereViewer.PSVError('Video adapters require VideoPlugin to be loaded too.'));
      }

      var video = this.__createVideo(panorama.source);

      return this.__videoLoadPromise(video).then(function () {
        var texture = new three.VideoTexture(video);
        return {
          panorama: panorama,
          texture: texture
        };
      });
    }
    /**
     * @override
     */
    ;

    _proto.__switchVideo = function __switchVideo(texture) {
      var currentTime;
      var duration;
      var paused = !this.config.autoplay;
      var muted = this.config.muted;
      var volume = 1;

      if (this.video) {
        var _this$video = this.video;
        currentTime = _this$video.currentTime;
        duration = _this$video.duration;
        paused = _this$video.paused;
        muted = _this$video.muted;
        volume = _this$video.volume;
      }

      this.__removeVideo();

      this.video = texture.image; // keep current time when switching resolution

      if (this.video.duration === duration) {
        this.video.currentTime = currentTime;
      } // keep volume


      this.video.muted = muted;
      this.video.volume = volume; // play

      if (!paused) {
        this.video.play();
      }
    }
    /**
     * @override
     */
    ;

    _proto.disposeTexture = function disposeTexture(textureData) {
      var _textureData$texture;

      if (textureData.texture) {
        var video = textureData.texture.image;
        video.pause();
        this.psv.container.removeChild(video);
      }

      (_textureData$texture = textureData.texture) == null ? void 0 : _textureData$texture.dispose();
    }
    /**
     * @summary Removes the current video element
     * @private
     */
    ;

    _proto.__removeVideo = function __removeVideo() {
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
    ;

    _proto.__createVideo = function __createVideo(src) {
      var video = document.createElement('video');
      video.crossOrigin = this.psv.config.withCredentials ? 'use-credentials' : 'anonymous';
      video.loop = true;
      video.playsInline = true;
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
    ;

    _proto.__videoLoadPromise = function __videoLoadPromise(video) {
      var self = this;
      return new Promise(function (resolve, reject) {
        video.addEventListener('loadedmetadata', function onLoaded() {
          if (this.video && video.duration === this.video.duration) {
            resolve(self.__videoBufferPromise(video, this.video.currentTime));
          } else {
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
    ;

    _proto.__videoBufferPromise = function __videoBufferPromise(video, currentTime) {
      return new Promise(function (resolve) {
        function onBuffer() {
          var buffer = video.buffered;

          for (var i = 0, l = buffer.length; i < l; i++) {
            if (buffer.start(i) <= video.currentTime && buffer.end(i) >= video.currentTime) {
              video.pause();
              video.removeEventListener('buffer', onBuffer);
              video.removeEventListener('progress', onBuffer);
              resolve();
              break;
            }
          }
        } // try to reduce the switching time by preloading in advance
        // FIXME find a better way ?


        video.currentTime = Math.min(currentTime + 2000, video.duration.currentTime);
        video.muted = true;
        video.addEventListener('buffer', onBuffer);
        video.addEventListener('progress', onBuffer);
        video.play();
      });
    };

    return AbstractVideoAdapter;
  }(photoSphereViewer.AbstractAdapter);

  /**
   * @typedef {Object} PSV.adapters.EquirectangularVideoAdapter.Video
   * @summary Object defining a video
   * @property {string} source
   */

  /**
   * @typedef {Object} PSV.adapters.EquirectangularVideoAdapter.Options
   * @property {boolean} [autoplay=false] - automatically start the video
   * @property {boolean} [muted=autoplay] - initially mute the video
   * @property {number} [resolution=64] - number of faces of the sphere geometry, higher values may decrease performances
   */

  /**
   * @summary Adapter for equirectangular videos
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var EquirectangularVideoAdapter = /*#__PURE__*/function (_AbstractVideoAdapter) {
    _inheritsLoose(EquirectangularVideoAdapter, _AbstractVideoAdapter);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.adapters.EquirectangularVideoAdapter.Options} options
     */
    function EquirectangularVideoAdapter(psv, options) {
      var _this;

      _this = _AbstractVideoAdapter.call(this, psv, _extends({
        resolution: 64
      }, options)) || this;

      if (!three.MathUtils.isPowerOfTwo(_this.config.resolution)) {
        throw new photoSphereViewer.PSVError('EquirectangularVideoAdapter resolution must be power of two');
      }

      _this.SPHERE_SEGMENTS = _this.config.resolution;
      _this.SPHERE_HORIZONTAL_SEGMENTS = _this.SPHERE_SEGMENTS / 2;
      return _this;
    }
    /**
     * @override
     * @param {PSV.adapters.EquirectangularVideoAdapter.Video} panorama
     * @returns {Promise.<PSV.TextureData>}
     */


    var _proto = EquirectangularVideoAdapter.prototype;

    _proto.loadTexture = function loadTexture(panorama) {
      return _AbstractVideoAdapter.prototype.loadTexture.call(this, panorama).then(function (_ref) {
        var texture = _ref.texture;
        var video = texture.image;
        var panoData = {
          fullWidth: video.videoWidth,
          fullHeight: video.videoHeight,
          croppedWidth: video.videoWidth,
          croppedHeight: video.videoHeight,
          croppedX: 0,
          croppedY: 0,
          poseHeading: 0,
          posePitch: 0,
          poseRoll: 0
        };
        return {
          panorama: panorama,
          texture: texture,
          panoData: panoData
        };
      });
    }
    /**
     * @override
     */
    ;

    _proto.createMesh = function createMesh(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      var geometry = new three.SphereGeometry(photoSphereViewer.CONSTANTS.SPHERE_RADIUS * scale, this.SPHERE_SEGMENTS, this.SPHERE_HORIZONTAL_SEGMENTS, -Math.PI / 2).scale(-1, 1, 1);
      var material = new three.MeshBasicMaterial();
      return new three.Mesh(geometry, material);
    }
    /**
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData) {
      var _mesh$material$map;

      (_mesh$material$map = mesh.material.map) == null ? void 0 : _mesh$material$map.dispose();
      mesh.material.map = textureData.texture;

      this.__switchVideo(textureData.texture);
    };

    return EquirectangularVideoAdapter;
  }(AbstractVideoAdapter);
  EquirectangularVideoAdapter.id = 'equirectangular-video';

  exports.EquirectangularVideoAdapter = EquirectangularVideoAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=equirectangular-video.js.map
