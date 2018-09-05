/**
 * Navigation bar gyroscope button class
 * @param {module:components.PSVNavBar} navbar
 * @constructor
 * @extends module:components/buttons.PSVNavBarButton
 * @memberof module:components/buttons
 */
function PSVNavBarGyroscopeButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarGyroscopeButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarGyroscopeButton.prototype.constructor = PSVNavBarGyroscopeButton;

PSVNavBarGyroscopeButton.id = 'gyroscope';
PSVNavBarGyroscopeButton.className = 'psv-button psv-button--hover-scale psv-gyroscope-button';
PSVNavBarGyroscopeButton.icon = 'compass.svg';

/**
 * @override
 * @description The button gets visible once the gyroscope API is ready
 */
PSVNavBarGyroscopeButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.psv.on('gyroscope-updated', this);
};

/**
 * @override
 */
PSVNavBarGyroscopeButton.prototype.destroy = function() {
  this.psv.off('gyroscope-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * @override
 */
PSVNavBarGyroscopeButton.prototype.supported = function() {
  if (!PSVUtils.checkTHREE('DeviceOrientationControls')) {
    return false;
  }
  else {
    return PhotoSphereViewer.SYSTEM.deviceOrientationSupported;
  }
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVNavBarGyroscopeButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'gyroscope-updated': this.toggleActive(e.args[0]); break;
    // @formatter:on
  }
};

/**
 * @override
 * @description Toggles gyroscope control
 */
PSVNavBarGyroscopeButton.prototype._onClick = function() {
  this.psv.toggleGyroscopeControl();
};
