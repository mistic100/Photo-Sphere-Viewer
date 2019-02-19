/**
 * @module components/buttons
 */

import { AbstractComponent } from '../components/AbstractComponent';
import { PSVError } from '../PSVError';
import { isPlainObject, toggleClass } from '../utils';

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
   * @summary `true` if the button can be moved to menu when the navbar is too small
   * @returns {boolean}
   */
  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   * @param {string} className
   */
  constructor(navbar, className) {
    super(navbar, 'psv-button ' + className);

    /**
     * @override
     * @property {string} id - Unique identifier of the button
     * @property {boolean} enabled
     * @property {boolean} supported
     * @property {boolean} collapsed
     * @property {boolean} active
     * @property {number} width
     */
    this.prop = {
      ...this.prop,
      id       : this.constructor.id,
      enabled  : true,
      supported: true,
      collapsed: false,
      active   : false,
      width    : this.container.offsetWidth,
    };

    if (this.constructor.icon) {
      this.__setIcon(this.constructor.icon);
    }

    if (this.prop.id && this.psv.config.lang[this.prop.id]) {
      this.container.title = this.psv.config.lang[this.prop.id];
    }

    this.container.addEventListener('click', (e) => {
      if (this.prop.enabled) {
        this.__onClick();
      }
      e.stopPropagation();
    });

    const supportedOrObject = this.checkSupported();
    if (isPlainObject(supportedOrObject)) {
      if (supportedOrObject.initial === false) {
        this.hide();
        this.prop.supported = false;
      }

      supportedOrObject.promise.then((supported) => {
        this.prop.supported = supported;
        if (!supported && this.prop.visible) {
          this.hide();
        }
        else if (supported && !this.prop.visible) {
          this.show();
        }
      });
    }
    else if (!supportedOrObject) {
      this.hide();
      this.prop.supported = false;
    }
  }

  /**
   * @summary Checks if the button can be displayed
   * @returns {boolean|{initial: boolean, promise: Promise<boolean>}}
   */
  checkSupported() {
    return true;
  }

  /**
   * @summary Changes the active state of the button
   * @param {boolean} [active] - forced state
   */
  toggleActive(active) {
    this.prop.active = active !== undefined ? active : !this.prop.active;
    toggleClass(this.container, 'psv-button--active', this.prop.active);

    if (this.constructor.iconActive) {
      this.__setIcon(this.prop.active ? this.constructor.iconActive : this.constructor.icon);
    }
  }

  /**
   * @override
   */
  show(refresh = true) {
    this.prop.visible = true;
    if (!this.prop.collapsed) {
      this.container.style.display = '';
    }
    if (refresh) {
      this.psv.refresh(`show button ${this.prop.id}`);
    }
  }

  /**
   * @override
   */
  hide(refresh = true) {
    this.prop.visible = false;
    this.container.style.display = 'none';
    if (refresh) {
      this.psv.refresh(`hide button ${this.prop.id}`);
    }
  }

  /**
   * @summary Disables the button
   */
  disable() {
    this.container.classList.add('psv-button--disabled');
    this.prop.enabled = false;
  }

  /**
   * @summary Enables the button
   */
  enable() {
    this.container.classList.remove('psv-button--disabled');
    this.prop.enabled = true;
  }

  /**
   * @summary Collapses the button in the navbar menu
   */
  collapse() {
    this.prop.collapsed = true;
    this.container.style.display = 'none';
  }

  /**
   * @summary Uncollapses the button from the navbar menu
   */
  uncollapse() {
    this.prop.collapsed = false;
    if (this.prop.visible) {
      this.container.style.display = '';
    }
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
    throw new PSVError(`__onClick not implemented for button "${this.prop.id}".`);
  }

}

export { AbstractButton };
