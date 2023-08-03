import { TypedEvent } from '@photo-sphere-viewer/core';
import type { Marker } from './Marker';
import type { MarkersPlugin } from './MarkersPlugin';

/**
 * Base class for events dispatched by {@link MarkersPlugin}
 */
export abstract class MarkersPluginEvent extends TypedEvent<MarkersPlugin> {}

/**
 * @event Triggered when the visibility of a marker changes
 */
export class MarkerVisibilityEvent extends MarkersPluginEvent {
    static override readonly type = 'marker-visibility';
    override type: 'marker-visibility';

    constructor(
        public readonly marker: Marker,
        public readonly visible: boolean
    ) {
        super(MarkerVisibilityEvent.type);
    }
}

/**
 * @event Triggered when the animation to a marker is done
 */
export class GotoMarkerDoneEvent extends MarkersPluginEvent {
    static override readonly type = 'goto-marker-done';
    override type: 'goto-marker-done';

    constructor(public readonly marker: Marker) {
        super(GotoMarkerDoneEvent.type);
    }
}

/**
 * @event Triggered when the user puts the cursor away from a marker
 */
export class LeaveMarkerEvent extends MarkersPluginEvent {
    static override readonly type = 'leave-marker';
    override type: 'leave-marker';

    constructor(public readonly marker: Marker) {
        super(LeaveMarkerEvent.type);
    }
}

/**
 * @event Triggered when the user puts the cursor hover a marker
 */
export class EnterMarkerEvent extends MarkersPluginEvent {
    static override readonly type = 'enter-marker';
    override type: 'enter-marker';

    constructor(public readonly marker: Marker) {
        super(EnterMarkerEvent.type);
    }
}

/**
 * @event Triggered when the user clicks on a marker
 */
export class SelectMarkerEvent extends MarkersPluginEvent {
    static override readonly type = 'select-marker';
    override type: 'select-marker';

    constructor(
        public readonly marker: Marker,
        public readonly doubleClick: boolean,
        public readonly rightClick: boolean
    ) {
        super(SelectMarkerEvent.type);
    }
}

/**
 * @event Triggered when a marker is selected from the side panel
 */
export class SelectMarkerListEvent extends MarkersPluginEvent {
    static override readonly type = 'select-marker-list';
    override type: 'select-marker-list';

    constructor(public readonly marker: Marker) {
        super(SelectMarkerListEvent.type);
    }
}

/**
 * @event Triggered when a marker was selected and the user clicks elsewhere
 */
export class UnselectMarkerEvent extends MarkersPluginEvent {
    static override readonly type = 'unselect-marker';
    override type: 'unselect-marker';

    constructor(public readonly marker: Marker) {
        super(UnselectMarkerEvent.type);
    }
}

/**
 * @event Triggered when the markers are hidden
 */
export class HideMarkersEvent extends MarkersPluginEvent {
    static override readonly type = 'hide-markers';
    override type: 'hide-markers';

    constructor() {
        super(HideMarkersEvent.type);
    }
}

/**
 * @event Triggered when the markers change
 */
export class SetMarkersEvent extends MarkersPluginEvent {
    static override readonly type = 'set-markers';
    override type: 'set-markers';

    constructor(public readonly markers: Marker[]) {
        super(SetMarkersEvent.type);
    }
}

/**
 * @event Triggered when the markers are shown
 */
export class ShowMarkersEvent extends MarkersPluginEvent {
    static override readonly type = 'show-markers';
    override type: 'show-markers';

    constructor() {
        super(ShowMarkersEvent.type);
    }
}

/**
 * @event Used to alter the list of markers displayed in the side-panel
 */
export class RenderMarkersListEvent extends MarkersPluginEvent {
    static override readonly type = 'render-markers-list';
    override type: 'render-markers-list';

    constructor(
        /** the list of markers to display, can be modified */
        public markers: Marker[]
    ) {
        super(RenderMarkersListEvent.type);
    }
}

export type MarkersPluginEvents =
    | MarkerVisibilityEvent
    | GotoMarkerDoneEvent
    | LeaveMarkerEvent
    | EnterMarkerEvent
    | SelectMarkerEvent
    | SelectMarkerListEvent
    | UnselectMarkerEvent
    | HideMarkersEvent
    | SetMarkersEvent
    | ShowMarkersEvent
    | RenderMarkersListEvent;
