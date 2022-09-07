import { AbstractButton } from '../..';
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
    this.plugin = this.psv.getPlugin('settings');

    /**
     * @member {HTMLElement}
     * @private
     * @readonly
     */
    this.badge = document.createElement('div');
    this.badge.className = 'psv-settings-badge';
    this.badge.style.display = 'none';
    this.container.appendChild(this.badge);
  }

  /**
   * @override
   */
  destroy() {
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
   * @override
   * @description Toggles settings
   */
  onClick() {
    this.plugin.toggleSettings();
  }

  /**
   * @summary Changes the badge value
   * @param {string} value
   */
  setBadge(value) {
    this.badge.innerText = value;
    this.badge.style.display = value ? '' : 'none';
  }

}
