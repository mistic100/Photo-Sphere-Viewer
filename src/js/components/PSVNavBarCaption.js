/**
 * Navbar caption class
 * @param {PSVNavBar} navbar
 * @param {string} caption
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVNavBarCaption(navbar, caption) {
  PSVComponent.call(this, navbar);

  /**
   * @member {HTMLElement}
   * @readonly
   * @private
   */
  this.content = null;

  /**
   * @member {SVGElement}
   * @readonly
   * @private
   */
  this.icon = null;

  /**
   * @member {Object}
   * @private
   */
  this.prop = {
    caption: '',
    width: 0,
    hidden: false
  };

  this.create();

  this.setCaption(caption);
}

PSVNavBarCaption.prototype = Object.create(PSVComponent.prototype);
PSVNavBarCaption.prototype.constructor = PSVNavBarCaption;

PSVNavBarCaption.className = 'psv-caption';
PSVNavBarCaption.publicMethods = ['setCaption'];

/**
 * @override
 */
PSVNavBarCaption.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.innerHTML = PhotoSphereViewer.ICONS['info.svg'];
  this.icon = this.container.querySelector('svg');
  this.icon.setAttribute('class', 'psv-caption-icon');
  this.icon.style.display = 'none';

  this.content = document.createElement('span');
  this.content.className = 'psv-caption-content';
  this.container.appendChild(this.content);

  this.icon.addEventListener('click', this);
  window.addEventListener('resize', this);
};

/**
 * @override
 */
PSVNavBarCaption.prototype.destroy = function() {
  window.removeEventListener('resize', this);

  delete this.content;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVNavBarCaption.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'resize': this._onResize(); break;
    case 'click':  this._onClick();  break;
    // @formatter:on
  }
};

/**
 * @summary Sets the bar caption
 * @param {string} html
 */
PSVNavBarCaption.prototype.setCaption = function(html) {
  if (!html) {
    this.prop.caption = '';
  }
  else {
    this.prop.caption = html;
  }

  this.content.innerHTML = this.prop.caption;

  this.content.style.display = '';
  this.prop.width = this.content.offsetWidth;

  this._onResize();
};

/**
 * @summary Toggles content and icon deending on available space
 * @private
 */
PSVNavBarCaption.prototype._onResize = function() {
  var width = parseInt(PSVUtils.getStyle(this.container, 'width')); // get real inner width

  if (width >= this.prop.width) {
    this.icon.style.display = 'none';
    this.content.style.display = '';
  }
  else {
    this.icon.style.display = '';
    this.content.style.display = 'none';
  }
};

/**
 * @summary Display caption as notification
 * @private
 */
PSVNavBarCaption.prototype._onClick = function() {
  if (this.psv.isNotificationVisible()) {
    this.psv.hideNotification();
  }
  else {
    this.psv.showNotification(this.prop.caption);
  }
};
