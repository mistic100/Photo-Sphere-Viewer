/**
 * @module components/buttons
 */

import { AbstractComponent } from '../components/AbstractComponent';
import { PSVError } from '../PSVError';
import { toggleClass } from '../utils';

/**
 * @summary Base navbar button class
 * @extends module:components.AbstractComponent
 * @memberof module:components/buttons
 * @abstract
 */
class AbstractButton extends AbstractComponent {

  /**
   * @summary Unique identifier of the button
   * @member {string}
   * @readonly
   * @static
   */
  static get id() {
    return null;
  }

  /**
   * @summary SVG icon name injected in the button
   * @member {string}
   * @readonly
   * @static
   */
  static get icon() {
    return null;
  }

  /**
   * @summary SVG icon name injected in the button when it is active
   * @member {string}
   * @readonly
   * @static
   */
  static get iconActive() {
    return null;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   * @param {string} className
   */
  constructor(navbar, className) {
    super(navbar, 'psv-button ' + className);

    /**
     * @summary Unique identifier of the button
     * @member {string}
     * @readonly
     */
    this.id = this.constructor.id;

    /**
     * @summary State of the button
     * @member {boolean}
     * @readonly
     */
    this.enabled = true;

    if (this.constructor.icon) {
      this.__setIcon(this.constructor.icon);
    }

    if (this.id && this.psv.config.lang[this.id]) {
      this.container.title = this.psv.config.lang[this.id];
    }

    this.container.addEventListener('click', (e) => {
      if (this.enabled) {
        this.__onClick();
      }
      e.stopPropagation();
    });

    const supportedOrPromise = this.supported();
    if (typeof supportedOrPromise.then === 'function') {
      this.hide();

      supportedOrPromise.then((supported) => {
        if (supported) {
          this.show();
        }
      });
    }
    else if (!supportedOrPromise) {
      this.hide();
    }
  }

  /**
   * @summary Checks if the button can be displayed
   * @returns {boolean|Promise<boolean>}
   */
  supported() {
    return true;
  }

  /**
   * @summary Changes the active state of the button
   * @param {boolean} [active] - forced state
   */
  toggleActive(active) {
    toggleClass(this.container, 'psv-button--active', active);

    if (this.constructor.iconActive) {
      this.__setIcon(active ? this.constructor.iconActive : this.constructor.icon);
    }
  }

  /**
   * @summary Disables the button
   */
  disable() {
    this.container.classList.add('psv-button--disabled');

    this.enabled = false;
  }

  /**
   * @summary Enables the button
   */
  enable() {
    this.container.classList.remove('psv-button--disabled');

    this.enabled = true;
  }

  /**
   * @summary Set the button icon from {@link ICONS}
   * @param {string} icon
   * @param {HTMLElement} [container] - default is the main button container
   * @private
   */
  __setIcon(icon, container = this.container) {
    if (icon) {
      container.innerHTML = this.psv.icons[icon];
      // classList not supported on IE11, className is read-only !!!!
      container.querySelector('svg').setAttribute('class', 'psv-button-svg');
    }
    else {
      container.innerHTML = '';
    }
  }

  /**
   * @summary Action when the button is clicked
   * @private
   * @abstract
   */
  __onClick() {
    throw new PSVError(`__onClick not implemented for button "${this.id}".`);
  }

}

export { AbstractButton };
