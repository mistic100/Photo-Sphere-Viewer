import { addClasses } from '../utils';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar custom button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class CustomButton extends AbstractButton {

  /**
   * @param {PSV.components.Navbar} navbar
   * @param {PSV.NavbarCustomButton} config
   */
  constructor(navbar, config) {
    super(navbar, 'psv-custom-button', config.collapsable !== false);

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
  onClick() {
    if (this.config.onClick) {
      this.config.onClick.apply(this.psv);
    }
  }

}
