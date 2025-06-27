import { Object3D } from 'three';
import { PanoramaPosition, Position, TextureData, ViewerConfig } from '../model';
import { PSVError } from '../PSVError';
import { type Viewer } from '../Viewer';
import { AbstractAdapter, AdapterConstructor, adapterInterop } from './AbstractAdapter';
import { VIEWER_DATA } from '../data/constants';
import { PanoramaLoadedEvent } from '../events';

const ADAPTER_ID = VIEWER_DATA + '_adapterId';

export type MultiAdapterPanorama = Record<string, any>;
export type MultiAdapterTextureData = TextureData<any, MultiAdapterPanorama, any>;

export type MultiAdapterConfig = {
    adapters: Array<ViewerConfig['adapter']>;
};

function unwrapTextureData(textureData: MultiAdapterTextureData): TextureData<any, any, any> {
    return {
        ...textureData,
        panorama: unwrapPanorama(textureData.panorama),
    };
}

function unwrapPanorama(panorama: MultiAdapterPanorama): any {
    return Object.values(panorama)[0];
}

export class MultiAdapter extends AbstractAdapter<MultiAdapterPanorama, any, any, Object3D> {
    static override readonly id = 'multi';
    static override readonly VERSION = PKG_VERSION;

    private readonly adapters: Record<string, AbstractAdapter<any, any, any, Object3D>> = {};
    private currentAdapter: string;

    static withConfig(config: MultiAdapterConfig): [AdapterConstructor, any] {
        return [MultiAdapter, config];
    }

    get isVideo(): boolean {
        return Object.keys(this.adapters).some(id => id.includes('video'));
    }

    constructor(viewer: Viewer, config: MultiAdapterConfig) {
        super(viewer);

        if (!config?.adapters?.length) {
            throw new PSVError('MultiAdapter: missing "adapters" config');
        }

        let hasStdAdapter = false;
        let hasVideoAdapter = false;

        config.adapters.forEach((adapter) => {
            if (Array.isArray(adapter)) {
                adapter = [adapterInterop(adapter[0]), adapter[1]];
            } else {
                adapter = [adapterInterop(adapter), null];
            }

            const adapterId = (adapter[0] as unknown as typeof AbstractAdapter).id;
            const isVideo = adapterId.includes('video');

            if ((isVideo && hasStdAdapter) || (!isVideo && hasVideoAdapter)) {
                throw new PSVError('MultiAdapter: cannot mix video and static adapters');
            }

            if (isVideo) {
                hasVideoAdapter = true;
            } else {
                hasStdAdapter = true;
            }

            const adapterInst = new adapter[0](this.viewer, adapter[1]);
            this.adapters[adapterId] = adapterInst;
        });
    }

    override init(): void {
        this.viewer.addEventListener(PanoramaLoadedEvent.type, ({ data }) => {
            this.currentAdapter = Object.keys(data.panorama)[0];
        });

        Object.values(this.adapters).forEach(adapter => adapter.init?.());
    }

    override destroy(): void {
        Object.values(this.adapters).forEach(adapter => adapter.destroy?.());
    }

    override getDownloadUrl(panorama: MultiAdapterPanorama): string {
        const adapter = this.getAdapter(panorama);
        return adapter.getDownloadUrl(unwrapPanorama(panorama));
    }

    override supportsTransition(panorama: MultiAdapterPanorama): boolean {
        const adapter = this.getAdapter(panorama);
        return adapter.supportsTransition(unwrapPanorama(panorama));
    }

    override supportsPreload(panorama: MultiAdapterPanorama): boolean {
        const adapter = this.getAdapter(panorama);
        return adapter.supportsPreload(unwrapPanorama(panorama));
    }

    override textureCoordsToSphericalCoords(point: PanoramaPosition, data: MultiAdapterTextureData): Position {
        const adapter = this.getAdapter(this.currentAdapter);
        return adapter.textureCoordsToSphericalCoords(point, unwrapTextureData(data));
    }

    override sphericalCoordsToTextureCoords(position: Position, data: MultiAdapterTextureData): PanoramaPosition {
        const adapter = this.getAdapter(this.currentAdapter);
        return adapter.sphericalCoordsToTextureCoords(position, unwrapTextureData(data));
    }

    override loadTexture(multiPanorama: MultiAdapterPanorama, loader?: boolean): Promise<MultiAdapterTextureData> {
        if (Object.keys(multiPanorama).length !== 1) {
            throw new PSVError('MultiAdapter: only one panorama can be loaded');
        }

        const [adapterId, panorama] = Object.entries(multiPanorama)[0];
        const adapter = this.getAdapter(adapterId);

        return adapter.loadTexture(panorama, loader)
            .then(textureData => ({
                ...textureData,
                panorama: multiPanorama,
            }));
    }

    override createMesh(textureData: MultiAdapterTextureData): Object3D {
        const adapter = this.getAdapter(textureData.panorama);
        const mesh = adapter.createMesh(unwrapTextureData(textureData));
        mesh.userData[ADAPTER_ID] = (adapter.constructor as typeof AbstractAdapter).id;
        return mesh;
    }

    override setTexture(mesh: Object3D, textureData: MultiAdapterTextureData, transition: boolean): void {
        const adapter = this.getAdapter(textureData.panorama);
        adapter.setTexture(mesh, unwrapTextureData(textureData), transition);
    }

    override setTextureOpacity(mesh: Object3D, opacity: number): void {
        const adapter = this.getAdapter(mesh);
        adapter.setTextureOpacity(mesh, opacity);
    }

    override disposeTexture(textureData: MultiAdapterTextureData): void {
        const adapter = this.getAdapter(textureData.panorama);
        adapter.disposeTexture(unwrapTextureData(textureData));
    }

    override disposeMesh(mesh: Object3D): void {
        const adapter = this.getAdapter(mesh);
        adapter.disposeMesh(mesh);
    }

    private getAdapter(id: string | MultiAdapterPanorama | Object3D): AbstractAdapter<any, any, any, Object3D> {
        if (id instanceof Object3D) {
            id = id.userData[ADAPTER_ID] as string;
        } else if (typeof id === 'object') {
            id = Object.keys(id)[0];
        }
        if (!this.adapters[id]) {
            throw new PSVError(`MultiAdapter: adapter "${id}" not found`);
        }
        return this.adapters[id];
    }
}
