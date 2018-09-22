import { PSVCaptionButton } from '../buttons/PSVCaptionButton';
import { AbstractComponent } from './AbstractComponent';
import { EVENTS } from '../data/constants';

/**
 * @summary Navbar caption class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVNavbarCaption extends AbstractComponent {

  /**
   * @param {module:components.PSVNavbar} navbar
   * @param {string} caption
   */
  constructor(navbar, caption) {
    super(navbar, 'psv-caption');

    /**
     * @summary Unique identifier of the button
     * @member {string}
     * @readonly
     */
    this.id = 'caption';

    /**
     * @member {Object}
     * @private
     */
    this.prop = {
      caption: '',
      width  : 0,
    };

    /**
     * @member {module:components/buttons.PSVCaptionButton}
     * @readonly
     * @private
     */
    this.button = new PSVCaptionButton(this);
    this.button.hide();

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.content = document.createElement('div');
    this.content.className = 'psv-caption-content';
    this.container.appendChild(this.content);

    this.psv.on(EVENTS.SIZE_UPDATED, this);

    this.setCaption(caption);
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.SIZE_UPDATED, this);

    this.button.destroy();

    delete this.button;
    delete this.content;

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case EVENTS.SIZE_UPDATED: this.__onResize(); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @summary Sets the bar caption
   * @param {string} html
   */
  setCaption(html) {
    this.prop.caption = html || '';

    this.content.innerHTML = this.prop.caption;

    this.button.hide();
    this.content.style.display = '';
    this.prop.width = this.content.offsetWidth;

    this.__onResize();
  }

  /**
   * @summary Toggles content and icon depending on available space
   * @private
   */
  __onResize() {
    if (this.container.offsetWidth >= this.prop.width) {
      this.button.hide();
      this.content.style.display = '';
    }
    else {
      this.button.show();
      this.content.style.display = 'none';
    }
  }

}

export { PSVNavbarCaption };
