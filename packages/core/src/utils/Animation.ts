import { EASINGS } from '../data/constants';

/**
 * Options for {@link Animation}
 */
export type AnimationOptions<T> = {
    /**
     * interpolated properties
     */
    properties: Partial<Record<keyof T, { start: number; end: number }>>;
    /**
     * duration of the animation
     */
    duration: number;
    /**
     * delay before start
     * @default 0
     */
    delay?: number;
    /**
     * interpoaltion function, see {@link CONSTANTS.EASINGS}
     * @default 'linear'
     */
    easing?: string | ((t: number) => number);
    /**
     * function called for each frame
     */
    onTick: (properties: Record<keyof T, number>, progress: number) => void;
};

type PropertyValues = AnimationOptions<any>['properties']['k'];

/**
 * @summary Interpolation helper for animations
 * @description
 * Implements the Promise API with an additional "cancel" method.
 * The promise is resolved with `true` when the animation is completed and `false` if the animation is cancelled.
 * @template T the type of interpoalted properties
 *
 * @example
 * ```ts
 * const anim = new Animation({
 *     properties: {
 *         width: {start: 100, end: 200}
 *     },
 *     duration: 5000,
 *     onTick: (properties) => element.style.width = `${properties.width}px`;
 * });
 *
 * anim.then((completed) => ...);
 *
 * anim.cancel();
 * ```
 */
export class Animation<T = any> implements PromiseLike<boolean> {
    private options: AnimationOptions<T>;
    private easing: (t: number) => number = EASINGS['linear'];
    private callbacks: Array<(complete: boolean) => void> = [];
    private start?: number;
    private delayTimeout: ReturnType<typeof setTimeout>;
    private animationFrame: ReturnType<typeof requestAnimationFrame>;

    resolved = false;
    cancelled = false;

    constructor(options: AnimationOptions<T>) {
        this.options = options;

        if (options) {
            if (options.easing) {
                this.easing =
                    typeof options.easing === 'function'
                        ? options.easing
                        : EASINGS[options.easing] || EASINGS['linear'];
            }

            this.delayTimeout = setTimeout(() => {
                this.delayTimeout = undefined;
                this.animationFrame = window.requestAnimationFrame((t) => this.__run(t));
            }, options.delay || 0);
        } else {
            this.resolved = true;
        }
    }

    private __run(timestamp: number) {
        if (this.cancelled) {
            return;
        }

        // first iteration
        if (!this.start) {
            this.start = timestamp;
        }

        // compute progress
        const progress = (timestamp - this.start) / this.options.duration;
        const current = {} as Record<keyof T, number>;

        if (progress < 1.0) {
            // interpolate properties
            for (const [name, prop] of Object.entries(this.options.properties) as Array<[string, PropertyValues]>) {
                if (prop) {
                    const value = prop.start + (prop.end - prop.start) * this.easing(progress);
                    // @ts-ignore
                    current[name] = value;
                }
            }
            this.options.onTick(current, progress);

            this.animationFrame = window.requestAnimationFrame((t) => this.__run(t));
        } else {
            // call onTick one last time with final values
            for (const [name, prop] of Object.entries(this.options.properties) as Array<[string, PropertyValues]>) {
                if (prop) {
                    // @ts-ignore
                    current[name] = prop.end;
                }
            }
            this.options.onTick(current, 1.0);

            this.__resolve(true);
            this.animationFrame = undefined;
        }
    }

    private __resolve(value: boolean) {
        if (value) {
            this.resolved = true;
        } else {
            this.cancelled = true;
        }
        this.callbacks.forEach((cb) => cb(value));
        this.callbacks.length = 0;
    }

    /**
     * Promise chaining
     * @param [onFulfilled] - Called when the animation is complete (true) or cancelled (false)
     */
    then<U>(onFulfilled: (complete: boolean) => PromiseLike<U> | U): Promise<U> {
        if (this.resolved || this.cancelled) {
            return Promise.resolve(this.resolved).then(onFulfilled);
        }

        return new Promise((resolve: (complete: boolean) => void) => {
            this.callbacks.push(resolve);
        }).then(onFulfilled);
    }

    /**
     * Cancels the animation
     */
    cancel() {
        if (!this.cancelled && !this.resolved) {
            this.__resolve(false);

            if (this.delayTimeout) {
                window.clearTimeout(this.delayTimeout);
                this.delayTimeout = undefined;
            }
            if (this.animationFrame) {
                window.cancelAnimationFrame(this.animationFrame);
                this.animationFrame = undefined;
            }
        }
    }
}
