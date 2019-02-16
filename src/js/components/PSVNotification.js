import { EVENTS } from '../data/constants';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Notification class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVNotification extends AbstractComponent {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-notification');

    /**
     * @override
     * @property {*} timeout
     */
    this.prop = {
      ...this.prop,
      visible: false,
      timeout: null,
    };

    /**
     * Notification content
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.content = document.createElement('div');
    this.content.className = 'psv-notification-content';
    this.container.appendChild(this.content);

    this.content.addEventListener('click', () => this.hide());
  }

  /**
   * @override
   */
  destroy() {
    delete this.content;

    super.destroy();
  }

  /**
   * @summary Displays a notification on the viewer
   * @param {Object|string} config
   * @param {string} config.content
   * @param {number} [config.timeout]
   *
   * @example
   * viewer.showNotification({ content: 'Hello world', timeout: 5000 })
   * @example
   * viewer.showNotification('Hello world')
   */
  show(config) {
    if (this.prop.timeout) {
      clearTimeout(this.prop.timeout);
      this.prop.timeout = null;
    }

    if (typeof config === 'string') {
      config = { content: config }; // eslint-disable-line no-param-reassign
    }

    this.content.innerHTML = config.content;
    this.prop.visible = true;

    this.container.classList.add('psv-notification--visible');

    /**
     * @event show-notification
     * @memberof module:components.PSVNotification
     * @summary Trigered when the notification is shown
     */
    this.psv.trigger(EVENTS.SHOW_NOTIFICATION);

    if (config.timeout) {
      this.prop.timeout = setTimeout(() => this.hide(), config.timeout);
    }
  }

  /**
   * @summary Hides the notification
   * @fires module:components.PSVNotification.hide-notification
   */
  hide() {
    if (this.prop.visible) {
      this.container.classList.remove('psv-notification--visible');

      this.prop.visible = false;

      /**
       * @event hide-notification
       * @memberof module:components.PSVNotification
       * @summary Trigered when the notification is hidden
       */
      this.psv.trigger(EVENTS.HIDE_NOTIFICATION);
    }
  }

}

export { PSVNotification };
