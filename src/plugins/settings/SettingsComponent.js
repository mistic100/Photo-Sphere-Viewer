import { AbstractComponent, utils } from '../..';
import { EVENTS, KEY_CODES } from '../../data/constants';
import {
  ID_BACK,
  ID_ENTER,
  OPTION_DATA,
  SETTING_DATA,
  SETTING_OPTIONS_TEMPLATE,
  SETTINGS_TEMPLATE,
  TYPE_OPTIONS,
  TYPE_TOGGLE
} from './constants';

/**
 * @private
 */
export class SettingsComponent extends AbstractComponent {

  constructor(plugin) {
    super(plugin.psv, 'psv-settings psv--capture-event');

    /**
     * @type {PSV.plugins.SettingsPlugin}
     * @private
     * @readonly
     */
    this.plugin = plugin;

    /**
     * @type {Object}
     * @private
     */
    this.prop = {
      ...this.prop,
    };

    this.container.addEventListener('click', this);
    this.container.addEventListener('transitionend', this);
    this.container.addEventListener('keydown', this);

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    delete this.plugin;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      case 'click':
        this.__click(e.target);
        break;

      case 'transitionend':
        if (!this.isVisible()) {
          this.container.innerHTML = ''; // empty content after fade out
        }
        else {
          this.__focusFirstOption();
        }
        break;

      case 'keydown':
        if (this.isVisible()) {
          switch (e.key) {
            case KEY_CODES.Escape:
              this.plugin.hideSettings();
              break;
            case KEY_CODES.Enter:
              this.__click(e.target);
              break;
          }
        }
        break;

      case EVENTS.KEY_PRESS:
        if (this.isVisible() && e.args[0] === KEY_CODES.Escape) {
          this.plugin.hideSettings();
          e.preventDefault();
        }
        break;
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  show() {
    this.__showSettings(false);

    this.container.classList.add('psv-settings--open');
    this.prop.visible = true;
  }

  /**
   * @override
   */
  hide() {
    this.container.classList.remove('psv-settings--open');
    this.prop.visible = false;
  }

  /**
   * @summary Handle clicks on items
   * @param {HTMLElement} element
   * @private
   */
  __click(element) {
    const li = utils.getClosest(element, 'li');
    if (!li) {
      return;
    }

    const settingId = li.dataset[SETTING_DATA];
    const optionId = li.dataset[OPTION_DATA];

    const setting = this.plugin.settings.find(s => s.id === settingId);

    switch (optionId) {
      case ID_BACK:
        this.__showSettings(true);
        break;

      case ID_ENTER:
        switch (setting.type) {
          case TYPE_TOGGLE:
            this.plugin.toggleSettingValue(setting);
            this.__showSettings(true); // re-render
            break;

          case TYPE_OPTIONS:
            this.__showOptions(setting);
            break;

          default:
          // noop
        }
        break;

      default:
        switch (setting.type) {
          case TYPE_OPTIONS:
            this.hide();
            this.plugin.applySettingOption(setting, optionId);
            break;

          default:
          // noop
        }
        break;
    }
  }

  /**
   * @summary Shows the list of options
   * @private
   */
  __showSettings(focus) {
    this.container.innerHTML = SETTINGS_TEMPLATE(
      this.plugin.settings,
      (setting) => {
        const current = setting.current();
        const option = setting.options()
          .find(opt => opt.id === current);
        return option?.label;
      }
    );

    // must not focus during the initial transition
    if (focus) {
      this.__focusFirstOption();
    }
  }

  /**
   * @summary Shows setting options panel
   * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
   * @private
   */
  __showOptions(setting) {
    const current = setting.current();

    this.container.innerHTML = SETTING_OPTIONS_TEMPLATE(
      setting,
      (option) => {
        return option.id === current;
      }
    );

    this.__focusFirstOption();
  }

  __focusFirstOption() {
    this.container.querySelector('[tabindex]')?.focus();
  }

}
