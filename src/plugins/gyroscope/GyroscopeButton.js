import { AbstractButton } from 'photo-sphere-viewer';
import compass from './compass.svg';
import GyroscopePlugin from './index';

/**
 * @summary Navigation bar gyroscope button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class GyroscopeButton extends AbstractButton {

  static id = 'gyroscope';
  static icon = compass;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-gyroscope-button', true);

    /**
     * @type {PSV.plugins.GyroscopePlugin}
     * @readonly
     * @private
     */
    this.plugin = this.psv.getPlugin(GyroscopePlugin.id);

    if (this.plugin) {
      this.plugin.on(GyroscopePlugin.EVENTS.GYROSCOPE_UPDATED, this);
    }
  }

  /**
   * @override
   */
  destroy() {
    if (this.plugin) {
      this.plugin.off(GyroscopePlugin.EVENTS.GYROSCOPE_UPDATED, this);
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
    if (e.type === GyroscopePlugin.EVENTS.GYROSCOPE_UPDATED) {
      this.toggleActive(e.args[0]);
    }
  }

  /**
   * @override
   * @description Toggles gyroscope control
   */
  onClick() {
    this.plugin.toggle();
  }

}
