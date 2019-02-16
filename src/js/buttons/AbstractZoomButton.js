import { SYSTEM } from '../data/system';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar zoom button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class AbstractZoomButton extends AbstractButton {

  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   * @param {Function} action
   */
  constructor(navbar, action) {
    super(navbar, 'psv-button--hover-scale psv-zoom-button');

    /**
     * @member {Function}
     * @private
     */
    this.action = action;

    /**
     * @override
     * @property {boolean} buttondown
     * @property {*} longPressInterval
     * @property {*} longPressTimeout
     */
    this.prop = {
      ...this.prop,
      buttondown       : false,
      longPressInterval: null,
      longPressTimeout : null,
    };

    this.container.addEventListener('mousedown', this.__zoom.bind(this));

    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);
  }

  /**
   * @override
   */
  destroy() {
    this.__stopZoomChange();

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
      case 'mouseup':  this.__stopZoomChange(e); break;
      case 'touchend': this.__stopZoomChange(e); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  checkSupported() {
    return { initial: true, promise: SYSTEM.isTouchEnabled.then(enabled => !enabled) };
  }

  /**
   * @override
   */
  __onClick() {
    // nothing
  }

  /**
   * @summary Handles click events
   * @description Zooms in and register long press timer
   * @private
   */
  __zoom() {
    if (!this.prop.enabled) {
      return;
    }

    this.prop.buttondown = true;
    this.action();
    this.prop.longPressTimeout = setTimeout(() => this.__startLongPressInterval(), 200);
  }

  /**
   * @summary Continues zooming as long as the user presses the button
   * @private
   */
  __startLongPressInterval() {
    if (this.prop.buttondown) {
      this.prop.longPressInterval = setInterval(() => {
        this.action();
      }, 50);
    }
  }

  /**
   * @summary Handles mouse up events
   * @private
   */
  __stopZoomChange() {
    if (!this.prop.enabled) {
      return;
    }

    clearInterval(this.prop.longPressInterval);
    clearTimeout(this.prop.longPressTimeout);
    this.prop.longPressInterval = null;
    this.prop.mousedown = false;
    this.prop.buttondown = false;
  }

}

export { AbstractZoomButton };
