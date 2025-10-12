import { AbstractConfigurablePlugin, events, PluginConstructor, utils, type Viewer } from '@photo-sphere-viewer/core';
import type { Marker, events as markersEvents, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { type Map } from 'leaflet';
import { PlanComponent } from './components/PlanComponent';
import { HOTSPOT_GENERATED_ID, HOTSPOT_MARKER_ID, MARKER_DATA_KEY, OSM_ATTRIBUTION, OSM_LABEL, OSM_URL } from './constants';
import { PlanPluginEvents } from './events';
import pin from './icons/pin.svg';
import { GpsPosition, ParsedPlanPluginConfig, PlanHotspot, PlanPluginConfig, UpdatablePlanPluginConfig } from './model';

const getConfig = utils.getConfigParser<PlanPluginConfig>(
    {
        coordinates: null,
        bearing: 0,
        size: { width: '300px', height: '200px' },
        position: ['bottom', 'left'],
        visibleOnLoad: true,
        pinImage: pin,
        pinSize: 35,
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
            hoverBorderColor: 'rgba(255, 255, 255, 0.8)',
        },
        defaultZoom: 15,
        layers: [{
            urlTemplate: OSM_URL,
            attribution: OSM_ATTRIBUTION,
            name: OSM_LABEL,
        }],
        configureLeaflet: null,
        hotspots: [],
        minimizeOnHotspotClick: true,
        buttons: {
            maximize: true,
            close: true,
            reset: true,
        },
    },
    {
        spotStyle: (spotStyle, { defValue }) => ({ ...defValue, ...spotStyle }),
        position: (position, { defValue }) => {
            return utils.cleanCssPosition(position, { allowCenter: false, cssOrder: true }) || defValue;
        },
        bearing: bearing => utils.parseAngle(bearing),
        buttons: (buttons, { defValue }) => ({ ...defValue, ...buttons }),
    },
);

/**
 * Adds a map on the viewer
 */
export class PlanPlugin extends AbstractConfigurablePlugin<
    PlanPluginConfig,
    ParsedPlanPluginConfig,
    UpdatablePlanPluginConfig,
    PlanPluginEvents
> {
    static override readonly id = 'plan';
    static override readonly VERSION = PKG_VERSION;
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof PlanPluginConfig> = [
        'visibleOnLoad',
        'defaultZoom',
        'layers',
        'configureLeaflet',
        'buttons',
    ];

    private markers?: MarkersPlugin;
    readonly component: PlanComponent;

    static withConfig(config: PlanPluginConfig): [PluginConstructor, any] {
        return [PlanPlugin, config];
    }

    constructor(viewer: Viewer, config: PlanPluginConfig) {
        super(viewer, config);

        this.component = new PlanComponent(this.viewer, this);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'plan-plugin');

        this.component.init();

        this.markers = this.viewer.getPlugin('markers');

        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });
        this.markers?.addEventListener('set-markers', this);

        this.setHotspots(this.config.hotspots);
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);
        this.markers?.removeEventListener('set-markers', this);

        this.component.destroy();

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.ReadyEvent.type:
                if (this.config.visibleOnLoad) {
                    this.component.show();
                }
                break;
            case events.PositionUpdatedEvent.type:
                this.component.updateBearing((e as events.PositionUpdatedEvent).position);
                break;
            case 'set-markers':
                this.component.setMarkers(this.__markersToHotspots((e as markersEvents.SetMarkersEvent).markers));
                break;
            default:
                break;
        }
    }

    override setOptions(options: Partial<PlanPluginConfig>) {
        super.setOptions(options);

        if (options.coordinates) {
            this.component.recenter();
        }
        if (!utils.isNil(options.bearing)) {
            this.component.updateBearing();
        }
        if (options.pinImage || options.pinSize) {
            this.component.updatePin();
        }
        if (options.spotStyle) {
            this.component.updateSpots();
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
        this.component.zoom(level);
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
     * Changes the position on the map
     */
    setCoordinates(coordinates: GpsPosition) {
        this.config.coordinates = coordinates;
        this.component.recenter();
    }

    /**
     * Changes the hotspots on the map
     */
    setHotspots(hotspots: PlanHotspot[] | null) {
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

        this.component.setHotspots(this.config.hotspots);
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

    /**
     * Returns the Leaflet instance
     */
    getLeaflet(): Map {
        return this.component.map;
    }

    private __markersToHotspots(markers: Marker[]): PlanHotspot[] {
        return markers
            .filter(marker => marker.data?.[MARKER_DATA_KEY])
            .map((marker) => {
                const hotspot: PlanHotspot = {
                    ...marker.data[MARKER_DATA_KEY],
                    id: HOTSPOT_MARKER_ID + marker.id,
                    tooltip: marker.config.tooltip,
                };

                if (!hotspot.coordinates) {
                    utils.logWarn(`Marker #${marker.id} "plan" data is missing GPS coordinates`);
                    return null;
                }

                return hotspot;
            })
            .filter(h => h);
    }
}
