import { DescriptionButton } from '../buttons/DescriptionButton';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Navbar caption class
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.components
 */
export class NavbarCaption extends AbstractComponent {

  static id = 'caption';

  /**
   * @param {PSV.components.Navbar} navbar
   * @param {string} caption
   */
  constructor(navbar, caption) {
    super(navbar, 'psv-caption');

    /**
     * @override
     * @property {string} id
     * @property {boolean} collapsable
     * @property {number} width
     * @property {number} contentWidth - width of the caption content
     */
    this.prop = {
      ...this.prop,
      id          : this.constructor.id,
      collapsable : false,
      width       : 0,
      contentWidth: 0,
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
    delete this.content;

    super.destroy();
  }

  /**
   * @summary Sets the bar caption
   * @param {string} html
   */
  setCaption(html) {
    this.show();
    this.content.innerHTML = html;
    this.prop.contentWidth = html ? this.content.offsetWidth : 0;
    this.refreshUi();
  }

  /**
   * @summary Toggles content and icon depending on available space
   * @private
   */
  refreshUi() {
    this.toggle(this.container.offsetWidth >= this.prop.contentWidth);
    this.__refreshButton();
  }

  /**
   * @override
   */
  hide() {
    this.content.style.display = 'none';
    this.prop.visible = false;
  }

  /**
   * @override
   */
  show() {
    this.content.style.display = '';
    this.prop.visible = true;
  }

  /**
   * @private
   */
  __refreshButton() {
    this.psv.navbar.getButton(DescriptionButton.id, false)?.refreshUi(true);
  }

}
