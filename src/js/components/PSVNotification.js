/**
 * Notification class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVNotification(psv) {
  PSVComponent.call(this, psv);

  this.create();
}

PSVNotification.prototype = Object.create(PSVComponent.prototype);
PSVNotification.prototype.constructor = PSVNotification;

PSVNotification.className = 'psv-notification';
PSVNotification.publicMethods = ['showNotification', 'hideNotification', 'isNotificationVisible'];

/**
 * @override
 */
PSVNotification.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.content = document.createElement('div');
  this.content.className = 'psv-notification-content';

  this.container.appendChild(this.content);

  this.content.addEventListener('click', this.hideNotification.bind(this));
};

/**
 * @override
 */
PSVNotification.prototype.destroy = function() {
  delete this.content;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Checks if the notification is visible
 * @returns {boolean}
 */
PSVNotification.prototype.isNotificationVisible = function() {
  return this.container.classList.contains('psv-notification--visible');
};

/**
 * @summary Displays a notification on the viewer
 * @param {Object|string} config
 * @param {string} config.content
 * @param {int} [config.timeout]
 *
 * @example
 * viewer.showNotification({ content: 'Hello world', timeout: 5000})
 * viewer.showNotification('Hello world')
 */
PSVNotification.prototype.showNotification = function(config) {
  if (typeof config === 'string') {
    config = {
      content: config
    };
  }

  this.content.innerHTML = config.content;

  this.container.classList.add('psv-notification--visible');

  /**
   * @event show-notification
   * @memberof module:components.PSVNotification
   * @summary Trigered when the notification is shown
   */
  this.psv.trigger('show-notification');

  if (config.timeout) {
    setTimeout(this.hideNotification.bind(this), config.timeout);
  }
};

/**
 * @summary Hides the notification
 * @fires module:components.PSVNotification.hide-notification
 */
PSVNotification.prototype.hideNotification = function() {
  if (this.isNotificationVisible()) {
    this.container.classList.remove('psv-notification--visible');

    /**
     * @event hide-notification
     * @memberof module:components.PSVNotification
     * @summary Trigered when the notification is hidden
     */
    this.psv.trigger('hide-notification');
  }
};
