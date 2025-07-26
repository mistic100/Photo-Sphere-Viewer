import { MathUtils, Mesh } from 'three';
import {
    ACTIONS,
    CAPTURE_EVENTS_CLASS,
    CTRLZOOM_TIMEOUT,
    DBLCLICK_DELAY,
    IDS,
    KEY_CODES,
    LONGTOUCH_DELAY,
    MOVE_THRESHOLD,
    TWOFINGERSOVERLAY_DELAY,
    VIEWER_DATA,
} from '../data/constants';
import { SYSTEM } from '../data/system';
import {
    BeforeRenderEvent,
    ClickEvent,
    DoubleClickEvent,
    FullscreenEvent,
    KeypressEvent,
    ObjectEnterEvent,
    ObjectHoverEvent,
    ObjectLeaveEvent,
    StopAllEvent,
    ViewerEvents,
} from '../events';
import gestureIcon from '../icons/gesture.svg';
import mousewheelIcon from '../icons/mousewheel.svg';
import { ClickData, Point, Position } from '../model';
import {
    clone,
    getEventTarget,
    getMatchingTarget,
    getPosition,
    getTouchData,
    isEmpty,
    keyPressMatch,
    throttle,
} from '../utils';
import { PressHandler } from '../utils/PressHandler';
import type { Viewer } from '../Viewer';
import { AbstractService } from './AbstractService';

class Step {
    static IDLE = 0;
    static CLICK = 1;
    static MOVING = 2;

    private $: number = Step.IDLE;

    is(...steps: number[]): boolean {
        return steps.some(step => this.$ & step);
    }

    set(step: number) {
        this.$ = step;
    }

    add(step: number) {
        this.$ |= step;
    }

    remove(step: number) {
        this.$ &= ~step;
    }
}

/**
 * Events handler
 * @internal
 */
export class EventsHandler extends AbstractService {
    private readonly data = {
        /** start x position of the click/touch */
        startMouseX: 0,
        /** start y position of the click/touch */
        startMouseY: 0,
        /** current x position of the cursor */
        mouseX: 0,
        /** current y position of the cursor */
        mouseY: 0,
        /** current distance between fingers */
        pinchDist: 0,
        /** accumulator for smooth movement */
        moveDelta: { yaw: 0, pitch: 0, zoom: 0 },
        accumulatorFactor: 0,
        /** when the Ctrl key is pressed */
        ctrlKeyDown: false,
        /** temporary storage of click data between two clicks */
        dblclickData: null as ClickData,
        dblclickTimeout: null as ReturnType<typeof setTimeout>,
        longtouchTimeout: null as ReturnType<typeof setTimeout>,
        twofingersTimeout: null as ReturnType<typeof setTimeout>,
        ctrlZoomTimeout: null as ReturnType<typeof setTimeout>,
    };

    private readonly step = new Step();
    private readonly keyHandler = new PressHandler<ACTIONS>();
    private readonly resizeObserver = new ResizeObserver(throttle(() => this.viewer.autoSize(), 50));
    private readonly moveThreshold = MOVE_THRESHOLD * SYSTEM.pixelRatio;

    constructor(viewer: Viewer) {
        super(viewer);
    }

    /**
     * @internal
     */
    init() {
        window.addEventListener('keydown', this, { passive: false });
        window.addEventListener('keyup', this);
        this.viewer.container.addEventListener('mousedown', this);
        window.addEventListener('mousemove', this, { passive: false });
        window.addEventListener('mouseup', this);
        this.viewer.container.addEventListener('touchstart', this, { passive: false });
        window.addEventListener('touchmove', this, { passive: false });
        window.addEventListener('touchend', this, { passive: false });
        this.viewer.container.addEventListener('wheel', this, { passive: false });
        document.addEventListener('fullscreenchange', this);
        this.resizeObserver.observe(this.viewer.container);

        this.viewer.addEventListener(BeforeRenderEvent.type, this);
        this.viewer.addEventListener(StopAllEvent.type, this);
    }

    override destroy() {
        window.removeEventListener('keydown', this);
        window.removeEventListener('keyup', this);
        this.viewer.container.removeEventListener('mousedown', this);
        window.removeEventListener('mousemove', this);
        window.removeEventListener('mouseup', this);
        this.viewer.container.removeEventListener('touchstart', this);
        window.removeEventListener('touchmove', this);
        window.removeEventListener('touchend', this);
        this.viewer.container.removeEventListener('wheel', this);
        document.removeEventListener('fullscreenchange', this);
        this.resizeObserver.disconnect();

        this.viewer.removeEventListener(BeforeRenderEvent.type, this);
        this.viewer.removeEventListener(StopAllEvent.type, this);

        clearTimeout(this.data.dblclickTimeout);
        clearTimeout(this.data.longtouchTimeout);
        clearTimeout(this.data.twofingersTimeout);
        clearTimeout(this.data.ctrlZoomTimeout);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(evt: Event) {
        switch (evt.type) {
            case 'keydown': this.__onKeyDown(evt as KeyboardEvent); break;
            case 'keyup': this.__onKeyUp(); break;
            case 'mousemove': this.__onMouseMove(evt as MouseEvent); break;
            case 'mouseup': this.__onMouseUp(evt as MouseEvent); break;
            case 'touchmove': this.__onTouchMove(evt as TouchEvent); break;
            case 'touchend': this.__onTouchEnd(evt as TouchEvent); break;
            case 'fullscreenchange': this.__onFullscreenChange(); break;
            case BeforeRenderEvent.type: this.__applyMoveDelta(); break;
            case StopAllEvent.type: this.__clearMoveDelta(); break;
        }

        if (!getMatchingTarget(evt, '.' + CAPTURE_EVENTS_CLASS)) {
            switch (evt.type) {
                case 'mousedown': this.__onMouseDown(evt as MouseEvent); break;
                case 'touchstart': this.__onTouchStart(evt as TouchEvent); break;
                case 'wheel': this.__onMouseWheel(evt as WheelEvent); break;
            }
        }
    }

    /**
     * Handles keyboard events
     */
    private __onKeyDown(e: KeyboardEvent) {
        if (this.config.mousewheelCtrlKey) {
            this.data.ctrlKeyDown = e.key === KEY_CODES.Control;

            if (this.data.ctrlKeyDown) {
                clearTimeout(this.data.ctrlZoomTimeout);
                this.viewer.overlay.hide(IDS.CTRL_ZOOM);
            }
        }

        if (!this.viewer.dispatchEvent(new KeypressEvent(e.key, e))) {
            return;
        }

        if (!this.state.keyboardEnabled || !this.config.keyboardActions || this.keyHandler.pending) {
            return;
        }

        for (const [pattern, action] of Object.entries(this.config.keyboardActions)) {
            if (keyPressMatch(e, pattern)) {
                if (typeof action === 'function') {
                    action(this.viewer, e);
                } else {
                    if (action !== ACTIONS.ZOOM_IN && action !== ACTIONS.ZOOM_OUT) {
                        this.viewer.stopAll();
                    }

                    switch (action) {
                        case ACTIONS.ROTATE_UP: this.viewer.dynamics.position.roll({ pitch: false }); break;
                        case ACTIONS.ROTATE_DOWN: this.viewer.dynamics.position.roll({ pitch: true }); break;
                        case ACTIONS.ROTATE_RIGHT: this.viewer.dynamics.position.roll({ yaw: false }); break;
                        case ACTIONS.ROTATE_LEFT: this.viewer.dynamics.position.roll({ yaw: true }); break;
                        case ACTIONS.ZOOM_IN: this.viewer.dynamics.zoom.roll(false); break;
                        case ACTIONS.ZOOM_OUT: this.viewer.dynamics.zoom.roll(true); break;
                    }

                    this.keyHandler.down(action);
                }

                e.preventDefault();
                return;
            }
        }
    }

    /**
     * Handles keyboard events
     */
    private __onKeyUp() {
        this.data.ctrlKeyDown = false;

        if (!this.state.keyboardEnabled) {
            return;
        }

        this.keyHandler.up((action) => {
            if (action === ACTIONS.ZOOM_IN || action === ACTIONS.ZOOM_OUT) {
                this.viewer.dynamics.zoom.stop();
            } else {
                this.viewer.dynamics.position.stop();
                this.viewer.resetIdleTimer();
            }
        });
    }

    /**
     * Handles mouse down events
     */
    private __onMouseDown(evt: MouseEvent) {
        this.step.add(Step.CLICK);
        this.data.startMouseX = evt.clientX;
        this.data.startMouseY = evt.clientY;

        if (this.config.mousemove) {
            evt.preventDefault();
        }
    }

    /**
     *Handles mouse up events
     */
    private __onMouseUp(evt: MouseEvent) {
        if (this.step.is(Step.CLICK, Step.MOVING)) {
            this.__stopMove(evt.clientX, evt.clientY, evt, evt.button === 2);
        }
    }

    /**
     * Handles mouse move events
     */
    private __onMouseMove(evt: MouseEvent) {
        if (this.config.mousemove && this.step.is(Step.CLICK, Step.MOVING)) {
            evt.preventDefault();
            this.__doMove(evt.clientX, evt.clientY);
        }

        this.__handleObjectsEvents(evt);
    }

    /**
     * Handles touch events
     */
    private __onTouchStart(evt: TouchEvent) {
        if (evt.touches.length === 1) {
            this.step.add(Step.CLICK);
            this.data.startMouseX = evt.touches[0].clientX;
            this.data.startMouseY = evt.touches[0].clientY;

            if (!this.data.longtouchTimeout) {
                this.data.longtouchTimeout = setTimeout(() => {
                    const touch = evt.touches[0];
                    this.__stopMove(touch.clientX, touch.clientY, evt, true);
                    this.data.longtouchTimeout = null;
                }, LONGTOUCH_DELAY);
            }
        } else if (evt.touches.length === 2) {
            this.step.set(Step.IDLE);
            this.__cancelLongTouch();

            if (this.config.mousemove) {
                this.__cancelTwoFingersOverlay();
                this.__startMoveZoom(evt);
                evt.preventDefault();
            }
        }
    }

    /**
     * Handles touch events
     */
    private __onTouchEnd(evt: TouchEvent) {
        this.__cancelLongTouch();

        if (this.step.is(Step.CLICK, Step.MOVING)) {
            evt.preventDefault();
            this.__cancelTwoFingersOverlay();

            if (evt.touches.length === 1) {
                this.__stopMove(this.data.mouseX, this.data.mouseY);
            } else if (evt.touches.length === 0) {
                const touch = evt.changedTouches[0];
                this.__stopMove(touch.clientX, touch.clientY, evt);
            }
        }
    }

    /**
     * Handles touch move events
     */
    private __onTouchMove(evt: TouchEvent) {
        this.__cancelLongTouch();

        if (!this.config.mousemove) {
            return;
        }

        if (evt.touches.length === 1) {
            if (this.config.touchmoveTwoFingers) {
                if (this.step.is(Step.CLICK) && !this.data.twofingersTimeout) {
                    this.data.twofingersTimeout = setTimeout(() => {
                        this.viewer.overlay.show({
                            id: IDS.TWO_FINGERS,
                            image: gestureIcon,
                            title: this.config.lang.twoFingers,
                        });
                    }, TWOFINGERSOVERLAY_DELAY);
                }
            } else if (this.step.is(Step.CLICK, Step.MOVING)) {
                evt.preventDefault();
                const touch = evt.touches[0];
                this.__doMove(touch.clientX, touch.clientY);
            }
        } else {
            this.__doMoveZoom(evt);
            this.__cancelTwoFingersOverlay();
        }
    }

    /**
     * Cancel the long touch timer if any
     */
    private __cancelLongTouch() {
        if (this.data.longtouchTimeout) {
            clearTimeout(this.data.longtouchTimeout);
            this.data.longtouchTimeout = null;
        }
    }

    /**
     * Cancel the two fingers overlay timer if any
     */
    private __cancelTwoFingersOverlay() {
        if (this.config.touchmoveTwoFingers) {
            if (this.data.twofingersTimeout) {
                clearTimeout(this.data.twofingersTimeout);
                this.data.twofingersTimeout = null;
            }
            this.viewer.overlay.hide(IDS.TWO_FINGERS);
        }
    }

    /**
     * Handles mouse wheel events
     */
    private __onMouseWheel(evt: WheelEvent) {
        if (!this.config.mousewheel || !evt.deltaY) {
            return;
        }

        if (this.config.mousewheelCtrlKey && !this.data.ctrlKeyDown) {
            this.viewer.overlay.show({
                id: IDS.CTRL_ZOOM,
                image: mousewheelIcon,
                title: this.config.lang.ctrlZoom,
            });

            clearTimeout(this.data.ctrlZoomTimeout);
            this.data.ctrlZoomTimeout = setTimeout(() => this.viewer.overlay.hide(IDS.CTRL_ZOOM), CTRLZOOM_TIMEOUT);

            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        const delta = (evt.deltaY / Math.abs(evt.deltaY)) * 5 * this.config.zoomSpeed;
        if (delta !== 0) {
            this.viewer.dynamics.zoom.step(-delta, 5);
        }
    }

    /**
     * Handles fullscreen events
     */
    private __onFullscreenChange() {
        const fullscreen = this.viewer.isFullscreenEnabled();

        if (this.config.keyboard === 'fullscreen') {
            if (fullscreen) {
                this.viewer.startKeyboardControl();
            } else {
                this.viewer.stopKeyboardControl();
            }
        }

        this.viewer.dispatchEvent(new FullscreenEvent(fullscreen));
    }

    /**
     * Resets all state variables
     */
    private __resetMove() {
        this.step.set(Step.IDLE);
        this.data.mouseX = 0;
        this.data.mouseY = 0;
        this.data.startMouseX = 0;
        this.data.startMouseY = 0;
    }

    /**
     * Initializes the combines move and zoom
     */
    private __startMoveZoom(evt: TouchEvent) {
        this.viewer.stopAll();
        this.__resetMove();

        const touchData = getTouchData(evt);

        this.step.set(Step.MOVING);
        this.data.accumulatorFactor = this.config.moveInertia;
        ({
            distance: this.data.pinchDist,
            center: { x: this.data.mouseX, y: this.data.mouseY },
        } = touchData);
    }

    /**
     * Stops the movement
     * @description If the move threshold was not reached a click event is triggered
     */
    private __stopMove(clientX: number, clientY: number, event?: Event, rightclick = false) {
        if (this.step.is(Step.CLICK) && !this.__moveThresholdReached(clientX, clientY)) {
            this.__doClick(clientX, clientY, event, rightclick);
        }

        if (this.config.moveInertia) {
            this.data.accumulatorFactor = Math.pow(this.config.moveInertia, 0.5);
        }

        this.__resetMove();
        this.viewer.resetIdleTimer();
    }

    /**
     * Triggers an event with all coordinates when a simple click is performed
     */
    private __doClick(clientX: number, clientY: number, event?: Event, rightclick = false) {
        const boundingRect = this.viewer.container.getBoundingClientRect();

        const viewerX = clientX - boundingRect.left;
        const viewerY = clientY - boundingRect.top;

        const intersections = this.viewer.renderer.getIntersections({ x: viewerX, y: viewerY });
        const sphereIntersection = intersections.find(i => i.object.userData[VIEWER_DATA]);

        if (sphereIntersection) {
            const sphericalCoords = this.viewer.dataHelper.vector3ToSphericalCoords(sphereIntersection.point);

            const data: ClickData = {
                rightclick: rightclick,
                originalEvent: event,
                target: getEventTarget(event),
                clientX,
                clientY,
                viewerX,
                viewerY,
                yaw: sphericalCoords.yaw,
                pitch: sphericalCoords.pitch,
                objects: intersections.map(i => i.object).filter(o => !o.userData[VIEWER_DATA]),
            };

            try {
                const textureCoords = this.viewer.dataHelper.sphericalCoordsToTextureCoords(data);
                Object.assign(data, textureCoords);
            } catch {
                // nothing
            }

            if (!this.data.dblclickTimeout) {
                this.viewer.dispatchEvent(new ClickEvent(data));

                this.data.dblclickData = clone(data);
                this.data.dblclickTimeout = setTimeout(() => {
                    this.data.dblclickTimeout = null;
                    this.data.dblclickData = null;
                }, DBLCLICK_DELAY);
            } else {
                if (
                    Math.abs(this.data.dblclickData.clientX - data.clientX) < this.moveThreshold
                    && Math.abs(this.data.dblclickData.clientY - data.clientY) < this.moveThreshold
                ) {
                    this.viewer.dispatchEvent(new DoubleClickEvent(this.data.dblclickData));
                }

                clearTimeout(this.data.dblclickTimeout);
                this.data.dblclickTimeout = null;
                this.data.dblclickData = null;
            }
        }
    }

    /**
     * Trigger events for observed THREE objects
     */
    private __handleObjectsEvents(evt: MouseEvent) {
        if (!isEmpty(this.state.objectsObservers) && evt.composedPath().includes(this.viewer.container)) {
            const viewerPos = getPosition(this.viewer.container);

            const viewerPoint: Point = {
                x: evt.clientX - viewerPos.x,
                y: evt.clientY - viewerPos.y,
            };

            const intersections = this.viewer.renderer.getIntersections(viewerPoint);

            const emit = (
                object: Mesh,
                key: string,
                evtCtor: new (e: MouseEvent, o: Mesh, pt: Point, data: any) => ViewerEvents,
            ) => {
                this.viewer.dispatchEvent(new evtCtor(evt, object, viewerPoint, key));
            };

            for (const [key, object] of Object.entries(this.state.objectsObservers) as Array<[string, Mesh | null]>) {
                const intersection = intersections.find(i => i.object.userData[key]);

                if (intersection) {
                    if (object && intersection.object !== object) {
                        emit(object, key, ObjectLeaveEvent);
                        this.state.objectsObservers[key] = null;
                    }

                    if (!object) {
                        this.state.objectsObservers[key] = intersection.object;
                        emit(intersection.object, key, ObjectEnterEvent);
                    } else {
                        emit(intersection.object, key, ObjectHoverEvent);
                    }
                } else if (object) {
                    emit(object, key, ObjectLeaveEvent);
                    this.state.objectsObservers[key] = null;
                }
            }
        }
    }

    /**
     * Starts moving when crossing moveThreshold and performs movement
     */
    private __doMove(clientX: number, clientY: number) {
        if (this.step.is(Step.CLICK) && this.__moveThresholdReached(clientX, clientY)) {
            this.viewer.stopAll();
            this.__resetMove();
            this.step.set(Step.MOVING);
            this.data.mouseX = clientX;
            this.data.mouseY = clientY;
            this.data.accumulatorFactor = this.config.moveInertia;
        } else if (this.step.is(Step.MOVING)) {
            const x = (clientX - this.data.mouseX) * Math.cos(this.state.roll) - (clientY - this.data.mouseY) * Math.sin(this.state.roll);
            const y = (clientY - this.data.mouseY) * Math.cos(this.state.roll) + (clientX - this.data.mouseX) * Math.sin(this.state.roll);

            const rotation: Position = {
                yaw: this.config.moveSpeed * (x / this.state.size.width) * MathUtils.degToRad(this.state.hFov),
                pitch: this.config.moveSpeed * (y / this.state.size.height) * MathUtils.degToRad(this.state.vFov),
            };

            this.data.moveDelta.yaw += rotation.yaw;
            this.data.moveDelta.pitch += rotation.pitch;

            this.data.mouseX = clientX;
            this.data.mouseY = clientY;
        }
    }

    /**
     * Checks if the cursor was move beyond the move threshold
     */
    private __moveThresholdReached(clientX: number, clientY: number) {
        return (
            Math.abs(clientX - this.data.startMouseX) >= this.moveThreshold
            || Math.abs(clientY - this.data.startMouseY) >= this.moveThreshold
        );
    }

    /**
     * Perfoms combined move and zoom
     */
    private __doMoveZoom(evt: TouchEvent) {
        if (this.step.is(Step.MOVING)) {
            evt.preventDefault();

            const touchData = getTouchData(evt);

            this.__doMove(touchData.center.x, touchData.center.y);

            this.data.moveDelta.zoom += this.config.zoomSpeed * ((touchData.distance - this.data.pinchDist) / SYSTEM.pixelRatio);

            this.data.pinchDist = touchData.distance;
        }
    }

    private __applyMoveDelta() {
        const EPS = 0.001;

        if (Math.abs(this.data.moveDelta.yaw) > 0 || Math.abs(this.data.moveDelta.pitch) > 0) {
            const currentPosition = this.viewer.getPosition();
            this.viewer.rotate({
                yaw: currentPosition.yaw - this.data.moveDelta.yaw * (1 - this.config.moveInertia),
                pitch: currentPosition.pitch + this.data.moveDelta.pitch * (1 - this.config.moveInertia),
            });

            this.data.moveDelta.yaw *= this.data.accumulatorFactor;
            this.data.moveDelta.pitch *= this.data.accumulatorFactor;

            if (Math.abs(this.data.moveDelta.yaw) <= EPS) {
                this.data.moveDelta.yaw = 0;
            }
            if (Math.abs(this.data.moveDelta.pitch) <= EPS) {
                this.data.moveDelta.pitch = 0;
            }
        }

        if (Math.abs(this.data.moveDelta.zoom) > 0) {
            const currentZoom = this.viewer.getZoomLevel();
            this.viewer.zoom(currentZoom + this.data.moveDelta.zoom * (1 - this.config.moveInertia));

            this.data.moveDelta.zoom *= this.config.moveInertia;

            if (Math.abs(this.data.moveDelta.zoom) <= EPS) {
                this.data.moveDelta.zoom = 0;
            }
        }
    }

    private __clearMoveDelta() {
        this.data.moveDelta.yaw = 0;
        this.data.moveDelta.pitch = 0;
        this.data.moveDelta.zoom = 0;
    }
}
