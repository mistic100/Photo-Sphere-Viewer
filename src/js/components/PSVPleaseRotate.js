/**
 * "Please rotate" class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVPleaseRotate(psv) {
  PSVComponent.call(this, psv);

  this.create();
}

PSVPleaseRotate.prototype = Object.create(PSVComponent.prototype);
PSVPleaseRotate.prototype.constructor = PSVPleaseRotate;

PSVPleaseRotate.className = 'psv-please-rotate';

/**
 * @override
 */
PSVPleaseRotate.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.innerHTML =
    '<div class="psv-please-rotate-image">' + PhotoSphereViewer.ICONS['mobile-rotate.svg'] + '</div>' +
    '<div class="psv-please-rotate-text">' + this.psv.config.lang.please_rotate[0] + '</div>' +
    '<div class="psv-please-rotate-subtext">' + this.psv.config.lang.please_rotate[1] + '</div>';

  this.container.addEventListener('click', this);
  window.addEventListener('orientationchange', this);
};

/**
 * @override
 */
PSVPleaseRotate.prototype.destroy = function() {
  window.removeEventListener('orientationchange', this);

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVPleaseRotate.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'click': this.hide(); break;
    case 'orientationchange':
      if (Math.abs(window.orientation) === 90) {
        this.hide();
      }
      break;
    // @formatter:on
  }
};

