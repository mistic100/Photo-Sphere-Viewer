import type {
    ExtendedPosition,
    PanoData,
    PanoDataProvider,
    Point,
    Position,
    Size,
    SphereCorrection,
} from '@photo-sphere-viewer/core';
import type { MarkerConfig } from '@photo-sphere-viewer/markers-plugin';
import type { MapHotspot } from '@photo-sphere-viewer/map-plugin';

/**
 * Definition of GPS coordinates (longitude, latitude, optional altitude)
 */
export type GpsPosition = [number, number, number?];

/**
 * Style of the arrow in 3D mode
 */
export type VirtualTourArrowStyle = {
    /**
     * @default '#aaaaaa'
     */
    color?: string;
    /**
     * @default '#aa5500'
     */
    hoverColor?: string;
    /**
     * @default '#000000'
     */
    outlineColor?: string;
    /**
     * @default [0.5,2]
     */
    scale?: [number, number];
};

/**
 * Style of the marker in markers mode
 */
export type VirtualTourMarkerStyle = Omit<
    MarkerConfig,
    | 'id'
    | 'position'
    | 'polygon'
    | 'polygonPixels'
    | 'polyline'
    | 'polylinePixels'
    | 'tooltip'
    | 'content'
    | 'listContent'
    | 'hideList'
    | 'visible'
    | 'data'
>;

/**
 * Definition of a link between two nodes
 */
export type VirtualTourLink = Partial<ExtendedPosition> & {
    /**
     * identifier of the target node
     */
    nodeId: string;
    /**
     * override the name of the node (tooltip)
     */
    name?: string;
    /**
     * define the position of the link (manual mode)
     */
    position?: ExtendedPosition;
    /**
     * offset added to the final link position  order to move the marker/arrow 
     * without affecting where the viewer is rotated before going to the next node
     */
    linkOffset?: Partial<Position>;
    /**
     * override the GPS position of the node (GPS mode)
     */
    gps?: [number, number, number?];
    /**
     * override global marker style
     */
    markerStyle?: VirtualTourMarkerStyle;
    /**
     * override global arrow style
     */
    arrowStyle?: VirtualTourArrowStyle;
};

/**
 * Definition of a single node in the tour
 */
export type VirtualTourNode = {
    id: string;
    panorama: any;
    /**
     * short name of the node (links tooltip, gallery)
     */
    name?: string;
    /**
     * caption visible in the navbar
     */
    caption?: string;
    /**
     * description visible in the side panel
     */
    description?: string;
    /**
     * data used for this panorama
     */
    panoData?: PanoData | PanoDataProvider;
    /**
     * sphere correction to apply to this panorama
     */
    sphereCorrection?: SphereCorrection;
    /**
     * links to other nodes
     */
    links?: VirtualTourLink[];
    /**
     * GPS position
     */
    gps?: GpsPosition;
    /**
     * thumbnail for the gallery
     */
    thumbnail?: string;
    /**
     * additional markers to use on this node
     */
    markers?: Array<MarkerConfig & { gps?: GpsPosition }>;
    /**
     * configuration of the hotspot when using the MapPlugin
     */
    map?: Partial<Point> & Omit<MapHotspot, 'id' | 'yaw' | 'distance'>;
};

export type VirtualTourPluginConfig = {
    /**
     * configure data mode
     * @default 'client'
     */
    dataMode?: 'client' | 'server';
    /**
     * configure positioning mode
     * @default 'manual'
     */
    positionMode?: 'manual' | 'gps';
    /**
     * configure rendering mode of links
     * @default '3d'
     */
    renderMode?: '3d' | 'markers';
    /**
     * initial nodes (client mode)
     */
    nodes?: VirtualTourNode[];
    /**
     * function to fetch a node (server mode)
     */
    getNode?: (nodeId: string) => VirtualTourNode | Promise<VirtualTourNode>;
    /**
     * id of the initial node, if not defined the first node will be used
     */
    startNodeId?: string;
    /**
     * preload linked panoramas
     */
    preload?: boolean | ((node: VirtualTourNode, link: VirtualTourLink) => boolean);
    /**
     * speed of rotation when clicking on a link, if 'false' the viewer won't rotate at all
     * @default '20rpm'
     */
    rotateSpeed?: false | string | number;
    /**
     * duration of the transition between nodes
     * @default 1500
     */
    transition?: boolean | number;
    /**
     * if the Compass plugin is enabled, displays the links on the compass
     * @default true
     */
    linksOnCompass?: boolean;
    /**
     * global marker style
     */
    markerStyle?: VirtualTourMarkerStyle;
    /**
     * global arrow style
     */
    arrowStyle?: VirtualTourArrowStyle;
    /**
     * (GPS & Markers mode) vertical offset applied to link markers, to compensate for viewer height
     * @default -0.1
     */
    markerPitchOffset?: number;
    /**
     * (3D mode) arrows vertical position
     * @default 'bottom'
     */
    arrowPosition?: 'top' | 'bottom';
    /**
     * special configuration when using the MapPlugin
     */
    map?: {
        /**
         * URL of the map
         */
        imageUrl: string;
        /**
         * size of the map in pixels
         */
        size?: Size;
        /**
         * bounds of the map in GPS coordinates (minX, minY, maxX, maxY)
         */
        extent?: [number, number, number, number];
    };
};
