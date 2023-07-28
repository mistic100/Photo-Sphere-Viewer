import { Point } from '@photo-sphere-viewer/core';

export type MapHotspot = (Point | { yaw: number | string; distance: number }) & {
    /**
     * Unique identifier for the {@link SelectHotspot} event
     */
    id?: string;
    /**
     * Tooltip visible on the map
     */
    tooltip?: string | { content: string; className?: string; };
    /**
     * Override the default `spotSize`
     */
    size?: number;
    /**
     * Override the default `spotColor`
     */
    color?: string;
    /**
     * Override the default `spotImage`
     */
    image?: string;
};

export type MapPluginConfig = {
    /**
     * URL of the map
     */
    imageUrl?: string;

    /**
     * The position of the panorama on the map
     */
    center?: Point;

    /**
     * Rotation to apply to the image
     * @default 0
     */
    rotation?: string | number;

    /**
     * Size of the map
     * @default '200px'
     */
    size?: string;

    /**
     * Position of the map
     * @default 'bottom left'
     */
    position?: string | [string, string];

    /**
     * Displays the map when loading the first panorama
     * @default true
     */
    visibleOnLoad?: boolean;

    /**
     * SVG or image URL drawn on top of the map (must be square)
     */
    overlayImage?: string;

    /**
     * @deprecated Use `overlayImage` instead
     */
    compassImage?: string;

    /**
     * SVG or image URL used for the central pin (must be square)
     */
    pinImage?: string;

    /**
     * Size of the central pin
     * @default 35
     */
    pinSize?: number;

    /**
     * Color of the hotspots when no image is provided
     * @default 'white'
     */
    spotColor?: string;

    /**
     * SVG or image URL used for hotspots
     */
    spotImage?: string;

    /**
     * Size of the hotspots
     * @default 15
     */
    spotSize?: number;

    /**
     * Make the map static and rotate the pin instead
     * @default false
     */
    static?: boolean;

    /**
     * Default zoom level
     * @default 100
     */
    defaultZoom?: number;

    /**
     * Minimum zoom level
     * @default 20
     */
    minZoom?: number;

    /**
     * Maximum zoom level
     * @default 200
     */
    maxZoom?: number;

    /**
     * Points of interest on the map
     */
    hotspots?: MapHotspot[];
};

export type ParsedMapPluginConfig = Omit<MapPluginConfig, 'position' | 'rotation'> & {
    position: [string, string];
    rotation: number;
};

export type UpdatableMapPluginConfig = Omit<
    MapPluginConfig,
    | 'imageUrl'
    | 'center' 
    | 'visibleOnLoad' 
    | 'defaultZoom' 
    | 'hotspots'
>;
