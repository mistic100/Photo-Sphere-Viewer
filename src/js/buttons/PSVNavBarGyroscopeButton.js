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

  PhotoSphereViewer.SYSTEM.deviceOrientationSupported.then(
    this._onAvailabilityChange.bind(this, true),
    this._onAvailabilityChange.bind(this, false)
  );

  this.hide();

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

/**
 * @summary Updates button display when API is ready
 * @param {boolean} available
 * @private
 * @throws {PSVError} when {@link THREE.DeviceOrientationControls} is not loaded
 */
PSVNavBarGyroscopeButton.prototype._onAvailabilityChange = function(available) {
  if (available) {
    if (PSVUtils.checkTHREE('DeviceOrientationControls')) {
      this.show();
    }
    else {
      throw new PSVError('Missing Three.js components: DeviceOrientationControls. Get them from three.js-examples package.');
    }
  }
};
