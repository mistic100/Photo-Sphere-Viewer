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

    /**
     * @summary Visibility of the component
     * @member {boolean}
     * @readonly
     */
    this.visible = true;

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

    delete this.container;
    delete this.parent;
    delete this.psv;
  }

  /**
   * @summary Hides the component
   */
  hide() {
    this.container.style.display = 'none';
    this.visible = false;
  }

  /**
   * @summary Displays the component
   */
  show() {
    this.container.style.display = '';
    this.visible = true;
  }

  /**
   * @summary Check if the component is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

}

export { AbstractComponent };
