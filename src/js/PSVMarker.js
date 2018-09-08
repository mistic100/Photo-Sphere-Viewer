/**
 * Object representing a marker
 * @param {Object} properties - see {@link http://photo-sphere-viewer.js.org/markers.html#config} (merged with the object itself)
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @throws {PSVError} when the configuration is incorrect
 */
function PSVMarker(properties, psv) {
  if (!properties.id) {
    throw new PSVError('missing marker id');
  }

  if (properties.image && (!properties.width || !properties.height)) {
    throw new PSVError('missing marker width/height');
  }

  if (properties.image || properties.html) {
    if ((!properties.hasOwnProperty('x') || !properties.hasOwnProperty('y')) && (!properties.hasOwnProperty('latitude') || !properties.hasOwnProperty('longitude'))) {
      throw new PSVError('missing marker position, latitude/longitude or x/y');
    }
  }

  /**
   * @member {PhotoSphereViewer}
   * @readonly
   * @protected
   */
  this.psv = psv;

  /**
   * @member {boolean}
   */
  this.visible = true;

  /**
   * @member {boolean}
   * @readonly
   * @private
   */
  this._dynamicSize = false;

  // private properties
  var _id = properties.id;
  var _type = PSVMarker.getType(properties, false);
  var $el;

  // readonly properties
  Object.defineProperties(this, {
    /**
     * @memberof PSVMarker
     * @type {string}
     * @readonly
     */
    id: {
      configurable: false,
      enumerable: true,
      get: function() {
        return _id;
      },
      set: function() {
      }
    },
    /**
     * @memberof PSVMarker
     * @type {string}
     * @see PSVMarker.types
     * @readonly
     */
    type: {
      configurable: false,
      enumerable: true,
      get: function() {
        return _type;
      },
      set: function() {
      }
    },
    /**
     * @memberof PSVMarker
     * @type {HTMLDivElement|SVGElement}
     * @readonly
     */
    $el: {
      configurable: false,
      enumerable: true,
      get: function() {
        return $el;
      },
      set: function() {
      }
    },
    /**
     * @summary Quick access to self value of key `type`
     * @memberof PSVMarker
     * @type {*}
     * @private
     */
    _def: {
      configurable: false,
      enumerable: true,
      get: function() {
        return this[_type];
      },
      set: function(value) {
        this[_type] = value;
      }
    }
  });

  // create element
  if (this.isNormal()) {
    $el = document.createElement('div');
  }
  else if (this.isPolygon()) {
    $el = document.createElementNS(PSVUtils.svgNS, 'polygon');
  }
  else if (this.isPolyline()) {
    $el = document.createElementNS(PSVUtils.svgNS, 'polyline');
  }
  else {
    $el = document.createElementNS(PSVUtils.svgNS, this.type);
  }

  $el.id = 'psv-marker-' + this.id;
  $el.psvMarker = this;

  this.update(properties);
}

/**
 * @summary Types of markers
 * @type {string[]}
 * @readonly
 */
PSVMarker.types = ['image', 'html', 'polygon_px', 'polygon_rad', 'polyline_px', 'polyline_rad', 'rect', 'circle', 'ellipse', 'path'];

/**
 * @summary Determines the type of a marker by the available properties
 * @param {object} properties
 * @param {boolean} [allowNone=false]
 * @returns {string}
 * @throws {PSVError} when the marker's type cannot be found
 */
PSVMarker.getType = function(properties, allowNone) {
  var found = [];

  PSVMarker.types.forEach(function(type) {
    if (properties[type]) {
      found.push(type);
    }
  });

  if (found.length === 0 && !allowNone) {
    throw new PSVError('missing marker content, either ' + PSVMarker.types.join(', '));
  }
  else if (found.length > 1) {
    throw new PSVError('multiple marker content, either ' + PSVMarker.types.join(', '));
  }

  return found[0];
};

/**
 * @summary Destroys the marker
 */
PSVMarker.prototype.destroy = function() {
  delete this.$el.psvMarker;
};

/**
 * @summary Checks if it is a normal marker (image or html)
 * @returns {boolean}
 */
PSVMarker.prototype.isNormal = function() {
  return this.type === 'image' || this.type === 'html';
};

/**
 * @summary Checks if it is a polygon/polyline marker
 * @returns {boolean}
 */
PSVMarker.prototype.isPoly = function() {
  return this.isPolygon() || this.isPolyline();
};

/**
 * @summary Checks if it is a polygon marker
 * @returns {boolean}
 */
PSVMarker.prototype.isPolygon = function() {
  return this.type === 'polygon_px' || this.type === 'polygon_rad';
};

/**
 * @summary Checks if it is a polyline marker
 * @returns {boolean}
 */
PSVMarker.prototype.isPolyline = function() {
  return this.type === 'polyline_px' || this.type === 'polyline_rad';
};

/**
 * @summary Checks if it is an SVG marker
 * @returns {boolean}
 */
PSVMarker.prototype.isSvg = function() {
  return this.type === 'rect' || this.type === 'circle' || this.type === 'ellipse' || this.type === 'path';
};

/**
 * @summary Computes marker scale from zoom level
 * @param {float} zoomLevel
 * @returns {float}
 */
PSVMarker.prototype.getScale = function(zoomLevel) {
  if (Array.isArray(this.scale)) {
    return this.scale[0] + (this.scale[1] - this.scale[0]) * PSVAnimation.easings.inQuad(zoomLevel / 100);
  }
  else if (typeof this.scale === 'function') {
    return this.scale(zoomLevel);
  }
  else if (typeof this.scale === 'number') {
    return this.scale * PSVAnimation.easings.inQuad(zoomLevel / 100);
  }
  else {
    return 1;
  }
};

/**
 * @summary Updates the marker with new properties
 * @param {object} [properties]
 * @throws {PSVError} when trying to change the marker's type
 */
PSVMarker.prototype.update = function(properties) {
  // merge objects
  if (properties && properties !== this) {
    var newType = PSVMarker.getType(properties, true);

    if (newType !== undefined && newType !== this.type) {
      throw new PSVError('cannot change marker type');
    }

    PSVUtils.deepmerge(this, properties);
  }

  // reset CSS class
  if (this.isNormal()) {
    this.$el.setAttribute('class', 'psv-marker psv-marker--normal');
  }
  else {
    this.$el.setAttribute('class', 'psv-marker psv-marker--svg');
  }

  // add CSS classes
  if (this.className) {
    PSVUtils.addClasses(this.$el, this.className);
  }
  if (this.tooltip) {
    PSVUtils.addClasses(this.$el, 'has-tooltip');
    if (typeof this.tooltip === 'string') {
      this.tooltip = { content: this.tooltip };
    }
  }

  // apply style
  if (this.style) {
    PSVUtils.deepmerge(this.$el.style, this.style);
  }

  // parse anchor
  this.anchor = PSVUtils.parsePosition(this.anchor);

  if (this.isNormal()) {
    this._updateNormal();
  }
  else if (this.isPolygon()) {
    this._updatePoly('polygon_rad', 'polygon_px');
  }
  else if (this.isPolyline()) {
    this._updatePoly('polyline_rad', 'polyline_px');
  }
  else {
    this._updateSvg();
  }
};

/**
 * @summary Updates a normal marker
 * @private
 */
PSVMarker.prototype._updateNormal = function() {
  if (this.width && this.height) {
    this.$el.style.width = this.width + 'px';
    this.$el.style.height = this.height + 'px';
    this._dynamicSize = false;
  }
  else {
    this._dynamicSize = true;
  }

  if (this.image) {
    this.$el.style.backgroundImage = 'url(' + this.image + ')';
  }
  else {
    this.$el.innerHTML = this.html;
  }

  // set anchor
  this.$el.style.transformOrigin = this.anchor.left * 100 + '% ' + this.anchor.top * 100 + '%';

  // convert texture coordinates to spherical coordinates
  this.psv.cleanPosition(this);

  // compute x/y/z position
  this.position3D = this.psv.sphericalCoordsToVector3(this);
};

/**
 * @summary Updates an SVG marker
 * @private
 */
PSVMarker.prototype._updateSvg = function() {
  this._dynamicSize = true;

  // set content
  switch (this.type) {
    case 'rect':
      if (typeof this._def === 'number') {
        this._def = {
          x: 0,
          y: 0,
          width: this._def,
          height: this._def
        };
      }
      else if (Array.isArray(this._def)) {
        this._def = {
          x: 0,
          y: 0,
          width: this._def[0],
          height: this._def[1]
        };
      }
      else {
        this._def.x = this._def.y = 0;
      }
      break;

    case 'circle':
      if (typeof this._def === 'number') {
        this._def = {
          cx: this._def,
          cy: this._def,
          r: this._def
        };
      }
      else if (Array.isArray(this._def)) {
        this._def = {
          cx: this._def[0],
          cy: this._def[0],
          r: this._def[0]
        };
      }
      else {
        this._def.cx = this._def.cy = this._def.r;
      }
      break;

    case 'ellipse':
      if (typeof this._def === 'number') {
        this._def = {
          cx: this._def,
          cy: this._def,
          rx: this._def,
          ry: this._def
        };
      }
      else if (Array.isArray(this._def)) {
        this._def = {
          cx: this._def[0],
          cy: this._def[1],
          rx: this._def[0],
          ry: this._def[1]
        };
      }
      else {
        this._def.cx = this._def.rx;
        this._def.cy = this._def.ry;
      }
      break;

    case 'path':
      if (typeof this._def === 'string') {
        this._def = {
          d: this._def
        };
      }
      break;
  }

  Object.getOwnPropertyNames(this._def).forEach(function(prop) {
    this.$el.setAttributeNS(null, prop, this._def[prop]);
  }, this);

  // set style
  if (this.svgStyle) {
    Object.getOwnPropertyNames(this.svgStyle).forEach(function(prop) {
      this.$el.setAttributeNS(null, PSVUtils.dasherize(prop), this.svgStyle[prop]);
    }, this);
  }
  else {
    this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
  }

  // convert texture coordinates to spherical coordinates
  this.psv.cleanPosition(this);

  // compute x/y/z position
  this.position3D = this.psv.sphericalCoordsToVector3(this);
};

/**
 * @summary Updates a polygon marker
 * @param {'polygon_rad'|'polyline_rad'} key_rad
 * @param {'polygon_px'|'polyline_px'} key_px
 * @private
 */
PSVMarker.prototype._updatePoly = function(key_rad, key_px) {
  this._dynamicSize = true;

  // set style
  if (this.svgStyle) {
    Object.getOwnPropertyNames(this.svgStyle).forEach(function(prop) {
      this.$el.setAttributeNS(null, PSVUtils.dasherize(prop), this.svgStyle[prop]);
    }, this);

    if (this.isPolyline() && !this.svgStyle.fill) {
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
  [this[key_rad], this[key_px]].forEach(function(polygon) {
    if (polygon && typeof polygon[0] !== 'object') {
      for (var i = 0; i < polygon.length; i++) {
        polygon.splice(i, 2, [polygon[i], polygon[i + 1]]);
      }
    }
  });

  // convert texture coordinates to spherical coordinates
  if (this[key_px]) {
    this[key_rad] = this[key_px].map(function(coord) {
      var sphericalCoords = this.psv.textureCoordsToSphericalCoords({ x: coord[0], y: coord[1] });
      return [sphericalCoords.longitude, sphericalCoords.latitude];
    }, this);
  }
  // clean angles
  else {
    this[key_rad] = this[key_rad].map(function(coord) {
      return [
        PSVUtils.parseAngle(coord[0]),
        PSVUtils.parseAngle(coord[1], true)
      ];
    });
  }

  // TODO : compute the center of the polygon
  this.longitude = this[key_rad][0][0];
  this.latitude = this[key_rad][0][1];

  // compute x/y/z positions
  this.positions3D = this[key_rad].map(function(coord) {
    return this.psv.sphericalCoordsToVector3({ longitude: coord[0], latitude: coord[1] });
  }, this);
};
