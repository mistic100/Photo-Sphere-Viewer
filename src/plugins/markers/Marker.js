import { Group, MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, TextureLoader } from 'three';
import { CONSTANTS, PSVError, utils } from '../..';
import { MARKER_DATA, MARKER_TOOLTIP_TRIGGER, SVG_NS } from './constants';
import { getPolygonCenter, getPolylineCenter } from './utils';

/**
 * @summary Types of marker
 * @memberOf PSV.plugins.MarkersPlugin
 * @enum {string}
 * @constant
 * @private
 */
const MARKER_TYPES = {
  image      : 'image',
  imageLayer : 'imageLayer',
  html       : 'html',
  polygonPx  : 'polygonPx',
  polygonRad : 'polygonRad',
  polylinePx : 'polylinePx',
  polylineRad: 'polylineRad',
  square     : 'square',
  rect       : 'rect',
  circle     : 'circle',
  ellipse    : 'ellipse',
  path       : 'path',
};

/**
 * @typedef {Object} PSV.plugins.MarkersPlugin.Properties
 * @summary Marker properties, see {@link https://photo-sphere-viewer.js.org/plugins/plugin-markers.html#markers-options}
 */

/**
 * @summary Object representing a marker
 * @memberOf PSV.plugins.MarkersPlugin
 */
export class Marker {

  /**
   * @param {PSV.plugins.MarkersPlugin.Properties} properties
   * @param {PSV.Viewer} psv
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  constructor(properties, psv) {
    if (!properties.id) {
      throw new PSVError('missing marker id');
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
      dynamicSize  : false,
      anchor       : null,
      visible      : false,
      staticTooltip: false,
      position     : null,
      position2D   : null,
      positions3D  : null,
      width        : null,
      height       : null,
      def          : null,
    };

    /**
     * @summary THREE file loader
     * @type {THREE:TextureLoader}
     * @private
     */
    this.loader = null;

    if (this.is3d()) {
      this.loader = new TextureLoader();
      if (this.psv.config.withCredentials) {
        this.loader.setWithCredentials(true);
      }
      if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'object') {
        this.loader.setRequestHeader(this.psv.config.requestHeaders);
      }
    }

    // create element
    if (this.isNormal()) {
      this.$el = document.createElement('div');
    }
    else if (this.isPolygon()) {
      this.$el = document.createElementNS(SVG_NS, 'polygon');
    }
    else if (this.isPolyline()) {
      this.$el = document.createElementNS(SVG_NS, 'polyline');
    }
    else if (this.isSvg()) {
      const svgType = this.type === 'square' ? 'rect' : this.type;
      this.$el = document.createElementNS(SVG_NS, svgType);
    }

    if (!this.is3d()) {
      this.$el.id = `psv-marker-${this.id}`;
      this.$el[MARKER_DATA] = this;
    }

    this.update(properties);
  }

  /**
   * @summary Destroys the marker
   */
  destroy() {
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
  is3d() {
    return this.type === MARKER_TYPES.imageLayer;
  }

  /**
   * @summary Checks if it is a normal marker (image or html)
   * @returns {boolean}
   */
  isNormal() {
    return this.type === MARKER_TYPES.image
      || this.type === MARKER_TYPES.html;
  }

  /**
   * @summary Checks if it is a polygon/polyline marker
   * @returns {boolean}
   */
  isPoly() {
    return this.isPolygon()
      || this.isPolyline();
  }

  /**
   * @summary Checks if it is a polygon/polyline using pixel coordinates
   * @returns {boolean}
   */
  isPolyPx() {
    return this.type === MARKER_TYPES.polygonPx
      || this.type === MARKER_TYPES.polylinePx;
  }

  /**
   * @summary Checks if it is a polygon/polyline using radian coordinates
   * @returns {boolean}
   */
  isPolyRad() {
    return this.type === MARKER_TYPES.polygonRad
      || this.type === MARKER_TYPES.polylineRad;
  }

  /**
   * @summary Checks if it is a polygon marker
   * @returns {boolean}
   */
  isPolygon() {
    return this.type === MARKER_TYPES.polygonPx
      || this.type === MARKER_TYPES.polygonRad;
  }

  /**
   * @summary Checks if it is a polyline marker
   * @returns {boolean}
   */
  isPolyline() {
    return this.type === MARKER_TYPES.polylinePx
      || this.type === MARKER_TYPES.polylineRad;
  }

  /**
   * @summary Checks if it is an SVG marker
   * @returns {boolean}
   */
  isSvg() {
    return this.type === MARKER_TYPES.square
      || this.type === MARKER_TYPES.rect
      || this.type === MARKER_TYPES.circle
      || this.type === MARKER_TYPES.ellipse
      || this.type === MARKER_TYPES.path;
  }

  /**
   * @summary Computes marker scale from zoom level
   * @param {number} zoomLevel
   * @param {PSV.Position} position
   * @returns {number}
   */
  getScale(zoomLevel, position) {
    if (!this.config.scale) {
      return 1;
    }
    if (typeof this.config.scale === 'function') {
      return this.config.scale(zoomLevel, position);
    }

    let scale = 1;
    if (Array.isArray(this.config.scale.zoom)) {
      const bounds = this.config.scale.zoom;
      scale *= bounds[0] + (bounds[1] - bounds[0]) * CONSTANTS.EASINGS.inQuad(zoomLevel / 100);
    }
    if (Array.isArray(this.config.scale.longitude)) {
      const bounds = this.config.scale.longitude;
      const halfFov = MathUtils.degToRad(this.psv.prop.hFov) / 2;
      const arc = Math.abs(utils.getShortestArc(this.props.position.longitude, position.longitude));
      scale *= bounds[1] + (bounds[0] - bounds[1]) * CONSTANTS.EASINGS.outQuad(Math.max(0, (halfFov - arc) / halfFov));
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
  getListContent() {
    if (this.config.listContent) {
      return this.config.listContent;
    }
    else if (this.config.tooltip.content) {
      return this.config.tooltip.content;
    }
    else if (this.config.html) {
      return this.config.html;
    }
    else {
      return this.id;
    }
  }

  /**
   * @summary Display the tooltip of this marker
   * @param {{clientX: number, clientY: number}} [mousePosition]
   */
  showTooltip(mousePosition) {
    if (this.props.visible && this.config.tooltip.content && this.props.position2D) {
      const config = {
        ...this.config.tooltip,
        data: this,
      };

      if (this.isPoly()) {
        if (mousePosition) {
          const viewerPos = utils.getPosition(this.psv.container);
          config.top = mousePosition.clientY - viewerPos.top;
          config.left = mousePosition.clientX - viewerPos.left;
          config.box = { // separate the tooltip from the cursor
            width : 20,
            height: 20,
          };
        }
        else {
          config.top = this.props.position2D.y;
          config.left = this.props.position2D.x;
        }
      }
      else {
        config.top = this.props.position2D.y + this.props.height / 2;
        config.left = this.props.position2D.x + this.props.width / 2;
        config.box = {
          width : this.props.width,
          height: this.props.height,
        };
      }

      if (this.tooltip) {
        this.tooltip.move(config);
      }
      else {
        this.tooltip = this.psv.tooltip.create(config);
      }
    }
  }

  /**
   * @summary Recompute the position of the tooltip
   */
  refreshTooltip() {
    if (this.tooltip) {
      this.showTooltip();
    }
  }

  /**
   * @summary Hides the tooltip of this marker
   */
  hideTooltip() {
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
  update(properties) {
    const newType = Marker.getType(properties, true);

    if (newType !== undefined && newType !== this.type) {
      throw new PSVError('cannot change marker type');
    }

    utils.deepmerge(this.config, properties);
    if (typeof this.config.tooltip === 'string') {
      this.config.tooltip = { content: this.config.tooltip };
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
      // reset CSS class
      if (this.isNormal()) {
        this.$el.className = 'psv-marker psv-marker--normal';
      }
      else {
        this.$el.setAttribute('class', 'psv-marker psv-marker--svg');
      }

      // add CSS classes
      if (this.config.className) {
        utils.addClasses(this.$el, this.config.className);
      }

      if (this.config.tooltip) {
        this.$el.classList.add('psv-marker--has-tooltip');
      }
      if (this.config.content) {
        this.$el.classList.add('psv-marler--has-content');
      }

      // apply style
      this.$el.style.opacity = this.config.opacity ?? 1;
      if (this.config.style) {
        utils.deepmerge(this.$el.style, this.config.style);
      }
    }

    // parse anchor
    this.props.anchor = utils.parsePosition(this.config.anchor);

    // clean scale
    if (this.config.scale && Array.isArray(this.config.scale)) {
      this.config.scale = { zoom: this.config.scale };
    }

    if (this.isNormal()) {
      this.__updateNormal();
    }
    else if (this.isPoly()) {
      this.__updatePoly();
    }
    else if (this.isSvg()) {
      this.__updateSvg();
    }
    else if (this.is3d()) {
      this.__update3d();
    }
  }

  /**
   * @summary Updates a normal marker
   * @private
   */
  __updateNormal() {
    if (!utils.isExtendedPosition(this.config)) {
      throw new PSVError('missing marker position, latitude/longitude or x/y');
    }

    if (this.config.image && (!this.config.width || !this.config.height)) {
      throw new PSVError('missing marker width/height');
    }

    if (this.config.width && this.config.height) {
      this.props.dynamicSize = false;
      this.props.width = this.config.width;
      this.props.height = this.config.height;
      this.$el.style.width = this.config.width + 'px';
      this.$el.style.height = this.config.height + 'px';
    }
    else {
      this.props.dynamicSize = true;
    }

    if (this.config.image) {
      this.props.def = this.config.image;
      this.$el.style.backgroundImage = `url(${this.config.image})`;
    }
    else if (this.config.html) {
      this.props.def = this.config.html;
      this.$el.innerHTML = this.config.html;
    }

    // set anchor
    this.$el.style.transformOrigin = `${this.props.anchor.x * 100}% ${this.props.anchor.y * 100}%`;

    // convert texture coordinates to spherical coordinates
    this.props.position = this.psv.dataHelper.cleanPosition(this.config);

    // compute x/y/z position
    this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];
  }

  /**
   * @summary Updates an SVG marker
   * @private
   */
  __updateSvg() {
    if (!utils.isExtendedPosition(this.config)) {
      throw new PSVError('missing marker position, latitude/longitude or x/y');
    }

    this.props.dynamicSize = true;

    // set content
    switch (this.type) {
      case MARKER_TYPES.square:
        this.props.def = {
          x     : 0,
          y     : 0,
          width : this.config.square,
          height: this.config.square,
        };
        break;

      case MARKER_TYPES.rect:
        if (Array.isArray(this.config.rect)) {
          this.props.def = {
            x     : 0,
            y     : 0,
            width : this.config.rect[0],
            height: this.config.rect[1],
          };
        }
        else {
          this.props.def = {
            x     : 0,
            y     : 0,
            width : this.config.rect.width,
            height: this.config.rect.height,
          };
        }
        break;

      case MARKER_TYPES.circle:
        this.props.def = {
          cx: this.config.circle,
          cy: this.config.circle,
          r : this.config.circle,
        };
        break;

      case MARKER_TYPES.ellipse:
        if (Array.isArray(this.config.ellipse)) {
          this.props.def = {
            cx: this.config.ellipse[0],
            cy: this.config.ellipse[1],
            rx: this.config.ellipse[0],
            ry: this.config.ellipse[1],
          };
        }
        else {
          this.props.def = {
            cx: this.config.ellipse.rx,
            cy: this.config.ellipse.ry,
            rx: this.config.ellipse.rx,
            ry: this.config.ellipse.ry,
          };
        }
        break;

      case MARKER_TYPES.path:
        this.props.def = {
          d: this.config.path,
        };
        break;

      // no default
    }

    utils.each(this.props.def, (value, prop) => {
      this.$el.setAttributeNS(null, prop, value);
    });

    // set style
    if (this.config.svgStyle) {
      utils.each(this.config.svgStyle, (value, prop) => {
        this.$el.setAttributeNS(null, utils.dasherize(prop), value);
      });
    }
    else {
      this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
    }

    // convert texture coordinates to spherical coordinates
    this.props.position = this.psv.dataHelper.cleanPosition(this.config);

    // compute x/y/z position
    this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];
  }

  /**
   * @summary Updates a polygon marker
   * @private
   */
  __updatePoly() {
    this.props.dynamicSize = true;

    // set style
    if (this.config.svgStyle) {
      utils.each(this.config.svgStyle, (value, prop) => {
        this.$el.setAttributeNS(null, utils.dasherize(prop), value);
      });

      if (this.isPolyline() && !this.config.svgStyle.fill) {
        this.$el.setAttributeNS(null, 'fill', 'none');
      }
    }
    else if (this.isPolygon()) {
      this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
    }
    else if (this.isPolyline()) {
      this.$el.setAttributeNS(null, 'fill', 'none');
      this.$el.setAttributeNS(null, 'stroke', 'rgb(0,0,0)');
    }

    // fold arrays: [1,2,3,4] => [[1,2],[3,4]]
    const actualPoly = this.config.polygonPx || this.config.polygonRad || this.config.polylinePx || this.config.polylineRad;
    if (!Array.isArray(actualPoly[0])) {
      for (let i = 0; i < actualPoly.length; i++) {
        actualPoly.splice(i, 2, [actualPoly[i], actualPoly[i + 1]]);
      }
    }

    // convert texture coordinates to spherical coordinates
    if (this.isPolyPx()) {
      this.props.def = actualPoly.map((coord) => {
        const sphericalCoords = this.psv.dataHelper.textureCoordsToSphericalCoords({ x: coord[0], y: coord[1] });
        return [sphericalCoords.longitude, sphericalCoords.latitude];
      });
    }
    // clean angles
    else {
      this.props.def = actualPoly.map((coord) => {
        return [utils.parseAngle(coord[0]), utils.parseAngle(coord[1], true)];
      });
    }

    const centroid = this.isPolygon()
      ? getPolygonCenter(this.props.def)
      : getPolylineCenter(this.props.def);

    this.props.position = {
      longitude: centroid[0],
      latitude : centroid[1],
    };

    // compute x/y/z positions
    this.props.positions3D = this.props.def.map((coord) => {
      return this.psv.dataHelper.sphericalCoordsToVector3({ longitude: coord[0], latitude: coord[1] });
    });
  }

  /**
   * @summary Updates a 3D marker
   * @private
   */
  __update3d() {
    if (!this.config.width || !this.config.height) {
      throw new PSVError('missing marker width/height');
    }

    this.props.dynamicSize = false;
    this.props.width = this.config.width;
    this.props.height = this.config.height;

    // convert texture coordinates to spherical coordinates
    this.props.position = this.psv.dataHelper.cleanPosition(this.config);

    // compute x/y/z position
    this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];

    switch (this.type) {
      case MARKER_TYPES.imageLayer:
        if (!this.$el) {
          const material = new MeshBasicMaterial({
            transparent: true,
            opacity    : this.config.opacity ?? 1,
            depthTest  : false,
          });
          const geometry = new PlaneGeometry(1, 1);
          const mesh = new Mesh(geometry, material);
          mesh.userData = { [MARKER_DATA]: this };
          this.$el = new Group().add(mesh);

          // overwrite the visible property to be tied to the Marker instance
          // and do it without context bleed
          Object.defineProperty(this.$el, 'visible', {
            enumerable: true,
            get       : function () {
              return this.children[0].userData[MARKER_DATA].visible;
            },
            set       : function (visible) {
              this.children[0].userData[MARKER_DATA].visible = visible;
            },
          });
        }

        if (this.props.def !== this.config.imageLayer) {
          if (this.psv.config.requestHeaders && typeof this.psv.config.requestHeaders === 'function') {
            this.loader.setRequestHeader(this.psv.config.requestHeaders(this.config.imageLayer));
          }
          this.$el.children[0].material.map = this.loader.load(this.config.imageLayer, (texture) => {
            texture.anisotropy = 4;
            this.psv.needsUpdate();
          });
          this.props.def = this.config.imageLayer;
        }

        this.$el.children[0].position.set(
          this.props.anchor.x - 0.5,
          this.props.anchor.y - 0.5,
          0
        );

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
        }

        // 100 is magic number that gives a coherent size at default zoom level
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
  static getType(properties, allowNone = false) {
    const found = [];

    utils.each(MARKER_TYPES, (type) => {
      if (properties[type]) {
        found.push(type);
      }
    });

    if (found.length === 0 && !allowNone) {
      throw new PSVError(`missing marker content, either ${Object.keys(MARKER_TYPES).join(', ')}`);
    }
    else if (found.length > 1) {
      throw new PSVError(`multiple marker content, either ${Object.keys(MARKER_TYPES).join(', ')}`);
    }

    return found[0];
  }

}
