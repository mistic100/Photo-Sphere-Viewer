import { Vector3 } from 'three';
import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from '../..';
import {
  EVENTS,
  ID_PANEL_MARKER,
  ID_PANEL_MARKERS_LIST,
  MARKER_DATA,
  MARKER_TOOLTIP_TRIGGER,
  MARKERS_LIST_TEMPLATE,
  SVG_NS
} from './constants';
import { Marker } from './Marker';
import { MarkersButton } from './MarkersButton';
import { MarkersListButton } from './MarkersListButton';
import './style.scss';


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
DEFAULTS.lang[MarkersButton.id] = 'Markers';
DEFAULTS.lang[MarkersListButton.id] = 'Markers list';
registerButton(MarkersButton, 'caption:left');
registerButton(MarkersListButton, 'caption:left');


export { EVENTS } from './constants';


/**
 * @summary Displays various markers on the viewer
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class MarkersPlugin extends AbstractPlugin {

  static id = 'markers';

  static EVENTS = EVENTS;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.MarkersPlugin.Options} [options]
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @summary All registered markers
     * @member {Object<string, PSV.plugins.MarkersPlugin.Marker>}
     */
    this.markers = {};

    /**
     * @type {Object}
     * @property {boolean} visible - Visibility of the component
     * @property {PSV.plugins.MarkersPlugin.Marker} currentMarker - Last selected marker
     * @property {PSV.plugins.MarkersPlugin.Marker} hoveringMarker - Marker under the cursor
     * @private
     */
    this.prop = {
      visible       : true,
      currentMarker : null,
      hoveringMarker: null,
      stopObserver  : null,
    };

    /**
     * @type {PSV.plugins.MarkersPlugin.Options}
     */
    this.config = {
      clickEventOnMarker: false,
      ...options,
    };

    if (options?.listButton === false || options?.hideButton === false) {
      utils.logWarn('MarkersPlugin: listButton and hideButton options are deprecated. '
        + 'Please define the global navbar options according to your needs.');
    }

    /**
     * @member {HTMLElement}
     * @readonly
     */
    this.container = document.createElement('div');
    this.container.className = 'psv-markers';
    this.container.style.cursor = this.psv.config.mousemove ? 'move' : 'default';

    /**
     * @member {SVGElement}
     * @readonly
     */
    this.svgContainer = document.createElementNS(SVG_NS, 'svg');
    this.svgContainer.setAttribute('class', 'psv-markers-svg-container');
    this.container.appendChild(this.svgContainer);

    // Markers events via delegation
    this.container.addEventListener('mouseenter', this, true);
    this.container.addEventListener('mouseleave', this, true);
    this.container.addEventListener('mousemove', this, true);
    this.container.addEventListener('contextmenu', this);
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.psv.container.appendChild(this.container);

    // Viewer events
    this.psv.on(CONSTANTS.EVENTS.CLICK, this);
    this.psv.on(CONSTANTS.EVENTS.DOUBLE_CLICK, this);
    this.psv.on(CONSTANTS.EVENTS.RENDER, this);
    this.psv.on(CONSTANTS.EVENTS.CONFIG_CHANGED, this);

    this.psv.once(CONSTANTS.EVENTS.READY, () => {
      if (this.config.markers) {
        this.setMarkers(this.config.markers);
        delete this.config.markers;
      }
    });
  }

  /**
   * @package
   */
  destroy() {
    this.clearMarkers(false);

    this.prop.stopObserver?.();

    this.psv.off(CONSTANTS.EVENTS.CLICK, this);
    this.psv.off(CONSTANTS.EVENTS.DOUBLE_CLICK, this);
    this.psv.off(CONSTANTS.EVENTS.RENDER, this);
    this.psv.off(CONSTANTS.EVENTS.CONFIG_CHANGED, this);

    this.psv.container.removeChild(this.container);

    delete this.svgContainer;
    delete this.markers;
    delete this.container;

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
      case 'mouseenter':  this.__onMouseEnter(e, this.__getTargetMarker(e.target)); break;
      case 'mouseleave':  this.__onMouseLeave(e, this.__getTargetMarker(e.target)); break;
      case 'mousemove':   this.__onMouseMove(e, this.__getTargetMarker(e.target));  break;
      case 'contextmenu': e.preventDefault(); break;
      case CONSTANTS.EVENTS.CLICK:        this.__onClick(e, e.args[0], false); break;
      case CONSTANTS.EVENTS.DOUBLE_CLICK: this.__onClick(e, e.args[0], true);  break;
      case CONSTANTS.EVENTS.RENDER:       this.renderMarkers();                        break;
      case CONSTANTS.OBJECT_EVENTS.ENTER_OBJECT: this.__onMouseEnter(e.detail.originalEvent, e.detail.data); break;
      case CONSTANTS.OBJECT_EVENTS.LEAVE_OBJECT: this.__onMouseLeave(e.detail.originalEvent, e.detail.data); break;
      case CONSTANTS.OBJECT_EVENTS.HOVER_OBJECT: this.__onMouseMove(e.detail.originalEvent, e.detail.data);  break;
      case CONSTANTS.EVENTS.CONFIG_CHANGED:
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
  show() {
    this.prop.visible = true;

    this.renderMarkers();

    this.trigger(EVENTS.SHOW_MARKERS);
  }

  /**
   * @summary Hides all markers
   * @fires PSV.plugins.MarkersPlugin.hide-markers
   */
  hide() {
    this.prop.visible = false;

    this.renderMarkers();

    this.trigger(EVENTS.HIDE_MARKERS);
  }

  /**
   * @summary Toggles the visibility of all tooltips
   */
  toggleAllTooltips() {
    if (this.prop.showAllTooltips) {
      this.hideAllTooltips();
    }
    else {
      this.showAllTooltips();
    }
  }

  /**
   * @summary Displays all tooltips
   */
  showAllTooltips() {
    this.prop.showAllTooltips = true;
    utils.each(this.markers, (marker) => {
      marker.props.staticTooltip = true;
      marker.showTooltip();
    });
  }

  /**
   * @summary Hides all tooltips
   */
  hideAllTooltips() {
    this.prop.showAllTooltips = false;
    utils.each(this.markers, (marker) => {
      marker.props.staticTooltip = false;
      marker.hideTooltip();
    });
  }

  /**
   * @summary Returns the total number of markers
   * @returns {number}
   */
  getNbMarkers() {
    return Object.keys(this.markers).length;
  }

  /**
   * @summary Returns all the markers
   * @return {PSV.plugins.MarkersPlugin.Marker[]}
   */
  getMarkers() {
    return Object.values(this.markers);
  }

  /**
   * @summary Adds a new marker to viewer
   * @param {PSV.plugins.MarkersPlugin.Properties} properties
   * @param {boolean} [render=true] - renders the marker immediately
   * @returns {PSV.plugins.MarkersPlugin.Marker}
   * @throws {PSV.PSVError} when the marker's id is missing or already exists
   */
  addMarker(properties, render = true) {
    if (this.markers[properties.id]) {
      throw new PSVError(`marker "${properties.id}" already exists`);
    }

    const marker = new Marker(properties, this.psv);

    if (marker.isNormal()) {
      this.container.appendChild(marker.$el);
    }
    else if (marker.isPoly() || marker.isSvg()) {
      this.svgContainer.appendChild(marker.$el);
    }
    else if (marker.is3d()) {
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
  getMarker(markerId) {
    const id = typeof markerId === 'object' ? markerId.id : markerId;

    if (!this.markers[id]) {
      throw new PSVError(`cannot find marker "${id}"`);
    }

    return this.markers[id];
  }

  /**
   * @summary Returns the last marker selected by the user
   * @returns {PSV.plugins.MarkersPlugin.Marker}
   */
  getCurrentMarker() {
    return this.prop.currentMarker;
  }

  /**
   * @summary Updates the existing marker with the same id
   * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
   * @param {PSV.plugins.MarkersPlugin.Properties} properties
   * @param {boolean} [render=true] - renders the marker immediately
   * @returns {PSV.plugins.MarkersPlugin.Marker}
   */
  updateMarker(properties, render = true) {
    const marker = this.getMarker(properties.id);

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
  removeMarker(markerId, render = true) {
    const marker = this.getMarker(markerId);

    if (marker.isNormal()) {
      this.container.removeChild(marker.$el);
    }
    else if (marker.isPoly() || marker.isSvg()) {
      this.svgContainer.removeChild(marker.$el);
    }
    else if (marker.is3d()) {
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
  removeMarkers(markerIds, render = true) {
    markerIds.forEach(markerId => this.removeMarker(markerId, false));

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
  setMarkers(markers, render = true) {
    this.clearMarkers(false);

    utils.each(markers, marker => this.addMarker(marker, false));

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
  clearMarkers(render = true) {
    utils.each(this.markers, marker => this.removeMarker(marker, false));

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
  gotoMarker(markerId, speed) {
    const marker = this.getMarker(markerId);

    return this.psv.animate({
      ...marker.props.position,
      speed,
    })
      .then(() => {
        this.trigger(EVENTS.GOTO_MARKER_DONE, marker);
      });
  }

  /**
   * @summary Hides a marker
   * @param {string} markerId
   */
  hideMarker(markerId) {
    this.toggleMarker(markerId, false);
  }

  /**
   * @summary Shows a marker
   * @param {string} markerId
   */
  showMarker(markerId) {
    this.toggleMarker(markerId, true);
  }

  /**
   * @summary Forces the display of the tooltip
   * @param {string} markerId
   */
  showMarkerTooltip(markerId) {
    const marker = this.getMarker(markerId);
    marker.props.staticTooltip = true;
    marker.showTooltip();
  }

  /**
   * @summary Hides the tooltip
   * @param {string} markerId
   */
  hideMarkerTooltip(markerId) {
    const marker = this.getMarker(markerId);
    marker.props.staticTooltip = false;
    marker.hideTooltip();
  }

  /**
   * @summary Toggles a marker
   * @param {string} markerId
   * @param {boolean} [visible]
   */
  toggleMarker(markerId, visible = null) {
    const marker = this.getMarker(markerId);
    marker.visible = visible === null ? !marker.visible : visible;
    if (marker.is3d()) {
      this.psv.needsUpdate();
    }
    else {
      this.renderMarkers();
    }
  }

  /**
   * @summary Opens the panel with the content of the marker
   * @param {string} markerId
   */
  showMarkerPanel(markerId) {
    const marker = this.getMarker(markerId);

    if (marker?.config?.content) {
      this.psv.panel.show({
        id     : ID_PANEL_MARKER,
        content: marker.config.content,
      });
    }
    else {
      this.psv.panel.hide(ID_PANEL_MARKER);
    }
  }

  /**
   * @summary Toggles the visibility of the list of markers
   */
  toggleMarkersList() {
    if (this.psv.panel.prop.contentId === ID_PANEL_MARKERS_LIST) {
      this.hideMarkersList();
    }
    else {
      this.showMarkersList();
    }
  }

  /**
   * @summary Opens side panel with the list of markers
   * @fires PSV.plugins.MarkersPlugin.filter:render-markers-list
   */
  showMarkersList() {
    let markers = [];
    utils.each(this.markers, (marker) => {
      if (marker.visible && !marker.config.hideList) {
        markers.push(marker);
      }
    });

    markers = this.change(EVENTS.RENDER_MARKERS_LIST, markers);

    this.psv.panel.show({
      id          : ID_PANEL_MARKERS_LIST,
      content     : MARKERS_LIST_TEMPLATE(markers, this.psv.config.lang[MarkersButton.id]),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const markerId = li ? li.dataset[MARKER_DATA] : undefined;

        if (markerId) {
          const marker = this.getMarker(markerId);

          this.trigger(EVENTS.SELECT_MARKER_LIST, marker);

          this.gotoMarker(marker, 1000);
          this.hideMarkersList();
        }
      },
    });
  }

  /**
   * @summary Closes side panel if it contains the list of markers
   */
  hideMarkersList() {
    this.psv.panel.hide(ID_PANEL_MARKERS_LIST);
  }

  /**
   * @summary Updates the visibility and the position of all markers
   */
  renderMarkers() {
    const zoomLevel = this.psv.getZoomLevel();
    const viewerPosition = this.psv.getPosition();

    utils.each(this.markers, (marker) => {
      let isVisible = this.prop.visible && marker.visible;
      let visibilityChanged = false;
      let position = null;

      if (isVisible && marker.is3d()) {
        position = this.__getMarkerPosition(marker);
        isVisible = this.__isMarkerVisible(marker, position);
      }
      else if (isVisible && marker.isPoly()) {
        const positions = this.__getPolyPositions(marker);
        isVisible = positions.length > (marker.isPolygon() ? 2 : 1);

        if (isVisible) {
          position = this.__getMarkerPosition(marker);

          const points = positions.map(pos => (pos.x - position.x) + ',' + (pos.y - position.y)).join(' ');

          marker.$el.setAttributeNS(null, 'points', points);
          marker.$el.setAttributeNS(null, 'transform', `translate(${position.x} ${position.y})`);
        }
      }
      else if (isVisible) {
        if (marker.props.dynamicSize) {
          this.__updateMarkerSize(marker);
        }

        position = this.__getMarkerPosition(marker);
        isVisible = this.__isMarkerVisible(marker, position);

        if (isVisible) {
          const scale = marker.getScale(zoomLevel, viewerPosition);

          if (marker.isSvg()) {
            // simulate transform-origin relative to SVG element
            const x = position.x + marker.props.width * marker.props.anchor.x * (1 - scale);
            const y = position.y + marker.props.height * marker.props.anchor.y * (1 - scale);
            marker.$el.setAttributeNS(null, 'transform', `translate(${x}, ${y}) scale(${scale}, ${scale})`);
          }
          else {
            marker.$el.style.transform = `translate3D(${position.x}px, ${position.y}px, 0px) scale(${scale}, ${scale})`;
          }
        }
      }

      visibilityChanged = marker.props.visible !== isVisible;
      marker.props.visible = isVisible;
      marker.props.position2D = isVisible ? position : null;

      if (!marker.is3d()) {
        utils.toggleClass(marker.$el, 'psv-marker--visible', isVisible);
      }

      if (!isVisible) {
        marker.hideTooltip();
      }
      else if (marker.props.staticTooltip) {
        marker.showTooltip();
      }
      else if (marker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.click || (marker === this.prop.hoveringMarker && !marker.isPoly())) {
        marker.refreshTooltip();
      }
      else if (marker !== this.prop.hoveringMarker) {
        marker.hideTooltip();
      }

      if (visibilityChanged) {
        this.trigger(EVENTS.MARKER_VISIBILITY, marker, isVisible);
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
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   * @private
   */
  __updateMarkerSize(marker) {
    marker.$el.classList.add('psv-marker--transparent');

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

    marker.$el.classList.remove('psv-marker--transparent');

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
   * @summary Computes viewer coordinates of a marker
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   * @returns {PSV.Point}
   * @private
   */
  __getMarkerPosition(marker) {
    if (marker.isPoly()) {
      return this.psv.dataHelper.sphericalCoordsToViewerCoords(marker.props.position);
    }
    else {
      const position = this.psv.dataHelper.vector3ToViewerCoords(marker.props.positions3D[0]);

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
    const N = new Vector3().crossVectors(P1, P2).normalize();
    const V = new Vector3().crossVectors(N, P1).normalize();
    const X = P1.clone().multiplyScalar(-C.dot(V));
    const Y = V.clone().multiplyScalar(C.dot(P1));
    const H = new Vector3().addVectors(X, Y).normalize();
    const a = new Vector3().crossVectors(H, C);
    return H.applyAxisAngle(a, 0.01).multiplyScalar(CONSTANTS.SPHERE_RADIUS);
  }

  /**
   * @summary Returns the marker associated to an event target
   * @param {EventTarget} target
   * @param {boolean} [closest=false]
   * @returns {PSV.plugins.MarkersPlugin.Marker}
   * @private
   */
  __getTargetMarker(target, closest = false) {
    const target2 = closest ? utils.getClosest(target, '.psv-marker') : target;
    return target2 ? target2[MARKER_DATA] : undefined;
  }

  /**
   * @summary Checks if an event target is in the tooltip
   * @param {EventTarget} target
   * @param {PSV.components.Tooltip} tooltip
   * @returns {boolean}
   * @private
   */
  __targetOnTooltip(target, tooltip) {
    return target && tooltip ? utils.hasParent(target, tooltip.container) : false;
  }

  /**
   * @summary Handles mouse enter events, show the tooltip for non polygon markers
   * @param {MouseEvent} e
   * @param {PSV.plugins.MarkersPlugin.Marker} [marker]
   * @fires PSV.plugins.MarkersPlugin.over-marker
   * @private
   */
  __onMouseEnter(e, marker) {
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
  __onMouseLeave(e, marker) {
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
  __onMouseMove(e, targetMarker) {
    let marker;

    if (targetMarker?.isPoly()) {
      marker = targetMarker;
    }
    // do not hide if we enter the tooltip itself while hovering a polygon
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
    }
    else if (this.prop.hoveringMarker?.isPoly()) {
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
  __onClick(e, data, dblclick) {
    let marker = data.objects.find(o => o.userData[MARKER_DATA])?.userData[MARKER_DATA];

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
        dblclick  : dblclick,
        rightclick: data.rightclick,
      });

      if (this.config.clickEventOnMarker) {
        // add the marker to event data
        data.marker = marker;
      }
      else {
        e.stopPropagation();
      }

      // the marker could have been deleted in an event handler
      if (this.markers[marker.id]) {
        if (marker.config.tooltip.trigger === MARKER_TOOLTIP_TRIGGER.click) {
          if (marker.tooltip) {
            this.hideMarkerTooltip(marker);
          }
          else {
            this.showMarkerTooltip(marker);
          }
        }
        else {
          this.showMarkerPanel(marker.id);
        }
      }
    }
  }

  /**
   * @summary Updates the visiblity of the panel and the buttons
   * @private
   */
  __refreshUi() {
    const nbMarkers = Object.values(this.markers).filter(m => !m.config.hideList).length;
    const markersButton = this.psv.navbar.getButton(MarkersButton.id, false);
    const markersListButton = this.psv.navbar.getButton(MarkersListButton.id, false);

    if (nbMarkers === 0) {
      markersButton?.hide();
      markersListButton?.hide();

      if (this.psv.panel.isVisible(ID_PANEL_MARKERS_LIST)) {
        this.psv.panel.hide();
      }
      else if (this.psv.panel.isVisible(ID_PANEL_MARKER)) {
        this.psv.panel.hide();
      }
    }
    else {
      markersButton?.show();
      markersListButton?.show();

      if (this.psv.panel.isVisible(ID_PANEL_MARKERS_LIST)) {
        this.showMarkersList();
      }
      else if (this.psv.panel.isVisible(ID_PANEL_MARKER)) {
        this.prop.currentMarker ? this.showMarkerPanel(this.prop.currentMarker) : this.psv.panel.hide();
      }
    }
  }

  /**
   * @summary Adds or remove the objects observer if there are 3D markers
   * @private
   */
  __checkObjectsObserver() {
    const has3d = Object.values(this.markers).some(marker => marker.is3d());

    if (!has3d && this.prop.stopObserver) {
      this.prop.stopObserver();
      this.prop.stopObserver = null;
    }
    else if (has3d && !this.prop.stopObserver) {
      this.prop.stopObserver = this.psv.observeObjects(MARKER_DATA, this);
    }
  }

}
