import { AbstractConfigurablePlugin, events, Point, utils, Viewer } from '@photo-sphere-viewer/core';
import type { Marker, events as markersEvents, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { Color } from 'three';
import { MapComponent } from './components/MapComponent';
import { HOTSPOT_GENERATED_ID, HOTSPOT_MARKER_ID, MARKER_DATA_KEY } from './constants';
import { MapPluginEvents } from './events';
import overlay from './overlay.svg';
import pin from './icons/pin.svg';
import { MapHotspot, MapPluginConfig, ParsedMapPluginConfig, UpdatableMapPluginConfig } from './model';

const getConfig = utils.getConfigParser<MapPluginConfig, ParsedMapPluginConfig>(
    {
        imageUrl: null,
        center: null,
        rotation: 0,
        size: '200px',
        position: ['bottom', 'left'],
        visibleOnLoad: true,
        overlayImage: overlay,
        compassImage: null,
        pinImage: pin,
        pinSize: 35,
        coneColor: '#1E78E6',
        coneSize: 40,
        spotColor: null,
        spotImage: null,
        spotSize: null,
        spotStyle: {
            size: 15,
            image: null,
            color: 'white',
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
        buttons: {
            maximize: true,
            close: true,
            reset: true,
            north: true,
        },
    },
    {
        overlayImage: (overlayImage, { rawConfig }) => {
            if (rawConfig.compassImage) {
                utils.logWarn('map: "compassImage" is deprecated, use "overlayImage" instead');
                return rawConfig.compassImage;
            }
            return overlayImage;
        },
        spotStyle: (spotStyle, { rawConfig }) => {
            [
                ['spotColor', 'color'],
                ['spotImage', 'image'],
                ['spotSize', 'size'],
            ].forEach((oldName, newName) => {
                // @ts-ignore
                if (rawConfig[oldName]) {
                    utils.logWarn(`map: "${oldName}" is deprecated, use "spotStyle.${newName}" instead`);
                    // @ts-ignore
                    spotStyle[newName] = rawConfig[oldName];
                }
            });
            return spotStyle;
        },
        position: (position, { defValue }) => {
            return utils.cleanCssPosition(position, { allowCenter: false, cssOrder: true }) || defValue;
        },
        rotation: (rotation) => utils.parseAngle(rotation),
        coneColor: (coneColor) => (coneColor ? new Color(coneColor).getStyle() : null),
        defaultZoom: (defaultZoom) => Math.log(defaultZoom / 100),
        maxZoom: (maxZoom) => Math.log(maxZoom / 100),
        minZoom: (minZoom) => Math.log(minZoom / 100),
        buttons: (buttons, { defValue }) => {
            return { ...defValue, ...buttons };
        },
    }
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
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof MapPluginConfig> = [
        'imageUrl',
        'center',
        'visibleOnLoad',
        'defaultZoom',
        'hotspots',
        'buttons',
    ];

    private markers?: MarkersPlugin;
    readonly component: MapComponent;

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

        this.markers = this.viewer.getPlugin('markers');

        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.addEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });

        this.setHotspots(this.config.hotspots, false);

        if (this.markers) {
            this.markers.addEventListener('set-markers', this);
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);

        if (this.markers) {
            this.markers.removeEventListener('set-markers', this);
        }

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
    setCenter(center: Point) {
        this.config.center = center;
        this.component.recenter();
    }

    /**
     * Changes the hotspots on the map
     */
    setHotspots(hotspots: MapHotspot[], render = true) {
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
    setActiveHotspot(hotspotId: string) {
        this.component.setActiveHotspot(hotspotId);
    }

    private __markersToHotspots(markers: Marker[]): MapHotspot[] {
        return markers
            .filter((marker) => marker.data?.[MARKER_DATA_KEY])
            .map((marker) => {
                const markerData: MapHotspot = marker.data[MARKER_DATA_KEY];

                const hotspot: MapHotspot = {
                    ...markerData,
                    id: HOTSPOT_MARKER_ID + marker.id,
                    tooltip: marker.config.tooltip,
                };

                if ('distance' in markerData) {
                    (hotspot as any).yaw = marker.state.position.yaw;
                } else if (!('x' in markerData) || !('y' in markerData)) {
                    utils.logWarn(`Marker ${marker.id} "map" data is missing position (distance or x+y)`);
                    return null;
                }

                return hotspot;
            })
            .filter((h) => h);
    }
}
