/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.GalleryPlugin = {}), global.PhotoSphereViewer));
})(this, (function (exports, photoSphereViewer) { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
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
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
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

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _createForOfIteratorHelperLoose(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);

    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      return function () {
        if (i >= o.length) return {
          done: true
        };
        return {
          done: false,
          value: o[i++]
        };
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.GalleryPlugin
   * @constant
   */

  var EVENTS = {
    /**
     * @event show-gallery
     * @memberof PSV.plugins.GalleryPlugin
     * @summary Triggered when the gallery is shown
     */
    SHOW_GALLERY: 'show-gallery',

    /**
     * @event hide-gallery
     * @memberof PSV.plugins.GalleryPlugin
     * @summary Triggered when the gallery is hidden
     */
    HIDE_GALLERY: 'hide-gallery'
  };
  /**
   * @summary Property name added to gallery items
   * @type {string}
   * @constant
   * @private
   */

  var GALLERY_ITEM_DATA = 'psvGalleryItem';
  /**
   * @summary Property name added to gallery items (dash-case)
   * @type {string}
   * @constant
   * @private
   */

  var GALLERY_ITEM_DATA_KEY = photoSphereViewer.utils.dasherize(GALLERY_ITEM_DATA);
  /**
   * @summary Gallery template
   * @param {PSV.plugins.GalleryPlugin.Item[]} items
   * @param {PSV.Size} size
   * @returns {string}
   * @constant
   * @private
   */

  var ITEMS_TEMPLATE = function ITEMS_TEMPLATE(items, size) {
    return "\n<div class=\"psv-gallery-container\">\n  " + items.map(function (item) {
      return "\n  <div class=\"psv-gallery-item\" data-" + GALLERY_ITEM_DATA_KEY + "=\"" + item.id + "\" style=\"width:" + size.width + "px\">\n    <div class=\"psv-gallery-item-wrapper\" style=\"padding-bottom:calc(100% * " + size.height + " / " + size.width + ")\">\n      " + (item.name ? "<div class=\"psv-gallery-item-title\"><span>" + item.name + "</span></div>" : '') + "\n      <svg class=\"psv-gallery-item-thumb\" viewBox=\"0 0 200 200\" preserveAspectRatio=\"xMidYMid slice\"><use href=\"#psvGalleryBlankIcon\"></use></svg>\n      " + (item.thumbnail ? "<div class=\"psv-gallery-item-thumb\" data-src=\"" + item.thumbnail + "\"></div>" : '') + "\n    </div>\n  </div>\n  ";
    }).join('') + "\n</div>\n";
  };

  var gallery = "<svg viewBox=\"185 115 330 330\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M186.7 326.7V163.3c0-15 8.3-23.3 23.3-23.3h210c15 0 23.3 8.3 23.3 23.3v163.4c0 15-8.3 23.3-23.3 23.3H210c-15 0-23.3-8.3-23.3-23.3zm70 70v-23.4H420c30.2 0 46.7-16.4 46.7-46.6V210H490c15 0 23.3 8.3 23.3 23.3v163.4c0 15-8.3 23.3-23.3 23.3H280c-15 0-23.3-8.3-23.3-23.3zm-23.8-105H397l-40-50.4-26.7 29.7-44.3-54.5zm106.7-76c9.6 0 17.8-7.8 17.8-17.2a18 18 0 0 0-17.8-17.8c-9.4 0-17.2 8.2-17.2 17.8 0 9.4 7.8 17.2 17.2 17.2z\"/><!--Created by Wolf Böse from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar gallery button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var GalleryButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(GalleryButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function GalleryButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-gallery-button', true) || this;
      /**
       * @type {PSV.plugins.GalleryPlugin}
       * @readonly
       * @private
       */

      _this.plugin = _this.psv.getPlugin('gallery');

      if (_this.plugin) {
        _this.plugin.on(EVENTS.SHOW_GALLERY, _assertThisInitialized(_this));

        _this.plugin.on(EVENTS.HIDE_GALLERY, _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = GalleryButton.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.plugin.off(EVENTS.SHOW_GALLERY, this);
        this.plugin.off(EVENTS.HIDE_GALLERY, this);
      }

      delete this.plugin;

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      if (e.type === EVENTS.SHOW_GALLERY) {
        this.toggleActive(true);
      } else if (e.type === EVENTS.HIDE_GALLERY) {
        this.toggleActive(false);
      }
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
     * @description Toggles gallery
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.toggle();
    };

    return GalleryButton;
  }(photoSphereViewer.AbstractButton);
  GalleryButton.id = 'gallery';
  GalleryButton.icon = gallery;

  var blankIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n  <defs>\n    <symbol id=\"psvGalleryBlankIcon\" viewBox=\"0 0 200 200\">\n      <rect x=\"0\" y=\"0\" width=\"200\" height=\"200\" fill=\"#666\"/>\n      <g transform=\"scale(0.25) translate(25 20) \" fill=\"#eee\">\n        <path d=\"M376 220.61c-85.84 0-155.39 69.56-155.39 155.39 0 85.84 69.56 155.39 155.39 155.39 85.84 0 155.39-69.56 155.39-155.39 0-85.84-69.56-155.39-155.39-155.39zm0 300.92c-80.41 0-145.53-65.12-145.53-145.53S295.59 230.47 376 230.47 521.53 295.59 521.53 376 456.41 521.53 376 521.53z\"/>\n        <path d=\"M467.27 300.03H284.74a18.21 18.21 0 0 0-18.25 18.25v115.43a18.21 18.21 0 0 0 18.25 18.26h182.53a18.21 18.21 0 0 0 18.25-18.26V318.28a18.2 18.2 0 0 0-18.25-18.25zm-190.91 18.25a8.64 8.64 0 0 1 8.39-8.38h182.53a8.64 8.64 0 0 1 8.38 8.38V413l-44.89-35.52c-.49-.5-.99-.5-1.48-.99h-2.46c-.5 0-1 0-1.48.5l-37.5 21.2-43.9-58.7-.5-.5s0-.48-.49-.48c0 0-.49 0-.49-.5-.49 0-.49-.49-.99-.49-.49 0-.49 0-.98-.49H337.53c-.5 0-.5.5-.99.5h-.49l-.5.48s-.48 0-.48.5l-58.7 65.12zM467.27 442.1H284.74a8.64 8.64 0 0 1-8.39-8.38v-15.3l63.15-68.07 42.92 57.22 1.48 1.48h.49c.5.5 1.48.5 1.97.5H388.83l38.47-21.72 46.37 36.5c.5.5 1.49 1 1.98 1v8.88c0 3.95-3.45 7.9-8.38 7.9z\"/>\n        <path d=\"M429.77 333.58a13.81 13.81 0 1 1-27.63 0 13.81 13.81 0 0 1 27.63 0\"/>\n      </g>\n    </symbol>\n  </defs>\n</svg>\n";

  var ACTIVE_CLASS = 'psv-gallery-item--active';
  /**
   * @private
   */

  var GalleryComponent = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(GalleryComponent, _AbstractComponent);

    function GalleryComponent(plugin) {
      var _this;

      _this = _AbstractComponent.call(this, plugin.psv, 'psv-gallery psv--capture-event') || this;
      /**
       * @type {SVGElement}
       * @private
       * @readonly
       */

      _this.blankIcon = function () {
        var temp = document.createElement('div');
        temp.innerHTML = blankIcon;
        return temp.firstChild;
      }();

      _this.blankIcon.style.display = 'none';

      _this.psv.container.appendChild(_this.blankIcon);

      if ('IntersectionObserver' in window) {
        /**
         * @type {IntersectionObserver}
         * @private
         * @readonly
         */
        _this.observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.intersectionRatio > 0) {
              entry.target.style.backgroundImage = "url(" + entry.target.dataset.src + ")";
              delete entry.target.dataset.src;

              _this.observer.unobserve(entry.target);
            }
          });
        }, {
          root: _this.psv.container
        });
      }
      /**
       * @type {PSV.plugins.GalleryPlugin}
       * @private
       * @readonly
       */


      _this.plugin = plugin;
      /**
       * @type {Object}
       * @private
       */

      _this.prop = _extends({}, _this.prop, {
        mousedown: false,
        initMouseX: null,
        mouseX: null
      });

      _this.container.addEventListener(photoSphereViewer.SYSTEM.mouseWheelEvent, _assertThisInitialized(_this));

      _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

      _this.container.addEventListener('mousemove', _assertThisInitialized(_this));

      _this.container.addEventListener('click', _assertThisInitialized(_this));

      window.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = GalleryComponent.prototype;

    _proto.destroy = function destroy() {
      var _this$observer;

      this.psv.container.removeChild(this.blankIcon);
      window.removeEventListener('mouseup', this);
      (_this$observer = this.observer) == null ? void 0 : _this$observer.disconnect();
      delete this.plugin;
      delete this.blankIcon;
      delete this.observer;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.SYSTEM.mouseWheelEvent:
          var spinY = photoSphereViewer.utils.normalizeWheel(e).spinY;
          this.container.scrollLeft += spinY * 50;
          e.preventDefault();
          break;

        case 'mousedown':
          this.prop.mousedown = true;
          this.prop.initMouseX = e.clientX;
          this.prop.mouseX = e.clientX;
          break;

        case 'mousemove':
          if (this.prop.mousedown) {
            var delta = this.prop.mouseX - e.clientX;
            this.container.scrollLeft += delta;
            this.prop.mouseX = e.clientX;
          }

          break;

        case 'mouseup':
          this.prop.mousedown = false;
          this.prop.mouseX = null;
          e.preventDefault();
          break;

        case 'click':
          // prevent click on drag
          if (Math.abs(this.prop.initMouseX - e.clientX) < 10) {
            var item = photoSphereViewer.utils.getClosest(e.target, "[data-" + GALLERY_ITEM_DATA_KEY + "]");

            if (item) {
              this.plugin.__click(item.dataset[GALLERY_ITEM_DATA]);
            }
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
      this.container.classList.add('psv-gallery--open');
      this.prop.visible = true;
    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-gallery--open');
      this.prop.visible = false;
    }
    /**
     * @summary Sets the list of items
     * @param {PSV.plugins.GalleryPlugin.Item[]} items
     */
    ;

    _proto.setItems = function setItems(items) {
      this.container.innerHTML = ITEMS_TEMPLATE(items, this.plugin.config.thumbnailSize);

      if (this.observer) {
        this.observer.disconnect();

        for (var _iterator = _createForOfIteratorHelperLoose(this.container.querySelectorAll('[data-src]')), _step; !(_step = _iterator()).done;) {
          var child = _step.value;
          this.observer.observe(child);
        }
      }
    }
    /**
     * @param {number | string} id
     */
    ;

    _proto.setActive = function setActive(id) {
      var currentActive = this.container.querySelector('.' + ACTIVE_CLASS);
      currentActive == null ? void 0 : currentActive.classList.remove(ACTIVE_CLASS);

      if (id) {
        var nextActive = this.container.querySelector("[data-" + GALLERY_ITEM_DATA_KEY + "=\"" + id + "\"]");
        nextActive == null ? void 0 : nextActive.classList.add(ACTIVE_CLASS);
      }
    };

    return GalleryComponent;
  }(photoSphereViewer.AbstractComponent);

  /**
   * @typedef {Object} PSV.plugins.GalleryPlugin.Item
   * @property {number|string} id - Unique identifier of the item
   * @property {*} panorama
   * @property {string} [thumbnail] - URL of the thumbnail
   * @property {string} [name] - Text visible over the thumbnail
   * @property {PSV.PanoramaOptions} [options] - Any option supported by the `setPanorama()` method
   */

  /**
   * @typedef {Object} PSV.plugins.GalleryPlugin.Options
   * @property {PSV.plugins.GalleryPlugin.Item[]} [items]
   * @property {boolean} [visibleOnLoad=false] - Displays the gallery when loading the first panorama
   * @property {boolean} [hideOnClick=true] - Hides the gallery when the user clicks on an item
   * @property {PSV.Size} [thumbnailSize] - Size of thumbnails, default (200x100) is set with CSS
   */
  // add gallery button

  photoSphereViewer.DEFAULTS.lang[GalleryButton.id] = 'Gallery';
  photoSphereViewer.registerButton(GalleryButton, 'caption:left');
  /**
   * @summary Adds a gallery of multiple panoramas
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var GalleryPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(GalleryPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.GalleryPlugin.Options} options
     */
    function GalleryPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {PSV.plugins.GalleryPlugin.Options}
       * @private
       */

      _this.config = _extends({
        items: null,
        visibleOnLoad: false,
        hideOnClick: true,
        thumbnailSize: {
          width: 200,
          height: 100
        }
      }, options);
      /**
       * @type {Object}
       * @private
       */

      _this.prop = {
        handler: null,
        currentId: null
      };
      /**
       * @type {GalleryComponent}
       * @private
       * @readonly
       */

      _this.gallery = new GalleryComponent(_assertThisInitialized(_this));
      /**
       * @type {PSV.plugins.GalleryPlugin.Item[]}
       * @private
       */

      _this.items = [];
      return _this;
    }
    /**
     * @package
     */


    var _proto = GalleryPlugin.prototype;

    _proto.init = function init() {
      var _this2 = this;

      _AbstractPlugin.prototype.init.call(this);

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);

      if (this.config.visibleOnLoad) {
        this.psv.once(photoSphereViewer.CONSTANTS.EVENTS.READY, function () {
          _this2.show();
        });
      }

      this.setItems(this.config.items);
      delete this.config.items;
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.gallery.destroy();

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
          var item = this.items.find(function (i) {
            return photoSphereViewer.utils.deepEqual(i.panorama, e.args[0].panorama);
          });
          this.prop.currentId = item == null ? void 0 : item.id;
          this.gallery.setActive(item == null ? void 0 : item.id);
          break;
      }
      /* eslint-enable */

    }
    /**
     * @summary Shows the gallery
     * @fires PSV.plugins.GalleryPlugin.show-gallery
     */
    ;

    _proto.show = function show() {
      this.trigger(EVENTS.SHOW_GALLERY);
      return this.gallery.show();
    }
    /**
     * @summary Hides the carousem
     * @fires PSV.plugins.GalleryPlugin.hide-gallery
     */
    ;

    _proto.hide = function hide() {
      this.trigger(EVENTS.HIDE_GALLERY);
      return this.gallery.hide();
    }
    /**
     * @summary Hides or shows the gallery
     */
    ;

    _proto.toggle = function toggle() {
      return this.gallery.toggle();
    }
    /**
     * @summary Sets the list of items
     * @param {PSV.plugins.GalleryPlugin.Item[]} items
     * @param {function} [handler] function that will be called when an item is clicked instead of the default behavior
     */
    ;

    _proto.setItems = function setItems(items, handler) {
      var _items;

      if (!((_items = items) != null && _items.length)) {
        items = [];
      } else {
        items.forEach(function (item, i) {
          if (!item.id) {
            throw new photoSphereViewer.PSVError("Item " + i + " has no \"id\".");
          }

          if (!item.panorama) {
            throw new photoSphereViewer.PSVError("Item " + item.id + " has no \"panorama\".");
          }
        });
      }

      this.prop.handler = handler;
      this.items = items.map(function (item) {
        return _extends({}, item, {
          id: "" + item.id
        });
      });
      this.gallery.setItems(items);
    }
    /**
     * @param {string} id
     * @package
     */
    ;

    _proto.__click = function __click(id) {
      if (id === this.prop.currentId) {
        return;
      }

      if (this.prop.handler) {
        this.prop.handler(id);
      } else {
        var item = this.items.find(function (i) {
          return i.id === id;
        });
        this.psv.setPanorama(item.panorama, _extends({
          caption: item.name
        }, item.options));
      }

      this.prop.currentId = id;
      this.gallery.setActive(id);

      if (this.config.hideOnClick) {
        this.hide();
      }
    };

    return GalleryPlugin;
  }(photoSphereViewer.AbstractPlugin);
  GalleryPlugin.id = 'gallery';
  GalleryPlugin.EVENTS = EVENTS;

  exports.EVENTS = EVENTS;
  exports.GalleryPlugin = GalleryPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=gallery.js.map
