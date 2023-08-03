import type { Point, Position, Tooltip, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, CONSTANTS, events, PSVError, utils } from '@photo-sphere-viewer/core';
import { Vector3 } from 'three';
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
    MarkersPluginEvents,
    MarkerVisibilityEvent,
    RenderMarkersListEvent,
    SelectMarkerEvent,
    SelectMarkerListEvent,
    SetMarkersEvent,
    ShowMarkersEvent,
    UnselectMarkerEvent,
} from './events';
import { Marker } from './Marker';
import { MarkersButton } from './MarkersButton';
import { MarkersListButton } from './MarkersListButton';
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
    }
);

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
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof MarkersPluginConfig> = ['markers'];

    private readonly markers: Record<string, Marker> = {};

    private readonly state = {
        visible: true,
        showAllTooltips: false,
        currentMarker: null as Marker,
        hoveringMarker: null as Marker,
    };

    private readonly container: HTMLElement;
    private readonly svgContainer: SVGElement;

    constructor(viewer: Viewer, config: MarkersPluginConfig) {
        super(viewer, config);

        this.container = document.createElement('div');
        this.container.className = 'psv-markers';

        this.svgContainer = document.createElementNS(SVG_NS, 'svg');
        this.svgContainer.setAttribute('class', 'psv-markers-svg-container');
        this.container.appendChild(this.svgContainer);

        // Markers events via delegation
        this.container.addEventListener('mouseenter', this, true);
        this.container.addEventListener('mouseleave', this, true);
        this.container.addEventListener('mousemove', this, true);
        this.container.addEventListener('contextmenu', this);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.viewer.container.appendChild(this.container);

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
                    const marker = (e as events.ObjectEvent).object.userData[MARKER_DATA];
                    switch (e.type) {
                        case events.ObjectEnterEvent.type:
                            if (marker.config.tooltip || marker.config.content) {
                                this.viewer.setCursor('pointer');
                            }
                            this.__onMouseEnter(event, marker);
                            break;
                        case events.ObjectLeaveEvent.type:
                            this.viewer.setCursor(null);
                            this.__onMouseLeave(event, marker);
                            break;
                        case events.ObjectHoverEvent.type:
                            this.__onMouseMove(event, marker);
                            break;
                    }
                }
                break;

            case 'mouseenter':
                this.__onMouseEnter(e as MouseEvent, this.__getTargetMarker(e.target as HTMLElement));
                break;

            case 'mouseleave':
                this.__onMouseLeave(e as MouseEvent, this.__getTargetMarker(e.target as HTMLElement));
                break;

            case 'mousemove':
                this.__onMouseMove(e as MouseEvent, this.__getTargetMarker(e.target as HTMLElement));
                break;

            case 'contextmenu':
                e.preventDefault();
                break;
        }
    }

    /**
     * Toggles all markers
     */
    toggleAllMarkers() {
        if (this.state.visible) {
            this.hideAllMarkers();
        } else {
            this.showAllMarkers();
        }
    }

    /**
     * Shows all markers
     */
    showAllMarkers() {
        this.state.visible = true;

        this.renderMarkers();

        this.dispatchEvent(new ShowMarkersEvent());
    }

    /**
     * Hides all markers
     */
    hideAllMarkers() {
        this.state.visible = false;

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

        const marker = new Marker(this.viewer, this, config);

        if (marker.isPoly()) {
            this.svgContainer.appendChild(marker.domElement);
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
            this.__afterChangerMarkers();
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
     * @description Every property can be changed but you can't change its type (Eg: `image` to `html`)
     */
    updateMarker(config: MarkerConfig, render = true) {
        const marker = this.getMarker(config.id);

        marker.update(config);

        if (render) {
            this.__afterChangerMarkers();
        }
    }

    /**
     * Removes a marker from the viewer
     */
    removeMarker(markerId: string | MarkerConfig, render = true) {
        const marker = this.getMarker(markerId);

        if (marker.isPoly()) {
            this.svgContainer.removeChild(marker.domElement);
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
            this.__afterChangerMarkers();
        }
    }

    /**
     * Removes multiple markers
     */
    removeMarkers(markerIds: string[], render = true) {
        markerIds.forEach((markerId) => this.removeMarker(markerId, false));

        if (render) {
            this.__afterChangerMarkers();
        }
    }

    /**
     * Replaces all markers
     */
    setMarkers(markers: MarkerConfig[], render = true) {
        this.clearMarkers(false);

        markers?.forEach((marker) => {
            this.addMarker(marker, false);
        });

        if (render) {
            this.__afterChangerMarkers();
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
            this.__afterChangerMarkers();
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
        marker.visible = visible === null ? !marker.visible : visible;
        this.viewer.needsUpdate();
    }

    /**
     * Opens the panel with the content of the marker
     */
    showMarkerPanel(markerId: string | MarkerConfig) {
        const marker = this.getMarker(markerId);

        if (marker?.config?.content) {
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
            if (marker.visible && !marker.config.hideList) {
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
                const li = utils.getClosest(target, 'li');
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
        const zoomLevel = this.viewer.getZoomLevel();
        const viewerPosition = this.viewer.getPosition();

        Object.values(this.markers).forEach((marker) => {
            let isVisible = this.state.visible && marker.visible;
            let visibilityChanged = false;
            let position: Point = null;

            if (isVisible && marker.is3d()) {
                position = this.__getMarkerPosition(marker);
                isVisible = this.__isMarkerVisible(marker, position);
            } else if (isVisible && marker.isPoly()) {
                const positions = this.__getPolyPositions(marker);
                isVisible = positions.length > (marker.isPolygon() ? 2 : 1);

                if (isVisible) {
                    position = this.__getMarkerPosition(marker);

                    const points = positions.map((pos) => pos.x - position.x + ',' + (pos.y - position.y)).join(' ');

                    marker.domElement.setAttributeNS(null, 'points', points);
                    marker.domElement.setAttributeNS(null, 'transform', `translate(${position.x} ${position.y})`);
                }
            } else if (isVisible) {
                marker.updateSize();

                position = this.__getMarkerPosition(marker);
                isVisible = this.__isMarkerVisible(marker, position);

                if (isVisible) {
                    marker.domElement.style.translate = `${position.x}px ${position.y}px 0px`;

                    this.__applyScale(marker, {
                        zoomLevel,
                        viewerPosition,
                        mouseover: null,
                    });
                }
            }

            visibilityChanged = marker.state.visible !== isVisible;
            marker.state.visible = isVisible;
            marker.state.position2D = isVisible ? position : null;

            if (!marker.is3d()) {
                utils.toggleClass(marker.domElement, 'psv-marker--visible', isVisible);
            }

            if (!isVisible) {
                marker.hideTooltip();
            } else if (marker.state.staticTooltip) {
                marker.showTooltip();
            } else if (
                marker.config.tooltip?.trigger === 'click'
                || (marker === this.state.hoveringMarker && !marker.isPoly())
            ) {
                marker.refreshTooltip();
            } else if (marker !== this.state.hoveringMarker) {
                marker.hideTooltip();
            }

            if (visibilityChanged) {
                this.dispatchEvent(new MarkerVisibilityEvent(marker, isVisible));
            }
        });
    }

    /**
     * Computes and applies the scale to the marker
     */
    private __applyScale(marker: Marker, {
        zoomLevel,
        viewerPosition,
        mouseover
    }: {
        zoomLevel: number,
        viewerPosition: Position,
        mouseover: boolean
    }) {
        if (mouseover !== null && marker.config.hoverScale) {
            marker.domElement.style.transition = `scale ${marker.config.hoverScale.duration}ms ${marker.config.hoverScale.easing}`;
        }

        const scale = marker.getScale(zoomLevel, viewerPosition, mouseover);
        marker.domElement.style.scale = `${scale}`;
    }

    /**
     * Determines if a point marker is visible<br>
     * It tests if the point is in the general direction of the camera, then check if it's in the viewport
     */
    private __isMarkerVisible(marker: Marker, position: Point): boolean {
        return marker.state.positions3D[0].dot(this.viewer.state.direction) > 0
            && position.x + marker.state.size.width >= 0
            && position.x - marker.state.size.width <= this.viewer.state.size.width
            && position.y + marker.state.size.height >= 0
            && position.y - marker.state.size.height <= this.viewer.state.size.height;
    }

    /**
     * Computes viewer coordinates of a marker
     */
    private __getMarkerPosition(marker: Marker): Point {
        if (marker.isPoly()) {
            return this.viewer.dataHelper.sphericalCoordsToViewerCoords(marker.state.position);
        } else {
            const position = this.viewer.dataHelper.vector3ToViewerCoords(marker.state.positions3D[0]);

            position.x -= marker.state.size.width * marker.state.anchor.x;
            position.y -= marker.state.size.height * marker.state.anchor.y;

            return position;
        }
    }

    /**
     * Computes viewer coordinates of each point of a polygon/polyline<br>
     * It handles points behind the camera by creating intermediary points suitable for the projector
     */
    private __getPolyPositions(marker: Marker): Point[] {
        const nbVectors = marker.state.positions3D.length;

        // compute if each vector is visible
        const positions3D = marker.state.positions3D.map((vector) => {
            return {
                vector: vector,
                visible: vector.dot(this.viewer.state.direction) > 0,
            };
        });

        // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector
        const toBeComputed: Array<{ visible: Vector3; invisible: Vector3; index: number }> = [];
        positions3D.forEach((pos, i) => {
            if (!pos.visible) {
                const neighbours = [
                    i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1],
                    i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1],
                ];

                neighbours.forEach((neighbour) => {
                    if (neighbour.visible) {
                        toBeComputed.push({
                            visible: neighbour.vector,
                            invisible: pos.vector,
                            index: i,
                        });
                    }
                });
            }
        });

        // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)
        toBeComputed.reverse().forEach((pair) => {
            positions3D.splice(pair.index, 0, {
                vector: this.__getPolyIntermediaryPoint(pair.visible, pair.invisible),
                visible: true,
            });
        });

        // translate vectors to screen pos
        return positions3D
            .filter((pos) => pos.visible)
            .map((pos) => this.viewer.dataHelper.vector3ToViewerCoords(pos.vector));
    }

    /**
     * Given one point in the same direction of the camera and one point behind the camera,
     * computes an intermediary point on the great circle delimiting the half sphere visible by the camera.
     * The point is shifted by .01 rad because the projector cannot handle points exactly on this circle.
     * @todo : does not work with fisheye view (must not use the great circle)
     * @link http://math.stackexchange.com/a/1730410/327208
     */
    private __getPolyIntermediaryPoint(P1: Vector3, P2: Vector3): Vector3 {
        const C = this.viewer.state.direction.clone().normalize();
        const N = new Vector3().crossVectors(P1, P2).normalize();
        const V = new Vector3().crossVectors(N, P1).normalize();
        const X = P1.clone().multiplyScalar(-C.dot(V));
        const Y = V.clone().multiplyScalar(C.dot(P1));
        const H = new Vector3().addVectors(X, Y).normalize();
        const a = new Vector3().crossVectors(H, C);
        return H.applyAxisAngle(a, 0.01).multiplyScalar(CONSTANTS.SPHERE_RADIUS);
    }

    /**
     * Returns the marker associated to an event target
     */
    private __getTargetMarker(target: HTMLElement, closest = false): Marker {
        const target2 = closest ? utils.getClosest(target, '.psv-marker') : target;
        return target2 ? (target2 as any)[MARKER_DATA] : undefined;
    }

    /**
     * Checks if an event target is in the tooltip
     */
    private __targetOnTooltip(target: HTMLElement, tooltip: Tooltip): boolean {
        return target && tooltip ? utils.hasParent(target, tooltip.container) : false;
    }

    /**
     * Handles mouse enter events, show the tooltip for non polygon markers
     */
    private __onMouseEnter(e: MouseEvent, marker: Marker) {
        if (marker && !marker.isPoly()) {
            this.state.hoveringMarker = marker;

            this.dispatchEvent(new EnterMarkerEvent(marker));

            if (marker.isNormal() || marker.isSvg()) {
                this.__applyScale(marker, {
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
    private __onMouseLeave(e: MouseEvent, marker: Marker) {
        // do not hide if we enter the tooltip itself while hovering a polygon
        if (marker && !(marker.isPoly() && this.__targetOnTooltip(e.relatedTarget as HTMLElement, marker.tooltip))) {
            this.dispatchEvent(new LeaveMarkerEvent(marker));

            if (marker.isNormal() || marker.isSvg()) {
                this.__applyScale(marker, {
                    zoomLevel: this.viewer.getZoomLevel(),
                    viewerPosition: this.viewer.getPosition(),
                    mouseover: false,
                });
            }

            this.state.hoveringMarker = null;

            if (!marker.state.staticTooltip && marker.config.tooltip?.trigger === 'hover') {
                marker.hideTooltip();
            }
        }
    }

    /**
     * Handles mouse move events, refreshUi the tooltip for polygon markers
     */
    private __onMouseMove(e: MouseEvent, targetMarker?: Marker) {
        let marker;

        if (targetMarker?.isPoly()) {
            marker = targetMarker;
        }
        // do not hide if we enter the tooltip itself while hovering a polygon
        else if (
            this.state.hoveringMarker
            && this.__targetOnTooltip(e.target as HTMLElement, this.state.hoveringMarker.tooltip)
        ) {
            marker = this.state.hoveringMarker;
        }

        if (marker) {
            if (!this.state.hoveringMarker) {
                this.dispatchEvent(new EnterMarkerEvent(marker));

                this.state.hoveringMarker = marker;
            }

            if (!marker.state.staticTooltip) {
                marker.showTooltip(e.clientX, e.clientY);
            }
        } else if (this.state.hoveringMarker?.isPoly()) {
            this.dispatchEvent(new LeaveMarkerEvent(this.state.hoveringMarker));

            if (!this.state.hoveringMarker.state.staticTooltip) {
                this.state.hoveringMarker.hideTooltip();
            }

            this.state.hoveringMarker = null;
        }
    }

    /**
     * Handles mouse click events, select the marker and open the panel if necessary
     */
    private __onClick(e: events.ClickEvent | events.DoubleClickEvent, dblclick: boolean) {
        let marker = e.data.objects.find((o) => o.userData[MARKER_DATA])?.userData[MARKER_DATA];

        if (!marker) {
            marker = this.__getTargetMarker(e.data.target, true);
        }

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
            if (this.markers[marker.id]) {
                if (marker.config.tooltip?.trigger === 'click') {
                    if (marker.tooltip) {
                        this.hideMarkerTooltip(marker);
                    } else {
                        this.showMarkerTooltip(marker);
                    }
                } else {
                    this.showMarkerPanel(marker.id);
                }
            }
        }
    }

    private __afterChangerMarkers() {
        this.__refreshUi();
        this.__checkObjectsObserver();
        this.viewer.needsUpdate();
        this.dispatchEvent(new SetMarkersEvent(this.getMarkers()));
    }

    /**
     * Updates the visiblity of the panel and the buttons
     */
    private __refreshUi() {
        const nbMarkers = Object.values(this.markers).filter((m) => !m.config.hideList).length;

        if (nbMarkers === 0) {
            if (this.viewer.panel.isVisible(ID_PANEL_MARKERS_LIST) || this.viewer.panel.isVisible(ID_PANEL_MARKER)) {
                this.viewer.panel.hide();
            }
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
        const has3d = Object.values(this.markers).some((marker) => marker.is3d());

        if (has3d) {
            this.viewer.observeObjects(MARKER_DATA);
        } else {
            this.viewer.unobserveObjects(MARKER_DATA);
        }
    }
}
