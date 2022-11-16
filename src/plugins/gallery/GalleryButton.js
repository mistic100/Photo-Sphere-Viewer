import { AbstractButton } from '../..';
import { EVENTS } from './constants';
import gallery from './gallery.svg';

/**
 * @summary Navigation bar gallery button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class GalleryButton extends AbstractButton {

  static id = 'gallery';
  static icon = gallery;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-gallery-button', true);

    /**
     * @type {PSV.plugins.GalleryPlugin}
     * @readonly
     * @private
     */
    this.plugin = this.psv.getPlugin('gallery');

    if (this.plugin) {
      this.plugin.on(EVENTS.SHOW_GALLERY, this);
      this.plugin.on(EVENTS.HIDE_GALLERY, this);
    }

    if (!this.plugin?.items.length) {
      this.hide();
    }
  }

  /**
   * @override
   */
  destroy() {
    if (this.plugin) {
      this.plugin.off(EVENTS.SHOW_GALLERY, this);
      this.plugin.off(EVENTS.HIDE_GALLERY, this);
    }

    delete this.plugin;

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    if (e.type === EVENTS.SHOW_GALLERY) {
      this.toggleActive(true);
    }
    else if (e.type === EVENTS.HIDE_GALLERY) {
      this.toggleActive(false);
    }
  }

  /**
   * @override
   */
  isSupported() {
    return !!this.plugin;
  }

  /**
   * @override
   * @description Toggles gallery
   */
  onClick() {
    this.plugin.toggle();
  }

}
