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
 * @param {Object} options
 * @param {Object[]} options.properties
 * @param {number} options.properties[].start
 * @param {number} options.properties[].end
 * @param {int} options.duration
 * @param {int} [options.delay=0]
 * @param {string} [options.easing='linear']
 * @param {PSVAnimation.OnTick} options.onTick - called on each frame
 * @constructor
 */
function PSVAnimation(options) {
  if (!(this instanceof PSVAnimation)) {
    return new PSVAnimation(options);
  }

  this._cancelled = false;
  this._resolved = false;

  var self = this;

  this._promise = new Promise(function(resolve, reject) {
    self._resolve = resolve;
    self._reject = reject;
  });

  if (options) {
    if (!options.easing || typeof options.easing === 'string') {
      options.easing = PSVAnimation.easings[options.easing || 'linear'];
    }
    this._start = null;
    this._options = options;

    if (options.delay) {
      this._delayTimeout = window.setTimeout(function() {
        this._delayTimeout = null;
        window.requestAnimationFrame(this._run.bind(this));
      }.bind(this), options.delay);
    }
    else {
      window.requestAnimationFrame(this._run.bind(this));
    }
  }
}

/**
 * @summary Collection of easing functions
 * {@link https://gist.github.com/frederickk/6165768}
 * @type {Object.<string, Function>}
 */
// @formatter:off
// jscs:disable
/* jshint ignore:start */
PSVAnimation.easings = {
  linear: function(t) { return t; },

  inQuad: function(t) { return t*t; },
  outQuad: function(t) { return t*(2-t); },
  inOutQuad: function(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },

  inCubic: function(t) { return t*t*t; },
  outCubic: function(t) { return (--t)*t*t+1; },
  inOutCubic: function(t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

  inQuart: function(t) { return t*t*t*t; },
  outQuart: function(t) { return 1-(--t)*t*t*t; },
  inOutQuart: function(t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },

  inQuint: function(t) { return t*t*t*t*t; },
  outQuint: function(t) { return 1+(--t)*t*t*t*t; },
  inOutQuint: function(t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; },

  inSine: function(t) { return 1-Math.cos(t*(Math.PI/2)); },
  outSine: function(t) { return Math.sin(t*(Math.PI/2)); },
  inOutSine: function(t) { return .5-.5*Math.cos(Math.PI*t); },

  inExpo: function(t) { return Math.pow(2, 10*(t-1)); },
  outExpo: function(t) { return 1-Math.pow(2, -10*t); },
  inOutExpo: function(t) { t=t*2-1; return t<0 ? .5*Math.pow(2, 10*t) : 1-.5*Math.pow(2, -10*t); },

  inCirc: function(t) { return 1-Math.sqrt(1-t*t); },
  outCirc: function(t) { t--; return Math.sqrt(1-t*t); },
  inOutCirc: function(t) { t*=2; return t<1 ? .5-.5*Math.sqrt(1-t*t) : .5+.5*Math.sqrt(1-(t-=2)*t); }
};
/* jshint ignore:end */
// jscs:enable
// @formatter:on

/**
 * @summary Main loop for the animation
 * @param {int} timestamp
 * @private
 */
PSVAnimation.prototype._run = function(timestamp) {
  // the animation has been cancelled
  if (this._cancelled) {
    return;
  }

  // first iteration
  if (this._start === null) {
    this._start = timestamp;
  }

  // compute progress
  var progress = (timestamp - this._start) / this._options.duration;
  var current = {};
  var name;

  if (progress < 1.0) {
    // interpolate properties
    for (name in this._options.properties) {
      if (this._options.properties[name]) {
        current[name] = this._options.properties[name].start + (this._options.properties[name].end - this._options.properties[name].start) * this._options.easing(progress);
      }
    }

    this._options.onTick(current, progress);

    window.requestAnimationFrame(this._run.bind(this));
  }
  else {
    // call onTick one last time with final values
    for (name in this._options.properties) {
      if (this._options.properties[name]) {
        current[name] = this._options.properties[name].end;
      }
    }

    this._options.onTick(current, 1.0);

    window.requestAnimationFrame(function() {
      this._resolved = true;
      this._resolve();
    }.bind(this));
  }
};

/**
 * @summary Animation chaining
 * @param {function} onFulfilled - Called when the animation is complete, can return a new animation
 * @param {function} onRejected - Called when the animation is cancelled
 * @returns {PSVAnimation}
 */
PSVAnimation.prototype.then = function(onFulfilled, onRejected) {
  var p = new PSVAnimation();

  // Allow cancellation to climb up the promise chain
  p._promise.then(null, this.cancel.bind(this));

  this._promise.then(function() {
    p._resolve(onFulfilled ? onFulfilled() : undefined);
  }, function() {
    p._reject(onRejected ? onRejected() : undefined);
  });

  return p;
};

/**
 * @summary Alias to `.then(null, onRejected)`
 * @param {function} onRejected - Called when the animation has been cancelled
 * @returns {PSVAnimation}
 */
PSVAnimation.prototype.catch = function(onRejected) {
  return this.then(undefined, onRejected);
};

/**
 * @summary Alias to `.then(onFinally, onFinally)`
 * @param {function} onFinally - Called when the animation is either complete or cancelled
 * @returns {PSVAnimation}
 */
PSVAnimation.prototype.finally = function(onFinally) {
  return this.then(onFinally, onFinally);
};

/**
 * @summary Cancels the animation
 */
PSVAnimation.prototype.cancel = function() {
  if (!this._cancelled && !this._resolved) {
    this._cancelled = true;
    this._reject();

    if (this._delayTimeout) {
      window.cancelAnimationFrame(this._delayTimeout);
      this._delayTimeout = null;
    }
  }
};
