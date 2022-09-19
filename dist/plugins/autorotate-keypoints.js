/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.AutorotateKeypointsPlugin = {}), global.THREE, global.PhotoSphereViewer));
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
   * @typedef {Object} PSV.plugins.AutorotateKeypointsPlugin.KeypointObject
   * @property {PSV.ExtendedPosition} [position]
   * @property {string} [markerId] - use the position and tooltip of a marker
   * @property {number} [pause=0] - pause the animation when reaching this point, will display the tooltip if available
   * @property {string|{content: string, position: string}} [tooltip]
   */

  /**
   * @typedef {PSV.ExtendedPosition|string|PSV.plugins.AutorotateKeypointsPlugin.KeypointObject} PSV.plugins.AutorotateKeypointsPlugin.Keypoint
   * @summary Definition of keypoints for automatic rotation, can be a position object, a marker id or an keypoint object
   */

  /**
   * @typedef {Object} PSV.plugins.AutorotateKeypointsPlugin.Options
   * @property {boolean} [startFromClosest=true] - start from the closest keypoint instead of the first keypoint
   * @property {PSV.plugins.AutorotateKeypointsPlugin.Keypoint[]} keypoints
   */

  var NUM_STEPS = 16;

  function serializePt(position) {
    return [position.longitude, position.latitude];
  }
  /**
   * @summary Replaces the standard autorotate animation by a smooth transition between multiple points
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */


  var AutorotateKeypointsPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(AutorotateKeypointsPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.AutorotateKeypointsPlugin.Options} [options]
     */
    function AutorotateKeypointsPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {Object}
       * @property {number} idx -  current index in keypoints
       * @property {number[][]} curve - curve between idx and idx + 1
       * @property {number[]} startStep - start point of the current step
       * @property {number[]} endStep - end point of the current step
       * @property {number} startTime - start time of the current step
       * @property {number} stepDuration - expected duration of the step
       * @property {number} remainingPause - time remaining for the pause
       * @property {number} lastTime - previous timestamp in render loop
       * @property {PSV.components.Tooltip} tooltip - currently displayed tooltip
       * @private
       */

      _this.state = {};
      /**
       * @member {PSV.plugins.AutorotateKeypointsPlugin.Options}
       * @private
       */

      _this.config = _extends({
        startFromClosest: true
      }, options);
      /**
       * @type {PSV.plugins.AutorotateKeypointsPlugin.Keypoint[]} keypoints
       */

      _this.keypoints = null;
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


    var _proto = AutorotateKeypointsPlugin.prototype;

    _proto.init = function init() {
      _AbstractPlugin.prototype.init.call(this);

      this.markers = this.psv.getPlugin('markers');

      if (this.config.keypoints) {
        this.setKeypoints(this.config.keypoints);
        delete this.config.keypoints;
      }

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.AUTOROTATE, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.AUTOROTATE, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER, this);
      delete this.markers;
      delete this.keypoints;

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      if (e.type === photoSphereViewer.CONSTANTS.EVENTS.AUTOROTATE) {
        this.__configure();
      } else if (e.type === photoSphereViewer.CONSTANTS.EVENTS.BEFORE_RENDER) {
        this.__beforeRender(e.args[0]);
      }
    }
    /**
     * @summary Changes the keypoints
     * @param {PSV.plugins.AutorotateKeypointsPlugin.Keypoint[]} keypoints
     */
    ;

    _proto.setKeypoints = function setKeypoints(keypoints) {
      var _this2 = this;

      if ((keypoints == null ? void 0 : keypoints.length) < 2) {
        throw new photoSphereViewer.PSVError('At least two points are required');
      }

      this.keypoints = photoSphereViewer.utils.clone(keypoints);

      if (this.keypoints) {
        this.keypoints.forEach(function (pt, i) {
          if (typeof pt === 'string') {
            pt = {
              markerId: pt
            };
          } else if (photoSphereViewer.utils.isExtendedPosition(pt)) {
            pt = {
              position: pt
            };
          }

          if (pt.markerId) {
            if (!_this2.markers) {
              throw new photoSphereViewer.PSVError("Keypoint #" + i + " references a marker but the markers plugin is not loaded");
            }

            var marker = _this2.markers.getMarker(pt.markerId);

            pt.position = serializePt(marker.props.position);
          } else if (pt.position) {
            pt.position = serializePt(_this2.psv.dataHelper.cleanPosition(pt.position));
          } else {
            throw new photoSphereViewer.PSVError("Keypoint #" + i + " is missing marker or position");
          }

          if (typeof pt.tooltip === 'string') {
            pt.tooltip = {
              content: pt.tooltip
            };
          }

          _this2.keypoints[i] = pt;
        });
      }

      this.__configure();
    }
    /**
     * @private
     */
    ;

    _proto.__configure = function __configure() {
      if (!this.psv.isAutorotateEnabled() || !this.keypoints) {
        this.__hideTooltip();

        this.state = {};
        return;
      } // cancel core rotation


      this.psv.dynamics.position.stop();
      this.state = {
        idx: -1,
        curve: [],
        startStep: null,
        endStep: null,
        startTime: null,
        stepDuration: null,
        remainingPause: null,
        lastTime: null,
        tooltip: null
      };

      if (this.config.startFromClosest) {
        var _this$keypoints;

        var currentPosition = serializePt(this.psv.getPosition());

        var index = this.__findMinIndex(this.keypoints, function (keypoint) {
          return photoSphereViewer.utils.greatArcDistance(keypoint.position, currentPosition);
        });

        (_this$keypoints = this.keypoints).push.apply(_this$keypoints, this.keypoints.splice(0, index));
      }
    }
    /**
     * @private
     */
    ;

    _proto.__beforeRender = function __beforeRender(timestamp) {
      if (this.psv.isAutorotateEnabled()) {
        // initialisation
        if (!this.state.startTime) {
          this.state.endStep = serializePt(this.psv.getPosition());

          this.__nextStep();

          this.state.startTime = timestamp;
          this.state.lastTime = timestamp;
        }

        this.__nextFrame(timestamp);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__incrementIdx = function __incrementIdx() {
      this.state.idx++;

      if (this.state.idx === this.keypoints.length) {
        this.state.idx = 0;
      }
    }
    /**
     * @private
     */
    ;

    _proto.__showTooltip = function __showTooltip() {
      var keypoint = this.keypoints[this.state.idx];

      if (keypoint.tooltip) {
        var position = this.psv.dataHelper.vector3ToViewerCoords(this.psv.prop.direction);
        this.state.tooltip = this.psv.tooltip.create({
          content: keypoint.tooltip.content,
          position: keypoint.tooltip.position,
          top: position.y,
          left: position.x
        });
      } else if (keypoint.markerId) {
        var marker = this.markers.getMarker(keypoint.markerId);
        marker.showTooltip();
        this.state.tooltip = marker.tooltip;
      }
    }
    /**
     * @private
     */
    ;

    _proto.__hideTooltip = function __hideTooltip() {
      if (this.state.tooltip) {
        var keypoint = this.keypoints[this.state.idx];

        if (keypoint.tooltip) {
          this.state.tooltip.hide();
        } else if (keypoint.markerId) {
          var marker = this.markers.getMarker(keypoint.markerId);
          marker.hideTooltip();
        }

        this.state.tooltip = null;
      }
    }
    /**
     * @private
     */
    ;

    _proto.__nextPoint = function __nextPoint() {
      // get the 4 points necessary to compute the current movement
      // the two points of the current segments and one point before and after
      var workPoints = [];

      if (this.state.idx === -1) {
        var currentPosition = serializePt(this.psv.getPosition());
        workPoints.push(currentPosition, currentPosition, this.keypoints[0].position, this.keypoints[1].position);
      } else {
        for (var i = -1; i < 3; i++) {
          var keypoint = this.state.idx + i < 0 ? this.keypoints[this.keypoints.length - 1] : this.keypoints[(this.state.idx + i) % this.keypoints.length];
          workPoints.push(keypoint.position);
        }
      } // apply offsets to avoid crossing the origin


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

      var curve = new three.SplineCurve(workVectors).getPoints(NUM_STEPS * 3).map(function (p) {
        return [p.x, p.y];
      }); // debugCurve(this.markers, curve, NUM_STEPS);
      // only keep the curve for the current movement

      this.state.curve = curve.slice(NUM_STEPS + 1, NUM_STEPS * 2 + 1);

      if (this.state.idx !== -1) {
        this.state.remainingPause = this.keypoints[this.state.idx].pause;

        if (this.state.remainingPause) {
          this.__showTooltip();
        } else {
          this.__incrementIdx();
        }
      } else {
        this.__incrementIdx();
      }
    }
    /**
     * @private
     */
    ;

    _proto.__nextStep = function __nextStep() {
      if (this.state.curve.length === 0) {
        this.__nextPoint(); // reset transformation made to the previous point


        this.state.endStep[0] = photoSphereViewer.utils.parseAngle(this.state.endStep[0]);
      } // target next point


      this.state.startStep = this.state.endStep;
      this.state.endStep = this.state.curve.shift(); // compute duration from distance and speed

      var distance = photoSphereViewer.utils.greatArcDistance(this.state.startStep, this.state.endStep);
      this.state.stepDuration = distance * 1000 / Math.abs(this.psv.config.autorotateSpeed);

      if (distance === 0) {
        // edge case
        this.__nextStep();
      }
    }
    /**
     * @private
     */
    ;

    _proto.__nextFrame = function __nextFrame(timestamp) {
      var ellapsed = timestamp - this.state.lastTime;
      this.state.lastTime = timestamp; // currently paused

      if (this.state.remainingPause) {
        this.state.remainingPause = Math.max(0, this.state.remainingPause - ellapsed);

        if (this.state.remainingPause > 0) {
          return;
        } else {
          this.__hideTooltip();

          this.__incrementIdx();

          this.state.startTime = timestamp;
        }
      }

      var progress = (timestamp - this.state.startTime) / this.state.stepDuration;

      if (progress >= 1) {
        this.__nextStep();

        progress = 0;
        this.state.startTime = timestamp;
      }

      this.psv.rotate({
        longitude: this.state.startStep[0] + (this.state.endStep[0] - this.state.startStep[0]) * progress,
        latitude: this.state.startStep[1] + (this.state.endStep[1] - this.state.startStep[1]) * progress
      });
    }
    /**
     * @private
     */
    ;

    _proto.__findMinIndex = function __findMinIndex(array, mapper) {
      var idx = 0;
      var current = Number.MAX_VALUE;
      array.forEach(function (item, i) {
        var value = mapper ? mapper(item) : item;

        if (value < current) {
          current = value;
          idx = i;
        }
      });
      return idx;
    };

    return AutorotateKeypointsPlugin;
  }(photoSphereViewer.AbstractPlugin);
  AutorotateKeypointsPlugin.id = 'autorotate-keypoints';

  exports.AutorotateKeypointsPlugin = AutorotateKeypointsPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=autorotate-keypoints.js.map
