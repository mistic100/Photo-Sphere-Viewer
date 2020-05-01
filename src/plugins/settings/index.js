import { AbstractPlugin, DEFAULTS, PSVError, registerButton, utils } from 'photo-sphere-viewer';
import check from './check.svg';
import chevron from './chevron.svg';
import icon from './settings.svg';
import { SettingsButton } from './SettingsButton';
import './style.scss';
import switchOff from './switch-off.svg';
import switchOn from './switch-on.svg';


// add settings button
DEFAULTS.navbar.splice(DEFAULTS.navbar.indexOf('fullscreen'), 0, SettingsButton.id);
DEFAULTS.lang[SettingsButton.id] = 'Settings';
registerButton(SettingsButton);

/**
 * @typedef {Object} PSV.plugins.SettingsPlugin.Setting
 * @summary Description of a setting
 * @property {string} id - identifier of the setting
 * @property {string} label - label of the setting
 * @property {'options' | 'toggle'} type - type of the setting
 */

/**
 * @typedef {PSV.plugins.SettingsPlugin.Setting} PSV.plugins.SettingsPlugin.OptionsSetting
 * @summary Description of a 'options' setting
 * @property {'options'} type - type of the setting
 * @property {function} current - function which returns the current value (human readable)
 * @property {function} options - function which the possible options as an array of {@link PSV.plugins.SettingsPlugin.Option}
 * @property {function} apply - function called with the id of the selected option
 */

/**
 * @typedef {PSV.plugins.SettingsPlugin.Setting} PSV.plugins.SettingsPlugin.ToggleSetting
 * @summary Description of a 'toggle' setting
 * @property {'toggle'} type - type of the setting
 * @property {function} active - function which return whereas the setting is active or not
 * @property {function} toggle - function called when the setting is toggled
 */

/**
 * @typedef {Object} PSV.plugins.SettingsPlugin.Option
 * @summary Option of an 'option' setting
 * @property {string} id - identifier of the option
 * @property {string} label - label of the option
 * @property {boolean} active - state of the option
 */

/**
 * @summary Adds a button to access various settings.
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class SettingsPlugin extends AbstractPlugin {

  static id = 'settings';

  /**
   * @summary Panel identifier for settings content
   * @type {string}
   * @constant
   */
  static ID_PANEL = 'settings';

  /**
   * @summary Property name added to settings items
   * @type {string}
   * @constant
   */
  static SETTING_DATA = 'settingId';

  /**
   * @summary Settings list template
   * @param {PSV.plugins.SettingsPlugin.Setting[]} settings
   * @param {string} title
   * @param {string} dataKey
   * @returns {string}
   */
  static SETTINGS_TEMPLATE = (settings, title, dataKey) => `
<h1 class="psv-settings-title">${icon} ${title}</h1>
<ul class="psv-settings-list">
  ${settings.map(s => `
    <li class="psv-settings-item" data-${dataKey}="${s.id}">
      ${SettingsPlugin.SETTINGS_TEMPLATE_[s.type](s)}
    </li>
  `).join('')}
</ul>`;

  /**
   * @summary Setting item template, by type
   */
  static SETTINGS_TEMPLATE_ = {
    options: setting => `
      <span class="psv-settings-item-label">${setting.label}</span> 
      <span class="psv-settings-item-value">${setting.current()}</span> 
      <span class="psv-settings-item-icon">${chevron}</span>
    `,
    toggle : setting => `
      <span class="psv-settings-item-label">${setting.label}</span>
      <span class="psv-settings-item-value">${setting.active() ? switchOn : switchOff}</span>
    `,
  };

  /**
   * @summary Settings options template
   * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
   * @param {string} title
   * @param {string} dataKey
   * @returns {string}
   */
  static SETTING_OPTIONS_TEMPLATE = (setting, title, dataKey) => `
<h1 class="psv-settings-title">${icon} ${title}</h1>
<ul class="psv-settings-list">
  <li class="psv-settings-item psv-settings-item--header" data-${dataKey}="__back">
    <span class="psv-settings-item-icon">${chevron}</span>
    <span class="psv-settings-item-label">${setting.label}</span>
  </li>
  ${setting.options().map(s => `
    <li class="psv-settings-item" data-${dataKey}="${s.id}">
      <span class="psv-settings-item-icon">${s.active ? check : ''}</span>
      <span class="psv-settings-item-value">${s.label}</span>
    </li>
  `).join('')}
</ul>`;

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @type {PSV.plugins.SettingsPlugin.Setting[]}
     * @private
     */
    this.settings = [];
  }

  /**
   * @package
   */
  destroy() {
    super.destroy();
  }

  /**
   * @summary Registers a new setting
   * @param {PSV.plugins.SettingsPlugin.Setting} setting
   */
  addSetting(setting) {
    if (!setting.id) {
      throw new PSVError('Missing setting id');
    }
    if (!setting.type) {
      throw new PSVError('Missing setting type');
    }
    if (!SettingsPlugin.SETTINGS_TEMPLATE_[setting.type]) {
      throw new PSVError('Unsupported setting type');
    }

    this.settings.push(setting);

    if (this.psv.panel.prop.contentId === SettingsPlugin.ID_PANEL) {
      this.showSettings();
    }
  }

  /**
   * @summary Removes a setting
   * @param {string} id
   */
  removeSetting(id) {
    let idx = -1;
    // FIXME use findIndex, one day, when IE11 is totally dead
    this.settings.some((setting, i) => {
      if (setting.id === id) {
        idx = i;
        return true;
      }
      return false;
    });
    if (idx !== -1) {
      this.settings.splice(idx, 1);

      if (this.psv.panel.prop.contentId === SettingsPlugin.ID_PANEL) {
        this.showSettings();
      }
    }
  }

  /**
   * @summary Toggles the settings panel
   */
  toggleSettings() {
    if (this.psv.panel.prop.contentId === SettingsPlugin.ID_PANEL) {
      this.hideSettings();
    }
    else {
      this.showSettings();
    }
  }

  /**
   * @summary Hides the settings panel
   */
  hideSettings() {
    this.psv.panel.hide(SettingsPlugin.ID_PANEL);
  }

  /**
   * @summary Shows the settings panel
   */
  showSettings() {
    this.psv.panel.show({
      id          : SettingsPlugin.ID_PANEL,
      content     : SettingsPlugin.SETTINGS_TEMPLATE(
        this.settings,
        this.psv.config.lang[SettingsButton.id],
        utils.dasherize(SettingsPlugin.SETTING_DATA)
      ),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const settingId = li ? li.dataset[SettingsPlugin.SETTING_DATA] : undefined;
        const setting = this.settings.find(s => s.id === settingId);

        if (setting) {
          switch (setting.type) {
            case 'toggle':
              setting.toggle();
              this.showSettings();
              break;

            case 'options':
              this.__showOptions(setting);
              break;

            default:
            // noop
          }
        }
      },
    });
  }

  /**
   * @summary Shows setting options panel
   * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
   * @private
   */
  __showOptions(setting) {
    this.psv.panel.show({
      id          : SettingsPlugin.ID_PANEL,
      content     : SettingsPlugin.SETTING_OPTIONS_TEMPLATE(
        setting,
        this.psv.config.lang[SettingsButton.id],
        utils.dasherize(SettingsPlugin.SETTING_DATA)
      ),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const optionId = li ? li.dataset[SettingsPlugin.SETTING_DATA] : undefined;

        if (optionId === '__back') {
          this.showSettings();
        }
        else {
          setting.apply(optionId);
          this.hideSettings();
        }
      },
    });
  }

}
