/**
 * Overlay class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVOverlay(psv) {
  PSVComponent.call(this, psv);

  this.create();
  this.hide();
}

PSVOverlay.prototype = Object.create(PSVComponent.prototype);
PSVOverlay.prototype.constructor = PSVOverlay;

PSVOverlay.className = 'psv-overlay';
PSVOverlay.publicMethods = ['showOverlay', 'hideOverlay', 'isOverlayVisible'];

/**
 * @override
 */
PSVOverlay.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.image = document.createElement('div');
  this.image.className = 'psv-overlay-image';
  this.container.appendChild(this.image);

  this.text = document.createElement('div');
  this.text.className = 'psv-overlay-text';
  this.container.appendChild(this.text);

  this.subtext = document.createElement('div');
  this.subtext.className = 'psv-overlay-subtext';
  this.container.appendChild(this.subtext);

  this.container.addEventListener('click', this.hideOverlay.bind(this));
};

/**
 * @override
 */
PSVOverlay.prototype.destroy = function() {
  delete this.image;
  delete this.text;
  delete this.subtext;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Checks if the overlay is visible
 * @returns {boolean}
 */
PSVOverlay.prototype.isOverlayVisible = function() {
  return this.visible;
};

/**
 * @summary Displays an overlay on the viewer
 * @param {Object|string} config
 * @param {string} config.image
 * @param {string} config.text
 * @param {string} config.subtext
 *
 * @example
 * viewer.showOverlay({
 *   image: '<svg></svg>',
 *   text: '....',
 *   subtext: '....'
 * })
 */
PSVOverlay.prototype.showOverlay = function(config) {
  if (typeof config === 'string') {
    config = {
      text: config
    };
  }

  this.image.innerHTML = config.image || '';
  this.text.innerHTML = config.text || '';
  this.subtext.innerHTML = config.subtext || '';

  this.show();

  /**
   * @event show-overlay
   * @memberof module:components.PSVOverlay
   * @summary Trigered when the overlay is shown
   */
  this.psv.trigger('show-overlay');
};

/**
 * @summary Hides the notification
 * @fires module:components.PSVOverlay.hide-notification
 */
PSVOverlay.prototype.hideOverlay = function() {
  if (this.isOverlayVisible()) {
    this.hide();

    /**
     * @event hide-overlay
     * @memberof module:components.PSVOverlay
     * @summary Trigered when the overlay is hidden
     */
    this.psv.trigger('hide-overlay');
  }
};

