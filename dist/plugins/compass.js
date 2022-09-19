/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.CompassPlugin = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

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

  var compass = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"50\" fill=\"rgba(61, 61, 61, .5)\"/><path fill=\"rgba(255, 255, 255, .7)\" d=\"M50 97.1A47 47 0 0 1 32.5 6.5l.8 1.8a45 45 0 1 0 33.4 0l.8-1.8A47 47 0 0 1 50 97Zm0-42a5 5 0 1 1 5-5 5 5 0 0 1-5 5Zm4-41.7h-1.6a.4.4 0 0 1-.4-.2l-4.6-7.7V13a.3.3 0 0 1-.3.3h-1.6a.3.3 0 0 1-.3-.3V1.8a.3.3 0 0 1 .3-.3h1.6a.3.3 0 0 1 .4.2L52 9.4V1.8a.3.3 0 0 1 .3-.3H54c.2 0 .3 0 .3.3V13c0 .2-.1.3-.3.3Z\"/></svg>\n";

  /**
   * @typedef {Object} PSV.plugins.CompassPlugin.Options
   * @property {string} [size='120px'] - size of the compass
   * @property {string} [position='top left'] - position of the compass
   * @property {string} [backgroundSvg] - SVG used as background of the compass
   * @property {string} [coneColor='rgba(255, 255, 255, 0.5)'] - color of the cone of the compass
   * @property {boolean} [navigation=true] - allows to click on the compass to rotate the viewer
   * @property {string} [navigationColor='rgba(255, 0, 0, 0.2)'] - color of the navigation cone
   * @property {PSV.plugins.CompassPlugin.Hotspot[]} [hotspots] - small dots visible on the compass (will contain every marker with the "compass" data)
   * @property {string} [hotspotColor='rgba(0, 0, 0, 0.5)'] - default color of hotspots
   */

  /**
   * @typedef {PSV.ExtendedPosition} PSV.plugins.CompassPlugin.Hotspot
   * @type {string} [color] - override the global "hotspotColor"
   */

  var HOTSPOT_SIZE_RATIO = 1 / 40;
  /**
   * @summary Adds a compass on the viewer
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var CompassPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(CompassPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.CompassPlugin.Options} options
     */
    function CompassPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {PSV.plugins.CompassPlugin.Options}
       * @private
       */

      _this.config = _extends({
        size: '120px',
        position: 'top left',
        backgroundSvg: compass,
        coneColor: 'rgba(255, 255, 255, 0.5)',
        navigation: true,
        navigationColor: 'rgba(255, 0, 0, 0.2)',
        hotspotColor: 'rgba(0, 0, 0, 0.5)'
      }, options);
      _this.config.position = photoSphereViewer.utils.cleanPosition(_this.config.position, 'top left');
      /**
       * @private
       */

      _this.prop = {
        visible: true,
        mouse: null,
        mouseDown: false,
        markers: []
      };
      /**
       * @type {PSV.plugins.MarkersPlugin}
       * @private
       */

      _this.markers = null;
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.container = document.createElement('div');
      _this.container.className = "psv-compass psv-compass--" + _this.config.position.join('-');
      _this.container.innerHTML = _this.config.backgroundSvg;
      _this.container.style.width = _this.config.size;
      _this.container.style.height = _this.config.size;

      if (_this.config.position[0] === 'center') {
        _this.container.style.marginTop = "calc(-" + _this.config.size + " / 2)";
      }

      if (_this.config.position[1] === 'center') {
        _this.container.style.marginLeft = "calc(-" + _this.config.size + " / 2)";
      }
      /**
       * @member {HTMLCanvasElement}
       * @readonly
       * @private
       */


      _this.canvas = document.createElement('canvas');

      _this.container.appendChild(_this.canvas);

      if (_this.config.navigation) {
        _this.container.addEventListener('mouseenter', _assertThisInitialized(_this));

        _this.container.addEventListener('mouseleave', _assertThisInitialized(_this));

        _this.container.addEventListener('mousemove', _assertThisInitialized(_this));

        _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

        _this.container.addEventListener('mouseup', _assertThisInitialized(_this));

        _this.container.addEventListener('touchstart', _assertThisInitialized(_this));

        _this.container.addEventListener('touchmove', _assertThisInitialized(_this));

        _this.container.addEventListener('touchend', _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @package
     */


    var _proto = CompassPlugin.prototype;

    _proto.init = function init() {
      _AbstractPlugin.prototype.init.call(this);

      this.markers = this.psv.getPlugin('markers');
      this.psv.container.appendChild(this.container);
      this.canvas.width = this.container.clientWidth * photoSphereViewer.SYSTEM.pixelRatio;
      this.canvas.height = this.container.clientWidth * photoSphereViewer.SYSTEM.pixelRatio;
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.RENDER, this);

      if (this.markers) {
        this.markers.on('set-markers', this);
      }
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.RENDER, this);

      if (this.markers) {
        this.markers.off('set-markers', this);
      }

      this.psv.container.removeChild(this.container);
      delete this.canvas;
      delete this.container;

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      var _e$changedTouches, _e$changedTouches2;

      switch (e.type) {
        case photoSphereViewer.CONSTANTS.EVENTS.RENDER:
          this.__update();

          break;

        case 'set-markers':
          this.prop.markers = e.args[0].filter(function (m) {
            var _m$data;

            return (_m$data = m.data) == null ? void 0 : _m$data.compass;
          });

          this.__update();

          break;

        case 'mouseenter':
        case 'mousemove':
        case 'touchmove':
          this.prop.mouse = ((_e$changedTouches = e.changedTouches) == null ? void 0 : _e$changedTouches[0]) || e;

          if (this.prop.mouseDown) {
            this.__click();
          } else {
            this.__update();
          }

          e.stopPropagation();
          e.preventDefault();
          break;

        case 'mousedown':
        case 'touchstart':
          this.prop.mouseDown = true;
          e.stopPropagation();
          e.preventDefault();
          break;

        case 'mouseup':
        case 'touchend':
          this.prop.mouse = ((_e$changedTouches2 = e.changedTouches) == null ? void 0 : _e$changedTouches2[0]) || e;
          this.prop.mouseDown = false;

          this.__click();

          if (e.changedTouches) {
            this.prop.mouse = null;

            this.__update();
          }

          e.stopPropagation();
          e.preventDefault();
          break;

        case 'mouseleave':
          this.prop.mouse = null;
          this.prop.mouseDown = false;

          this.__update();

          break;
      }
    }
    /**
     * @summary Hides the compass
     */
    ;

    _proto.hide = function hide() {
      this.container.style.display = 'none';
      this.prop.visible = false;
    }
    /**
     * @summary Shows the compass
     */
    ;

    _proto.show = function show() {
      this.container.style.display = '';
      this.prop.visible = true;
    }
    /**
     * @summary Changes the hotspots on the compass
     * @param {PSV.plugins.CompassPlugin.Hotspot[]} hotspots
     */
    ;

    _proto.setHotspots = function setHotspots(hotspots) {
      this.config.hotspots = hotspots;

      this.__update();
    }
    /**
     * @summary Removes all hotspots
     */
    ;

    _proto.clearHotspots = function clearHotspots() {
      this.setHotspots(null);
    }
    /**
     * @summary Updates the compass for current zoom and position
     * @private
     */
    ;

    _proto.__update = function __update() {
      var _this2 = this,
          _this$config$hotspots;

      var context = this.canvas.getContext('2d');
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      var longitude = this.psv.getPosition().longitude;
      var fov = three.MathUtils.degToRad(this.psv.prop.hFov);

      this.__drawCone(context, this.config.coneColor, longitude, fov);

      var mouseAngle = this.__getMouseAngle();

      if (mouseAngle !== null) {
        this.__drawCone(context, this.config.navigationColor, mouseAngle, fov);
      }

      this.prop.markers.forEach(function (marker) {
        _this2.__drawMarker(context, marker);
      });
      (_this$config$hotspots = this.config.hotspots) == null ? void 0 : _this$config$hotspots.forEach(function (spot) {
        if ('longitude' in spot && !('latitude' in spot)) {
          spot.latitude = 0;
        }

        var pos = _this2.psv.dataHelper.cleanPosition(spot);

        _this2.__drawPoint(context, spot.color || _this2.config.hotspotColor, pos.longitude, pos.latitude);
      });
    }
    /**
     * @summary Rotates the viewer depending on the position of the mouse on the compass
     * @private
     */
    ;

    _proto.__click = function __click() {
      var mouseAngle = this.__getMouseAngle();

      if (mouseAngle !== null) {
        this.psv.rotate({
          longitude: mouseAngle,
          latitude: 0
        });
      }
    }
    /**
     * @summary Draw a cone
     * @param {CanvasRenderingContext2D} context
     * @param {string} color
     * @param {number} longitude - in viewer reference
     * @param {number} fov
     * @private
     */
    ;

    _proto.__drawCone = function __drawCone(context, color, longitude, fov) {
      var a1 = longitude - Math.PI / 2 - fov / 2;
      var a2 = a1 + fov;
      var c = this.canvas.width / 2;
      context.beginPath();
      context.moveTo(c, c);
      context.lineTo(c + Math.cos(a1) * c, c + Math.sin(a1) * c);
      context.arc(c, c, c, a1, a2, false);
      context.lineTo(c, c);
      context.fillStyle = color;
      context.fill();
    }
    /**
     * @summary Draw a Marker
     * @param {CanvasRenderingContext2D} context
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @private
     */
    ;

    _proto.__drawMarker = function __drawMarker(context, marker) {
      var _this3 = this;

      var color = this.config.hotspotColor;

      if (typeof marker.data.compass === 'string') {
        color = marker.data.compass;
      }

      if (marker.isPoly()) {
        context.beginPath();
        marker.props.def.forEach(function (_ref, i) {
          var longitude = _ref[0],
              latitude = _ref[1];
          var a = longitude - Math.PI / 2;
          var d = (latitude + Math.PI / 2) / Math.PI;
          var c = _this3.canvas.width / 2;
          context[i === 0 ? 'moveTo' : 'lineTo'](c + Math.cos(a) * c * d, c + Math.sin(a) * c * d);
        });

        if (marker.isPolygon()) {
          context.fillStyle = color;
          context.fill();
        } else {
          context.strokeStyle = color;
          context.lineWidth = Math.max(1, this.canvas.width * HOTSPOT_SIZE_RATIO / 2);
          context.stroke();
        }
      } else {
        var pos = marker.props.position;

        this.__drawPoint(context, color, pos.longitude, pos.latitude);
      }
    }
    /**
     * @summary Draw a point
     * @param {CanvasRenderingContext2D} context
     * @param {string} color
     * @param {number} longitude - in viewer reference
     * @param {number} latitude - in viewer reference
     * @private
     */
    ;

    _proto.__drawPoint = function __drawPoint(context, color, longitude, latitude) {
      var a = longitude - Math.PI / 2;
      var d = (latitude + Math.PI / 2) / Math.PI;
      var c = this.canvas.width / 2;
      var r = Math.max(2, this.canvas.width * HOTSPOT_SIZE_RATIO);
      context.beginPath();
      context.ellipse(c + Math.cos(a) * c * d, c + Math.sin(a) * c * d, r, r, 0, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    }
    /**
     * @summary Gets the longitude corresponding to the mouse position on the compass
     * @return {number | null}
     * @private
     */
    ;

    _proto.__getMouseAngle = function __getMouseAngle() {
      if (!this.prop.mouse) {
        return null;
      }

      var boundingRect = this.container.getBoundingClientRect();
      var mouseX = this.prop.mouse.clientX - boundingRect.left - boundingRect.width / 2;
      var mouseY = this.prop.mouse.clientY - boundingRect.top - boundingRect.width / 2;

      if (Math.sqrt(mouseX * mouseX + mouseY * mouseY) > boundingRect.width / 2) {
        return null;
      }

      return Math.atan2(mouseY, mouseX) + Math.PI / 2;
    };

    return CompassPlugin;
  }(photoSphereViewer.AbstractPlugin);
  CompassPlugin.id = 'compass';

  exports.CompassPlugin = CompassPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=compass.js.map
