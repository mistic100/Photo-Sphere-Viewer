/**
 * HUD class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVHUD(psv) {
  PSVComponent.call(this, psv);

  /**
   * @member {SVGElement}
   * @readonly
   */
  this.svgContainer = null;

  /**
   * @summary All registered markers
   * @member {Object.<string, PSVMarker>}
   */
  this.markers = {};

  /**
   * @summary Last selected marker
   * @member {PSVMarker}
   * @readonly
   */
  this.currentMarker = null;

  /**
   * @summary Marker under the cursor
   * @member {PSVMarker}
   * @readonly
   */
  this.hoveringMarker = null;

  /**
   * @member {Object}
   * @private
   */
  this.prop = {
    panelOpened: false,
    panelOpening: false,
    markersButton: this.psv.navbar.getNavbarButton('markers', true)
  };

  this.create();
}

PSVHUD.prototype = Object.create(PSVComponent.prototype);
PSVHUD.prototype.constructor = PSVHUD;

PSVHUD.className = 'psv-hud';
PSVHUD.publicMethods = [
  'addMarker',
  'removeMarker',
  'updateMarker',
  'clearMarkers',
  'getMarker',
  'getCurrentMarker',
  'gotoMarker',
  'hideMarker',
  'showMarker',
  'toggleMarker',
  'toggleMarkersList',
  'showMarkersList',
  'hideMarkersList'
];

/**
 * @override
 */
PSVHUD.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.svgContainer = document.createElementNS(PSVUtils.svgNS, 'svg');
  this.svgContainer.setAttribute('class', 'psv-hud-svg-container');
  this.container.appendChild(this.svgContainer);

  // Markers events via delegation
  this.container.addEventListener('mouseenter', this, true);
  this.container.addEventListener('mouseleave', this, true);
  this.container.addEventListener('mousemove', this, true);

  // Viewer events
  this.psv.on('click', this);
  this.psv.on('dblclick', this);
  this.psv.on('render', this);
  this.psv.on('open-panel', this);
  this.psv.on('close-panel', this);
};

/**
 * @override
 */
PSVHUD.prototype.destroy = function() {
  this.clearMarkers(false);

  this.container.removeEventListener('mouseenter', this);
  this.container.removeEventListener('mouseleave', this);
  this.container.removeEventListener('mousemove', this);

  this.psv.off('click', this);
  this.psv.off('dblclick', this);
  this.psv.off('render', this);
  this.psv.off('open-panel', this);
  this.psv.off('close-panel', this);

  delete this.svgContainer;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * @summary Handles events
 * @param {Event} e
 * @private
 */
PSVHUD.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'mouseenter':  this._onMouseEnter(e);        break;
    case 'mouseleave':  this._onMouseLeave(e);        break;
    case 'mousemove':   this._onMouseMove(e);         break;
    case 'click':       this._onClick(e.args[0], e, false); break;
    case 'dblclick':    this._onClick(e.args[0], e, true);  break;
    case 'render':      this.renderMarkers();         break;
    case 'open-panel':  this._onPanelOpened();        break;
    case 'close-panel': this._onPanelClosed();        break;
    // @formatter:on
  }
};

/**
 * @summary Adds a new marker to viewer
 * @param {Object} properties - see {@link http://photo-sphere-viewer.js.org/markers.html#config}
 * @param {boolean} [render=true] - renders the marker immediately
 * @returns {PSVMarker}
 * @throws {PSVError} when the marker's id is missing or already exists
 */
PSVHUD.prototype.addMarker = function(properties, render) {
  if (!properties.id) {
    throw new PSVError('missing marker id');
  }

  if (this.markers[properties.id]) {
    throw new PSVError('marker "' + properties.id + '" already exists');
  }

  var marker = new PSVMarker(properties, this.psv);

  if (marker.isNormal()) {
    this.container.appendChild(marker.$el);
  }
  else {
    this.svgContainer.appendChild(marker.$el);
  }

  this.markers[marker.id] = marker;

  if (render !== false) {
    this.renderMarkers();
  }

  return marker;
};

/**
 * @summary Returns the internal marker object for a marker id
 * @param {*} markerId
 * @returns {PSVMarker}
 * @throws {PSVError} when the marker cannot be found
 */
PSVHUD.prototype.getMarker = function(markerId) {
  var id = typeof markerId === 'object' ? markerId.id : markerId;

  if (!this.markers[id]) {
    throw new PSVError('cannot find marker "' + id + '"');
  }

  return this.markers[id];
};

/**
 * @summary Returns the last marker selected by the user
 * @returns {PSVMarker}
 */
PSVHUD.prototype.getCurrentMarker = function() {
  return this.currentMarker;
};

/**
 * @summary Updates the existing marker with the same id
 * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
 * @param {Object|PSVMarker} properties
 * @param {boolean} [render=true] - renders the marker immediately
 * @returns {PSVMarker}
 */
PSVHUD.prototype.updateMarker = function(properties, render) {
  var marker = this.getMarker(properties);

  marker.update(properties);

  if (render !== false) {
    this.renderMarkers();
  }

  return marker;
};

/**
 * @summary Removes a marker from the viewer
 * @param {*} marker
 * @param {boolean} [render=true] - renders the marker immediately
 */
PSVHUD.prototype.removeMarker = function(marker, render) {
  marker = this.getMarker(marker);

  if (marker.isNormal()) {
    this.container.removeChild(marker.$el);
  }
  else {
    this.svgContainer.removeChild(marker.$el);
  }

  if (this.hoveringMarker === marker) {
    this.psv.tooltip.hideTooltip();
  }

  marker.destroy();
  delete this.markers[marker.id];

  if (render !== false) {
    this.renderMarkers();
  }
};

/**
 * @summary Removes all markers
 * @param {boolean} [render=true] - renders the markers immediately
 */
PSVHUD.prototype.clearMarkers = function(render) {
  Object.keys(this.markers).forEach(function(marker) {
    this.removeMarker(marker, false);
  }, this);

  if (render !== false) {
    this.renderMarkers();
  }
};

/**
 * @summary Rotate the view to face the marker
 * @param {*} marker
 * @param {string|int} [duration] - rotates smoothy, see {@link PhotoSphereViewer#animate}
 * @fires module:components.PSVHUD.goto-marker-done
 * @return {Promise}  A promise that will be resolved when the animation finishes
 */
PSVHUD.prototype.gotoMarker = function(marker, duration) {
  marker = this.getMarker(marker);

  return this.psv.animate(marker, duration)
    .then(function() {
      /**
       * @event goto-marker-done
       * @memberof module:components.PSVHUD
       * @summary Triggered when the animation to a marker is done
       * @param {PSVMarker} marker
       */
      this.psv.trigger('goto-marker-done', marker);
    }.bind(this));
};

/**
 * @summary Hides a marker
 * @param {*} marker
 */
PSVHUD.prototype.hideMarker = function(marker) {
  this.getMarker(marker).visible = false;
  this.renderMarkers();
};

/**
 * @summary Shows a marker
 * @param {*} marker
 */
PSVHUD.prototype.showMarker = function(marker) {
  this.getMarker(marker).visible = true;
  this.renderMarkers();
};

/**
 * @summary Toggles a marker
 * @param {*} marker
 */
PSVHUD.prototype.toggleMarker = function(marker) {
  this.getMarker(marker).visible ^= true;
  this.renderMarkers();
};

/**
 * @summary Toggles the visibility of markers list
 */
PSVHUD.prototype.toggleMarkersList = function() {
  if (this.prop.panelOpened) {
    this.hideMarkersList();
  }
  else {
    this.showMarkersList();
  }
};

/**
 * @summary Opens side panel with list of markers
 * @fires module:components.PSVHUD.filter:render-markers-list
 */
PSVHUD.prototype.showMarkersList = function() {
  var markers = [];
  PSVUtils.forEach(this.markers, function(marker) {
    markers.push(marker);
  });

  /**
   * @event filter:render-markers-list
   * @memberof module:components.PSVHUD
   * @summary Used to alter the list of markers displayed on the side-panel
   * @param {PSVMarker[]} markers
   * @returns {PSVMarker[]}
   */
  var html = this.psv.config.templates.markersList({
    markers: this.psv.change('render-markers-list', markers),
    config: this.psv.config
  });

  this.prop.panelOpening = true;
  this.psv.panel.showPanel(html, true);

  this.psv.panel.container.querySelector('.psv-markers-list').addEventListener('click', this._onClickItem.bind(this));
};

/**
 * @summary Closes side panel if it contains the list of markers
 */
PSVHUD.prototype.hideMarkersList = function() {
  if (this.prop.panelOpened) {
    this.psv.panel.hidePanel();
  }
};

/**
 * @summary Updates the visibility and the position of all markers
 */
PSVHUD.prototype.renderMarkers = function() {
  if (!this.visible) {
    return;
  }

  var rotation = !this.psv.isGyroscopeEnabled() ? 0 : THREE.Math.radToDeg(this.psv.camera.rotation.z);

  PSVUtils.forEach(this.markers, function(marker) {
    var isVisible = marker.visible;

    if (isVisible && marker.isPoly()) {
      var positions = this._getPolyPositions(marker);
      isVisible = positions.length > (marker.isPolygon() ? 2 : 1);

      if (isVisible) {
        marker.position2D = this._getPolyDimensions(marker, positions);

        var points = positions.map(function(pos) {
          return pos.x + ',' + pos.y;
        }).join(' ');

        marker.$el.setAttributeNS(null, 'points', points);
      }
    }
    else if (isVisible) {
      var position = this._getMarkerPosition(marker);
      isVisible = this._isMarkerVisible(marker, position);

      if (isVisible) {
        marker.position2D = position;

        var scale = marker.getScale(this.psv.getZoomLevel());

        if (marker.isSvg()) {
          marker.$el.setAttributeNS(null, 'transform',
            'translate(' + position.x + ', ' + position.y + ')' +
            (scale !== 1 ? ' scale(' + scale + ', ' + scale + ')' : '') +
            (!marker.lockRotation && rotation ? ' rotate(' + rotation + ')' : '')
          );
        }
        else {
          marker.$el.style.transform = 'translate3D(' + position.x + 'px, ' + position.y + 'px, 0px)' +
            (scale !== 1 ? ' scale(' + scale + ', ' + scale + ')' : '') +
            (!marker.lockRotation && rotation ? ' rotateZ(' + rotation + 'deg)' : '');
        }
      }
    }

    PSVUtils.toggleClass(marker.$el, 'psv-marker--visible', isVisible);
  }.bind(this));
};

/**
 * @summary Determines if a point marker is visible<br>
 * It tests if the point is in the general direction of the camera, then check if it's in the viewport
 * @param {PSVMarker} marker
 * @param {PhotoSphereViewer.Point} position
 * @returns {boolean}
 * @private
 */
PSVHUD.prototype._isMarkerVisible = function(marker, position) {
  return marker.position3D.dot(this.psv.prop.direction) > 0 &&
    position.x + marker.width >= 0 &&
    position.x - marker.width <= this.psv.prop.size.width &&
    position.y + marker.height >= 0 &&
    position.y - marker.height <= this.psv.prop.size.height;
};

/**
 * @summary Computes HUD coordinates of a marker
 * @param {PSVMarker} marker
 * @returns {PhotoSphereViewer.Point}
 * @private
 */
PSVHUD.prototype._getMarkerPosition = function(marker) {
  if (marker._dynamicSize) {
    // make the marker visible to get it's size
    PSVUtils.toggleClass(marker.$el, 'psv-marker--transparent', true);
    var transform = marker.$el.style.transform;
    marker.$el.style.transform = null;

    var rect = marker.$el.getBoundingClientRect();

    marker.$el.style.transform = transform;
    PSVUtils.toggleClass(marker.$el, 'psv-marker--transparent', false);

    marker.width = rect.right - rect.left;
    marker.height = rect.bottom - rect.top;
  }

  var position = this.psv.vector3ToViewerCoords(marker.position3D);

  position.x -= marker.width * marker.anchor.left;
  position.y -= marker.height * marker.anchor.top;

  return position;
};

/**
 * @summary Computes HUD coordinates of each point of a polygon/polyline<br>
 * It handles points behind the camera by creating intermediary points suitable for the projector
 * @param {PSVMarker} marker
 * @returns {PhotoSphereViewer.Point[]}
 * @private
 */
PSVHUD.prototype._getPolyPositions = function(marker) {
  var nbVectors = marker.positions3D.length;

  // compute if each vector is visible
  var positions3D = marker.positions3D.map(function(vector) {
    return {
      vector: vector,
      visible: vector.dot(this.psv.prop.direction) > 0
    };
  }, this);

  // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector
  var toBeComputed = [];
  positions3D.forEach(function(pos, i) {
    if (!pos.visible) {
      var neighbours = [
        i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1],
        i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1]
      ];

      neighbours.forEach(function(neighbour) {
        if (neighbour.visible) {
          toBeComputed.push({
            visible: neighbour,
            invisible: pos,
            index: i
          });
        }
      });
    }
  });

  // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)
  toBeComputed.reverse().forEach(function(pair) {
    positions3D.splice(pair.index, 0, {
      vector: this._getPolyIntermediaryPoint(pair.visible.vector, pair.invisible.vector),
      visible: true
    });
  }, this);

  // translate vectors to screen pos
  return positions3D
    .filter(function(pos) {
      return pos.visible;
    })
    .map(function(pos) {
      return this.psv.vector3ToViewerCoords(pos.vector);
    }, this);
};

/**
 * Given one point in the same direction of the camera and one point behind the camera,
 * computes an intermediary point on the great circle delimiting the half sphere visible by the camera.
 * The point is shifted by .01 rad because the projector cannot handle points exactly on this circle.
 * {@link http://math.stackexchange.com/a/1730410/327208}
 * @param P1 {THREE.Vector3}
 * @param P2 {THREE.Vector3}
 * @returns {THREE.Vector3}
 * @private
 */
PSVHUD.prototype._getPolyIntermediaryPoint = function(P1, P2) {
  var C = this.psv.prop.direction.clone().normalize();
  var N = new THREE.Vector3().crossVectors(P1, P2).normalize();
  var V = new THREE.Vector3().crossVectors(N, P1).normalize();
  var H = new THREE.Vector3().addVectors(P1.clone().multiplyScalar(-C.dot(V)), V.clone().multiplyScalar(C.dot(P1))).normalize();
  var a = new THREE.Vector3().crossVectors(H, C);
  return H.applyAxisAngle(a, 0.01).multiplyScalar(PhotoSphereViewer.SPHERE_RADIUS);
};

/**
 * @summary Computes the boundaries positions of a polygon/polyline marker
 * @param {PSVMarker} marker - alters width and height
 * @param {PhotoSphereViewer.Point[]} positions
 * @returns {PhotoSphereViewer.Point}
 * @private
 */
PSVHUD.prototype._getPolyDimensions = function(marker, positions) {
  var minX = +Infinity;
  var minY = +Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;

  positions.forEach(function(pos) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  });

  marker.width = maxX - minX;
  marker.height = maxY - minY;

  return {
    x: minX,
    y: minY
  };
};

/**
 * @summary Handles mouse enter events, show the tooltip for non polygon markers
 * @param {MouseEvent} e
 * @fires module:components.PSVHUD.over-marker
 * @private
 */
PSVHUD.prototype._onMouseEnter = function(e) {
  var marker;
  if (e.target && (marker = e.target.psvMarker) && !marker.isPoly()) {
    this.hoveringMarker = marker;

    /**
     * @event over-marker
     * @memberof module:components.PSVHUD
     * @summary Triggered when the user puts the cursor hover a marker
     * @param {PSVMarker} marker
     */
    this.psv.trigger('over-marker', marker);

    if (marker.tooltip) {
      this.psv.tooltip.showTooltip({
        content: marker.tooltip.content,
        position: marker.tooltip.position,
        left: marker.position2D.x,
        top: marker.position2D.y,
        box: {
          width: marker.width,
          height: marker.height
        }
      });
    }
  }
};

/**
 * @summary Handles mouse leave events, hide the tooltip
 * @param {MouseEvent} e
 * @fires module:components.PSVHUD.leave-marker
 * @private
 */
PSVHUD.prototype._onMouseLeave = function(e) {
  var marker;
  if (e.target && (marker = e.target.psvMarker)) {
    // do not hide if we enter the tooltip itself while hovering a polygon
    if (marker.isPoly() && e.relatedTarget && PSVUtils.hasParent(e.relatedTarget, this.psv.tooltip.container)) {
      return;
    }

    /**
     * @event leave-marker
     * @memberof module:components.PSVHUD
     * @summary Triggered when the user puts the cursor away from a marker
     * @param {PSVMarker} marker
     */
    this.psv.trigger('leave-marker', marker);

    this.hoveringMarker = null;

    this.psv.tooltip.hideTooltip();
  }
};

/**
 * @summary Handles mouse move events, refresh the tooltip for polygon markers
 * @param {MouseEvent} e
 * @fires module:components.PSVHUD.leave-marker
 * @fires module:components.PSVHUD.over-marker
 * @private
 */
PSVHUD.prototype._onMouseMove = function(e) {
  if (!this.psv.prop.moving) {
    var marker;

    // do not hide if we enter the tooltip itself while hovering a polygon
    if (e.target && (marker = e.target.psvMarker) && marker.isPoly() ||
      e.target && PSVUtils.hasParent(e.target, this.psv.tooltip.container) && (marker = this.hoveringMarker)) {

      if (!this.hoveringMarker) {
        this.psv.trigger('over-marker', marker);

        this.hoveringMarker = marker;
      }

      var boundingRect = this.psv.container.getBoundingClientRect();

      if (marker.tooltip) {
        this.psv.tooltip.showTooltip({
          content: marker.tooltip.content,
          position: marker.tooltip.position,
          top: e.clientY - boundingRect.top - this.psv.config.tooltip.arrow_size / 2,
          left: e.clientX - boundingRect.left - this.psv.config.tooltip.arrow_size,
          box: { // separate the tooltip from the cursor
            width: this.psv.config.tooltip.arrow_size * 2,
            height: this.psv.config.tooltip.arrow_size * 2
          }
        });
      }
    }
    else if (this.hoveringMarker && this.hoveringMarker.isPoly()) {
      this.psv.trigger('leave-marker', this.hoveringMarker);

      this.hoveringMarker = null;

      this.psv.tooltip.hideTooltip();
    }
  }
};

/**
 * @summary Handles mouse click events, select the marker and open the panel if necessary
 * @param {Object} data
 * @param {Event} e
 * @param {boolean} dblclick
 * @fires module:components.PSVHUD.select-marker
 * @fires module:components.PSVHUD.unselect-marker
 * @private
 */
PSVHUD.prototype._onClick = function(data, e, dblclick) {
  var marker;
  if (data.target && (marker = PSVUtils.getClosest(data.target, '.psv-marker')) && marker.psvMarker) {
    this.currentMarker = marker.psvMarker;

    /**
     * @event select-marker
     * @memberof module:components.PSVHUD
     * @summary Triggered when the user clicks on a marker. The marker can be retrieved from outside the event handler
     * with {@link module:components.PSVHUD.getCurrentMarker}
     * @param {PSVMarker} marker
     * @param {boolean} dblclick - the simple click is always fired before the double click
     */
    this.psv.trigger('select-marker', this.currentMarker, dblclick);

    if (this.psv.config.click_event_on_marker) {
      // add the marker to event data
      data.marker = marker.psvMarker;
    }
    else {
      e.stopPropagation();
    }
  }
  else if (this.currentMarker) {
    /**
     * @event unselect-marker
     * @memberof module:components.PSVHUD
     * @summary Triggered when a marker was selected and the user clicks elsewhere
     * @param {PSVMarker} marker
     */
    this.psv.trigger('unselect-marker', this.currentMarker);

    this.currentMarker = null;
  }

  if (marker && marker.psvMarker && marker.psvMarker.content) {
    this.psv.panel.showPanel(marker.psvMarker.content);
  }
  else if (this.psv.panel.prop.opened) {
    e.stopPropagation();
    this.psv.panel.hidePanel();
  }
};

/**
 * @summary Clicks on an item
 * @param {MouseEvent} e
 * @fires module:components.PSVHUD.select-marker-list
 * @private
 */
PSVHUD.prototype._onClickItem = function(e) {
  var li;
  if (e.target && (li = PSVUtils.getClosest(e.target, 'li')) && li.dataset.psvMarker) {
    var marker = this.getMarker(li.dataset.psvMarker);

    /**
     * @event select-marker-list
     * @memberof module:components.PSVHUD
     * @summary Triggered when a marker is selected from the side panel
     * @param {PSVMarker} marker
     */
    this.psv.trigger('select-marker-list', marker);

    this.gotoMarker(marker, 1000);
    this.psv.panel.hidePanel();
  }
};

/**
 * @summary Updates status when the panel is updated
 * @private
 */
PSVHUD.prototype._onPanelOpened = function() {
  if (this.prop.panelOpening) {
    this.prop.panelOpening = false;
    this.prop.panelOpened = true;
  }
  else {
    this.prop.panelOpened = false;
  }

  if (this.prop.markersButton) {
    this.prop.markersButton.toggleActive(this.prop.panelOpened);
  }
};

/**
 * @summary Updates status when the panel is updated
 * @private
 */
PSVHUD.prototype._onPanelClosed = function() {
  this.prop.panelOpened = false;
  this.prop.panelOpening = false;

  if (this.prop.markersButton) {
    this.prop.markersButton.toggleActive(false);
  }
};
