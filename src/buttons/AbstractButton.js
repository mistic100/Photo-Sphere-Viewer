import { AbstractComponent } from '../components/AbstractComponent';
import { KEY_CODES } from '../data/constants';
import { PSVError } from '../PSVError';
import { isPlainObject, toggleClass } from '../utils';

/**
 * @namespace PSV.buttons
 */

/**
 * @summary Base navbar button class
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.buttons
 * @abstract
 */
export class AbstractButton extends AbstractComponent {

  /**
   * @summary Unique identifier of the button
   * @member {string}
   * @readonly
   * @static
   */
  static id = null;

  /**
   * @summary Identifier to declare a group of buttons
   * @member {string}
   * @readonly
   * @static
   */
  static groupId = null;

  /**
   * @summary SVG icon name injected in the button
   * @member {string}
   * @readonly
   * @static
   */
  static icon = null;

  /**
   * @summary SVG icon name injected in the button when it is active
   * @member {string}
   * @readonly
   * @static
   */
  static iconActive = null;

  /**
   * @param {PSV.components.Navbar} navbar
   * @param {string} [className] - Additional CSS classes
   * @param {boolean} [collapsable=false] - `true` if the button can be moved to menu when the navbar is too small
   * @param {boolean} [tabbable=true] - `true` if the button is accessible with the keyboard
   */
  constructor(navbar, className = '', collapsable = false, tabbable = true) {
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
      id         : this.constructor.id,
      collapsable: collapsable,
      enabled    : true,
      supported  : true,
      collapsed  : false,
      active     : false,
      width      : this.container.offsetWidth,
    };

    if (this.constructor.icon) {
      this.__setIcon(this.constructor.icon);
    }

    if (this.prop.id && this.psv.config.lang[this.prop.id]) {
      this.container.title = this.psv.config.lang[this.prop.id];
    }

    if (tabbable) {
      this.container.tabIndex = 0;
    }

    this.container.addEventListener('click', (e) => {
      if (this.prop.enabled) {
        this.onClick();
      }
      e.stopPropagation();
    });

    this.container.addEventListener('keydown', (e) => {
      if (e.key === KEY_CODES.Enter && this.prop.enabled) {
        this.onClick();
        e.stopPropagation();
      }
    });
  }

  /**
   * @package
   */
  checkSupported() {
    const supportedOrObject = this.isSupported();
    if (isPlainObject(supportedOrObject)) {
      if (supportedOrObject.initial === false) {
        this.hide();
        this.prop.supported = false;
      }

      supportedOrObject.promise.then((supported) => {
        if (!this.prop) {
          return; // the component has been destroyed
        }
        this.prop.supported = supported;
        this.toggle(supported);
      });
    }
    else {
      this.prop.supported = supportedOrObject;
      if (!supportedOrObject) {
        this.hide();
      }
    }
  }

  /**
   * @summary Checks if the button can be displayed
   * @returns {boolean|{initial: boolean, promise: Promise<boolean>}}
   */
  isSupported() {
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
    if (!this.isVisible()) {
      this.prop.visible = true;
      if (!this.prop.collapsed) {
        this.container.style.display = '';
      }
      if (refresh) {
        this.psv.refreshUi(`show button ${this.prop.id}`);
      }
    }
  }

  /**
   * @override
   */
  hide(refresh = true) {
    if (this.isVisible()) {
      this.prop.visible = false;
      this.container.style.display = 'none';
      if (refresh) {
        this.psv.refreshUi(`hide button ${this.prop.id}`);
      }
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
   * @summary Set the button icon
   * @param {string} icon SVG
   * @param {HTMLElement} [container] - default is the main button container
   * @private
   */
  __setIcon(icon, container = this.container) {
    if (icon) {
      container.innerHTML = icon;
      // className is read-only on SVGElement
      container.querySelector('svg').classList.add('psv-button-svg');
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
  onClick() {
    throw new PSVError(`onClick not implemented for button "${this.prop.id}".`);
  }

}
