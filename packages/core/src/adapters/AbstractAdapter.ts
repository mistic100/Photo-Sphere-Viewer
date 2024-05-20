import { Mesh } from 'three';
import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { PanoData, PanoDataProvider, PanoramaPosition, Position, TextureData } from '../model';
import { checkVersion } from '../utils';

/**
 * Base class for adapters
 * @template TPanorama type of the panorama object
 * @template TTexture type of the loaded texture
 * @template TData type of the panorama metadata
 */
export abstract class AbstractAdapter<TPanorama, TTexture, TData> {
    /**
     * Unique identifier of the adapter
     */
    static readonly id: string;
    /**
     * Expected version of the core
     * DO NOT USE on custom adapters
     */
    static readonly VERSION: string;

    /**
     * Indicates if the adapter supports panorama download natively
     */
    static readonly supportsDownload: boolean = false;

    constructor(protected readonly viewer: Viewer) {}

    /**
     * Initializes the adapter
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    init(): void {}

    /**
     * Destroys the adapter
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    destroy(): void {}

    /**
     * Indicates if the adapter supports transitions between panoramas
     */
    // @ts-ignore unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supportsTransition(panorama: TPanorama): boolean {
        return false;
    }

    /**
     * Indicates if the adapter supports preload of a panorama
     */
    // @ts-ignore unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supportsPreload(panorama: TPanorama): boolean {
        return false;
    }

    /**
     * Converts pixel texture coordinates to spherical radians coordinates
     * @throws {@link PSVError} when the current adapter does not support texture coordinates
     */
    // @ts-ignore unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    textureCoordsToSphericalCoords(point: PanoramaPosition, data: TData): Position {
        throw new PSVError('Current adapter does not support texture coordinates.');
    }

    /**
     * Converts spherical radians coordinates to pixel texture coordinates
     * @throws {@link PSVError} when the current adapter does not support texture coordinates
     */
    // @ts-ignore unused parameter
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sphericalCoordsToTextureCoords(position: Position, data: TData): PanoramaPosition {
        throw new PSVError('Current adapter does not support texture coordinates.');
    }

    /**
     * Loads the panorama texture
     */
    abstract loadTexture(
        panorama: TPanorama,
        loader?: boolean,
        newPanoData?: PanoData | PanoDataProvider,
        useXmpPanoData?: boolean
    ): Promise<TextureData<TTexture, TPanorama, TData>>;

    /**
     * Creates the mesh
     */
    abstract createMesh(): Mesh;

    /**
     * Applies the texture to the mesh
     */
    abstract setTexture(mesh: Mesh, textureData: TextureData<TTexture, TPanorama, TData>, transition?: boolean): void;

    /**
     * Changes the opacity of the mesh
     */
    abstract setTextureOpacity(mesh: Mesh, opacity: number): void;

    /**
     * Clear a loaded texture from memory
     */
    abstract disposeTexture(textureData: TextureData<TTexture, TPanorama, TData>): void;
}

// prettier-ignore
export type AdapterConstructor = (new (viewer: Viewer, config?: any) => AbstractAdapter<any, any, any>);

/**
 * Returns the adapter constructor from the imported object
 * @internal
 */
export function adapterInterop(adapter: any): AdapterConstructor & typeof AbstractAdapter {
    if (adapter) {
        for (const [, p] of [['_', adapter], ...Object.entries(adapter)]) {
            if (p.prototype instanceof AbstractAdapter) {
                checkVersion(p.id, p.VERSION, PKG_VERSION);
                return p;
            }
        }
    }
    return null;
}
