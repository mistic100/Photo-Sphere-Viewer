import type { Position, Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, SYSTEM } from '@photo-sphere-viewer/core';
import type { Marker } from '@photo-sphere-viewer/markers-plugin';
import { MathUtils } from 'three';
import type { CompassPlugin } from '../CompassPlugin';

const HOTSPOT_SIZE_RATIO = 1 / 40;

export class CompassComponent extends AbstractComponent {
    protected override readonly state = {
        visible: true,
        mouse: null as { clientX: number; clientY: number },
        mousedown: false,
        markers: [] as Marker[],
    };

    private readonly canvas: HTMLCanvasElement;
    private readonly background: HTMLElement;

    get config() {
        return this.plugin.config;
    }

    constructor(viewer: Viewer, private plugin: CompassPlugin) {
        super(viewer, {});

        this.background = document.createElement('div');
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.background);
        this.container.appendChild(this.canvas);

        if (this.config.navigation) {
            this.container.addEventListener('mouseenter', this);
            this.container.addEventListener('mouseleave', this);
            this.container.addEventListener('mousemove', this);
            this.container.addEventListener('mousedown', this);
            this.container.addEventListener('mouseup', this);
            this.container.addEventListener('touchstart', this);
            this.container.addEventListener('touchmove', this);
            this.container.addEventListener('touchend', this);
        }

        this.applyConfig();
        this.hide();
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case 'mouseenter':
            case 'mousemove':
            case 'touchmove':
                this.state.mouse = (e as TouchEvent).changedTouches?.[0] || (e as MouseEvent);
                if (this.state.mousedown) {
                    this.click();
                } else {
                    this.update();
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'mousedown':
            case 'touchstart':
                this.state.mousedown = true;
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'mouseup':
            case 'touchend':
                this.state.mouse = (e as TouchEvent).changedTouches?.[0] || (e as MouseEvent);
                this.state.mousedown = false;
                this.click();
                if ((e as TouchEvent).changedTouches) {
                    this.state.mouse = null;
                    this.update();
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'mouseleave':
                this.state.mouse = null;
                this.state.mousedown = false;
                this.update();
                break;
            default:
                break;
        }
    }

    applyConfig() {
        this.container.className = `psv-compass psv-compass--${this.config.position.join('-')}`;
        this.background.innerHTML = this.config.backgroundSvg;

        this.container.style.width = this.config.size;
        this.container.style.height = this.config.size;

        this.container.style.marginTop = this.config.position[0] === 'center' ? `calc(-${this.config.size} / 2)` : '';
        this.container.style.marginLeft = this.config.position[1] === 'center' ? `calc(-${this.config.size} / 2)` : '';
    }

    override show(): void {
        super.show();
        this.update();
    }

    setMarkers(markers: Marker[]) {
        this.state.markers = markers;
        this.update();
    }

    /**
     * Updates the compass for current zoom and position
     */
    update() {
        if (!this.isVisible()) {
            return;
        }

        this.canvas.width = this.container.clientWidth * SYSTEM.pixelRatio;
        this.canvas.height = this.container.clientWidth * SYSTEM.pixelRatio;

        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const yaw = this.viewer.getPosition().yaw;
        const fov = MathUtils.degToRad(this.viewer.state.hFov);

        this.__drawCone(context, this.config.coneColor, yaw, fov);

        const mouseAngle = this.__getMouseAngle();
        if (mouseAngle !== null) {
            this.__drawCone(context, this.config.navigationColor, mouseAngle, fov);
        }

        this.state.markers.forEach((marker) => {
            this.__drawMarker(context, marker);
        });
        this.config.hotspots?.forEach((spot) => {
            if ('yaw' in spot && !('pitch' in spot)) {
                (spot as Position).pitch = 0;
            }
            const pos = this.viewer.dataHelper.cleanPosition(spot);
            this.__drawPoint(context, spot.color || this.config.hotspotColor, pos.yaw, pos.pitch);
        });
    }

    /**
     * Rotates the viewer depending on the position of the mouse on the compass
     */
    private click() {
        const mouseAngle = this.__getMouseAngle();

        if (mouseAngle !== null) {
            this.viewer.rotate({
                yaw: mouseAngle,
                pitch: 0, // TODO marker or hotspot vertical angle
            });
        }
    }

    /**
     * Draw a cone
     */
    private __drawCone(context: CanvasRenderingContext2D, color: string, yaw: number, fov: number) {
        const a1 = yaw - Math.PI / 2 - fov / 2;
        const a2 = a1 + fov;
        const c = this.canvas.width / 2;

        context.beginPath();
        context.moveTo(c, c);
        context.lineTo(c + Math.cos(a1) * c, c + Math.sin(a1) * c);
        context.arc(c, c, c, a1, a2, false);
        context.lineTo(c, c);
        context.fillStyle = color;
        context.fill();
    }

    /**
     * Draw a Marker
     */
    private __drawMarker(context: CanvasRenderingContext2D, marker: Marker) {
        let color = this.config.hotspotColor;
        if (typeof marker.data['compass'] === 'string') {
            color = marker.data['compass'];
        }

        if (marker.isPoly()) {
            context.beginPath();
            (marker.definition as Array<[number, number]>).forEach(([yaw, pitch], i) => {
                const a = yaw - Math.PI / 2;
                const d = (pitch + Math.PI / 2) / Math.PI;
                const c = this.canvas.width / 2;

                context[i === 0 ? 'moveTo' : 'lineTo'](c + Math.cos(a) * c * d, c + Math.sin(a) * c * d);
            });
            if (marker.isPolygon()) {
                context.fillStyle = color;
                context.fill();
            } else {
                context.strokeStyle = color;
                context.lineWidth = Math.max(1, (this.canvas.width * HOTSPOT_SIZE_RATIO) / 2);
                context.stroke();
            }
        } else {
            const pos = marker.state.position;
            this.__drawPoint(context, color, pos.yaw, pos.pitch);
        }
    }

    /**
     * Draw a point
     */
    private __drawPoint(context: CanvasRenderingContext2D, color: string, yaw: number, pitch: number) {
        const a = yaw - Math.PI / 2;
        const d = (pitch + Math.PI / 2) / Math.PI;
        const c = this.canvas.width / 2;
        const r = Math.max(2, this.canvas.width * HOTSPOT_SIZE_RATIO);

        context.beginPath();
        // prettier-ignore
        context.ellipse(
            c + Math.cos(a) * c * d, c + Math.sin(a) * c * d, 
            r, r,
            0, 0,
            Math.PI * 2
        );
        context.fillStyle = color;
        context.fill();
    }

    /**
     * Gets the horizontal angle corresponding to the mouse position on the compass
     */
    private __getMouseAngle(): number | null {
        if (!this.state.mouse) {
            return null;
        }

        const boundingRect = this.container.getBoundingClientRect();
        const mouseX = this.state.mouse.clientX - boundingRect.left - boundingRect.width / 2;
        const mouseY = this.state.mouse.clientY - boundingRect.top - boundingRect.width / 2;

        if (Math.sqrt(mouseX * mouseX + mouseY * mouseY) > boundingRect.width / 2) {
            return null;
        }

        return Math.atan2(mouseY, mouseX) + Math.PI / 2;
    }
}
