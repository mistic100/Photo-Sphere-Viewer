import type { PanoramaPosition, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, events, utils } from '@photo-sphere-viewer/core';
import { CubemapAdapter, CubemapData, CubemapFaces } from '@photo-sphere-viewer/cubemap-adapter';
import { BoxGeometry, BufferAttribute, Mesh, MeshBasicMaterial, Texture, Vector2, Vector3 } from 'three';
import { Queue, Task } from '../../shared/Queue';
import { buildDebugTexture, buildErrorMaterial, createWireFrame } from '../../shared/tiles-utils';
import { CubemapMultiTilesPanorama, CubemapTilesAdapterConfig, CubemapTilesPanorama } from './model';
import { CubemapTileConfig, checkPanoramaConfig, getTileConfig, getTileConfigByIndex, isTopOrBottom } from './utils';

type CubemapMesh = Mesh<BoxGeometry, MeshBasicMaterial[]>;
type CubemapTexture = TextureData<Texture[], CubemapTilesPanorama | CubemapMultiTilesPanorama, CubemapData>;
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
    showErrorTile: true,
    baseBlur: true,
    antialias: true,
    blur: false,
    debug: false,
});

const vertexPosition = new Vector3();

/**
 * Adapter for tiled cubemaps
 */
export class CubemapTilesAdapter extends AbstractAdapter<
    CubemapTilesPanorama | CubemapMultiTilesPanorama,
    Texture[],
    CubemapData
> {
    static override readonly id = 'cubemap-tiles';
    static override readonly VERSION = PKG_VERSION;
    static override readonly supportsDownload = false;

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

    constructor(viewer: Viewer, config: CubemapTilesAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);

        if (this.viewer.config.requestHeaders) {
            utils.logWarn(
                'CubemapTilesAdapter fallbacks to file loader because "requestHeaders" where provided. '
                + 'Consider removing "requestHeaders" if you experience performances issues.'
            );
        }
    }

    override init() {
        super.init();

        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);
    }

    override destroy() {
        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);

        this.__cleanup();

        this.state.errorMaterial?.map?.dispose();
        this.state.errorMaterial?.dispose();
        this.adapter?.destroy();

        delete this.adapter;
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

    override supportsTransition(panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama) {
        return !!panorama.baseUrl;
    }

    override supportsPreload(panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama) {
        return !!panorama.baseUrl;
    }

    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: CubemapData): Position {
        return this.getAdapter().textureCoordsToSphericalCoords(point, data);
    }

    override sphericalCoordsToTextureCoords(position: Position, data: CubemapData): PanoramaPosition {
        return this.getAdapter().sphericalCoordsToTextureCoords(position, data);
    }

    override loadTexture(panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama, loader = true): Promise<CubemapTexture> {
        try {
            checkPanoramaConfig(panorama, { CUBE_SEGMENTS });
        } catch (e) {
            return Promise.reject(e);
        }

        const firstTile = getTileConfig(panorama, 0, { CUBE_SEGMENTS });
        const panoData: CubemapData = {
            isCubemap: true,
            flipTopBottom: panorama.flipTopBottom ?? false,
            faceSize: firstTile.faceSize,
        };

        if (panorama.baseUrl) {
            return this.getAdapter()
                .loadTexture(panorama.baseUrl, loader)
                .then((textureData) => ({
                    panorama,
                    panoData,
                    cacheKey: textureData.cacheKey,
                    texture: textureData.texture,
                }));
        } else {
            return Promise.resolve({
                panorama,
                panoData,
                cacheKey: panorama.tileUrl('front', 0, 0, 0),
                texture: null,
            });
        }
    }

    createMesh(): CubemapMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2;
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
        if (transition) {
            this.state.inTransition = true;
            this.__setTexture(mesh, textureData);
            return;
        }

        this.__cleanup();
        this.__setTexture(mesh, textureData);

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

    private __setTexture(mesh: CubemapMesh, { texture, panoData }: CubemapTexture) {
        for (let i = 0; i < 6; i++) {
            let material;
            if (texture) {
                if (panoData.flipTopBottom && isTopOrBottom(i)) {
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

        const panorama: CubemapTilesPanorama | CubemapMultiTilesPanorama = this.viewer.state.textureData.panorama;
        const panoData: CubemapData = this.viewer.state.textureData.panoData;
        const zoomLevel = this.viewer.getZoomLevel();
        const tileConfig = getTileConfig(panorama, zoomLevel, { CUBE_SEGMENTS });

        const verticesPosition = this.state.geom.getAttribute(ATTR_POSITION) as BufferAttribute;
        const tilesToLoad: Record<string, CubemapTile> = {};

        for (let i = 0; i < NB_VERTICES; i += 1) {
            vertexPosition.fromBufferAttribute(verticesPosition, i);
            vertexPosition.applyEuler(this.viewer.renderer.sphereCorrection);

            if (this.viewer.renderer.isObjectVisible(vertexPosition)) {
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
                    if (panoData.flipTopBottom && isTopOrBottom(face)) {
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
        return this.viewer.textureLoader
            .loadImage(tile.url, null, this.viewer.state.textureData.cacheKey)
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
            .catch((err) => {
                if (!utils.isAbortError(err) && !task.isCancelled() && this.config.showErrorTile) {
                    if (!this.state.errorMaterial) {
                        this.state.errorMaterial = buildErrorMaterial();
                    }
                    this.__swapMaterial(tile, this.state.errorMaterial, true);
                    this.viewer.needsUpdate();
                }
            });
    }

    /**
     * Applies a new texture to the faces
     */
    private __swapMaterial(tile: CubemapTile, material: MeshBasicMaterial, isError: boolean) {
        const panoData = this.viewer.state.textureData.panoData as CubemapData;
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

                if (panoData.flipTopBottom && isTopOrBottom(tile.face)) {
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

    /**
     * @internal
     */
    getAdapter() {
        if (!this.adapter) {
            if (!CubemapAdapter) {
                throw new PSVError('CubemapTilesAdapter requires CubemapAdapter');
            }

            this.adapter = new CubemapAdapter(this.viewer, {
                blur: this.config.baseBlur,
            });
        }
        return this.adapter;
    }
}
