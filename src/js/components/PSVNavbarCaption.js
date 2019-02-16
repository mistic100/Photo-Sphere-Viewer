import { PSVCaptionButton } from '../buttons/PSVCaptionButton';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Navbar caption class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVNavbarCaption extends AbstractComponent {

  static get id() {
    return 'caption';
  }

  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   * @param {string} caption
   */
  constructor(navbar, caption) {
    super(navbar, 'psv-caption');

    /**
     * @member {module:components/buttons.PSVCaptionButton}
     * @readonly
     * @private
     */
    this.button = new PSVCaptionButton(this);
    this.button.hide();

    /**
     * @override
     * @property {string} id
     * @property {number} width
     * @property {string} caption
     * @property {boolean} contentVisible - if the content is visible in the navbar
     * @property {number} contentWidth - with of the caption content
     */
    this.prop = {
      ...this.prop,
      id            : this.constructor.id,
      width         : this.button.prop.width,
      caption       : '',
      contentVisible: true,
      contentWidth  : 0,
    };

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.content = document.createElement('div');
    this.content.className = 'psv-caption-content';
    this.container.appendChild(this.content);

    this.setCaption(caption);
  }

  /**
   * @override
   */
  destroy() {
    delete this.button;
    delete this.content;

    super.destroy();
  }

  /**
   * @summary Sets the bar caption
   * @param {string} html
   */
  setCaption(html) {
    this.prop.caption = html || '';
    this.content.innerHTML = this.prop.caption;

    if (html) {
      this.show(false);

      this.content.style.display = '';
      this.prop.contentWidth = this.content.offsetWidth;

      this.refresh();
    }
    else {
      this.hide();
    }
  }

  /**
   * @summary Toggles content and icon depending on available space
   * @private
   */
  refresh() {
    const availableWidth = this.container.offsetWidth;
    if (availableWidth >= this.prop.contentWidth && !this.prop.contentVisible) {
      this.content.style.display = '';
      this.prop.contentVisible = true;
      this.button.hide(false);
    }
    else if (availableWidth < this.prop.contentWidth && this.prop.contentVisible) {
      this.content.style.display = 'none';
      this.prop.contentVisible = false;
      this.button.show(false);
    }
  }

}

export { PSVNavbarCaption };
