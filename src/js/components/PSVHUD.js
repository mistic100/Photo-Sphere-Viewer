import * as THREE from 'three';
import { EVENTS, IDS, MARKER_DATA, SPHERE_RADIUS, SVG_NS } from '../data/constants';
import { PSVError } from '../PSVError';
import { PSVMarker } from '../PSVMarker';
import { addClasses, each, getClosest, hasParent, removeClasses, toggleClass } from '../utils';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary HUD class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVHUD extends AbstractComponent {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-hud');

    /**
     * @summary All registered markers
     * @member {Object<string, PSVMarker>}
     * @readonly
     */
    this.markers = {};

    /**
     * @override
     * @property {PSVMarker} currentMarker - Last selected marker
     * @property {PSVMarker} hoveringMarker - Marker under the cursor
     */
    this.prop = {
      ...this.prop,
      currentMarker : null,
      hoveringMarker: null,
    };

    if (this.psv.config.mousemove) {
      this.container.style.cursor = 'move';
    }

    /**
     * @member {SVGElement}
     * @readonly
     */
    this.svgContainer = document.createElementNS(SVG_NS, 'svg');
    this.svgContainer.setAttribute('class', 'psv-hud-svg-container');
    this.container.appendChild(this.svgContainer);

    // Markers events via delegation
    this.container.addEventListener('mouseenter', this, true);
    this.container.addEventListener('mouseleave', this, true);
    this.container.addEventListener('mousemove', this, true);

    // Viewer events
    this.psv.on(EVENTS.CLICK, this);
    this.psv.on(EVENTS.DOUBLE_CLICK, this);
    this.psv.on(EVENTS.RENDER, this);
  }

  /**
   * @override
   */
  destroy() {
    this.clearMarkers(false);

    this.container.removeEventListener('mouseenter', this);
    this.container.removeEventListener('mouseleave', this);
    this.container.removeEventListener('mousemove', this);

    this.psv.off(EVENTS.CLICK, this);
    this.psv.off(EVENTS.DOUBLE_CLICK, this);
    this.psv.off(EVENTS.RENDER, this);

    delete this.svgContainer;
    delete this.markers;

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case 'mouseenter': this.__onMouseEnter(e); break;
      case 'mouseleave': this.__onMouseLeave(e); break;
      case 'mousemove':  this.__onMouseMove(e);  break;
      case EVENTS.CLICK:        this.__onClick(e, e.args[0],false); break;
      case EVENTS.DOUBLE_CLICK: this.__onClick(e, e.args[0],true);  break;
      case EVENTS.RENDER:       this.renderMarkers();                   break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @fires module:components.PSVHUD.show-hud
   */
  show() {
    this.prop.visible = true;

    this.renderMarkers();

    /**
     * @event show-hud
     * @memberof module:components.PSVHUD
     * @summary Triggered when the HUD is shown
     */
    this.psv.trigger(EVENTS.SHOW_HUD);
  }

  /**
   * @override
   * @fires module:components.PSVHUD.hide-hud
   */
  hide() {
    this.prop.visible = false;

    this.renderMarkers();

    /**
     * @event hide-hud
     * @memberof module:components.PSVHUD
     * @summary Triggered when the HUD is hidden
     */
    this.psv.trigger(EVENTS.HIDE_HUD);
  }

  /**
   * @summary Toggles the visibility of all tooltips
   */
  toggleAllTooltips() {
    this.prop.showAllTooltips = !this.prop.showAllTooltips;
    this.renderMarkers();
  }

  /**
   * @summary Displays all tooltips
   */
  showAllTooltips() {
    this.prop.showAllTooltips = true;
    this.renderMarkers();
  }

  /**
   * @summary Hides all tooltips
   */
  hideAllTooltips() {
    this.prop.showAllTooltips = false;
    this.renderMarkers();
  }

  /**
   * @summary Return the total number of markers
   * @returns {number}
   */
  getNbMarkers() {
    return Object.keys(this.markers).length;
  }

  /**
   * @summary Adds a new marker to viewer
   * @param {PSVMarker.Properties} properties
   * @param {boolean} [render=true] - renders the marker immediately
   * @returns {PSVMarker}
   * @throws {PSVError} when the marker's id is missing or already exists
   */
  addMarker(properties, render = true) {
    if (this.markers[properties.id]) {
      throw new PSVError(`marker "${properties.id}" already exists`);
    }

    const marker = new PSVMarker(properties, this.psv);

    if (marker.isNormal()) {
      this.container.appendChild(marker.$el);
    }
    else {
      this.svgContainer.appendChild(marker.$el);
    }

    this.markers[marker.id] = marker;

    if (render) {
      this.renderMarkers();
      this.psv.refresh(`add marker ${marker.id}`);
    }

    return marker;
  }

  /**
   * @summary Returns the internal marker object for a marker id
   * @param {*} markerId
   * @returns {PSVMarker}
   * @throws {PSVError} when the marker cannot be found
   */
  getMarker(markerId) {
    const id = typeof markerId === 'object' ? markerId.id : markerId;

    if (!this.markers[id]) {
      throw new PSVError(`cannot find marker "${id}"`);
    }

    return this.markers[id];
  }

  /**
   * @summary Returns the last marker selected by the user
   * @returns {PSVMarker}
   */
  getCurrentMarker() {
    return this.prop.currentMarker;
  }

  /**
   * @summary Updates the existing marker with the same id
   * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
   * @param {PSVMarker.Properties|PSVMarker} properties
   * @param {boolean} [render=true] - renders the marker immediately
   * @returns {PSVMarker}
   */
  updateMarker(properties, render = true) {
    const marker = this.getMarker(properties);

    marker.update(properties);

    if (render) {
      this.renderMarkers();
    }

    return marker;
  }

  /**
   * @summary Removes a marker from the viewer
   * @param {*} markerOrId
   * @param {boolean} [render=true] - renders the marker immediately
   */
  removeMarker(markerOrId, render = true) {
    const marker = this.getMarker(markerOrId);

    if (marker.isNormal()) {
      this.container.removeChild(marker.$el);
    }
    else {
      this.svgContainer.removeChild(marker.$el);
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
      this.psv.refresh(`remove marker ${marker.id}`);
    }
  }

  /**
   * @summary Replaces all markers
   * @param {array} markers
   * @param {boolean} [render=true] - renders the marker immediately
   */
  setMarkers(markers, render = true) {
    this.clearMarkers(false);

    each(markers, marker => this.addMarker(marker, false));

    if (render) {
      this.renderMarkers();
      this.psv.refresh('set markers');
    }
  }

  /**
   * @summary Removes all markers
   * @param {boolean} [render=true] - renders the markers immediately
   */
  clearMarkers(render = true) {
    each(this.markers, marker => this.removeMarker(marker, false));

    if (render) {
      this.renderMarkers();
      this.psv.refresh('clear markers');
    }
  }

  /**
   * @summary Rotate the view to face the marker
   * @param {*} markerOrId
   * @param {string|number} [duration] - rotates smoothy, see {@link PhotoSphereViewer#animate}
   * @fires module:components.PSVHUD.goto-marker-done
   * @return {PSVAnimation}  A promise that will be resolved when the animation finishes
   */
  gotoMarker(markerOrId, duration) {
    const marker = this.getMarker(markerOrId);

    return this.psv.animate(marker.props.position, duration)
      .then(() => {
        /**
         * @event goto-marker-done
         * @memberof module:components.PSVHUD
         * @summary Triggered when the animation to a marker is done
         * @param {PSVMarker} marker
         */
        this.psv.trigger(EVENTS.GOTO_MARKER_DONE, marker);
      });
  }

  /**
   * @summary Hides a marker
   * @param {*} marker
   */
  hideMarker(marker) {
    this.getMarker(marker).visible = false;
    this.renderMarkers();
  }

  /**
   * @summary Shows a marker
   * @param {*} marker
   */
  showMarker(marker) {
    this.getMarker(marker).visible = true;
    this.renderMarkers();
  }

  /**
   * @summary Toggles a marker
   * @param {*} marker
   */
  toggleMarker(marker) {
    this.getMarker(marker).visible ^= true;
    this.renderMarkers();
  }

  /**
   * @summary Updates the visibility and the position of all markers
   */
  renderMarkers() {
    const rotation = !this.psv.isGyroscopeEnabled() ? 0 : THREE.Math.radToDeg(this.psv.renderer.camera.rotation.z);

    each(this.markers, (marker) => {
      let isVisible = this.prop.visible && marker.visible;

      if (isVisible && marker.isPoly()) {
        const positions = this.__getPolyPositions(marker);
        isVisible = positions.length > (marker.isPolygon() ? 2 : 1);

        if (isVisible) {
          marker.props.position2D = this.__getMarkerPosition(marker);

          const points = positions.map(pos => pos.x + ',' + pos.y).join(' ');

          marker.$el.setAttributeNS(null, 'points', points);
        }
      }
      else if (isVisible) {
        if (marker.props.dynamicSize) {
          this.__updateMarkerSize(marker);
        }

        const scale = marker.getScale(this.psv.getZoomLevel());
        const position = this.__getMarkerPosition(marker, scale);
        isVisible = this.__isMarkerVisible(marker, position);

        if (isVisible) {
          marker.props.position2D = position;

          if (marker.isSvg()) {
            let transform = `translate(${position.x}, ${position.y})`;
            if (scale !== 1) {
              transform += ` scale(${scale}, ${scale})`;
            }
            if (!marker.config.lockRotation && rotation) {
              transform += ` rotate(${rotation})`;
            }

            marker.$el.setAttributeNS(null, 'transform', transform);
          }
          else {
            let transform = `translate3D(${position.x}px, ${position.y}px, 0px)`;
            if (scale !== 1) {
              transform += ` scale(${scale}, ${scale})`;
            }
            if (!marker.config.lockRotation && rotation) {
              transform += ` rotateZ(${rotation}deg)`;
            }

            marker.$el.style.transform = transform;
          }
        }
      }

      marker.props.inViewport = isVisible;
      toggleClass(marker.$el, 'psv-marker--visible', isVisible);

      if (marker.props.inViewport && (this.prop.showAllTooltips || (marker === this.prop.hoveringMarker && !marker.isPoly()))) {
        marker.showTooltip();
      }
      else if (!marker.props.inViewport || marker !== this.prop.hoveringMarker) {
        marker.hideTooltip();
      }
    });
  }

  /**
   * @summary Determines if a point marker is visible<br>
   * It tests if the point is in the general direction of the camera, then check if it's in the viewport
   * @param {PSVMarker} marker
   * @param {PhotoSphereViewer.Point} position
   * @returns {boolean}
   * @private
   */
  __isMarkerVisible(marker, position) {
    return marker.props.positions3D[0].dot(this.psv.prop.direction) > 0
      && position.x + marker.props.width >= 0
      && position.x - marker.props.width <= this.psv.prop.size.width
      && position.y + marker.props.height >= 0
      && position.y - marker.props.height <= this.psv.prop.size.height;
  }

  /**
   * @summary Computes the real size of a marker
   * @description This is done by removing all it's transformations (if any) and making it visible
   * before querying its bounding rect
   * @param {PSVMarker} marker
   * @private
   */
  __updateMarkerSize(marker) {
    addClasses(marker.$el, 'psv-marker--transparent');

    let transform;
    if (marker.isSvg()) {
      transform = marker.$el.getAttributeNS(null, 'transform');
      marker.$el.removeAttributeNS(null, 'transform');
    }
    else {
      transform = marker.$el.style.transform;
      marker.$el.style.transform = '';
    }

    const rect = marker.$el.getBoundingClientRect();
    marker.props.width = rect.width;
    marker.props.height = rect.height;

    removeClasses(marker.$el, 'psv-marker--transparent');

    if (transform) {
      if (marker.isSvg()) {
        marker.$el.setAttributeNS(null, 'transform', transform);
      }
      else {
        marker.$el.style.transform = transform;
      }
    }

    // the size is no longer dynamic once known
    marker.props.dynamicSize = false;
  }

  /**
   * @summary Computes HUD coordinates of a marker
   * @param {PSVMarker} marker
   * @param {number} [scale=1]
   * @returns {PhotoSphereViewer.Point}
   * @private
   */
  __getMarkerPosition(marker, scale = 1) {
    if (marker.isPoly()) {
      return this.psv.dataHelper.vector3ToViewerCoords(this.psv.dataHelper.sphericalCoordsToVector3(marker.props.position));
    }
    else {
      const position = this.psv.dataHelper.vector3ToViewerCoords(marker.props.positions3D[0]);

      position.x -= marker.props.width * marker.props.anchor.x * scale;
      position.y -= marker.props.height * marker.props.anchor.y * scale;

      return position;
    }
  }

  /**
   * @summary Computes HUD coordinates of each point of a polygon/polyline<br>
   * It handles points behind the camera by creating intermediary points suitable for the projector
   * @param {PSVMarker} marker
   * @returns {PhotoSphereViewer.Point[]}
   * @private
   */
  __getPolyPositions(marker) {
    const nbVectors = marker.props.positions3D.length;

    // compute if each vector is visible
    const positions3D = marker.props.positions3D.map((vector) => {
      return {
        vector : vector,
        visible: vector.dot(this.psv.prop.direction) > 0,
      };
    });

    // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector
    const toBeComputed = [];
    positions3D.forEach((pos, i) => {
      if (!pos.visible) {
        const neighbours = [
          i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1],
          i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1],
        ];

        neighbours.forEach((neighbour) => {
          if (neighbour.visible) {
            toBeComputed.push({
              visible  : neighbour,
              invisible: pos,
              index    : i,
            });
          }
        });
      }
    });

    // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)
    toBeComputed.reverse().forEach((pair) => {
      positions3D.splice(pair.index, 0, {
        vector : this.__getPolyIntermediaryPoint(pair.visible.vector, pair.invisible.vector),
        visible: true,
      });
    });

    // translate vectors to screen pos
    return positions3D
      .filter(pos => pos.visible)
      .map(pos => this.psv.dataHelper.vector3ToViewerCoords(pos.vector));
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
  __getPolyIntermediaryPoint(P1, P2) {
    const C = this.psv.prop.direction.clone().normalize();
    const N = new THREE.Vector3().crossVectors(P1, P2).normalize();
    const V = new THREE.Vector3().crossVectors(N, P1).normalize();
    const X = P1.clone().multiplyScalar(-C.dot(V));
    const Y = V.clone().multiplyScalar(C.dot(P1));
    const H = new THREE.Vector3().addVectors(X, Y).normalize();
    const a = new THREE.Vector3().crossVectors(H, C);
    return H.applyAxisAngle(a, 0.01).multiplyScalar(SPHERE_RADIUS);
  }

  /**
   * @summary Returns the marker associated to an event target
   * @param {EventTarget} target
   * @param {boolean} [closest=false]
   * @returns {PSVMarker}
   * @private
   */
  __getTargetMarker(target, closest = false) {
    const target2 = closest ? getClosest(target, '.psv-marker') : target;
    return target2 ? target2[MARKER_DATA] : undefined;
  }

  /**
   * @summary Checks if an event target is in the tooltip
   * @param {EventTarget} target
   * @param {module:components.PSVTooltip} tooltip
   * @returns {boolean}
   * @private
   */
  __targetOnTooltip(target, tooltip) {
    return target && tooltip ? hasParent(target, tooltip.container) : false;
  }

  /**
   * @summary Handles mouse enter events, show the tooltip for non polygon markers
   * @param {MouseEvent} e
   * @fires module:components.PSVHUD.over-marker
   * @private
   */
  __onMouseEnter(e) {
    const marker = this.__getTargetMarker(e.target);

    if (marker && !marker.isPoly()) {
      this.prop.hoveringMarker = marker;

      /**
       * @event over-marker
       * @memberof module:components.PSVHUD
       * @summary Triggered when the user puts the cursor hover a marker
       * @param {PSVMarker} marker
       */
      this.psv.trigger(EVENTS.OVER_MARKER, marker);

      if (!this.prop.showAllTooltips) {
        marker.showTooltip(e);
      }
    }
  }

  /**
   * @summary Handles mouse leave events, hide the tooltip
   * @param {MouseEvent} e
   * @fires module:components.PSVHUD.leave-marker
   * @private
   */
  __onMouseLeave(e) {
    const marker = this.__getTargetMarker(e.target);

    // do not hide if we enter the tooltip itself while hovering a polygon
    if (marker && !(marker.isPoly() && this.__targetOnTooltip(e.relatedTarget, marker.tooltip))) {
      /**
       * @event leave-marker
       * @memberof module:components.PSVHUD
       * @summary Triggered when the user puts the cursor away from a marker
       * @param {PSVMarker} marker
       */
      this.psv.trigger(EVENTS.LEAVE_MARKER, marker);

      this.prop.hoveringMarker = null;

      if (!this.prop.showAllTooltips) {
        marker.hideTooltip();
      }
    }
  }

  /**
   * @summary Handles mouse move events, refresh the tooltip for polygon markers
   * @param {MouseEvent} e
   * @fires module:components.PSVHUD.leave-marker
   * @fires module:components.PSVHUD.over-marker
   * @private
   */
  __onMouseMove(e) {
    let marker;
    const targetMarker = this.__getTargetMarker(e.target);

    if (targetMarker && targetMarker.isPoly()) {
      marker = targetMarker;
    }
    // do not hide if we enter the tooltip itself while hovering a polygon
    else if (this.prop.hoveringMarker && this.__targetOnTooltip(e.target, this.prop.hoveringMarker.tooltip)) {
      marker = this.prop.hoveringMarker;
    }

    if (marker) {
      if (!this.prop.hoveringMarker) {
        this.psv.trigger(EVENTS.OVER_MARKER, marker);

        this.prop.hoveringMarker = marker;
      }

      if (!this.prop.showAllTooltips) {
        marker.showTooltip(e);
      }
    }
    else if (this.prop.hoveringMarker && this.prop.hoveringMarker.isPoly()) {
      this.psv.trigger(EVENTS.LEAVE_MARKER, this.prop.hoveringMarker);

      if (!this.prop.showAllTooltips) {
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
   * @fires module:components.PSVHUD.select-marker
   * @fires module:components.PSVHUD.unselect-marker
   * @private
   */
  __onClick(e, data, dblclick) {
    const marker = this.__getTargetMarker(data.target, true);

    if (marker) {
      this.prop.currentMarker = marker;

      /**
       * @event select-marker
       * @memberof module:components.PSVHUD
       * @summary Triggered when the user clicks on a marker. The marker can be retrieved from outside the event handler
       * with {@link module:components.PSVHUD.getCurrentMarker}
       * @param {PSVMarker} marker
       * @param {boolean} dblclick - the simple click is always fired before the double click
       */
      this.psv.trigger(EVENTS.SELECT_MARKER, marker, dblclick);

      if (this.psv.config.clickEventOnMarker) {
        // add the marker to event data
        data.marker = marker;
      }
      else {
        e.stopPropagation();
      }
    }
    else if (this.prop.currentMarker) {
      /**
       * @event unselect-marker
       * @memberof module:components.PSVHUD
       * @summary Triggered when a marker was selected and the user clicks elsewhere
       * @param {PSVMarker} marker
       */
      this.psv.trigger(EVENTS.UNSELECT_MARKER, this.prop.currentMarker);

      this.prop.currentMarker = null;
    }

    if (marker && marker.config.content) {
      this.psv.panel.show({
        id     : IDS.MARKER,
        content: marker.config.content,
      });
    }
    else {
      this.psv.panel.hide(IDS.MARKER);
    }
  }

}

export { PSVHUD };
