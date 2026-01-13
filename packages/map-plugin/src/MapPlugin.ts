import { AbstractConfigurablePlugin, events, PluginConstructor, Point, utils, Viewer } from '@photo-sphere-viewer/core';
import type { Marker, events as markersEvents, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { Color } from 'three';
import { MapComponent } from './components/MapComponent';
import { HOTSPOT_GENERATED_ID, HOTSPOT_MARKER_ID, MARKER_DATA_KEY } from './constants';
import { MapPluginEvents } from './events';
import pin from './icons/pin.svg';
import { MapHotspot, MapPluginConfig, ParsedMapPluginConfig, UpdatableMapPluginConfig } from './model';

const getConfig = utils.getConfigParser<MapPluginConfig, ParsedMapPluginConfig>(
    {
        imageUrl: null,
        center: null,
        rotation: 0,
        shape: 'round',
        size: '200px',
        position: ['bottom', 'left'],
        visibleOnLoad: true,
        overlayImage: undefined,
        pinImage: pin,
        pinSize: 35,
        coneColor: '#1E78E6',
        coneSize: 40,
        spotStyle: {
            size: 15,
            image: null,
            color: 'white',
            borderSize: 0,
            borderColor: null,
            hoverSize: null,
            hoverImage: null,
            hoverColor: null,
            hoverBorderSize: 4,
            hoverBorderColor: 'rgba(255, 255, 255, 0.6)',
        },
        static: false,
        defaultZoom: 100,
        minZoom: 20,
        maxZoom: 200,
        hotspots: [],
        minimizeOnHotspotClick: true,
        buttons: {
            maximize: true,
            close: true,
            reset: true,
            north: true,
        },
    },
    {
        spotStyle: (spotStyle, { defValue }) => ({ ...defValue, ...spotStyle }),
        position: (position, { defValue }) => {
            return utils.cleanCssPosition(position, { allowCenter: false, cssOrder: true }) || defValue;
        },
        rotation: rotation => utils.parseAngle(rotation),
        coneColor: coneColor => (coneColor ? new Color(coneColor).getStyle() : null), // must be in rgb format
        defaultZoom: defaultZoom => Math.log(defaultZoom / 100),
        maxZoom: maxZoom => Math.log(maxZoom / 100),
        minZoom: minZoom => Math.log(minZoom / 100),
        buttons: (buttons, { defValue }) => ({ ...defValue, ...buttons }),
    },
);

/**
 * Adds a minimap on the viewer
 */
export class MapPlugin extends AbstractConfigurablePlugin<
    MapPluginConfig,
    ParsedMapPluginConfig,
    UpdatableMapPluginConfig,
    MapPluginEvents
> {
    static override readonly id = 'map';
    static override readonly VERSION = PKG_VERSION;
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof MapPluginConfig> = [
        'imageUrl',
        'visibleOnLoad',
        'defaultZoom',
        'buttons',
    ];

    private markers?: MarkersPlugin;
    readonly component: MapComponent;

    static withConfig(config: MapPluginConfig): [PluginConstructor, any] {
        return [MapPlugin, config];
    }

    constructor(viewer: Viewer, config: MapPluginConfig) {
        super(viewer, config);

        this.component = new MapComponent(this.viewer, this);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'map-plugin');

        this.component.init();

        this.markers = this.viewer.getPlugin('markers');

        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.addEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });
        this.markers?.addEventListener('set-markers', this);

        this.setHotspots(this.config.hotspots, false);
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);
        this.markers?.removeEventListener('set-markers', this);

        this.component.destroy();

        delete this.markers;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.ReadyEvent.type:
                this.component.reload(this.config.imageUrl);
                break;
            case events.PositionUpdatedEvent.type:
            case events.ZoomUpdatedEvent.type:
                this.component.update();
                break;
            case events.SizeUpdatedEvent.type:
                if (this.component.maximized) {
                    this.component.update();
                }
                break;
            case 'set-markers':
                this.component.setMarkers(this.__markersToHotspots((e as markersEvents.SetMarkersEvent).markers));
                break;
            default:
                break;
        }
    }

    override setOptions(options: Partial<UpdatableMapPluginConfig>) {
        super.setOptions(options);

        if (options.center) {
            this.component.recenter();
        }
        if (options.hotspots !== undefined) {
            this.setHotspots(options.hotspots);
        }

        this.component.applyConfig();
    }

    /**
     * Hides the map
     */
    hide() {
        this.component.hide();
    }

    /**
     * Shows the map
     */
    show() {
        this.component.show();
    }

    /**
     * Changes the current zoom level
     */
    setZoom(level: number) {
        this.component.setZoom(Math.log(level / 100));
    }

    /**
     * Closes the map
     */
    close() {
        if (!this.component.collapsed) {
            this.component.toggleCollapse();
        }
    }

    /**
     * Open the map
     */
    open() {
        if (this.component.collapsed) {
            this.component.toggleCollapse();
        }
    }

    /**
     * Minimizes the map
     */
    minimize() {
        if (this.component.maximized) {
            this.component.toggleMaximized();
        }
    }

    /**
     * Maximizes the map
     */
    maximize() {
        if (!this.component.maximized) {
            this.component.toggleMaximized();
        }
    }

    /**
     * Changes the image of the map
     * @param rotation Also change the image rotation
     * @param center Also change the position on the map
     */
    setImage(url: string, center?: Point, rotation?: string | number) {
        if (!utils.isNil(rotation)) {
            this.config.rotation = utils.parseAngle(rotation);
        }
        if (!utils.isNil(center)) {
            this.config.center = center;
        }
        this.component.reload(url);
    }

    /**
     * Changes the position on the map
     */
    setCenter(center: Point, resetView = true) {
        const previousCenter = this.config.center;
        this.config.center = center;
        if (resetView || !previousCenter) {
            this.component.recenter();
        } else {
            this.component.addOffset({
                x: previousCenter.x - center.x,
                y: previousCenter.y - center.y,
            });
        }
    }

    /**
     * Changes the hotspots on the map
     */
    setHotspots(hotspots: MapHotspot[] | null, render = true) {
        const ids: string[] = [];
        let i = 1;

        hotspots?.forEach((hotspot) => {
            if (!hotspot.id) {
                hotspot.id = HOTSPOT_GENERATED_ID + i++;
            } else if (ids.includes(hotspot.id)) {
                utils.logWarn(`Duplicated hotspot id "${hotspot.id}`);
            } else {
                ids.push(hotspot.id);
            }
        });

        this.config.hotspots = hotspots || [];

        if (render) {
            this.component.update();
        }
    }

    /**
     * Removes all hotspots
     */
    clearHotspots() {
        this.setHotspots(null);
    }

    /**
     * Changes the highlighted hotspot
     */
    setActiveHotspot(hotspotId: string | null) {
        this.component.setActiveHotspot(hotspotId);
    }

    private __markersToHotspots(markers: Marker[]): MapHotspot[] {
        return markers
            .filter(marker => marker.data?.[MARKER_DATA_KEY])
            .map((marker) => {
                const hotspot: MapHotspot = {
                    ...marker.data[MARKER_DATA_KEY],
                    id: HOTSPOT_MARKER_ID + marker.id,
                    tooltip: marker.config.tooltip,
                };

                if ('distance' in hotspot) {
                    hotspot.yaw = marker.state.position.yaw;
                } else if (!('x' in hotspot) || !('y' in hotspot)) {
                    utils.logWarn(`Marker #${marker.id} "map" data is missing position (distance or x+y)`);
                    return null;
                }

                return hotspot;
            })
            .filter(h => h);
    }
}
