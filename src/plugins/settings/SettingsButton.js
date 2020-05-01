import { AbstractButton, CONSTANTS } from 'photo-sphere-viewer';
import SettingsPlugin from './index';
import icon from './settings.svg';

/**
 * @summary Navigation bar settings button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class SettingsButton extends AbstractButton {

  static id = 'settings';
  static icon = icon;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-settings-button', true);

    /**
     * @type {PSV.plugins.SettingsPlugin}
     * @private
     * @readonly
     */
    this.plugin = this.psv.getPlugin(SettingsPlugin.id);

    if (this.plugin) {
      this.psv.on(CONSTANTS.EVENTS.OPEN_PANEL, this);
      this.psv.on(CONSTANTS.EVENTS.CLOSE_PANEL, this);
    }
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.OPEN_PANEL, this);
    this.psv.off(CONSTANTS.EVENTS.CLOSE_PANEL, this);

    delete this.plugin;

    super.destroy();
  }

  /**
   * @override
   */
  isSupported() {
    return !!this.plugin;
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
      case CONSTANTS.EVENTS.OPEN_PANEL:  this.toggleActive(e.args[0] === SettingsPlugin.ID_PANEL); break;
      case CONSTANTS.EVENTS.CLOSE_PANEL: this.toggleActive(false); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles settings
   */
  onClick() {
    this.plugin.toggleSettings();
  }

}
