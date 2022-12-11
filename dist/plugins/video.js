/*!
* Photo Sphere Viewer 4.8.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.VideoPlugin = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

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

  var EVENTS = {
    /**
     * @event play
     * @memberof PSV.plugins.VideoPlugin
     * @summary Triggered when the video starts playing
     */
    PLAY: 'play',

    /**
     * @event pause
     * @memberof PSV.plugins.VideoPlugin
     * @summary Triggered when the video is paused
     */
    PAUSE: 'pause',

    /**
     * @event volume-change
     * @memberof PSV.plugins.VideoPlugin
     * @summary Triggered when the video volume changes
     * @param {number} volume
     */
    VOLUME_CHANGE: 'volume-change',

    /**
     * @event progress
     * @memberof PSV.plugins.VideoPlugin
     * @summary Triggered when the video play progression changes
     * @param {{time: number, duration: number, progress: number}} data
     */
    PROGRESS: 'progress',

    /**
     * @event buffer
     * @memberof PSV.plugins.VideoPlugin
     * @summary Triggered when the video buffer changes
     * @param {number} maxBuffer
     */
    BUFFER: 'buffer'
  };

  var playIcon = "<svg viewBox=\"76 5 550 550\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentcolor\" d=\"M351.1 5.6A274.1 274.1 0 0 0 76.7 280a274.1 274.1 0 0 0 274.4 274.4A274.1 274.1 0 0 0 625.5 280 274.1 274.1 0 0 0 351.1 5.6zm146.7 282.8-219 134.4c-6.6 4-15.6-.6-15.6-8.4V145.6c0-7.8 9-12.9 15.7-8.4l219 134.4a10 10 0 0 1 0 16.8z\"/></svg>\n";

  /**
   * @private
   */

  var PauseOverlay = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(PauseOverlay, _AbstractComponent);

    function PauseOverlay(plugin) {
      var _this;

      _this = _AbstractComponent.call(this, plugin.psv, 'psv-video-overlay') || this;
      /**
       * @type {PSV.plugins.VideoPlugin}
       * @private
       * @readonly
       */

      _this.plugin = plugin;
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */

      _this.button = document.createElement('button');
      _this.button.className = 'psv-video-bigbutton psv--capture-event';
      _this.button.innerHTML = playIcon;

      _this.container.appendChild(_this.button);

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, _assertThisInitialized(_this));

      _this.plugin.on(EVENTS.PLAY, _assertThisInitialized(_this));

      _this.plugin.on(EVENTS.PAUSE, _assertThisInitialized(_this));

      _this.button.addEventListener('click', _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @private
     */


    var _proto = PauseOverlay.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.plugin.off(EVENTS.PLAY, this);
      this.plugin.off(EVENTS.PAUSE, this);
      delete this.plugin;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
        case EVENTS.PLAY:
        case EVENTS.PAUSE:
          photoSphereViewer.utils.toggleClass(this.button, 'psv-video-bigbutton--pause', !this.plugin.isPlaying());
          break;

        case 'click':
          this.plugin.playPause();
          break;
      }
      /* eslint-enable */

    };

    return PauseOverlay;
  }(photoSphereViewer.AbstractComponent);

  var pauseIcon = "<svg viewBox=\"80 10 540 540\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M80.58 279.67c0-148.76 120.33-269.09 269.09-269.09s269.75 120.33 269.75 269.09-121 269.75-269.75 269.75-269.1-120.99-269.1-269.75zm175.87 105.12V175.2c0-9.26 7.27-15.87 15.86-15.87h39.01c8.6 0 15.87 6.62 15.87 15.87v209.59c0 8.6-7.27 15.87-15.87 15.87h-39c-8.6 0-15.87-7.28-15.87-15.87zm116.36 0V175.2c0-9.26 7.27-15.87 15.86-15.87h38.35c9.26 0 15.87 6.62 15.87 15.87v209.59c0 8.6-6.61 15.87-15.87 15.87h-38.34c-8.6 0-15.87-7.28-15.87-15.87z\" fill-rule=\"evenodd\" fill=\"currentcolor\"/></svg>\n";

  /**
   * @summary Navigation bar video play/pause button
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var PlayPauseButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(PlayPauseButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function PlayPauseButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-video-play-button', true) || this;
      /**
       * @type {PSV.plugins.VideoPlugin}
       * @private
       * @readonly
       */

      _this.plugin = _this.psv.getPlugin('video');

      if (_this.plugin) {
        _this.plugin.on(EVENTS.PLAY, _assertThisInitialized(_this));

        _this.plugin.on(EVENTS.PAUSE, _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = PlayPauseButton.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.plugin.off(EVENTS.PLAY, this);
        this.plugin.off(EVENTS.PAUSE, this);
      }

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
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case EVENTS.PLAY:
        case EVENTS.PAUSE:
          this.toggleActive(this.plugin.isPlaying());
          break;
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles video playback
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.playPause();
    };

    return PlayPauseButton;
  }(photoSphereViewer.AbstractButton);
  PlayPauseButton.id = 'videoPlay';
  PlayPauseButton.groupId = 'video';
  PlayPauseButton.icon = playIcon;
  PlayPauseButton.iconActive = pauseIcon;

  /**
   * @private
   */
  function formatTime(time) {
    var seconds = Math.round(time % 60);
    var minutes = Math.round(time - seconds) / 60;
    return minutes + ":" + ('0' + seconds).slice(-2);
  }

  /**
   * @private
   */

  var ProgressBar = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(ProgressBar, _AbstractComponent);

    function ProgressBar(plugin) {
      var _this;

      _this = _AbstractComponent.call(this, plugin.psv, 'psv-video-progressbar') || this;
      /**
       * @type {PSV.plugins.VideoPlugin}
       * @private
       * @readonly
       */

      _this.plugin = plugin;
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */

      _this.bufferElt = document.createElement('div');
      _this.bufferElt.className = 'psv-video-progressbar__buffer';

      _this.container.appendChild(_this.bufferElt);
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */


      _this.progressElt = document.createElement('div');
      _this.progressElt.className = 'psv-video-progressbar__progress';

      _this.container.appendChild(_this.progressElt);
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */


      _this.handleElt = document.createElement('div');
      _this.handleElt.className = 'psv-video-progressbar__handle';

      _this.container.appendChild(_this.handleElt);
      /**
       * @type {PSV.utils.Slider}
       * @private
       * @readonly
       */


      _this.slider = new photoSphereViewer.utils.Slider({
        psv: _this.psv,
        container: _this.container,
        direction: photoSphereViewer.utils.Slider.HORIZONTAL,
        onUpdate: function onUpdate(e) {
          return _this.__onSliderUpdate(e);
        }
      });

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, _assertThisInitialized(_this));

      _this.plugin.on(EVENTS.BUFFER, _assertThisInitialized(_this));

      _this.plugin.on(EVENTS.PROGRESS, _assertThisInitialized(_this));

      _this.prop.req = window.requestAnimationFrame(function () {
        return _this.__updateProgress();
      });

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = ProgressBar.prototype;

    _proto.destroy = function destroy() {
      var _this$prop$tooltip;

      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.plugin.off(EVENTS.BUFFER, this);
      this.plugin.off(EVENTS.PROGRESS, this);
      this.slider.destroy();
      (_this$prop$tooltip = this.prop.tooltip) == null ? void 0 : _this$prop$tooltip.hide();
      window.cancelAnimationFrame(this.prop.req);
      delete this.prop.tooltip;
      delete this.slider;
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
        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
        case EVENTS.BUFFER:
        case EVENTS.PROGRESS:
          this.bufferElt.style.width = this.plugin.getBufferProgress() * 100 + "%";
          break;
      }
      /* eslint-enable */

    }
    /**
     * @private
     */
    ;

    _proto.__updateProgress = function __updateProgress() {
      var _this2 = this;

      this.progressElt.style.width = this.plugin.getProgress() * 100 + "%";
      this.prop.req = window.requestAnimationFrame(function () {
        return _this2.__updateProgress();
      });
    }
    /**
     * @private
     */
    ;

    _proto.__onSliderUpdate = function __onSliderUpdate(e) {
      if (e.mouseover) {
        this.handleElt.style.display = 'block';
        this.handleElt.style.left = e.value * 100 + "%";
        var time = formatTime(this.plugin.getDuration() * e.value);

        if (!this.prop.tooltip) {
          this.prop.tooltip = this.psv.tooltip.create({
            top: e.cursor.clientY,
            left: e.cursor.clientX,
            content: time
          });
        } else {
          this.prop.tooltip.content.innerHTML = time;
          this.prop.tooltip.move({
            top: e.cursor.clientY,
            left: e.cursor.clientX
          });
        }
      } else {
        var _this$prop$tooltip2;

        this.handleElt.style.display = 'none';
        (_this$prop$tooltip2 = this.prop.tooltip) == null ? void 0 : _this$prop$tooltip2.hide();
        delete this.prop.tooltip;
      }

      if (e.click) {
        this.plugin.setProgress(e.value);
      }
    };

    return ProgressBar;
  }(photoSphereViewer.AbstractComponent);

  /**
   * @summary Navigation bar video time display
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var TimeCaption = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(TimeCaption, _AbstractComponent);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function TimeCaption(navbar) {
      var _this;

      _this = _AbstractComponent.call(this, navbar, 'psv-caption psv-video-time') || this;
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-caption-content';

      _this.container.appendChild(_this.content);
      /**
       * @type {PSV.plugins.VideoPlugin}
       * @private
       * @readonly
       */


      _this.plugin = _this.psv.getPlugin('video');

      if (_this.plugin) {
        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, _assertThisInitialized(_this));

        _this.plugin.on(EVENTS.PROGRESS, _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = TimeCaption.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
        this.plugin.off(EVENTS.PROGRESS, this);
      }

      delete this.plugin;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
        case EVENTS.PROGRESS:
          this.content.innerHTML = "<strong>" + formatTime(this.plugin.getTime()) + "</strong> / " + formatTime(this.plugin.getDuration());
          break;
      }
      /* eslint-enable */

    };

    return TimeCaption;
  }(photoSphereViewer.AbstractComponent);
  TimeCaption.id = 'videoTime';
  TimeCaption.groupId = 'video';

  var volumeIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"17 16 71 71\"><path fill=\"currentColor\" d=\"M20.19 61.66H32.9c.54 0 1.07.16 1.52.47L51.02 73.5a2.7 2.7 0 0 0 4.22-2.23V28.74a2.7 2.7 0 0 0-4.22-2.23L34.43 37.87c-.45.3-.98.47-1.52.47H20.19a2.7 2.7 0 0 0-2.7 2.7v17.92a2.7 2.7 0 0 0 2.7 2.7z\"/><path id=\"lvl0\" fill=\"currentColor\" d=\"M63.802 58.834c.39.39.902.586 1.414.586s1.023-.195 1.414-.586l7.234-7.233 7.234 7.233c.39.39.902.586 1.414.586s1.023-.195 1.414-.586a2 2 0 0 0 0-2.828l-7.234-7.234 7.234-7.233a2 2 0 1 0-2.828-2.828l-7.234 7.233-7.234-7.233a2 2 0 1 0-2.828 2.828l7.234 7.233-7.234 7.234a2 2 0 0 0 0 2.828z\"/><path id=\"lvl1\" fill=\"currentColor\" d=\"M59.573 59.65c.39.394.904.59 1.418.59.51 0 1.02-.194 1.41-.582A13.53 13.53 0 0 0 66.411 50a13.56 13.56 0 0 0-3.996-9.654 2 2 0 0 0-2.828 2.829A9.586 9.586 0 0 1 62.41 50a9.56 9.56 0 0 1-2.83 6.823 2 2 0 0 0-.008 2.828z\"/><path id=\"lvl2\" fill=\"currentColor\" d=\"M72.501 50c0 5.267-2.055 10.227-5.786 13.967a2 2 0 0 0 2.832 2.825C74.03 62.297 76.5 56.333 76.5 50s-2.47-12.297-6.954-16.792a2 2 0 0 0-2.832 2.825c3.731 3.74 5.786 8.7 5.786 13.967z\"/><path id=\"lvl3\" fill=\"currentColor\" d=\"M83.001 50c0 8.084-3.147 15.679-8.863 21.384a2 2 0 0 0 2.826 2.831C83.437 67.754 87 59.155 87 50c0-9.154-3.564-17.753-10.037-24.215a2 2 0 0 0-2.826 2.83C79.854 34.323 83 41.917 83 50z\"/><!--Created by Rudez Studio from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar video volume button
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var VolumeButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(VolumeButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function VolumeButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-video-volume-button', true) || this;
      /**
       * @type {PSV.plugins.VideoPlugin}
       * @private
       * @readonly
       */

      _this.plugin = _this.psv.getPlugin('video');
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */

      _this.rangeContainer = document.createElement('div');
      _this.rangeContainer.className = 'psv-video-volume__container';

      _this.container.appendChild(_this.rangeContainer);
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */


      _this.range = document.createElement('div');
      _this.range.className = 'psv-video-volume__range';

      _this.rangeContainer.appendChild(_this.range);
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */


      _this.trackElt = document.createElement('div');
      _this.trackElt.className = 'psv-video-volume__track';

      _this.range.appendChild(_this.trackElt);
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */


      _this.progressElt = document.createElement('div');
      _this.progressElt.className = 'psv-video-volume__progress';

      _this.range.appendChild(_this.progressElt);
      /**
       * @type {HTMLElement}
       * @private
       * @readonly
       */


      _this.handleElt = document.createElement('div');
      _this.handleElt.className = 'psv-video-volume__handle';

      _this.range.appendChild(_this.handleElt);
      /**
       * @type {PSV.utils.Slider}
       * @private
       * @readonly
       */


      _this.slider = new photoSphereViewer.utils.Slider({
        psv: _this.psv,
        container: _this.range,
        direction: photoSphereViewer.utils.Slider.VERTICAL,
        onUpdate: function onUpdate(e) {
          return _this.__onSliderUpdate(e);
        }
      });

      if (_this.plugin) {
        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, _assertThisInitialized(_this));

        _this.plugin.on(EVENTS.PLAY, _assertThisInitialized(_this));

        _this.plugin.on(EVENTS.VOLUME_CHANGE, _assertThisInitialized(_this));

        _this.__setVolume(0);
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = VolumeButton.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
        this.plugin.off(EVENTS.PLAY, this);
        this.plugin.off(EVENTS.VOLUME_CHANGE, this);
      }

      this.slider.destroy();
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
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
        case EVENTS.PLAY:
        case EVENTS.VOLUME_CHANGE:
          this.__setVolume(this.plugin.getVolume());

          break;
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles video muted
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.setMute();
    }
    /**
     * @private
     */
    ;

    _proto.__onSliderUpdate = function __onSliderUpdate(e) {
      if (e.mousedown) {
        this.plugin.setVolume(e.value);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__setVolume = function __setVolume(volume) {
      var level;
      if (volume === 0) level = 0;else if (volume < 0.333) level = 1;else if (volume < 0.666) level = 2;else level = 3;
      photoSphereViewer.utils.toggleClass(this.container, 'psv-video-volume-button--0', level === 0);
      photoSphereViewer.utils.toggleClass(this.container, 'psv-video-volume-button--1', level === 1);
      photoSphereViewer.utils.toggleClass(this.container, 'psv-video-volume-button--2', level === 2);
      photoSphereViewer.utils.toggleClass(this.container, 'psv-video-volume-button--3', level === 3);
      this.handleElt.style.bottom = volume * 100 + "%";
      this.progressElt.style.height = volume * 100 + "%";
    };

    return VolumeButton;
  }(photoSphereViewer.AbstractButton);
  VolumeButton.id = 'videoVolume';
  VolumeButton.groupId = 'video';
  VolumeButton.icon = volumeIcon;

  /**
   * @typedef {Object} PSV.plugins.VideoPlugin.Keypoint
   * @property {PSV.ExtendedPosition} position
   * @property {number} time
   */

  /**
   * @typedef {Object} PSV.plugins.VideoPlugin.Options
   * @property {boolean} [progressbar=true] - displays a progressbar on top of the navbar
   * @property {boolean} [bigbutton=true] - displays a big "play" button in the center of the viewer
   * @property {PSV.plugins.VideoPlugin.Keypoint[]} [keypoints] - defines autorotate timed keypoints
   */
  // add video buttons

  photoSphereViewer.DEFAULTS.lang[PlayPauseButton.id] = 'Play/Pause';
  photoSphereViewer.DEFAULTS.lang[VolumeButton.id] = 'Volume';
  photoSphereViewer.registerButton(PlayPauseButton);
  photoSphereViewer.registerButton(VolumeButton);
  photoSphereViewer.registerButton(TimeCaption);
  photoSphereViewer.DEFAULTS.navbar.unshift(PlayPauseButton.groupId);
  /**
   * @summary Controls a video adapter
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var VideoPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(VideoPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.VideoPlugin.Options} options
     */
    function VideoPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;

      if (!_this.psv.adapter.constructor.id.includes('video')) {
        throw new photoSphereViewer.PSVError('VideoPlugin can only be used with a video adapter.');
      }
      /**
       * @member {Object}
       * @property {THREE.SplineCurve} curve
       * @property {PSV.plugins.VideoPlugin.Keypoint} start
       * @property {PSV.plugins.VideoPlugin.Keypoint} end
       * @property {PSV.plugins.VideoPlugin.Keypoint[]} keypoints
       * @private
       */


      _this.autorotate = {
        curve: null,
        start: null,
        end: null,
        keypoints: null
      };
      /**
       * @member {PSV.plugins.VideoPlugin.Options}
       * @private
       */

      _this.config = _extends({
        progressbar: true,
        bigbutton: true
      }, options);

      if (_this.config.progressbar) {
        _this.progressbar = new ProgressBar(_assertThisInitialized(_this));
      }

      if (_this.config.bigbutton) {
        _this.overlay = new PauseOverlay(_assertThisInitialized(_this));
      }
      /**
       * @type {PSV.plugins.MarkersPlugin}
       * @private
       */


      _this.markers = null;
      return _this;
    }
    /**
     * @package
     */


    var _proto = VideoPlugin.prototype;

    _proto.init = function init() {
      _AbstractPlugin.prototype.init.call(this);

      this.markers = this.psv.getPlugin('markers');

      if (this.config.keypoints) {
        this.setKeypoints(this.config.keypoints);
        delete this.config.keypoints;
      }

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.AUTOROTATE, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.KEY_PRESS, this);
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.AUTOROTATE, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.KEY_PRESS, this);
      delete this.autorotate;
      delete this.progressbar;
      delete this.overlay;

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      var _this$progressbar;

      /* eslint-disable */
      // @formatter:off
      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER:
          this.__autorotate();

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.AUTOROTATE:
          this.__configureAutorotate();

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
          this.__bindVideo(e.args[0]);

          (_this$progressbar = this.progressbar) == null ? void 0 : _this$progressbar.show();
          break;

        case photoSphereViewer.CONSTANTS.EVENTS.KEY_PRESS:
          this.__onKeyPress(e, e.args[0]);

          break;

        case 'play':
          this.trigger(EVENTS.PLAY);
          break;

        case 'pause':
          this.trigger(EVENTS.PAUSE);
          break;

        case 'progress':
          this.trigger(EVENTS.BUFFER, this.getBufferProgress());
          break;

        case 'volumechange':
          this.trigger(EVENTS.VOLUME_CHANGE, this.getVolume());
          break;

        case 'timeupdate':
          this.trigger(EVENTS.PROGRESS, {
            time: this.getTime(),
            duration: this.getDuration(),
            progress: this.getProgress()
          });
          break;
      } // @formatter:on

      /* eslint-enable */

    }
    /**
     * @private
     */
    ;

    _proto.__bindVideo = function __bindVideo(textureData) {
      this.video = textureData.texture.image;
      this.video.addEventListener('play', this);
      this.video.addEventListener('pause', this);
      this.video.addEventListener('progress', this);
      this.video.addEventListener('volumechange', this);
      this.video.addEventListener('timeupdate', this);
    }
    /**
     * @private
     */
    ;

    _proto.__onKeyPress = function __onKeyPress(e, key) {
      if (key === photoSphereViewer.CONSTANTS.KEY_CODES.Space) {
        this.playPause();
        e.preventDefault();
      }
    }
    /**
     * @summary Returns the durection of the video
     * @returns {number}
     */
    ;

    _proto.getDuration = function getDuration() {
      var _this$video$duration, _this$video;

      return (_this$video$duration = (_this$video = this.video) == null ? void 0 : _this$video.duration) != null ? _this$video$duration : 0;
    }
    /**
     * @summary Returns the current time of the video
     * @returns {number}
     */
    ;

    _proto.getTime = function getTime() {
      var _this$video$currentTi, _this$video2;

      return (_this$video$currentTi = (_this$video2 = this.video) == null ? void 0 : _this$video2.currentTime) != null ? _this$video$currentTi : 0;
    }
    /**
     * @summary Returns the play progression of the video
     * @returns {number} 0-1
     */
    ;

    _proto.getProgress = function getProgress() {
      return this.video ? this.video.currentTime / this.video.duration : 0;
    }
    /**
     * @summary Returns if the video is playing
     * @returns {boolean}
     */
    ;

    _proto.isPlaying = function isPlaying() {
      return this.video ? !this.video.paused : false;
    }
    /**
     * @summary Returns the video volume
     * @returns {number}
     */
    ;

    _proto.getVolume = function getVolume() {
      var _this$video3, _this$video$volume, _this$video4;

      return (_this$video3 = this.video) != null && _this$video3.muted ? 0 : (_this$video$volume = (_this$video4 = this.video) == null ? void 0 : _this$video4.volume) != null ? _this$video$volume : 0;
    }
    /**
     * @summary Starts or pause the video
     */
    ;

    _proto.playPause = function playPause() {
      if (this.video) {
        if (this.video.paused) {
          this.video.play();
        } else {
          this.video.pause();
        }
      }
    }
    /**
     * @summary Starts the video if paused
     */
    ;

    _proto.play = function play() {
      if (this.video && this.video.paused) {
        this.video.play();
      }
    }
    /**
     * @summary Pauses the cideo if playing
     */
    ;

    _proto.pause = function pause() {
      if (this.video && !this.video.paused) {
        this.video.pause();
      }
    }
    /**
     * @summary Sets the volume of the video
     * @param {number} volume
     */
    ;

    _proto.setVolume = function setVolume(volume) {
      if (this.video) {
        this.video.muted = false;
        this.video.volume = volume;
      }
    }
    /**
     * @summary (Un)mutes the video
     * @param {boolean} [mute] - toggle if undefined
     */
    ;

    _proto.setMute = function setMute(mute) {
      if (this.video) {
        this.video.muted = mute === undefined ? !this.video.muted : mute;

        if (!this.video.muted && this.video.volume === 0) {
          this.video.volume = 0.1;
        }
      }
    }
    /**
     * @summary Changes the current time of the video
     * @param {number} time
     */
    ;

    _proto.setTime = function setTime(time) {
      if (this.video) {
        this.video.currentTime = time;
      }
    }
    /**
     * @summary Changes the progression of the video
     * @param {number} progress 0-1
     */
    ;

    _proto.setProgress = function setProgress(progress) {
      if (this.video) {
        this.video.currentTime = this.video.duration * progress;
      }
    };

    _proto.getBufferProgress = function getBufferProgress() {
      if (this.video) {
        var maxBuffer = 0;
        var buffer = this.video.buffered;

        for (var i = 0, l = buffer.length; i < l; i++) {
          if (buffer.start(i) <= this.video.currentTime && buffer.end(i) >= this.video.currentTime) {
            maxBuffer = buffer.end(i);
            break;
          }
        }

        return Math.max(this.video.currentTime, maxBuffer) / this.video.duration;
      } else {
        return 0;
      }
    }
    /**
     * @summary Changes the keypoints
     * @param {PSV.plugins.VideoPlugin.Keypoint[]} keypoints
     */
    ;

    _proto.setKeypoints = function setKeypoints(keypoints) {
      var _this2 = this;

      if (keypoints && keypoints.length < 2) {
        throw new photoSphereViewer.PSVError('At least two points are required');
      }

      this.autorotate.keypoints = photoSphereViewer.utils.clone(keypoints);

      if (this.autorotate.keypoints) {
        this.autorotate.keypoints.forEach(function (pt, i) {
          if (pt.position) {
            var position = _this2.psv.dataHelper.cleanPosition(pt.position);

            pt.position = [position.longitude, position.latitude];
          } else {
            throw new photoSphereViewer.PSVError("Keypoint #" + i + " is missing marker or position");
          }

          if (photoSphereViewer.utils.isNil(pt.time)) {
            throw new photoSphereViewer.PSVError("Keypoint #" + i + " is missing time");
          }
        });
        this.autorotate.keypoints.sort(function (a, b) {
          return a.time - b.time;
        });
      }

      this.__configureAutorotate();
    }
    /**
     * @private
     */
    ;

    _proto.__configureAutorotate = function __configureAutorotate() {
      delete this.autorotate.curve;
      delete this.autorotate.start;
      delete this.autorotate.end;

      if (this.psv.isAutorotateEnabled() && this.autorotate.keypoints) {
        // cancel core rotation
        this.psv.dynamics.position.stop();
      }
    }
    /**
     * @private
     */
    ;

    _proto.__autorotate = function __autorotate() {
      if (!this.psv.isAutorotateEnabled() || !this.autorotate.keypoints) {
        return;
      }

      var currentTime = this.getTime();
      var autorotate = this.autorotate;

      if (!autorotate.curve || currentTime < autorotate.start.time || currentTime >= autorotate.end.time) {
        this.__autorotateNext(currentTime);
      }

      if (autorotate.start === autorotate.end) {
        this.psv.rotate({
          longitude: autorotate.start.position[0],
          latitude: autorotate.start.position[1]
        });
      } else {
        var progress = (currentTime - autorotate.start.time) / (autorotate.end.time - autorotate.start.time); // only the middle segment contains the current section

        var pt = autorotate.curve.getPoint(1 / 3 + progress / 3);
        this.psv.dynamics.position.goto({
          longitude: pt.x,
          latitude: pt.y
        });
      }
    }
    /**
     * @private
     */
    ;

    _proto.__autorotateNext = function __autorotateNext(currentTime) {
      var k1 = null;
      var k2 = null;
      var keypoints = this.autorotate.keypoints;
      var l = keypoints.length - 1;

      if (currentTime < keypoints[0].time) {
        k1 = 0;
        k2 = 0;
      }

      for (var i = 0; i < l; i++) {
        if (currentTime >= keypoints[i].time && currentTime < keypoints[i + 1].time) {
          k1 = i;
          k2 = i + 1;
          break;
        }
      }

      if (currentTime >= keypoints[l].time) {
        k1 = l;
        k2 = l;
      } // get the 4 points necessary to compute the current movement
      // one point before and two points after the current


      var workPoints = [keypoints[Math.max(0, k1 - 1)].position, keypoints[k1].position, keypoints[k2].position, keypoints[Math.min(l, k2 + 1)].position]; // apply offsets to avoid crossing the origin

      var workVectors = [new three.Vector2(workPoints[0][0], workPoints[0][1])];
      var k = 0;

      for (var _i = 1; _i <= 3; _i++) {
        var d = workPoints[_i - 1][0] - workPoints[_i][0];

        if (d > Math.PI) {
          // crossed the origin left to right
          k += 1;
        } else if (d < -Math.PI) {
          // crossed the origin right to left
          k -= 1;
        }

        if (k !== 0 && _i === 1) {
          // do not modify first point, apply the reverse offset the the previous point instead
          workVectors[0].x -= k * 2 * Math.PI;
          k = 0;
        }

        workVectors.push(new three.Vector2(workPoints[_i][0] + k * 2 * Math.PI, workPoints[_i][1]));
      }

      this.autorotate.curve = new three.SplineCurve(workVectors);
      this.autorotate.start = keypoints[k1];
      this.autorotate.end = keypoints[k2]; // debugCurve(this.markers, this.autorotate.curve.getPoints(16 * 3).map(p => ([p.x, p.y])), 16);
    };

    return VideoPlugin;
  }(photoSphereViewer.AbstractPlugin);
  VideoPlugin.id = 'video';
  VideoPlugin.EVENTS = EVENTS;

  exports.EVENTS = EVENTS;
  exports.VideoPlugin = VideoPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=video.js.map
