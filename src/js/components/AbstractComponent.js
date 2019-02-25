import { PhotoSphereViewer } from '../PhotoSphereViewer';

/**
 * @module components
 */

/**
 * @summary Base component class
 * @memberof module:components
 * @abstract
 */
class AbstractComponent {

  /**
   * @param {PhotoSphereViewer | module:components.AbstractComponent} parent
   * @param {string} className - CSS class added to the component's container
   */
  constructor(parent, className) {
    /**
     * @summary Reference to main controller
     * @type {PhotoSphereViewer}
     * @readonly
     */
    this.psv = parent instanceof PhotoSphereViewer ? parent : parent.psv;

    /**
     * @member {PhotoSphereViewer|module:components.AbstractComponent}
     * @readonly
     */
    this.parent = parent;
    this.parent.children.push(this);

    /**
     * @summary All child components
     * @type {module:components.AbstractComponent[]}
     * @readonly
     * @package
     */
    this.children = [];

    /**
     * @summary Internal properties
     * @member {Object}
     * @protected
     * @property {boolean} visible - Visibility of the component
     */
    this.prop = {
      visible: true,
    };

    /**
     * @member {HTMLElement}
     * @readonly
     */
    this.container = document.createElement('div');
    this.container.className = className;
    this.parent.container.appendChild(this.container);
  }

  /**
   * @summary Destroys the component
   * @protected
   */
  destroy() {
    this.parent.container.removeChild(this.container);

    this.children.forEach(child => child.destroy());
    this.children.length = 0;

    delete this.container;
    delete this.parent;
    delete this.psv;
    delete this.prop;
  }

  /**
   * @summary Refresh UI
   * Must be be a very lightweight operation
   * @package
   */
  refresh() {
    this.children.every((child) => {
      child.refresh();
      return this.psv.prop.uiRefresh === true;
    });
  }

  /**
   * @summary Displays or hides the component
   */
  toggle() {
    if (this.isVisible()) {
      this.hide();
    }
    else {
      this.show();
    }
  }

  /**
   * @summary Hides the component
   */
  hide() {
    this.container.style.display = 'none';
    this.prop.visible = false;
  }

  /**
   * @summary Displays the component
   */
  show() {
    this.container.style.display = '';
    this.prop.visible = true;
  }

  /**
   * @summary Check if the component is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.prop.visible;
  }

}

export { AbstractComponent };
