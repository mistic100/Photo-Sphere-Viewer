import { SYSTEM } from '../data/system';
import { getStyle } from '../utils';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Loader class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVLoader extends AbstractComponent {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-loader-container');

    /**
     * @summary Inner container for vertical center
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.loader = document.createElement('div');
    this.loader.className = 'psv-loader';
    this.container.appendChild(this.loader);

    /**
     * @summary Animation canvas
     * @member {HTMLCanvasElement}
     * @readonly
     * @private
     */
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'psv-loader-canvas';

    this.canvas.width = this.loader.clientWidth * SYSTEM.pixelRatio;
    this.canvas.height = this.loader.clientWidth * SYSTEM.pixelRatio;
    this.loader.appendChild(this.canvas);

    /**
     * @override
     * @property {number} thickness
     */
    this.prop = {
      ...this.prop,
      tickness: (this.loader.offsetWidth - this.loader.clientWidth) / 2 * SYSTEM.pixelRatio,
    };

    let inner;
    if (this.psv.config.loadingImg) {
      inner = document.createElement('img');
      inner.className = 'psv-loader-image';
      inner.src = this.psv.config.loadingImg;
    }
    else if (this.psv.config.loadingTxt) {
      inner = document.createElement('div');
      inner.className = 'psv-loader-text';
      inner.innerHTML = this.psv.config.loadingTxt;
    }
    if (inner) {
      const size = Math.round(Math.sqrt(2 * Math.pow((this.canvas.width / 2 - this.prop.tickness / 2) / SYSTEM.pixelRatio, 2)));
      inner.style.maxWidth = size + 'px';
      inner.style.maxHeight = size + 'px';
      this.loader.appendChild(inner);
    }

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    delete this.loader;
    delete this.canvas;

    super.destroy();
  }

  /**
   * @summary Sets the loader progression
   * @param {number} value - from 0 to 100
   */
  setProgress(value) {
    const context = this.canvas.getContext('2d');

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    context.lineWidth = this.prop.tickness;
    context.strokeStyle = getStyle(this.loader, 'color');

    context.beginPath();
    context.arc(
      this.canvas.width / 2, this.canvas.height / 2,
      this.canvas.width / 2 - this.prop.tickness / 2,
      -Math.PI / 2, value / 100 * 2 * Math.PI - Math.PI / 2
    );
    context.stroke();
  }

}

export { PSVLoader };
