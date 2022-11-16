import { Event } from 'uevent';
import { ViewerOptions, Position, AbstractPlugin, Viewer } from 'photo-sphere-viewer';
import { MarkerProperties } from 'photo-sphere-viewer/dist/plugins/markers';

/**
 * @summary Definition of a single node in the tour
 */
type VirtualTourNode = {
  id: string;
  panorama: any;
  links?: VirtualTourNodeLink[];
  position?: [number, number, number?];
  panoData?: ViewerOptions['panoData'];
  sphereCorrection?: ViewerOptions['sphereCorrection'];
  name?: string;
  caption?: string;
  description?: string;
  markers?: MarkerProperties[];
};

/**
 * @summary Definition of a link between two nodes
 */
type VirtualTourNodeLink = {
  nodeId: string;
  name?: string;
  position?: [number, number, number?];
  markerStyle?: VirtualTourMarkerStyle;
  arrowStyle?: VirtualTourArrowStyle;
};

/**
 * @summary Style of the arrow in 3D mode
 */
type VirtualTourArrowStyle = {
  color?: string;
  hoverColor?: string;
  outlineColor?: number;
  scale?: [number, number];
};

/**
 * @summary Style of the marker in markers mode
 */
type VirtualTourMarkerStyle = Omit<MarkerProperties, 'id' | 'longitude' | 'latitude' | 'polygonPx' | 'polygonRad' | 'polylinePx' | 'polylineRad' | 'tooltip' | 'content' | 'hideList' | 'visible' | 'data'>;

/**
 * @summary Data associated to the "node-changed" event
 */
type VirtualTourNodeChangedData = {
  fromNode?: VirtualTourNode,
  fromLink?: VirtualTourNodeLink,
  fromLinkPosition?: Position,
};

type VirtualTourPluginOptions = {
  dataMode?: 'client' | 'server';
  positionMode?: 'manual' | 'gps';
  renderMode?: '3d' | 'markers';
  nodes?: VirtualTourNode[];
  getNode?: (nodeId: string) => VirtualTourNode | Promise<VirtualTourNode>;
  startNodeId?: string;
  preload?: boolean | ((node: VirtualTourNode, link: VirtualTourNodeLink) => boolean);
  rotateSpeed?: boolean | string | number;
  transition?: boolean | number;
  markerStyle?: VirtualTourMarkerStyle;
  arrowStyle?: VirtualTourArrowStyle;
  markerLatOffset?: number;
  arrowPosition?: 'top' | 'bottom';
};

/**
 * @deprecated Use VirtualTourPluginOptions
 */
type VirtualTourPluginPluginOptions = VirtualTourPluginOptions;

declare const EVENTS: {
  NODE_CHANGED: 'node-changed',
};

declare const MODE_CLIENT = 'client';
declare const MODE_SERVER = 'server';
declare const MODE_MANUAL = 'manual';
declare const MODE_GPS = 'gps';
declare const MODE_MARKERS = 'markers';
declare const MODE_3D = '3d';

/**
 * @summary Create virtual tours by linking multiple panoramas
 */
declare class VirtualTourPlugin extends AbstractPlugin {

  static EVENTS: typeof EVENTS;
  static MODE_CLIENT: typeof MODE_CLIENT;
  static MODE_SERVER: typeof MODE_SERVER;
  static MODE_3D: typeof MODE_3D;
  static MODE_MARKERS: typeof MODE_MARKERS;
  static MODE_MANUAL: typeof MODE_MANUAL;
  static MODE_GPS: typeof MODE_GPS;

  constructor(psv: Viewer, options: VirtualTourPluginOptions);

  /**
   * @summary Sets the nodes (client mode only)
   */
  setNodes(nodes: VirtualTourNode[], startNodeId?: string);

  /**
   * @summary Changes the current node
   * @returns resolves false if the loading was aborted by another call
   */
  setCurrentNode(nodeId: string): Promise<boolean>;

  /**
   * @summary Triggered when the current node changes
   */
  on(e: 'node-changed', cb: (e: Event, nodeId: VirtualTourNode['id'], data: VirtualTourNodeChangedData) => void): this;

  /**
   * @summary Used to alter the list of nodes displayed on the side-panel
   */
  on(e: 'render-nodes-list', cb: (e: Event, nodes: VirtualTourNode[]) => VirtualTourNode[]): this;

}

export { EVENTS, MODE_3D, MODE_CLIENT, MODE_GPS, MODE_MANUAL, MODE_MARKERS, MODE_SERVER, VirtualTourArrowStyle, VirtualTourMarkerStyle, VirtualTourNode, VirtualTourNodeChangedData, VirtualTourNodeLink, VirtualTourPlugin, VirtualTourPluginOptions, VirtualTourPluginPluginOptions };
