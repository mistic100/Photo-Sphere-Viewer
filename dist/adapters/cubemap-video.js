/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.CubemapVideoAdapter = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
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
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
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
   * @typedef {Object} PSV.adapters.CubemapVideoAdapter.Video
   * @summary Object defining a video
   * @property {string} source
   */

  /**
   * @typedef {Object} PSV.adapters.CubemapVideoAdapter.Options
   * @property {boolean} [autoplay=false] - automatically start the video
   * @property {boolean} [muted=autoplay] - initially mute the video
   * @property {number} [equiangular=true] - if the video is an equiangular cubemap (EAC)
   */

  /**
   * @summary Adapter for cubemap videos
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var CubemapVideoAdapter = /*#__PURE__*/function (_AbstractVideoAdapter) {
    _inheritsLoose(CubemapVideoAdapter, _AbstractVideoAdapter);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.adapters.CubemapVideoAdapter.Options} options
     */
    function CubemapVideoAdapter(psv, options) {
      return _AbstractVideoAdapter.call(this, psv, _extends({
        equiangular: true
      }, options)) || this;
    }
    /**
     * @override
     * @param {PSV.adapters.CubemapVideoAdapter.Video} panorama
     * @returns {Promise.<PSV.TextureData>}
     */


    var _proto = CubemapVideoAdapter.prototype;

    _proto.loadTexture = function loadTexture(panorama) {
      return _AbstractVideoAdapter.prototype.loadTexture.call(this, panorama);
    }
    /**
     * @override
     */
    ;

    _proto.createMesh = function createMesh(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      var cubeSize = photoSphereViewer.CONSTANTS.SPHERE_RADIUS * 2 * scale;
      var geometry = new three.BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1).toNonIndexed();
      geometry.clearGroups();
      var uvs = geometry.getAttribute('uv');
      /*
        Structure of a frame
         1 +---------+---------+---------+
          |         |         |         |
          |  Left   |  Front  |  Right  |
          |         |         |         |
      1/2 +---------+---------+---------+
          |         |         |         |
          | Bottom  |  Back   |   Top   |
          |         |         |         |
        0 +---------+---------+---------+
          0        1/3       2/3        1
          Bottom, Back and Top are rotated 90° clockwise
       */
      // columns

      var a = 0;
      var b = 1 / 3;
      var c = 2 / 3;
      var d = 1; // lines

      var A = 1;
      var B = 1 / 2;
      var C = 0; // left

      uvs.setXY(0, a, A);
      uvs.setXY(1, a, B);
      uvs.setXY(2, b, A);
      uvs.setXY(3, a, B);
      uvs.setXY(4, b, B);
      uvs.setXY(5, b, A); // right

      uvs.setXY(6, c, A);
      uvs.setXY(7, c, B);
      uvs.setXY(8, d, A);
      uvs.setXY(9, c, B);
      uvs.setXY(10, d, B);
      uvs.setXY(11, d, A); // top

      uvs.setXY(12, d, B);
      uvs.setXY(13, c, B);
      uvs.setXY(14, d, C);
      uvs.setXY(15, c, B);
      uvs.setXY(16, c, C);
      uvs.setXY(17, d, C); // bottom

      uvs.setXY(18, b, B);
      uvs.setXY(19, a, B);
      uvs.setXY(20, b, C);
      uvs.setXY(21, a, B);
      uvs.setXY(22, a, C);
      uvs.setXY(23, b, C); // back

      uvs.setXY(24, c, B);
      uvs.setXY(25, b, B);
      uvs.setXY(26, c, C);
      uvs.setXY(27, b, B);
      uvs.setXY(28, b, C);
      uvs.setXY(29, c, C); // front

      uvs.setXY(30, b, A);
      uvs.setXY(31, b, B);
      uvs.setXY(32, c, A);
      uvs.setXY(33, b, B);
      uvs.setXY(34, c, B);
      uvs.setXY(35, c, A); // shamelessly copied from https://github.com/videojs/videojs-vr

      var material = new three.ShaderMaterial({
        uniforms: {
          mapped: {
            value: null
          },
          contCorrect: {
            value: 1
          },
          faceWH: {
            value: new three.Vector2(1 / 3, 1 / 2)
          },
          vidWH: {
            value: new three.Vector2(1, 1)
          }
        },
        vertexShader: "\nvarying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);\n}",
        fragmentShader: "\nvarying vec2 vUv;\nuniform sampler2D mapped;\nuniform vec2 faceWH;\nuniform vec2 vidWH;\nuniform float contCorrect;\n\nconst float PI = 3.1415926535897932384626433832795;\n\nvoid main() {\n  vec2 corner = vUv - mod(vUv, faceWH) + vec2(0, contCorrect / vidWH.y);\n  vec2 faceWHadj = faceWH - vec2(0, contCorrect * 2. / vidWH.y);\n  vec2 p = (vUv - corner) / faceWHadj - .5;\n  vec2 q = " + (this.config.equiangular ? '2. / PI * atan(2. * p) + .5' : 'p + .5') + ";\n  vec2 eUv = corner + q * faceWHadj;\n  gl_FragColor = texture2D(mapped, eUv);\n}"
      });
      return new three.Mesh(geometry, material);
    }
    /**
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData) {
      var _mesh$material$unifor;

      var texture = textureData.texture;
      (_mesh$material$unifor = mesh.material.uniforms.mapped.value) == null ? void 0 : _mesh$material$unifor.dispose();
      mesh.material.uniforms.mapped.value = texture;
      mesh.material.uniforms.vidWH.value.set(texture.image.videoWidth, texture.image.videoHeight);

      this.__switchVideo(textureData.texture);
    };

    return CubemapVideoAdapter;
  }(AbstractVideoAdapter);
  CubemapVideoAdapter.id = 'cubemap-video';

  exports.CubemapVideoAdapter = CubemapVideoAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cubemap-video.js.map
