/**
 * Navigation bar class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVNavBar(psv) {
  PSVComponent.call(this, psv);

  /**
   * @member {Object}
   * @readonly
   * @private
   */
  this.config = this.psv.config.navbar;

  /**
   * @summary List of buttons of the navbar
   * @member {Array.<module:components/buttons.PSVNavBarButton>}
   * @readonly
   */
  this.items = [];

  // all buttons
  if (this.config === true) {
    this.config = PSVUtils.clone(PhotoSphereViewer.DEFAULTS.navbar);
  }
  // space separated list
  else if (typeof this.config === 'string') {
    this.config = this.config.split(' ');
  }
  // migration from object
  else if (!Array.isArray(this.config)) {
    console.warn('PhotoSphereViewer: hashmap form of "navbar" is deprecated, use an array instead.');

    var config = this.config;
    this.config = [];

    PSVUtils.forEach(config, function(enabled, key) {
      if (enabled) {
        this.config.push(key);
      }
    }.bind(this));

    this.config.sort(function(a, b) {
      return PhotoSphereViewer.DEFAULTS.navbar.indexOf(a) - PhotoSphereViewer.DEFAULTS.navbar.indexOf(b);
    });
  }

  this.create();
}

PSVNavBar.prototype = Object.create(PSVComponent.prototype);
PSVNavBar.prototype.constructor = PSVNavBar;

PSVNavBar.className = 'psv-navbar psv-navbar--open';
PSVNavBar.publicMethods = ['showNavbar', 'hideNavbar', 'toggleNavbar', 'getNavbarButton'];

/**
 * @override
 * @throws {PSVError} when the configuration is incorrect
 */
PSVNavBar.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.config.forEach(function(button) {
    if (typeof button === 'object') {
      this.items.push(new PSVNavBarCustomButton(this, button));
    }
    else {
      switch (button) {
        case PSVNavBarAutorotateButton.id:
          this.items.push(new PSVNavBarAutorotateButton(this));
          break;

        case PSVNavBarZoomButton.id:
          this.items.push(new PSVNavBarZoomButton(this));
          break;

        case PSVNavBarDownloadButton.id:
          this.items.push(new PSVNavBarDownloadButton(this));
          break;

        case PSVNavBarMarkersButton.id:
          this.items.push(new PSVNavBarMarkersButton(this));
          break;

        case PSVNavBarFullscreenButton.id:
          this.items.push(new PSVNavBarFullscreenButton(this));
          break;

        case PSVNavBarStereoButton.id:
          this.items.push(new PSVNavBarStereoButton(this));
          break;

        case PSVNavBarGyroscopeButton.id:
          this.items.push(new PSVNavBarGyroscopeButton(this));
          break;

        case 'caption':
          this.items.push(new PSVNavBarCaption(this, this.psv.config.caption));
          break;

        /* falls through */
        default:
          if (button.indexOf('spacer') === 0) {
            console.warn('PhotoSphereViewer: navbar spacers have been removed.');
          }
          else {
            throw new PSVError('Unknown button ' + button);
          }
          break;
      }
    }
  }, this);
};

/**
 * @override
 */
PSVNavBar.prototype.destroy = function() {
  this.items.forEach(function(item) {
    item.destroy();
  });

  this.items.length = 0;
  delete this.config;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Returns a button by its identifier
 * @param {string} id
 * @param {boolean} [silent=false]
 * @returns {module:components/buttons.PSVNavBarButton}
 */
PSVNavBar.prototype.getNavbarButton = function(id, silent) {
  var button = null;

  this.items.some(function(item) {
    if (item.id === id) {
      button = item;
      return true;
    }
    else {
      return false;
    }
  });

  if (!button && !silent) {
    console.warn('PhotoSphereViewer: button "' + id + '" not found in the navbar.');
  }

  return button;
};

/**
 * @summary Shows the navbar
 */
PSVNavBar.prototype.showNavbar = function() {
  this.toggleNavbar(true);
};

/**
 * @summary Hides the navbar
 */
PSVNavBar.prototype.hideNavbar = function() {
  this.toggleNavbar(false);
};

/**
 * @summary Toggles the navbar
 * @param {boolean} active
 */
PSVNavBar.prototype.toggleNavbar = function(active) {
  PSVUtils.toggleClass(this.container, 'psv-navbar--open', active);
};
