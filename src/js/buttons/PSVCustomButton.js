import { addClasses } from '../utils';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar custom button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVCustomButton extends AbstractButton {

  get collapsable() {
    return this.config.collapsable !== false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   * @param {Object} config
   * @param {string} [config.id]
   * @param {string} [config.className]
   * @param {string} [config.title]
   * @param {string} [config.content]
   * @param {Function} [config.onClick]
   * @param {boolean} [config.enabled=true]
   * @param {boolean} [config.visible=true]
   */
  constructor(navbar, config) {
    super(navbar, 'psv-custom-button');

    /**
     * @member {Object}
     * @readonly
     * @private
     */
    this.config = config;

    if (this.config.id) {
      this.prop.id = this.config.id;
    }
    else {
      this.prop.id = 'psvButton-' + Math.random().toString(36).substr(2, 9);
    }

    if (this.config.className) {
      addClasses(this.container, this.config.className);
    }

    if (this.config.title) {
      this.container.title = this.config.title;
    }

    if (this.config.content) {
      this.container.innerHTML = this.config.content;
    }

    this.width = this.container.offsetWidth;

    if (this.config.enabled === false) {
      this.disable();
    }

    if (this.config.visible === false) {
      this.hide();
    }
  }

  /**
   * @override
   */
  destroy() {
    delete this.config;

    super.destroy();
  }

  /**
   * @override
   * @description Calls user method
   */
  __onClick() {
    if (this.config.onClick) {
      this.config.onClick.apply(this.psv);
    }
  }

}

export { PSVCustomButton };
