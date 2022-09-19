/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.VisibleRangePlugin = {}), global.THREE, global.PhotoSphereViewer));
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

  /**
   * @typedef {Object} PSV.plugins.VisibleRangePlugin.Options
   * @property {double[]|string[]} [latitudeRange] - latitude range as two angles
   * @property {double[]|string[]} [longitudeRange] - longitude range as two angles
   * @property {boolean} [usePanoData=false] - use panoData as visible range, you can also manually call `setRangesFromPanoData`
   */

  var EPS = 0.000001;
  /**
   * @summary Locks visible longitude and/or latitude
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var VisibleRangePlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(VisibleRangePlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.VisibleRangePlugin.Options} options
     */
    function VisibleRangePlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {PSV.plugins.VisibleRangePlugin.Options}
       * @private
       */

      _this.config = _extends({
        latitudeRange: null,
        longitudeRange: null,
        usePanoData: false
      }, options);
      return _this;
    }
    /**
     * @package
     */


    var _proto = VisibleRangePlugin.prototype;

    _proto.init = function init() {
      _AbstractPlugin.prototype.init.call(this);

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.on(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION, this);
      this.psv.on(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ROTATE_POSITION, this);
      this.setLatitudeRange(this.config.latitudeRange);
      this.setLongitudeRange(this.config.longitudeRange);
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION, this);
      this.psv.off(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ROTATE_POSITION, this);

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    // eslint-disable-next-line consistent-return
    ;

    _proto.handleEvent = function handleEvent(e) {
      var sidesReached;
      var rangedPosition;
      var currentPosition;

      switch (e.type) {
        case photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION:
        case photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ROTATE_POSITION:
          currentPosition = e.value;

          var _this$applyRanges = this.applyRanges(currentPosition);

          rangedPosition = _this$applyRanges.rangedPosition;
          return rangedPosition;

        case photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED:
          currentPosition = e.args[0];

          var _this$applyRanges2 = this.applyRanges(currentPosition);

          sidesReached = _this$applyRanges2.sidesReached;
          rangedPosition = _this$applyRanges2.rangedPosition;

          if ((sidesReached.left || sidesReached.right) && this.psv.isAutorotateEnabled()) {
            this.__reverseAutorotate(sidesReached.left, sidesReached.right);
          } else if (Math.abs(currentPosition.longitude - rangedPosition.longitude) > EPS || Math.abs(currentPosition.latitude - rangedPosition.latitude) > EPS) {
            this.psv.dynamics.position.setValue(rangedPosition);
          }

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED:
          if (this.config.usePanoData) {
            this.setRangesFromPanoData();
          }

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED:
          currentPosition = this.psv.getPosition();

          var _this$applyRanges3 = this.applyRanges(currentPosition);

          rangedPosition = _this$applyRanges3.rangedPosition;

          if (Math.abs(currentPosition.longitude - rangedPosition.longitude) > EPS || Math.abs(currentPosition.latitude - rangedPosition.latitude) > EPS) {
            this.psv.rotate(rangedPosition);
          }

          break;
      }
    }
    /**
     * @summary Changes the latitude range
     * @param {double[]|string[]} range - latitude range as two angles
     */
    ;

    _proto.setLatitudeRange = function setLatitudeRange(range) {
      // latitude range must have two values
      if (range && range.length !== 2) {
        photoSphereViewer.utils.logWarn('latitude range must have exactly two elements');
        range = null;
      } // latitude range must be ordered
      else if (range && range[0] > range[1]) {
        photoSphereViewer.utils.logWarn('latitude range values must be ordered');
        range = [range[1], range[0]];
      } // latitude range is between -PI/2 and PI/2


      if (range) {
        this.config.latitudeRange = range.map(function (angle) {
          return photoSphereViewer.utils.parseAngle(angle, true);
        });
      } else {
        this.config.latitudeRange = null;
      }

      if (this.psv.prop.ready) {
        this.psv.rotate(this.psv.getPosition());
      }
    }
    /**
     * @summary Changes the longitude range
     * @param {double[]|string[]} range - longitude range as two angles
     */
    ;

    _proto.setLongitudeRange = function setLongitudeRange(range) {
      // longitude range must have two values
      if (range && range.length !== 2) {
        photoSphereViewer.utils.logWarn('longitude range must have exactly two elements');
        range = null;
      } // longitude range is between 0 and 2*PI


      if (range) {
        this.config.longitudeRange = range.map(function (angle) {
          return photoSphereViewer.utils.parseAngle(angle);
        });
      } else {
        this.config.longitudeRange = null;
      }

      if (this.psv.prop.ready) {
        this.psv.rotate(this.psv.getPosition());
      }
    }
    /**
     * @summary Changes the latitude and longitude ranges according the current panorama cropping data
     */
    ;

    _proto.setRangesFromPanoData = function setRangesFromPanoData() {
      this.setLatitudeRange(this.getPanoLatitudeRange());
      this.setLongitudeRange(this.getPanoLongitudeRange());
    }
    /**
     * @summary Gets the latitude range defined by the viewer's panoData
     * @returns {double[]|null}
     * @private
     */
    ;

    _proto.getPanoLatitudeRange = function getPanoLatitudeRange() {
      var p = this.psv.prop.panoData;

      if (p.croppedHeight === p.fullHeight) {
        return null;
      } else {
        var latitude = function latitude(y) {
          return Math.PI * (1 - y / p.fullHeight) - Math.PI / 2;
        };

        return [latitude(p.croppedY + p.croppedHeight), latitude(p.croppedY)];
      }
    }
    /**
     * @summary Gets the longitude range defined by the viewer's panoData
     * @returns {double[]|null}
     * @private
     */
    ;

    _proto.getPanoLongitudeRange = function getPanoLongitudeRange() {
      var p = this.psv.prop.panoData;

      if (p.croppedWidth === p.fullWidth) {
        return null;
      } else {
        var longitude = function longitude(x) {
          return 2 * Math.PI * (x / p.fullWidth) - Math.PI;
        };

        return [longitude(p.croppedX), longitude(p.croppedX + p.croppedWidth)];
      }
    }
    /**
     * @summary Apply "longitudeRange" and "latitudeRange"
     * @param {PSV.Position} position
     * @returns {{rangedPosition: PSV.Position, sidesReached: string[]}}
     * @private
     */
    ;

    _proto.applyRanges = function applyRanges(position) {
      var rangedPosition = {
        longitude: position.longitude,
        latitude: position.latitude
      };
      var sidesReached = {};
      var range;
      var offset;

      if (this.config.longitudeRange) {
        range = photoSphereViewer.utils.clone(this.config.longitudeRange);
        offset = three.MathUtils.degToRad(this.psv.prop.hFov) / 2;
        range[0] = photoSphereViewer.utils.parseAngle(range[0] + offset);
        range[1] = photoSphereViewer.utils.parseAngle(range[1] - offset);

        if (range[0] > range[1]) {
          // when the range cross longitude 0
          if (position.longitude > range[1] && position.longitude < range[0]) {
            if (position.longitude > range[0] / 2 + range[1] / 2) {
              // detect which side we are closer too
              rangedPosition.longitude = range[0];
              sidesReached.left = true;
            } else {
              rangedPosition.longitude = range[1];
              sidesReached.right = true;
            }
          }
        } else if (position.longitude < range[0]) {
          rangedPosition.longitude = range[0];
          sidesReached.left = true;
        } else if (position.longitude > range[1]) {
          rangedPosition.longitude = range[1];
          sidesReached.right = true;
        }
      }

      if (this.config.latitudeRange) {
        range = photoSphereViewer.utils.clone(this.config.latitudeRange);
        offset = three.MathUtils.degToRad(this.psv.prop.vFov) / 2;
        range[0] = photoSphereViewer.utils.parseAngle(range[0] + offset, true);
        range[1] = photoSphereViewer.utils.parseAngle(range[1] - offset, true); // for very a narrow images, lock the latitude to the center

        if (range[0] > range[1]) {
          range[0] = (range[0] + range[1]) / 2;
          range[1] = range[0];
        }

        if (position.latitude < range[0]) {
          rangedPosition.latitude = range[0];
          sidesReached.bottom = true;
        } else if (position.latitude > range[1]) {
          rangedPosition.latitude = range[1];
          sidesReached.top = true;
        }
      }

      return {
        rangedPosition: rangedPosition,
        sidesReached: sidesReached
      };
    }
    /**
     * @summary Reverses autorotate direction with smooth transition
     * @private
     */
    ;

    _proto.__reverseAutorotate = function __reverseAutorotate(left, right) {
      // reverse already ongoing
      if (left && this.psv.config.autorotateSpeed > 0 || right && this.psv.config.autorotateSpeed < 0) {
        return;
      }

      this.psv.config.autorotateSpeed = -this.psv.config.autorotateSpeed;
      this.psv.startAutorotate(true);
    };

    return VisibleRangePlugin;
  }(photoSphereViewer.AbstractPlugin);
  VisibleRangePlugin.id = 'visible-range';

  exports.VisibleRangePlugin = VisibleRangePlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=visible-range.js.map
