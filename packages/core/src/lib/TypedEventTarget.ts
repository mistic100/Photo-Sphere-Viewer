/**
 * Base class for events dispatched by {@link TypedEventTarget}
 * @template TTarget type of the event target
 */
export abstract class TypedEvent<TTarget extends TypedEventTarget<any>> extends Event {
    static readonly type: string;

    override target: TTarget;

    constructor(type: string, cancelable = false) {
        super(type, { cancelable });
    }
}

/**
 * Decorator for EventTarget allowing to strongly type events and listeners
 * @see https://rjzaworski.com/2021/06/event-target-with-typescript
 * @template TEvents union of dispatched events
 */
export class TypedEventTarget<TEvents extends TypedEvent<any>> extends EventTarget {
    override dispatchEvent(e: TEvents): boolean {
        return super.dispatchEvent(e);
    }

    /**
     * @template T the name of event
     * @template E the class of the event
     */
    override addEventListener<T extends TEvents['type'], E extends TEvents & { type: T }>(
        type: T,
        callback: ((e: E) => void) | EventListenerObject | null,
        options?: AddEventListenerOptions | boolean
    ) {
        super.addEventListener(type, callback as any, options);
    }

    /**
     * @template T the name of event
     * @template E the class of the event
     */
    override removeEventListener<T extends TEvents['type'], E extends TEvents & { type: T }>(
        type: TEvents['type'],
        callback: ((e: E) => void) | EventListenerObject | null,
        options?: EventListenerOptions | boolean
    ) {
        super.removeEventListener(type, callback as any, options);
    }
}
