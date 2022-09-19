import { EASINGS } from '../data/constants';
import { each } from './misc';

/**
 * @callback OnTick
 * @summary Function called for each animation frame with computed properties
 * @memberOf PSV.utils.Animation
 * @param {Object.<string, number>} properties - current values
 * @param {float} progress - 0 to 1
 */

/**
 * @summary Interpolation helper for animations
 * @memberOf PSV.utils
 * @description
 * Implements the Promise API with an additional "cancel" method.
 * The promise is resolved with `true` when the animation is completed and `false` if the animation is cancelled.
 * @example
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
 * anim.cancel()
 */
export class Animation {

  /**
   * @param {Object} options
   * @param {Object.<string, Object>} options.properties
   * @param {number} options.properties[].start
   * @param {number} options.properties[].end
   * @param {number} options.duration
   * @param {number} [options.delay=0]
   * @param {string} [options.easing='linear']
   * @param {PSV.utils.Animation.OnTick} options.onTick - called on each frame
   */
  constructor(options) {
    this.__callbacks = [];

    if (options) {
      if (!options.easing || typeof options.easing === 'string') {
        options.easing = EASINGS[options.easing || 'linear'];
      }

      this.__start = null;
      this.options = options;

      if (options.delay) {
        this.__delayTimeout = setTimeout(() => {
          this.__delayTimeout = null;
          this.__animationFrame = window.requestAnimationFrame(t => this.__run(t));
        }, options.delay);
      }
      else {
        this.__animationFrame = window.requestAnimationFrame(t => this.__run(t));
      }
    }
    else {
      this.__resolved = true;
    }
  }

  /**
   * @summary Main loop for the animation
   * @param {number} timestamp
   * @private
   */
  __run(timestamp) {
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

      this.__animationFrame = window.requestAnimationFrame(t => this.__run(t));
    }
    else {
      // call onTick one last time with final values
      each(this.options.properties, (prop, name) => {
        if (prop) {
          current[name] = prop.end;
        }
      });
      this.options.onTick(current, 1.0);

      this.__animationFrame = window.requestAnimationFrame(() => {
        this.__resolved = true;
        this.__resolve(true);
      });
    }
  }

  /**
   * @private
   */
  __resolve(value) {
    this.__callbacks.forEach(cb => cb(value));
    this.__callbacks.length = 0;
  }

  /**
   * @summary Promise chaining
   * @param {Function} [onFulfilled] - Called when the animation is complete (true) or cancelled (false)
   * @returns {Promise}
   */
  then(onFulfilled) {
    if (this.__resolved || this.__cancelled) {
      return Promise.resolve(this.__resolved)
        .then(onFulfilled);
    }

    return new Promise((resolve) => {
      this.__callbacks.push(resolve);
    })
      .then(onFulfilled);
  }

  /**
   * @summary Cancels the animation
   */
  cancel() {
    if (!this.__cancelled && !this.__resolved) {
      this.__cancelled = true;
      this.__resolve(false);

      if (this.__delayTimeout) {
        window.clearTimeout(this.__delayTimeout);
        this.__delayTimeout = null;
      }
      if (this.__animationFrame) {
        window.cancelAnimationFrame(this.__animationFrame);
        this.__animationFrame = null;
      }
    }
  }

}
