/**
 * Navigation bar gyroscope button class
 * @param {module:components.PSVNavBar} navbar
 * @constructor
 * @extends module:components/buttons.PSVNavBarButton
 * @memberof module:components/buttons
 */
function PSVNavBarStereoButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarStereoButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarStereoButton.prototype.constructor = PSVNavBarStereoButton;

PSVNavBarStereoButton.id = 'stereo';
PSVNavBarStereoButton.className = 'psv-button psv-button--hover-scale psv-stereo-button';
PSVNavBarStereoButton.icon = 'stereo.svg';

/**
 * @override
 * @description The button gets visible once the gyroscope API is ready
 */
PSVNavBarStereoButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  PhotoSphereViewer.SYSTEM.deviceOrientationSupported.then(
    this._onAvailabilityChange.bind(this, true),
    this._onAvailabilityChange.bind(this, false)
  );

  this.hide();

  this.psv.on('stereo-updated', this);
};

/**
 * @override
 */
PSVNavBarStereoButton.prototype.destroy = function() {
  this.psv.off('stereo-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVNavBarStereoButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'stereo-updated': this.toggleActive(e.args[0]); break;
    // @formatter:on
  }
};

/**
 * @override
 * @description Toggles gyroscope control
 */
PSVNavBarStereoButton.prototype._onClick = function() {
  this.psv.toggleStereoView();
};

/**
 * @summary Updates button display when API is ready
 * @param {boolean} available
 * @private
 * @throws {PSVError} when {@link THREE.DeviceOrientationControls} is not loaded
 */
PSVNavBarStereoButton.prototype._onAvailabilityChange = function(available) {
  if (available && PSVUtils.checkTHREE('DeviceOrientationControls', 'StereoEffect')) {
    this.show();
  }
};

