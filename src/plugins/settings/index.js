import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from '../..';
import { EVENTS, LOCAL_STORAGE_KEY, SETTINGS_TEMPLATE_, TYPE_OPTIONS, TYPE_TOGGLE } from './constants';
import { SettingsButton } from './SettingsButton';
import { SettingsComponent } from './SettingsComponent';
import './style.scss';


/**
 * @typedef {Object} PSV.plugins.SettingsPlugin.Setting
 * @summary Description of a setting
 * @property {string} id - identifier of the setting
 * @property {string} label - label of the setting
 * @property {'options' | 'toggle'} type - type of the setting
 * @property {function} [badge] - function which returns the value of the button badge
 */

/**
 * @typedef {PSV.plugins.SettingsPlugin.Setting} PSV.plugins.SettingsPlugin.OptionsSetting
 * @summary Description of a 'options' setting
 * @property {'options'} type - type of the setting
 * @property {function} current - function which returns the current option id
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
 */

/**
 * @typedef {Object} PSV.plugins.SettingsPlugin.Options
 * @property {boolean} [persist=false] - should the settings be saved accross sessions
 * @property {Object} [storage] - custom storage handler, defaults to LocalStorage
 * @property {PSV.plugins.SettingsPlugin.StorageGetter} [storage.get]
 * @property {PSV.plugins.SettingsPlugin.StorageSetter} [storage.set]
 */

/**
 * @callback StorageGetter
 * @memberOf PSV.plugins.SettingsPlugin
 * @param {string} settingId
 * @return {boolean | string | Promise<boolean | string>} - return `undefined` or `null` if the option does not exist
 */

/**
 * @callback StorageSetter
 * @memberOf PSV.plugins.SettingsPlugin
 * @param {string} settingId
 * @param {boolean | string} value
 */


// add settings button
DEFAULTS.lang[SettingsButton.id] = 'Settings';
registerButton(SettingsButton, 'fullscreen:left');


function getData() {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
}

function setData(data) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}


export { EVENTS, TYPE_TOGGLE, TYPE_OPTIONS } from './constants';


/**
 * @summary Adds a button to access various settings.
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class SettingsPlugin extends AbstractPlugin {

  static id = 'settings';

  static EVENTS = EVENTS;
  static TYPE_TOGGLE = TYPE_TOGGLE;
  static TYPE_OPTIONS = TYPE_OPTIONS;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.SettingsPlugin.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @type {PSV.plugins.SettingsPlugin.Options}
     */
    this.config = {
      persist: false,
      storage: {
        get(id) {
          return getData()[id];
        },
        set(id, value) {
          const data = getData();
          data[id] = value;
          setData(data);
        },
      },
      ...options,
    };

    /**
     * @type {SettingsComponent}
     * @private
     * @readonly
     */
    this.component = new SettingsComponent(this);

    /**
     * @type {PSV.plugins.SettingsPlugin.Setting[]}
     * @private
     */
    this.settings = [];
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.psv.on(CONSTANTS.EVENTS.CLICK, this);
    this.psv.on(CONSTANTS.EVENTS.OPEN_PANEL, this);

    // buttons are initialized just after plugins
    setTimeout(() => this.updateButton());
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.CLICK, this);
    this.psv.off(CONSTANTS.EVENTS.OPEN_PANEL, this);

    this.component.destroy();

    delete this.component;
    this.settings.length = 0;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case CONSTANTS.EVENTS.CLICK:
      case CONSTANTS.EVENTS.OPEN_PANEL:
        if (this.component.isVisible()) {
          this.hideSettings();
        }
        break;
    }
    /* eslint-enable */
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
    if (!SETTINGS_TEMPLATE_[setting.type]) {
      throw new PSVError('Unsupported setting type');
    }

    if (setting.badge && this.settings.some(s => s.badge)) {
      utils.logWarn('More than one setting with a badge are declared, the result is unpredictable.');
    }

    this.settings.push(setting);

    if (this.component.isVisible()) {
      this.component.show(); // re-render
    }

    this.updateButton();

    if (this.config.persist) {
      Promise.resolve(this.config.storage.get(setting.id))
        .then((value) => {
          switch (setting.type) {
            case TYPE_TOGGLE:
              if (!utils.isNil(value) && value !== setting.active()) {
                setting.toggle();
                this.trigger(EVENTS.SETTING_CHANGED, setting.id, setting.active());
              }
              break;

            case TYPE_OPTIONS:
              if (!utils.isNil(value) && value !== setting.current()) {
                setting.apply(value);
                this.trigger(EVENTS.SETTING_CHANGED, setting.id, setting.current());
              }
              break;

            default:
            // noop
          }

          this.updateButton();
        });
    }
  }

  /**
   * @summary Removes a setting
   * @param {string} id
   */
  removeSetting(id) {
    const idx = this.settings.findIndex(setting => setting.id === id);
    if (idx !== -1) {
      this.settings.splice(idx, 1);

      if (this.component.isVisible()) {
        this.component.show(); // re-render
      }

      this.updateButton();
    }
  }

  /**
   * @summary Toggles the settings menu
   */
  toggleSettings() {
    this.component.toggle();
    this.updateButton();
  }

  /**
   * @summary Hides the settings menu
   */
  hideSettings() {
    this.component.hide();
    this.updateButton();
  }

  /**
   * @summary Shows the settings menu
   */
  showSettings() {
    this.component.show();
    this.updateButton();
  }

  /**
   * @summary Updates the badge in the button
   */
  updateButton() {
    const value = this.settings.find(s => s.badge)?.badge();
    const button = this.psv.navbar.getButton(SettingsButton.id, false);
    button?.toggleActive(this.component.isVisible());
    button?.setBadge(value);
  }

  /**
   * @summary Toggles a setting
   * @param {PSV.plugins.SettingsPlugin.ToggleSetting} setting
   * @package
   */
  toggleSettingValue(setting) {
    const newValue = !setting.active(); // in case "toggle" is async

    setting.toggle();

    this.trigger(EVENTS.SETTING_CHANGED, setting.id, newValue);

    if (this.config.persist) {
      this.config.storage.set(setting.id, newValue);
    }

    this.updateButton();
  }

  /**
   * @summary Changes the value of an setting
   * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
   * @param {string} optionId
   * @package
   */
  applySettingOption(setting, optionId) {
    setting.apply(optionId);

    this.trigger(EVENTS.SETTING_CHANGED, setting.id, optionId);

    if (this.config.persist) {
      this.config.storage.set(setting.id, optionId);
    }

    this.updateButton();
  }

}
