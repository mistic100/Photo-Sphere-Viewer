import { Frustum, ImageLoader, MathUtils, Matrix4, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three';
import { CONSTANTS, EquirectangularAdapter, PSVError, utils } from '../..';
import { Queue } from '../shared/Queue';
import { Task } from '../shared/Task';
import { buildErrorMaterial, createBaseTexture } from '../shared/tiles-utils';


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

const ATTR_UV = 'uv';
const ATTR_ORIGINAL_UV = 'originaluv';
const ATTR_POSITION = 'position';

function tileId(tile) {
  return `${tile.col}x${tile.row}`;
}

const frustum = new Frustum();
const projScreenMatrix = new Matrix4();
const vertexPosition = new Vector3();


/**
 * @summary Adapter for tiled panoramas
 * @memberof PSV.adapters
 * @extends PSV.adapters.AbstractAdapter
 */
export class EquirectangularTilesAdapter extends EquirectangularAdapter {

  static id = 'equirectangular-tiles';
  static supportsDownload = false;
  static supportsOverlay = false;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.adapters.EquirectangularTilesAdapter.Options} options
   */
  constructor(psv, options) {
    super(psv);

    this.psv.config.useXmpData = false;

    /**
     * @member {PSV.adapters.EquirectangularTilesAdapter.Options}
     * @private
     */
    this.config = {
      resolution   : 64,
      showErrorTile: true,
      baseBlur     : true,
      ...options,
    };

    if (!MathUtils.isPowerOfTwo(this.config.resolution)) {
      throw new PSVError('EquirectangularAdapter resolution must be power of two');
    }

    this.SPHERE_SEGMENTS = this.config.resolution;
    this.SPHERE_HORIZONTAL_SEGMENTS = this.SPHERE_SEGMENTS / 2;
    this.NB_VERTICES_BY_FACE = 6;
    this.NB_VERTICES_BY_SMALL_FACE = 3;
    this.NB_VERTICES = 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
      + (this.SPHERE_HORIZONTAL_SEGMENTS - 2) * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;
    this.NB_GROUPS = this.SPHERE_SEGMENTS * this.SPHERE_HORIZONTAL_SEGMENTS;

    /**
     * @member {PSV.adapters.Queue}
     * @private
     */
    this.queue = new Queue();

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
    this.prop = {
      colSize      : 0,
      rowSize      : 0,
      facesByCol   : 0,
      facesByRow   : 0,
      tiles        : {},
      geom         : null,
      materials    : [],
      errorMaterial: null,
    };

    /**
     * @member {external:THREE.ImageLoader}
     * @private
     */
    this.loader = new ImageLoader();
    if (this.psv.config.withCredentials) {
      this.loader.setWithCredentials(true);
    }
    if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'object') {
      this.loader.setRequestHeader(this.psv.config.requestHeaders);
    }

    this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.ZOOM_UPDATED, this);

    this.__cleanup();

    this.prop.errorMaterial?.map?.dispose();
    this.prop.errorMaterial?.dispose();

    delete this.queue;
    delete this.loader;
    delete this.prop.geom;
    delete this.prop.errorMaterial;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case CONSTANTS.EVENTS.POSITION_UPDATED:
      case CONSTANTS.EVENTS.ZOOM_UPDATED:
        this.__refresh();
        break;
    }
    /* eslint-enable */
  }

  /**
   * @summary Clears loading queue, dispose all materials
   * @private
   */
  __cleanup() {
    this.queue.clear();
    this.prop.tiles = {};

    this.prop.materials.forEach((mat) => {
      mat?.map?.dispose();
      mat?.dispose();
    });
    this.prop.materials.length = 0;
  }

  /**
   * @override
   */
  supportsTransition(panorama) {
    return !!panorama.baseUrl;
  }

  /**
   * @override
   */
  supportsPreload(panorama) {
    return !!panorama.baseUrl;
  }

  /**
   * @override
   * @param {PSV.adapters.EquirectangularTilesAdapter.Panorama} panorama
   * @returns {Promise.<PSV.TextureData>}
   */
  loadTexture(panorama) {
    if (typeof panorama !== 'object' || !panorama.width || !panorama.cols || !panorama.rows || !panorama.tileUrl) {
      return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?'));
    }
    if (panorama.cols > this.SPHERE_SEGMENTS) {
      return Promise.reject(new PSVError(`Panorama cols must not be greater than ${this.SPHERE_SEGMENTS}.`));
    }
    if (panorama.rows > this.SPHERE_HORIZONTAL_SEGMENTS) {
      return Promise.reject(new PSVError(`Panorama rows must not be greater than ${this.SPHERE_HORIZONTAL_SEGMENTS}.`));
    }
    if (!MathUtils.isPowerOfTwo(panorama.cols) || !MathUtils.isPowerOfTwo(panorama.rows)) {
      return Promise.reject(new PSVError('Panorama cols and rows must be powers of 2.'));
    }

    const panoData = {
      fullWidth    : panorama.width,
      fullHeight   : panorama.width / 2,
      croppedWidth : panorama.width,
      croppedHeight: panorama.width / 2,
      croppedX     : 0,
      croppedY     : 0,
      poseHeading  : 0,
      posePitch    : 0,
      poseRoll     : 0,
    };

    if (panorama.baseUrl) {
      return super.loadTexture(panorama.baseUrl, panorama.basePanoData)
        .then(textureData => ({
          panorama: panorama,
          texture : textureData.texture,
          panoData: panoData,
        }));
    }
    else {
      return Promise.resolve({ panorama, panoData });
    }
  }

  /**
   * @override
   */
  createMesh(scale = 1) {
    const geometry = new SphereGeometry(
      CONSTANTS.SPHERE_RADIUS * scale,
      this.SPHERE_SEGMENTS,
      this.SPHERE_HORIZONTAL_SEGMENTS,
      -Math.PI / 2
    )
      .scale(-1, 1, 1)
      .toNonIndexed();

    geometry.clearGroups();
    let i = 0;
    let k = 0;
    // first row
    for (; i < this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE; i += this.NB_VERTICES_BY_SMALL_FACE) {
      geometry.addGroup(i, this.NB_VERTICES_BY_SMALL_FACE, k++);
    }
    // second to before last rows
    for (; i < this.NB_VERTICES - this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE; i += this.NB_VERTICES_BY_FACE) {
      geometry.addGroup(i, this.NB_VERTICES_BY_FACE, k++);
    }
    // last row
    for (; i < this.NB_VERTICES; i += this.NB_VERTICES_BY_SMALL_FACE) {
      geometry.addGroup(i, this.NB_VERTICES_BY_SMALL_FACE, k++);
    }

    geometry.setAttribute(ATTR_ORIGINAL_UV, geometry.getAttribute(ATTR_UV).clone());

    return new Mesh(geometry, []);
  }

  /**
   * @summary Applies the base texture and starts the loading of tiles
   * @override
   */
  setTexture(mesh, textureData, transition) {
    const { panorama, texture } = textureData;

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
    this.prop.facesByRow = this.SPHERE_HORIZONTAL_SEGMENTS / panorama.rows;

    // this.psv.renderer.scene.add(createWireFrame(this.prop.geom));

    setTimeout(() => this.__refresh(true));
  }

  /**
   * @private
   */
  __setTexture(mesh, texture) {
    let material;
    if (texture) {
      material = new MeshBasicMaterial({ map: texture });
    }
    else {
      material = new MeshBasicMaterial({ opacity: 0, transparent: true });
    }

    for (let i = 0; i < this.NB_GROUPS; i++) {
      mesh.material.push(material);
    }
  }

  /**
   * @override
   */
  setTextureOpacity(mesh, opacity) {
    mesh.material[0].opacity = opacity;
    mesh.material[0].transparent = opacity < 1;
  }

  /**
   * @summary Compute visible tiles and load them
   * @param {boolean} [init=false] Indicates initial call
   * @private
   */
  __refresh(init = false) { // eslint-disable-line no-unused-vars
    if (!this.prop.geom) {
      return;
    }

    const camera = this.psv.renderer.camera;
    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    const panorama = this.psv.config.panorama;
    const verticesPosition = this.prop.geom.getAttribute(ATTR_POSITION);
    const tilesToLoad = [];

    for (let col = 0; col < panorama.cols; col++) {
      for (let row = 0; row < panorama.rows; row++) {
        // for each tile, find the vertices corresponding to the four corners (three for first and last rows)
        // if at least one vertex is visible, the tile must be loaded
        // for larger tiles we also test the four edges centers and the tile center

        const verticesIndex = [];

        if (row === 0) {
          // bottom-left
          const v0 = this.prop.facesByRow === 1
            ? col * this.prop.facesByCol * this.NB_VERTICES_BY_SMALL_FACE + 1
            : this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
            + (this.prop.facesByRow - 2) * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE
            + col * this.prop.facesByCol * this.NB_VERTICES_BY_FACE + 4;

          // bottom-right
          const v1 = this.prop.facesByRow === 1
            ? v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_SMALL_FACE + 1
            : v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE + 1;

          // top (all vertices are equal)
          const v2 = 0;

          verticesIndex.push(v0, v1, v2);

          if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
            // bottom-center
            const v4 = v0 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;

            verticesIndex.push(v4);
          }

          if (this.prop.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
            // left-center
            const v6 = v0 - this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

            // right-center
            const v7 = v1 - this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

            verticesIndex.push(v6, v7);
          }
        }
        else if (row === panorama.rows - 1) {
          // top-left
          const v0 = this.prop.facesByRow === 1
            ? -this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
            + row * this.prop.facesByRow * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE
            + col * this.prop.facesByCol * this.NB_VERTICES_BY_SMALL_FACE + 1
            : -this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
            + row * this.prop.facesByRow * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE
            + col * this.prop.facesByCol * this.NB_VERTICES_BY_FACE + 1;

          // top-right
          const v1 = this.prop.facesByRow === 1
            ? v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_SMALL_FACE - 1
            : v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE - 1;

          // bottom (all vertices are equal)
          const v2 = this.NB_VERTICES - 1;

          verticesIndex.push(v0, v1, v2);

          if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
            // top-center
            const v4 = v0 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;

            verticesIndex.push(v4);
          }

          if (this.prop.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
            // left-center
            const v6 = v0 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

            // right-center
            const v7 = v1 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

            verticesIndex.push(v6, v7);
          }
        }
        else {
          // top-left
          const v0 = -this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
            + row * this.prop.facesByRow * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE
            + col * this.prop.facesByCol * this.NB_VERTICES_BY_FACE + 1;

          // bottom-left
          const v1 = v0 + (this.prop.facesByRow - 1) * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE + 3;

          // bottom-right
          const v2 = v1 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE + 1;

          // top-right
          const v3 = v0 + (this.prop.facesByCol - 1) * this.NB_VERTICES_BY_FACE - 1;

          verticesIndex.push(v0, v1, v2, v3);

          if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
            // top-center
            const v4 = v0 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;

            // bottom-center
            const v5 = v1 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;

            verticesIndex.push(v4, v5);
          }

          if (this.prop.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
            // left-center
            const v6 = v0 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

            // right-center
            const v7 = v3 + this.prop.facesByRow / 2 * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE;

            verticesIndex.push(v6, v7);

            if (this.prop.facesByCol >= this.SPHERE_SEGMENTS / 8) {
              // center-center
              const v8 = v6 + this.prop.facesByCol / 2 * this.NB_VERTICES_BY_FACE;

              verticesIndex.push(v8);
            }
          }
        }

        // if (init && col === 0 && row === 0) {
        //   verticesIndex.forEach((vertexIdx) => {
        //     this.psv.renderer.scene.add(createDot(
        //       verticesPosition.getX(vertexIdx),
        //       verticesPosition.getY(vertexIdx),
        //       verticesPosition.getZ(vertexIdx)
        //     ));
        //   });
        // }

        const vertexVisible = verticesIndex.some((vertexIdx) => {
          vertexPosition.set(
            verticesPosition.getX(vertexIdx),
            verticesPosition.getY(vertexIdx),
            verticesPosition.getZ(vertexIdx)
          );
          vertexPosition.applyEuler(this.psv.renderer.meshContainer.rotation);
          return frustum.containsPoint(vertexPosition);
        });

        if (vertexVisible) {
          let angle = vertexPosition.angleTo(this.psv.prop.direction);
          if (row === 0 || row === panorama.rows - 1) {
            angle *= 2; // lower priority to top and bottom tiles
          }
          tilesToLoad.push({ col, row, angle });
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
  __loadTiles(tiles) {
    this.queue.disableAllTasks();

    tiles.forEach((tile) => {
      const id = tileId(tile);

      if (this.prop.tiles[id]) {
        this.queue.setPriority(id, tile.angle);
      }
      else {
        this.prop.tiles[id] = true;
        this.queue.enqueue(new Task(id, tile.angle, task => this.__loadTile(tile, task)));
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
  __loadTile(tile, task) {
    const panorama = this.psv.config.panorama;
    const url = panorama.tileUrl(tile.col, tile.row);

    if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'function') {
      this.loader.setRequestHeader(this.psv.config.requestHeaders(url));
    }

    return new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    })
      .then((image) => {
        if (!task.isCancelled()) {
          const material = new MeshBasicMaterial({ map: utils.createTexture(image) });
          this.__swapMaterial(tile.col, tile.row, material);
          this.psv.needsUpdate();
        }
      })
      .catch(() => {
        if (!task.isCancelled() && this.config.showErrorTile) {
          if (!this.prop.errorMaterial) {
            this.prop.errorMaterial = buildErrorMaterial(this.prop.colSize, this.prop.rowSize);
          }
          this.__swapMaterial(tile.col, tile.row, this.prop.errorMaterial);
          this.psv.needsUpdate();
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
  __swapMaterial(col, row, material) {
    const uvs = this.prop.geom.getAttribute(ATTR_UV);

    for (let c = 0; c < this.prop.facesByCol; c++) {
      for (let r = 0; r < this.prop.facesByRow; r++) {
        // position of the face (two triangles of the same square)
        const faceCol = col * this.prop.facesByCol + c;
        const faceRow = row * this.prop.facesByRow + r;
        const isFirstRow = faceRow === 0;
        const isLastRow = faceRow === (this.SPHERE_HORIZONTAL_SEGMENTS - 1);

        // first vertex for this face (3 or 6 vertices in total)
        let firstVertex;
        if (isFirstRow) {
          firstVertex = faceCol * this.NB_VERTICES_BY_SMALL_FACE;
        }
        else if (isLastRow) {
          firstVertex = this.NB_VERTICES
            - this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
            + faceCol * this.NB_VERTICES_BY_SMALL_FACE;
        }
        else {
          firstVertex = this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_SMALL_FACE
            + (faceRow - 1) * this.SPHERE_SEGMENTS * this.NB_VERTICES_BY_FACE
            + faceCol * this.NB_VERTICES_BY_FACE;
        }

        // swap material
        const matIndex = this.prop.geom.groups.find(g => g.start === firstVertex).materialIndex;
        this.prop.materials[matIndex] = material;

        // define new uvs
        const top = 1 - r / this.prop.facesByRow;
        const bottom = 1 - (r + 1) / this.prop.facesByRow;
        const left = c / this.prop.facesByCol;
        const right = (c + 1) / this.prop.facesByCol;

        if (isFirstRow) {
          uvs.setXY(firstVertex, (left + right) / 2, top);
          uvs.setXY(firstVertex + 1, left, bottom);
          uvs.setXY(firstVertex + 2, right, bottom);
        }
        else if (isLastRow) {
          uvs.setXY(firstVertex, right, top);
          uvs.setXY(firstVertex + 1, left, top);
          uvs.setXY(firstVertex + 2, (left + right) / 2, bottom);
        }
        else {
          uvs.setXY(firstVertex, right, top);
          uvs.setXY(firstVertex + 1, left, top);
          uvs.setXY(firstVertex + 2, right, bottom);
          uvs.setXY(firstVertex + 3, left, top);
          uvs.setXY(firstVertex + 4, left, bottom);
          uvs.setXY(firstVertex + 5, right, bottom);
        }
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
  __createBaseTexture(img) {
    if (img.width !== img.height * 2) {
      utils.logWarn('Invalid base image, the width should be twice the height');
    }

    return createBaseTexture(img, this.config.baseBlur, w => w / 2);
  }

}
