import { Mesh } from 'three';
import { Tooltip, TooltipConfig } from './components/Tooltip';
import { TypedEvent } from './lib/TypedEventTarget';
import { ClickData, Point, Position, Size, TextureData, ViewerConfig } from './model';
import type { Viewer } from './Viewer';
import { keyPressMatch } from './utils';

/**
 * Base class for all events dispatched by {@link Viewer}
 */
export abstract class ViewerEvent extends TypedEvent<Viewer> {}

/**
 * @event Triggered before an animation, can be cancelled
 */
export class BeforeAnimateEvent extends ViewerEvent {
    static override readonly type = 'before-animate';
    override type: 'before-animate';

    /** @internal */
    constructor(
        /** target position, can be modified */
        public position: Position | undefined,
        /** target zoom level, can be modified */
        public zoomLevel: number | undefined,
    ) {
        super(BeforeAnimateEvent.type, true);
    }
}

/**
 * @event Triggered before a render
 */
export class BeforeRenderEvent extends ViewerEvent {
    static override readonly type = 'before-render';
    override type: 'before-render';

    /** @internal */
    constructor(
        /** time provided by requestAnimationFrame */
        public readonly timestamp: number,
        /**  time elapsed since the previous frame */
        public readonly elapsed: number,
    ) {
        super(BeforeRenderEvent.type);
    }
}

/**
 * @event Triggered before a rotate operation, can be cancelled
 */
export class BeforeRotateEvent extends ViewerEvent {
    static override readonly type = 'before-rotate';
    override type: 'before-rotate';

    /** @internal */
    constructor(
        /** target position, can be modified */
        public position: Position,
    ) {
        super(BeforeRotateEvent.type, true);
    }
}

/**
 * @event Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
 */
export class ClickEvent extends ViewerEvent {
    static override readonly type = 'click';
    override type: 'click';

    /** @internal */
    constructor(public readonly data: ClickData) {
        super(ClickEvent.type);
    }
}

/**
 * @event Triggered when some options are changed
 */
export class ConfigChangedEvent extends ViewerEvent {
    static override readonly type = 'config-changed';
    override type: 'config-changed';

    /** @internal */
    constructor(public readonly options: Array<keyof ViewerConfig>) {
        super(ConfigChangedEvent.type);
    }

    /**
     * Checks if at least one of the `options` has been modified
     */
    containsOptions(...options: Array<keyof ViewerConfig>): boolean {
        return options.some(option => this.options.includes(option));
    }
}

/**
 * @event Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`.
 */
export class DoubleClickEvent extends ViewerEvent {
    static override readonly type = 'dblclick';
    override type: 'dblclick';

    /** @internal */
    constructor(public readonly data: ClickData) {
        super(DoubleClickEvent.type);
    }
}

/**
 * @event Triggered when the fullscreen is enabled/disabled
 */
export class FullscreenEvent extends ViewerEvent {
    static override readonly type = 'fullscreen';
    override type: 'fullscreen';

    /** @internal */
    constructor(public readonly fullscreenEnabled: boolean) {
        super(FullscreenEvent.type);
    }
}

/**
 * @event Triggered when the notification is hidden
 */
export class HideNotificationEvent extends ViewerEvent {
    static override readonly type = 'hide-notification';
    override type: 'hide-notification';

    /** @internal */
    constructor(public readonly notificationId?: string) {
        super(HideNotificationEvent.type);
    }
}

/**
 * @event Triggered when the overlay is hidden
 */
export class HideOverlayEvent extends ViewerEvent {
    static override readonly type = 'hide-overlay';
    override type: 'hide-overlay';

    /** @internal */
    constructor(public readonly overlayId?: string) {
        super(HideOverlayEvent.type);
    }
}

/**
 * @event Triggered when the panel is hidden
 */
export class HidePanelEvent extends ViewerEvent {
    static override readonly type = 'hide-panel';
    override type: 'hide-panel';

    /** @internal */
    constructor(public readonly panelId?: string) {
        super(HidePanelEvent.type);
    }
}

/**
 * @event Triggered when a tooltip is hidden
 */
export class HideTooltipEvent extends ViewerEvent {
    static override readonly type = 'hide-tooltip';
    override type: 'hide-tooltip';

    /** @internal */
    constructor(
        /** Userdata associated to the tooltip */
        public readonly tooltipData: TooltipConfig['data'],
    ) {
        super(HideTooltipEvent.type);
    }
}

/**
 * @event Triggered when a key is pressed, can be cancelled
 */
export class KeypressEvent extends ViewerEvent {
    static override readonly type = 'key-press';
    override type: 'key-press';

    /** @internal */
    constructor(public readonly key: string, public readonly originalEvent: KeyboardEvent) {
        super(KeypressEvent.type, true);
    }

    /**
     * Checks if the key events matches the given pattern
     */
    matches(pattern: string): boolean {
        return keyPressMatch(this.originalEvent, pattern);
    }
}

/**
 * @event Triggered when the loader value changes
 */
export class LoadProgressEvent extends ViewerEvent {
    static override readonly type = 'load-progress';
    override type: 'load-progress';

    /** @internal */
    constructor(public readonly progress: number) {
        super(LoadProgressEvent.type);
    }
}

/**
 * @event Triggered when a panorama image starts loading
 */
export class PanoramaLoadEvent extends ViewerEvent {
    static override readonly type = 'panorama-load';
    override type: 'panorama-load';

    /** @internal */
    constructor(public readonly panorama: any) {
        super(PanoramaLoadEvent.type);
    }
}

/**
 * @event Triggered when a panorama image has been loaded
 */
export class PanoramaLoadedEvent extends ViewerEvent {
    static override readonly type = 'panorama-loaded';
    override type: 'panorama-loaded';

    /** @internal */
    constructor(public readonly data: TextureData) {
        super(PanoramaLoadedEvent.type);
    }
}

/**
 * @event Triggered when an error occured when loading the panorama
 */
export class PanoramaErrorEvent extends ViewerEvent {
    static override readonly type = 'panorama-error';
    override type: 'panorama-error';

    /** @internal */
    constructor(
        public readonly panorama: any,
        public readonly error: Error,
    ) {
        super(PanoramaErrorEvent.type);
    }
}

/**
 * @event Triggered when the transition to a new panorama is done (complete or not)
 */
export class TransitionDoneEvent extends ViewerEvent {
    static override readonly type = 'transition-done';
    override type: 'transition-done';

    /** @internal */
    constructor(public readonly completed: boolean) {
        super(TransitionDoneEvent.type);
    }
}

/**
 * @event Triggered when the view angles change
 */
export class PositionUpdatedEvent extends ViewerEvent {
    static override readonly type = 'position-updated';
    override type: 'position-updated';

    /** @internal */
    constructor(public readonly position: Position) {
        super(PositionUpdatedEvent.type);
    }
}

/**
 * @event Triggered when camera roll change
 */
export class RollUpdatedEvent extends ViewerEvent {
    static override readonly type = 'roll-updated';
    override type: 'roll-updated';

    /** @internal */
    constructor(public readonly roll: number) {
        super(RollUpdatedEvent.type);
    }
}

/**
 * @event Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
 */
export class ReadyEvent extends ViewerEvent {
    static override readonly type = 'ready';
    override type: 'ready';

    /** @internal */
    constructor() {
        super(ReadyEvent.type);
    }
}

/**
 * @event Triggered on each viewer render
 */
export class RenderEvent extends ViewerEvent {
    static override readonly type = 'render';
    override type: 'render';

    /** @internal */
    constructor() {
        super(RenderEvent.type);
    }
}

/**
 * @event Triggered when the notification is shown
 */
export class ShowNotificationEvent extends ViewerEvent {
    static override readonly type = 'show-notification';
    override type: 'show-notification';

    /** @internal */
    constructor(public readonly notificationId?: string) {
        super(ShowNotificationEvent.type);
    }
}

/**
 * @event Triggered when the overlay is shown
 */
export class ShowOverlayEvent extends ViewerEvent {
    static override readonly type = 'show-overlay';
    override type: 'show-overlay';

    /** @internal */
    constructor(public readonly overlayId?: string) {
        super(ShowOverlayEvent.type);
    }
}

/**
 * @event Triggered when the panel is shown
 */
export class ShowPanelEvent extends ViewerEvent {
    static override readonly type = 'show-panel';
    override type: 'show-panel';

    /** @internal */
    constructor(public readonly panelId?: string) {
        super(ShowPanelEvent.type);
    }
}

/**
 * @event Triggered when a tooltip is shown
 */
export class ShowTooltipEvent extends ViewerEvent {
    static override readonly type = 'show-tooltip';
    override type: 'show-tooltip';

    /** @internal */
    constructor(
        /** Instance of the tooltip */
        public readonly tooltip: Tooltip,
        /** Userdata associated to the tooltip */
        public readonly tooltipData?: TooltipConfig['data'],
    ) {
        super(ShowTooltipEvent.type);
    }
}

/**
 * @event Triggered when the viewer size changes
 */
export class SizeUpdatedEvent extends ViewerEvent {
    static override readonly type = 'size-updated';
    override type: 'size-updated';

    /** @internal */
    constructor(public readonly size: Size) {
        super(SizeUpdatedEvent.type);
    }
}

/**
 * @event Triggered when all current animations are stopped
 */
export class StopAllEvent extends ViewerEvent {
    static override readonly type = 'stop-all';
    override type: 'stop-all';

    /** @internal */
    constructor() {
        super(StopAllEvent.type);
    }
}

/**
 * @event Triggered when the viewer zoom changes
 */
export class ZoomUpdatedEvent extends ViewerEvent {
    static override readonly type = 'zoom-updated';
    override type: 'zoom-updated';

    /** @internal */
    constructor(public readonly zoomLevel: number) {
        super(ZoomUpdatedEvent.type);
    }
}

/**
 * Base class for events on three.js objects
 *
 * Note: {@link Viewer#observeObjects} must be called for these events to be dispatched
 */
export abstract class ObjectEvent extends ViewerEvent {
    /** @internal */
    constructor(
        type: string,
        public readonly originalEvent: MouseEvent,
        public readonly object: Mesh<any, any>,
        public readonly viewerPoint: Point,
        public readonly userDataKey: string,
    ) {
        super(type);
    }
}

/**
 * @event Triggered when the cursor enters an object in the scene
 *
 * Note: {@link Viewer#observeObjects} must be called for this event to be dispatched
 */
export class ObjectEnterEvent extends ObjectEvent {
    static override readonly type = 'enter-object';
    override type: 'enter-object';

    /** @internal */
    constructor(originalEvent: MouseEvent, object: Mesh, viewerPoint: Point, userDataKey: string) {
        super(ObjectEnterEvent.type, originalEvent, object, viewerPoint, userDataKey);
    }
}

/**
 * @event Triggered when the cursor leaves an object in the scene
 *
 * Note: {@link Viewer#observeObjects} must be called for this event to be dispatched
 */
export class ObjectLeaveEvent extends ObjectEvent {
    static override readonly type = 'leave-object';
    override type: 'leave-object';

    /** @internal */
    constructor(originalEvent: MouseEvent, object: Mesh, viewerPoint: Point, userDataKey: string) {
        super(ObjectLeaveEvent.type, originalEvent, object, viewerPoint, userDataKey);
    }
}

/**
 * @event Triggered when the cursor moves over an object in the scene
 *
 * Note: {@link Viewer#observeObjects} must be called for this event to be dispatched
 */
export class ObjectHoverEvent extends ObjectEvent {
    static override readonly type = 'hover-object';
    override type: 'hover-object';

    /** @internal */
    constructor(originalEvent: MouseEvent, object: Mesh, viewerPoint: Point, userDataKey: string) {
        super(ObjectHoverEvent.type, originalEvent, object, viewerPoint, userDataKey);
    }
}

export type ViewerEvents =
    | BeforeAnimateEvent
    | BeforeRenderEvent
    | BeforeRotateEvent
    | ClickEvent
    | ConfigChangedEvent
    | DoubleClickEvent
    | FullscreenEvent
    | HideNotificationEvent
    | HideOverlayEvent
    | HidePanelEvent
    | HideTooltipEvent
    | KeypressEvent
    | LoadProgressEvent
    | PanoramaLoadEvent
    | PanoramaLoadedEvent
    | PanoramaErrorEvent
    | TransitionDoneEvent
    | PositionUpdatedEvent
    | RollUpdatedEvent
    | ReadyEvent
    | RenderEvent
    | ShowNotificationEvent
    | ShowOverlayEvent
    | ShowPanelEvent
    | ShowTooltipEvent
    | SizeUpdatedEvent
    | StopAllEvent
    | ZoomUpdatedEvent
    | ObjectEnterEvent
    | ObjectLeaveEvent
    | ObjectHoverEvent;
