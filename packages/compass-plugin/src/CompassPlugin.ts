import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, events, utils } from '@photo-sphere-viewer/core';
import type { events as markersEvents, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import compass from './compass.svg';
import { CompassComponent } from './components/CompassComponent';
import { CompassHotspot, CompassPluginConfig, ParsedCompassPluginConfig, UpdatableCompassPluginConfig } from './model';

const getConfig = utils.getConfigParser<CompassPluginConfig, ParsedCompassPluginConfig>(
    {
        size: '120px',
        position: ['top', 'left'],
        backgroundSvg: compass,
        coneColor: 'rgba(255, 255, 255, 0.5)',
        navigation: true,
        navigationColor: 'rgba(255, 0, 0, 0.2)',
        hotspots: [],
        hotspotColor: 'rgba(0, 0, 0, 0.5)',
        className: null
    },
    {
        position: (position, { defValue }) => {
            return utils.cleanCssPosition(position, { allowCenter: true, cssOrder: true }) || defValue;
        },
    }
);

/**
 * Adds a compass on the viewer
 */
export class CompassPlugin extends AbstractConfigurablePlugin<
    CompassPluginConfig,
    ParsedCompassPluginConfig,
    UpdatableCompassPluginConfig
> {
    static override readonly id = 'compass';
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof CompassPluginConfig> = ['navigation'];

    private markers?: MarkersPlugin;
    private readonly component: CompassComponent;

    constructor(viewer: Viewer, config: CompassPluginConfig) {
        super(viewer, config);

        this.component = new CompassComponent(this.viewer, this);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'compass-plugin');

        this.markers = this.viewer.getPlugin('markers');

        this.viewer.addEventListener(events.RenderEvent.type, this);
        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });

        if (this.markers) {
            this.markers.addEventListener('set-markers', this);
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.RenderEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);

        if (this.markers) {
            this.markers.removeEventListener('set-markers', this);
        }

        this.component.destroy();

        delete this.markers;

        super.destroy();
    }

    override setOptions(options: Partial<UpdatableCompassPluginConfig>) {
        super.setOptions(options);

        this.component.applyConfig();
        this.component.update();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.ReadyEvent.type:
                this.component.show();
                break;
            case events.RenderEvent.type:
                this.component.update();
                break;
            case 'set-markers':
                this.component.setMarkers(
                    (e as markersEvents.SetMarkersEvent).markers.filter((m) => m.data?.['compass'])
                );
                break;
        }
    }

    /**
     * Hides the compass
     */
    hide() {
        this.component.hide();
    }

    /**
     * Shows the compass
     */
    show() {
        this.component.show();
    }

    /**
     * Changes the hotspots on the compass
     */
    setHotspots(hotspots: CompassHotspot[]) {
        this.config.hotspots = hotspots;
        this.component.update();
    }

    /**
     * Removes all hotspots
     */
    clearHotspots() {
        this.setHotspots(null);
    }
}
