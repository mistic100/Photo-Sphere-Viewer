import { utils } from '../..';
import check from './check.svg';
import chevron from './chevron.svg';
import switchOff from './switch-off.svg';
import switchOn from './switch-on.svg';

/**
 * @summary Available events
 * @enum {string}
 * @memberof PSV.plugins.SettingsPlugin
 * @constant
 */
export const EVENTS = {
  /**
   * @event setting-changed
   * @memberof PSV.plugins.SettingsPlugin
   * @summary Triggered when a setting is changed
   * @param {string} settingId
   * @param {any} value
   */
  SETTING_CHANGED: 'setting-changed',
};

/**
 * @type {string}
 * @memberof PSV.plugins.SettingsPlugin
 * @constant
 */
export const TYPE_OPTIONS = 'options';

/**
 * @type {string}
 * @memberof PSV.plugins.SettingsPlugin
 * @constant
 */
export const TYPE_TOGGLE = 'toggle';

/**
 * @summary Key of settings in LocalStorage
 * @type {string}
 * @constant
 * @private
 */
export const LOCAL_STORAGE_KEY = 'psvSettings';

/**
 * @summary Panel identifier for settings content
 * @type {string}
 * @constant
 * @private
 */
export const ID_PANEL = 'settings';

/**
 * @summary Property name added to settings items
 * @type {string}
 * @constant
 * @private
 */
export const SETTING_DATA = 'settingId';

/**
 * @summary Property name added to settings items
 * @type {string}
 * @constant
 * @private
 */
export const OPTION_DATA = 'optionId';

/**
 * @summary Identifier of the "back" list item
 * @type {string}
 * @constant
 * @private
 */
export const ID_BACK = '__back';

/**
 * @summary Identifier of the "back" list item
 * @type {string}
 * @constant
 * @private
 */
export const ID_ENTER = '__enter';

const SETTING_DATA_KEY = utils.dasherize(SETTING_DATA);
const OPTION_DATA_KEY = utils.dasherize(OPTION_DATA);

/**
 * @summary Setting item template, by type
 * @constant
 * @private
 */
export const SETTINGS_TEMPLATE_ = {
  [TYPE_OPTIONS]: (setting, optionsCurrent) => `
      <span class="psv-settings-item-label">${setting.label}</span>
      <span class="psv-settings-item-value">${optionsCurrent(setting)}</span>
      <span class="psv-settings-item-icon">${chevron}</span>
    `,
  [TYPE_TOGGLE] : setting => `
      <span class="psv-settings-item-label">${setting.label}</span>
      <span class="psv-settings-item-value">${setting.active() ? switchOn : switchOff}</span>
    `,
};

/**
 * @summary Settings list template
 * @param {PSV.plugins.SettingsPlugin.Setting[]} settings
 * @param {function} optionsCurrent
 * @returns {string}
 * @constant
 * @private
 */
export const SETTINGS_TEMPLATE = (settings, optionsCurrent) => `
<ul class="psv-settings-list">
  ${settings.map(s => `
    <li class="psv-settings-item" tabindex="0"
        data-${SETTING_DATA_KEY}="${s.id}" data-${OPTION_DATA_KEY}="${ID_ENTER}">
      ${SETTINGS_TEMPLATE_[s.type](s, optionsCurrent)}
    </li>
  `).join('')}
</ul>
`;

/**
 * @summary Settings options template
 * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
 * @param {function} optionActive
 * @returns {string}
 * @constant
 * @private
 */
export const SETTING_OPTIONS_TEMPLATE = (setting, optionActive) => `
<ul class="psv-settings-list">
  <li class="psv-settings-item psv-settings-item--header" tabindex="0"
      data-${SETTING_DATA_KEY}="${setting.id}" data-${OPTION_DATA_KEY}="${ID_BACK}">
    <span class="psv-settings-item-icon">${chevron}</span>
    <span class="psv-settings-item-label">${setting.label}</span>
  </li>
  ${setting.options().map(option => `
    <li class="psv-settings-item" tabindex="0"
        data-${SETTING_DATA_KEY}="${setting.id}" data-${OPTION_DATA_KEY}="${option.id}">
      <span class="psv-settings-item-icon">${optionActive(option) ? check : ''}</span>
      <span class="psv-settings-item-value">${option.label}</span>
    </li>
  `).join('')}
</ul>
`;
