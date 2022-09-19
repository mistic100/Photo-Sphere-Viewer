/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.LittlePlanetAdapter = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

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

  photoSphereViewer.DEFAULTS.defaultLat = -Math.PI / 2;
  var euler = new three.Euler();
  /**
   * @summary Adapter for equirectangular panoramas displayed with little planet effect
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var LittlePlanetAdapter = /*#__PURE__*/function (_EquirectangularAdapt) {
    _inheritsLoose(LittlePlanetAdapter, _EquirectangularAdapt);

    /**
     * @param {PSV.Viewer} psv
     */
    function LittlePlanetAdapter(psv) {
      var _this;

      _this = _EquirectangularAdapt.call(this, psv) || this;
      _this.psv.prop.littlePlanet = true;

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.SIZE_UPDATED, _assertThisInitialized(_this));

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, _assertThisInitialized(_this));

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = LittlePlanetAdapter.prototype;

    _proto.supportsTransition = function supportsTransition() {
      return false;
    }
    /**
     * @override
     */
    ;

    _proto.supportsPreload = function supportsPreload() {
      return true;
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.SIZE_UPDATED:
          this.__setResolution(e.args[0]);

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED:
          this.__setZoom();

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED:
          this.__setPosition(e.args[0]);

          break;
      }
      /* eslint-enable */

    }
    /**
     * @param {PSV.Size} size
     * @private
     */
    ;

    _proto.__setResolution = function __setResolution(size) {
      this.uniforms.resolution.value = size.width / size.height;
    }
    /**
     * @private
     */
    ;

    _proto.__setZoom = function __setZoom() {
      // mapping values are empirical
      this.uniforms.zoom.value = Math.max(0.1, three.MathUtils.mapLinear(this.psv.prop.vFov, 90, 30, 50, 2));
    }
    /**
     * @param {PSV.Position} position
     * @private
     */
    ;

    _proto.__setPosition = function __setPosition(position) {
      euler.set(Math.PI / 2 + position.latitude, 0, -Math.PI / 2 - position.longitude, 'ZYX');
      this.uniforms.transform.value.makeRotationFromEuler(euler);
    }
    /**
     * @override
     */
    ;

    _proto.createMesh = function createMesh() {
      var geometry = new three.PlaneBufferGeometry(20, 10).translate(0, 0, -1); // this one was copied from https://github.com/pchen66/panolens.js

      var material = new three.ShaderMaterial({
        uniforms: {
          panorama: {
            value: new three.Texture()
          },
          resolution: {
            value: 2.0
          },
          transform: {
            value: new three.Matrix4()
          },
          zoom: {
            value: 10.0
          },
          opacity: {
            value: 1.0
          }
        },
        vertexShader: "\nvarying vec2 vUv;\n\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4( position, 1.0 );\n}",
        fragmentShader: "\nuniform sampler2D panorama;\nuniform float resolution;\nuniform mat4 transform;\nuniform float zoom;\nuniform float opacity;\n\nvarying vec2 vUv;\n\nconst float PI = 3.1415926535897932384626433832795;\n\nvoid main() {\n  vec2 position = -1.0 + 2.0 * vUv;\n  position *= vec2( zoom * resolution, zoom * 0.5 );\n\n  float x2y2 = position.x * position.x + position.y * position.y;\n  vec3 sphere_pnt = vec3( 2. * position, x2y2 - 1. ) / ( x2y2 + 1. );\n  sphere_pnt = vec3( transform * vec4( sphere_pnt, 1.0 ) );\n\n  vec2 sampleUV = vec2(\n    1.0 - (atan(sphere_pnt.y, sphere_pnt.x) / PI + 1.0) * 0.5,\n    (asin(sphere_pnt.z) / PI + 0.5)\n  );\n\n  gl_FragColor = texture2D( panorama, sampleUV );\n  gl_FragColor.a *= opacity;\n}"
      });
      this.uniforms = material.uniforms;
      return new three.Mesh(geometry, material);
    }
    /**
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData) {
      mesh.material.uniforms.panorama.value.dispose();
      mesh.material.uniforms.panorama.value = textureData.texture;
    };

    return LittlePlanetAdapter;
  }(photoSphereViewer.EquirectangularAdapter);
  LittlePlanetAdapter.id = 'little-planet';
  LittlePlanetAdapter.supportsOverlay = false;

  exports.LittlePlanetAdapter = LittlePlanetAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=little-planet.js.map
