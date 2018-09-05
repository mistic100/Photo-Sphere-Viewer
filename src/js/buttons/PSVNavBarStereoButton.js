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
 * @override
 */
PSVNavBarStereoButton.prototype.supported = function() {
  if (!PhotoSphereViewer.SYSTEM.fullscreenEvent || !PSVUtils.checkTHREE('DeviceOrientationControls')) {
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
