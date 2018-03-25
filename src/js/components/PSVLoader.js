/**
 * Loader class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVLoader(psv) {
  PSVComponent.call(this, psv);

  /**
   * @summary Animation canvas
   * @member {HTMLCanvasElement}
   * @readonly
   * @private
   */
  this.canvas = null;

  /**
   * @summary Inner container for vertical center
   * @member {HTMLElement}
   * @readonly
   * @private
   */
  this.loader = null;

  this.create();
}

PSVLoader.prototype = Object.create(PSVComponent.prototype);
PSVLoader.prototype.constructor = PSVLoader;

PSVLoader.className = 'psv-loader-container';

/**
 * @override
 */
PSVLoader.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  var pixelRatio = PhotoSphereViewer.SYSTEM.pixelRatio;

  this.loader = document.createElement('div');
  this.loader.className = 'psv-loader';
  this.container.appendChild(this.loader);

  this.canvas = document.createElement('canvas');
  this.canvas.className = 'psv-loader-canvas';

  this.canvas.width = this.loader.clientWidth * pixelRatio;
  this.canvas.height = this.loader.clientWidth * pixelRatio;
  this.loader.appendChild(this.canvas);

  this.tickness = (this.loader.offsetWidth - this.loader.clientWidth) / 2 * pixelRatio;

  var inner;
  if (this.psv.config.loading_img) {
    inner = document.createElement('img');
    inner.className = 'psv-loader-image';
    inner.src = this.psv.config.loading_img;
  }
  else if (this.psv.config.loading_txt) {
    inner = document.createElement('div');
    inner.className = 'psv-loader-text';
    inner.innerHTML = this.psv.config.loading_txt;
  }
  if (inner) {
    var a = Math.round(Math.sqrt(2 * Math.pow((this.canvas.width / 2 - this.tickness / 2) / pixelRatio, 2)));
    inner.style.maxWidth = a + 'px';
    inner.style.maxHeight = a + 'px';
    this.loader.appendChild(inner);
  }
};

/**
 * @override
 */
PSVLoader.prototype.destroy = function() {
  delete this.loader;
  delete this.canvas;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Sets the loader progression
 * @param {int} value - from 0 to 100
 */
PSVLoader.prototype.setProgress = function(value) {
  var context = this.canvas.getContext('2d');

  context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  context.lineWidth = this.tickness;
  context.strokeStyle = PSVUtils.getStyle(this.loader, 'color');

  context.beginPath();
  context.arc(
    this.canvas.width / 2, this.canvas.height / 2,
    this.canvas.width / 2 - this.tickness / 2,
    -Math.PI / 2, value / 100 * 2 * Math.PI - Math.PI / 2
  );
  context.stroke();
};
