import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from 'photo-sphere-viewer';
import * as THREE from 'three';
import { Marker } from './Marker';
import { MarkersButton } from './MarkersButton';
import { MarkersListButton } from './MarkersListButton';
import icon from './pin-list.svg';
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
DEFAULTS.navbar.splice(DEFAULTS.navbar.indexOf('caption'), 0, MarkersButton.id, MarkersListButton.id);
DEFAULTS.lang[MarkersButton.id] = 'Markers';
DEFAULTS.lang[MarkersListButton.id] = 'Markers list';
registerButton(MarkersButton);
registerButton(MarkersListButton);


/**
 * @summary Displays various markers on the viewer
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class MarkersPlugin extends AbstractPlugin {

  static id = 'markers';

  /**
   * @summary Available events
   * @enum {string}
   * @constant
   */
  static EVENTS = {
    GOTO_MARKER_DONE   : 'goto-marker-done',
    LEAVE_MARKER       : 'leave-marker',
    OVER_MARKER        : 'over-marker',
    RENDER_MARKERS_LIST: 'render-markers-list',
    SELECT_MARKER      : 'select-marker',
    SELECT_MARKER_LIST : 'select-marker-list',
    UNSELECT_MARKER    : 'unselect-marker',
    HIDE_MARKERS       : 'hide-markers',
    SHOW_MARKERS       : 'show-markers',
  };

  /**
   * @summary Namespace for SVG creation
   * @type {string}
   * @constant
   */
  static SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * @summary Property name added to marker elements
   * @type {string}
   * @constant
   */
  static MARKER_DATA = 'psvMarker';

  /**
   * @summary Panel identifier for marker content
   * @type {string}
   * @constant
   */
  static ID_PANEL_MARKER = 'marker';

  /**
   * @summary Panel identifier for markers list
   * @type {string}
   * @constant
   */
  static ID_PANEL_MARKERS_LIST = 'markersList';

  /**
   * @summary Markers list template
   * @param {PSV.Marker[]} markers
   * @param {string} title
   * @param {string} dataKey
   * @returns {string}
   */
  static MARKERS_LIST_TEMPLATE = (markers, title, dataKey) => `
<div class="psv-markers-list-container">
  <h1 class="psv-markers-list-title">${icon} ${title}</h1>
  <ul class="psv-markers-list">
    ${markers.map(marker => `
    <li data-${dataKey}="${marker.config.id}" class="psv-markers-list-item ${marker.config.className || ''}">
      ${marker.type === 'image' ? `<img class="psv-markers-list-image" src="${marker.config.image}"/>` : ''}
      <p class="psv-markers-list-name">${marker.getListContent()}</p>
    </li>
    `).join('')}
  </ul>
</div>
`;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.MarkersPlugin.Options} [options]
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {HTMLElement}
     * @readonly
     */
    this.container = document.createElement('div');
    this.container.className = 'psv-markers';
    this.container.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
    this.psv.container.appendChild(this.container);

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
    };

    /**
     * @type {PSV.plugins.MarkersPlugin.Options}
     */
    this.config = {
      clickEventOnMarker: false,
      ...options,
    };

    /**
     * @member {SVGElement}
     * @readonly
     */
    this.svgContainer = document.createElementNS(MarkersPlugin.SVG_NS, 'svg');
    this.svgContainer.setAttribute('class', 'psv-markers-svg-container');
    this.container.appendChild(this.svgContainer);

    // Markers events via delegation
    this.container.addEventListener('mouseenter', this, true);
    this.container.addEventListener('mouseleave', this, true);
    this.container.addEventListener('mousemove', this, true);
    this.container.addEventListener('contextmenu', this);

    // Viewer events
    this.psv.on(CONSTANTS.EVENTS.CLICK, this);
    this.psv.on(CONSTANTS.EVENTS.DOUBLE_CLICK, this);
    this.psv.on(CONSTANTS.EVENTS.RENDER, this);
    this.psv.on(CONSTANTS.EVENTS.CONFIG_CHANGED, this);

    if (options?.markers) {
      this.psv.once(CONSTANTS.EVENTS.READY, () => {
        this.setMarkers(options.markers);
      });
    }
  }

  /**
   * @package
   */
  destroy() {
    this.clearMarkers(false);

    this.container.removeEventListener('mouseenter', this);
    this.container.removeEventListener('mouseleave', this);
    this.container.removeEventListener('mousemove', this);
    this.container.removeEventListener('contextmenu', this);

    this.psv.off(CONSTANTS.EVENTS.CLICK, this);
    this.psv.off(CONSTANTS.EVENTS.DOUBLE_CLICK, this);
    this.psv.off(CONSTANTS.EVENTS.RENDER, this);
    this.psv.off(CONSTANTS.EVENTS.CONFIG_CHANGED, this);

    this.psv.container.removeChild(this.container);

    delete this.svgContainer;
    delete this.markers;
    delete this.container;
    delete this.prop;

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
      case 'mouseenter':  this.__onMouseEnter(e);  break;
      case 'mouseleave':  this.__onMouseLeave(e);  break;
      case 'mousemove':   this.__onMouseMove(e);   break;
      case 'contextmenu': this.__onContextMenu(e); break;
      case CONSTANTS.EVENTS.CLICK:        this.__onClick(e, e.args[0], false); break;
      case CONSTANTS.EVENTS.DOUBLE_CLICK: this.__onClick(e, e.args[0], true);  break;
      case CONSTANTS.EVENTS.RENDER:       this.renderMarkers();                        break;
      case CONSTANTS.EVENTS.CONFIG_CHANGED:
        this.container.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
        break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @fires PSV.plugins.MarkersPlugin.show-markers
   */
  show() {
    this.prop.visible = true;

    this.renderMarkers();

    /**
     * @event show-markers
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the markers are shown
     */
    this.trigger(MarkersPlugin.EVENTS.SHOW_MARKERS);
  }

  /**
   * @override
   * @fires PSV.plugins.MarkersPlugin.hide-markers
   */
  hide() {
    this.prop.visible = false;

    this.renderMarkers();

    /**
     * @event hide-markers
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Triggered when the markers are hidden
     */
    this.trigger(MarkersPlugin.EVENTS.HIDE_MARKERS);
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
    else {
      this.svgContainer.appendChild(marker.$el);
    }

    this.markers[marker.id] = marker;

    if (render) {
      this.renderMarkers();
      this.__refreshUi();
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
      this.__refreshUi();
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
        /**
         * @event goto-marker-done
         * @memberof PSV.plugins.MarkersPlugin
         * @summary Triggered when the animation to a marker is done
         * @param {PSV.plugins.MarkersPlugin.Marker} marker
         */
        this.trigger(MarkersPlugin.EVENTS.GOTO_MARKER_DONE, marker);
      });
  }

  /**
   * @summary Hides a marker
   * @param {string} markerId
   */
  hideMarker(markerId) {
    this.getMarker(markerId).visible = false;
    this.renderMarkers();
  }

  /**
   * @summary Shows a marker
   * @param {string} markerId
   */
  showMarker(markerId) {
    this.getMarker(markerId).visible = true;
    this.renderMarkers();
  }

  /**
   * @summary Toggles a marker
   * @param {string} markerId
   */
  toggleMarker(markerId) {
    this.getMarker(markerId).visible ^= true;
    this.renderMarkers();
  }

  /**
   * @summary Toggles the visibility of markers list
   */
  toggleMarkersList() {
    if (this.psv.panel.prop.contentId === MarkersPlugin.ID_PANEL_MARKERS_LIST) {
      this.hideMarkersList();
    }
    else {
      this.showMarkersList();
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
        id     : MarkersPlugin.ID_PANEL_MARKER,
        content: marker.config.content,
      });
    }
    else {
      this.psv.panel.hide(MarkersPlugin.ID_PANEL_MARKER);
    }
  }

  /**
   * @summary Opens side panel with list of markers
   * @fires PSV.plugins.MarkersPlugin.filter:render-markers-list
   */
  showMarkersList() {
    let markers = [];
    utils.each(this.markers, (marker) => {
      if (marker.visible && !marker.config.hideList) {
        markers.push(marker);
      }
    });

    /**
     * @event filter:render-markers-list
     * @memberof PSV.plugins.MarkersPlugin
     * @summary Used to alter the list of markers displayed on the side-panel
     * @param {PSV.plugins.MarkersPlugin.Marker[]} markers
     * @returns {PSV.plugins.MarkersPlugin.Marker[]}
     */
    markers = this.change(MarkersPlugin.EVENTS.RENDER_MARKERS_LIST, markers);

    this.psv.panel.show({
      id          : MarkersPlugin.ID_PANEL_MARKERS_LIST,
      content     : MarkersPlugin.MARKERS_LIST_TEMPLATE(
        markers,
        this.psv.config.lang.markers,
        utils.dasherize(MarkersPlugin.MARKER_DATA)
      ),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const markerId = li ? li.dataset[MarkersPlugin.MARKER_DATA] : undefined;

        if (markerId) {
          const marker = this.getMarker(markerId);

          /**
           * @event select-marker-list
           * @memberof PSV.plugins.MarkersPlugin
           * @summary Triggered when a marker is selected from the side panel
           * @param {PSV.plugins.MarkersPlugin.Marker} marker
           */
          this.trigger(MarkersPlugin.EVENTS.SELECT_MARKER_LIST, marker);

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
    this.psv.panel.hide(MarkersPlugin.ID_PANEL_MARKERS_LIST);
  }

  /**
   * @summary Updates the visibility and the position of all markers
   */
  renderMarkers() {
    utils.each(this.markers, (marker) => {
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

            marker.$el.setAttributeNS(null, 'transform', transform);
          }
          else {
            let transform = `translate3D(${position.x}px, ${position.y}px, 0px)`;
            if (scale !== 1) {
              transform += ` scale(${scale}, ${scale})`;
            }

            marker.$el.style.transform = transform;
          }
        }
      }

      marker.props.inViewport = isVisible;
      utils.toggleClass(marker.$el, 'psv-marker--visible', isVisible);

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
    utils.addClasses(marker.$el, 'psv-marker--transparent');

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

    utils.removeClasses(marker.$el, 'psv-marker--transparent');

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
   * @param {number} [scale=1]
   * @returns {PSV.Point}
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
    const N = new THREE.Vector3().crossVectors(P1, P2).normalize();
    const V = new THREE.Vector3().crossVectors(N, P1).normalize();
    const X = P1.clone().multiplyScalar(-C.dot(V));
    const Y = V.clone().multiplyScalar(C.dot(P1));
    const H = new THREE.Vector3().addVectors(X, Y).normalize();
    const a = new THREE.Vector3().crossVectors(H, C);
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
    return target2 ? target2[MarkersPlugin.MARKER_DATA] : undefined;
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
   * @fires PSV.plugins.MarkersPlugin.over-marker
   * @private
   */
  __onMouseEnter(e) {
    const marker = this.__getTargetMarker(e.target);

    if (marker && !marker.isPoly()) {
      this.prop.hoveringMarker = marker;

      /**
       * @event over-marker
       * @memberof PSV.plugins.MarkersPlugin
       * @summary Triggered when the user puts the cursor hover a marker
       * @param {PSV.plugins.MarkersPlugin.Marker} marker
       */
      this.trigger(MarkersPlugin.EVENTS.OVER_MARKER, marker);

      if (!this.prop.showAllTooltips) {
        marker.showTooltip(e);
      }
    }
  }

  /**
   * @summary Handles mouse leave events, hide the tooltip
   * @param {MouseEvent} e
   * @fires PSV.plugins.MarkersPlugin.leave-marker
   * @private
   */
  __onMouseLeave(e) {
    const marker = this.__getTargetMarker(e.target);

    // do not hide if we enter the tooltip itself while hovering a polygon
    if (marker && !(marker.isPoly() && this.__targetOnTooltip(e.relatedTarget, marker.tooltip))) {
      /**
       * @event leave-marker
       * @memberof PSV.plugins.MarkersPlugin
       * @summary Triggered when the user puts the cursor away from a marker
       * @param {PSV.plugins.MarkersPlugin.Marker} marker
       */
      this.trigger(MarkersPlugin.EVENTS.LEAVE_MARKER, marker);

      this.prop.hoveringMarker = null;

      if (!this.prop.showAllTooltips) {
        marker.hideTooltip();
      }
    }
  }

  /**
   * @summary Handles mouse move events, refreshUi the tooltip for polygon markers
   * @param {MouseEvent} e
   * @fires PSV.plugins.MarkersPlugin.leave-marker
   * @fires PSV.plugins.MarkersPlugin.over-marker
   * @private
   */
  __onMouseMove(e) {
    let marker;
    const targetMarker = this.__getTargetMarker(e.target);

    if (targetMarker?.isPoly()) {
      marker = targetMarker;
    }
    // do not hide if we enter the tooltip itself while hovering a polygon
    else if (this.prop.hoveringMarker && this.__targetOnTooltip(e.target, this.prop.hoveringMarker.tooltip)) {
      marker = this.prop.hoveringMarker;
    }

    if (marker) {
      if (!this.prop.hoveringMarker) {
        this.trigger(MarkersPlugin.EVENTS.OVER_MARKER, marker);

        this.prop.hoveringMarker = marker;
      }

      if (!this.prop.showAllTooltips) {
        marker.showTooltip(e);
      }
    }
    else if (this.prop.hoveringMarker?.isPoly()) {
      this.trigger(MarkersPlugin.EVENTS.LEAVE_MARKER, this.prop.hoveringMarker);

      if (!this.prop.showAllTooltips) {
        this.prop.hoveringMarker.hideTooltip();
      }

      this.prop.hoveringMarker = null;
    }
  }

  /**
   * @summary Handles context menu events
   * @param {MouseWheelEvent} evt
   * @private
   */
  __onContextMenu(evt) {
    if (!utils.getClosest(evt.target, '.psv-marker')) {
      return true;
    }

    evt.preventDefault();
    return false;
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
    const marker = this.__getTargetMarker(data.target, true);

    if (marker) {
      this.prop.currentMarker = marker;

      /**
       * @event select-marker
       * @memberof PSV.plugins.MarkersPlugin
       * @summary Triggered when the user clicks on a marker. The marker can be retrieved from outside the event handler
       * with {@link PSV.plugins.MarkersPlugin.getCurrentMarker}
       * @param {PSV.plugins.MarkersPlugin.Marker} marker
       * @param {PSV.plugins.MarkersPlugin.SelectMarkerData} data
       */
      this.trigger(MarkersPlugin.EVENTS.SELECT_MARKER, marker, {
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
        this.showMarkerPanel(marker.id);
      }
    }
    else if (this.prop.currentMarker) {
      /**
       * @event unselect-marker
       * @memberof PSV.plugins.MarkersPlugin
       * @summary Triggered when a marker was selected and the user clicks elsewhere
       * @param {PSV.plugins.MarkersPlugin.Marker} marker
       */
      this.trigger(MarkersPlugin.EVENTS.UNSELECT_MARKER, this.prop.currentMarker);

      this.psv.panel.hide(MarkersPlugin.ID_PANEL_MARKER);

      this.prop.currentMarker = null;
    }
  }

  /**
   * @summary Updates the visiblity of the panel and the buttons
   * @private
   */
  __refreshUi() {
    const nbMarkers = this.getNbMarkers();
    const markersButton = this.psv.navbar.getButton(MarkersButton.id, false);
    const markersListButton = this.psv.navbar.getButton(MarkersListButton.id, false);

    if (nbMarkers === 0) {
      markersButton?.hide();
      markersListButton?.hide();

      if (this.psv.panel.isVisible(MarkersPlugin.ID_PANEL_MARKERS_LIST)) {
        this.psv.panel.hide();
      }
      else if (this.psv.panel.isVisible(MarkersPlugin.ID_PANEL_MARKER)) {
        this.psv.panel.hide();
      }
    }
    else {
      markersButton?.show();
      markersListButton?.show();

      if (this.psv.panel.isVisible(MarkersPlugin.ID_PANEL_MARKERS_LIST)) {
        this.showMarkersList();
      }
      else if (this.psv.panel.isVisible(MarkersPlugin.ID_PANEL_MARKER)) {
        this.prop.currentMarker ? this.showMarkerPanel(this.prop.currentMarker) : this.psv.panel.hide();
      }
    }
  }

}
