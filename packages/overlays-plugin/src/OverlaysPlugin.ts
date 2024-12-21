import type { AbstractAdapter, PanoData, Viewer } from '@photo-sphere-viewer/core';
import {
    AbstractConfigurablePlugin,
    EquirectangularAdapter,
    PSVError,
    events,
    utils,
} from '@photo-sphere-viewer/core';
import type { CubemapAdapter, CubemapData } from '@photo-sphere-viewer/cubemap-adapter';
import type { CubemapTilesAdapter } from '@photo-sphere-viewer/cubemap-tiles-adapter';
import type { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
import { Mesh } from 'three';
import { OVERLAY_DATA } from './constants';
import { OverlayClickEvent, OverlaysPluginEvents } from './events';
import {
    CubeOverlayConfig,
    OverlayConfig,
    OverlaysPluginConfig,
    SphereOverlayConfig,
    UpdatableOverlaysPluginConfig,
} from './model';

const getConfig = utils.getConfigParser<OverlaysPluginConfig>({
    overlays: [],
    autoclear: true,
    cubemapAdapter: null,
});

/**
 * Adds various overlays over the panorama
 */
export class OverlaysPlugin extends AbstractConfigurablePlugin<
    OverlaysPluginConfig,
    OverlaysPluginConfig,
    UpdatableOverlaysPluginConfig,
    OverlaysPluginEvents
> {
    static override readonly id = 'overlays';
    static override readonly VERSION = PKG_VERSION;
    static override configParser = getConfig;
    static override readonlyOptions: Array<keyof OverlaysPluginConfig> = ['overlays', 'cubemapAdapter'];

    private readonly state = {
        overlays: {} as Record<string, { config: OverlayConfig; mesh: Mesh }>,
    };

    private cubemapAdapter: CubemapAdapter;
    private equirectangularAdapter: EquirectangularAdapter;

    constructor(viewer: Viewer, config?: OverlaysPluginConfig) {
        super(viewer, config);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this, { once: true });
        this.viewer.addEventListener(events.PanoramaLoadEvent.type, this);
        this.viewer.addEventListener(events.ClickEvent.type, this);
    }

    /**
     * @internal
     */
    override destroy() {
        this.clearOverlays();

        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.removeEventListener(events.PanoramaLoadEvent.type, this);
        this.viewer.removeEventListener(events.ClickEvent.type, this);

        delete this.cubemapAdapter;
        delete this.equirectangularAdapter;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.PanoramaLoadedEvent) {
            this.config.overlays.forEach((overlay) => {
                this.addOverlay(overlay);
            });
            delete this.config.overlays;
        } else if (e instanceof events.PanoramaLoadEvent) {
            if (this.config.autoclear) {
                this.clearOverlays();
            }
        } else if (e instanceof events.ClickEvent) {
            if (e.data.rightclick) {
                return false;
            }
            const overlay = e.data.objects
                .map(o => o.userData[OVERLAY_DATA] as OverlayConfig['id'])
                .filter(o => !!o)
                .map(o => this.state.overlays[o].config)
                .sort((a, b) => b.zIndex - a.zIndex)[0];

            if (overlay) {
                this.dispatchEvent(new OverlayClickEvent(overlay.id));
            }
        }
    }

    /**
     * Adds a new overlay
     */
    addOverlay(config: OverlayConfig) {
        if (!config.path) {
            throw new PSVError(`Missing overlay "path"`);
        }

        const parsedConfig: OverlayConfig = {
            id: Math.random().toString(36).substring(2),
            opacity: 1,
            zIndex: 0,
            ...config,
        };

        if (this.state.overlays[parsedConfig.id]) {
            throw new PSVError(`Overlay "${parsedConfig.id} already exists.`);
        }

        if (typeof config.path === 'string') {
            this.__addSphereImageOverlay(parsedConfig as any);
        } else {
            this.__addCubeImageOverlay(parsedConfig as any);
        }
    }

    /**
     * Removes an overlay
     */
    removeOverlay(id: string) {
        if (!this.state.overlays[id]) {
            utils.logWarn(`Overlay "${id}" not found`);
            return;
        }

        const { mesh } = this.state.overlays[id];

        this.viewer.renderer.removeObject(mesh);
        this.viewer.renderer.cleanScene(mesh);
        this.viewer.needsUpdate();

        delete this.state.overlays[id];
    }

    /**
     * Remove all overlays
     */
    clearOverlays() {
        Object.keys(this.state.overlays).forEach((id) => {
            this.removeOverlay(id);
        });
    }

    /**
     * Add a spherical overlay
     */
    private async __addSphereImageOverlay(config: SphereOverlayConfig) {
        const currentPanoData = this.viewer.state.textureData.panoData as PanoData;

        const adapter = this.__getEquirectangularAdapter();

        const textureData = await adapter.loadTexture(config.path, false, null, false);

        let panoData: PanoData;
        if (currentPanoData.isEquirectangular) {
            const r = textureData.panoData.croppedWidth / currentPanoData.croppedWidth;
            panoData = {
                fullWidth: r * currentPanoData.fullWidth,
                fullHeight: r * currentPanoData.fullHeight,
                croppedWidth: r * currentPanoData.croppedWidth,
                croppedHeight: r * currentPanoData.croppedHeight,
                croppedX: r * currentPanoData.croppedX,
                croppedY: r * currentPanoData.croppedY,
            };
        } else {
            panoData = textureData.panoData;
        }

        const mesh = adapter.createMesh(panoData);
        mesh.renderOrder = 100 + config.zIndex;
        mesh.userData[OVERLAY_DATA] = config.id;

        adapter.setTexture(mesh, textureData);
        adapter.setTextureOpacity(mesh, config.opacity);
        mesh.material.transparent = true;

        this.state.overlays[config.id] = { config, mesh };

        this.viewer.renderer.addObject(mesh);
        this.viewer.needsUpdate();
    }

    /**
     * Add a cubemap overlay
     */
    private async __addCubeImageOverlay(config: CubeOverlayConfig) {
        const currentPanoData = this.viewer.state.textureData.panoData as CubemapData;

        const adapter = this.__getCubemapAdapter();

        const textureData = await adapter.loadTexture(config.path, false);

        if (!('type' in config.path) && currentPanoData.isCubemap) {
            textureData.panoData.flipTopBottom = currentPanoData.flipTopBottom;
        }

        const mesh = adapter.createMesh();
        mesh.renderOrder = 100 + config.zIndex;
        mesh.userData[OVERLAY_DATA] = config.id;

        adapter.setTexture(mesh, textureData);
        adapter.setTextureOpacity(mesh, config.opacity);
        mesh.material.forEach(m => m.transparent = true);

        this.state.overlays[config.id] = { config, mesh };

        this.viewer.renderer.addObject(mesh);
        this.viewer.needsUpdate();
    }

    private __getEquirectangularAdapter() {
        if (!this.equirectangularAdapter) {
            const id = (this.viewer.adapter.constructor as typeof AbstractAdapter).id;
            if (id === 'equirectangular') {
                this.equirectangularAdapter = this.viewer.adapter as EquirectangularAdapter;
            } else if (id === 'equirectangular-tiles') {
                this.equirectangularAdapter = (this.viewer.adapter as EquirectangularTilesAdapter).adapter;
            } else {
                this.equirectangularAdapter = new EquirectangularAdapter(this.viewer);
            }
        }

        return this.equirectangularAdapter;
    }

    private __getCubemapAdapter() {
        if (!this.cubemapAdapter) {
            const id = (this.viewer.adapter.constructor as typeof AbstractAdapter).id;
            if (id === 'cubemap') {
                this.cubemapAdapter = this.viewer.adapter as CubemapAdapter;
            } else if (id === 'cubemap-tiles') {
                this.cubemapAdapter = (this.viewer.adapter as CubemapTilesAdapter).adapter;
            } else if (this.config.cubemapAdapter) {
                this.cubemapAdapter = new this.config.cubemapAdapter(this.viewer) as CubemapAdapter;
            } else {
                throw new PSVError(`Cubemap overlays are only applicable with cubemap adapters`);
            }
        }

        return this.cubemapAdapter;
    }
}
