/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.EquirectangularTilesAdapter = {}), global.THREE, global.PhotoSphereViewer));
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
   * @summary Loading task
   * @memberOf PSV.adapters
   * @private
   */
  var Task = /*#__PURE__*/function () {
    /**
     * @param {string} id
     * @param {number} priority
     * @param {function(Task): Promise} fn
     */
    function Task(id, priority, fn) {
      this.id = id;
      this.priority = priority;
      this.fn = fn;
      this.status = Task.STATUS.PENDING;
    }

    var _proto = Task.prototype;

    _proto.start = function start() {
      var _this = this;

      this.status = Task.STATUS.RUNNING;
      return this.fn(this).then(function () {
        _this.status = Task.STATUS.DONE;
      }, function () {
        _this.status = Task.STATUS.ERROR;
      });
    };

    _proto.cancel = function cancel() {
      this.status = Task.STATUS.CANCELLED;
    };

    _proto.isCancelled = function isCancelled() {
      return this.status === Task.STATUS.CANCELLED;
    };

    return Task;
  }();
  Task.STATUS = {
    DISABLED: -1,
    PENDING: 0,
    RUNNING: 1,
    CANCELLED: 2,
    DONE: 3,
    ERROR: 4
  };

  /**
   * @summary Loading queue
   * @memberOf PSV.adapters
   * @private
   */

  var Queue = /*#__PURE__*/function () {
    /**
     * @param {int} concurency
     */
    function Queue(concurency) {
      if (concurency === void 0) {
        concurency = 4;
      }

      this.concurency = concurency;
      this.runningTasks = {};
      this.tasks = {};
    }

    var _proto = Queue.prototype;

    _proto.enqueue = function enqueue(task) {
      this.tasks[task.id] = task;
    };

    _proto.clear = function clear() {
      Object.values(this.tasks).forEach(function (task) {
        return task.cancel();
      });
      this.tasks = {};
      this.runningTasks = {};
    };

    _proto.setPriority = function setPriority(taskId, priority) {
      var task = this.tasks[taskId];

      if (task) {
        task.priority = priority;

        if (task.status === Task.STATUS.DISABLED) {
          task.status = Task.STATUS.PENDING;
        }
      }
    };

    _proto.disableAllTasks = function disableAllTasks() {
      Object.values(this.tasks).forEach(function (task) {
        task.status = Task.STATUS.DISABLED;
      });
    };

    _proto.start = function start() {
      var _this = this;

      if (Object.keys(this.runningTasks).length >= this.concurency) {
        return;
      }

      var nextTask = Object.values(this.tasks).filter(function (task) {
        return task.status === Task.STATUS.PENDING;
      }).sort(function (a, b) {
        return b.priority - a.priority;
      }).pop();

      if (nextTask) {
        this.runningTasks[nextTask.id] = true;
        nextTask.start().then(function () {
          if (!nextTask.isCancelled()) {
            delete _this.tasks[nextTask.id];
            delete _this.runningTasks[nextTask.id];

            _this.start();
          }
        });
        this.start(); // start tasks until max concurrency is reached
      }
    };

    return Queue;
  }();

  /**
   * @summary Generates an material for errored tiles
   * @memberOf PSV.adapters
   * @return {external:THREE.MeshBasicMaterial}
   * @private
   */

  function buildErrorMaterial(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = canvas.width / 5 + "px serif";
    ctx.fillStyle = '#a22';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠', canvas.width / 2, canvas.height / 2);
    var texture = new three.CanvasTexture(canvas);
    return new three.MeshBasicMaterial({
      map: texture
    });
  }
  /**
   * @summary Create the texture for the base image
   * @memberOf PSV.adapters
   * @param {HTMLImageElement} img
   * @param {boolean} blur
   * @param {function} getHeight
   * @return {external:THREE.Texture}
   * @private
   */

  function createBaseTexture(img, blur, getHeight) {
    if (blur || img.width > photoSphereViewer.SYSTEM.maxTextureWidth) {
      var ratio = Math.min(1, photoSphereViewer.SYSTEM.getMaxCanvasWidth() / img.width);
      var buffer = document.createElement('canvas');
      buffer.width = img.width * ratio;
      buffer.height = getHeight(img.width);
      var ctx = buffer.getContext('2d');

      if (blur) {
        ctx.filter = 'blur(1px)';
      }

      ctx.drawImage(img, 0, 0, buffer.width, buffer.height);
      return photoSphereViewer.utils.createTexture(buffer);
    }

    return photoSphereViewer.utils.createTexture(img);
  }

  /**
   * @callback TileUrl
   * @summary Function called to build a tile url
   * @memberOf PSV.adapters.EquirectangularTilesAdapter
   * @param {int} col
   * @param {int} row
   * @returns {string}
   */

  /**
   * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Panorama
   * @summary Configuration of a tiled panorama
   * @property {string} [baseUrl] - low resolution panorama loaded before tiles
   * @property {PSV.PanoData | PSV.PanoDataProvider} [basePanoData] - panoData configuration associated to low resolution panorama loaded before tiles
   * @property {int} width - complete panorama width (height is always width/2)
   * @property {int} cols - number of vertical tiles
   * @property {int} rows - number of horizontal tiles
   * @property {PSV.adapters.EquirectangularTilesAdapter.TileUrl} tileUrl - function to build a tile url
   */

  /**
   * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Options
   * @property {number} [resolution=64] - number of faces of the sphere geometry, higher values may decrease performances
   * @property {boolean} [showErrorTile=true] - shows a warning sign on tiles that cannot be loaded
   * @property {boolean} [baseBlur=true] - applies a blur to the low resolution panorama
   */

  /**
   * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Tile
   * @private
   * @property {int} col
   * @property {int} row
   * @property {float} angle
   */

  /* the faces of the top and bottom rows are made of a single triangle (3 vertices)
   * all other faces are made of two triangles (6 vertices)
   * bellow is the indexing of each face vertices
   *
   * first row faces:
   *     ⋀
   *    /0\
   *   /   \
   *  /     \
   * /1     2\
   * ¯¯¯¯¯¯¯¯¯
   *
   * other rows faces:
   * _________
   * |\1    0|
   * |3\     |
   * |  \    |
   * |   \   |
   * |    \  |
   * |     \2|
   * |4    5\|
   * ¯¯¯¯¯¯¯¯¯
   *
   * last row faces:
   * _________
   * \1     0/
   *  \     /
   *   \   /
   *    \2/
   *     ⋁
   */

  var ATTR_UV = 'uv';
  var ATTR_ORIGINAL_UV = 'originaluv';
  var ATTR_POSITION = 'position';

  function tileId(tile) {
    return tile.col + "x" + tile.row;
  }

  var frustum = new three.Frustum();
  var projScreenMatrix = new three.Matrix4();
  var vertexPosition = new three.Vector3();
  /**
   * @summary Adapter for tiled panoramas
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var EquirectangularTilesAdapter = /*#__PURE__*/function (_EquirectangularAdapt) {
    _inheritsLoose(EquirectangularTilesAdapter, _EquirectangularAdapt);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.adapters.EquirectangularTilesAdapter.Options} options
     */
    function EquirectangularTilesAdapter(psv, options) {
      var _this;

      _this = _EquirectangularAdapt.call(this, psv) || this;
      _this.psv.config.useXmpData = false;
      /**
       * @member {PSV.adapters.EquirectangularTilesAdapter.Options}
       * @private
       */

      _this.config = _extends({
        resolution: 64,
        showErrorTile: true,
        baseBlur: true
      }, options);

      if (!three.MathUtils.isPowerOfTwo(_this.config.resolution)) {
        throw new photoSphereViewer.PSVError('EquirectangularAdapter resolution must be power of two');
      }

      _this.SPHERE_SEGMENTS = _this.config.resolution;
      _this.SPHERE_HORIZONTAL_SEGMENTS = _this.SPHERE_SEGMENTS / 2;
      _this.NB_VERTICES_BY_FACE = 6;
      _this.NB_VERTICES_BY_SMALL_FACE = 3;
      _this.NB_VERTICES = 2 * _this.SPHERE_SEGMENTS * _this.NB_VERTICES_BY_SMALL_FACE + (_this.SPHERE_HORIZONTAL_SEGMENTS - 2) * _this.SPHERE_SEGMENTS * _this.NB_VERTICES_BY_FACE;
      _this.NB_GROUPS = _this.SPHERE_SEGMENTS * _this.SPHERE_HORIZONTAL_SEGMENTS;
      /**
       * @member {PSV.adapters.Queue}
       * @private
       */

      _this.queue = new Queue();
      /**
       * @type {Object}
       * @property {int} colSize - size in pixels of a column
       * @property {int} rowSize - size in pixels of a row
       * @property {int} facesByCol - number of mesh faces by column
       * @property {int} facesByRow - number of mesh faces by row
       * @property {Record<string, boolean>} tiles - loaded tiles
       * @property {external:THREE.SphereGeometry} geom
       * @property {external:THREE.MeshBasicMaterial[]} materials
       * @property {external:THREE.MeshBasicMaterial} errorMaterial
       * @private
       */

      _this.prop = {
        colSize: 0,
        rowSize: 0,
        facesByCol: 0,
        facesByRow: 0,
        tiles: {},
        geom: null,
        materials: [],
        errorMaterial: null
      };
      /**
       * @member {external:THREE.ImageLoader}
       * @private
       */

      _this.loader = new three.ImageLoader();

      if (_this.psv.config.withCredentials) {
        _this.loader.setWithCredentials(true);
      }

      if (_this.psv.config.requestHeaders && typeof _this.psv.config.requestHeaders === 'object') {
        _this.loader.setRequestHeader(_this.psv.config.requestHeaders);
      }

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, _assertThisInitialized(_this));

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = EquirectangularTilesAdapter.prototype;

    _proto.destroy = function destroy() {
      var _this$prop$errorMater, _this$prop$errorMater2, _this$prop$errorMater3;

      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, this);

      this.__cleanup();

      (_this$prop$errorMater = this.prop.errorMaterial) == null ? void 0 : (_this$prop$errorMater2 = _this$prop$errorMater.map) == null ? void 0 : _this$prop$errorMater2.dispose();
      (_this$prop$errorMater3 = this.prop.errorMaterial) == null ? void 0 : _this$prop$errorMater3.dispose();
      delete this.queue;
      delete this.loader;
      delete this.prop.geom;
      delete this.prop.errorMaterial;

      _EquirectangularAdapt.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED:
        case photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED:
          this.__refresh();

          break;
      }
      /* eslint-enable */

    }
    /**
     * @summary Clears loading queue, dispose all materials
     * @private
     */
    ;

    _proto.__cleanup = function __cleanup() {
      this.queue.clear();
      this.prop.tiles = {};
      this.prop.materials.forEach(function (mat) {
        var _mat$map;

        mat == null ? void 0 : (_mat$map = mat.map) == null ? void 0 : _mat$map.dispose();
        mat == null ? void 0 : mat.dispose();
      });
      this.prop.materials.length = 0;
    }
    /**
     * @override
     */
    ;

    _proto.supportsTransition = function supportsTransition(panorama) {
      return !!panorama.baseUrl;
    }
    /**
     * @override
     */
    ;

    _proto.supportsPreload = function supportsPreload(panorama) {
      return !!panorama.baseUrl;
    }
    /**
     * @override
     * @param {PSV.adapters.EquirectangularTilesAdapter.Panorama} panorama
     * @returns {Promise.<PSV.TextureData>}
     */
    ;

    _proto.loadTexture = function loadTexture(panorama) {
      if (typeof panorama !== 'object' || !panorama.width || !panorama.cols || !panorama.rows || !panorama.tileUrl) {
        return Promise.reject(new photoSphereViewer.PSVError('Invalid panorama configuration, are you using the right adapter?'));
      }

      if (panorama.cols > this.SPHERE_SEGMENTS) {
        return Promise.reject(new photoSphereViewer.PSVError("Panorama cols must not be greater than " + this.SPHERE_SEGMENTS + "."));
      }

      if (panorama.rows > this.SPHERE_HORIZONTAL_SEGMENTS) {
        return Promise.reject(new photoSphereViewer.PSVError("Panorama rows must not be greater than " + this.SPHERE_HORIZONTAL_SEGMENTS + "."));
      }

      if (!three.MathUtils.isPowerOfTwo(panorama.cols) || !three.MathUtils.isPowerOfTwo(panorama.rows)) {
        return Promise.reject(new photoSphereViewer.PSVError('Panorama cols and rows must be powers of 2.'));
      }

      var panoData = {
        fullWidth: panorama.width,
        fullHeight: panorama.width / 2,
        croppedWidth: panorama.width,
        croppedHeight: panorama.width / 2,
        croppedX: 0,
        croppedY: 0,
        poseHeading: 0,
        posePitch: 0,
        poseRoll: 0
      };

      if (panorama.baseUrl) {
        return _EquirectangularAdapt.prototype.loadTexture.call(this, panorama.baseUrl, panorama.basePanoData).then(function (textureData) {
          return {
            panorama: panorama,
            texture: textureData.texture,
            panoData: panoData
          };
        });
      } else {
        return Promise.resolve({
          panorama: panorama,
          panoData: panoData
        });
      }
    }
    /**
     * @override
     */
    ;

    _proto.createMesh = function createMesh(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      var geometry = new three.SphereGeometry(photoSphereViewer.CONSTANTS.SPHERE_RADIUS * scale, this.SPHERE_SEGMENTS, this.SPHERE_HORIZONTAL_SEGMENTS, -Math.PI / 2).scale(-1, 1, 1).toNonIndexed();
      geometry.clearGroups();
      var i = 0;
      var k = 0; // first row

      for (; i < this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE; i += this.NB_VERTICES_BY_SMALL_FACE) {
        geometry.addGroup(i, this.NB_VERTICES_BY_SMALL_FACE, k++);
      } // second to before last rows


      for (; i < this.NB_VERTICES - this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE; i += this.NB_VERTICES_BY_FACE) {
        geometry.addGroup(i, this.NB_VERTICES_BY_FACE, k++);
      } // last row


      for (; i < this.NB_VERTICES; i += this.NB_VERTICES_BY_SMALL_FACE) {
        geometry.addGroup(i, this.NB_VERTICES_BY_SMALL_FACE, k++);
      }

      geometry.setAttribute(ATTR_ORIGINAL_UV, geometry.getAttribute(ATTR_UV).clone());
      return new three.Mesh(geometry, []);
    }
    /**
     * @summary Applies the base texture and starts the loading of tiles
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData, transition) {
      var _this2 = this;

      var panorama = textureData.panorama,
          texture = textureData.texture;

      if (transition) {
        this.__setTexture(mesh, texture);

        return;
      }

      this.__cleanup();

      this.__setTexture(mesh, texture);

      this.prop.materials = mesh.material;
      this.prop.geom = mesh.geometry;
      this.prop.geom.setAttribute(ATTR_UV, this.prop.geom.getAttribute(ATTR_ORIGINAL_UV).clone());
      this.prop.colSize = panorama.width / panorama.cols;
      this.prop.rowSize = panorama.width / 2 / panorama.rows;
      this.prop.facesByCol = this.SPHERE_SEGMENTS / panorama.cols;
      this.prop.facesByRow = this.SPHERE_HORIZONTAL_SEGMENTS / panorama.rows; // this.psv.renderer.scene.add(createWireFrame(this.prop.geom));

      setTimeout(function () {
        return _this2.__refresh(true);
      });
    }
    /**
     * @private
     */
    ;

    _proto.__setTexture = function __setTexture(mesh, texture) {
      var material;

      if (texture) {
        material = new three.MeshBasicMaterial({
          map: texture
        });
      } else {
        material = new three.MeshBasicMaterial({
          opacity: 0,
          transparent: true
        });
      }

      for (var i = 0; i < this.NB_GROUPS; i++) {
        mesh.material.push(material);
      }
    }
    /**
     * @override
     */
    ;

    _proto.setTextureOpacity = function setTextureOpacity(mesh, opacity) {
      mesh.material[0].opacity = opacity;
      mesh.material[0].transparent = opacity < 1;
    }
    /**
     * @summary Compute visible tiles and load them
     * @param {boolean} [init=false] Indicates initial call
     * @private
     */
    ;

    _proto.__refresh = function __refresh(init) {
      var _this3 = this;

      // eslint-disable-line no-unused-vars
      if (!this.prop.geom) {
        return;
      }

      var camera = this.psv.renderer.camera;
      camera.updateMatrixWorld();
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);
      var panorama = this.psv.config.panorama;
      var verticesPosition = this.prop.geom.getAttribute(ATTR_POSITION);
      var tilesToLoad = [];

      for (var col = 0; col < panorama.cols; col++) {
        for (var row = 0; row < panorama.rows; row++) {
          // for each tile, find the vertices corresponding to the four corners (three for first and last rows)
          // if at least one vertex is visible, the tile must be loaded
          // for larger tiles we also test the four edges centers and the tile center
          var verticesIndex = [];

          if (row === 0) {
            // bottom-left
            var v0 = this.prop.facesByRow === 1 ? col * this.prop.facesByCol * this.NB_VERTICES_BY_SMALL_FACE + 1 : this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE + (this.prop.facesByRow - 2) * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE + col * this.prop.facesByCol * this.NB_VERTICES_BY_FACE + 4; // bottom-right

            var v1 = this.prop.facesByRow === 1 ? v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_SMALL_FACE + 1 : v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE + 1; // top (all vertices are equal)

            var v2 = 0;
            verticesIndex.push(v0, v1, v2);

            if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
              // bottom-center
              var v4 = v0 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;
              verticesIndex.push(v4);
            }

            if (this.prop.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
              // left-center
              var v6 = v0 - this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE; // right-center

              var v7 = v1 - this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;
              verticesIndex.push(v6, v7);
            }
          } else if (row === panorama.rows - 1) {
            // top-left
            var _v = this.prop.facesByRow === 1 ? -this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE + row * this.prop.facesByRow * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE + col * this.prop.facesByCol * this.NB_VERTICES_BY_SMALL_FACE + 1 : -this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE + row * this.prop.facesByRow * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE + col * this.prop.facesByCol * this.NB_VERTICES_BY_FACE + 1; // top-right


            var _v2 = this.prop.facesByRow === 1 ? _v + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_SMALL_FACE - 1 : _v + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE - 1; // bottom (all vertices are equal)


            var _v3 = this.NB_VERTICES - 1;

            verticesIndex.push(_v, _v2, _v3);

            if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
              // top-center
              var _v4 = _v + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;

              verticesIndex.push(_v4);
            }

            if (this.prop.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
              // left-center
              var _v5 = _v + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE; // right-center


              var _v6 = _v2 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

              verticesIndex.push(_v5, _v6);
            }
          } else {
            // top-left
            var _v7 = -this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE + row * this.prop.facesByRow * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE + col * this.prop.facesByCol * this.NB_VERTICES_BY_FACE + 1; // bottom-left


            var _v8 = _v7 + (this.prop.facesByRow - 1) * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE + 3; // bottom-right


            var _v9 = _v8 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE + 1; // top-right


            var v3 = _v7 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE - 1;
            verticesIndex.push(_v7, _v8, _v9, v3);

            if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
              // top-center
              var _v10 = _v7 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE; // bottom-center


              var v5 = _v8 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;
              verticesIndex.push(_v10, v5);
            }

            if (this.prop.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
              // left-center
              var _v11 = _v7 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE; // right-center


              var _v12 = v3 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

              verticesIndex.push(_v11, _v12);

              if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
                // center-center
                var v8 = _v11 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;
                verticesIndex.push(v8);
              }
            }
          } // if (init && col === 0 && row === 0) {
          //   verticesIndex.forEach((vertexIdx) => {
          //     this.psv.renderer.scene.add(createDot(
          //       verticesPosition.getX(vertexIdx),
          //       verticesPosition.getY(vertexIdx),
          //       verticesPosition.getZ(vertexIdx)
          //     ));
          //   });
          // }


          var vertexVisible = verticesIndex.some(function (vertexIdx) {
            vertexPosition.set(verticesPosition.getX(vertexIdx), verticesPosition.getY(vertexIdx), verticesPosition.getZ(vertexIdx));
            vertexPosition.applyEuler(_this3.psv.renderer.meshContainer.rotation);
            return frustum.containsPoint(vertexPosition);
          });

          if (vertexVisible) {
            var angle = vertexPosition.angleTo(this.psv.prop.direction);

            if (row === 0 || row === panorama.rows - 1) {
              angle *= 2; // lower priority to top and bottom tiles
            }

            tilesToLoad.push({
              col: col,
              row: row,
              angle: angle
            });
          }
        }
      }

      this.__loadTiles(tilesToLoad);
    }
    /**
     * @summary Loads tiles and change existing tiles priority
     * @param {PSV.adapters.EquirectangularTilesAdapter.Tile[]} tiles
     * @private
     */
    ;

    _proto.__loadTiles = function __loadTiles(tiles) {
      var _this4 = this;

      this.queue.disableAllTasks();
      tiles.forEach(function (tile) {
        var id = tileId(tile);

        if (_this4.prop.tiles[id]) {
          _this4.queue.setPriority(id, tile.angle);
        } else {
          _this4.prop.tiles[id] = true;

          _this4.queue.enqueue(new Task(id, tile.angle, function (task) {
            return _this4.__loadTile(tile, task);
          }));
        }
      });
      this.queue.start();
    }
    /**
     * @summary Loads and draw a tile
     * @param {PSV.adapters.EquirectangularTilesAdapter.Tile} tile
     * @param {PSV.adapters.Task} task
     * @return {Promise}
     * @private
     */
    ;

    _proto.__loadTile = function __loadTile(tile, task) {
      var _this5 = this;

      var panorama = this.psv.config.panorama;
      var url = panorama.tileUrl(tile.col, tile.row);

      if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'function') {
        this.loader.setRequestHeader(this.psv.config.requestHeaders(url));
      }

      return new Promise(function (resolve, reject) {
        _this5.loader.load(url, resolve, undefined, reject);
      }).then(function (image) {
        if (!task.isCancelled()) {
          var material = new three.MeshBasicMaterial({
            map: photoSphereViewer.utils.createTexture(image)
          });

          _this5.__swapMaterial(tile.col, tile.row, material);

          _this5.psv.needsUpdate();
        }
      }).catch(function () {
        if (!task.isCancelled() && _this5.config.showErrorTile) {
          if (!_this5.prop.errorMaterial) {
            _this5.prop.errorMaterial = buildErrorMaterial(_this5.prop.colSize, _this5.prop.rowSize);
          }

          _this5.__swapMaterial(tile.col, tile.row, _this5.prop.errorMaterial);

          _this5.psv.needsUpdate();
        }
      });
    }
    /**
     * @summary Applies a new texture to the faces
     * @param {int} col
     * @param {int} row
     * @param {external:THREE.MeshBasicMaterial} material
     * @private
     */
    ;

    _proto.__swapMaterial = function __swapMaterial(col, row, material) {
      var _this6 = this;

      var uvs = this.prop.geom.getAttribute(ATTR_UV);

      for (var c = 0; c < this.prop.facesByCol; c++) {
        var _loop = function _loop(r) {
          // position of the face (two triangles of the same square)
          var faceCol = col * _this6.prop.facesByCol + c;
          var faceRow = row * _this6.prop.facesByRow + r;
          var isFirstRow = faceRow === 0;
          var isLastRow = faceRow === _this6.SPHERE_HORIZONTAL_SEGMENTS - 1; // first vertex for this face (3 or 6 vertices in total)

          var firstVertex = void 0;

          if (isFirstRow) {
            firstVertex = faceCol * _this6.NB_VERTICES_BY_SMALL_FACE;
          } else if (isLastRow) {
            firstVertex = _this6.NB_VERTICES - _this6.SPHERE_SEGMENTS * _this6.NB_VERTICES_BY_SMALL_FACE + faceCol * _this6.NB_VERTICES_BY_SMALL_FACE;
          } else {
            firstVertex = _this6.SPHERE_SEGMENTS * _this6.NB_VERTICES_BY_SMALL_FACE + (faceRow - 1) * _this6.SPHERE_SEGMENTS * _this6.NB_VERTICES_BY_FACE + faceCol * _this6.NB_VERTICES_BY_FACE;
          } // swap material


          var matIndex = _this6.prop.geom.groups.find(function (g) {
            return g.start === firstVertex;
          }).materialIndex;

          _this6.prop.materials[matIndex] = material; // define new uvs

          var top = 1 - r / _this6.prop.facesByRow;
          var bottom = 1 - (r + 1) / _this6.prop.facesByRow;
          var left = c / _this6.prop.facesByCol;
          var right = (c + 1) / _this6.prop.facesByCol;

          if (isFirstRow) {
            uvs.setXY(firstVertex, (left + right) / 2, top);
            uvs.setXY(firstVertex + 1, left, bottom);
            uvs.setXY(firstVertex + 2, right, bottom);
          } else if (isLastRow) {
            uvs.setXY(firstVertex, right, top);
            uvs.setXY(firstVertex + 1, left, top);
            uvs.setXY(firstVertex + 2, (left + right) / 2, bottom);
          } else {
            uvs.setXY(firstVertex, right, top);
            uvs.setXY(firstVertex + 1, left, top);
            uvs.setXY(firstVertex + 2, right, bottom);
            uvs.setXY(firstVertex + 3, left, top);
            uvs.setXY(firstVertex + 4, left, bottom);
            uvs.setXY(firstVertex + 5, right, bottom);
          }
        };

        for (var r = 0; r < this.prop.facesByRow; r++) {
          _loop(r);
        }
      }

      uvs.needsUpdate = true;
    }
    /**
     * @summary Create the texture for the base image
     * @param {HTMLImageElement} img
     * @return {external:THREE.Texture}
     * @private
     */
    ;

    _proto.__createBaseTexture = function __createBaseTexture(img) {
      if (img.width !== img.height * 2) {
        photoSphereViewer.utils.logWarn('Invalid base image, the width should be twice the height');
      }

      return createBaseTexture(img, this.config.baseBlur, function (w) {
        return w / 2;
      });
    };

    return EquirectangularTilesAdapter;
  }(photoSphereViewer.EquirectangularAdapter);
  EquirectangularTilesAdapter.id = 'equirectangular-tiles';
  EquirectangularTilesAdapter.supportsDownload = false;
  EquirectangularTilesAdapter.supportsOverlay = false;

  exports.EquirectangularTilesAdapter = EquirectangularTilesAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=equirectangular-tiles.js.map
