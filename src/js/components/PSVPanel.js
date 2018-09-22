import { SYSTEM } from '../data/system';
import { toggleClass } from '../utils';
import { AbstractComponent } from './AbstractComponent';
import { EVENTS } from '../data/constants';

/**
 * @summary Minimum width of the panel
 * @type {number}
 * @constant
 * @private
 */
const PANEL_MIN_WIDTH = 200;

/**
 * @summary Panel class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVPanel extends AbstractComponent {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-panel');

    /**
     * @member {Object}
     * @private
     */
    this.prop = {
      id       : undefined,
      mouseX   : 0,
      mouseY   : 0,
      mousedown: false,
    };

    const resizer = document.createElement('div');
    resizer.className = 'psv-panel-resizer';
    this.container.appendChild(resizer);

    const closeBtn = document.createElement('div');
    closeBtn.className = 'psv-panel-close-button';
    this.container.appendChild(closeBtn);

    /**
     * @summary Content container
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.content = document.createElement('div');
    this.content.className = 'psv-panel-content';
    this.container.appendChild(this.content);

    // Stop wheel event bubling from panel
    this.container.addEventListener(SYSTEM.mouseWheelEvent, e => e.stopPropagation());

    closeBtn.addEventListener('click', () => this.hide());

    // Event for panel resizing + stop bubling
    resizer.addEventListener('mousedown', this);
    resizer.addEventListener('touchstart', this);
    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);
    this.psv.container.addEventListener('mousemove', this);
    this.psv.container.addEventListener('touchmove', this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.container.removeEventListener('mousemove', this);
    this.psv.container.removeEventListener('touchmove', this);
    this.psv.container.removeEventListener('mouseup', this);
    this.psv.container.removeEventListener('touchend', this);

    delete this.prop;
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
      case 'mousedown':  this.__onMouseDown(e);  break;
      case 'touchstart': this.__onTouchStart(e); break;
      case 'mousemove':  this.__onMouseMove(e);  break;
      case 'touchmove':  this.__onTouchMove(e);  break;
      case 'mouseup':    this.__onMouseUp(e);    break;
      case 'touchend':   this.__onMouseUp(e);    break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @summary Shows the panel
   * @param {Object} config
   * @param {string} [config.id]
   * @param {string} config.content
   * @param {boolean} [config.noMargin=false]
   * @fires module:components.PSVPanel.open-panel
   */
  show(config) {
    if (typeof config === 'string') {
      config = { content: config }; // eslint-disable-line no-param-reassign
    }

    this.prop.id = config.id;
    this.visible = true;

    this.content.innerHTML = config.content;
    this.content.scrollTop = 0;
    this.container.classList.add('psv-panel--open');

    toggleClass(this.content, 'psv-panel-content--no-margin', config.noMargin === true);

    /**
     * @event open-panel
     * @memberof module:components.PSVPanel
     * @summary Triggered when the panel is opened
     * @param {string} id
     */
    this.psv.trigger(EVENTS.OPEN_PANEL, config.id);
  }

  /**
   * @summary Hides the panel
   * @param {string} [id]
   * @fires module:components.PSVPanel.close-panel
   */
  hide(id) {
    if (this.visible && (!id || !this.prop.id || this.prop.id === id)) {
      this.visible = false;
      this.prop.id = undefined;

      this.content.innerHTML = null;
      this.container.classList.remove('psv-panel--open');

      /**
       * @event close-panel
       * @memberof module:components.PSVPanel
       * @summary Trigered when the panel is closed
       */
      this.psv.trigger(EVENTS.CLOSE_PANEL);
    }
  }

  /**
   * @summary Handles mouse down events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseDown(evt) {
    evt.stopPropagation();
    this.__startResize(evt);
  }

  /**
   * @summary Handles touch events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchStart(evt) {
    evt.stopPropagation();
    this.__startResize(evt.changedTouches[0]);
  }

  /**
   * @summary Handles mouse up events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseUp(evt) {
    if (this.prop.mousedown) {
      evt.stopPropagation();
      this.prop.mousedown = false;
      this.content.classList.remove('psv-panel-content--no-interaction');
    }
  }

  /**
   * @summary Handles mouse move events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseMove(evt) {
    if (this.prop.mousedown) {
      evt.stopPropagation();
      this.__resize(evt);
    }
  }

  /**
   * @summary Handles touch move events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchMove(evt) {
    if (this.prop.mousedown) {
      this.__resize(evt.touches[0]);
    }
  }

  /**
   * @summary Initializes the panel resize
   * @param {MouseEvent|Touch} evt
   * @private
   */
  __startResize(evt) {
    this.prop.mouseX = evt.clientX;
    this.prop.mouseY = evt.clientY;
    this.prop.mousedown = true;
    this.content.classList.add('psv-panel-content--no-interaction');
  }

  /**
   * @summary Resizes the panel
   * @param {MouseEvent|Touch} evt
   * @private
   */
  __resize(evt) {
    const x = evt.clientX;
    const y = evt.clientY;

    this.container.style.width = Math.max(PANEL_MIN_WIDTH, this.container.offsetWidth - (x - this.prop.mouseX)) + 'px';

    this.prop.mouseX = x;
    this.prop.mouseY = y;
  }

}

export { PSVPanel };
