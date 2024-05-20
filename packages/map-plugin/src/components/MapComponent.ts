import type { Point, Tooltip, Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, CONSTANTS, events, SYSTEM, utils } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { MathUtils } from 'three';
import { HOTSPOT_MARKER_ID, MAP_SHADOW_BLUR, PIN_SHADOW_BLUR, PIN_SHADOW_OFFSET } from '../constants';
import { SelectHotspot } from '../events';
import type { MapPlugin } from '../MapPlugin';
import { MapHotspot } from '../model';
import {
    canvasShadow,
    drawImageCentered,
    drawImageHighDpi,
    getImageHtml,
    getStyle,
    ImageSource,
    loadImage,
    projectPoint,
    rgbToRgba,
    unprojectPoint,
} from '../utils';
import { MapCloseButton } from './MapCloseButton';
import { MapCompassButton } from './MapCompassButton';
import { MapMaximizeButton } from './MapMaximizeButton';
import { MapResetButton } from './MapResetButton';
import { MapZoomToolbar } from './MapZoomToolbar';

export class MapComponent extends AbstractComponent {
    protected override readonly state = {
        visible: false,
        maximized: false,
        collapsed: false,

        imgScale: 1,
        zoom: this.config.defaultZoom,
        offset: { x: 0, y: 0 } as Point,

        mouseX: null as number,
        mouseY: null as number,
        mousedown: false,
        pinchDist: 0,
        pinchAngle: 0,

        hotspotPos: {} as Record<string, Point & { s: number }>,
        hotspotId: null as string,
        hotspotTooltip: null as Tooltip,
        markers: [] as MapHotspot[],

        forceRender: false,
        needsUpdate: false,
        renderLoop: null as ReturnType<typeof requestAnimationFrame>,

        images: {} as Record<string, { loading: boolean; value: ImageSource }>,
    };

    private readonly canvas: HTMLCanvasElement;
    private readonly overlay: HTMLElement;
    private readonly resetButton: MapResetButton;
    private readonly maximizeButton: MapMaximizeButton;
    private readonly closeButton: MapCloseButton;
    private readonly compassButton: MapCompassButton;
    private readonly zoomToolbar: MapZoomToolbar;

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
        private plugin: MapPlugin
    ) {
        super(viewer, {
            className: `psv-map ${CONSTANTS.CAPTURE_EVENTS_CLASS}`,
        });

        // map + compass container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'psv-map__container';

        canvasContainer.addEventListener('mousedown', this);
        window.addEventListener('mousemove', this);
        window.addEventListener('mouseup', this);
        canvasContainer.addEventListener('touchstart', this);
        window.addEventListener('touchmove', this);
        window.addEventListener('touchend', this);
        canvasContainer.addEventListener('wheel', this);
        viewer.addEventListener(events.KeypressEvent.type, this);

        // map canvas
        this.canvas = document.createElement('canvas');
        this.__setCursor('move');
        canvasContainer.appendChild(this.canvas);

        // overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'psv-map__overlay';
        canvasContainer.appendChild(this.overlay);

        this.container.appendChild(canvasContainer);

        this.container.addEventListener('transitionstart', this);
        this.container.addEventListener('transitionend', this);

        // sub-components
        if (this.config.buttons.reset) {
            this.resetButton = new MapResetButton(this);
        }
        if (this.config.buttons.maximize) {
            this.maximizeButton = new MapMaximizeButton(this);
        }
        if (this.config.buttons.close) {
            this.closeButton = new MapCloseButton(this);
        }
        if (this.config.buttons.north) {
            this.compassButton = new MapCompassButton(this);
        }
        this.zoomToolbar = new MapZoomToolbar(this);

        // render loop
        const renderLoop = () => {
            if (this.isVisible() && (this.state.needsUpdate || this.state.forceRender)) {
                this.render();
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
    }

    override destroy(): void {
        this.canvas.width = 0;
        this.canvas.height = 0;

        window.removeEventListener('touchmove', this);
        window.removeEventListener('mousemove', this);
        window.removeEventListener('touchend', this);
        window.removeEventListener('mouseup', this);
        this.viewer.removeEventListener(events.KeypressEvent.type, this);

        cancelAnimationFrame(this.state.renderLoop);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (utils.getClosest(e.target as HTMLElement, `.${CONSTANTS.CAPTURE_EVENTS_CLASS}:not(.psv-map)`)) {
            return;
        }
        switch (e.type) {
            case events.KeypressEvent.type:
                if (this.state.maximized) {
                    this.__onKeyPress((e as events.KeypressEvent).key);
                    e.preventDefault();
                }
                break;
            case 'mousedown': {
                const event = e as MouseEvent;
                this.state.mouseX = event.clientX;
                this.state.mouseY = event.clientY;
                this.state.mousedown = true;
                e.stopPropagation();
                break;
            }
            case 'touchstart': {
                const event = e as TouchEvent;
                if (event.touches.length === 1) {
                    this.state.mouseX = event.touches[0].clientX;
                    this.state.mouseY = event.touches[0].clientY;
                    this.state.mousedown = true;
                } else if (event.touches.length === 2) {
                    ({
                        distance: this.state.pinchDist,
                        angle: this.state.pinchAngle,
                        center: { x: this.state.mouseX, y: this.state.mouseY },
                    } = utils.getTouchData(event));
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            }
            case 'mousemove': {
                const event = e as MouseEvent;
                if (this.state.mousedown) {
                    this.__move(event.clientX, event.clientY);
                    e.stopPropagation();
                } else if (e.target === this.canvas) {
                    this.__handleHotspots(event.clientX, event.clientY);
                }
                break;
            }
            case 'touchmove': {
                const event = e as TouchEvent;
                if (this.state.mousedown && event.touches.length === 1) {
                    this.__move(event.touches[0].clientX, event.touches[0].clientY);
                    e.stopPropagation();
                } else if (this.state.mousedown && event.touches.length === 2) {
                    const touchData = utils.getTouchData(event);
                    const delta = (touchData.distance - this.state.pinchDist) / SYSTEM.pixelRatio;

                    this.zoom(delta / 100);
                    this.__move(touchData.center.x, touchData.center.y);

                    if (this.state.maximized && !this.config.static) {
                        this.viewer.dynamics.position.step({ yaw: this.state.pinchAngle - touchData.angle }, 0);
                    }

                    ({ distance: this.state.pinchDist, angle: this.state.pinchAngle } = touchData);
                    e.stopPropagation();
                }
                break;
            }
            case 'mouseup':
            case 'touchend': {
                const mouse = (e as TouchEvent).changedTouches?.[0] || (e as MouseEvent);
                if (this.state.mousedown) {
                    this.state.mousedown = false;
                    e.stopPropagation();
                }
                if (e.target === this.canvas) {
                    this.__clickHotspot(mouse.clientX, mouse.clientY);
                }
                break;
            }
            case 'wheel': {
                const event = e as WheelEvent;
                const delta = event.deltaY / Math.abs(event.deltaY);
                if (event.ctrlKey) {
                    this.viewer.dynamics.position.step({ yaw: delta / 10 });
                } else {
                    this.zoom(-delta / 10);
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            }
            case 'transitionstart':
                this.state.forceRender = true;
                break;
            case 'transitionend':
                if (!this.state.maximized) {
                    this.overlay.style.display = '';
                    this.recenter();
                }
                this.state.forceRender = false;
                this.update();
                break;
        }
    }

    applyConfig() {
        this.container.classList.remove(
            'psv-map--top-right',
            'psv-map--top-left',
            'psv-map--bottom-right',
            'psv-map--bottom-left'
        );
        this.container.classList.add(`psv-map--${this.config.position.join('-')}`);

        this.container.style.width = this.config.size;
        this.container.style.height = this.config.size;

        this.overlay.innerHTML = getImageHtml(this.config.overlayImage);

        this.resetButton?.applyConfig();
        this.closeButton?.applyConfig();
        this.compassButton?.applyConfig();
        this.maximizeButton?.applyConfig();

        if (this.config.static) {
            this.compassButton?.rotate(0);
            this.overlay.style.transform = '';
        }

        this.update();
    }

    override isVisible(): boolean {
        return this.state.visible && !this.state.collapsed;
    }

    override show() {
        super.show();
        this.update();
        if (!this.state.maximized) {
            this.overlay.style.display = '';
        }
    }

    override hide() {
        super.hide();
        this.state.forceRender = false;
    }

    /**
     * Flag for render
     */
    update(clear = true) {
        this.state.needsUpdate = true;

        if (clear) {
            // clear hotspots status
            this.state.hotspotPos = {};
            this.__resetHotspot();
        }
    }

    /**
     * Load a new map image
     */
    reload(url: string) {
        delete this.state.images[this.config.imageUrl];
        this.config.imageUrl = url;
        this.state.imgScale = 1;
        this.__loadImage(this.config.imageUrl, true);
        this.recenter();
    }

    /**
     * Clears the offset and zoom level
     */
    reset() {
        this.state.zoom = this.config.defaultZoom;
        this.recenter();
    }

    /**
     * Clears the offset
     */
    recenter() {
        this.state.offset.x = 0;
        this.state.offset.y = 0;
        this.update();
    }

    /**
     * Switch collapsed mode
     */
    toggleCollapse() {
        if (this.state.maximized) {
            this.toggleMaximized();
        }

        this.state.collapsed = !this.state.collapsed;

        utils.toggleClass(this.container, 'psv-map--collapsed', this.state.collapsed);

        if (!this.state.collapsed) {
            this.reset();
        }

        this.closeButton?.update();
    }

    /**
     * Switch maximized mode
     */
    toggleMaximized() {
        if (this.state.collapsed) {
            return;
        }

        this.state.maximized = !this.state.maximized;

        utils.toggleClass(this.container, 'psv-map--maximized', this.state.maximized);

        if (this.state.maximized) {
            this.overlay.style.display = 'none';
        }

        this.maximizeButton?.update();
    }

    /**
     * Changes the zoom level
     */
    zoom(d: number) {
        this.state.zoom = MathUtils.clamp(this.state.zoom + d, this.config.minZoom, this.config.maxZoom);
        this.update();
    }

    /**
     * Updates the markers
     */
    setMarkers(markers: MapHotspot[]) {
        this.state.markers = markers;
        this.update();
    }

    /**
     * Changes the highlighted hotspot
     */
    setActiveHotspot(hotspotId: string) {
        this.state.hotspotId = hotspotId;
        this.update(false);
    }

    private render() {
        if (!this.config.center) {
            return;
        }

        // load the map image
        const mapImage = this.__loadImage(this.config.imageUrl);
        if (!mapImage) {
            return;
        }

        const yaw = this.viewer.getPosition().yaw;
        const zoom = Math.exp(this.state.zoom) / this.state.imgScale;
        const center: Point = {
            x: this.config.center.x * this.state.imgScale,
            y: this.config.center.y * this.state.imgScale,
        };
        const offset: Point = {
            x: this.state.offset.x * this.state.imgScale,
            y: this.state.offset.y * this.state.imgScale,
        };
        const rotation = this.config.rotation;
        const yawAndRotation = this.config.static ? 0 : yaw + rotation;

        // update UI
        if (!this.config.static) {
            this.overlay.style.transform = `rotate(${-yawAndRotation}rad)`;
            this.compassButton?.rotate(yawAndRotation);
        }
        this.zoomToolbar.setText(this.state.zoom);

        // clear canvas
        this.canvas.width = this.container.clientWidth * SYSTEM.pixelRatio;
        this.canvas.height = this.container.clientHeight * SYSTEM.pixelRatio;

        const canvasPos = utils.getPosition(this.canvas);
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const canvasVirtualCenterX = canvasW / 2 / SYSTEM.pixelRatio;
        const canvasVirtualCenterY = canvasH / 2 / SYSTEM.pixelRatio;

        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, canvasW, canvasH);

        // draw the map
        const mapW = mapImage.width;
        const mapH = mapImage.height;

        context.save();
        context.translate(canvasW / 2, canvasH / 2);
        context.rotate(-yawAndRotation);
        context.scale(zoom, zoom);
        canvasShadow(context, 0, 0, MAP_SHADOW_BLUR);
        // prettier-ignore
        drawImageHighDpi(
            context,
            mapImage,
            -center.x - offset.x,
            -center.y - offset.y,
            mapW,
            mapH
        );
        context.restore();

        // draw the hotspots
        [...this.config.hotspots, ...this.state.markers].forEach((hotspot: MapHotspot) => {
            const isHover = this.state.hotspotId === hotspot.id;

            const style = getStyle(this.config.spotStyle, hotspot, isHover);
            const image = this.__loadImage(style.image);

            const hotspotPos = { ...offset };
            if ('yaw' in hotspot && 'distance' in hotspot) {
                const angle = utils.parseAngle(hotspot.yaw) + rotation;
                hotspotPos.x += Math.sin(-angle) * hotspot.distance * this.state.imgScale;
                hotspotPos.y += Math.cos(-angle) * hotspot.distance * this.state.imgScale;
            } else if ('x' in hotspot && 'y' in hotspot) {
                hotspotPos.x += center.x - hotspot.x * this.state.imgScale;
                hotspotPos.y += center.y - hotspot.y * this.state.imgScale;
            } else {
                utils.logWarn(`Hotspot ${hotspot['id']} is missing position (yaw+distance or x+y)`);
                return;
            }

            const spotPos = projectPoint(hotspotPos, yawAndRotation, zoom);

            // TODO filter out not visible

            const x = canvasVirtualCenterX - spotPos.x;
            const y = canvasVirtualCenterY - spotPos.y;

            // save absolute position on the viewer
            this.state.hotspotPos[hotspot.id] = {
                x: x + canvasPos.x,
                y: y + canvasPos.y,
                s: style.size,
            };

            context.save();
            context.translate(x * SYSTEM.pixelRatio, y * SYSTEM.pixelRatio);
            canvasShadow(context, PIN_SHADOW_OFFSET, PIN_SHADOW_OFFSET, PIN_SHADOW_BLUR);
            if (image) {
                drawImageCentered(context, image, style.size);
            } else {
                context.fillStyle = style.color;
                context.beginPath();
                context.arc(0, 0, (style.size * SYSTEM.pixelRatio) / 2, 0, 2 * Math.PI);
                context.fill();

                if (style.borderColor && style.borderSize) {
                    context.shadowColor = 'transparent';
                    context.strokeStyle = style.borderColor;
                    context.lineWidth = style.borderSize;
                    context.beginPath();
                    context.arc(0, 0, ((style.size + style.borderSize) * SYSTEM.pixelRatio) / 2, 0, 2 * Math.PI);
                    context.stroke();
                }
            }
            context.restore();
        });

        const pinImage = this.__loadImage(this.config.pinImage);
        if (pinImage || (this.config.coneColor && this.config.coneSize)) {
            const pinPos = projectPoint(offset, yawAndRotation, zoom);

            const x = canvasVirtualCenterX - pinPos.x;
            const y = canvasVirtualCenterY - pinPos.y;
            const size = this.config.pinSize;
            const angle = this.config.static ? yaw + rotation : 0;

            context.save();
            context.translate(x * SYSTEM.pixelRatio, y * SYSTEM.pixelRatio);
            context.rotate(angle);

            // draw the cone
            if (this.config.coneColor && this.config.coneSize) {
                const fov = MathUtils.degToRad(this.viewer.state.hFov);
                const a1 = -Math.PI / 2 - fov / 2;
                const a2 = a1 + fov;
                const c = this.config.coneSize;

                const grad = context.createRadialGradient(0, 0, c / 4, 0, 0, c);
                grad.addColorStop(0, this.config.coneColor);
                grad.addColorStop(1, rgbToRgba(this.config.coneColor, 0));

                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(Math.cos(a1) * c, Math.sin(a1) * c);
                context.arc(0, 0, c, a1, a2, false);
                context.lineTo(0, 0);
                context.fillStyle = grad;
                context.fill();
            }

            // draw the pin
            if (pinImage) {
                canvasShadow(context, PIN_SHADOW_OFFSET, PIN_SHADOW_OFFSET, PIN_SHADOW_BLUR);
                drawImageCentered(context, pinImage, size);
            }

            context.restore();
        }
    }

    /**
     * Applies mouse movement to the map
     */
    private __move(clientX: number, clientY: number) {
        const yaw = this.viewer.getPosition().yaw;
        const zoom = Math.exp(this.state.zoom);

        const move = unprojectPoint(
            {
                x: this.state.mouseX - clientX,
                y: this.state.mouseY - clientY,
            },
            this.config.static ? 0 : yaw + this.config.rotation,
            zoom
        );

        this.state.offset.x += move.x;
        this.state.offset.y += move.y;

        this.update();

        this.state.mouseX = clientX;
        this.state.mouseY = clientY;
    }

    /**
     * Finds the hotspot under the mouse
     */
    private __findHotspot(clientX: number, clientY: number): string {
        const k = this.config.spotStyle.size / 2;

        let hotspotId: string = null;
        for (const [id, { x, y }] of Object.entries(this.state.hotspotPos)) {
            if (clientX > x - k && clientX < x + k && clientY > y - k && clientY < y + k) {
                hotspotId = id;
                break;
            }
        }

        return hotspotId;
    }

    /**
     * Updates current hotspot on mouse move and displays tooltip
     */
    private __handleHotspots(clientX: number, clientY: number) {
        const hotspotId = this.__findHotspot(clientX, clientY);

        if (this.state.hotspotId !== hotspotId) {
            this.__resetHotspot();

            if (hotspotId) {
                let tooltip;
                if (hotspotId.startsWith(HOTSPOT_MARKER_ID)) {
                    tooltip = this.state.markers.find(({ id }) => id === hotspotId)?.tooltip;
                } else {
                    tooltip = this.config.hotspots.find(({ id }) => id === hotspotId)?.tooltip;
                }

                if (tooltip) {
                    if (typeof tooltip === 'string') {
                        tooltip = { content: tooltip };
                    }

                    const hotspotPos = this.state.hotspotPos[hotspotId];
                    const viewerPos = utils.getPosition(this.viewer.container);

                    this.state.hotspotTooltip = this.viewer.createTooltip({
                        content: tooltip.content,
                        className: tooltip.className,
                        left: hotspotPos.x - viewerPos.x,
                        top: hotspotPos.y - viewerPos.y,
                        box: {
                            width: hotspotPos.s,
                            height: hotspotPos.s,
                        },
                    });
                }
            }

            this.setActiveHotspot(hotspotId);
            this.__setCursor(hotspotId ? 'pointer' : 'move');
        }
    }

    /**
     * Dispatch event when a hotspot is clicked
     */
    private __clickHotspot(clientX: number, clientY: number) {
        const hotspotId = this.__findHotspot(clientX, clientY);

        if (hotspotId) {
            this.plugin.dispatchEvent(new SelectHotspot(hotspotId));

            if (hotspotId.startsWith(HOTSPOT_MARKER_ID)) {
                const markerId = hotspotId.substring(HOTSPOT_MARKER_ID.length);
                this.viewer.getPlugin<MarkersPlugin>('markers').gotoMarker(markerId);
            }

            if (this.maximized) {
                this.toggleMaximized();
            }
        }

        this.__resetHotspot();
    }

    private __resetHotspot() {
        this.state.hotspotTooltip?.hide();
        this.state.hotspotTooltip = null;
        this.state.hotspotId = null;
    }

    /**
     * Loads an image and returns the result **synchronously**.
     * If the image is not already loaded it returns `null` and schedules a new render when the image is ready.
     */
    private __loadImage(url: string, isInit = false): ImageSource {
        if (!url) {
            return null;
        }

        if (!this.state.images[url]) {
            const image = loadImage(url);

            this.state.images[url] = {
                loading: true,
                value: image,
            };

            image.onload = () => {
                if (isInit && Math.max(image.width, image.height) > SYSTEM.maxCanvasWidth) {
                    this.state.imgScale = SYSTEM.maxCanvasWidth / Math.max(image.width, image.height);

                    const buffer = document.createElement('canvas');
                    buffer.width = image.width * this.state.imgScale;
                    buffer.height = image.height * this.state.imgScale;

                    const ctx = buffer.getContext('2d');
                    ctx.drawImage(image, 0, 0, buffer.width, buffer.height);

                    this.state.images[url].value = buffer;
                }

                this.state.images[url].loading = false;
                this.update(false);

                if (isInit) {
                    this.show();
                }
            };

            return null;
        }

        if (this.state.images[url].loading) {
            return null;
        }

        return this.state.images[url].value;
    }

    private __onKeyPress(key: string) {
        if (key === CONSTANTS.KEY_CODES.Escape) {
            this.toggleMaximized();
            return;
        }

        if (!this.viewer.state.keyboardEnabled) {
            return;
        }

        let x = 0;
        let y = 0;
        let z = 0;

        // prettier-ignore
        switch (key) {
            case CONSTANTS.KEY_CODES.ArrowUp: y = 1; break;
            case CONSTANTS.KEY_CODES.ArrowDown: y = -1; break;
            case CONSTANTS.KEY_CODES.ArrowLeft: x = 1; break;
            case CONSTANTS.KEY_CODES.ArrowRight: x = -1; break;
            case CONSTANTS.KEY_CODES.Plus: z = 1; break;
            case CONSTANTS.KEY_CODES.Minus: z = -1; break;
            case CONSTANTS.KEY_CODES.PageUp: z = 1; break;
            case CONSTANTS.KEY_CODES.PageDown: z = -1; break;
        }

        if (x || y) {
            this.state.mouseX = 0;
            this.state.mouseY = 0;
            this.__move(x * 10, y * 10);
        }

        if (z) {
            this.zoom(z / 10);
        }
    }

    private __setCursor(cursor: string) {
        this.canvas.style.cursor = cursor;
    }
}
