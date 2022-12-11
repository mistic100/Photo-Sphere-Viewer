/*!
* Photo Sphere Viewer 4.8.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.CubemapAdapter = {}), global.THREE, global.PhotoSphereViewer));
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

  var CUBE_ARRAY = [0, 2, 4, 5, 3, 1];
  var CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];
  /**
   * @summary Adapter for cubemaps
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var CubemapAdapter = /*#__PURE__*/function (_AbstractAdapter) {
    _inheritsLoose(CubemapAdapter, _AbstractAdapter);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.adapters.CubemapAdapter.Options} options
     */
    function CubemapAdapter(psv, options) {
      var _this;

      _this = _AbstractAdapter.call(this, psv) || this;
      /**
       * @member {PSV.adapters.CubemapAdapter.Options}
       * @private
       */

      _this.config = _extends({
        flipTopBottom: false
      }, options);
      return _this;
    }
    /**
     * @override
     */


    var _proto = CubemapAdapter.prototype;

    _proto.supportsTransition = function supportsTransition() {
      return true;
    }
    /**
     * @override
     */
    ;

    _proto.supportsPreload = function supportsPreload() {
      return true;
    }
    /**
     * @override
     * @param {string[] | PSV.adapters.CubemapAdapter.Cubemap} panorama
     * @returns {Promise.<PSV.TextureData>}
     */
    ;

    _proto.loadTexture = function loadTexture(panorama) {
      var _this2 = this;

      var cleanPanorama = [];

      if (Array.isArray(panorama)) {
        if (panorama.length !== 6) {
          return Promise.reject(new photoSphereViewer.PSVError('Must provide exactly 6 image paths when using cubemap.'));
        } // reorder images


        for (var i = 0; i < 6; i++) {
          cleanPanorama[i] = panorama[CUBE_ARRAY[i]];
        }
      } else if (typeof panorama === 'object') {
        if (!CUBE_HASHMAP.every(function (side) {
          return !!panorama[side];
        })) {
          return Promise.reject(new photoSphereViewer.PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.'));
        } // transform into array


        CUBE_HASHMAP.forEach(function (side, i) {
          cleanPanorama[i] = panorama[side];
        });
      } else {
        return Promise.reject(new photoSphereViewer.PSVError('Invalid cubemap panorama, are you using the right adapter?'));
      }

      if (this.psv.config.fisheye) {
        photoSphereViewer.utils.logWarn('fisheye effect with cubemap texture can generate distorsion');
      }

      var promises = [];
      var progress = [0, 0, 0, 0, 0, 0];

      var _loop = function _loop(_i) {
        promises.push(_this2.psv.textureLoader.loadImage(cleanPanorama[_i], function (p) {
          progress[_i] = p;

          _this2.psv.loader.setProgress(photoSphereViewer.utils.sum(progress) / 6);
        }).then(function (img) {
          return _this2.__createCubemapTexture(img);
        }));
      };

      for (var _i = 0; _i < 6; _i++) {
        _loop(_i);
      }

      return Promise.all(promises).then(function (texture) {
        return {
          panorama: panorama,
          texture: texture
        };
      });
    }
    /**
     * @summary Creates the final texture from image
     * @param {HTMLImageElement} img
     * @returns {external:THREE.Texture}
     * @private
     */
    ;

    _proto.__createCubemapTexture = function __createCubemapTexture(img) {
      if (img.width !== img.height) {
        photoSphereViewer.utils.logWarn('Invalid base image, the width equal the height');
      } // resize image


      if (img.width > photoSphereViewer.SYSTEM.maxTextureWidth) {
        var ratio = photoSphereViewer.SYSTEM.getMaxCanvasWidth() / img.width;
        var buffer = document.createElement('canvas');
        buffer.width = img.width * ratio;
        buffer.height = img.height * ratio;
        var ctx = buffer.getContext('2d');
        ctx.drawImage(img, 0, 0, buffer.width, buffer.height);
        return photoSphereViewer.utils.createTexture(buffer);
      }

      return photoSphereViewer.utils.createTexture(img);
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
      var geometry = new three.BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1);
      var materials = [];

      for (var i = 0; i < 6; i++) {
        materials.push(photoSphereViewer.AbstractAdapter.createOverlayMaterial({
          additionalUniforms: {
            rotation: {
              value: 0.0
            }
          },
          overrideVertexShader: "\nuniform float rotation;\n\nvarying vec2 vUv;\n\nconst float mid = 0.5;\n\nvoid main() {\n  if (rotation == 0.0) {\n    vUv = uv;\n  } else {\n    vUv = vec2(\n      cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,\n      cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid\n    );\n  }\n  gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );\n}"
        }));
      }

      return new three.Mesh(geometry, materials);
    }
    /**
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData) {
      var texture = textureData.texture;

      for (var i = 0; i < 6; i++) {
        if (this.config.flipTopBottom && (i === 2 || i === 3)) {
          this.__setUniform(mesh, i, 'rotation', Math.PI);
        }

        this.__setUniform(mesh, i, photoSphereViewer.AbstractAdapter.OVERLAY_UNIFORMS.panorama, texture[i]);
      }

      this.setOverlay(mesh, null);
    }
    /**
     * @override
     */
    ;

    _proto.setOverlay = function setOverlay(mesh, textureData, opacity) {
      for (var i = 0; i < 6; i++) {
        this.__setUniform(mesh, i, photoSphereViewer.AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity, opacity);

        if (!textureData) {
          this.__setUniform(mesh, i, photoSphereViewer.AbstractAdapter.OVERLAY_UNIFORMS.overlay, new three.Texture());
        } else {
          this.__setUniform(mesh, i, photoSphereViewer.AbstractAdapter.OVERLAY_UNIFORMS.overlay, textureData.texture[i]);
        }
      }
    }
    /**
     * @override
     */
    ;

    _proto.setTextureOpacity = function setTextureOpacity(mesh, opacity) {
      for (var i = 0; i < 6; i++) {
        this.__setUniform(mesh, i, photoSphereViewer.AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity, opacity);

        mesh.material[i].transparent = opacity < 1;
      }
    }
    /**
     * @override
     */
    ;

    _proto.disposeTexture = function disposeTexture(textureData) {
      var _textureData$texture;

      (_textureData$texture = textureData.texture) == null ? void 0 : _textureData$texture.forEach(function (texture) {
        return texture.dispose();
      });
    }
    /**
     * @param {external:THREE.Mesh} mesh
     * @param {number} index
     * @param {string} uniform
     * @param {*} value
     * @private
     */
    ;

    _proto.__setUniform = function __setUniform(mesh, index, uniform, value) {
      if (mesh.material[index].uniforms[uniform].value instanceof three.Texture) {
        mesh.material[index].uniforms[uniform].value.dispose();
      }

      mesh.material[index].uniforms[uniform].value = value;
    };

    return CubemapAdapter;
  }(photoSphereViewer.AbstractAdapter);
  CubemapAdapter.id = 'cubemap';
  CubemapAdapter.supportsDownload = false;
  CubemapAdapter.supportsOverlay = true;

  exports.CUBE_ARRAY = CUBE_ARRAY;
  exports.CUBE_HASHMAP = CUBE_HASHMAP;
  exports.CubemapAdapter = CubemapAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cubemap.js.map
