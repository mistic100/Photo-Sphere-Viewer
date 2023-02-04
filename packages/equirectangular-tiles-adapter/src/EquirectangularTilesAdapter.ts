import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, EquirectangularAdapter, events, PSVError, utils } from '@photo-sphere-viewer/core';
import {
    BufferAttribute,
    Frustum,
    ImageLoader,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    SphereGeometry,
    Texture,
    Vector3,
} from 'three';
import { Queue, Task } from '../../shared/Queue';
import { buildErrorMaterial } from '../../shared/tiles-utils';
import { EquirectangularTilesAdapterConfig, EquirectangularTilesPanorama } from './model';

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

type EquirectangularMesh = Mesh<SphereGeometry, MeshBasicMaterial[]>;
type EquirectangularTexture = TextureData<Texture>;
type EquirectangularTile = { col: number; row: number; angle: number };

const NB_VERTICES_BY_FACE = 6;
const NB_VERTICES_BY_SMALL_FACE = 3;

const ATTR_UV = 'uv';
const ATTR_ORIGINAL_UV = 'originaluv';
const ATTR_POSITION = 'position';

function tileId(tile: EquirectangularTile): string {
    return `${tile.col}x${tile.row}`;
}

const getConfig = utils.getConfigParser<EquirectangularTilesAdapterConfig>(
    {
        resolution: 64,
        showErrorTile: true,
        baseBlur: true,
        blur: false,
    },
    {
        resolution: (resolution) => {
            if (!resolution || !MathUtils.isPowerOfTwo(resolution)) {
                throw new PSVError('EquirectangularTilesAdapter resolution must be power of two');
            }
            return resolution;
        },
    }
);

const frustum = new Frustum();
const projScreenMatrix = new Matrix4();
const vertexPosition = new Vector3();

/**
 * Adapter for tiled panoramas
 */
export class EquirectangularTilesAdapter extends AbstractAdapter<EquirectangularTilesPanorama, Texture> {
    static override readonly id = 'equirectangular-tiles';
    static override readonly supportsDownload = false;
    static override readonly supportsOverlay = false;

    private readonly SPHERE_SEGMENTS: number;
    private readonly SPHERE_HORIZONTAL_SEGMENTS: number;
    private readonly NB_VERTICES: number;
    private readonly NB_GROUPS: number;

    private readonly config: EquirectangularTilesAdapterConfig;

    private readonly state = {
        colSize: 0,
        rowSize: 0,
        facesByCol: 0,
        facesByRow: 0,
        tiles: {} as Record<string, boolean>,
        geom: null as SphereGeometry,
        materials: [] as MeshBasicMaterial[],
        errorMaterial: null as MeshBasicMaterial,
    };

    private adapter: EquirectangularAdapter;
    private readonly queue = new Queue();
    private readonly loader?: ImageLoader;

    constructor(viewer: Viewer, config: EquirectangularTilesAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.viewer.config.useXmpData = false;

        this.SPHERE_SEGMENTS = this.config.resolution;
        this.SPHERE_HORIZONTAL_SEGMENTS = this.SPHERE_SEGMENTS / 2;
        this.NB_VERTICES = 2 * this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
            + (this.SPHERE_HORIZONTAL_SEGMENTS - 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;
        this.NB_GROUPS = this.SPHERE_SEGMENTS * this.SPHERE_HORIZONTAL_SEGMENTS;

        if (this.viewer.config.requestHeaders) {
            utils.logWarn(
                'EquirectangularTilesAdapter fallbacks to file loader because "requestHeaders" where provided. ' +
                    'Consider removing "requestHeaders" if you experience performances issues.'
            );
        } else {
            this.loader = new ImageLoader();
            if (this.viewer.config.withCredentials) {
                this.loader.setWithCredentials(true);
            }
        }

        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);
    }

    override destroy() {
        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);

        this.__cleanup();

        this.state.errorMaterial?.map?.dispose();
        this.state.errorMaterial?.dispose();

        delete this.state.geom;
        delete this.state.errorMaterial;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.PositionUpdatedEvent || e instanceof events.ZoomUpdatedEvent) {
            this.__refresh();
        }
    }

    override supportsTransition(panorama: EquirectangularTilesPanorama) {
        return !!panorama.baseUrl;
    }

    override supportsPreload(panorama: EquirectangularTilesPanorama) {
        return !!panorama.baseUrl;
    }

    override loadTexture(panorama: EquirectangularTilesPanorama): Promise<EquirectangularTexture> {
        if (typeof panorama !== 'object' || !panorama.width || !panorama.cols || !panorama.rows || !panorama.tileUrl) {
            return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?'));
        }
        if (panorama.cols > this.SPHERE_SEGMENTS) {
            return Promise.reject(new PSVError(`Panorama cols must not be greater than ${this.SPHERE_SEGMENTS}.`));
        }
        if (panorama.rows > this.SPHERE_HORIZONTAL_SEGMENTS) {
            return Promise.reject(
                new PSVError(`Panorama rows must not be greater than ${this.SPHERE_HORIZONTAL_SEGMENTS}.`)
            );
        }
        if (!MathUtils.isPowerOfTwo(panorama.cols) || !MathUtils.isPowerOfTwo(panorama.rows)) {
            return Promise.reject(new PSVError('Panorama cols and rows must be powers of 2.'));
        }

        const panoData = {
            fullWidth: panorama.width,
            fullHeight: panorama.width / 2,
            croppedWidth: panorama.width,
            croppedHeight: panorama.width / 2,
            croppedX: 0,
            croppedY: 0,
            poseHeading: 0,
            posePitch: 0,
            poseRoll: 0,
        };

        if (panorama.baseUrl) {
            if (!this.adapter) {
                this.adapter = new EquirectangularAdapter(this.viewer, {
                    blur: this.config.baseBlur,
                });
            }

            return this.adapter.loadTexture(panorama.baseUrl, panorama.basePanoData).then((textureData) => ({
                panorama: panorama,
                texture: textureData.texture,
                panoData: panoData,
            }));
        } else {
            return Promise.resolve({ panorama, panoData, texture: null });
        }
    }

    createMesh(scale = 1): EquirectangularMesh {
        const geometry = new SphereGeometry(
            CONSTANTS.SPHERE_RADIUS * scale,
            this.SPHERE_SEGMENTS,
            this.SPHERE_HORIZONTAL_SEGMENTS,
            -Math.PI / 2
        )
            .scale(-1, 1, 1)
            .toNonIndexed() as SphereGeometry;

        geometry.clearGroups();
        let i = 0;
        let k = 0;
        // first row
        for (; i < this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE; i += NB_VERTICES_BY_SMALL_FACE) {
            geometry.addGroup(i, NB_VERTICES_BY_SMALL_FACE, k++);
        }
        // second to before last rows
        for (; i < this.NB_VERTICES - this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE; i += NB_VERTICES_BY_FACE) {
            geometry.addGroup(i, NB_VERTICES_BY_FACE, k++);
        }
        // last row
        for (; i < this.NB_VERTICES; i += NB_VERTICES_BY_SMALL_FACE) {
            geometry.addGroup(i, NB_VERTICES_BY_SMALL_FACE, k++);
        }

        geometry.setAttribute(ATTR_ORIGINAL_UV, (geometry.getAttribute(ATTR_UV) as BufferAttribute).clone());

        return new Mesh(geometry, []);
    }

    /**
     * Applies the base texture and starts the loading of tiles
     */
    setTexture(mesh: EquirectangularMesh, textureData: EquirectangularTexture, transition: boolean) {
        const { panorama, texture } = textureData;

        if (transition) {
            this.__setTexture(mesh, texture);
            return;
        }

        this.__cleanup();
        this.__setTexture(mesh, texture);

        this.state.materials = mesh.material;
        this.state.geom = mesh.geometry;
        this.state.geom.setAttribute(ATTR_UV, (this.state.geom.getAttribute(ATTR_ORIGINAL_UV) as BufferAttribute).clone());

        this.state.colSize = panorama.width / panorama.cols;
        this.state.rowSize = panorama.width / 2 / panorama.rows;
        this.state.facesByCol = this.SPHERE_SEGMENTS / panorama.cols;
        this.state.facesByRow = this.SPHERE_HORIZONTAL_SEGMENTS / panorama.rows;

        // this.psv.renderer.scene.add(createWireFrame(this.state.geom));

        setTimeout(() => this.__refresh(true));
    }

    private __setTexture(mesh: EquirectangularMesh, texture: Texture) {
        let material;
        if (texture) {
            material = new MeshBasicMaterial({ map: texture });
        } else {
            material = new MeshBasicMaterial({ opacity: 0, transparent: true });
        }

        for (let i = 0; i < this.NB_GROUPS; i++) {
            mesh.material.push(material);
        }
    }

    setTextureOpacity(mesh: EquirectangularMesh, opacity: number) {
        mesh.material[0].opacity = opacity;
        mesh.material[0].transparent = opacity < 1;
    }

    /**
     * @throws {@link PSVError} always
     */
    setOverlay() {
        throw new PSVError('EquirectangularTilesAdapter does not support overlay');
    }

    disposeTexture(textureData: TextureData<Texture>) {
        textureData.texture?.dispose();
    }

    /**
     * Compute visible tiles and load them
     */
    // @ts-ignore unused paramater
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private __refresh(init = false) {
        if (!this.state.geom) {
            return;
        }

        const camera = this.viewer.renderer.camera;
        camera.updateMatrixWorld();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        const panorama: EquirectangularTilesPanorama = this.viewer.config.panorama;
        const verticesPosition = this.state.geom.getAttribute(ATTR_POSITION) as BufferAttribute;
        const tilesToLoad = [];

        for (let col = 0; col < panorama.cols; col++) {
            for (let row = 0; row < panorama.rows; row++) {
                // for each tile, find the vertices corresponding to the four corners (three for first and last rows)
                // if at least one vertex is visible, the tile must be loaded
                // for larger tiles we also test the four edges centers and the tile center

                const verticesIndex = [];

                if (row === 0) {
                    // bottom-left
                    const v0 = this.state.facesByRow === 1
                        ? col * this.state.facesByCol * NB_VERTICES_BY_SMALL_FACE + 1
                        : this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
                            + (this.state.facesByRow - 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE
                            + col * this.state.facesByCol * NB_VERTICES_BY_FACE + 4;

                    // bottom-right
                    const v1 = this.state.facesByRow === 1
                        ? v0 + (this.state.facesByCol - 1) * NB_VERTICES_BY_SMALL_FACE + 1
                        : v0 + (this.state.facesByCol - 1) * NB_VERTICES_BY_FACE + 1;

                    // top (all vertices are equal)
                    const v2 = 0;

                    verticesIndex.push(v0, v1, v2);

                    if (this.state.facesByCol >= this.SPHERE_SEGMENTS / 8) {
                        // bottom-center
                        const v4 = v0 + (this.state.facesByCol / 2) * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v4);
                    }

                    if (this.state.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
                        // left-center
                        const v6 = v0 - (this.state.facesByRow / 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;

                        // right-center
                        const v7 = v1 - (this.state.facesByRow / 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v6, v7);
                    }
                } else if (row === panorama.rows - 1) {
                    // top-left
                    const v0 = this.state.facesByRow === 1
                        ? -this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
                            + row * this.state.facesByRow * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE
                            + col * this.state.facesByCol * NB_VERTICES_BY_SMALL_FACE + 1
                        : -this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
                            + row * this.state.facesByRow * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE
                            + col * this.state.facesByCol * NB_VERTICES_BY_FACE + 1;

                    // top-right
                    const v1 = this.state.facesByRow === 1
                        ? v0 + (this.state.facesByCol - 1) * NB_VERTICES_BY_SMALL_FACE - 1
                        : v0 + (this.state.facesByCol - 1) * NB_VERTICES_BY_FACE - 1;

                    // bottom (all vertices are equal)
                    const v2 = this.NB_VERTICES - 1;

                    verticesIndex.push(v0, v1, v2);

                    if (this.state.facesByCol >= this.SPHERE_SEGMENTS / 8) {
                        // top-center
                        const v4 = v0 + (this.state.facesByCol / 2) * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v4);
                    }

                    if (this.state.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
                        // left-center
                        const v6 = v0 + (this.state.facesByRow / 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;

                        // right-center
                        const v7 = v1 + (this.state.facesByRow / 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v6, v7);
                    }
                } else {
                    // top-left
                    const v0 = -this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
                        + row * this.state.facesByRow * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE
                        + col * this.state.facesByCol * NB_VERTICES_BY_FACE + 1;

                    // bottom-left
                    const v1 = v0 + (this.state.facesByRow - 1) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE + 3;

                    // bottom-right
                    const v2 = v1 + (this.state.facesByCol - 1) * NB_VERTICES_BY_FACE + 1;

                    // top-right
                    const v3 = v0 + (this.state.facesByCol - 1) * NB_VERTICES_BY_FACE - 1;

                    verticesIndex.push(v0, v1, v2, v3);

                    if (this.state.facesByCol >= this.SPHERE_SEGMENTS / 8) {
                        // top-center
                        const v4 = v0 + (this.state.facesByCol / 2) * NB_VERTICES_BY_FACE;

                        // bottom-center
                        const v5 = v1 + (this.state.facesByCol / 2) * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v4, v5);
                    }

                    if (this.state.facesByRow >= this.SPHERE_HORIZONTAL_SEGMENTS / 4) {
                        // left-center
                        const v6 = v0 + (this.state.facesByRow / 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;

                        // right-center
                        const v7 = v3 + (this.state.facesByRow / 2) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v6, v7);

                        if (this.state.facesByCol >= this.SPHERE_SEGMENTS / 8) {
                            // center-center
                            const v8 = v6 + (this.state.facesByCol / 2) * NB_VERTICES_BY_FACE;

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
                    vertexPosition.applyEuler(this.viewer.renderer.sphereCorrection);
                    return frustum.containsPoint(vertexPosition);
                });

                if (vertexVisible) {
                    let angle = vertexPosition.angleTo(this.viewer.state.direction);
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
     * Loads tiles and change existing tiles priority
     */
    private __loadTiles(tiles: EquirectangularTile[]) {
        this.queue.disableAllTasks();

        tiles.forEach((tile) => {
            const id = tileId(tile);

            if (this.state.tiles[id]) {
                this.queue.setPriority(id, tile.angle);
            } else {
                this.state.tiles[id] = true;
                this.queue.enqueue(new Task(id, tile.angle, (task) => this.__loadTile(tile, task)));
            }
        });

        this.queue.start();
    }

    /**
     * Loads and draw a tile
     */
    private __loadTile(tile: EquirectangularTile, task: Task): Promise<any> {
        const panorama: EquirectangularTilesPanorama = this.viewer.config.panorama;
        const url = panorama.tileUrl(tile.col, tile.row);

        return this.__loadImage(url)
            .then((image) => {
                if (!task.isCancelled()) {
                    const material = new MeshBasicMaterial({ map: utils.createTexture(image) });
                    this.__swapMaterial(tile.col, tile.row, material);
                    this.viewer.needsUpdate();
                }
            })
            .catch(() => {
                if (!task.isCancelled() && this.config.showErrorTile) {
                    if (!this.state.errorMaterial) {
                        this.state.errorMaterial = buildErrorMaterial(this.state.colSize, this.state.rowSize);
                    }
                    this.__swapMaterial(tile.col, tile.row, this.state.errorMaterial);
                    this.viewer.needsUpdate();
                }
            });
    }

    private __loadImage(url: string): Promise<HTMLImageElement> {
        if (this.loader) {
            return new Promise((resolve, reject) => {
                this.loader.load(url, resolve, undefined, reject);
            });
        } else {
            return this.viewer.textureLoader.loadImage(url);
        }
    }

    /**
     * Applies a new texture to the faces
     */
    private __swapMaterial(col: number, row: number, material: MeshBasicMaterial) {
        const uvs = this.state.geom.getAttribute(ATTR_UV) as BufferAttribute;

        for (let c = 0; c < this.state.facesByCol; c++) {
            for (let r = 0; r < this.state.facesByRow; r++) {
                // position of the face (two triangles of the same square)
                const faceCol = col * this.state.facesByCol + c;
                const faceRow = row * this.state.facesByRow + r;
                const isFirstRow = faceRow === 0;
                const isLastRow = faceRow === (this.SPHERE_HORIZONTAL_SEGMENTS - 1);

                // first vertex for this face (3 or 6 vertices in total)
                let firstVertex: number;
                if (isFirstRow) {
                    firstVertex = faceCol * NB_VERTICES_BY_SMALL_FACE;
                } else if (isLastRow) {
                    firstVertex = this.NB_VERTICES
                        - this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
                        + faceCol * NB_VERTICES_BY_SMALL_FACE;
                } else {
                    firstVertex = this.SPHERE_SEGMENTS * NB_VERTICES_BY_SMALL_FACE
                        + (faceRow - 1) * this.SPHERE_SEGMENTS * NB_VERTICES_BY_FACE
                        + faceCol * NB_VERTICES_BY_FACE;
                }

                // swap material
                const matIndex = this.state.geom.groups.find((g) => g.start === firstVertex).materialIndex;
                this.state.materials[matIndex] = material;

                // define new uvs
                const top = 1 - r / this.state.facesByRow;
                const bottom = 1 - (r + 1) / this.state.facesByRow;
                const left = c / this.state.facesByCol;
                const right = (c + 1) / this.state.facesByCol;

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
            }
        }

        uvs.needsUpdate = true;
    }

    /**
     * Clears loading queue, dispose all materials
     */
    private __cleanup() {
        this.queue.clear();
        this.state.tiles = {};

        this.state.materials.forEach((mat) => {
            mat?.map?.dispose();
            mat?.dispose();
        });
        this.state.materials.length = 0;
    }
}
