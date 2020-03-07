import { AbstractButton } from 'photo-sphere-viewer';
import stereo from '../../icons/stereo.svg';
import StereoPlugin from './index';

/**
 * @summary Navigation bar stereo button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class StereoButton extends AbstractButton {

  static get id() {
    return 'stereo';
  }

  static get icon() {
    return stereo;
  }

  get collapsable() {
    return true;
  }

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-stereo-button');

    /**
     * @type {PSV.plugins.StereoPlugin}
     */
    this.plugin = this.psv.getPlugin(StereoPlugin.id);

    if (this.plugin) {
      this.plugin.on(StereoPlugin.EVENTS.STEREO_UPDATED, this);
    }
  }

  /**
   * @override
   */
  destroy() {
    if (this.plugin) {
      this.plugin.off(StereoPlugin.EVENTS.STEREO_UPDATED, this);
    }

    delete this.plugin;

    super.destroy();
  }

  /**
   * @override
   */
  isSupported() {
    return !this.plugin ? false : { initial: false, promise: this.plugin.prop.isSupported };
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    if (e.type === StereoPlugin.EVENTS.STEREO_UPDATED) {
      this.toggleActive(e.args[0]);
    }
  }

  /**
   * @override
   * @description Toggles stereo control
   */
  __onClick() {
    this.plugin.toggle();
  }

}
