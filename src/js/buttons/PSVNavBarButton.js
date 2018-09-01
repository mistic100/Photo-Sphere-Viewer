/**
 * @module components/buttons
 */

/**
 * Navigation bar button class
 * @param {module:components.PSVNavBar} navbar
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components/buttons
 */
function PSVNavBarButton(navbar) {
  PSVComponent.call(this, navbar);

  /**
   * @summary Unique identifier of the button
   * @member {string}
   * @readonly
   */
  this.id = undefined;

  if (this.constructor.id) {
    this.id = this.constructor.id;
  }

  /**
   * @summary State of the button
   * @member {boolean}
   * @readonly
   */
  this.enabled = true;
}

PSVNavBarButton.prototype = Object.create(PSVComponent.prototype);
PSVNavBarButton.prototype.constructor = PSVNavBarButton;

/**
 * @summary Unique identifier of the button
 * @member {string}
 * @readonly
 */
PSVNavBarButton.id = null;

/**
 * @summary SVG icon name injected in the button
 * @member {string}
 * @readonly
 */
PSVNavBarButton.icon = null;

/**
 * @summary SVG icon name injected in the button when it is active
 * @member {string}
 * @readonly
 */
PSVNavBarButton.iconActive = null;

/**
 * @summary Creates the button
 * @protected
 */
PSVNavBarButton.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  if (this.constructor.icon) {
    this._setIcon(this.constructor.icon);
  }

  if (this.id && this.psv.config.lang[this.id]) {
    this.container.title = this.psv.config.lang[this.id];
  }

  this.container.addEventListener('click', function(e) {
    if (this.enabled) {
      this._onClick();
    }
    e.stopPropagation();
  }.bind(this));

  var supported = this.supported();
  if (typeof supported.then === 'function') {
    this.hide();

    supported.then(function(supported) {
      if (supported) {
        this.show();
      }
    }.bind(this));
  }
  else if (!supported) {
    this.hide();
  }
};

/**
 * @summary Destroys the button
 * @protected
 */
PSVNavBarButton.prototype.destroy = function() {
  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Checks if the button can be displayed
 * @returns {boolean|Promise<boolean>}
 */
PSVNavBarButton.prototype.supported = function() {
  return true;
};

/**
 * @summary Changes the active state of the button
 * @param {boolean} [active] - forced state
 */
PSVNavBarButton.prototype.toggleActive = function(active) {
  PSVUtils.toggleClass(this.container, 'psv-button--active', active);

  if (this.constructor.iconActive) {
    this._setIcon(active ? this.constructor.iconActive : this.constructor.icon);
  }
};

/**
 * @summary Disables the button
 */
PSVNavBarButton.prototype.disable = function() {
  this.container.classList.add('psv-button--disabled');

  this.enabled = false;
};

/**
 * @summary Enables the button
 */
PSVNavBarButton.prototype.enable = function() {
  this.container.classList.remove('psv-button--disabled');

  this.enabled = true;
};

/**
 * @summary Set the button icon from {@link PhotoSphereViewer.ICONS}
 * @param {string} icon
 * @param {HTMLElement} [container] - default is the main button container
 * @private
 */
PSVNavBarButton.prototype._setIcon = function(icon, container) {
  if (!container) {
    container = this.container;
  }
  if (icon) {
    container.innerHTML = PhotoSphereViewer.ICONS[icon];
    // classList not supported on IE11, className is read-only !!!!
    container.querySelector('svg').setAttribute('class', 'psv-button-svg');
  }
  else {
    container.innerHTML = '';
  }
};

/**
 * @summary Action when the button is clicked
 * @private
 * @abstract
 */
PSVNavBarButton.prototype._onClick = function() {

};
