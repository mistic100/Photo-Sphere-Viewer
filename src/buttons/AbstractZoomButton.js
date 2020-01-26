import { Animation } from '../Animation';
import { SYSTEM } from '../data/system';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar zoom button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class AbstractZoomButton extends AbstractButton {

  /**
   * @param {PSV.components.Navbar} navbar
   * @param {number} value
   */
  constructor(navbar, value) {
    super(navbar, 'psv-button--hover-scale psv-zoom-button', true);

    /**
     * @override
     * @property {number} value
     * @property {boolean} buttondown
     * @property {*} longPressTimeout
     * @property {PSV.Animation} longPressAnimation
     */
    this.prop = {
      ...this.prop,
      value             : value,
      buttondown        : false,
      longPressTimeout  : null,
      longPressAnimation: null,
    };

    this.container.addEventListener('mousedown', this);
    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);
  }

  /**
   * @override
   */
  destroy() {
    this.__onMouseUp();

    this.psv.container.removeEventListener('mouseup', this);
    this.psv.container.removeEventListener('touchend', this);

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
      case 'mousedown': this.__onMouseDown(); break;
      case 'mouseup':   this.__onMouseUp(); break;
      case 'touchend':  this.__onMouseUp(); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  isSupported() {
    return { initial: true, promise: SYSTEM.isTouchEnabled.then(enabled => !enabled) };
  }

  /**
   * @override
   */
  onClick() {
    // nothing
  }

  /**
   * @summary Handles click events
   * @description Zooms in and register long press timer
   * @private
   */
  __onMouseDown() {
    if (!this.prop.enabled) {
      return;
    }

    this.prop.buttondown = true;
    this.prop.longPressTimeout = setTimeout(() => this.__startLongPressInterval(), 100);
  }

  /**
   * @summary Continues zooming as long as the user presses the button
   * @private
   */
  __startLongPressInterval() {
    if (!this.prop.buttondown) {
      return;
    }

    const end = this.prop.value < 0 ? 0 : 100;

    this.prop.longPressAnimation = new Animation({
      properties: {
        zoom: { start: this.psv.prop.zoomLvl, end: end },
      },
      duration  : 1500 * Math.abs(this.psv.prop.zoomLvl - end) / 100,
      easing    : 'linear',
      onTick    : (properties) => {
        this.psv.zoom(properties.zoom);
      },
    });
  }

  /**
   * @summary Handles mouse up events
   * @private
   */
  __onMouseUp() {
    if (!this.prop.enabled || !this.prop.buttondown) {
      return;
    }

    if (this.prop.longPressAnimation) {
      this.prop.longPressAnimation.cancel();
      this.prop.longPressAnimation = null;
    }
    else {
      this.psv.zoom(this.psv.prop.zoomLvl + this.prop.value * this.psv.config.zoomButtonIncrement);
    }

    if (this.prop.longPressTimeout) {
      clearTimeout(this.prop.longPressTimeout);
    }

    this.prop.buttondown = false;
  }

}
