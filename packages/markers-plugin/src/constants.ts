import { utils } from '@photo-sphere-viewer/core';
import type { Marker } from './Marker';
import icon from './icons/pin-list.svg';

/**
 * Namespace for SVG creation
 * @internal
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Property name added to marker elements
 * @internal
 */
export const MARKER_DATA = 'psvMarker';

/**
 * Property name added to marker elements (dash-case)
 * @internal
 */
export const MARKER_DATA_KEY = utils.dasherize(MARKER_DATA);

/**
 * Panel identifier for marker content
 * @internal
 */
export const ID_PANEL_MARKER = 'marker';

/**
 * Panel identifier for markers list
 * @internal
 */
export const ID_PANEL_MARKERS_LIST = 'markersList';

/**
 * Default configuration for the "hoverScale" parameters
 * @internal
 */
export const DEFAULT_HOVER_SCALE = {
    amount: 2,
    duration: 100,
    easing: 'linear',
};

/**
 * Markers list template
 * @internal
 */
export const MARKERS_LIST_TEMPLATE = (markers: Marker[], title: string) => `
<div class="psv-panel-menu psv-panel-menu--stripped">
 <h1 class="psv-panel-menu-title">${icon} ${title}</h1>
 <ul class="psv-panel-menu-list">
   ${markers.map((marker) => `
   <li data-${MARKER_DATA_KEY}="${marker.id}" class="psv-panel-menu-item" tabindex="0">
     ${marker.type === 'image' ? `<span class="psv-panel-menu-item-icon"><img src="${marker.definition}"/></span>` : ''}
     <span class="psv-panel-menu-item-label">${marker.getListContent()}</span>
   </li>
   `).join('')}
 </ul>
</div>
`;
