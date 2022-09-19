/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.MarkersPlugin = {}), global.THREE, global.PhotoSphereViewer));
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

  var pinList = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"9 9 81 81\"><path fill=\"currentColor\" d=\"M37.5 90S9.9 51.9 9.9 36.6 22.2 9 37.5 9s27.6 12.4 27.6 27.6S37.5 90 37.5 90zm0-66.3c-6.1 0-11 4.9-11 11s4.9 11 11 11 11-4.9 11-11-4.9-11-11-11zM86.7 55H70c-1.8 0-3.3-1.5-3.3-3.3s1.5-3.3 3.3-3.3h16.7c1.8 0 3.3 1.5 3.3 3.3S88.5 55 86.7 55zm0-25h-15a3.3 3.3 0 0 1-3.3-3.3c0-1.8 1.5-3.3 3.3-3.3h15c1.8 0 3.3 1.5 3.3 3.3 0 1.8-1.5 3.3-3.3 3.3zM56.5 73h30c1.8 0 3.3 1.5 3.3 3.3 0 1.8-1.5 3.3-3.3 3.3h-30a3.3 3.3 0 0 1-3.3-3.3 3.2 3.2 0 0 1 3.3-3.3z\"/><!--Created by Rohith M S from the Noun Project--></svg>\n";

  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.MarkersPlugin
   * @constant
   */

  var EVENTS = {
    /**
     * @event marker-visibility
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the visibility of a marker changes
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @param {boolean} visible
     */
    MARKER_VISIBILITY: 'marker-visibility',

    /**
     * @event goto-marker-done
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the animation to a marker is done
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     */
    GOTO_MARKER_DONE: 'goto-marker-done',

    /**
     * @event leave-marker
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the user puts the cursor away from a marker
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     */
    LEAVE_MARKER: 'leave-marker',

    /**
     * @event over-marker
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the user puts the cursor hover a marker
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     */
    OVER_MARKER: 'over-marker',

    /**
     * @event filter:render-markers-list
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Used to alter the list of markers displayed on the side-panel
     * @param {PSV.plugins.MarkersPlugin.Marker[]} markers
     * @returns {PSV.plugins.MarkersPlugin.Marker[]}
     */
    RENDER_MARKERS_LIST: 'render-markers-list',

    /**
     * @event select-marker
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the user clicks on a marker. The marker can be retrieved from outside the event handler
     * with {@link PSV.plugins.MarkersPlugin.getCurrentMarker}
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @param {PSV.plugins.MarkersPlugin.SelectMarkerData} data
     */
    SELECT_MARKER: 'select-marker',

    /**
     * @event select-marker-list
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when a marker is selected from the side panel
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     */
    SELECT_MARKER_LIST: 'select-marker-list',

    /**
     * @event unselect-marker
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when a marker was selected and the user clicks elsewhere
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     */
    UNSELECT_MARKER: 'unselect-marker',

    /**
     * @event hide-markers
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the markers are hidden
     */
    HIDE_MARKERS: 'hide-markers',

    /**
     * @event set-marker
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the list of markers changes
     * @param {PSV.plugins.MarkersPlugin.Marker[]} markers
     */
    SET_MARKERS: 'set-markers',

    /**
     * @event show-markers
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the markers are shown
     */
    SHOW_MARKERS: 'show-markers'
  };
  /**
   * @summary Types of tooltip events
   * @memberOf PSV.plugins.MarkersPlugin
   * @enum {string}
   * @constant
   * @private
   */

  var MARKER_TOOLTIP_TRIGGER = {
    click: 'click',
    hover: 'hover'
  };
  /**
   * @summary Namespace for SVG creation
   * @type {string}
   * @constant
   * @private
   */

  var SVG_NS = 'http://www.w3.org/2000/svg';
  /**
   * @summary Property name added to marker elements
   * @type {string}
   * @constant
   * @private
   */

  var MARKER_DATA = 'psvMarker';
  /**
   * @summary Panel identifier for marker content
   * @type {string}
   * @constant
   * @private
   */

  var ID_PANEL_MARKER = 'marker';
  /**
   * @summary Panel identifier for markers list
   * @type {string}
   * @constant
   * @private
   */

  var ID_PANEL_MARKERS_LIST = 'markersList';
  var MARKER_DATA_KEY = photoSphereViewer.utils.dasherize(MARKER_DATA);
  /**
   * @summary Markers list template
   * @param {PSV.plugins.MarkersPlugin.Marker[]} markers
   * @param {string} title
   * @returns {string}
   * @constant
   * @private
   */

  var MARKERS_LIST_TEMPLATE = function MARKERS_LIST_TEMPLATE(markers, title) {
    return "\n<div class=\"psv-panel-menu psv-panel-menu--stripped\">\n  <h1 class=\"psv-panel-menu-title\">" + pinList + " " + title + "</h1>\n  <ul class=\"psv-panel-menu-list\">\n    " + markers.map(function (marker) {
      return "\n    <li data-" + MARKER_DATA_KEY + "=\"" + marker.config.id + "\" class=\"psv-panel-menu-item\" tabindex=\"0\">\n      " + (marker.type === 'image' ? "<span class=\"psv-panel-menu-item-icon\"><img src=\"" + marker.config.image + "\"/></span>" : '') + "\n      <span class=\"psv-panel-menu-item-label\">" + marker.getListContent() + "</span>\n    </li>\n    ";
    }).join('') + "\n  </ul>\n</div>\n";
  };

  /**
   * Returns intermediary point between two points on the sphere
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   * @param {number[]} p1
   * @param {number[]} p2
   * @param {number} f
   * @returns {number[]}
   * @private
   */

  function greatArcIntermediaryPoint(p1, p2, f) {
    var λ1 = p1[0],
        φ1 = p1[1];
    var λ2 = p2[0],
        φ2 = p2[1];
    var r = photoSphereViewer.utils.greatArcDistance(p1, p2);
    var a = Math.sin((1 - f) * r) / Math.sin(r);
    var b = Math.sin(f * r) / Math.sin(r);
    var x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    var y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    var z = a * Math.sin(φ1) + b * Math.sin(φ2);
    return [Math.atan2(y, x), Math.atan2(z, Math.sqrt(x * x + y * y))];
  }
  /**
   * @summary Computes the center point of a polygon
   * @todo Get "visual center" (https://blog.mapbox.com/a-new-algorithm-for-finding-a-visual-center-of-a-polygon-7c77e6492fbc)
   * @param {number[][]} polygon
   * @returns {number[]}
   * @private
   */

  function getPolygonCenter(polygon) {
    // apply offsets to avoid crossing the origin
    var workPoints = [polygon[0]];
    var k = 0;

    for (var i = 1; i < polygon.length; i++) {
      var d = polygon[i - 1][0] - polygon[i][0];

      if (d > Math.PI) {
        // crossed the origin left to right
        k += 1;
      } else if (d < -Math.PI) {
        // crossed the origin right to left
        k -= 1;
      }

      workPoints.push([polygon[i][0] + k * 2 * Math.PI, polygon[i][1]]);
    }

    var sum = workPoints.reduce(function (intermediary, point) {
      return [intermediary[0] + point[0], intermediary[1] + point[1]];
    });
    return [photoSphereViewer.utils.parseAngle(sum[0] / polygon.length), sum[1] / polygon.length];
  }
  /**
   * @summary Computes the middle point of a polyline
   * @param {number[][]} polyline
   * @returns {number[]}
   * @private
   */

  function getPolylineCenter(polyline) {
    // compute each segment length + total length
    var length = 0;
    var lengths = [];

    for (var i = 0; i < polyline.length - 1; i++) {
      var l = photoSphereViewer.utils.greatArcDistance(polyline[i], polyline[i + 1]) * photoSphereViewer.CONSTANTS.SPHERE_RADIUS;
      lengths.push(l);
      length += l;
    } // iterate until length / 2


    var consumed = 0;

    for (var j = 0; j < polyline.length - 1; j++) {
      // once the segment containing the middle point is found, computes the intermediary point
      if (consumed + lengths[j] > length / 2) {
        var r = (length / 2 - consumed) / lengths[j];
        return greatArcIntermediaryPoint(polyline[j], polyline[j + 1], r);
      }

      consumed += lengths[j];
    } // this never happens


    return polyline[Math.round(polyline.length / 2)];
  }

  /**
   * @summary Types of marker
   * @memberOf PSV.plugins.MarkersPlugin
   * @enum {string}
   * @constant
   * @private
   */

  var MARKER_TYPES = {
    image: 'image',
    imageLayer: 'imageLayer',
    html: 'html',
    polygonPx: 'polygonPx',
    polygonRad: 'polygonRad',
    polylinePx: 'polylinePx',
    polylineRad: 'polylineRad',
    square: 'square',
    rect: 'rect',
    circle: 'circle',
    ellipse: 'ellipse',
    path: 'path'
  };
  /**
   * @typedef {Object} PSV.plugins.MarkersPlugin.Properties
   * @summary Marker properties, see {@link https://photo-sphere-viewer.js.org/plugins/plugin-markers.html#markers-options}
   */

  /**
   * @summary Object representing a marker
   * @memberOf PSV.plugins.MarkersPlugin
   */

  var Marker = /*#__PURE__*/function () {
    /**
     * @param {PSV.plugins.MarkersPlugin.Properties} properties
     * @param {PSV.Viewer} psv
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    function Marker(properties, psv) {
      if (!properties.id) {
        throw new photoSphereViewer.PSVError('missing marker id');
      }
      /**
       * @member {PSV.Viewer}
       * @readonly
       * @protected
       */


      this.psv = psv;
      /**
       * @member {string}
       * @readonly
       */

      this.id = properties.id;
      /**
       * @member {string}
       * @readonly
       */

      this.type = Marker.getType(properties, false);
      /**
       * @member {boolean}
       * @protected
       */

      this.visible = true;
      /**
       * @member {HTMLElement|SVGElement|THREE.Object3D}
       * @readonly
       */

      this.$el = null;
      /**
       * @summary Original configuration of the marker
       * @member {PSV.plugins.MarkersPlugin.Properties}
       * @readonly
       */

      this.config = {};
      /**
       * @summary User data associated to the marker
       * @member {any}
       */

      this.data = undefined;
      /**
       * @summary Tooltip instance for this marker
       * @member {PSV.components.Tooltip}
       */

      this.tooltip = null;
      /**
       * @summary Computed properties
       * @member {Object}
       * @protected
       * @property {boolean} dynamicSize
       * @property {PSV.Point} anchor
       * @property {boolean} visible - actually visible in the view
       * @property {boolean} staticTooltip - the tooltip must always be shown
       * @property {PSV.Position} position - position in spherical coordinates
       * @property {PSV.Point} position2D - position in viewer coordinates
       * @property {external:THREE.Vector3[]} positions3D - positions in 3D space
       * @property {number} width
       * @property {number} height
       * @property {*} def
       */

      this.props = {
        dynamicSize: false,
        anchor: null,
        visible: false,
        staticTooltip: false,
        position: null,
        position2D: null,
        positions3D: null,
        width: null,
        height: null,
        def: null
      };
      /**
       * @summary THREE file loader
       * @type {THREE:TextureLoader}
       * @private
       */

      this.loader = null;

      if (this.is3d()) {
        this.loader = new three.TextureLoader();

        if (this.psv.config.withCredentials) {
          this.loader.setWithCredentials(true);
        }

        if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'object') {
          this.loader.setRequestHeader(this.psv.config.requestHeaders);
        }
      } // create element


      if (this.isNormal()) {
        this.$el = document.createElement('div');
      } else if (this.isPolygon()) {
        this.$el = document.createElementNS(SVG_NS, 'polygon');
      } else if (this.isPolyline()) {
        this.$el = document.createElementNS(SVG_NS, 'polyline');
      } else if (this.isSvg()) {
        var svgType = this.type === 'square' ? 'rect' : this.type;
        this.$el = document.createElementNS(SVG_NS, svgType);
      }

      if (!this.is3d()) {
        this.$el.id = "psv-marker-" + this.id;
        this.$el[MARKER_DATA] = this;
      }

      this.update(properties);
    }
    /**
     * @summary Destroys the marker
     */


    var _proto = Marker.prototype;

    _proto.destroy = function destroy() {
      delete this.$el[MARKER_DATA];
      delete this.$el;
      delete this.config;
      delete this.props;
      delete this.psv;
    }
    /**
     * @summary Checks if it is a 3D marker (imageLayer)
     * @returns {boolean}
     */
    ;

    _proto.is3d = function is3d() {
      return this.type === MARKER_TYPES.imageLayer;
    }
    /**
     * @summary Checks if it is a normal marker (image or html)
     * @returns {boolean}
     */
    ;

    _proto.isNormal = function isNormal() {
      return this.type === MARKER_TYPES.image || this.type === MARKER_TYPES.html;
    }
    /**
     * @summary Checks if it is a polygon/polyline marker
     * @returns {boolean}
     */
    ;

    _proto.isPoly = function isPoly() {
      return this.isPolygon() || this.isPolyline();
    }
    /**
     * @summary Checks if it is a polygon/polyline using pixel coordinates
     * @returns {boolean}
     */
    ;

    _proto.isPolyPx = function isPolyPx() {
      return this.type === MARKER_TYPES.polygonPx || this.type === MARKER_TYPES.polylinePx;
    }
    /**
     * @summary Checks if it is a polygon/polyline using radian coordinates
     * @returns {boolean}
     */
    ;

    _proto.isPolyRad = function isPolyRad() {
      return this.type === MARKER_TYPES.polygonRad || this.type === MARKER_TYPES.polylineRad;
    }
    /**
     * @summary Checks if it is a polygon marker
     * @returns {boolean}
     */
    ;

    _proto.isPolygon = function isPolygon() {
      return this.type === MARKER_TYPES.polygonPx || this.type === MARKER_TYPES.polygonRad;
    }
    /**
     * @summary Checks if it is a polyline marker
     * @returns {boolean}
     */
    ;

    _proto.isPolyline = function isPolyline() {
      return this.type === MARKER_TYPES.polylinePx || this.type === MARKER_TYPES.polylineRad;
    }
    /**
     * @summary Checks if it is an SVG marker
     * @returns {boolean}
     */
    ;

    _proto.isSvg = function isSvg() {
      return this.type === MARKER_TYPES.square || this.type === MARKER_TYPES.rect || this.type === MARKER_TYPES.circle || this.type === MARKER_TYPES.ellipse || this.type === MARKER_TYPES.path;
    }
    /**
     * @summary Computes marker scale from zoom level
     * @param {number} zoomLevel
     * @param {PSV.Position} position
     * @returns {number}
     */
    ;

    _proto.getScale = function getScale(zoomLevel, position) {
      if (!this.config.scale) {
        return 1;
      }

      if (typeof this.config.scale === 'function') {
        return this.config.scale(zoomLevel, position);
      }

      var scale = 1;

      if (Array.isArray(this.config.scale.zoom)) {
        var bounds = this.config.scale.zoom;
        scale *= bounds[0] + (bounds[1] - bounds[0]) * photoSphereViewer.CONSTANTS.EASINGS.inQuad(zoomLevel / 100);
      }

      if (Array.isArray(this.config.scale.longitude)) {
        var _bounds = this.config.scale.longitude;
        var halfFov = three.MathUtils.degToRad(this.psv.prop.hFov) / 2;
        var arc = Math.abs(photoSphereViewer.utils.getShortestArc(this.props.position.longitude, position.longitude));
        scale *= _bounds[1] + (_bounds[0] - _bounds[1]) * photoSphereViewer.CONSTANTS.EASINGS.outQuad(Math.max(0, (halfFov - arc) / halfFov));
      }

      return scale;
    }
    /**
     * @summary Returns the markers list content for the marker, it can be either :
     * - the `listContent`
     * - the `tooltip.content`
     * - the `html`
     * - the `id`
     * @returns {*}
     */
    ;

    _proto.getListContent = function getListContent() {
      if (this.config.listContent) {
        return this.config.listContent;
      } else if (this.config.tooltip.content) {
        return this.config.tooltip.content;
      } else if (this.config.html) {
        return this.config.html;
      } else {
        return this.id;
      }
    }
    /**
     * @summary Display the tooltip of this marker
     * @param {{clientX: number, clientY: number}} [mousePosition]
     */
    ;

    _proto.showTooltip = function showTooltip(mousePosition) {
      if (this.props.visible && this.config.tooltip.content && this.props.position2D) {
        var config = _extends({}, this.config.tooltip, {
          data: this
        });

        if (this.isPoly()) {
          config.box = {
            // separate the tooltip from the cursor
            width: this.psv.tooltip.size.arrow * 2,
            height: this.psv.tooltip.size.arrow * 2
          };

          if (mousePosition) {
            var viewerPos = photoSphereViewer.utils.getPosition(this.psv.container);
            config.top = mousePosition.clientY - viewerPos.top - this.psv.tooltip.size.arrow / 2;
            config.left = mousePosition.clientX - viewerPos.left - this.psv.tooltip.size.arrow;
          } else {
            config.top = this.props.position2D.y;
            config.left = this.props.position2D.x;
          }
        } else {
          config.top = this.props.position2D.y;
          config.left = this.props.position2D.x;
          config.box = {
            width: this.props.width,
            height: this.props.height
          };
        }

        if (this.tooltip) {
          this.tooltip.move(config);
        } else {
          this.tooltip = this.psv.tooltip.create(config);
        }
      }
    }
    /**
     * @summary Recompute the position of the tooltip
     */
    ;

    _proto.refreshTooltip = function refreshTooltip() {
      if (this.tooltip) {
        this.showTooltip();
      }
    }
    /**
     * @summary Hides the tooltip of this marker
     */
    ;

    _proto.hideTooltip = function hideTooltip() {
      if (this.tooltip) {
        this.tooltip.hide();
        this.tooltip = null;
      }
    }
    /**
     * @summary Updates the marker with new properties
     * @param {PSV.plugins.MarkersPlugin.Properties} properties
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    ;

    _proto.update = function update(properties) {
      var newType = Marker.getType(properties, true);

      if (newType !== undefined && newType !== this.type) {
        throw new photoSphereViewer.PSVError('cannot change marker type');
      }

      photoSphereViewer.utils.deepmerge(this.config, properties);

      if (typeof this.config.tooltip === 'string') {
        this.config.tooltip = {
          content: this.config.tooltip
        };
      }

      if (!this.config.tooltip) {
        this.config.tooltip = {};
      }

      if (!this.config.tooltip.trigger) {
        this.config.tooltip.trigger = MARKER_TOOLTIP_TRIGGER.hover;
      }

      this.data = this.config.data;
      this.visible = this.config.visible !== false;

      if (!this.is3d()) {
        var _this$config$opacity;

        // reset CSS class
        if (this.isNormal()) {
          this.$el.className = 'psv-marker psv-marker--normal';
        } else {
          this.$el.setAttribute('class', 'psv-marker psv-marker--svg');
        } // add CSS classes


        if (this.config.className) {
          photoSphereViewer.utils.addClasses(this.$el, this.config.className);
        }

        if (this.config.tooltip) {
          this.$el.classList.add('psv-marker--has-tooltip');
        }

        if (this.config.content) {
          this.$el.classList.add('psv-marler--has-content');
        } // apply style


        this.$el.style.opacity = (_this$config$opacity = this.config.opacity) != null ? _this$config$opacity : 1;

        if (this.config.style) {
          photoSphereViewer.utils.deepmerge(this.$el.style, this.config.style);
        }
      } // parse anchor


      this.props.anchor = photoSphereViewer.utils.parsePosition(this.config.anchor); // clean scale

      if (this.config.scale) {
        if (typeof this.config.scale === 'number') {
          photoSphereViewer.utils.logWarn('Single value marker scale is deprecated, please use an array of two values.');
          this.config.scale = {
            zoom: [0, this.config.scale]
          };
        }

        if (Array.isArray(this.config.scale)) {
          this.config.scale = {
            zoom: this.config.scale
          };
        }
      }

      if (this.isNormal()) {
        this.__updateNormal();
      } else if (this.isPoly()) {
        this.__updatePoly();
      } else if (this.isSvg()) {
        this.__updateSvg();
      } else if (this.is3d()) {
        this.__update3d();
      }
    }
    /**
     * @summary Updates a normal marker
     * @private
     */
    ;

    _proto.__updateNormal = function __updateNormal() {
      if (!photoSphereViewer.utils.isExtendedPosition(this.config)) {
        throw new photoSphereViewer.PSVError('missing marker position, latitude/longitude or x/y');
      }

      if (this.config.image && (!this.config.width || !this.config.height)) {
        throw new photoSphereViewer.PSVError('missing marker width/height');
      }

      if (this.config.width && this.config.height) {
        this.props.dynamicSize = false;
        this.props.width = this.config.width;
        this.props.height = this.config.height;
        this.$el.style.width = this.config.width + 'px';
        this.$el.style.height = this.config.height + 'px';
      } else {
        this.props.dynamicSize = true;
      }

      if (this.config.image) {
        this.props.def = this.config.image;
        this.$el.style.backgroundImage = "url(" + this.config.image + ")";
      } else if (this.config.html) {
        this.props.def = this.config.html;
        this.$el.innerHTML = this.config.html;
      } // set anchor


      this.$el.style.transformOrigin = this.props.anchor.x * 100 + "% " + this.props.anchor.y * 100 + "%"; // convert texture coordinates to spherical coordinates

      this.props.position = this.psv.dataHelper.cleanPosition(this.config); // compute x/y/z position

      this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];
    }
    /**
     * @summary Updates an SVG marker
     * @private
     */
    ;

    _proto.__updateSvg = function __updateSvg() {
      var _this = this;

      if (!photoSphereViewer.utils.isExtendedPosition(this.config)) {
        throw new photoSphereViewer.PSVError('missing marker position, latitude/longitude or x/y');
      }

      this.props.dynamicSize = true; // set content

      switch (this.type) {
        case MARKER_TYPES.square:
          this.props.def = {
            x: 0,
            y: 0,
            width: this.config.square,
            height: this.config.square
          };
          break;

        case MARKER_TYPES.rect:
          if (Array.isArray(this.config.rect)) {
            this.props.def = {
              x: 0,
              y: 0,
              width: this.config.rect[0],
              height: this.config.rect[1]
            };
          } else {
            this.props.def = {
              x: 0,
              y: 0,
              width: this.config.rect.width,
              height: this.config.rect.height
            };
          }

          break;

        case MARKER_TYPES.circle:
          this.props.def = {
            cx: this.config.circle,
            cy: this.config.circle,
            r: this.config.circle
          };
          break;

        case MARKER_TYPES.ellipse:
          if (Array.isArray(this.config.ellipse)) {
            this.props.def = {
              cx: this.config.ellipse[0],
              cy: this.config.ellipse[1],
              rx: this.config.ellipse[0],
              ry: this.config.ellipse[1]
            };
          } else {
            this.props.def = {
              cx: this.config.ellipse.rx,
              cy: this.config.ellipse.ry,
              rx: this.config.ellipse.rx,
              ry: this.config.ellipse.ry
            };
          }

          break;

        case MARKER_TYPES.path:
          this.props.def = {
            d: this.config.path
          };
          break;
        // no default
      }

      photoSphereViewer.utils.each(this.props.def, function (value, prop) {
        _this.$el.setAttributeNS(null, prop, value);
      }); // set style

      if (this.config.svgStyle) {
        photoSphereViewer.utils.each(this.config.svgStyle, function (value, prop) {
          _this.$el.setAttributeNS(null, photoSphereViewer.utils.dasherize(prop), value);
        });
      } else {
        this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
      } // convert texture coordinates to spherical coordinates


      this.props.position = this.psv.dataHelper.cleanPosition(this.config); // compute x/y/z position

      this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];
    }
    /**
     * @summary Updates a polygon marker
     * @private
     */
    ;

    _proto.__updatePoly = function __updatePoly() {
      var _this2 = this;

      this.props.dynamicSize = true; // set style

      if (this.config.svgStyle) {
        photoSphereViewer.utils.each(this.config.svgStyle, function (value, prop) {
          _this2.$el.setAttributeNS(null, photoSphereViewer.utils.dasherize(prop), value);
        });

        if (this.isPolyline() && !this.config.svgStyle.fill) {
          this.$el.setAttributeNS(null, 'fill', 'none');
        }
      } else if (this.isPolygon()) {
        this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
      } else if (this.isPolyline()) {
        this.$el.setAttributeNS(null, 'fill', 'none');
        this.$el.setAttributeNS(null, 'stroke', 'rgb(0,0,0)');
      } // fold arrays: [1,2,3,4] => [[1,2],[3,4]]


      var actualPoly = this.config.polygonPx || this.config.polygonRad || this.config.polylinePx || this.config.polylineRad;

      if (!Array.isArray(actualPoly[0])) {
        for (var i = 0; i < actualPoly.length; i++) {
          actualPoly.splice(i, 2, [actualPoly[i], actualPoly[i + 1]]);
        }
      } // convert texture coordinates to spherical coordinates


      if (this.isPolyPx()) {
        this.props.def = actualPoly.map(function (coord) {
          var sphericalCoords = _this2.psv.dataHelper.textureCoordsToSphericalCoords({
            x: coord[0],
            y: coord[1]
          });

          return [sphericalCoords.longitude, sphericalCoords.latitude];
        });
      } // clean angles
      else {
        this.props.def = actualPoly.map(function (coord) {
          return [photoSphereViewer.utils.parseAngle(coord[0]), photoSphereViewer.utils.parseAngle(coord[1], true)];
        });
      }

      var centroid = this.isPolygon() ? getPolygonCenter(this.props.def) : getPolylineCenter(this.props.def);
      this.props.position = {
        longitude: centroid[0],
        latitude: centroid[1]
      }; // compute x/y/z positions

      this.props.positions3D = this.props.def.map(function (coord) {
        return _this2.psv.dataHelper.sphericalCoordsToVector3({
          longitude: coord[0],
          latitude: coord[1]
        });
      });
    }
    /**
     * @summary Updates a 3D marker
     * @private
     */
    ;

    _proto.__update3d = function __update3d() {
      var _this3 = this;

      if (!this.config.width || !this.config.height) {
        throw new photoSphereViewer.PSVError('missing marker width/height');
      }

      this.props.dynamicSize = false;
      this.props.width = this.config.width;
      this.props.height = this.config.height; // convert texture coordinates to spherical coordinates

      this.props.position = this.psv.dataHelper.cleanPosition(this.config); // compute x/y/z position

      this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];

      switch (this.type) {
        case MARKER_TYPES.imageLayer:
          if (!this.$el) {
            var _this$config$opacity2, _mesh$userData;

            var material = new three.MeshBasicMaterial({
              transparent: true,
              opacity: (_this$config$opacity2 = this.config.opacity) != null ? _this$config$opacity2 : 1,
              depthTest: false
            });
            var geometry = new three.PlaneGeometry(1, 1);
            var mesh = new three.Mesh(geometry, material);
            mesh.userData = (_mesh$userData = {}, _mesh$userData[MARKER_DATA] = this, _mesh$userData);
            this.$el = new three.Group().add(mesh); // overwrite the visible property to be tied to the Marker instance
            // and do it without context bleed

            Object.defineProperty(this.$el, 'visible', {
              enumerable: true,
              get: function get() {
                return this.children[0].userData[MARKER_DATA].visible;
              },
              set: function set(visible) {
                this.children[0].userData[MARKER_DATA].visible = visible;
              }
            });
          }

          if (this.props.def !== this.config.imageLayer) {
            if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'function') {
              this.loader.setRequestHeader(this.psv.config.requestHeaders(this.config.imageLayer));
            }

            this.$el.children[0].material.map = this.loader.load(this.config.imageLayer, function (texture) {
              texture.anisotropy = 4;

              _this3.psv.needsUpdate();
            });
            this.props.def = this.config.imageLayer;
          }

          this.$el.children[0].position.set(this.props.anchor.x - 0.5, this.props.anchor.y - 0.5, 0);
          this.$el.position.copy(this.props.positions3D[0]);

          switch (this.config.orientation) {
            case 'horizontal':
              this.$el.lookAt(0, this.$el.position.y, 0);
              this.$el.rotateX(this.props.position.latitude < 0 ? -Math.PI / 2 : Math.PI / 2);
              break;

            case 'vertical-left':
              this.$el.lookAt(0, 0, 0);
              this.$el.rotateY(-Math.PI * 0.4);
              break;

            case 'vertical-right':
              this.$el.lookAt(0, 0, 0);
              this.$el.rotateY(Math.PI * 0.4);
              break;

            default:
              this.$el.lookAt(0, 0, 0);
              break;
          } // 100 is magic number that gives a coherent size at default zoom level


          this.$el.scale.set(this.config.width / 100, this.config.height / 100, 1);
          break;
        // no default
      }
    }
    /**
     * @summary Determines the type of a marker by the available properties
     * @param {Marker.Properties} properties
     * @param {boolean} [allowNone=false]
     * @returns {string}
     * @throws {PSV.PSVError} when the marker's type cannot be found
     */
    ;

    Marker.getType = function getType(properties, allowNone) {
      if (allowNone === void 0) {
        allowNone = false;
      }

      var found = [];
      photoSphereViewer.utils.each(MARKER_TYPES, function (type) {
        if (properties[type]) {
          found.push(type);
        }
      });

      if (found.length === 0 && !allowNone) {
        throw new photoSphereViewer.PSVError("missing marker content, either " + Object.keys(MARKER_TYPES).join(', '));
      } else if (found.length > 1) {
        throw new photoSphereViewer.PSVError("multiple marker content, either " + Object.keys(MARKER_TYPES).join(', '));
      }

      return found[0];
    };

    return Marker;
  }();

  var pin = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"10 9 81 81\"><path fill=\"currentColor\" d=\"M50.5 90S22.9 51.9 22.9 36.6 35.2 9 50.5 9s27.6 12.4 27.6 27.6S50.5 90 50.5 90zm0-66.3c-6.1 0-11 4.9-11 11s4.9 11 11 11 11-4.9 11-11-4.9-11-11-11z\"/><!--Created by Rohith M S from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar markers button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var MarkersButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(MarkersButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MarkersButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-markers-button', true) || this;
      /**
       * @type {PSV.plugins.MarkersPlugin}
       */

      _this.plugin = _this.psv.getPlugin('markers');

      if (_this.plugin) {
        _this.plugin.on(EVENTS.SHOW_MARKERS, _assertThisInitialized(_this));

        _this.plugin.on(EVENTS.HIDE_MARKERS, _assertThisInitialized(_this));

        _this.toggleActive(true);
      }

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = MarkersButton.prototype;

    _proto.destroy = function destroy() {
      if (this.plugin) {
        this.plugin.off(EVENTS.SHOW_MARKERS, this);
        this.plugin.off(EVENTS.HIDE_MARKERS, this);
      }

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
        // @formatter:off
        case EVENTS.SHOW_MARKERS:
          this.toggleActive(true);
          break;

        case EVENTS.HIDE_MARKERS:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles markers
     */
    ;

    _proto.onClick = function onClick() {
      if (this.plugin.prop.visible) {
        this.plugin.hide();
      } else {
        this.plugin.show();
      }
    };

    return MarkersButton;
  }(photoSphereViewer.AbstractButton);
  MarkersButton.id = 'markers';
  MarkersButton.icon = pin;

  /**
   * @summary Navigation bar markers list button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var MarkersListButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(MarkersListButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MarkersListButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-markers-list-button', true) || this;
      /**
       * @type {PSV.plugins.MarkersPlugin}
       */

      _this.plugin = _this.psv.getPlugin('markers');

      if (_this.plugin) {
        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL, _assertThisInitialized(_this));

        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLOSE_PANEL, _assertThisInitialized(_this));
      }

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = MarkersListButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLOSE_PANEL, this);

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
        // @formatter:off
        case photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL:
          this.toggleActive(e.args[0] === ID_PANEL_MARKERS_LIST);
          break;

        case photoSphereViewer.CONSTANTS.EVENTS.CLOSE_PANEL:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles markers list
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.toggleMarkersList();
    };

    return MarkersListButton;
  }(photoSphereViewer.AbstractButton);
  MarkersListButton.id = 'markersList';
  MarkersListButton.icon = pinList;

  /**
   * @typedef {Object} PSV.plugins.MarkersPlugin.Options
   * @property {boolean} [clickEventOnMarker=false] If a `click` event is triggered on the viewer additionally to the `select-marker` event.
   * @property {PSV.plugins.MarkersPlugin.Properties[]} [markers]
   */

  /**
   * @typedef {Object} PSV.plugins.MarkersPlugin.SelectMarkerData
   * @summary Data of the `select-marker` event
   * @property {boolean} dblclick - if the selection originated from a double click, the simple click is always fired before the double click
   * @property {boolean} rightclick - if the selection originated from a right click
   */
  // add markers buttons

  photoSphereViewer.DEFAULTS.lang[MarkersButton.id] = 'Markers';
  photoSphereViewer.DEFAULTS.lang[MarkersListButton.id] = 'Markers list';
  photoSphereViewer.registerButton(MarkersButton, 'caption:left');
  photoSphereViewer.registerButton(MarkersListButton, 'caption:left');
  /**
   * @summary Displays various markers on the viewer
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var MarkersPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(MarkersPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.MarkersPlugin.Options} [options]
     */
    function MarkersPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @summary All registered markers
       * @member {Object<string, PSV.plugins.MarkersPlugin.Marker>}
       */

      _this.markers = {};
      /**
       * @type {Object}
       * @property {boolean} visible - Visibility of the component
       * @property {PSV.plugins.MarkersPlugin.Marker} currentMarker - Last selected marker
       * @property {PSV.plugins.MarkersPlugin.Marker} hoveringMarker - Marker under the cursor
       * @private
       */

      _this.prop = {
        visible: true,
        currentMarker: null,
        hoveringMarker: null,
        stopObserver: null
      };
      /**
       * @type {PSV.plugins.MarkersPlugin.Options}
       */

      _this.config = _extends({
        clickEventOnMarker: false
      }, options);

      if ((options == null ? void 0 : options.listButton) === false || (options == null ? void 0 : options.hideButton) === false) {
        photoSphereViewer.utils.logWarn('MarkersPlugin: listButton and hideButton options are deprecated. ' + 'Please define the global navbar options according to your needs.');
      }
      /**
       * @member {HTMLElement}
       * @readonly
       */


      _this.container = document.createElement('div');
      _this.container.className = 'psv-markers';
      _this.container.style.cursor = _this.psv.config.mousemove ? 'move' : 'default';
      /**
       * @member {SVGElement}
       * @readonly
       */

      _this.svgContainer = document.createElementNS(SVG_NS, 'svg');

      _this.svgContainer.setAttribute('class', 'psv-markers-svg-container');

      _this.container.appendChild(_this.svgContainer); // Markers events via delegation


      _this.container.addEventListener('mouseenter', _assertThisInitialized(_this), true);

      _this.container.addEventListener('mouseleave', _assertThisInitialized(_this), true);

      _this.container.addEventListener('mousemove', _assertThisInitialized(_this), true);

      _this.container.addEventListener('contextmenu', _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @package
     */


    var _proto = MarkersPlugin.prototype;

    _proto.init = function init() {
      var _this2 = this;

      _AbstractPlugin.prototype.init.call(this);

      this.psv.container.appendChild(this.container); // Viewer events

      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.DOUBLE_CLICK, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.RENDER, this);
      this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CONFIG_CHANGED, this);
      this.psv.once(photoSphereViewer.CONSTANTS.EVENTS.READY, function () {
        if (_this2.config.markers) {
          _this2.setMarkers(_this2.config.markers);

          delete _this2.config.markers;
        }
      });
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      var _this$prop$stopObserv, _this$prop;

      this.clearMarkers(false);
      (_this$prop$stopObserv = (_this$prop = this.prop).stopObserver) == null ? void 0 : _this$prop$stopObserv.call(_this$prop);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.DOUBLE_CLICK, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.RENDER, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CONFIG_CHANGED, this);
      this.psv.container.removeChild(this.container);
      delete this.svgContainer;
      delete this.markers;
      delete this.container;

      _AbstractPlugin.prototype.destroy.call(this);
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
        // @formatter:off
        case 'mouseenter':
          this.__onMouseEnter(e, this.__getTargetMarker(e.target));

          break;

        case 'mouseleave':
          this.__onMouseLeave(e, this.__getTargetMarker(e.target));

          break;

        case 'mousemove':
          this.__onMouseMove(e, this.__getTargetMarker(e.target));

          break;

        case 'contextmenu':
          e.preventDefault();
          break;

        case photoSphereViewer.CONSTANTS.EVENTS.CLICK:
          this.__onClick(e, e.args[0], false);

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.DOUBLE_CLICK:
          this.__onClick(e, e.args[0], true);

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.RENDER:
          this.renderMarkers();
          break;

        case photoSphereViewer.CONSTANTS.OBJECT_EVENTS.ENTER_OBJECT:
          this.__onMouseEnter(e.detail.originalEvent, e.detail.data);

          break;

        case photoSphereViewer.CONSTANTS.OBJECT_EVENTS.LEAVE_OBJECT:
          this.__onMouseLeave(e.detail.originalEvent, e.detail.data);

          break;

        case photoSphereViewer.CONSTANTS.OBJECT_EVENTS.HOVER_OBJECT:
          this.__onMouseMove(e.detail.originalEvent, e.detail.data);

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.CONFIG_CHANGED:
          this.container.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Shows all markers
     * @fires PSV.plugins.MarkersPlugin.show-markers
     */
    ;

    _proto.show = function show() {
      this.prop.visible = true;
      this.renderMarkers();
      this.trigger(EVENTS.SHOW_MARKERS);
    }
    /**
     * @summary Hides all markers
     * @fires PSV.plugins.MarkersPlugin.hide-markers
     */
    ;

    _proto.hide = function hide() {
      this.prop.visible = false;
      this.renderMarkers();
      this.trigger(EVENTS.HIDE_MARKERS);
    }
    /**
     * @summary Toggles the visibility of all tooltips
     */
    ;

    _proto.toggleAllTooltips = function toggleAllTooltips() {
      if (this.prop.showAllTooltips) {
        this.hideAllTooltips();
      } else {
        this.showAllTooltips();
      }
    }
    /**
     * @summary Displays all tooltips
     */
    ;

    _proto.showAllTooltips = function showAllTooltips() {
      this.prop.showAllTooltips = true;
      photoSphereViewer.utils.each(this.markers, function (marker) {
        marker.props.staticTooltip = true;
        marker.showTooltip();
      });
    }
    /**
     * @summary Hides all tooltips
     */
    ;

    _proto.hideAllTooltips = function hideAllTooltips() {
      this.prop.showAllTooltips = false;
      photoSphereViewer.utils.each(this.markers, function (marker) {
        marker.props.staticTooltip = false;
        marker.hideTooltip();
      });
    }
    /**
     * @summary Returns the total number of markers
     * @returns {number}
     */
    ;

    _proto.getNbMarkers = function getNbMarkers() {
      return Object.keys(this.markers).length;
    }
    /**
     * @summary Returns all the markers
     * @return {PSV.plugins.MarkersPlugin.Marker[]}
     */
    ;

    _proto.getMarkers = function getMarkers() {
      return Object.values(this.markers);
    }
    /**
     * @summary Adds a new marker to viewer
     * @param {PSV.plugins.MarkersPlugin.Properties} properties
     * @param {boolean} [render=true] - renders the marker immediately
     * @returns {PSV.plugins.MarkersPlugin.Marker}
     * @throws {PSV.PSVError} when the marker's id is missing or already exists
     */
    ;

    _proto.addMarker = function addMarker(properties, render) {
      if (render === void 0) {
        render = true;
      }

      if (this.markers[properties.id]) {
        throw new photoSphereViewer.PSVError("marker \"" + properties.id + "\" already exists");
      }

      var marker = new Marker(properties, this.psv);

      if (marker.isNormal()) {
        this.container.appendChild(marker.$el);
      } else if (marker.isPoly() || marker.isSvg()) {
        this.svgContainer.appendChild(marker.$el);
      } else if (marker.is3d()) {
        this.psv.renderer.scene.add(marker.$el);
      }

      this.markers[marker.id] = marker;

      if (render) {
        this.renderMarkers();

        this.__refreshUi();

        this.__checkObjectsObserver();

        this.trigger(EVENTS.SET_MARKERS, this.getMarkers());
      }

      return marker;
    }
    /**
     * @summary Returns the internal marker object for a marker id
     * @param {string} markerId
     * @returns {PSV.plugins.MarkersPlugin.Marker}
     * @throws {PSV.PSVError} when the marker cannot be found
     */
    ;

    _proto.getMarker = function getMarker(markerId) {
      var id = typeof markerId === 'object' ? markerId.id : markerId;

      if (!this.markers[id]) {
        throw new photoSphereViewer.PSVError("cannot find marker \"" + id + "\"");
      }

      return this.markers[id];
    }
    /**
     * @summary Returns the last marker selected by the user
     * @returns {PSV.plugins.MarkersPlugin.Marker}
     */
    ;

    _proto.getCurrentMarker = function getCurrentMarker() {
      return this.prop.currentMarker;
    }
    /**
     * @summary Updates the existing marker with the same id
     * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
     * @param {PSV.plugins.MarkersPlugin.Properties} properties
     * @param {boolean} [render=true] - renders the marker immediately
     * @returns {PSV.plugins.MarkersPlugin.Marker}
     */
    ;

    _proto.updateMarker = function updateMarker(properties, render) {
      if (render === void 0) {
        render = true;
      }

      var marker = this.getMarker(properties.id);
      marker.update(properties);

      if (render) {
        this.renderMarkers();

        this.__refreshUi();

        if (marker.is3d()) {
          this.psv.needsUpdate();
        }

        this.trigger(EVENTS.SET_MARKERS, this.getMarkers());
      }

      return marker;
    }
    /**
     * @summary Removes a marker from the viewer
     * @param {string} markerId
     * @param {boolean} [render=true] - renders the marker immediately
     */
    ;

    _proto.removeMarker = function removeMarker(markerId, render) {
      if (render === void 0) {
        render = true;
      }

      var marker = this.getMarker(markerId);

      if (marker.isNormal()) {
        this.container.removeChild(marker.$el);
      } else if (marker.isPoly() || marker.isSvg()) {
        this.svgContainer.removeChild(marker.$el);
      } else if (marker.is3d()) {
        this.psv.renderer.scene.remove(marker.$el);
        this.psv.needsUpdate();
      }

      if (this.prop.hoveringMarker === marker) {
        this.prop.hoveringMarker = null;
      }

      if (this.prop.currentMarker === marker) {
        this.prop.currentMarker = null;
      }

      marker.hideTooltip();
      marker.destroy();
      delete this.markers[marker.id];

      if (render) {
        this.__refreshUi();

        this.__checkObjectsObserver();

        this.trigger(EVENTS.SET_MARKERS, this.getMarkers());
      }
    }
    /**
     * @summary Removes multiple markers
     * @param {string[]} markerIds
     * @param {boolean} [render=true] - renders the markers immediately
     */
    ;

    _proto.removeMarkers = function removeMarkers(markerIds, render) {
      var _this3 = this;

      if (render === void 0) {
        render = true;
      }

      markerIds.forEach(function (markerId) {
        return _this3.removeMarker(markerId, false);
      });

      if (render) {
        this.__refreshUi();

        this.__checkObjectsObserver();

        this.trigger(EVENTS.SET_MARKERS, this.getMarkers());
      }
    }
    /**
     * @summary Replaces all markers
     * @param {PSV.plugins.MarkersPlugin.Properties[]} markers
     * @param {boolean} [render=true] - renders the marker immediately
     */
    ;

    _proto.setMarkers = function setMarkers(markers, render) {
      var _this4 = this;

      if (render === void 0) {
        render = true;
      }

      this.clearMarkers(false);
      photoSphereViewer.utils.each(markers, function (marker) {
        return _this4.addMarker(marker, false);
      });

      if (render) {
        this.renderMarkers();

        this.__refreshUi();

        this.__checkObjectsObserver();

        this.trigger(EVENTS.SET_MARKERS, this.getMarkers());
      }
    }
    /**
     * @summary Removes all markers
     * @param {boolean} [render=true] - renders the markers immediately
     */
    ;

    _proto.clearMarkers = function clearMarkers(render) {
      var _this5 = this;

      if (render === void 0) {
        render = true;
      }

      photoSphereViewer.utils.each(this.markers, function (marker) {
        return _this5.removeMarker(marker, false);
      });

      if (render) {
        this.renderMarkers();

        this.__refreshUi();

        this.__checkObjectsObserver();

        this.trigger(EVENTS.SET_MARKERS, this.getMarkers());
      }
    }
    /**
     * @summary Rotate the view to face the marker
     * @param {string} markerId
     * @param {string|number} [speed] - rotates smoothy, see {@link PSV.Viewer#animate}
     * @fires PSV.plugins.MarkersPlugin.goto-marker-done
     * @return {PSV.Animation}  A promise that will be resolved when the animation finishes
     */
    ;

    _proto.gotoMarker = function gotoMarker(markerId, speed) {
      var _this6 = this;

      var marker = this.getMarker(markerId);
      return this.psv.animate(_extends({}, marker.props.position, {
        speed: speed
      })).then(function () {
        _this6.trigger(EVENTS.GOTO_MARKER_DONE, marker);
      });
    }
    /**
     * @summary Hides a marker
     * @param {string} markerId
     */
    ;

    _proto.hideMarker = function hideMarker(markerId) {
      this.toggleMarker(markerId, false);
    }
    /**
     * @summary Shows a marker
     * @param {string} markerId
     */
    ;

    _proto.showMarker = function showMarker(markerId) {
      this.toggleMarker(markerId, true);
    }
    /**
     * @summary Forces the display of the tooltip
     * @param {string} markerId
     */
    ;

    _proto.showMarkerTooltip = function showMarkerTooltip(markerId) {
      var marker = this.getMarker(markerId);
      marker.props.staticTooltip = true;
      marker.showTooltip();
    }
    /**
     * @summary Hides the tooltip
     * @param {string} markerId
     */
    ;

    _proto.hideMarkerTooltip = function hideMarkerTooltip(markerId) {
      var marker = this.getMarker(markerId);
      marker.props.staticTooltip = false;
      marker.hideTooltip();
    }
    /**
     * @summary Toggles a marker
     * @param {string} markerId
     * @param {boolean} [visible]
     */
    ;

    _proto.toggleMarker = function toggleMarker(markerId, visible) {
      if (visible === void 0) {
        visible = null;
      }

      var marker = this.getMarker(markerId);
      marker.visible = visible === null ? !marker.visible : visible;

      if (marker.is3d()) {
        this.psv.needsUpdate();
      } else {
        this.renderMarkers();
      }
    }
    /**
     * @summary Opens the panel with the content of the marker
     * @param {string} markerId
     */
    ;

    _proto.showMarkerPanel = function showMarkerPanel(markerId) {
      var _marker$config;

      var marker = this.getMarker(markerId);

      if (marker != null && (_marker$config = marker.config) != null && _marker$config.content) {
        this.psv.panel.show({
          id: ID_PANEL_MARKER,
          content: marker.config.content
        });
      } else {
        this.psv.panel.hide(ID_PANEL_MARKER);
      }
    }
    /**
     * @summary Toggles the visibility of the list of markers
     */
    ;

    _proto.toggleMarkersList = function toggleMarkersList() {
      if (this.psv.panel.prop.contentId === ID_PANEL_MARKERS_LIST) {
        this.hideMarkersList();
      } else {
        this.showMarkersList();
      }
    }
    /**
     * @summary Opens side panel with the list of markers
     * @fires PSV.plugins.MarkersPlugin.filter:render-markers-list
     */
    ;

    _proto.showMarkersList = function showMarkersList() {
      var _this7 = this;

      var markers = [];
      photoSphereViewer.utils.each(this.markers, function (marker) {
        if (marker.visible && !marker.config.hideList) {
          markers.push(marker);
        }
      });
      markers = this.change(EVENTS.RENDER_MARKERS_LIST, markers);
      this.psv.panel.show({
        id: ID_PANEL_MARKERS_LIST,
        content: MARKERS_LIST_TEMPLATE(markers, this.psv.config.lang[MarkersButton.id]),
        noMargin: true,
        clickHandler: function clickHandler(e) {
          var li = e.target ? photoSphereViewer.utils.getClosest(e.target, 'li') : undefined;
          var markerId = li ? li.dataset[MARKER_DATA] : undefined;

          if (markerId) {
            var marker = _this7.getMarker(markerId);

            _this7.trigger(EVENTS.SELECT_MARKER_LIST, marker);

            _this7.gotoMarker(marker, 1000);

            _this7.hideMarkersList();
          }
        }
      });
    }
    /**
     * @summary Closes side panel if it contains the list of markers
     */
    ;

    _proto.hideMarkersList = function hideMarkersList() {
      this.psv.panel.hide(ID_PANEL_MARKERS_LIST);
    }
    /**
     * @summary Updates the visibility and the position of all markers
     */
    ;

    _proto.renderMarkers = function renderMarkers() {
      var _this8 = this;

      var zoomLevel = this.psv.getZoomLevel();
      var viewerPosition = this.psv.getPosition();
      photoSphereViewer.utils.each(this.markers, function (marker) {
        var isVisible = _this8.prop.visible && marker.visible;
        var visibilityChanged = false;
        var position = null;

        if (isVisible && marker.is3d()) {
          position = _this8.__getMarkerPosition(marker);
          isVisible = _this8.__isMarkerVisible(marker, position);
        } else if (isVisible && marker.isPoly()) {
          var positions = _this8.__getPolyPositions(marker);

          isVisible = positions.length > (marker.isPolygon() ? 2 : 1);

          if (isVisible) {
            position = _this8.__getMarkerPosition(marker);
            var points = positions.map(function (pos) {
              return pos.x - position.x + ',' + (pos.y - position.y);
            }).join(' ');
            marker.$el.setAttributeNS(null, 'points', points);
            marker.$el.setAttributeNS(null, 'transform', "translate(" + position.x + " " + position.y + ")");
          }
        } else if (isVisible) {
          if (marker.props.dynamicSize) {
            _this8.__updateMarkerSize(marker);
          }

          position = _this8.__getMarkerPosition(marker);
          isVisible = _this8.__isMarkerVisible(marker, position);

          if (isVisible) {
            var scale = marker.getScale(zoomLevel, viewerPosition);

            if (marker.isSvg()) {
              // simulate transform-origin relative to SVG element
              var x = position.x + marker.props.width * marker.props.anchor.x * (1 - scale);
              var y = position.y + marker.props.height * marker.props.anchor.y * (1 - scale);
              marker.$el.setAttributeNS(null, 'transform', "translate(" + x + ", " + y + ") scale(" + scale + ", " + scale + ")");
            } else {
              marker.$el.style.transform = "translate3D(" + position.x + "px, " + position.y + "px, 0px) scale(" + scale + ", " + scale + ")";
            }
          }
        }

        visibilityChanged = marker.props.visible !== isVisible;
        marker.props.visible = isVisible;
        marker.props.position2D = isVisible ? position : null;

        if (!marker.is3d()) {
          photoSphereViewer.utils.toggleClass(marker.$el, 'psv-marker--visible', isVisible);
        }

        if (!isVisible) {
          marker.hideTooltip();
        } else if (marker.props.staticTooltip) {
          marker.showTooltip();
        } else if (marker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.click || marker === _this8.prop.hoveringMarker && !marker.isPoly()) {
          marker.refreshTooltip();
        } else if (marker !== _this8.prop.hoveringMarker) {
          marker.hideTooltip();
        }

        if (visibilityChanged) {
          _this8.trigger(EVENTS.MARKER_VISIBILITY, marker, isVisible);
        }
      });
    }
    /**
     * @summary Determines if a point marker is visible<br>
     * It tests if the point is in the general direction of the camera, then check if it's in the viewport
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @param {PSV.Point} position
     * @returns {boolean}
     * @private
     */
    ;

    _proto.__isMarkerVisible = function __isMarkerVisible(marker, position) {
      return marker.props.positions3D[0].dot(this.psv.prop.direction) > 0 && position.x + marker.props.width >= 0 && position.x - marker.props.width <= this.psv.prop.size.width && position.y + marker.props.height >= 0 && position.y - marker.props.height <= this.psv.prop.size.height;
    }
    /**
     * @summary Computes the real size of a marker
     * @description This is done by removing all it's transformations (if any) and making it visible
     * before querying its bounding rect
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @private
     */
    ;

    _proto.__updateMarkerSize = function __updateMarkerSize(marker) {
      marker.$el.classList.add('psv-marker--transparent');
      var transform;

      if (marker.isSvg()) {
        transform = marker.$el.getAttributeNS(null, 'transform');
        marker.$el.removeAttributeNS(null, 'transform');
      } else {
        transform = marker.$el.style.transform;
        marker.$el.style.transform = '';
      }

      var rect = marker.$el.getBoundingClientRect();
      marker.props.width = rect.width;
      marker.props.height = rect.height;
      marker.$el.classList.remove('psv-marker--transparent');

      if (transform) {
        if (marker.isSvg()) {
          marker.$el.setAttributeNS(null, 'transform', transform);
        } else {
          marker.$el.style.transform = transform;
        }
      } // the size is no longer dynamic once known


      marker.props.dynamicSize = false;
    }
    /**
     * @summary Computes viewer coordinates of a marker
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @returns {PSV.Point}
     * @private
     */
    ;

    _proto.__getMarkerPosition = function __getMarkerPosition(marker) {
      if (marker.isPoly()) {
        return this.psv.dataHelper.sphericalCoordsToViewerCoords(marker.props.position);
      } else {
        var position = this.psv.dataHelper.vector3ToViewerCoords(marker.props.positions3D[0]);
        position.x -= marker.props.width * marker.props.anchor.x;
        position.y -= marker.props.height * marker.props.anchor.y;
        return position;
      }
    }
    /**
     * @summary Computes viewer coordinates of each point of a polygon/polyline<br>
     * It handles points behind the camera by creating intermediary points suitable for the projector
     * @param {PSV.plugins.MarkersPlugin.Marker} marker
     * @returns {PSV.Point[]}
     * @private
     */
    ;

    _proto.__getPolyPositions = function __getPolyPositions(marker) {
      var _this9 = this;

      var nbVectors = marker.props.positions3D.length; // compute if each vector is visible

      var positions3D = marker.props.positions3D.map(function (vector) {
        return {
          vector: vector,
          visible: vector.dot(_this9.psv.prop.direction) > 0
        };
      }); // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector

      var toBeComputed = [];
      positions3D.forEach(function (pos, i) {
        if (!pos.visible) {
          var neighbours = [i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1], i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1]];
          neighbours.forEach(function (neighbour) {
            if (neighbour.visible) {
              toBeComputed.push({
                visible: neighbour,
                invisible: pos,
                index: i
              });
            }
          });
        }
      }); // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)

      toBeComputed.reverse().forEach(function (pair) {
        positions3D.splice(pair.index, 0, {
          vector: _this9.__getPolyIntermediaryPoint(pair.visible.vector, pair.invisible.vector),
          visible: true
        });
      }); // translate vectors to screen pos

      return positions3D.filter(function (pos) {
        return pos.visible;
      }).map(function (pos) {
        return _this9.psv.dataHelper.vector3ToViewerCoords(pos.vector);
      });
    }
    /**
     * Given one point in the same direction of the camera and one point behind the camera,
     * computes an intermediary point on the great circle delimiting the half sphere visible by the camera.
     * The point is shifted by .01 rad because the projector cannot handle points exactly on this circle.
     * TODO : does not work with fisheye view (must not use the great circle)
     * {@link http://math.stackexchange.com/a/1730410/327208}
     * @param P1 {external:THREE.Vector3}
     * @param P2 {external:THREE.Vector3}
     * @returns {external:THREE.Vector3}
     * @private
     */
    ;

    _proto.__getPolyIntermediaryPoint = function __getPolyIntermediaryPoint(P1, P2) {
      var C = this.psv.prop.direction.clone().normalize();
      var N = new three.Vector3().crossVectors(P1, P2).normalize();
      var V = new three.Vector3().crossVectors(N, P1).normalize();
      var X = P1.clone().multiplyScalar(-C.dot(V));
      var Y = V.clone().multiplyScalar(C.dot(P1));
      var H = new three.Vector3().addVectors(X, Y).normalize();
      var a = new three.Vector3().crossVectors(H, C);
      return H.applyAxisAngle(a, 0.01).multiplyScalar(photoSphereViewer.CONSTANTS.SPHERE_RADIUS);
    }
    /**
     * @summary Returns the marker associated to an event target
     * @param {EventTarget} target
     * @param {boolean} [closest=false]
     * @returns {PSV.plugins.MarkersPlugin.Marker}
     * @private
     */
    ;

    _proto.__getTargetMarker = function __getTargetMarker(target, closest) {
      if (closest === void 0) {
        closest = false;
      }

      var target2 = closest ? photoSphereViewer.utils.getClosest(target, '.psv-marker') : target;
      return target2 ? target2[MARKER_DATA] : undefined;
    }
    /**
     * @summary Checks if an event target is in the tooltip
     * @param {EventTarget} target
     * @param {PSV.components.Tooltip} tooltip
     * @returns {boolean}
     * @private
     */
    ;

    _proto.__targetOnTooltip = function __targetOnTooltip(target, tooltip) {
      return target && tooltip ? photoSphereViewer.utils.hasParent(target, tooltip.container) : false;
    }
    /**
     * @summary Handles mouse enter events, show the tooltip for non polygon markers
     * @param {MouseEvent} e
     * @param {PSV.plugins.MarkersPlugin.Marker} [marker]
     * @fires PSV.plugins.MarkersPlugin.over-marker
     * @private
     */
    ;

    _proto.__onMouseEnter = function __onMouseEnter(e, marker) {
      if (marker && !marker.isPoly()) {
        this.prop.hoveringMarker = marker;
        this.trigger(EVENTS.OVER_MARKER, marker);

        if (!marker.props.staticTooltip && marker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.hover) {
          marker.showTooltip(e);
        }
      }
    }
    /**
     * @summary Handles mouse leave events, hide the tooltip
     * @param {MouseEvent} e
     * @param {PSV.plugins.MarkersPlugin.Marker} [marker]
     * @fires PSV.plugins.MarkersPlugin.leave-marker
     * @private
     */
    ;

    _proto.__onMouseLeave = function __onMouseLeave(e, marker) {
      // do not hide if we enter the tooltip itself while hovering a polygon
      if (marker && !(marker.isPoly() && this.__targetOnTooltip(e.relatedTarget, marker.tooltip))) {
        this.trigger(EVENTS.LEAVE_MARKER, marker);
        this.prop.hoveringMarker = null;

        if (!marker.props.staticTooltip && marker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.hover) {
          marker.hideTooltip();
        }
      }
    }
    /**
     * @summary Handles mouse move events, refreshUi the tooltip for polygon markers
     * @param {MouseEvent} e
     * @param {PSV.plugins.MarkersPlugin.Marker} [targetMarker]
     * @fires PSV.plugins.MarkersPlugin.leave-marker
     * @fires PSV.plugins.MarkersPlugin.over-marker
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(e, targetMarker) {
      var _this$prop$hoveringMa;

      var marker;

      if (targetMarker != null && targetMarker.isPoly()) {
        marker = targetMarker;
      } // do not hide if we enter the tooltip itself while hovering a polygon
      else if (this.prop.hoveringMarker && this.__targetOnTooltip(e.target, this.prop.hoveringMarker.tooltip)) {
        marker = this.prop.hoveringMarker;
      }

      if (marker) {
        if (!this.prop.hoveringMarker) {
          this.trigger(EVENTS.OVER_MARKER, marker);
          this.prop.hoveringMarker = marker;
        }

        if (!marker.props.staticTooltip) {
          marker.showTooltip(e);
        }
      } else if ((_this$prop$hoveringMa = this.prop.hoveringMarker) != null && _this$prop$hoveringMa.isPoly()) {
        this.trigger(EVENTS.LEAVE_MARKER, this.prop.hoveringMarker);

        if (!this.prop.hoveringMarker.props.staticTooltip) {
          this.prop.hoveringMarker.hideTooltip();
        }

        this.prop.hoveringMarker = null;
      }
    }
    /**
     * @summary Handles mouse click events, select the marker and open the panel if necessary
     * @param {Event} e
     * @param {Object} data
     * @param {boolean} dblclick
     * @fires PSV.plugins.MarkersPlugin.select-marker
     * @fires PSV.plugins.MarkersPlugin.unselect-marker
     * @private
     */
    ;

    _proto.__onClick = function __onClick(e, data, dblclick) {
      var _data$objects$find;

      var marker = (_data$objects$find = data.objects.find(function (o) {
        return o.userData[MARKER_DATA];
      })) == null ? void 0 : _data$objects$find.userData[MARKER_DATA];

      if (!marker) {
        marker = this.__getTargetMarker(data.target, true);
      }

      if (this.prop.currentMarker && this.prop.currentMarker !== marker) {
        this.trigger(EVENTS.UNSELECT_MARKER, this.prop.currentMarker);
        this.psv.panel.hide(ID_PANEL_MARKER);

        if (!this.prop.showAllTooltips && this.prop.currentMarker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.click) {
          this.hideMarkerTooltip(this.prop.currentMarker);
        }

        this.prop.currentMarker = null;
      }

      if (marker) {
        this.prop.currentMarker = marker;
        this.trigger(EVENTS.SELECT_MARKER, marker, {
          dblclick: dblclick,
          rightclick: data.rightclick
        });

        if (this.config.clickEventOnMarker) {
          // add the marker to event data
          data.marker = marker;
        } else {
          e.stopPropagation();
        } // the marker could have been deleted in an event handler


        if (this.markers[marker.id]) {
          if (marker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.click) {
            if (marker.tooltip) {
              this.hideMarkerTooltip(marker);
            } else {
              this.showMarkerTooltip(marker);
            }
          } else {
            this.showMarkerPanel(marker.id);
          }
        }
      }
    }
    /**
     * @summary Updates the visiblity of the panel and the buttons
     * @private
     */
    ;

    _proto.__refreshUi = function __refreshUi() {
      var nbMarkers = Object.values(this.markers).filter(function (m) {
        return !m.config.hideList;
      }).length;
      var markersButton = this.psv.navbar.getButton(MarkersButton.id, false);
      var markersListButton = this.psv.navbar.getButton(MarkersListButton.id, false);

      if (nbMarkers === 0) {
        markersButton == null ? void 0 : markersButton.hide();
        markersListButton == null ? void 0 : markersListButton.hide();

        if (this.psv.panel.isVisible(ID_PANEL_MARKERS_LIST)) {
          this.psv.panel.hide();
        } else if (this.psv.panel.isVisible(ID_PANEL_MARKER)) {
          this.psv.panel.hide();
        }
      } else {
        markersButton == null ? void 0 : markersButton.show();
        markersListButton == null ? void 0 : markersListButton.show();

        if (this.psv.panel.isVisible(ID_PANEL_MARKERS_LIST)) {
          this.showMarkersList();
        } else if (this.psv.panel.isVisible(ID_PANEL_MARKER)) {
          this.prop.currentMarker ? this.showMarkerPanel(this.prop.currentMarker) : this.psv.panel.hide();
        }
      }
    }
    /**
     * @summary Adds or remove the objects observer if there are 3D markers
     * @private
     */
    ;

    _proto.__checkObjectsObserver = function __checkObjectsObserver() {
      var has3d = Object.values(this.markers).some(function (marker) {
        return marker.is3d();
      });

      if (!has3d && this.prop.stopObserver) {
        this.prop.stopObserver();
        this.prop.stopObserver = null;
      } else if (has3d && !this.prop.stopObserver) {
        this.prop.stopObserver = this.psv.observeObjects(MARKER_DATA, this);
      }
    };

    return MarkersPlugin;
  }(photoSphereViewer.AbstractPlugin);
  MarkersPlugin.id = 'markers';
  MarkersPlugin.EVENTS = EVENTS;

  exports.EVENTS = EVENTS;
  exports.MarkersPlugin = MarkersPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=markers.js.map
