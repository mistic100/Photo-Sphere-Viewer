import { EVENTS } from '../data/constants';
import { AbstractComponent } from './AbstractComponent';
import { PSVError } from '../PSVError';

import '../styles/overlay.scss';

/**
 * @summary Overlay class
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.components
 */
export class Overlay extends AbstractComponent {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-overlay');

    /**
     * @override
     * @property {string} contentId
     * @property {boolean} dissmisable
     */
    this.prop = {
      ...this.prop,
      contentId  : undefined,
      dissmisable: true,
    };

    /**
     * Image container
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.image = document.createElement('div');
    this.image.className = 'psv-overlay-image';
    this.container.appendChild(this.image);

    /**
     * Text container
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.text = document.createElement('div');
    this.text.className = 'psv-overlay-text';
    this.container.appendChild(this.text);

    /**
     * Subtext container
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.subtext = document.createElement('div');
    this.subtext.className = 'psv-overlay-subtext';
    this.container.appendChild(this.subtext);

    this.container.addEventListener('mouseup', (e) => {
      e.stopPropagation();
      if (this.prop.dissmisable) {
        this.hide();
      }
    }, true);

    super.hide();
  }

  /**
   * @override
   */
  destroy() {
    delete this.image;
    delete this.text;
    delete this.subtext;

    super.destroy();
  }

  /**
   * @override
   * @param {string} [id]
   */
  isVisible(id) {
    return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
  }

  /**
   * @override
   */
  toggle() {
    throw new PSVError('Overlay cannot be toggled');
  }

  /**
   * @summary Displays an overlay on the viewer
   * @param {Object|string} config
   * @param {string} [config.id]
   * @param {string} config.image
   * @param {string} config.text
   * @param {string} [config.subtext]
   * @param {boolean} [config.dissmisable=true]
   * @fires PSV.show-overlay
   *
   * @example
   * viewer.showOverlay({
   *   image: '<svg></svg>',
   *   text: '....',
   *   subtext: '....'
   * })
   */
  show(config) {
    if (typeof config === 'string') {
      config = { text: config }; // eslint-disable-line no-param-reassign
    }

    this.prop.contentId = config.id;
    this.prop.dissmisable = config.dissmisable !== false;
    this.image.innerHTML = config.image || '';
    this.text.innerHTML = config.text || '';
    this.subtext.innerHTML = config.subtext || '';

    super.show();

    this.psv.trigger(EVENTS.SHOW_OVERLAY, config.id);
  }

  /**
   * @summary Hides the overlay
   * @param {string} [id]
   * @fires PSV.hide-overlay
   */
  hide(id) {
    if (this.isVisible() && (!id || !this.prop.contentId || this.prop.contentId === id)) {
      const contentId = this.prop.contentId;

      super.hide();

      this.prop.contentId = undefined;

      this.psv.trigger(EVENTS.HIDE_OVERLAY, contentId);
    }
  }

}
