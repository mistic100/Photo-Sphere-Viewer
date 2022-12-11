import { AbstractPlugin, ExtendedPosition, utils, Viewer } from '../..';
import { Event } from 'uevent';

export type MarkerType =
  'image'
  | 'imageLayer'
  | 'html'
  | 'square'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'path'
  | 'polygonPx'
  | 'polygonRad'
  | 'polylinePx'
  | 'polylineRad';

/**
 * @summary Marker properties
 */
export type MarkerProperties = Partial<ExtendedPosition> & {
  image?: string;
  imageLayer?: string;
  html?: string;
  square?: number;
  rect?: [number, number] | { width: number, height: number };
  circle?: number;
  ellipse?: [number, number] | { cx: number, cy: number };
  path?: string;
  polygonPx?: [number, number][];
  polygonRad?: [number, number][];
  polylinePx?: [number, number][];
  polylineRad?: [number, number][];

  id: string;
  width?: number;
  height?: number;
  orientation?: 'front' | 'horizontal' | 'vertical-left' | 'vertical-right';
  scale?: [number, number] | { zoom?: [number, number], longitude?: [number, number] };
  opacity?: number;
  className?: string;
  style?: Record<string, string>;
  svgStyle?: Record<string, string>;
  anchor?: string;
  zoomLvl?: number;
  visible?: boolean;
  tooltip?: string | { content: string, position?: string, className?: string, trigger?: 'hover' | 'click' };
  content?: string;
  listContent?: string;
  hideList?: boolean;
  data?: any;
};

/**
 * @summary Data of the `select-marker` event
 */
export type SelectMarkerData = {
  dblclick: boolean;
  rightclick: boolean;
};

export type MarkersPluginOptions = {
  clickEventOnMarker?: boolean;
  gotoMarkerSpeed?: string | number;
  markers?: MarkerProperties[];
};

/**
 * @summary Object representing a marker
 */
export class Marker {

  private constructor();

  readonly id: string;
  readonly type: MarkerType;
  readonly visible: boolean;
  readonly config: MarkerProperties;
  readonly data?: any;

  /**
   * @summary Checks if it is a 3D marker (imageLayer)
   */
  is3d(): boolean;

  /**
   * @summary Checks if it is a normal marker (image or html)
   */
  isNormal(): boolean;

  /**
   * @summary Checks if it is a polygon/polyline marker
   */
  isPoly(): boolean;

  /**
   * @summary Checks if it is a polygon/polyline using pixel coordinates
   */
  isPolyPx(): boolean;

  /**
   * @summary Checks if it is a polygon/polyline using radian coordinates
   */
  isPolyRad(): boolean;

  /**
   * @summary Checks if it is a polygon marker
   */
  isPolygon(): boolean;

  /**
   * @summary Checks if it is a polyline marker
   */
  isPolyline(): boolean;

  /**
   * @summary Checks if it is an SVG marker
   */
  isSvg(): boolean;

}

export const EVENTS: {
  MARKER_VISIBILITY  : 'marker-visibility',
  GOTO_MARKER_DONE: 'goto-marker-done',
  LEAVE_MARKER: 'leave-marker',
  OVER_MARKER: 'over-marker',
  RENDER_MARKERS_LIST: 'render-markers-list',
  SELECT_MARKER: 'select-marker',
  SELECT_MARKER_LIST: 'select-marker-list',
  UNSELECT_MARKER: 'unselect-marker',
  HIDE_MARKERS: 'hide-markers',
  SET_MARKERS: 'set-markers',
  SHOW_MARKERS: 'show-markers',
};

/**
 * @summary Displays various markers on the viewer
 */
export class MarkersPlugin extends AbstractPlugin {

  static EVENTS: typeof EVENTS;

  constructor(psv: Viewer, options: MarkersPluginOptions);

  /**
   * @summary Toggles the visibility of all tooltips
   */
  toggleAllTooltips();

  /**
   * @summary Displays all tooltips
   */
  showAllTooltips();

  /**
   * @summary Hides all tooltips
   */
  hideAllTooltips();

  /**
   * @summary Returns the total number of markers
   * @returns {number}
   */
  getNbMarkers(): number;

  /**
   * @summary Returns all the markers
   */
  getMarkers(): Marker[];

  /**
   * @summary Adds a new marker to viewer
   * @throws {PSVError} when the marker's id is missing or already exists
   */
  addMarker(properties: MarkerProperties, render?: boolean): Marker;

  /**
   * @summary Returns the internal marker object for a marker id
   * @throws {PSVError} when the marker cannot be found
   */
  getMarker(markerId: string): Marker;

  /**
   * @summary Returns the last marker selected by the user
   */
  getCurrentMarker(): Marker;

  /**
   * @summary Updates the existing marker with the same id
   * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
   */
  updateMarker(properties: MarkerProperties, render?: boolean): Marker;

  /**
   * @summary Removes a marker from the viewer
   */
  removeMarker(markerId: string, render?: boolean);

  /**
   * @summary Removes multiple markers
   */
  removeMarkers(markerIds, render?: boolean);

  /**
   * @summary Replaces all markers
   */
  setMarkers(markers: MarkerProperties[], render?: boolean);

  /**
   * @summary Removes all markers
   */
  clearMarkers(render?: boolean);

  /**
   * @summary Rotate the view to face the marker
   */
  gotoMarker(markerId: string, speed: string | number): utils.Animation<any>;

  /**
   * @summary Hides a marker
   */
  hideMarker(markerId: string);

  /**
   * @summary Shows a marker
   */
  showMarker(markerId: string);

  /**
   * @summary Toggles a marker
   */
  toggleMarker(markerId: string);

  /**
   * @summary Forces the display of the tooltip
   */
  showMarkerTooltip(markerId: string);

  /**
   * @summary Hides the tooltip
   */
  hideMarkerTooltip(markerId: string);

  /**
   * @summary Opens the panel with the content of the marker
   */
  showMarkerPanel(markerId: string);

  /**
   * @summary Toggles the visibility of the list of markers
   */
  toggleMarkersList();

  /**
   * @summary Opens side panel with the list of markers
   */
  showMarkersList();

  /**
   * @summary Closes side panel if it contains the list of markers
   */
  hideMarkersList();

  /**
   * @summary Updates the visibility and the position of all markers
   */
  renderMarkers();

  /**
   * @summary Triggered when the visibility of a marker changes
   */
  on(e: 'marker-visibility', cb: (e: Event, marker: Marker, visible: boolean) => void): this;

  /**
   * @summary Triggered when the animation to a marker is done
   */
  on(e: 'goto-marker-done', cb: (e: Event, marker: Marker) => void): this;

  /**
   * @summary Triggered when the user puts the cursor away from a marker
   */
  on(e: 'leave-marker', cb: (e: Event, marker: Marker) => void): this;

  /**
   * @summary Triggered when the user puts the cursor hover a marker
   */
  on(e: 'over-marker', cb: (e: Event, marker: Marker) => void): this;

  /**
   * @summary Used to alter the list of markers displayed on the side-panel
   */
  on(e: 'render-markers-list', cb: (e: Event, markers: Marker[]) => Marker[]): this;

  /**
   * @summary Triggered when the user clicks on a marker. The marker can be retrieved from outside the event handler
   * with {@link MarkersPlugin.getCurrentMarker}
   */
  on(e: 'select-marker', cb: (e: Event, marker: Marker, data: SelectMarkerData) => void): this;

  /**
   * @summary Triggered when a marker is selected from the side panel
   */
  on(e: 'select-marker-list', cb: (e: Event, marker: Marker) => void): this;

  /**
   * @summary Triggered when a marker was selected and the user clicks elsewhere
   */
  on(e: 'unselect-marker', cb: (e: Event, marker: Marker) => void): this;

  /**
   * @summary Triggered when the markers are hidden
   */
  on(e: 'hide-markers', cb: (e: Event) => void): this;

  /**
   * @summary Triggered when the markers are shown
   */
  on(e: 'show-markers', cb: (e: Event) => void): this;

}
