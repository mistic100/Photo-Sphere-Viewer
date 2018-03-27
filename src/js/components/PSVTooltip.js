/**
 * Tooltip class
 * @param {module:components.PSVHUD} hud
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVTooltip(hud) {
  PSVComponent.call(this, hud);

  /**
   * @member {Object}
   * @readonly
   * @private
   */
  this.config = this.psv.config.tooltip;

  /**
   * @member {Object}
   * @private
   */
  this.prop = {
    timeout: null
  };

  this.create();
}

PSVTooltip.prototype = Object.create(PSVComponent.prototype);
PSVTooltip.prototype.constructor = PSVTooltip;

PSVTooltip.className = 'psv-tooltip';
PSVTooltip.publicMethods = ['showTooltip', 'hideTooltip', 'isTooltipVisible'];

PSVTooltip.leftMap = { 0: 'left', 0.5: 'center', 1: 'right' };
PSVTooltip.topMap = { 0: 'top', 0.5: 'center', 1: 'bottom' };

/**
 * @override
 */
PSVTooltip.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.innerHTML = '<div class="psv-tooltip-arrow"></div><div class="psv-tooltip-content"></div>';
  this.container.style.top = '-1000px';
  this.container.style.left = '-1000px';

  this.content = this.container.querySelector('.psv-tooltip-content');
  this.arrow = this.container.querySelector('.psv-tooltip-arrow');

  this.psv.on('render', this);
};

/**
 * @override
 */
PSVTooltip.prototype.destroy = function() {
  this.psv.off('render', this);

  delete this.config;
  delete this.prop;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVTooltip.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'render': this.hideTooltip(); break;
    // @formatter:on
  }
};

/**
 * @summary Checks if the tooltip is visible
 * @returns {boolean}
 */
PSVTooltip.prototype.isTooltipVisible = function() {
  return this.container.classList.contains('psv-tooltip--visible');
};

/**
 * @summary Displays a tooltip on the viewer
 * @param {Object} config
 * @param {string} config.content - HTML content of the tootlip
 * @param {int} config.top - Position of the tip of the arrow of the tooltip, in pixels
 * @param {int} config.left - Position of the tip of the arrow of the tooltip, in pixels
 * @param {string} [config.position='top center'] - Tooltip position toward it's arrow tip.
 *                                                  Accepted values are combinations of `top`, `center`, `bottom`
 *                                                  and `left`, `center`, `right`
 * @param {string} [config.className] - Additional CSS class added to the tooltip
 * @param {Object} [config.box] - Used when displaying a tooltip on a marker
 * @param {int} [config.box.width=0]
 * @param {int} [config.box.height=0]
 * @fires module:components.PSVTooltip.show-tooltip
 * @throws {PSVError} when the configuration is incorrect
 *
 * @example
 * viewer.showTooltip({ content: 'Hello world', top: 200, left: 450, position: 'center bottom'})
 */
PSVTooltip.prototype.showTooltip = function(config) {
  if (this.prop.timeout) {
    window.clearTimeout(this.prop.timeout);
    this.prop.timeout = null;
  }

  var isUpdate = this.isTooltipVisible();
  var t = this.container;
  var c = this.content;
  var a = this.arrow;

  if (!config.position) {
    config.position = ['top', 'center'];
  }

  if (!config.box) {
    config.box = {
      width: 0,
      height: 0
    };
  }

  // parse position
  if (typeof config.position === 'string') {
    var tempPos = PSVUtils.parsePosition(config.position);

    if (!(tempPos.left in PSVTooltip.leftMap) || !(tempPos.top in PSVTooltip.topMap)) {
      throw new PSVError('unable to parse tooltip position "' + config.position + '"');
    }

    config.position = [PSVTooltip.topMap[tempPos.top], PSVTooltip.leftMap[tempPos.left]];
  }

  if (config.position[0] === 'center' && config.position[1] === 'center') {
    throw new PSVError('unable to parse tooltip position "center center"');
  }

  if (isUpdate) {
    // Remove every other classes (Firefox does not implements forEach)
    for (var i = t.classList.length - 1; i >= 0; i--) {
      var item = t.classList.item(i);
      if (item !== 'psv-tooltip' && item !== 'psv-tooltip--visible') {
        t.classList.remove(item);
      }
    }
  }
  else {
    t.className = 'psv-tooltip'; // reset the class
  }

  if (config.className) {
    PSVUtils.addClasses(t, config.className);
  }

  c.innerHTML = config.content;
  t.style.top = '0px';
  t.style.left = '0px';

  // compute size
  var rect = t.getBoundingClientRect();
  var style = {
    posClass: config.position.slice(),
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    top: 0,
    left: 0,
    arrow_top: 0,
    arrow_left: 0
  };

  // set initial position
  this._computeTooltipPosition(style, config);

  // correct position if overflow
  var refresh = false;
  if (style.top < this.config.offset) {
    style.posClass[0] = 'bottom';
    refresh = true;
  }
  else if (style.top + style.height > this.psv.prop.size.height - this.config.offset) {
    style.posClass[0] = 'top';
    refresh = true;
  }
  if (style.left < this.config.offset) {
    style.posClass[1] = 'right';
    refresh = true;
  }
  else if (style.left + style.width > this.psv.prop.size.width - this.config.offset) {
    style.posClass[1] = 'left';
    refresh = true;
  }
  if (refresh) {
    this._computeTooltipPosition(style, config);
  }

  // apply position
  t.style.top = style.top + 'px';
  t.style.left = style.left + 'px';

  a.style.top = style.arrow_top + 'px';
  a.style.left = style.arrow_left + 'px';

  t.classList.add('psv-tooltip--' + style.posClass.join('-'));

  // delay for correct transition between the two classes
  if (!isUpdate) {
    this.prop.timeout = window.setTimeout(function() {
      t.classList.add('psv-tooltip--visible');
      this.prop.timeout = null;

      /**
       * @event show-tooltip
       * @memberof module:components.PSVTooltip
       * @summary Trigered when the tooltip is shown
       */
      this.psv.trigger('show-tooltip');
    }.bind(this), this.config.delay);
  }
};

/**
 * @summary Hides the tooltip
 * @fires module:components.PSVTooltip.hide-tooltip
 */
PSVTooltip.prototype.hideTooltip = function() {
  if (this.prop.timeout) {
    window.clearTimeout(this.prop.timeout);
    this.prop.timeout = null;
  }

  if (this.isTooltipVisible()) {
    this.container.classList.remove('psv-tooltip--visible');

    this.prop.timeout = window.setTimeout(function() {
      this.content.innerHTML = null;
      this.container.style.top = '-1000px';
      this.container.style.left = '-1000px';
      this.prop.timeout = null;
    }.bind(this), this.config.delay);

    /**
     * @event hide-tooltip
     * @memberof module:components.PSVTooltip
     * @summary Trigered when the tooltip is hidden
     */
    this.psv.trigger('hide-tooltip');
  }
};

/**
 * @summary Computes the position of the tooltip and its arrow
 * @param {Object} style
 * @param {Object} config
 * @private
 */
PSVTooltip.prototype._computeTooltipPosition = function(style, config) {
  var topBottom = false;

  switch (style.posClass[0]) {
    case 'bottom':
      style.top = config.top + config.box.height + this.config.offset + this.config.arrow_size;
      style.arrow_top = -this.config.arrow_size * 2;
      topBottom = true;
      break;

    case 'center':
      style.top = config.top + config.box.height / 2 - style.height / 2;
      style.arrow_top = style.height / 2 - this.config.arrow_size;
      break;

    case 'top':
      style.top = config.top - style.height - this.config.offset - this.config.arrow_size;
      style.arrow_top = style.height;
      topBottom = true;
      break;
  }

  switch (style.posClass[1]) {
    case 'right':
      if (topBottom) {
        style.left = config.left + config.box.width / 2 - this.config.offset - this.config.arrow_size;
        style.arrow_left = this.config.offset;
      }
      else {
        style.left = config.left + config.box.width + this.config.offset + this.config.arrow_size;
        style.arrow_left = -this.config.arrow_size * 2;
      }
      break;

    case 'center':
      style.left = config.left + config.box.width / 2 - style.width / 2;
      style.arrow_left = style.width / 2 - this.config.arrow_size;
      break;

    case 'left':
      if (topBottom) {
        style.left = config.left - style.width + config.box.width / 2 + this.config.offset + this.config.arrow_size;
        style.arrow_left = style.width - this.config.offset - this.config.arrow_size * 2;
      }
      else {
        style.left = config.left - style.width - this.config.offset - this.config.arrow_size;
        style.arrow_left = style.width;
      }
      break;
  }
};
