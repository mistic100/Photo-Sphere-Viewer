import { AbstractButton } from './AbstractButton';
import { EVENTS } from '../data/constants';

/**
 * @summary Navigation bar zoom button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVZoomButton extends AbstractButton {

  static get id() {
    return 'zoom';
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-zoom-button');

    /**
     * @member {Object}
     * @private
     */
    this.prop = {
      mousedown        : false,
      buttondown       : false,
      longPressInterval: null,
      longPressTimeout : null,
    };

    const zoomMinus = document.createElement('div');
    zoomMinus.className = 'psv-zoom-button-minus';
    zoomMinus.title = this.psv.config.lang.zoomOut;
    this.__setIcon('zoomOut', zoomMinus);
    this.container.appendChild(zoomMinus);

    const zoomRangeBg = document.createElement('div');
    zoomRangeBg.className = 'psv-zoom-button-range';
    this.container.appendChild(zoomRangeBg);

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.zoomRange = document.createElement('div');
    this.zoomRange.className = 'psv-zoom-button-line';
    zoomRangeBg.appendChild(this.zoomRange);

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.zoomValue = document.createElement('div');
    this.zoomValue.className = 'psv-zoom-button-handle';
    this.zoomRange.appendChild(this.zoomValue);

    const zoomPlus = document.createElement('div');
    zoomPlus.className = 'psv-zoom-button-plus';
    zoomPlus.title = this.psv.config.lang.zoomIn;
    this.__setIcon('zoomIn', zoomPlus);
    this.container.appendChild(zoomPlus);

    this.zoomRange.addEventListener('mousedown', this);
    this.zoomRange.addEventListener('touchstart', this);
    this.psv.container.addEventListener('mousemove', this);
    this.psv.container.addEventListener('touchmove', this);
    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);
    zoomMinus.addEventListener('mousedown', this.__zoomOut.bind(this));
    zoomPlus.addEventListener('mousedown', this.__zoomIn.bind(this));

    this.psv.on(EVENTS.ZOOM_UPDATED, this);
    this.psv.once(EVENTS.READY, this);
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
    delete this.prop;

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
      case EVENTS.ZOOM_UPDATED: this.__moveZoomValue(e.args[0]);             break;
      case EVENTS.READY:        this.__moveZoomValue(this.psv.prop.zoomLvl); break;
      // @formatter:on
    }
    /* eslint-enable */
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
    if (!this.enabled) {
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
    if (!this.enabled) {
      return;
    }

    this.prop.mousedown = true;
    this.__changeZoom(evt.changedTouches[0].clientX);
  }

  /**
   * @summary Handles click events
   * @description Zooms in and register long press timer
   * @private
   */
  __zoomIn() {
    if (!this.enabled) {
      return;
    }

    this.prop.buttondown = true;
    this.psv.zoomIn();
    this.prop.longPressTimeout = setTimeout(() => this.__startLongPressInterval(1), 200);
  }

  /**
   * @summary Handles click events
   * @description Zooms out and register long press timer
   * @private
   */
  __zoomOut() {
    if (!this.enabled) {
      return;
    }

    this.prop.buttondown = true;
    this.psv.zoomOut();
    this.prop.longPressTimeout = setTimeout(() => this.__startLongPressInterval(-1), 200);
  }

  /**
   * @summary Continues zooming as long as the user presses the button
   * @param value
   * @private
   */
  __startLongPressInterval(value) {
    if (this.prop.buttondown) {
      this.prop.longPressInterval = setInterval(() => {
        this.psv.zoom(this.psv.prop.zoomLvl + value);
      }, 50);
    }
  }

  /**
   * @summary Handles mouse up events
   * @private
   */
  __stopZoomChange() {
    if (!this.enabled) {
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
    if (!this.enabled) {
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
    if (!this.enabled) {
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

export { PSVZoomButton };
