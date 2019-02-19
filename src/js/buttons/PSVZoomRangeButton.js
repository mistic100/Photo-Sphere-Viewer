import { EVENTS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { getStyle } from '../utils';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar zoom button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVZoomRangeButton extends AbstractButton {

  static get id() {
    return 'zoomRange';
  }

  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-zoom-range');

    /**
     * @override
     * @property {boolean} mousedown
     * @property {number} mediaMinWidth
     */
    this.prop = {
      ...this.prop,
      mousedown    : false,
      mediaMinWidth: 0,
    };

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.zoomRange = document.createElement('div');
    this.zoomRange.className = 'psv-zoom-range-line';
    this.container.appendChild(this.zoomRange);

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.zoomValue = document.createElement('div');
    this.zoomValue.className = 'psv-zoom-range-handle';
    this.zoomRange.appendChild(this.zoomValue);

    this.prop.mediaMinWidth = parseInt(getStyle(this.container, 'maxWidth'), 10);

    this.container.addEventListener('mousedown', this);
    this.container.addEventListener('touchstart', this);
    this.psv.container.addEventListener('mousemove', this);
    this.psv.container.addEventListener('touchmove', this);
    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);

    this.psv.on(EVENTS.ZOOM_UPDATED, this);
    this.psv.once(EVENTS.READY, this);

    this.refresh();
  }

  /**
   * @override
   */
  destroy() {
    this.__stopZoomChange();

    this.psv.container.removeEventListener('mousemove', this);
    this.psv.container.removeEventListener('touchmove', this);
    this.psv.container.removeEventListener('mouseup', this);
    this.psv.container.removeEventListener('touchend', this);

    delete this.zoomRange;
    delete this.zoomValue;

    this.psv.off(EVENTS.ZOOM_UPDATED, this);

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
      case 'mousedown':    this.__initZoomChangeWithMouse(e); break;
      case 'touchstart':   this.__initZoomChangeByTouch(e);   break;
      case 'mousemove':    this.__changeZoomWithMouse(e);     break;
      case 'touchmove':    this.__changeZoomByTouch(e);       break;
      case 'mouseup':      this.__stopZoomChange(e);          break;
      case 'touchend':     this.__stopZoomChange(e);          break;
      case EVENTS.ZOOM_UPDATED: this.__moveZoomValue(e.args[0]); break;
      case EVENTS.READY:        this.__moveZoomValue(this.psv.prop.zoomLvl); break;
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
  refresh() {
    if (this.prop.supported) {
      if (this.psv.prop.size.width <= this.prop.mediaMinWidth && this.prop.visible) {
        this.hide();
      }
      else if (this.psv.prop.size.width > this.prop.mediaMinWidth && !this.prop.visible) {
        this.show();
      }
    }
  }

  /**
   * @override
   */
  __onClick() {
    // nothing
  }

  /**
   * @summary Moves the zoom cursor
   * @param {number} level
   * @private
   */
  __moveZoomValue(level) {
    this.zoomValue.style.left = (level / 100 * this.zoomRange.offsetWidth - this.zoomValue.offsetWidth / 2) + 'px';
  }

  /**
   * @summary Handles mouse down events
   * @param {MouseEvent} evt
   * @private
   */
  __initZoomChangeWithMouse(evt) {
    if (!this.prop.enabled) {
      return;
    }

    this.prop.mousedown = true;
    this.__changeZoom(evt.clientX);
  }

  /**
   * @summary Handles touch events
   * @param {TouchEvent} evt
   * @private
   */
  __initZoomChangeByTouch(evt) {
    if (!this.prop.enabled) {
      return;
    }

    this.prop.mousedown = true;
    this.__changeZoom(evt.changedTouches[0].clientX);
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

  /**
   * @summary Handles mouse move events
   * @param {MouseEvent} evt
   * @private
   */
  __changeZoomWithMouse(evt) {
    if (!this.prop.enabled) {
      return;
    }

    evt.preventDefault();
    this.__changeZoom(evt.clientX);
  }

  /**
   * @summary Handles touch move events
   * @param {TouchEvent} evt
   * @private
   */
  __changeZoomByTouch(evt) {
    if (!this.prop.enabled) {
      return;
    }
    this.__changeZoom(evt.changedTouches[0].clientX);
  }

  /**
   * @summary Zoom change
   * @param {number} x - mouse/touch position
   * @private
   */
  __changeZoom(x) {
    if (this.prop.mousedown) {
      const userInput = x - this.zoomRange.getBoundingClientRect().left;
      const zoomLevel = userInput / this.zoomRange.offsetWidth * 100;
      this.psv.zoom(zoomLevel);
    }
  }

}

export { PSVZoomRangeButton };
