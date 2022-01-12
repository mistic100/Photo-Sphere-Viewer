import { Event } from 'uevent';
import { AbstractPlugin, Viewer, ViewerOptions } from '../..';
import { Marker, MarkerProperties } from '../markers';

/**
 * @summary Definition of a single node in the tour
 */
export type VirtualTourNode = {
  id: string;
  panorama: any;
  links?: VirtualTourNodeLink[];
  position?: [number, number, number?];
  panoData?: ViewerOptions['panoData'];
  sphereCorrection?: ViewerOptions['sphereCorrection'];
  name?: string;
  caption?: string;
  markers?: Marker[];
};

/**
 * @summary Definition of a link between two nodes
 */
export type VirtualTourNodeLink = {
  nodeId: string;
  name?: string;
  position?: [number, number, number?];
  markerStyle?: MarkerProperties;
  arrowStyle?: VirtualTourArrowStyle;
};

/**
 * @summary Style of the arrow in 3D mode
 */
export type VirtualTourArrowStyle = {
  color?: string;
  hoverColor?: string;
  opacity?: number;
  scale?: [number, number];
};

export type VirtualTourPluginPluginOptions = {
  dataMode?: 'client' | 'server';
  positionMode?: 'manual' | 'gps';
  renderMode?: '3d' | 'markers';
  nodes?: VirtualTourNode[];
  getNode?: (nodeId: string) => VirtualTourNode | Promise<VirtualTourNode>;
  getLinks?: (nodeId: string) => VirtualTourNodeLink[] | Promise<VirtualTourNodeLink[]>;
  startNodeId?: string;
  preload?: boolean | ((node: VirtualTourNode, link: VirtualTourNodeLink) => boolean);
  markerStyle?: MarkerProperties;
  arrowStyle?: VirtualTourArrowStyle;
  markerLatOffset?: number;
  arrowPosition?: 'top' | 'bottom';
}

export const EVENTS: {
  NODE_CHANGED: 'node-changed',
  RENDER_NODES_LIST: 'render-nodes-list',
};

/**
 * @summary Replaces the standard autorotate animation by a smooth transition between multiple points
 */
export class VirtualTourPlugin extends AbstractPlugin {

  constructor(psv: Viewer, options: VirtualTourPluginPluginOptions);

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
   * @summary Toggles the visibility of the list of nodes
   */
  toggleNodesList();

  /**
   * @summary Opens side panel with the list of nodes
   */
  showNodesList();

  /**
   * @summary Closes side panel if it contains the list of nodes
   */
  hideNodesList();

  /**
   * @summary Triggered when the current node changes
   */
  on(e: 'node-changed', cb: (e: Event, node: Node) => void): this;

  /**
   * @summary Used to alter the list of nodes displayed on the side-panel
   */
  on(e: 'render-nodes-list', cb: (e: Event, nodes: Node[]) => Node[]): this;

}
