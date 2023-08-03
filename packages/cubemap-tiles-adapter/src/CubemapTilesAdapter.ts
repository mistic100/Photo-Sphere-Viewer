import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, events, PSVError, utils } from '@photo-sphere-viewer/core';
import { CubemapAdapter, CubemapFaces } from '@photo-sphere-viewer/cubemap-adapter';
import {
    BoxGeometry,
    BufferAttribute,
    Frustum,
    ImageLoader,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Texture,
    Vector2,
    Vector3,
} from 'three';
import { Queue, Task } from '../../shared/Queue';
import { buildDebugTexture, buildErrorMaterial, createWireFrame } from '../../shared/tiles-utils';
import { CubemapMultiTilesPanorama, CubemapTilesAdapterConfig, CubemapTilesPanorama } from './model';
import { checkPanoramaConfig, CubemapTileConfig, getTileConfig, getTileConfigByIndex, isTopOrBottom } from './utils';

type CubemapMesh = Mesh<BoxGeometry, MeshBasicMaterial[]>;
type CubemapTexture = TextureData<Texture[], CubemapTilesPanorama | CubemapMultiTilesPanorama>;
type CubemapTile = {
    face: number;
    col: number;
    row: number;
    angle: number;
    config: CubemapTileConfig;
    url: string;
};

const CUBE_SEGMENTS = 16;
const NB_VERTICES_BY_FACE = 6;
const NB_VERTICES_BY_PLANE = NB_VERTICES_BY_FACE * CUBE_SEGMENTS * CUBE_SEGMENTS;
const NB_VERTICES = 6 * NB_VERTICES_BY_PLANE;
const NB_GROUPS_BY_FACE = CUBE_SEGMENTS * CUBE_SEGMENTS;

const ATTR_UV = 'uv';
const ATTR_ORIGINAL_UV = 'originaluv';
const ATTR_POSITION = 'position';

const CUBE_HASHMAP: CubemapFaces[] = ['left', 'right', 'top', 'bottom', 'back', 'front'];
const ERROR_LEVEL = -1;

function tileId(tile: CubemapTile) {
    return `${tile.face}:${tile.col}x${tile.row}/${tile.config.level}`;
}

function prettyTileId(tile: CubemapTile) {
    return `${tileId(tile)}\n${CUBE_HASHMAP[tile.face]}`;
}

const getConfig = utils.getConfigParser<CubemapTilesAdapterConfig>({
    flipTopBottom: false,
    showErrorTile: true,
    baseBlur: true,
    antialias: true,
    blur: false,
    debug: false,
});

const frustum = new Frustum();
const projScreenMatrix = new Matrix4();
const vertexPosition = new Vector3();

/**
 * Adapter for tiled cubemaps
 */
export class CubemapTilesAdapter extends AbstractAdapter<CubemapTilesPanorama | CubemapMultiTilesPanorama, Texture[]> {
    static override readonly id = 'cubemap-tiles';
    static override readonly supportsDownload = false;
    static override readonly supportsOverlay = false;

    private readonly config: CubemapTilesAdapterConfig;

    private readonly state = {
        tileConfig: null as CubemapTileConfig,
        tiles: {} as Record<string, boolean>,
        faces: {} as Record<number, number>,
        geom: null as BoxGeometry,
        materials: [] as MeshBasicMaterial[],
        errorMaterial: null as MeshBasicMaterial,
        inTransition: false,
    };

    private adapter: CubemapAdapter;
    private readonly queue = new Queue();
    private readonly loader?: ImageLoader;

    constructor(viewer: Viewer, config: CubemapTilesAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        if (this.viewer.config.requestHeaders) {
            utils.logWarn(
                'CubemapTilesAdapter fallbacks to file loader because "requestHeaders" where provided. '
                + 'Consider removing "requestHeaders" if you experience performances issues.'
            );
        } else {
            this.loader = new ImageLoader();
            if (this.viewer.config.withCredentials) {
                this.loader.setWithCredentials(true);
                this.loader.setCrossOrigin('use-credentials');
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
        try {
            checkPanoramaConfig(panorama, { CUBE_SEGMENTS });
        } catch (e) {
            return Promise.reject(e);
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
        const { texture } = textureData;

        if (transition) {
            this.state.inTransition = true;
            this.__setTexture(mesh, texture);
            return;
        }

        this.__cleanup();
        this.__setTexture(mesh, texture);

        this.state.materials = mesh.material;
        this.state.geom = mesh.geometry;
        this.state.geom.setAttribute(ATTR_UV, (this.state.geom.getAttribute(ATTR_ORIGINAL_UV) as BufferAttribute).clone());

        if (this.config.debug) {
            const wireframe = createWireFrame(this.state.geom);
            this.viewer.renderer.addObject(wireframe);
            this.viewer.renderer.setSphereCorrection(this.viewer.config.sphereCorrection, wireframe);
        }

        setTimeout(() => this.__refresh());
    }

    private __setTexture(mesh: CubemapMesh, texture: Texture[]) {
        for (let i = 0; i < 6; i++) {
            let material;
            if (texture) {
                if (this.config.flipTopBottom && isTopOrBottom(i)) {
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
    private __refresh() {
        if (!this.state.geom || this.state.inTransition) {
            return;
        }

        const camera = this.viewer.renderer.camera;
        camera.updateMatrixWorld();
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        const panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama = this.viewer.config.panorama;
        const zoomLevel = this.viewer.getZoomLevel();
        const tileConfig = getTileConfig(panorama, zoomLevel, { CUBE_SEGMENTS });

        const verticesPosition = this.state.geom.getAttribute(ATTR_POSITION) as BufferAttribute;
        const tilesToLoad: Record<string, CubemapTile> = {};

        for (let i = 0; i < NB_VERTICES; i += 1) {
            vertexPosition.fromBufferAttribute(verticesPosition, i);
            vertexPosition.applyEuler(this.viewer.renderer.sphereCorrection);

            if (frustum.containsPoint(vertexPosition)) {
                const face = Math.floor(i / NB_VERTICES_BY_PLANE);

                // compute position of the segment (6 vertices)
                const segmentIndex = Math.floor((i - face * NB_VERTICES_BY_PLANE) / 6);
                const segmentRow = Math.floor(segmentIndex / CUBE_SEGMENTS);
                const segmentCol = segmentIndex - segmentRow * CUBE_SEGMENTS;

                let config = tileConfig;
                while (config) {
                    let row = Math.floor(segmentRow / config.facesByTile);
                    let col = Math.floor(segmentCol / config.facesByTile);
                    const angle = vertexPosition.angleTo(this.viewer.state.direction);

                    const tile: CubemapTile = {
                        face,
                        row,
                        col,
                        angle,
                        config,
                        url: null,
                    };
                    if (this.config.flipTopBottom && isTopOrBottom(face)) {
                        col = config.nbTiles - col - 1;
                        row = config.nbTiles - row - 1;
                    }
                    const id = tileId(tile);

                    if (tilesToLoad[id]) {
                        tilesToLoad[id].angle = Math.min(tilesToLoad[id].angle, angle);
                        break;
                    } else {
                        tile.url = panorama.tileUrl(CUBE_HASHMAP[face], col, row, config.level);

                        if (tile.url) {
                            tilesToLoad[id] = tile;
                            break;
                        } else {
                            // if no url is returned, try a lower tile level
                            config = getTileConfigByIndex(panorama, config.level - 1, { CUBE_SEGMENTS });
                        }
                    }
                }
            }
        }

        this.state.tileConfig = tileConfig;
        this.__loadTiles(Object.values(tilesToLoad));
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
        return this.__loadImage(tile.url)
            .then((image) => {
                if (!task.isCancelled()) {
                    if (this.config.debug) {
                        image = buildDebugTexture(image, tile.config.level, prettyTileId(tile)) as any;
                    }

                    const mipmaps = this.config.antialias && tile.config.level > 0;
                    const material = new MeshBasicMaterial({ map: utils.createTexture(image, mipmaps) });
                    this.__swapMaterial(tile, material, false);
                    this.viewer.needsUpdate();
                }
            })
            .catch(() => {
                if (!task.isCancelled() && this.config.showErrorTile) {
                    if (!this.state.errorMaterial) {
                        this.state.errorMaterial = buildErrorMaterial();
                    }
                    this.__swapMaterial(tile, this.state.errorMaterial, true);
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
    private __swapMaterial(tile: CubemapTile, material: MeshBasicMaterial, isError: boolean) {
        const uvs = this.state.geom.getAttribute(ATTR_UV) as BufferAttribute;

        for (let c = 0; c < tile.config.facesByTile; c++) {
            for (let r = 0; r < tile.config.facesByTile; r++) {
                // position of the face
                const faceCol = tile.col * tile.config.facesByTile + c;
                const faceRow = tile.row * tile.config.facesByTile + r;

                // first vertex for this face (6 vertices in total)
                const firstVertex = tile.face * NB_VERTICES_BY_PLANE + 6 * (CUBE_SEGMENTS * faceRow + faceCol);

                // in case of error, skip the face if already showing valid data
                if (isError && this.state.faces[firstVertex] > ERROR_LEVEL) {
                    continue;
                }
                // skip this face if its already showing an higher resolution
                if (this.state.faces[firstVertex] > tile.config.level) {
                    continue;
                }
                this.state.faces[firstVertex] = isError ? ERROR_LEVEL : tile.config.level;

                // swap material
                const matIndex = this.state.geom.groups.find((g) => g.start === firstVertex).materialIndex;
                this.state.materials[matIndex] = material;

                // define new uvs
                let top = 1 - r / tile.config.facesByTile;
                let bottom = 1 - (r + 1) / tile.config.facesByTile;
                let left = c / tile.config.facesByTile;
                let right = (c + 1) / tile.config.facesByTile;

                if (this.config.flipTopBottom && isTopOrBottom(tile.face)) {
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
        this.state.faces = {};
        this.state.inTransition = false;

        this.state.materials.forEach((mat) => {
            mat?.map?.dispose();
            mat?.dispose();
        });
        this.state.materials.length = 0;
    }
}
