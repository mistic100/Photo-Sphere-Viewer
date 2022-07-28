import { EVENTS, KEY_CODES } from '../data/constants';
import { SYSTEM } from '../data/system';
import { PSVError } from '../PSVError';
import { toggleClass } from '../utils';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Minimum width of the panel
 * @type {number}
 * @constant
 * @private
 */
const PANEL_MIN_WIDTH = 200;

/**
 * @summary Panel component
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.components
 */
export class Panel extends AbstractComponent {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-panel psv--capture-event');

    /**
     * @override
     * @property {string} contentId
     * @property {number} mouseX
     * @property {number} mouseY
     * @property {boolean} mousedown
     * @property {function} clickHandler
     * @property {function} keyHandler
     */
    this.prop = {
      ...this.prop,
      visible     : false,
      contentId   : undefined,
      mouseX      : 0,
      mouseY      : 0,
      mousedown   : false,
      clickHandler: null,
      keyHandler  : null,
      width       : {},
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

    // Stop wheel event bubbling from panel
    this.container.addEventListener(SYSTEM.mouseWheelEvent, e => e.stopPropagation());

    closeBtn.addEventListener('click', () => this.hide());

    // Event for panel resizing + stop bubling
    resizer.addEventListener('mousedown', this);
    resizer.addEventListener('touchstart', this);
    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);
    this.psv.container.addEventListener('mousemove', this);
    this.psv.container.addEventListener('touchmove', this);

    this.psv.on(EVENTS.KEY_PRESS, this);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.KEY_PRESS, this);

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
      case EVENTS.KEY_PRESS:
        if (this.isVisible() && e.args[0] === KEY_CODES.Escape) {
          this.hide();
          e.preventDefault();
        }
        break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @param {string} [id]
   */
  isVisible(id) {
    return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
  }

  /**
   * @override
   * @summary This method is not supported
   * @throws {PSV.PSVError} always
   */
  toggle() {
    throw new PSVError('Panel cannot be toggled');
  }

  /**
   * @summary Shows the panel
   * @param {string|Object} config
   * @param {string} [config.id] - unique identifier to use with "hide" and to store the user desired width
   * @param {string} config.content - HTML content of the panel
   * @param {boolean} [config.noMargin=false] - remove the default margins
   * @param {string} [config.width] - initial width
   * @param {Function} [config.clickHandler] - called when the user clicks inside the panel or presses the Enter key while an element focused
   * @fires PSV.open-panel
   */
  show(config) {
    const wasVisible = this.isVisible(config.id);

    if (typeof config === 'string') {
      config = { content: config };
    }

    this.prop.contentId = config.id;
    this.prop.visible = true;

    if (this.prop.clickHandler) {
      this.content.removeEventListener('click', this.prop.clickHandler);
      this.content.removeEventListener('keydown', this.prop.keyHandler);
      this.prop.clickHandler = null;
      this.prop.keyHandler = null;
    }

    if (config.id && this.prop.width[config.id]) {
      this.container.style.width = this.prop.width[config.id];
    }
    else if (config.width) {
      this.container.style.width = config.width;
    }
    else {
      this.container.style.width = null;
    }

    this.content.innerHTML = config.content;
    this.content.scrollTop = 0;
    this.container.classList.add('psv-panel--open');

    toggleClass(this.content, 'psv-panel-content--no-margin', config.noMargin === true);

    if (config.clickHandler) {
      this.prop.clickHandler = config.clickHandler;
      this.prop.keyHandler = (e) => {
        if (e.key === KEY_CODES.Enter) {
          config.clickHandler(e);
        }
      };
      this.content.addEventListener('click', this.prop.clickHandler);
      this.content.addEventListener('keydown', this.prop.keyHandler);

      // focus the first element if possible, after animation ends
      if (!wasVisible) {
        setTimeout(() => {
          this.content.querySelector('a,button,[tabindex]')?.focus();
        }, 300);
      }
    }

    this.psv.trigger(EVENTS.OPEN_PANEL, config.id);
  }

  /**
   * @summary Hides the panel
   * @param {string} [id]
   * @fires PSV.close-panel
   */
  hide(id) {
    if (this.isVisible(id)) {
      const contentId = this.prop.contentId;

      this.prop.visible = false;
      this.prop.contentId = undefined;

      this.content.innerHTML = null;
      this.container.classList.remove('psv-panel--open');

      if (this.prop.clickHandler) {
        this.content.removeEventListener('click', this.prop.clickHandler);
        this.prop.clickHandler = null;
      }

      this.psv.trigger(EVENTS.CLOSE_PANEL, contentId);
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
    const width = Math.max(PANEL_MIN_WIDTH, this.container.offsetWidth - (x - this.prop.mouseX)) + 'px';

    if (this.prop.contentId) {
      this.prop.width[this.prop.contentId] = width;
    }

    this.container.style.width = width;

    this.prop.mouseX = x;
    this.prop.mouseY = y;
  }

}
