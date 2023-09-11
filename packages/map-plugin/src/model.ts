import { Point } from '@photo-sphere-viewer/core';

export type MapHotspotStyle = {
    /**
     * Size of the hotspot
     * @default 15
     */
    size?: number;
    /**
     * SVG or image URL used for hotspot
     */
    image?: string;
    /**
     * Color of the hotspot when no image is provided
     * @default 'white'
     */
    color?: string;
    /**
     * Size on mouse hover
     * @default null
     */
    hoverSize?: number;
    /**
     * SVG or image URL on mouse hover
     * @default null
     */
    hoverImage?: string;
    /**
     * Color on mouse hover
     * @default null
     */
    hoverColor?: string;
    /**
     * Size of the border shown on mouse hover
     * @default 4
     */
    hoverBorderSize?: number;
    /**
     * Color of the border shown on mouse hover
     * @default 'rgba(255, 255, 255, 0.6)'
     */
    hoverBorderColor?: string;
};

export type MapHotspot = (Point | { yaw: number | string; distance: number }) & MapHotspotStyle & {
    /**
     * Unique identifier for the {@link SelectHotspot} event
     */
    id?: string;

    /**
     * Tooltip visible on the map
     */
    tooltip?: string | { content: string; className?: string };
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
     * Color of the cone of the compass
     * @default '#1E78E6'
     */
    coneColor?: string;

    /**
     * Size of the cone of the compass
     * @default 40
     */
    coneSize?: number;

    /**
     * @deprecated use `spotStyle.color`
     */
    spotColor?: string;

    /**
     * @deprecated use `spotStyle.image`
     */
    spotImage?: string;

    /**
     * @deprecated use `spotStyle.size`
     */
    spotSize?: number;

    /**
     * Default style of hotspots
     */
    spotStyle?: MapHotspotStyle;

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

    /**
     * Configuration of map buttons
     */
    buttons?: {
        /** @default true */
        maximize?: boolean;
        /** @default true */
        close?: boolean;
        /** @default true */
        reset?: boolean;
        /** @default true */
        north?: boolean;
    };
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
    | 'buttons'
>;
