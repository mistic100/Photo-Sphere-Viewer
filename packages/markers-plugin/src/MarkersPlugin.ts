import type { PluginConstructor, Point, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, PSVError, events, utils } from '@photo-sphere-viewer/core';
import { Object3D } from 'three';
import { CSS3DContainer } from './CSS3DContainer';
import { getMarkerType } from './MarkerType';
import { MarkersButton } from './MarkersButton';
import { MarkersListButton } from './MarkersListButton';
import {
    DEFAULT_HOVER_SCALE,
    ID_PANEL_MARKER,
    ID_PANEL_MARKERS_LIST,
    MARKERS_LIST_TEMPLATE,
    MARKER_DATA,
    SVG_NS,
} from './constants';
import {
    EnterMarkerEvent,
    GotoMarkerDoneEvent,
    HideMarkersEvent,
    LeaveMarkerEvent,
    MarkerVisibilityEvent,
    MarkersPluginEvents,
    RenderMarkersListEvent,
    SelectMarkerEvent,
    SelectMarkerListEvent,
    SetMarkersEvent,
    ShowMarkersEvent,
    UnselectMarkerEvent,
} from './events';
import { AbstractStandardMarker } from './markers/AbstractStandardMarker';
import { Marker } from './markers/Marker';
import { Marker3D } from './markers/Marker3D';
import { MarkerCSS3D } from './markers/MarkerCSS3D';
import { MarkerNormal } from './markers/MarkerNormal';
import { MarkerPolygon } from './markers/MarkerPolygon';
import { MarkerSvg } from './markers/MarkerSvg';
import { MarkerConfig, MarkersPluginConfig, ParsedMarkersPluginConfig, UpdatableMarkersPluginConfig } from './model';

const getConfig = utils.getConfigParser<MarkersPluginConfig, ParsedMarkersPluginConfig>(
    {
        clickEventOnMarker: false,
        gotoMarkerSpeed: '8rpm',
        markers: null,
        defaultHoverScale: null,
    },
    {
        defaultHoverScale(defaultHoverScale) {
            if (!defaultHoverScale) {
                return null;
            }
            if (defaultHoverScale === true) {
                defaultHoverScale = DEFAULT_HOVER_SCALE;
            }
            if (typeof defaultHoverScale === 'number') {
                defaultHoverScale = { amount: defaultHoverScale };
            }
            return {
                ...DEFAULT_HOVER_SCALE,
                ...defaultHoverScale,
            };
        },
    },
);

function getMarkerCtor(config: MarkerConfig): typeof Marker {
    const type = getMarkerType(config, false);

    switch (type) {
        case 'image':
        case 'html':
        case 'element':
            return MarkerNormal;
        case 'imageLayer':
        case 'videoLayer':
            return Marker3D;
        case 'elementLayer':
            return MarkerCSS3D;
        case 'polygon':
        case 'polyline':
        case 'polygonPixels':
        case 'polylinePixels':
            return MarkerPolygon;
        case 'square':
        case 'rect':
        case 'circle':
        case 'ellipse':
        case 'path':
            return MarkerSvg;
        default:
            throw new PSVError('invalid marker type');
    }
}

/**
 * Displays various markers on the viewer
 */
export class MarkersPlugin extends AbstractConfigurablePlugin<
    MarkersPluginConfig,
    ParsedMarkersPluginConfig,
    UpdatableMarkersPluginConfig,
    MarkersPluginEvents
> {
    static override readonly id = 'markers';
    static override readonly VERSION = PKG_VERSION;
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof MarkersPluginConfig> = ['markers'];

    private readonly markers: Record<string, Marker> = {};

    private readonly state = {
        allVisible: true,
        showAllTooltips: false,
        currentMarker: null as Marker,
        hoveringMarker: null as Marker,
        // require a 2nd render (only the scene) when 3d markers visibility changes
        needsReRender: false,
        // use when updating a polygon marker in order to keep the current position
        lastClientX: null as number,
        lastClientY: null as number,
    };

    private readonly container: HTMLElement;
    private readonly svgContainer: SVGElement;
    private readonly css3DContainer: CSS3DContainer;

    static withConfig(config: MarkersPluginConfig): [PluginConstructor, any] {
        return [MarkersPlugin, config];
    }

    constructor(viewer: Viewer, config: MarkersPluginConfig) {
        super(viewer, config);

        this.container = document.createElement('div');
        this.container.className = 'psv-markers';
        this.viewer.container.appendChild(this.container);

        this.container.addEventListener('contextmenu', e => e.preventDefault());

        this.svgContainer = document.createElementNS(SVG_NS, 'svg');
        this.svgContainer.setAttribute('class', 'psv-markers-svg-container');
        this.container.appendChild(this.svgContainer);

        this.css3DContainer = new CSS3DContainer(viewer);
        this.container.appendChild(this.css3DContainer.element);

        // Markers events via delegation
        this.container.addEventListener('mouseenter', this, true);
        this.container.addEventListener('mouseleave', this, true);
        this.container.addEventListener('mousemove', this, true);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'markers-plugin');

        // Viewer events
        this.viewer.addEventListener(events.ClickEvent.type, this);
        this.viewer.addEventListener(events.DoubleClickEvent.type, this);
        this.viewer.addEventListener(events.RenderEvent.type, this);
        this.viewer.addEventListener(events.ConfigChangedEvent.type, this);
        this.viewer.addEventListener(events.ObjectEnterEvent.type, this);
        this.viewer.addEventListener(events.ObjectHoverEvent.type, this);
        this.viewer.addEventListener(events.ObjectLeaveEvent.type, this);
        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });
    }

    /**
     * @internal
     */
    override destroy() {
        this.clearMarkers(false);

        this.viewer.unobserveObjects(MARKER_DATA);

        this.viewer.removeEventListener(events.ClickEvent.type, this);
        this.viewer.removeEventListener(events.DoubleClickEvent.type, this);
        this.viewer.removeEventListener(events.RenderEvent.type, this);
        this.viewer.removeEventListener(events.ObjectEnterEvent.type, this);
        this.viewer.removeEventListener(events.ObjectHoverEvent.type, this);
        this.viewer.removeEventListener(events.ObjectLeaveEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);

        this.css3DContainer.destroy();
        this.viewer.container.removeChild(this.container);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.ReadyEvent.type:
                if (this.config.markers) {
                    this.setMarkers(this.config.markers);
                    delete this.config.markers;
                }
                break;

            case events.RenderEvent.type:
                this.renderMarkers();
                break;

            case events.ClickEvent.type:
                this.__onClick(e as events.ClickEvent, false);
                break;

            case events.DoubleClickEvent.type:
                this.__onClick(e as events.DoubleClickEvent, true);
                break;

            case events.ObjectEnterEvent.type:
            case events.ObjectLeaveEvent.type:
            case events.ObjectHoverEvent.type:
                if ((e as events.ObjectEvent).userDataKey === MARKER_DATA) {
                    const event = (e as events.ObjectEvent).originalEvent;
                    const marker: Marker = (e as events.ObjectEvent).object.userData[MARKER_DATA];
                    switch (e.type) {
                        case events.ObjectEnterEvent.type:
                            if (marker.config.style?.cursor) {
                                this.viewer.setCursor(marker.config.style.cursor);
                            } else if (marker.config.tooltip || marker.config.content) {
                                this.viewer.setCursor('pointer');
                            }
                            this.__onEnterMarker(event, marker);
                            break;
                        case events.ObjectLeaveEvent.type:
                            this.viewer.setCursor(null);
                            this.__onLeaveMarker(marker);
                            break;
                        case events.ObjectHoverEvent.type:
                            this.__onHoverMarker(event, marker);
                            break;
                    }
                }
                break;

            case 'mouseenter': {
                const marker = this.__getTargetMarker(utils.getEventTarget(e));
                this.__onEnterMarker(e as MouseEvent, marker);
                break;
            }

            case 'mouseleave': {
                const marker = this.__getTargetMarker(utils.getEventTarget(e));
                this.__onLeaveMarker(marker);
                break;
            }

            case 'mousemove': {
                const marker = this.__getTargetMarker(utils.getEventTarget(e), true);
                this.__onHoverMarker(e as MouseEvent, marker);
                break;
            }
        }
    }

    /**
     * Toggles all markers
     */
    toggleAllMarkers() {
        if (this.state.allVisible) {
            this.hideAllMarkers();
        } else {
            this.showAllMarkers();
        }
    }

    /**
     * Shows all markers
     */
    showAllMarkers() {
        this.state.allVisible = true;
        Object.values(this.markers).forEach((marker) => {
            marker.config.visible = true;
        });
        this.renderMarkers();
        this.dispatchEvent(new ShowMarkersEvent());
    }

    /**
     * Hides all markers
     */
    hideAllMarkers() {
        this.state.allVisible = false;
        Object.values(this.markers).forEach((marker) => {
            marker.config.visible = false;
        });
        this.renderMarkers();
        this.dispatchEvent(new HideMarkersEvent());
    }

    /**
     * Toggles the visibility of all tooltips
     */
    toggleAllTooltips() {
        if (this.state.showAllTooltips) {
            this.hideAllTooltips();
        } else {
            this.showAllTooltips();
        }
    }

    /**
     *  Displays all tooltips
     */
    showAllTooltips() {
        this.state.showAllTooltips = true;
        Object.values(this.markers).forEach((marker) => {
            marker.state.staticTooltip = true;
            marker.showTooltip();
        });
    }

    /**
     * Hides all tooltips
     */
    hideAllTooltips() {
        this.state.showAllTooltips = false;
        Object.values(this.markers).forEach((marker) => {
            marker.state.staticTooltip = false;
            marker.hideTooltip();
        });
    }

    /**
     * Returns the total number of markers
     */
    getNbMarkers(): number {
        return Object.keys(this.markers).length;
    }

    /**
     * Returns all the markers
     */
    getMarkers(): Marker[] {
        return Object.values(this.markers);
    }

    /**
     * Adds a new marker to viewer
     * @throws {@link PSVError} when the marker's id is missing or already exists
     */
    addMarker(config: MarkerConfig, render = true) {
        if (this.markers[config.id]) {
            throw new PSVError(`marker "${config.id}" already exists`);
        }

        // @ts-ignore
        const marker: Marker = new (getMarkerCtor(config))(this.viewer, this, config);

        if (marker.isPoly()) {
            this.svgContainer.appendChild(marker.domElement);
        } else if (marker.isCss3d()) {
            this.css3DContainer.addObject(marker as MarkerCSS3D);
        } else if (marker.is3d()) {
            this.viewer.renderer.addObject(marker.threeElement);
        } else {
            this.container.appendChild(marker.domElement);
        }

        this.markers[marker.id] = marker;

        if (this.state.showAllTooltips) {
            marker.state.staticTooltip = true;
        }

        if (render) {
            this.__afterChangeMarkers();
        }
    }

    /**
     * Returns the internal marker object for a marker id
     * @throws {@link PSVError} when the marker cannot be found
     */
    getMarker(markerId: string | MarkerConfig): Marker {
        const id = typeof markerId === 'object' ? markerId.id : markerId;

        if (!this.markers[id]) {
            throw new PSVError(`cannot find marker "${id}"`);
        }

        return this.markers[id];
    }

    /**
     * Returns the last marker selected by the user
     */
    getCurrentMarker(): Marker {
        return this.state.currentMarker;
    }

    /**
     * Updates the existing marker with the same id
     * Every property can be changed but you can't change its type (Eg: `image` to `html`)
     */
    updateMarker(config: MarkerConfig, render = true) {
        const marker = this.getMarker(config.id);

        marker.update(config);

        if (render) {
            this.__afterChangeMarkers();

            if (
                (marker === this.state.hoveringMarker && marker.config.tooltip?.trigger === 'hover')
                || marker.state.staticTooltip
            ) {
                marker.showTooltip(this.state.lastClientX, this.state.lastClientY, true);
            }
        }
    }

    /**
     * Removes a marker from the viewer
     */
    removeMarker(markerId: string | MarkerConfig, render = true) {
        const marker = this.getMarker(markerId);

        if (marker.isPoly()) {
            this.svgContainer.removeChild(marker.domElement);
        } else if (marker.isCss3d()) {
            this.css3DContainer.removeObject(marker as MarkerCSS3D);
        } else if (marker.is3d()) {
            this.viewer.renderer.removeObject(marker.threeElement);
        } else {
            this.container.removeChild(marker.domElement);
        }

        if (this.state.hoveringMarker === marker) {
            this.state.hoveringMarker = null;
        }

        if (this.state.currentMarker === marker) {
            this.state.currentMarker = null;
        }

        marker.destroy();
        delete this.markers[marker.id];

        if (render) {
            this.__afterChangeMarkers();
        }
    }

    /**
     * Removes multiple markers
     */
    removeMarkers(markerIds: string[], render = true) {
        markerIds.forEach(markerId => this.removeMarker(markerId, false));

        if (render) {
            this.__afterChangeMarkers();
        }
    }

    /**
     * Replaces all markers
     */
    setMarkers(markers: MarkerConfig[] | null, render = true) {
        this.clearMarkers(false);

        markers?.forEach((marker) => {
            this.addMarker(marker, false);
        });

        if (render) {
            this.__afterChangeMarkers();
        }
    }

    /**
     * Removes all markers
     */
    clearMarkers(render = true) {
        Object.keys(this.markers).forEach((markerId) => {
            this.removeMarker(markerId, false);
        });

        if (render) {
            this.__afterChangeMarkers();
        }
    }

    /**
     * Rotate the view to face the marker
     */
    gotoMarker(markerId: string | MarkerConfig, speed: string | number = this.config.gotoMarkerSpeed): Promise<void> {
        const marker = this.getMarker(markerId);

        if (!speed) {
            this.viewer.rotate(marker.state.position);
            if (!utils.isNil(marker.config.zoomLvl)) {
                this.viewer.zoom(marker.config.zoomLvl);
            }
            this.dispatchEvent(new GotoMarkerDoneEvent(marker));
            return Promise.resolve();
        } else {
            return this.viewer
                .animate({
                    ...marker.state.position,
                    zoom: marker.config.zoomLvl,
                    speed: speed,
                })
                .then(() => {
                    this.dispatchEvent(new GotoMarkerDoneEvent(marker));
                });
        }
    }

    /**
     * Hides a marker
     */
    hideMarker(markerId: string | MarkerConfig) {
        this.toggleMarker(markerId, false);
    }

    /**
     * Shows a marker
     */
    showMarker(markerId: string | MarkerConfig) {
        this.toggleMarker(markerId, true);
    }

    /**
     * Forces the display of the tooltip of a marker
     */
    showMarkerTooltip(markerId: string | MarkerConfig) {
        const marker = this.getMarker(markerId);
        marker.state.staticTooltip = true;
        marker.showTooltip();
    }

    /**
     * Hides the tooltip of a marker
     */
    hideMarkerTooltip(markerId: string | MarkerConfig) {
        const marker = this.getMarker(markerId);
        marker.state.staticTooltip = false;
        marker.hideTooltip();
    }

    /**
     * Toggles a marker visibility
     */
    toggleMarker(markerId: string | MarkerConfig, visible?: boolean) {
        const marker = this.getMarker(markerId);
        marker.config.visible = utils.isNil(visible) ? !marker.config.visible : visible;
        this.renderMarkers();
    }

    /**
     * Opens the panel with the content of the marker
     */
    showMarkerPanel(markerId: string | MarkerConfig) {
        const marker = this.getMarker(markerId);

        if (marker.config.content) {
            this.viewer.panel.show({
                id: ID_PANEL_MARKER,
                content: marker.config.content,
            });
        } else {
            this.hideMarkerPanel();
        }
    }

    /**
     * Closes the panel if currently showing the content of a marker
     */
    hideMarkerPanel() {
        this.viewer.panel.hide(ID_PANEL_MARKER);
    }

    /**
     * Toggles the visibility of the list of markers
     */
    toggleMarkersList() {
        if (this.viewer.panel.isVisible(ID_PANEL_MARKERS_LIST)) {
            this.hideMarkersList();
        } else {
            this.showMarkersList();
        }
    }

    /**
     * Opens side panel with the list of markers
     */
    showMarkersList() {
        let markers: Marker[] = [];
        Object.values(this.markers).forEach((marker) => {
            if (marker.config.visible && !marker.config.hideList) {
                markers.push(marker);
            }
        });

        const e = new RenderMarkersListEvent(markers);
        this.dispatchEvent(e);
        markers = e.markers;

        this.viewer.panel.show({
            id: ID_PANEL_MARKERS_LIST,
            content: MARKERS_LIST_TEMPLATE(markers, this.viewer.config.lang[MarkersButton.id]),
            noMargin: true,
            clickHandler: (target) => {
                const li = utils.getClosest(target, '.psv-panel-menu-item');
                const markerId = li ? li.dataset[MARKER_DATA] : undefined;

                if (markerId) {
                    const marker = this.getMarker(markerId);

                    this.dispatchEvent(new SelectMarkerListEvent(marker));

                    this.gotoMarker(marker.id);
                    this.hideMarkersList();
                }
            },
        });
    }

    /**
     * Closes side panel if it contains the list of markers
     */
    hideMarkersList() {
        this.viewer.panel.hide(ID_PANEL_MARKERS_LIST);
    }

    /**
     * Updates the visibility and the position of all markers
     */
    renderMarkers() {
        if (this.state.needsReRender) {
            this.state.needsReRender = false;
            return;
        }

        const zoomLevel = this.viewer.getZoomLevel();
        const viewerPosition = this.viewer.getPosition();
        const hoveringMarker = this.state.hoveringMarker;

        Object.values(this.markers).forEach((marker) => {
            let isVisible = marker.config.visible;
            let position: Point = null;

            if (isVisible) {
                position = marker.render({ viewerPosition, zoomLevel, hoveringMarker });
                isVisible = !!position;
            }

            const visibilityChanged = marker.state.visible !== isVisible;
            marker.state.visible = isVisible;
            marker.state.position2D = position;

            if (marker.domElement) {
                utils.toggleClass(marker.domElement, 'psv-marker--visible', isVisible);
            }

            if (!isVisible) {
                marker.hideTooltip();
            } else if (marker.state.staticTooltip) {
                marker.showTooltip();
            } else if (marker !== this.state.hoveringMarker) {
                marker.hideTooltip();
            }

            if (visibilityChanged) {
                this.dispatchEvent(new MarkerVisibilityEvent(marker, isVisible));

                if (marker.is3d() || marker.isCss3d()) {
                    this.state.needsReRender = true;
                }
            }
        });

        if (this.state.needsReRender) {
            this.viewer.needsUpdate();
        }
    }

    /**
     * Returns the marker associated to an event target
     */
    private __getTargetMarker(target: HTMLElement, closest?: boolean): Marker;
    private __getTargetMarker(target: Object3D[]): Marker;
    private __getTargetMarker(target: HTMLElement | Object3D[], closest = false): Marker {
        if (target instanceof Node) {
            const target2 = closest ? utils.getClosest(target, '.psv-marker') : target;
            return target2 ? (target2 as any)[MARKER_DATA] : undefined;
        } else if (Array.isArray(target)) {
            return target
                .map(o => o.userData[MARKER_DATA] as Marker)
                .filter(m => !!m)
                .sort((a, b) => b.config.zIndex - a.config.zIndex)[0];
        } else {
            return null;
        }
    }

    /**
     * Handles mouse enter events, show the tooltip for non polygon markers
     */
    private __onEnterMarker(e: MouseEvent, marker?: Marker) {
        if (marker) {
            this.state.hoveringMarker = marker;
            this.state.lastClientX = e.clientX;
            this.state.lastClientY = e.clientY;

            this.dispatchEvent(new EnterMarkerEvent(marker));

            if (marker instanceof AbstractStandardMarker) {
                marker.applyScale({
                    zoomLevel: this.viewer.getZoomLevel(),
                    viewerPosition: this.viewer.getPosition(),
                    mouseover: true,
                });
            }

            if (!marker.state.staticTooltip && marker.config.tooltip?.trigger === 'hover') {
                marker.showTooltip(e.clientX, e.clientY);
            }
        }
    }

    /**
     * Handles mouse leave events, hide the tooltip
     */
    private __onLeaveMarker(marker?: Marker) {
        if (marker) {
            this.dispatchEvent(new LeaveMarkerEvent(marker));

            if (marker instanceof AbstractStandardMarker) {
                marker.applyScale({
                    zoomLevel: this.viewer.getZoomLevel(),
                    viewerPosition: this.viewer.getPosition(),
                    mouseover: false,
                });
            }

            this.state.hoveringMarker = null;

            if (!marker.state.staticTooltip && marker.config.tooltip?.trigger === 'hover') {
                marker.hideTooltip();
            } else if (marker.state.staticTooltip) {
                marker.showTooltip();
            }
        }
    }

    /**
     * Handles mouse move events, refresh the tooltip for polygon markers
     */
    private __onHoverMarker(e: MouseEvent, marker?: Marker) {
        if (marker) {
            this.state.lastClientX = e.clientX;
            this.state.lastClientY = e.clientY;

            if (marker.isPoly() || marker.is3d() || marker.isCss3d()) {
                if (marker.config.tooltip?.trigger === 'hover') {
                    marker.showTooltip(e.clientX, e.clientY);
                }
            }
        }
    }

    /**
     * Handles mouse click events, select the marker and open the panel if necessary
     */
    private __onClick(e: events.ClickEvent | events.DoubleClickEvent, dblclick: boolean) {
        const threeMarker = this.__getTargetMarker(e.data.objects);
        const stdMarker = this.__getTargetMarker(e.data.target, true);

        // give priority to standard markers which are always on top of Three markers
        const marker = stdMarker || threeMarker;

        if (this.state.currentMarker && this.state.currentMarker !== marker) {
            this.dispatchEvent(new UnselectMarkerEvent(this.state.currentMarker));

            this.viewer.panel.hide(ID_PANEL_MARKER);

            if (!this.state.showAllTooltips && this.state.currentMarker.config.tooltip?.trigger === 'click') {
                this.hideMarkerTooltip(this.state.currentMarker.id);
            }

            this.state.currentMarker = null;
        }

        if (marker) {
            this.state.currentMarker = marker;

            this.dispatchEvent(new SelectMarkerEvent(marker, dblclick, e.data.rightclick));

            if (this.config.clickEventOnMarker) {
                // add the marker to event data
                e.data.marker = marker;
            } else {
                e.stopImmediatePropagation();
            }

            // the marker could have been deleted in an event handler
            if (this.markers[marker.id] && !e.data.rightclick) {
                if (marker.config.tooltip?.trigger === 'click') {
                    if (marker.tooltip) {
                        this.hideMarkerTooltip(marker.id);
                    } else {
                        this.showMarkerTooltip(marker.id);
                    }
                } else {
                    this.showMarkerPanel(marker.id);
                }
            }
        }
    }

    private __afterChangeMarkers() {
        this.__refreshUi();
        this.__checkObjectsObserver();
        this.viewer.needsUpdate();
        this.dispatchEvent(new SetMarkersEvent(this.getMarkers()));
    }

    /**
     * Updates the visiblity of the panel and the buttons
     */
    private __refreshUi() {
        const nbMarkers = Object.values(this.markers).filter(m => !m.config.hideList).length;

        if (nbMarkers === 0) {
            this.viewer.panel.hide(ID_PANEL_MARKER);
            this.viewer.panel.hide(ID_PANEL_MARKERS_LIST);
        } else {
            if (this.viewer.panel.isVisible(ID_PANEL_MARKERS_LIST)) {
                this.showMarkersList();
            } else if (this.viewer.panel.isVisible(ID_PANEL_MARKER)) {
                this.state.currentMarker ? this.showMarkerPanel(this.state.currentMarker.id) : this.viewer.panel.hide();
            }
        }

        this.viewer.navbar.getButton(MarkersButton.id, false)?.toggle(nbMarkers > 0);
        this.viewer.navbar.getButton(MarkersListButton.id, false)?.toggle(nbMarkers > 0);
    }

    /**
     * Adds or remove the objects observer if there are 3D markers
     */
    private __checkObjectsObserver() {
        const has3d = Object.values(this.markers).some(marker => marker.is3d());

        if (has3d) {
            this.viewer.observeObjects(MARKER_DATA);
        } else {
            this.viewer.unobserveObjects(MARKER_DATA);
        }
    }
}
