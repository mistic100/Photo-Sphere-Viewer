/**
 * Navigation bar caption button class
 * @param {module:components.PSVNavBarCaption} caption
 * @constructor
 * @extends module:components/buttons.PSVNavBarButton
 * @memberof module:components/buttons
 */
function PSVNavBarCaptionButton(caption) {
  PSVNavBarButton.call(this, caption);

  this.create();
}

PSVNavBarCaptionButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarCaptionButton.prototype.constructor = PSVNavBarCaptionButton;

PSVNavBarCaptionButton.id = 'markers';
PSVNavBarCaptionButton.className = 'psv-button psv-button--hover-scale psv-caption-button';
PSVNavBarCaptionButton.icon = 'info.svg';

/**
 * @override
 */
PSVNavBarCaptionButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.psv.on('hide-notification', this);
};

/**
 * @override
 */
PSVNavBarCaptionButton.prototype.destroy = function() {
  this.psv.off('hide-notification', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVNavBarCaptionButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'hide-notification': this.toggleActive(false); break;
    // @formatter:on
  }
};

/**
 * @override
 * @description Toggles markers list
 */
PSVNavBarCaptionButton.prototype._onClick = function() {
  if (this.psv.isNotificationVisible()) {
    this.psv.hideNotification();
  }
  else {
    this.psv.showNotification(this.parent.prop.caption);
    this.toggleActive(true);
  }
};
