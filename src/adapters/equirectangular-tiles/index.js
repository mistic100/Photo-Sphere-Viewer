import * as THREE from 'three';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '../..';
import { Queue } from './Queue';
import { Task } from './Task';

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
 * @property {int} width - complete panorama width (height is always width/2)
 * @property {int} cols - number of vertical tiles
 * @property {int} rows - number of horizontal tiles
 * @property {PSV.adapters.EquirectangularTilesAdapter.TileUrl} tileUrl - function to build a tile url
 */

/**
 * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Options
 * @property {boolean} [showErrorTile=true] - shows a warning sign on tiles that cannot be loaded
 * @property {boolean} [baseBlur=true] - applies a blur to the low resolution panorama
 */

/**
 * @typedef {Object} PSV.adapters.EquirectangularTilesAdapter.Tile
 * @private
 * @property {int} col
 * @property {int} row
 * @property {int} angle
 */

const SPHERE_SEGMENTS = 64;
const NB_VERTICES = 3 * (SPHERE_SEGMENTS * 2 + (SPHERE_SEGMENTS / 2 - 2) * SPHERE_SEGMENTS * 2);
const NB_GROUPS = SPHERE_SEGMENTS * 2 + (SPHERE_SEGMENTS / 2 - 2) * SPHERE_SEGMENTS;
const QUEUE_CONCURENCY = 4;

function tileId(tile) {
  return `${tile.col}x${tile.row}`;
}

function powerOfTwo(x) {
  return (Math.log(x) / Math.log(2)) % 1 === 0;
}


/**
 * @summary Adapter for tiled panoramas
 * @memberof PSV.adapters
 */
export class EquirectangularTilesAdapter extends AbstractAdapter {

  static id = 'equirectangular-tiles';
  static supportsTransition = false;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.adapters.EquirectangularTilesAdapter.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {PSV.adapters.EquirectangularTilesAdapter.Options}
     * @private
     */
    this.config = {
      showErrorTile: true,
      baseBlur     : true,
      ...options,
    };

    /**
     * @member {external:THREE.MeshBasicMaterial[]}
     * @private
     */
    this.materials = [];

    /**
     * @member {PSV.adapters.EquirectangularTilesAdapter.Queue}
     * @private
     */
    this.queue = new Queue(QUEUE_CONCURENCY);

    /**
     * @type {Object}
     * @property {int} colSize - size in pixels of a column
     * @property {int} rowSize - size in pixels of a row
     * @property {int} facesByCol - number of mesh faces by column
     * @property {int} facesByRow - number of mesh faces by row
     * @property {Record<string, boolean>} tiles - loaded tiles
     * @property {external:THREE.SphereGeometry} geom
     * @property {*} originalUvs
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
      originalUvs  : null,
      errorMaterial: null,
    };

    /**
     * @member {external:THREE.ImageLoader}
     * @private
     */
    this.loader = new THREE.ImageLoader();
    if (this.psv.config.withCredentials) {
      this.loader.setWithCredentials(true);
    }
    if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'object') {
      this.loader.setRequestHeader(this.psv.config.requestHeaders);
    }

    this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
  }

  destroy() {
    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.ZOOM_UPDATED, this);

    this.__cleanup();

    this.prop.errorMaterial?.map?.dispose();
    this.prop.errorMaterial?.dispose();

    delete this.queue;
    delete this.loader;
    delete this.prop.geom;
    delete this.prop.originalUvs;
    delete this.prop.errorMaterial;

    super.destroy();
  }

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

    this.materials.forEach((mat) => {
      mat?.map?.dispose();
      mat?.dispose();
    });
    this.materials.length = 0;
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
    if (panorama.cols > SPHERE_SEGMENTS) {
      return Promise.reject(new PSVError(`Panorama cols must not be greater than ${SPHERE_SEGMENTS}.`));
    }
    if (panorama.rows > SPHERE_SEGMENTS / 2) {
      return Promise.reject(new PSVError(`Panorama rows must not be greater than ${SPHERE_SEGMENTS / 2}.`));
    }
    if (!powerOfTwo(panorama.cols) || !powerOfTwo(panorama.rows)) {
      return Promise.reject(new PSVError('Panorama cols and rows must be powers of 2.'));
    }

    panorama.height = panorama.width / 2;

    this.prop.colSize = panorama.width / panorama.cols;
    this.prop.rowSize = panorama.height / panorama.rows;
    this.prop.facesByCol = SPHERE_SEGMENTS / panorama.cols;
    this.prop.facesByRow = SPHERE_SEGMENTS / 2 / panorama.rows;

    this.__cleanup();

    if (this.prop.geom) {
      this.prop.geom.setAttribute('uv', this.prop.originalUvs.clone());
    }

    const panoData = {
      fullWidth    : panorama.width,
      fullHeight   : panorama.height,
      croppedWidth : panorama.width,
      croppedHeight: panorama.height,
      croppedX     : 0,
      croppedY     : 0,
    };

    if (panorama.baseUrl) {
      return this.psv.textureLoader.loadImage(panorama.baseUrl, p => this.psv.loader.setProgress(p))
        .then((img) => {
          return {
            texture : this.__createBaseTexture(img),
            panoData: panoData,
          };
        });
    }
    else {
      return Promise.resolve({
        texture : null,
        panoData: panoData,
      });
    }
  }

  /**
   * @override
   */
  createMesh(scale = 1) {
    const geometry = new THREE.SphereGeometry(CONSTANTS.SPHERE_RADIUS * scale, SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2, -Math.PI / 2)
      .toNonIndexed();

    let i = 0;
    let k = 0;

    // first row
    for (; i < SPHERE_SEGMENTS * 3; i += 3) {
      geometry.addGroup(i, 3, k++);
    }

    // second to before last rows
    for (; i < NB_VERTICES - SPHERE_SEGMENTS * 3; i += 6) {
      geometry.addGroup(i, 6, k++);
    }

    // last row
    for (; i < NB_VERTICES; i += 3) {
      geometry.addGroup(i, 3, k++);
    }

    this.prop.geom = geometry;
    this.prop.originalUvs = geometry.getAttribute('uv').clone();

    const mesh = new THREE.Mesh(geometry, this.materials);
    mesh.scale.set(-1, 1, 1);

    return mesh;
  }

  /**
   * @summary Applies the base texture and starts the loading of tiles
   * @override
   */
  setTexture(mesh, textureData) {
    if (textureData.texture) {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map : textureData.texture,
      });

      for (let i = 0; i < NB_GROUPS; i++) {
        this.materials.push(material);
      }
    }

    setTimeout(() => this.__refresh());
  }

  /**
   * @summary Compute visible tiles and load them
   * @private
   */
  __refresh() {
    const viewerSize = this.psv.prop.size;
    const panorama = this.psv.config.panorama;

    const tilesToLoad = [];
    const tilePosition = new THREE.Vector3();

    for (let col = 0; col <= panorama.cols; col++) {
      for (let row = 0; row <= panorama.rows; row++) {
        // TODO prefilter with less complex math if possible
        const tileTexturePosition = { x: col * this.prop.colSize, y: row * this.prop.rowSize };
        this.psv.dataHelper.sphericalCoordsToVector3(this.psv.dataHelper.textureCoordsToSphericalCoords(tileTexturePosition), tilePosition);

        if (tilePosition.dot(this.psv.prop.direction) > 0) {
          const tileViewerPosition = this.psv.dataHelper.vector3ToViewerCoords(tilePosition);

          if (tileViewerPosition.x >= 0
            && tileViewerPosition.x <= viewerSize.width
            && tileViewerPosition.y >= 0
            && tileViewerPosition.y <= viewerSize.height) {
            const angle = tilePosition.angleTo(this.psv.prop.direction);

            this.__getAdjacentTiles(col, row)
              .forEach((tile) => {
                const existingTile = tilesToLoad.find(c => c.row === tile.row && c.col === tile.col);
                if (existingTile) {
                  existingTile.angle = Math.min(existingTile.angle, angle);
                }
                else {
                  tilesToLoad.push({ ...tile, angle });
                }
              });
          }
        }
      }
    }

    this.__loadTiles(tilesToLoad);
  }

  /**
   * @summary Get the 4 adjacent tiles
   * @private
   */
  __getAdjacentTiles(col, row) {
    const panorama = this.psv.config.panorama;

    return [
      { col: col - 1, row: row - 1 },
      { col: col, row: row - 1 },
      { col: col, row: row }, // eslint-disable-line object-shorthand
      { col: col - 1, row: row },
    ]
      .map((tile) => {
        // examples are for cols=16 and rows=8
        if (tile.row < 0) {
          // wrap on top
          tile.row = -tile.row - 1; // -1 => 0, -2 => 1
          tile.col += panorama.cols / 2; // change hemisphere
        }
        else if (tile.row >= panorama.rows) {
          // wrap on bottom
          tile.row = (panorama.rows - 1) - (tile.row - panorama.rows); // 8 => 7, 9 => 6
          tile.col += panorama.cols / 2; // change hemisphere
        }
        if (tile.col < 0) {
          // wrap on left
          tile.col += panorama.cols; // -1 => 15, -2 => 14
        }
        else if (tile.col >= panorama.cols) {
          // wrap on right
          tile.col -= panorama.cols; // 16 => 0, 17 => 1
        }

        return tile;
      });
  }

  /**
   * @summary Loads tiles and change existing tiles priority
   * @param {PSV.adapters.EquirectangularTilesAdapter.Tile[]} tiles
   * @private
   */
  __loadTiles(tiles) {
    this.queue.setAllPriorities(0);

    tiles.forEach((tile) => {
      const id = tileId(tile);
      const priority = Math.PI / 2 - tile.angle;

      if (this.prop.tiles[id]) {
        this.queue.setPriority(id, priority);
      }
      else {
        this.prop.tiles[id] = true;
        this.queue.enqueue(new Task(id, priority, task => this.__loadTile(tile, task)));
      }
    });

    this.queue.start();
  }

  /**
   * @summary Loads and draw a tile
   * @param {PSV.adapters.EquirectangularTilesAdapter.Tile} tile
   * @param {PSV.adapters.EquirectangularTilesAdapter.Task} task
   * @return {Promise}
   * @private
   */
  __loadTile(tile, task) {
    const panorama = this.psv.config.panorama;
    const url = panorama.tileUrl(tile.col, tile.row);

    if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'function') {
      this.loader.setRequestHeader(this.psv.config.requestHeaders(url));
    }

    return new Promise((resolve, reject) => this.loader.load(url, resolve, undefined, reject))
      .then((image) => {
        if (!task.isCancelled()) {
          const material = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            map : utils.createTexture(image),
          });
          this.__swapMaterial(tile.col, tile.row, material);
          this.psv.needsUpdate();
        }
      })
      .catch(() => {
        if (!task.isCancelled() && this.config.showErrorTile) {
          const material = this.__getErrorMaterial();
          this.__swapMaterial(tile.col, tile.row, material);
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
    const uvs = this.prop.geom.getAttribute('uv');

    for (let c = 0; c < this.prop.facesByCol; c++) {
      for (let r = 0; r < this.prop.facesByRow; r++) {
        // position of the face (two triangles of the same square)
        const faceCol = col * this.prop.facesByCol + c;
        const faceRow = row * this.prop.facesByRow + r;
        const isFirstRow = faceRow === 0;
        const isLastRow = faceRow === SPHERE_SEGMENTS / 2 - 1;

        // first vertex for this face (3 or 6 vertices in total)
        let firstVertex;
        if (isFirstRow) {
          firstVertex = faceCol * 3;
        }
        else if (isLastRow) {
          firstVertex = NB_VERTICES - SPHERE_SEGMENTS * 3 + faceCol * 3;
        }
        else {
          firstVertex = 3 * (SPHERE_SEGMENTS + (faceRow - 1) * SPHERE_SEGMENTS * 2 + faceCol * 2);
        }

        // swap material
        const matIndex = this.prop.geom.groups.find(g => g.start === firstVertex).materialIndex;
        this.materials[matIndex] = material;

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
   * @summary Generates an material for errored tiles
   * @return {external:THREE.MeshBasicMaterial}
   * @private
   */
  __getErrorMaterial() {
    if (!this.prop.errorMaterial) {
      const canvas = document.createElement('canvas');
      canvas.width = this.prop.colSize;
      canvas.height = this.prop.rowSize;

      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${canvas.width / 5}px serif`;
      ctx.fillStyle = '#a22';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      this.prop.errorMaterial = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map : texture,
      });
    }

    return this.prop.errorMaterial;
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

    if (this.config.baseBlur || img.width > SYSTEM.maxTextureWidth) {
      const ratio = Math.min(1, SYSTEM.getMaxCanvasWidth() / img.width);

      const buffer = document.createElement('canvas');
      buffer.width = img.width * ratio;
      buffer.height = buffer.width / 2;

      const ctx = buffer.getContext('2d');
      if (this.config.baseBlur) {
        ctx.filter = 'blur(1px)';
      }
      ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

      return utils.createTexture(buffer);
    }

    return utils.createTexture(img);
  }

}

/* eslint-disable */

/**
 * UNUSED : Returns the apparent size of a segment on the screen
 * @private
 */
// function getSegmentSize() {
//   const p1 = this.psv.prop.direction.clone();
//   const p2 = this.psv.prop.direction.clone();
//
//   const angle = Math.PI * 2 / SPHERE_SEGMENTS / 2;
//   const dst = Math.atan(angle) * CONSTANTS.SPHERE_RADIUS;
//   const horizontalAxis = new THREE.Vector3(0, 1, 0).cross(this.psv.prop.direction).normalize();
//
//   p1.add(horizontalAxis.clone().multiplyScalar(dst));
//   p2.add(horizontalAxis.clone().multiplyScalar(-dst));
//
//   const p1a = this.psv.dataHelper.vector3ToViewerCoords(p1);
//   const p2a = this.psv.dataHelper.vector3ToViewerCoords(p2);
//
//   const segmentSize = p2a.x - p1a.x;
// }
