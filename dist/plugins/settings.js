/*!
* Photo Sphere Viewer 4.8.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.SettingsPlugin = {}), global.PhotoSphereViewer));
})(this, (function (exports, photoSphereViewer) { 'use strict';

  function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };
    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var check = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 90 90\"><polygon fill=\"currentColor\" points=\"0,48 10,35 36,57 78,10 90,21 37,79 \"/><!-- Created by Zahroe from the Noun Project --></svg>\n";

  var chevron = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M86.2 50.7l-44 44-9.9-9.9 34.1-34.1-34.7-34.8L41.6 6z\"/><!-- Created by Renee Ramsey-Passmore from the Noun Project--></svg>\n";

  var switchOff = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\" width=\"2.4em\" height=\"1.2em\"><path fill=\"currentColor\" transform=\"scale(1.88) translate(0, -25)\" d=\"M72 73.2H44A26.4 26.4 0 0044 30h28a21.6 21.6 0 010 43.2M7.2 51.6a21.6 21.6 0 1143.2 0 21.6 21.6 0 01-43.2 0M72 25.2H28.8a26.4 26.4 0 000 52.8H72a26.4 26.4 0 000-52.8\"/><!-- Created by Nikita from the Noun Project --></svg>\n";

  var switchOn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\" width=\"2.4em\" height=\"1.2em\"><path fill=\"currentColor\" transform=\"scale(1.88) translate(0, -25)\" d=\"M72 73.2A21.6 21.6 0 1172 30a21.6 21.6 0 010 43.2M2.4 51.6A26.4 26.4 0 0028.8 78H72a26.4 26.4 0 000-52.8H28.8A26.4 26.4 0 002.4 51.6\"/><!-- Created by Nikita from the Noun Project --></svg>\n";

  var _SETTINGS_TEMPLATE_;
  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.SettingsPlugin
   * @constant
   */

  var EVENTS$1 = {
    /**
     * @event setting-changed
     * @memberof PSV.plugins.SettingsPlugin
     * @summary Triggered when a setting is changed
     * @param {string} settingId
     * @param {any} value
     */
    SETTING_CHANGED: 'setting-changed'
  };
  /**
   * @type {string}
   * @memberof PSV.plugins.SettingsPlugin
   * @constant
   */

  var TYPE_OPTIONS = 'options';
  /**
   * @type {string}
   * @memberof PSV.plugins.SettingsPlugin
   * @constant
   */

  var TYPE_TOGGLE = 'toggle';
  /**
   * @summary Key of settings in LocalStorage
   * @type {string}
   * @constant
   * @private
   */

  var LOCAL_STORAGE_KEY = 'psvSettings';
  /**
   * @summary Property name added to settings items
   * @type {string}
   * @constant
   * @private
   */

  var SETTING_DATA = 'settingId';
  /**
   * @summary Property name added to settings items
   * @type {string}
   * @constant
   * @private
   */

  var OPTION_DATA = 'optionId';
  /**
   * @summary Identifier of the "back" list item
   * @type {string}
   * @constant
   * @private
   */

  var ID_BACK = '__back';
  /**
   * @summary Identifier of the "back" list item
   * @type {string}
   * @constant
   * @private
   */

  var ID_ENTER = '__enter';
  var SETTING_DATA_KEY = photoSphereViewer.utils.dasherize(SETTING_DATA);
  var OPTION_DATA_KEY = photoSphereViewer.utils.dasherize(OPTION_DATA);
  /**
   * @summary Setting item template, by type
   * @constant
   * @private
   */

  var SETTINGS_TEMPLATE_ = (_SETTINGS_TEMPLATE_ = {}, _SETTINGS_TEMPLATE_[TYPE_OPTIONS] = function (setting, optionsCurrent) {
    return "\n      <span class=\"psv-settings-item-label\">" + setting.label + "</span>\n      <span class=\"psv-settings-item-value\">" + optionsCurrent(setting) + "</span>\n      <span class=\"psv-settings-item-icon\">" + chevron + "</span>\n    ";
  }, _SETTINGS_TEMPLATE_[TYPE_TOGGLE] = function (setting) {
    return "\n      <span class=\"psv-settings-item-label\">" + setting.label + "</span>\n      <span class=\"psv-settings-item-value\">" + (setting.active() ? switchOn : switchOff) + "</span>\n    ";
  }, _SETTINGS_TEMPLATE_);
  /**
   * @summary Settings list template
   * @param {PSV.plugins.SettingsPlugin.Setting[]} settings
   * @param {function} optionsCurrent
   * @returns {string}
   * @constant
   * @private
   */

  var SETTINGS_TEMPLATE = function SETTINGS_TEMPLATE(settings, optionsCurrent) {
    return "\n<ul class=\"psv-settings-list\">\n  " + settings.map(function (s) {
      return "\n    <li class=\"psv-settings-item\" tabindex=\"0\"\n        data-" + SETTING_DATA_KEY + "=\"" + s.id + "\" data-" + OPTION_DATA_KEY + "=\"" + ID_ENTER + "\">\n      " + SETTINGS_TEMPLATE_[s.type](s, optionsCurrent) + "\n    </li>\n  ";
    }).join('') + "\n</ul>\n";
  };
  /**
   * @summary Settings options template
   * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
   * @param {function} optionActive
   * @returns {string}
   * @constant
   * @private
   */

  var SETTING_OPTIONS_TEMPLATE = function SETTING_OPTIONS_TEMPLATE(setting, optionActive) {
    return "\n<ul class=\"psv-settings-list\">\n  <li class=\"psv-settings-item psv-settings-item--header\" tabindex=\"0\"\n      data-" + SETTING_DATA_KEY + "=\"" + setting.id + "\" data-" + OPTION_DATA_KEY + "=\"" + ID_BACK + "\">\n    <span class=\"psv-settings-item-icon\">" + chevron + "</span>\n    <span class=\"psv-settings-item-label\">" + setting.label + "</span>\n  </li>\n  " + setting.options().map(function (option) {
      return "\n    <li class=\"psv-settings-item\" tabindex=\"0\"\n        data-" + SETTING_DATA_KEY + "=\"" + setting.id + "\" data-" + OPTION_DATA_KEY + "=\"" + option.id + "\">\n      <span class=\"psv-settings-item-icon\">" + (optionActive(option) ? check : '') + "</span>\n      <span class=\"psv-settings-item-value\">" + option.label + "</span>\n    </li>\n  ";
    }).join('') + "\n</ul>\n";
  };

  var icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M98.4 43.7c-.8-.5-7-4.3-9.6-5.4l-3-7.5c.9-2.5 2.6-9.4 3-10.6a3.3 3.3 0 00-1-3.1L83 12.2a3.3 3.3 0 00-3-.9c-1 .2-8 2-10.7 3l-7.5-3.1c-1-2.4-4.8-8.6-5.4-9.6A3.3 3.3 0 0053.4 0h-6.8a3.4 3.4 0 00-2.9 1.6c-.5.8-4.2 7-5.4 9.6l-7.5 3-10.6-3a3.3 3.3 0 00-3.1 1L12.2 17a3.3 3.3 0 00-.9 3c.2 1 2 8 3 10.7l-3.1 7.5c-2.4 1-8.6 4.8-9.6 5.4A3.3 3.3 0 000 46.6v6.8a3.4 3.4 0 001.6 2.9c.8.5 7 4.2 9.6 5.4l3 7.5-3 10.6a3.3 3.3 0 001 3.1l4.8 4.9a3.3 3.3 0 003.1.9c1-.2 8-2 10.7-3l7.5 3c1 2.5 4.7 8.6 5.4 9.7a3.3 3.3 0 002.9 1.6h6.8a3.4 3.4 0 002.9-1.6c.5-.8 4.2-7 5.4-9.6l7.5-3c2.5.9 9.4 2.6 10.6 3a3.3 3.3 0 003.1-1l4.9-4.8a3.3 3.3 0 00.9-3.1c-.2-1-2-8-3-10.7l3-7.5c2.5-1 8.6-4.7 9.7-5.4a3.3 3.3 0 001.6-2.9v-6.8a3.3 3.3 0 00-1.6-2.9zM50 71.7A21.8 21.8 0 1171.8 50 21.8 21.8 0 0150 71.8z\"/><!-- Created by i cons from the Noun Project --></svg>\n";

  /**
   * @summary Navigation bar settings button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var SettingsButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(SettingsButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function SettingsButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-settings-button', true) || this;
      /**
       * @type {PSV.plugins.SettingsPlugin}
       * @private
       * @readonly
       */

      _this.plugin = _this.psv.getPlugin('settings');
      /**
       * @member {HTMLElement}
       * @private
       * @readonly
       */

      _this.badge = document.createElement('div');
      _this.badge.className = 'psv-settings-badge';
      _this.badge.style.display = 'none';

      _this.container.appendChild(_this.badge);

      return _this;
    }
    /**
     * @override
     */


    var _proto = SettingsButton.prototype;

    _proto.destroy = function destroy() {
      delete this.plugin;

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return !!this.plugin;
    }
    /**
     * @override
     * @description Toggles settings
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.toggleSettings();
    }
    /**
     * @summary Changes the badge value
     * @param {string} value
     */
    ;

    _proto.setBadge = function setBadge(value) {
      this.badge.innerText = value;
      this.badge.style.display = value ? '' : 'none';
    };

    return SettingsButton;
  }(photoSphereViewer.AbstractButton);
  SettingsButton.id = 'settings';
  SettingsButton.icon = icon;

  /**
   * @namespace PSV.constants
   */
  /**
   * @summary Available events names
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var EVENTS = {
    /**
     * @event autorotate
     * @memberof PSV
     * @summary Triggered when the automatic rotation is enabled/disabled
     * @param {boolean} enabled
     */
    AUTOROTATE: 'autorotate',

    /**
     * @event before-render
     * @memberof PSV
     * @summary Triggered before a render, used to modify the view
     * @param {number} timestamp - time provided by requestAnimationFrame
     * @param {number} elapsed - time elapsed from the previous frame
     */
    BEFORE_RENDER: 'before-render',

    /**
     * @event before-rotate
     * @memberOf PSV
     * @summary Triggered before a rotate operation, can be cancelled
     * @param {PSV.ExtendedPosition}
     */
    BEFORE_ROTATE: 'before-rotate',

    /**
     * @event click
     * @memberof PSV
     * @summary Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
     * @param {PSV.ClickData} data
     */
    CLICK: 'click',

    /**
     * @event close-panel
     * @memberof PSV
     * @summary Triggered when the panel is closed
     * @param {string} [id]
     */
    CLOSE_PANEL: 'close-panel',

    /**
     * @event config-changed
     * @memberOf PSV
     * @summary Triggered after a call to setOption/setOptions
     * @param {string[]} name of changed options
     */
    CONFIG_CHANGED: 'config-changed',

    /**
     * @event dblclick
     * @memberof PSV
     * @summary Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`
     * @param {PSV.ClickData} data
     */
    DOUBLE_CLICK: 'dblclick',

    /**
     * @event fullscreen-updated
     * @memberof PSV
     * @summary Triggered when the fullscreen mode is enabled/disabled
     * @param {boolean} enabled
     */
    FULLSCREEN_UPDATED: 'fullscreen-updated',

    /**
     * @event hide-notification
     * @memberof PSV
     * @summary Triggered when the notification is hidden
     * @param {string} [id]
     */
    HIDE_NOTIFICATION: 'hide-notification',

    /**
     * @event hide-overlay
     * @memberof PSV
     * @summary Triggered when the overlay is hidden
     * @param {string} [id]
     */
    HIDE_OVERLAY: 'hide-overlay',

    /**
     * @event hide-tooltip
     * @memberof PSV
     * @summary Triggered when the tooltip is hidden
     * @param {*} Data associated to this tooltip
     */
    HIDE_TOOLTIP: 'hide-tooltip',

    /**
     * @event key-press
     * @memberof PSV
     * @summary Triggered when a key is pressed, can be cancelled
     * @param {string} key
     */
    KEY_PRESS: 'key-press',

    /**
     * @event load-progress
     * @memberof PSV
     * @summary Triggered when the loader value changes
     * @param {number} value from 0 to 100
     */
    LOAD_PROGRESS: 'load-progress',

    /**
     * @event open-panel
     * @memberof PSV
     * @summary Triggered when the panel is opened
     * @param {string} [id]
     */
    OPEN_PANEL: 'open-panel',

    /**
     * @event panorama-loaded
     * @memberof PSV
     * @summary Triggered when a panorama image has been loaded
     * @param {PSV.TextureData} textureData
     */
    PANORAMA_LOADED: 'panorama-loaded',

    /**
     * @event position-updated
     * @memberof PSV
     * @summary Triggered when the view longitude and/or latitude changes
     * @param {PSV.Position} position
     */
    POSITION_UPDATED: 'position-updated',

    /**
     * @event ready
     * @memberof PSV
     * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
     */
    READY: 'ready',

    /**
     * @event render
     * @memberof PSV
     * @summary Triggered on each viewer render, **this event is triggered very often**
     */
    RENDER: 'render',

    /**
     * @event show-notification
     * @memberof PSV
     * @summary Triggered when the notification is shown
     * @param {string} [id]
     */
    SHOW_NOTIFICATION: 'show-notification',

    /**
     * @event show-overlay
     * @memberof PSV
     * @summary Triggered when the overlay is shown
     * @param {string} [id]
     */
    SHOW_OVERLAY: 'show-overlay',

    /**
     * @event show-tooltip
     * @memberof PSV
     * @summary Triggered when the tooltip is shown
     * @param {*} Data associated to this tooltip
     * @param {PSV.components.Tooltip} Instance of the tooltip
     */
    SHOW_TOOLTIP: 'show-tooltip',

    /**
     * @event size-updated
     * @memberof PSV
     * @summary Triggered when the viewer size changes
     * @param {PSV.Size} size
     */
    SIZE_UPDATED: 'size-updated',

    /**
     * @event stop-all
     * @memberof PSV
     * @summary Triggered when all current animations are stopped
     */
    STOP_ALL: 'stop-all',

    /**
     * @event zoom-updated
     * @memberof PSV
     * @summary Triggered when the zoom level changes
     * @param {number} zoomLevel
     */
    ZOOM_UPDATED: 'zoom-updated'
  };

  /* eslint-enable */

  /**
   * @summary Subset of key codes
   * @memberOf PSV.constants
   * @type {Object<string, string>}
   * @constant
   */

  var KEY_CODES = {
    Enter: 'Enter',
    Control: 'Control',
    Escape: 'Escape',
    Space: ' ',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowLeft: 'ArrowLeft',
    ArrowUp: 'ArrowUp',
    ArrowRight: 'ArrowRight',
    ArrowDown: 'ArrowDown',
    Delete: 'Delete',
    Plus: '+',
    Minus: '-'
  };

  /**
   * @private
   */

  var SettingsComponent = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(SettingsComponent, _AbstractComponent);

    function SettingsComponent(plugin) {
      var _this;

      _this = _AbstractComponent.call(this, plugin.psv, 'psv-settings psv--capture-event') || this;
      /**
       * @type {PSV.plugins.SettingsPlugin}
       * @private
       * @readonly
       */

      _this.plugin = plugin;
      /**
       * @type {Object}
       * @private
       */

      _this.prop = _extends({}, _this.prop);

      _this.container.addEventListener('click', _assertThisInitialized(_this));

      _this.container.addEventListener('transitionend', _assertThisInitialized(_this));

      _this.container.addEventListener('keydown', _assertThisInitialized(_this));

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = SettingsComponent.prototype;

    _proto.destroy = function destroy() {
      delete this.plugin;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case 'click':
          this.__click(e.target);

          break;

        case 'transitionend':
          if (!this.isVisible()) {
            this.container.innerHTML = ''; // empty content after fade out
          } else {
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
    ;

    _proto.show = function show() {
      this.__showSettings(false);

      this.container.classList.add('psv-settings--open');
      this.prop.visible = true;
    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-settings--open');
      this.prop.visible = false;
    }
    /**
     * @summary Handle clicks on items
     * @param {HTMLElement} element
     * @private
     */
    ;

    _proto.__click = function __click(element) {
      var li = photoSphereViewer.utils.getClosest(element, 'li');

      if (!li) {
        return;
      }

      var settingId = li.dataset[SETTING_DATA];
      var optionId = li.dataset[OPTION_DATA];
      var setting = this.plugin.settings.find(function (s) {
        return s.id === settingId;
      });

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

          }

          break;

        default:
          switch (setting.type) {
            case TYPE_OPTIONS:
              this.hide();
              this.plugin.applySettingOption(setting, optionId);
              break;

          }

          break;
      }
    }
    /**
     * @summary Shows the list of options
     * @private
     */
    ;

    _proto.__showSettings = function __showSettings(focus) {
      this.container.innerHTML = SETTINGS_TEMPLATE(this.plugin.settings, function (setting) {
        var current = setting.current();
        var option = setting.options().find(function (opt) {
          return opt.id === current;
        });
        return option == null ? void 0 : option.label;
      }); // must not focus during the initial transition

      if (focus) {
        this.__focusFirstOption();
      }
    }
    /**
     * @summary Shows setting options panel
     * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
     * @private
     */
    ;

    _proto.__showOptions = function __showOptions(setting) {
      var current = setting.current();
      this.container.innerHTML = SETTING_OPTIONS_TEMPLATE(setting, function (option) {
        return option.id === current;
      });

      this.__focusFirstOption();
    };

    _proto.__focusFirstOption = function __focusFirstOption() {
      var _this$container$query;

      (_this$container$query = this.container.querySelector('[tabindex]')) == null ? void 0 : _this$container$query.focus();
    };

    return SettingsComponent;
  }(photoSphereViewer.AbstractComponent);

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

  photoSphereViewer.DEFAULTS.lang[SettingsButton.id] = 'Settings';
  photoSphereViewer.registerButton(SettingsButton, 'fullscreen:left');

  function getData() {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
  }

  function setData(data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
  /**
   * @summary Adds a button to access various settings.
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var SettingsPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(SettingsPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.SettingsPlugin.Options} options
     */
    function SettingsPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @type {PSV.plugins.SettingsPlugin.Options}
       */

      _this.config = _extends({
        persist: false,
        storage: {
          get: function get(id) {
            return getData()[id];
          },
          set: function set(id, value) {
            var data = getData();
            data[id] = value;
            setData(data);
          }
        }
      }, options);
      /**
       * @type {SettingsComponent}
       * @private
       * @readonly
       */

      _this.component = new SettingsComponent(_assertThisInitialized(_this));
      /**
       * @type {PSV.plugins.SettingsPlugin.Setting[]}
       * @private
       */

      _this.settings = [];
      return _this;
    }
    /**
     * @package
     */


    var _proto = SettingsPlugin.prototype;

    _proto.init = function init() {
      var _this2 = this;

      _AbstractPlugin.prototype.init.call(this);

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL, this); // buttons are initialized just after plugins

      setTimeout(function () {
        return _this2.updateButton();
      });
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL, this);
      this.component.destroy();
      delete this.component;
      this.settings.length = 0;

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.CLICK:
        case photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL:
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
    ;

    _proto.addSetting = function addSetting(setting) {
      var _this3 = this;

      if (!setting.id) {
        throw new photoSphereViewer.PSVError('Missing setting id');
      }

      if (!setting.type) {
        throw new photoSphereViewer.PSVError('Missing setting type');
      }

      if (!SETTINGS_TEMPLATE_[setting.type]) {
        throw new photoSphereViewer.PSVError('Unsupported setting type');
      }

      if (setting.badge && this.settings.some(function (s) {
        return s.badge;
      })) {
        photoSphereViewer.utils.logWarn('More than one setting with a badge are declared, the result is unpredictable.');
      }

      this.settings.push(setting);

      if (this.component.isVisible()) {
        this.component.show(); // re-render
      }

      this.updateButton();

      if (this.config.persist) {
        Promise.resolve(this.config.storage.get(setting.id)).then(function (value) {
          switch (setting.type) {
            case TYPE_TOGGLE:
              if (!photoSphereViewer.utils.isNil(value) && value !== setting.active()) {
                setting.toggle();

                _this3.trigger(EVENTS$1.SETTING_CHANGED, setting.id, setting.active());
              }

              break;

            case TYPE_OPTIONS:
              if (!photoSphereViewer.utils.isNil(value) && value !== setting.current()) {
                setting.apply(value);

                _this3.trigger(EVENTS$1.SETTING_CHANGED, setting.id, setting.current());
              }

              break;

          }

          _this3.updateButton();
        });
      }
    }
    /**
     * @summary Removes a setting
     * @param {string} id
     */
    ;

    _proto.removeSetting = function removeSetting(id) {
      var idx = this.settings.findIndex(function (setting) {
        return setting.id === id;
      });

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
    ;

    _proto.toggleSettings = function toggleSettings() {
      this.component.toggle();
      this.updateButton();
    }
    /**
     * @summary Hides the settings menu
     */
    ;

    _proto.hideSettings = function hideSettings() {
      this.component.hide();
      this.updateButton();
    }
    /**
     * @summary Shows the settings menu
     */
    ;

    _proto.showSettings = function showSettings() {
      this.component.show();
      this.updateButton();
    }
    /**
     * @summary Updates the badge in the button
     */
    ;

    _proto.updateButton = function updateButton() {
      var _this$settings$find;

      var value = (_this$settings$find = this.settings.find(function (s) {
        return s.badge;
      })) == null ? void 0 : _this$settings$find.badge();
      var button = this.psv.navbar.getButton(SettingsButton.id, false);
      button == null ? void 0 : button.toggleActive(this.component.isVisible());
      button == null ? void 0 : button.setBadge(value);
    }
    /**
     * @summary Toggles a setting
     * @param {PSV.plugins.SettingsPlugin.ToggleSetting} setting
     * @package
     */
    ;

    _proto.toggleSettingValue = function toggleSettingValue(setting) {
      var newValue = !setting.active(); // in case "toggle" is async

      setting.toggle();
      this.trigger(EVENTS$1.SETTING_CHANGED, setting.id, newValue);

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
    ;

    _proto.applySettingOption = function applySettingOption(setting, optionId) {
      setting.apply(optionId);
      this.trigger(EVENTS$1.SETTING_CHANGED, setting.id, optionId);

      if (this.config.persist) {
        this.config.storage.set(setting.id, optionId);
      }

      this.updateButton();
    };

    return SettingsPlugin;
  }(photoSphereViewer.AbstractPlugin);
  SettingsPlugin.id = 'settings';
  SettingsPlugin.EVENTS = EVENTS$1;
  SettingsPlugin.TYPE_TOGGLE = TYPE_TOGGLE;
  SettingsPlugin.TYPE_OPTIONS = TYPE_OPTIONS;

  exports.EVENTS = EVENTS$1;
  exports.SettingsPlugin = SettingsPlugin;
  exports.TYPE_OPTIONS = TYPE_OPTIONS;
  exports.TYPE_TOGGLE = TYPE_TOGGLE;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=settings.js.map
