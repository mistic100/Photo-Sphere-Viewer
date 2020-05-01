import { EVENTS } from '../data/constants';
import { PSVError } from '../PSVError';
import { addClasses, parsePosition } from '../utils';
import { AbstractComponent } from './AbstractComponent';

import '../styles/tooltip.scss';

const LEFT_MAP = { 0: 'left', 0.5: 'center', 1: 'right' };
const TOP_MAP = { 0: 'top', 0.5: 'center', 1: 'bottom' };
const STATE = { NONE: 0, SHOWING: 1, HIDING: 2, READY: 3 };

/**
 * @typedef {Object} PSV.components.Tooltip.Position
 * @summary Object defining the tooltip position
 * @property {number} top - Position of the tip of the arrow of the tooltip, in pixels
 * @property {number} left - Position of the tip of the arrow of the tooltip, in pixels
 * @property {string|string[]} [position='top center'] - Tooltip position toward it's arrow tip.
 *           Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`
 * @property {Object} [box] - Used when displaying a tooltip on a marker
 * @property {number} [box.width=0]
 * @property {number} [box.height=0]
 */

/**
 * @typedef {PSV.components.Tooltip.Position} PSV.components.Tooltip.Config
 * @summary Object defining the tooltip configuration
 * @property {string} content - HTML content of the tooltip
 * @property {string} [className] - Additional CSS class added to the tooltip
 * @property {*} [data] - Userdata associated to the tooltip
 */

/**
 * @summary Tooltip class
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.components
 */
export class Tooltip extends AbstractComponent {

  /**
   * @param {PSV.Viewer} psv
   * @param {{arrow: number, offset: number}} size
   */
  constructor(psv, size) {
    super(psv, 'psv-tooltip');

    /**
     * @override
     * @property {number} arrow
     * @property {number} offset
     * @property {number} width
     * @property {number} height
     * @property {string} pos
     * @property {string} state
     * @property {*} data
     */
    this.prop = {
      ...this.prop,
      ...size,
      state : STATE.NONE,
      width : 0,
      height: 0,
      pos   : '',
      data  : null,
    };

    /**
     * Tooltip content
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.content = document.createElement('div');
    this.content.className = 'psv-tooltip-content';
    this.container.appendChild(this.content);

    /**
     * Tooltip arrow
     * @member {HTMLElement}
     * @readonly
     * @package
     */
    this.arrow = document.createElement('div');
    this.arrow.className = 'psv-tooltip-arrow';
    this.container.appendChild(this.arrow);

    this.container.addEventListener('transitionend', this);

    this.container.style.top = '-1000px';
    this.container.style.left = '-1000px';
  }

  /**
   * @override
   */
  destroy() {
    delete this.arrow;
    delete this.content;

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case 'transitionend': this.__onTransitionEnd(e); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  toggle() {
    throw new PSVError('Tooltip cannot be toggled');
  }

  /**
   * @summary Displays the tooltip on the viewer
   * Do not call this method directly, use {@link PSV.services.TooltipRenderer} instead.
   * @param {PSV.components.Tooltip.Config} config
   *
   * @fires PSV.show-tooltip
   * @throws {PSV.PSVError} when the configuration is incorrect
   *
   * @package
   */
  show(config) {
    if (this.prop.state !== STATE.NONE) {
      throw new PSVError('Initialized tooltip cannot be re-initialized');
    }

    if (config.className) {
      addClasses(this.container, config.className);
    }

    this.content.innerHTML = config.content;

    const rect = this.container.getBoundingClientRect();
    this.prop.width = rect.right - rect.left;
    this.prop.height = rect.bottom - rect.top;

    this.prop.state = STATE.READY;

    this.move(config);

    this.prop.data = config.data;
    this.prop.state = STATE.SHOWING;

    this.psv.trigger(EVENTS.SHOW_TOOLTIP, this.prop.data, this);
  }

  /**
   * @summary Moves the tooltip to a new position
   * @param {PSV.components.Tooltip.Position} config
   *
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  move(config) {
    if (this.prop.state !== STATE.SHOWING && this.prop.state !== STATE.READY) {
      throw new PSVError('Uninitialized tooltip cannot be moved');
    }

    const t = this.container;
    const a = this.arrow;

    if (!config.position) {
      config.position = ['top', 'center'];
    }

    // parse position
    if (typeof config.position === 'string') {
      const tempPos = parsePosition(config.position);

      if (!(tempPos.x in LEFT_MAP) || !(tempPos.y in TOP_MAP)) {
        throw new PSVError(`Unable to parse tooltip position "${config.position}"`);
      }

      config.position = [TOP_MAP[tempPos.y], LEFT_MAP[tempPos.x]];
    }

    if (config.position[0] === 'center' && config.position[1] === 'center') {
      throw new PSVError('Unable to parse tooltip position "center center"');
    }

    // compute size
    const style = {
      posClass : config.position.slice(),
      width    : this.prop.width,
      height   : this.prop.height,
      top      : 0,
      left     : 0,
      arrowTop : 0,
      arrowLeft: 0,
    };

    // set initial position
    this.__computeTooltipPosition(style, config);

    // correct position if overflow
    let refresh = false;
    if (style.top < this.prop.offset) {
      style.posClass[0] = 'bottom';
      refresh = true;
    }
    else if (style.top + style.height > this.psv.prop.size.height - this.prop.offset) {
      style.posClass[0] = 'top';
      refresh = true;
    }
    if (style.left < this.prop.offset) {
      style.posClass[1] = 'right';
      refresh = true;
    }
    else if (style.left + style.width > this.psv.prop.size.width - this.prop.offset) {
      style.posClass[1] = 'left';
      refresh = true;
    }
    if (refresh) {
      this.__computeTooltipPosition(style, config);
    }

    // apply position
    t.style.top = style.top + 'px';
    t.style.left = style.left + 'px';

    a.style.top = style.arrowTop + 'px';
    a.style.left = style.arrowLeft + 'px';

    const newPos = style.posClass.join('-');
    if (newPos !== this.prop.pos) {
      t.classList.remove(`psv-tooltip--${this.prop.pos}`);

      this.prop.pos = newPos;
      t.classList.add(`psv-tooltip--${this.prop.pos}`);
    }
  }

  /**
   * @summary Hides the tooltip
   * @fires PSV.hide-tooltip
   */
  hide() {
    this.container.classList.remove('psv-tooltip--visible');
    this.prop.state = STATE.HIDING;

    this.psv.trigger(EVENTS.HIDE_TOOLTIP, this.prop.data);
  }

  /**
   * @summary Finalize transition
   * @param {TransitionEvent} e
   * @private
   */
  __onTransitionEnd(e) {
    if (e.propertyName === 'transform') {
      switch (this.prop.state) {
        case STATE.SHOWING:
          this.container.classList.add('psv-tooltip--visible');
          this.prop.state = STATE.READY;
          break;

        case STATE.HIDING:
          this.prop.state = STATE.NONE;
          this.destroy();
          break;

        default:
          // nothing
      }
    }
  }

  /**
   * @summary Computes the position of the tooltip and its arrow
   * @param {Object} style
   * @param {Object} config
   * @private
   */
  __computeTooltipPosition(style, config) {
    let topBottom = false;

    if (!config.box) {
      config.box = {
        width : 0,
        height: 0,
      };
    }

    switch (style.posClass[0]) {
      case 'bottom':
        style.top = config.top + config.box.height + this.prop.offset + this.prop.arrow;
        style.arrowTop = -this.prop.arrow * 2;
        topBottom = true;
        break;

      case 'center':
        style.top = config.top + config.box.height / 2 - style.height / 2;
        style.arrowTop = style.height / 2 - this.prop.arrow;
        break;

      case 'top':
        style.top = config.top - style.height - this.prop.offset - this.prop.arrow;
        style.arrowTop = style.height;
        topBottom = true;
        break;

      // no default
    }

    switch (style.posClass[1]) {
      case 'right':
        if (topBottom) {
          style.left = config.left + config.box.width / 2 - this.prop.offset - this.prop.arrow;
          style.arrowLeft = this.prop.offset;
        }
        else {
          style.left = config.left + config.box.width + this.prop.offset + this.prop.arrow;
          style.arrowLeft = -this.prop.arrow * 2;
        }
        break;

      case 'center':
        style.left = config.left + config.box.width / 2 - style.width / 2;
        style.arrowLeft = style.width / 2 - this.prop.arrow;
        break;

      case 'left':
        if (topBottom) {
          style.left = config.left - style.width + config.box.width / 2 + this.prop.offset + this.prop.arrow;
          style.arrowLeft = style.width - this.prop.offset - this.prop.arrow * 2;
        }
        else {
          style.left = config.left - style.width - this.prop.offset - this.prop.arrow;
          style.arrowLeft = style.width;
        }
        break;

      // no default
    }
  }

}
