import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, events, PSVError, utils } from '@photo-sphere-viewer/core';
import { CubemapAdapter } from '@photo-sphere-viewer/cubemap-adapter';
import {
    BoxGeometry,
    BufferAttribute,
    Frustum,
    ImageLoader,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Texture,
    Vector2,
    Vector3,
} from 'three';
import { Queue, Task } from '../../shared/Queue';
import { buildErrorMaterial } from '../../shared/tiles-utils';
import { CubemapTilesAdapterConfig, CubemapTilesPanorama } from './model';

type CubemapMesh = Mesh<BoxGeometry, MeshBasicMaterial[]>;
type CubemapTexture = TextureData<Texture[]>;
type CubemapTile = { face: number; col: number; row: number; angle: number };

const CUBE_SEGMENTS = 16;
const NB_VERTICES_BY_FACE = 6;
const NB_VERTICES_BY_PLANE = NB_VERTICES_BY_FACE * CUBE_SEGMENTS * CUBE_SEGMENTS;
const NB_VERTICES = 6 * NB_VERTICES_BY_PLANE;
const NB_GROUPS_BY_FACE = CUBE_SEGMENTS * CUBE_SEGMENTS;

const ATTR_UV = 'uv';
const ATTR_ORIGINAL_UV = 'originaluv';
const ATTR_POSITION = 'position';

function tileId(tile: CubemapTile) {
    return `${tile.face}:${tile.col}x${tile.row}`;
}

const getConfig = utils.getConfigParser<CubemapTilesAdapterConfig>({
    flipTopBottom: false,
    showErrorTile: true,
    baseBlur: true,
    blur: false,
});

const frustum = new Frustum();
const projScreenMatrix = new Matrix4();
const vertexPosition = new Vector3();

/**
 * Adapter for tiled cubemaps
 */
export class CubemapTilesAdapter extends AbstractAdapter<CubemapTilesPanorama, Texture[]> {
    static override readonly id = 'cubemap-tiles';
    static override readonly supportsDownload = false;
    static override readonly supportsOverlay = false;

    private readonly config: CubemapTilesAdapterConfig;

    private readonly state = {
        tileSize: 0,
        facesByTile: 0,
        tiles: {} as Record<string, boolean>,
        geom: null as BoxGeometry,
        materials: [] as MeshBasicMaterial[],
        errorMaterial: null as MeshBasicMaterial,
    };

    private adapter: CubemapAdapter;
    private readonly queue = new Queue();
    private readonly loader?: ImageLoader;

    constructor(viewer: Viewer, config: CubemapTilesAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        if (this.viewer.config.requestHeaders) {
            utils.logWarn(
                'CubemapTilesAdapter fallbacks to file loader because "requestHeaders" where provided. ' +
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

    override supportsTransition(panorama: CubemapTilesPanorama) {
        return !!panorama.baseUrl;
    }

    override supportsPreload(panorama: CubemapTilesPanorama) {
        return !!panorama.baseUrl;
    }

    override loadTexture(panorama: CubemapTilesPanorama): Promise<CubemapTexture> {
        if (typeof panorama !== 'object' || !panorama.faceSize || !panorama.nbTiles || !panorama.tileUrl) {
            return Promise.reject(new PSVError('Invalid panorama configuration, are you using the right adapter?'));
        }
        if (panorama.nbTiles > CUBE_SEGMENTS) {
            return Promise.reject(new PSVError(`Panorama nbTiles must not be greater than ${CUBE_SEGMENTS}.`));
        }
        if (!MathUtils.isPowerOfTwo(panorama.nbTiles)) {
            return Promise.reject(new PSVError('Panorama nbTiles must be power of 2.'));
        }

        if (panorama.baseUrl) {
            if (!this.adapter) {
                if (!CubemapAdapter) {
                    throw new PSVError('CubemapTilesAdapter requires CubemapAdapter');
                }

                this.adapter = new CubemapAdapter(this.viewer, {
                    blur: this.config.baseBlur,
                });
            }

            return this.adapter.loadTexture(panorama.baseUrl).then((textureData) => ({
                panorama: panorama,
                texture: textureData.texture,
            }));
        } else {
            return Promise.resolve({ panorama, texture: null });
        }
    }

    createMesh(scale = 1): CubemapMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2 * scale;
        const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_SEGMENTS, CUBE_SEGMENTS, CUBE_SEGMENTS)
            .scale(1, 1, -1)
            .toNonIndexed() as BoxGeometry;

        geometry.clearGroups();
        for (let i = 0, k = 0; i < NB_VERTICES; i += NB_VERTICES_BY_FACE) {
            geometry.addGroup(i, NB_VERTICES_BY_FACE, k++);
        }

        geometry.setAttribute(ATTR_ORIGINAL_UV, (geometry.getAttribute(ATTR_UV) as BufferAttribute).clone());

        return new Mesh(geometry, []);
    }

    /**
     * Applies the base texture and starts the loading of tiles
     */
    setTexture(mesh: CubemapMesh, textureData: CubemapTexture, transition: boolean) {
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

        this.state.tileSize = panorama.faceSize / panorama.nbTiles;
        this.state.facesByTile = CUBE_SEGMENTS / panorama.nbTiles;

        // this.psv.renderer.scene.add(createWireFrame(this.state.geom));

        setTimeout(() => this.__refresh(true));
    }

    private __setTexture(mesh: CubemapMesh, texture: Texture[]) {
        for (let i = 0; i < 6; i++) {
            let material;
            if (texture) {
                if (this.config.flipTopBottom && (i === 2 || i === 3)) {
                    texture[i].center = new Vector2(0.5, 0.5);
                    texture[i].rotation = Math.PI;
                }

                material = new MeshBasicMaterial({ map: texture[i] });
            } else {
                material = new MeshBasicMaterial({ opacity: 0, transparent: true });
            }

            for (let j = 0; j < NB_GROUPS_BY_FACE; j++) {
                mesh.material.push(material);
            }
        }
    }

    setTextureOpacity(mesh: CubemapMesh, opacity: number) {
        for (let i = 0; i < 6; i++) {
            mesh.material[i * NB_GROUPS_BY_FACE].opacity = opacity;
            mesh.material[i * NB_GROUPS_BY_FACE].transparent = opacity < 1;
        }
    }

    /**
     * @throws {@link PSVError} always
     */
    setOverlay(): void {
        throw new PSVError('EquirectangularTilesAdapter does not support overlay');
    }

    disposeTexture(textureData: CubemapTexture) {
        textureData.texture?.forEach((texture) => texture.dispose());
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

        const panorama: CubemapTilesPanorama = this.viewer.config.panorama;
        const verticesPosition = this.state.geom.getAttribute(ATTR_POSITION) as BufferAttribute;
        const tilesToLoad: CubemapTile[] = [];

        for (let face = 0; face < 6; face++) {
            for (let col = 0; col < panorama.nbTiles; col++) {
                for (let row = 0; row < panorama.nbTiles; row++) {
                    // for each tile, find the vertices corresponding to the four corners
                    // if at least one vertex is visible, the tile must be loaded
                    // for larger tiles we also test the four edges centers and the tile center
                    const verticesIndex = [];

                    // top-left
                    const v0 = face * NB_VERTICES_BY_PLANE
                        + row * this.state.facesByTile * CUBE_SEGMENTS * NB_VERTICES_BY_FACE
                        + col * this.state.facesByTile * NB_VERTICES_BY_FACE;

                    // bottom-left
                    const v1 = v0 + CUBE_SEGMENTS * NB_VERTICES_BY_FACE * (this.state.facesByTile - 1) + 1;

                    // bottom-right
                    const v2 = v1 + this.state.facesByTile * NB_VERTICES_BY_FACE - 3;

                    // top-right
                    const v3 = v0 + this.state.facesByTile * NB_VERTICES_BY_FACE - 1;

                    verticesIndex.push(v0, v1, v2, v3);

                    if (this.state.facesByTile >= CUBE_SEGMENTS / 2) {
                        // top-center
                        const v4 = v0 + (this.state.facesByTile / 2) * NB_VERTICES_BY_FACE - 1;

                        // bottom-center
                        const v5 = v1 + (this.state.facesByTile / 2) * NB_VERTICES_BY_FACE - 3;

                        // left-center
                        const v6 = v0 + CUBE_SEGMENTS * NB_VERTICES_BY_FACE * (this.state.facesByTile / 2 - 1) + 1;

                        // right-center
                        const v7 = v6 + this.state.facesByTile * NB_VERTICES_BY_FACE - 3;

                        // center-center
                        const v8 = v6 + (this.state.facesByTile / 2) * NB_VERTICES_BY_FACE;

                        verticesIndex.push(v4, v5, v6, v7, v8);
                    }

                    // if (init && face === 5 && col === 0 && row === 0) {
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
                        const angle = vertexPosition.angleTo(this.viewer.state.direction);
                        tilesToLoad.push({ face, col, row, angle });
                    }
                }
            }
        }

        this.__loadTiles(tilesToLoad);
    }

    /**
     * Loads tiles and change existing tiles priority
     */
    private __loadTiles(tiles: CubemapTile[]) {
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
    private __loadTile(tile: CubemapTile, task: Task): Promise<any> {
        const panorama = this.viewer.config.panorama;

        let { col, row } = tile;
        if (this.config.flipTopBottom && (tile.face === 2 || tile.face === 3)) {
            col = panorama.nbTiles - col - 1;
            row = panorama.nbTiles - row - 1;
        }
        const url = panorama.tileUrl(CubemapAdapter.CUBE_HASHMAP[tile.face], col, row);

        return this.__loadImage(url)
            .then((image) => {
                if (!task.isCancelled()) {
                    const material = new MeshBasicMaterial({ map: utils.createTexture(image) });
                    this.__swapMaterial(tile.face, tile.col, tile.row, material);
                    this.viewer.needsUpdate();
                }
            })
            .catch(() => {
                if (!task.isCancelled() && this.config.showErrorTile) {
                    if (!this.state.errorMaterial) {
                        this.state.errorMaterial = buildErrorMaterial(this.state.tileSize, this.state.tileSize);
                    }
                    this.__swapMaterial(tile.face, tile.col, tile.row, this.state.errorMaterial);
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
    private __swapMaterial(face: number, col: number, row: number, material: MeshBasicMaterial) {
        const uvs = this.state.geom.getAttribute(ATTR_UV) as BufferAttribute;

        for (let c = 0; c < this.state.facesByTile; c++) {
            for (let r = 0; r < this.state.facesByTile; r++) {
                // position of the face (two triangles of the same square)
                const faceCol = col * this.state.facesByTile + c;
                const faceRow = row * this.state.facesByTile + r;

                // first vertex for this face (6 vertices in total)
                const firstVertex = NB_VERTICES_BY_PLANE * face + 6 * (CUBE_SEGMENTS * faceRow + faceCol);

                // swap material
                const matIndex = this.state.geom.groups.find((g) => g.start === firstVertex).materialIndex;
                this.state.materials[matIndex] = material;

                // define new uvs
                let top = 1 - r / this.state.facesByTile;
                let bottom = 1 - (r + 1) / this.state.facesByTile;
                let left = c / this.state.facesByTile;
                let right = (c + 1) / this.state.facesByTile;

                if (this.config.flipTopBottom && (face === 2 || face === 3)) {
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
