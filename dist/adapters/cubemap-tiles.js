/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer'), require('photo-sphere-viewer/dist/adapters/cubemap')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer', 'photo-sphere-viewer/dist/adapters/cubemap'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.CubemapTilesAdapter = {}), global.THREE, global.PhotoSphereViewer, global.PhotoSphereViewer.CubemapAdapter));
})(this, (function (exports, three, photoSphereViewer, cubemap) { 'use strict';

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

  if (!cubemap.CubemapAdapter) {
    throw new photoSphereViewer.PSVError('CubemapAdapter is missing, please load cubemap.js before cubemap-tiles.js');
  }
  /**
   * @callback TileUrl
   * @summary Function called to build a tile url
   * @memberOf PSV.adapters.CubemapTilesAdapter
   * @param {'left'|'front'|'right'|'back'|'top'|'bottom'} face
   * @param {int} col
   * @param {int} row
   * @returns {string}
   */

  /**
   * @typedef {Object} PSV.adapters.CubemapTilesAdapter.Panorama
   * @summary Configuration of a tiled cubemap
   * @property {PSV.adapters.CubemapAdapter.Cubemap} [baseUrl] - low resolution panorama loaded before tiles
   * @property {int} faceSize - size of a face
   * @property {int} nbTiles - number of tiles on a side of a face
   * @property {PSV.adapters.CubemapTilesAdapter.TileUrl} tileUrl - function to build a tile url
   */

  /**
   * @typedef {Object} PSV.adapters.CubemapTilesAdapter.Options
   * @property {boolean} [flipTopBottom=false] - set to true if the top and bottom faces are not correctly oriented
   * @property {boolean} [showErrorTile=true] - shows a warning sign on tiles that cannot be loaded
   * @property {boolean} [baseBlur=true] - applies a blur to the low resolution panorama
   */

  /**
   * @typedef {Object} PSV.adapters.CubemapTilesAdapter.Tile
   * @private
   * @property {int} face
   * @property {int} col
   * @property {int} row
   * @property {float} angle
   */


  var CUBE_SEGMENTS = 16;
  var NB_VERTICES_BY_FACE = 6;
  var NB_VERTICES_BY_PLANE = NB_VERTICES_BY_FACE * CUBE_SEGMENTS * CUBE_SEGMENTS;
  var NB_VERTICES = 6 * NB_VERTICES_BY_PLANE;
  var NB_GROUPS_BY_FACE = CUBE_SEGMENTS * CUBE_SEGMENTS;
  var ATTR_UV = 'uv';
  var ATTR_ORIGINAL_UV = 'originaluv';
  var ATTR_POSITION = 'position';

  function tileId(tile) {
    return tile.face + ":" + tile.col + "x" + tile.row;
  }

  var frustum = new three.Frustum();
  var projScreenMatrix = new three.Matrix4();
  var vertexPosition = new three.Vector3();
  /**
   * @summary Adapter for tiled cubemaps
   * @memberof PSV.adapters
   * @extends PSV.adapters.AbstractAdapter
   */

  var CubemapTilesAdapter = /*#__PURE__*/function (_CubemapAdapter) {
    _inheritsLoose(CubemapTilesAdapter, _CubemapAdapter);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.adapters.CubemapTilesAdapter.Options} options
     */
    function CubemapTilesAdapter(psv, options) {
      var _this;

      _this = _CubemapAdapter.call(this, psv) || this;
      /**
       * @member {PSV.adapters.CubemapTilesAdapter.Options}
       * @private
       */

      _this.config = _extends({
        flipTopBottom: false,
        showErrorTile: true,
        baseBlur: true
      }, options);
      /**
       * @member {PSV.adapters.Queue}
       * @private
       */

      _this.queue = new Queue();
      /**
       * @type {Object}
       * @property {int} tileSize - size in pixels of a tile
       * @property {int} facesByTile - number of mesh faces by tile
       * @property {Record<string, boolean>} tiles - loaded tiles
       * @property {external:THREE.BoxGeometry} geom
       * @property {external:THREE.MeshBasicMaterial[]} materials
       * @property {external:THREE.MeshBasicMaterial} errorMaterial
       * @private
       */

      _this.prop = {
        tileSize: 0,
        facesByTile: 0,
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


    var _proto = CubemapTilesAdapter.prototype;

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

      _CubemapAdapter.prototype.destroy.call(this);
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
     * @param {PSV.adapters.CubemapTilesAdapter.Panorama} panorama
     * @returns {Promise.<PSV.TextureData>}
     */
    ;

    _proto.loadTexture = function loadTexture(panorama) {
      if (typeof panorama !== 'object' || !panorama.faceSize || !panorama.nbTiles || !panorama.tileUrl) {
        return Promise.reject(new photoSphereViewer.PSVError('Invalid panorama configuration, are you using the right adapter?'));
      }

      if (panorama.nbTiles > CUBE_SEGMENTS) {
        return Promise.reject(new photoSphereViewer.PSVError("Panorama nbTiles must not be greater than " + CUBE_SEGMENTS + "."));
      }

      if (!three.MathUtils.isPowerOfTwo(panorama.nbTiles)) {
        return Promise.reject(new photoSphereViewer.PSVError('Panorama nbTiles must be power of 2.'));
      }

      if (panorama.baseUrl) {
        return _CubemapAdapter.prototype.loadTexture.call(this, panorama.baseUrl).then(function (textureData) {
          return {
            panorama: panorama,
            texture: textureData.texture
          };
        });
      } else {
        return Promise.resolve({
          panorama: panorama
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

      var cubeSize = photoSphereViewer.CONSTANTS.SPHERE_RADIUS * 2 * scale;
      var geometry = new three.BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_SEGMENTS, CUBE_SEGMENTS, CUBE_SEGMENTS).scale(1, 1, -1).toNonIndexed();
      geometry.clearGroups();

      for (var i = 0, k = 0; i < NB_VERTICES; i += NB_VERTICES_BY_FACE) {
        geometry.addGroup(i, NB_VERTICES_BY_FACE, k++);
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
      this.prop.tileSize = panorama.faceSize / panorama.nbTiles;
      this.prop.facesByTile = CUBE_SEGMENTS / panorama.nbTiles; // this.psv.renderer.scene.add(createWireFrame(this.prop.geom));

      setTimeout(function () {
        return _this2.__refresh(true);
      });
    }
    /**
     * @private
     */
    ;

    _proto.__setTexture = function __setTexture(mesh, texture) {
      for (var i = 0; i < 6; i++) {
        var material = void 0;

        if (texture) {
          if (this.config.flipTopBottom && (i === 2 || i === 3)) {
            texture[i].center = new three.Vector2(0.5, 0.5);
            texture[i].rotation = Math.PI;
          }

          material = new three.MeshBasicMaterial({
            map: texture[i]
          });
        } else {
          material = new three.MeshBasicMaterial({
            opacity: 0,
            transparent: true
          });
        }

        for (var j = 0; j < NB_GROUPS_BY_FACE; j++) {
          mesh.material.push(material);
        }
      }
    }
    /**
     * @override
     */
    ;

    _proto.setTextureOpacity = function setTextureOpacity(mesh, opacity) {
      for (var i = 0; i < 6; i++) {
        mesh.material[i * NB_GROUPS_BY_FACE].opacity = opacity;
        mesh.material[i * NB_GROUPS_BY_FACE].transparent = opacity < 1;
      }
    }
    /**
     * @summary Compute visible tiles and load them
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

      for (var face = 0; face < 6; face++) {
        for (var col = 0; col < panorama.nbTiles; col++) {
          for (var row = 0; row < panorama.nbTiles; row++) {
            // for each tile, find the vertices corresponding to the four corners
            // if at least one vertex is visible, the tile must be loaded
            // for larger tiles we also test the four edges centers and the tile center
            var verticesIndex = []; // top-left

            var v0 = face * NB_VERTICES_BY_PLANE + row * this.prop.facesByTile * CUBE_SEGMENTS * NB_VERTICES_BY_FACE + col * this.prop.facesByTile * NB_VERTICES_BY_FACE; // bottom-left

            var v1 = v0 + CUBE_SEGMENTS * NB_VERTICES_BY_FACE * (this.prop.facesByTile - 1) + 1; // bottom-right

            var v2 = v1 + this.prop.facesByTile * NB_VERTICES_BY_FACE - 3; // top-right

            var v3 = v0 + this.prop.facesByTile * NB_VERTICES_BY_FACE - 1;
            verticesIndex.push(v0, v1, v2, v3);

            if (this.prop.facesByTile >= CUBE_SEGMENTS / 2) {
              // top-center
              var v4 = v0 + this.prop.facesByTile / 2 * NB_VERTICES_BY_FACE - 1; // bottom-center

              var v5 = v1 + this.prop.facesByTile / 2 * NB_VERTICES_BY_FACE - 3; // left-center

              var v6 = v0 + CUBE_SEGMENTS * NB_VERTICES_BY_FACE * (this.prop.facesByTile / 2 - 1) + 1; // right-center

              var v7 = v6 + this.prop.facesByTile * NB_VERTICES_BY_FACE - 3; // center-center

              var v8 = v6 + this.prop.facesByTile / 2 * NB_VERTICES_BY_FACE;
              verticesIndex.push(v4, v5, v6, v7, v8);
            } // if (init && face === 5 && col === 0 && row === 0) {
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
              tilesToLoad.push({
                face: face,
                col: col,
                row: row,
                angle: angle
              });
            }
          }
        }
      }

      this.__loadTiles(tilesToLoad);
    }
    /**
     * @summary Loads tiles and change existing tiles priority
     * @param {PSV.adapters.CubemapTilesAdapter.Tile[]} tiles
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
     * @param {PSV.adapters.CubemapTilesAdapter.Tile} tile
     * @param {PSV.adapters.Task} task
     * @return {Promise}
     * @private
     */
    ;

    _proto.__loadTile = function __loadTile(tile, task) {
      var _this5 = this;

      var panorama = this.psv.config.panorama;
      var col = tile.col,
          row = tile.row;

      if (this.config.flipTopBottom && (tile.face === 2 || tile.face === 3)) {
        col = panorama.nbTiles - col - 1;
        row = panorama.nbTiles - row - 1;
      }

      var url = panorama.tileUrl(cubemap.CUBE_HASHMAP[tile.face], col, row);

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

          _this5.__swapMaterial(tile.face, tile.col, tile.row, material);

          _this5.psv.needsUpdate();
        }
      }).catch(function () {
        if (!task.isCancelled() && _this5.config.showErrorTile) {
          if (!_this5.prop.errorMaterial) {
            _this5.prop.errorMaterial = buildErrorMaterial(_this5.prop.tileSize, _this5.prop.tileSize);
          }

          _this5.__swapMaterial(tile.face, tile.col, tile.row, _this5.prop.errorMaterial);

          _this5.psv.needsUpdate();
        }
      });
    }
    /**
     * @summary Applies a new texture to the faces
     * @param {int} face
     * @param {int} col
     * @param {int} row
     * @param {external:THREE.MeshBasicMaterial} material
     * @private
     */
    ;

    _proto.__swapMaterial = function __swapMaterial(face, col, row, material) {
      var _this6 = this;

      var uvs = this.prop.geom.getAttribute(ATTR_UV);

      for (var c = 0; c < this.prop.facesByTile; c++) {
        var _loop = function _loop(r) {
          // position of the face (two triangles of the same square)
          var faceCol = col * _this6.prop.facesByTile + c;
          var faceRow = row * _this6.prop.facesByTile + r; // first vertex for this face (6 vertices in total)

          var firstVertex = NB_VERTICES_BY_PLANE * face + 6 * (CUBE_SEGMENTS * faceRow + faceCol); // swap material

          var matIndex = _this6.prop.geom.groups.find(function (g) {
            return g.start === firstVertex;
          }).materialIndex;

          _this6.prop.materials[matIndex] = material; // define new uvs

          var top = 1 - r / _this6.prop.facesByTile;
          var bottom = 1 - (r + 1) / _this6.prop.facesByTile;
          var left = c / _this6.prop.facesByTile;
          var right = (c + 1) / _this6.prop.facesByTile;

          if (_this6.config.flipTopBottom && (face === 2 || face === 3)) {
            top = 1 - top;
            bottom = 1 - bottom;
            left = 1 - left;
            right = 1 - right;
          }

          uvs.setXY(firstVertex, left, top);
          uvs.setXY(firstVertex + 1, left, bottom);
          uvs.setXY(firstVertex + 2, right, top);
          uvs.setXY(firstVertex + 3, left, bottom);
          uvs.setXY(firstVertex + 4, right, bottom);
          uvs.setXY(firstVertex + 5, right, top);
        };

        for (var r = 0; r < this.prop.facesByTile; r++) {
          _loop(r);
        }
      }

      uvs.needsUpdate = true;
    }
    /**
     * @summary Create the texture for the base image
     * @param {HTMLImageElement} img
     * @return {external:THREE.Texture}
     * @override
     * @private
     */
    ;

    _proto.__createCubemapTexture = function __createCubemapTexture(img) {
      if (img.width !== img.height) {
        photoSphereViewer.utils.logWarn('Invalid base image, the width should equals the height');
      }

      return createBaseTexture(img, this.config.baseBlur, function (w) {
        return w;
      });
    };

    return CubemapTilesAdapter;
  }(cubemap.CubemapAdapter);
  CubemapTilesAdapter.id = 'cubemap-tiles';
  CubemapTilesAdapter.supportsDownload = false;
  CubemapTilesAdapter.supportsOverlay = false;

  exports.CubemapTilesAdapter = CubemapTilesAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cubemap-tiles.js.map
