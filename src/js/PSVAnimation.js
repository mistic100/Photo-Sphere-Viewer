import { EASINGS } from './data/constants';
import { each } from './utils';

/**
 * @callback OnTick
 * @memberOf PSVAnimation
 * @param {Object[]} properties - current values
 * @param {float} progress - 0 to 1
 */

/**
 * @summary Interpolation helper for animations
 * @description
 * Implements the Promise API with an additional "cancel" method.
 * The promise is resolved when the animation is complete and rejected if the animation is cancelled.
 * @example
 * new PSVAnimation({
 *     properties: {
 *         width: {start: 100, end: 200}
 *     },
 *     duration: 5000,
 *     onTick: (properties) => element.style.width = `${properties.width}px`;
 * })
 */
class PSVAnimation {

  /**
   * @param {Object} options
   * @param {Object[]} options.properties
   * @param {number} options.properties[].start
   * @param {number} options.properties[].end
   * @param {number} options.duration
   * @param {number} [options.delay=0]
   * @param {string} [options.easing='linear']
   * @param {PSVAnimation.OnTick} options.onTick - called on each frame
   */
  constructor(options) {
    this.__cancelled = false;
    this.__resolved = false;

    this.__promise = new Promise((resolve, reject) => {
      this.__resolve = resolve;
      this.__reject = reject;
    });

    if (options) {
      if (!options.easing || typeof options.easing === 'string') {
        options.easing = EASINGS[options.easing || 'linear'];
      }
      this.__start = null;
      this.options = options;

      if (options.delay) {
        this.__delayTimeout = setTimeout(() => {
          this.__delayTimeout = null;
          window.requestAnimationFrame(t => this.__run(t));
        }, options.delay);
      }
      else {
        window.requestAnimationFrame(t => this.__run(t));
      }
    }
  }

  /**
   * @summary Main loop for the animation
   * @param {number} timestamp
   * @private
   */
  __run(timestamp) {
    // the animation has been cancelled
    if (this.__cancelled) {
      return;
    }

    // first iteration
    if (this.__start === null) {
      this.__start = timestamp;
    }

    // compute progress
    const progress = (timestamp - this.__start) / this.options.duration;
    const current = {};

    if (progress < 1.0) {
      // interpolate properties
      each(this.options.properties, (prop, name) => {
        if (prop) {
          current[name] = prop.start + (prop.end - prop.start) * this.options.easing(progress);
        }
      });

      this.options.onTick(current, progress);

      window.requestAnimationFrame(t => this.__run(t));
    }
    else {
      // call onTick one last time with final values
      each(this.options.properties, (prop, name) => {
        if (prop) {
          current[name] = prop.end;
        }
      });

      this.options.onTick(current, 1.0);

      window.requestAnimationFrame(() => {
        this.__resolved = true;
        this.__resolve();
      });
    }
  }

  /**
   * @summary Animation chaining
   * @param {Function} [onFulfilled] - Called when the animation is complete, can return a new animation
   * @param {Function} [onRejected] - Called when the animation is cancelled
   * @returns {PSVAnimation}
   */
  then(onFulfilled = null, onRejected = null) {
    const p = new PSVAnimation();

    // Allow cancellation to climb up the promise chain
    p.__promise.then(null, () => this.cancel());

    this.__promise.then(
      () => p.__resolve(onFulfilled ? onFulfilled() : undefined),
      () => p.__reject(onRejected ? onRejected() : undefined)
    );

    return p;
  }

  /**
   * @summary Alias to `.then(null, onRejected)`
   * @param {Function} onRejected - Called when the animation has been cancelled
   * @returns {PSVAnimation}
   */
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  /**
   * @summary Alias to `.then(onFinally, onFinally)`
   * @param {Function} onFinally - Called when the animation is either complete or cancelled
   * @returns {PSVAnimation}
   */
  finally(onFinally) {
    return this.then(onFinally, onFinally);
  }

  /**
   * @summary Cancels the animation
   */
  cancel() {
    if (!this.__cancelled && !this.__resolved) {
      this.__cancelled = true;
      this.__reject();

      if (this.__delayTimeout) {
        window.cancelAnimationFrame(this.__delayTimeout);
        this.__delayTimeout = null;
      }
    }
  }

  /**
   * @summary Returns a resolved animation promise
   * @returns {PSVAnimation}
   */
  static resolve() {
    const p = Promise.resolve();
    p.cancel = () => {
    };
    return p;
  }

}

export { PSVAnimation };
