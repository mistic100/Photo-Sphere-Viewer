import { utils } from '../..';
import icon from './pin-list.svg';

/**
 * @summary Available events
 * @enum {string}
 * @memberof PSV.plugins.MarkersPlugin
 * @constant
 */
export const EVENTS = {
  /**
   * @event marker-visibility
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the visibility of a marker changes
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   * @param {boolean} visible
   */
  MARKER_VISIBILITY  : 'marker-visibility',
  /**
   * @event goto-marker-done
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the animation to a marker is done
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   */
  GOTO_MARKER_DONE   : 'goto-marker-done',
  /**
   * @event leave-marker
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the user puts the cursor away from a marker
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   */
  LEAVE_MARKER       : 'leave-marker',
  /**
   * @event over-marker
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the user puts the cursor hover a marker
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   */
  OVER_MARKER        : 'over-marker',
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
  SELECT_MARKER      : 'select-marker',
  /**
   * @event select-marker-list
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when a marker is selected from the side panel
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   */
  SELECT_MARKER_LIST : 'select-marker-list',
  /**
   * @event unselect-marker
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when a marker was selected and the user clicks elsewhere
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   */
  UNSELECT_MARKER    : 'unselect-marker',
  /**
   * @event hide-markers
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the markers are hidden
   */
  HIDE_MARKERS       : 'hide-markers',
  /**
   * @event set-marker
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the list of markers changes
   * @param {PSV.plugins.MarkersPlugin.Marker[]} markers
   */
  SET_MARKERS        : 'set-markers',
  /**
   * @event show-markers
   * @memberof PSV.plugins.MarkersPlugin
   * @summary Triggered when the markers are shown
   */
  SHOW_MARKERS       : 'show-markers',
};

/**
 * @summary Types of tooltip events
 * @memberOf PSV.plugins.MarkersPlugin
 * @enum {string}
 * @constant
 * @private
 */
export const MARKER_TOOLTIP_TRIGGER = {
  click: 'click',
  hover: 'hover',
};

/**
 * @summary Namespace for SVG creation
 * @type {string}
 * @constant
 * @private
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @summary Property name added to marker elements
 * @type {string}
 * @constant
 * @private
 */
export const MARKER_DATA = 'psvMarker';

/**
 * @summary Panel identifier for marker content
 * @type {string}
 * @constant
 * @private
 */
export const ID_PANEL_MARKER = 'marker';

/**
 * @summary Panel identifier for markers list
 * @type {string}
 * @constant
 * @private
 */
export const ID_PANEL_MARKERS_LIST = 'markersList';

const MARKER_DATA_KEY = utils.dasherize(MARKER_DATA);

/**
 * @summary Markers list template
 * @param {PSV.plugins.MarkersPlugin.Marker[]} markers
 * @param {string} title
 * @returns {string}
 * @constant
 * @private
 */
export const MARKERS_LIST_TEMPLATE = (markers, title) => `
<div class="psv-panel-menu psv-panel-menu--stripped">
  <h1 class="psv-panel-menu-title">${icon} ${title}</h1>
  <ul class="psv-panel-menu-list">
    ${markers.map(marker => `
    <li data-${MARKER_DATA_KEY}="${marker.config.id}" class="psv-panel-menu-item" tabindex="0">
      ${marker.type === 'image' ? `<span class="psv-panel-menu-item-icon"><img src="${marker.config.image}"/></span>` : ''}
      <span class="psv-panel-menu-item-label">${marker.getListContent()}</span>
    </li>
    `).join('')}
  </ul>
</div>
`;
