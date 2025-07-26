import type { Position, Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, CONSTANTS, events, utils } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { GalleryPlugin, events as GalleryEvents } from '@photo-sphere-viewer/gallery-plugin';
import { Control, Layer, Map, Marker, TileLayer } from 'leaflet';
import { MathUtils } from 'three';
import type { PlanPlugin } from '../PlanPlugin';
import { HOTSPOT_MARKER_ID, OSM_ATTRIBUTION, OSM_LABEL, OSM_URL } from '../constants';
import { SelectHotspot, ViewChanged } from '../events';
import { PlanHotspot } from '../model';
import { createLeafletIcon, getStyle, gpsToLeaflet } from '../utils';
import { PlanCloseButton } from './PlanCloseButton';
import { PlanLayersButton } from './PlanLayersButton';
import { PlanMaximizeButton } from './PlanMaximizeButton';
import { PlanResetButton } from './PlanResetButton';

export class PlanComponent extends AbstractComponent {
    protected override readonly state = {
        visible: false,
        maximized: false,
        collapsed: false,
        galleryWasVisible: false,

        layers: {} as Record<string, Layer>,
        pinMarker: null as Marker,
        hotspots: {} as Record<string, {
            hotspot: PlanHotspot;
            marker: Marker;
            isMarker: boolean;
        }>,
        hotspotId: null as string,

        forceRender: false,
        needsUpdate: false,
        renderLoop: null as ReturnType<typeof requestAnimationFrame>,
    };

    private gallery?: GalleryPlugin;

    public readonly map: Map;
    private readonly resetButton: PlanResetButton;
    private readonly closeButton: PlanCloseButton;
    private readonly maximizeButton: PlanMaximizeButton;
    private readonly layersButton: PlanLayersButton;

    get config() {
        return this.plugin.config;
    }

    get maximized() {
        return this.state.maximized;
    }

    get collapsed() {
        return this.state.collapsed;
    }

    constructor(
        viewer: Viewer,
        private plugin: PlanPlugin,
    ) {
        super(viewer, {
            className: `psv-plan ${CONSTANTS.CAPTURE_EVENTS_CLASS}`,
        });

        viewer.addEventListener(events.KeypressEvent.type, this);
        viewer.addEventListener(events.ConfigChangedEvent.type, this);

        const mapContainer = document.createElement('div');
        mapContainer.className = 'psv-plan__container';

        this.map = new Map(mapContainer, {
            attributionControl: false,
            zoomControl: false,
        });
        new Control.Attribution({ prefix: false }).addTo(this.map);

        this.container.appendChild(mapContainer);

        this.container.addEventListener('transitionstart', this);
        this.container.addEventListener('transitionend', this);

        // sub-components
        this.layersButton = new PlanLayersButton(this);
        if (this.config.buttons.reset) {
            this.resetButton = new PlanResetButton(this);
        }
        if (this.config.buttons.maximize) {
            this.maximizeButton = new PlanMaximizeButton(this);
        }
        if (this.config.buttons.close) {
            this.closeButton = new PlanCloseButton(this);
        }

        // render loop
        const renderLoop = () => {
            if (this.isVisible() && (this.state.needsUpdate || this.state.forceRender)) {
                this.map?.invalidateSize();
                this.state.needsUpdate = false;
            }
            this.state.renderLoop = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        this.applyConfig();
        this.hide();

        if (!this.config.visibleOnLoad) {
            this.toggleCollapse();
        }

        if (this.config.configureLeaflet) {
            this.config.configureLeaflet(this.map);
        } else {
            this.__configureLeaflet();
        }

        this.map.fitWorld();

        if (this.config.coordinates) {
            this.recenter();
        }
    }

    init() {
        this.gallery = this.viewer.getPlugin('gallery');

        this.gallery?.addEventListener('show-gallery', this);
        this.gallery?.addEventListener('hide-gallery', this);
    }

    override destroy(): void {
        cancelAnimationFrame(this.state.renderLoop);

        this.viewer.removeEventListener(events.KeypressEvent.type, this);
        this.viewer.removeEventListener(events.ConfigChangedEvent.type, this);

        this.gallery?.removeEventListener('show-gallery', this);
        this.gallery?.removeEventListener('hide-gallery', this);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (utils.getMatchingTarget(e, `.${CONSTANTS.CAPTURE_EVENTS_CLASS}:not(.psv-plan)`)) {
            return;
        }
        switch (e.type) {
            case events.KeypressEvent.type:
                if (this.state.maximized) {
                    this.__onKeyPress(e as events.KeypressEvent);
                    e.preventDefault();
                }
                break;
            case events.ConfigChangedEvent.type:
                if ((e as events.ConfigChangedEvent).containsOptions('lang')) {
                    this.resetButton?.update();
                    this.closeButton?.update();
                    this.layersButton?.update();
                    this.maximizeButton?.update();
                }
                break;
            case 'transitionstart':
                this.state.forceRender = true;
                break;
            case 'transitionend':
                this.state.forceRender = false;
                break;
            case 'hide-gallery':
                this.__onToggleGallery(false);
                break;
            case 'show-gallery':
                if (!(e as GalleryEvents.ShowGalleryEvent).fullscreen) {
                    this.__onToggleGallery(true);
                }
                break;
        }
    }

    /**
     * Applies default configuration
     */
    private __configureLeaflet() {
        this.state.layers = this.config.layers.reduce((acc, layer, i) => {
            if (!layer.name) {
                layer.name = `Layer ${i + 1}`;
            }

            if (layer.urlTemplate) {
                acc[layer.name] = new TileLayer(layer.urlTemplate, { attribution: layer.attribution });
            } else if (layer.layer) {
                if (layer.attribution) {
                    layer.layer.options.attribution = layer.attribution;
                }
                acc[layer.name] = layer.layer;
            } else {
                utils.logWarn(`Layer #${i} is missing "urlTemplate" or "layer" property.`);
            }
            return acc;
        }, {} as Record<string, Layer>);

        if (!Object.values(this.state.layers).length) {
            utils.logWarn(`No layer configured, fallback to OSM.`);
            this.state.layers[OSM_LABEL] = new TileLayer(OSM_URL, { attribution: OSM_ATTRIBUTION });
        }

        const layersNames = Object.keys(this.state.layers);

        this.setLayer(layersNames[0]);

        if (layersNames.length > 1) {
            this.layersButton.setLayers(layersNames);
        }
    }

    applyConfig() {
        this.container.classList.remove(
            'psv-plan--top-right',
            'psv-plan--top-left',
            'psv-plan--bottom-right',
            'psv-plan--bottom-left',
        );
        this.container.classList.add(`psv-plan--${this.config.position.join('-')}`);

        this.container.style.width = this.config.size.width;
        this.container.style.height = this.config.size.height;

        this.layersButton.applyConfig();
        this.resetButton?.applyConfig();
        this.closeButton?.applyConfig();
        this.maximizeButton?.applyConfig();

        this.state.needsUpdate = true;
    }

    /**
     * Force re-creation of the central pin
     */
    updatePin() {
        if (this.state.pinMarker) {
            this.state.pinMarker.remove();
            this.state.pinMarker = null;
        }
        this.recenter();
    }

    /**
     * Force re-creation of hotspots
     */
    updateSpots() {
        this.setHotspots(Object.values(this.state.hotspots).filter(({ isMarker }) => !isMarker).map(({ hotspot }) => hotspot));
        this.setMarkers(Object.values(this.state.hotspots).filter(({ isMarker }) => isMarker).map(({ hotspot }) => hotspot));
    }

    override isVisible(): boolean {
        return this.state.visible && !this.state.collapsed;
    }

    override show() {
        super.show();
        this.state.needsUpdate = true;
    }

    override hide() {
        super.hide();
        this.state.forceRender = false;
    }

    /**
     * Rotates the central pin
     */
    updateBearing(position: Position = this.viewer.getPosition()) {
        if (this.state.pinMarker) {
            const elt = this.state.pinMarker.getElement().firstElementChild as HTMLElement;
            elt.style.rotate = MathUtils.radToDeg(position.yaw + this.config.bearing) + 'deg';
        }
    }

    /**
     * Changes the base layer
     */
    setLayer(name: string) {
        Object.values(this.state.layers).forEach((layer) => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });

        this.map.addLayer(this.state.layers[name]);
    }

    /**
     * Resets the map position and zoom level
     */
    reset() {
        this.map?.setView(gpsToLeaflet(this.config.coordinates), this.config.defaultZoom);
    }

    /**
     * Moves the position pin and resets the map position
     */
    recenter() {
        const pos = gpsToLeaflet(this.config.coordinates);

        if (!this.state.pinMarker) {
            const icon = createLeafletIcon(this.config.pinImage, this.config.pinSize, 'psv-plan__pin');

            this.state.pinMarker = new Marker(pos, {
                icon,
                alt: '',
            }).addTo(this.map);

            this.updateBearing();
        } else {
            this.state.pinMarker.setLatLng(pos);
        }

        if (this.map.getZoom() < 10) {
            this.reset();
        } else {
            this.map.setView(pos);
        }
    }

    /**
     * Switch collapsed mode
     */
    toggleCollapse() {
        if (this.state.maximized) {
            this.toggleMaximized(false);
        }

        this.state.collapsed = !this.state.collapsed;

        utils.toggleClass(this.container, 'psv-plan--collapsed', this.state.collapsed);

        if (!this.state.collapsed) {
            this.reset();
            this.plugin.dispatchEvent(new ViewChanged('normal'));
        } else {
            this.plugin.dispatchEvent(new ViewChanged('closed'));
        }

        this.closeButton?.update();
    }

    /**
     * Switch maximized mode
     */
    toggleMaximized(dispatchMinimizeEvent = true) {
        if (this.state.collapsed) {
            return;
        }

        this.state.maximized = !this.state.maximized;

        utils.toggleClass(this.container, 'psv-plan--maximized', this.state.maximized);

        if (this.state.maximized) {
            this.state.galleryWasVisible = this.gallery?.isVisible();
            this.gallery?.hide();

            this.map.getContainer().focus();
            this.plugin.dispatchEvent(new ViewChanged('maximized'));
        } else {
            this.map.getContainer().blur();

            if (this.state.galleryWasVisible) {
                this.gallery.show();
            }
            if (dispatchMinimizeEvent) {
                this.plugin.dispatchEvent(new ViewChanged('normal'));
            }
        }

        this.maximizeButton?.update();
    }

    /**
     * Changes the zoom level
     */
    zoom(d: number) {
        this.map.setZoom(d);
    }

    /**
     * Updates the markers
     */
    setMarkers(markers: PlanHotspot[]) {
        this.__setHotspots(markers, true);
    }

    /**
     * Changes the highlighted hotspot
     */
    setActiveHotspot(hotspotId: string) {
        if (this.state.hotspotId) {
            this.__applyStyle(this.state.hotspotId, false);
        }

        if (hotspotId) {
            this.__applyStyle(hotspotId, true);
        }

        this.state.hotspotId = hotspotId;
    }

    /**
     * Changes the hotspots
     */
    setHotspots(hotspots: PlanHotspot[]) {
        this.__setHotspots(hotspots, false);
    }

    private __setHotspots(hotspots: PlanHotspot[], isMarkers: boolean) {
        Object.entries(this.state.hotspots)
            .filter(([, { isMarker }]) => isMarker === isMarkers)
            .forEach(([id, { marker }]) => {
                marker.off();
                marker.remove();
                delete this.state.hotspots[id];
            });

        hotspots.forEach((hotspot) => {
            const style = getStyle(this.config.spotStyle, hotspot, false);

            const icon = createLeafletIcon(style.image || '', style.size, 'psv-plan__spot');

            const marker = new Marker(gpsToLeaflet(hotspot.coordinates), {
                icon,
                alt: '',
            }).addTo(this.map);

            if (hotspot.tooltip) {
                if (typeof hotspot.tooltip === 'string') {
                    hotspot.tooltip = { content: hotspot.tooltip };
                }

                marker.bindTooltip(hotspot.tooltip.content, {
                    className: hotspot.tooltip.className,
                    direction: 'top',
                    offset: [0, -style.size / 2],
                });
            }

            marker.on('click', () => this.__clickHotspot(hotspot.id));
            marker.on('mouseover', () => this.setActiveHotspot(hotspot.id));
            marker.on('mouseout', () => this.setActiveHotspot(null));

            this.state.hotspots[hotspot.id] = {
                hotspot,
                marker,
                isMarker: isMarkers,
            };

            this.__applyStyle(hotspot.id, false);
        });
    }

    /**
     * Updates the style of a map marker
     */
    private __applyStyle(hotspotId: string, hover: boolean) {
        const hotspot = this.state.hotspots[hotspotId]?.hotspot;
        const element = this.state.hotspots[hotspotId]?.marker.getElement();

        if (!hotspot) {
            return;
        }

        const style = getStyle(this.config.spotStyle, hotspot, hover);

        element.style.width = style.size + 'px';
        element.style.height = style.size + 'px';
        element.style.marginTop = (-style.size / 2) + 'px';
        element.style.marginLeft = (-style.size / 2) + 'px';

        if (!style.image) {
            element.style.backgroundColor = style.color;
            element.style.outlineStyle = 'solid';
            element.style.outlineColor = style.borderColor;
            element.style.outlineWidth = style.borderSize + 'px';
        } else {
            (element.firstElementChild as HTMLImageElement).src = style.image;
        }
    }

    /**
     * Dispatch event when a hotspot is clicked
     */
    private __clickHotspot(hotspotId: string) {
        this.plugin.dispatchEvent(new SelectHotspot(hotspotId));

        if (hotspotId.startsWith(HOTSPOT_MARKER_ID)) {
            const markerId = hotspotId.substring(HOTSPOT_MARKER_ID.length);
            this.viewer.getPlugin<MarkersPlugin>('markers').gotoMarker(markerId);
        }

        if (this.maximized && this.config.minimizeOnHotspotClick) {
            this.toggleMaximized();
        }
    }

    private __onToggleGallery(visible: boolean) {
        if (!visible) {
            this.container.style.marginBottom = '';
        } else {
            this.container.style.marginBottom = (this.viewer.container.querySelector<HTMLElement>('.psv-gallery').offsetHeight + 10) + 'px';
        }
    }

    private __onKeyPress(e: events.KeypressEvent) {
        if (e.matches(CONSTANTS.KEY_CODES.Escape)) {
            this.toggleMaximized();
            return;
        }
    }
}
