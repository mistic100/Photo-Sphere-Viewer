/**
 * @module components
 */

/**
 * Base sub-component class
 * @param {PhotoSphereViewer | module:components.PSVComponent} parent
 * @constructor
 * @memberof module:components
 */
function PSVComponent(parent) {
  /**
   * @member {PhotoSphereViewer}
   * @readonly
   */
  this.psv = parent instanceof PhotoSphereViewer ? parent : parent.psv;

  /**
   * @member {PhotoSphereViewer|module:components.PSVComponent}
   * @readonly
   */
  this.parent = parent;

  /**
   * @member {HTMLElement}
   * @readonly
   */
  this.container = null;

  /**
   * @summary Visibility of the component
   * @member {boolean}
   * @readonly
   */
  this.visible = true;

  // expose some methods to the viewer
  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      this.psv[method] = this[method].bind(this);
    }, this);
  }
}

/**
 * @summary CSS class added to the component's container
 * @member {string}
 * @readonly
 */
PSVComponent.className = null;

/**
 * @summary List of component's methods which are bound the the main viewer
 * @member {string[]}
 * @readonly
 */
PSVComponent.publicMethods = [];

/**
 * @summary Creates the component
 * @protected
 */
PSVComponent.prototype.create = function() {
  this.container = document.createElement('div');

  if (this.constructor.className) {
    this.container.className = this.constructor.className;
  }

  this.parent.container.appendChild(this.container);
};

/**
 * @summary Destroys the component
 * @protected
 */
PSVComponent.prototype.destroy = function() {
  this.parent.container.removeChild(this.container);

  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      delete this.psv[method];
    }, this);
  }

  delete this.container;
  delete this.psv;
  delete this.parent;
};

/**
 * @summary Hides the component
 * @protected
 */
PSVComponent.prototype.hide = function() {
  this.container.style.display = 'none';
  this.visible = false;
};

/**
 * @summary Displays the component
 * @protected
 */
PSVComponent.prototype.show = function() {
  this.container.style.display = '';
  this.visible = true;
};
