import type { ExtendedPosition, Point, Position, Size } from '@photo-sphere-viewer/core';
import { ColorRepresentation } from 'three';
import type { Marker } from './markers/Marker';

/**
 * Custom Web Component interface for `element` markers
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MarkerElement extends HTMLElement {
    updateMarker?(params: {
        marker: Marker;
        position: Point;
        viewerPosition: Position;
        zoomLevel: number;
        viewerSize: Size;
    }): void;
}

/**
 * Configuration of a marker
 */
export type MarkerConfig = {
    /**
     * Path to an image
     */
    image?: string;
    /**
     * Path to an image
     */
    imageLayer?: string;
    /**
     * Path to a video
     */
    videoLayer?: string;
    /**
     * HTML content of the marker
     */
    html?: string;
    /**
     * Exiting DOM element
     */
    element?: MarkerElement;
    /**
     * Size of the square
     */
    square?: number;
    /**
     * Size of the rectangle
     */
    rect?: [number, number] | { width: number; height: number };
    /**
     * Radius of the circle
     */
    circle?: number;
    /**
     * Radiuses of the ellipse
     */
    ellipse?: [number, number] | { rx: number; ry: number };
    /**
     * Definition of the path
     */
    path?: string;
    /**
     * Array of points defining the polygon in spherical coordinates
     */
    // eslint-disable-next-line @typescript-eslint/array-type
    polygon?: [number, number][] | [string, string][] | number[] | string[];
    /**
     * Array of points defining the polygon in pixel coordinates on the panorama image
     */
    // eslint-disable-next-line @typescript-eslint/array-type
    polygonPixels?: [number, number][] | number[];
    /**
     * Array of points defining the polyline in spherical coordinates
     */
    // eslint-disable-next-line @typescript-eslint/array-type
    polyline?: [number, number][] | [string, string][] | number[] | string[];
    /**
     * Array of points defining the polyline in pixel coordinates on the panorama image
     */
    // eslint-disable-next-line @typescript-eslint/array-type
    polylinePixels?: [number, number][] | number[];

    /**
     * Unique identifier of the marker
     */
    id: string;
    /**
     * Position of the marker (required but for `polygon` and `polyline`)
     * The array form is used for `imageLayer` and `videoLayer`
     */
    position?: ExtendedPosition | [ExtendedPosition, ExtendedPosition, ExtendedPosition, ExtendedPosition];
    /**
     * Size of the marker (required for `image`, recommended for `html`, ignored for others)
     */
    size?: Size;
    /**
     * Rotation applied to the marker (ignored for `polygon` and `polyline`)
     */
    rotation?: string | number;
    /**
     * Applies a perspective on the image to make it look like placed on the floor or on a wall (only for `imageLayer`)
     */
    orientation?: 'front' | 'horizontal' | 'vertical-left' | 'vertical-right';
    /**
     * Configures the scale of the marker depending on the zoom level and/or the horizontal offset (ignored for `polygon`, `polyline`, `imageLayer`, `videoLayer`)
     */
    scale?:
        | [number, number]
        | { zoom?: [number, number]; yaw?: [number, number] }
        | ((zoomLevel: number, position: Position) => number);
    /**
     * Overrides the global `defaultHoverScale`
     * @default null
     */
    hoverScale?: boolean | number | { amount?: number; duration?: number; easing?: string };
    /**
     * Opacity of the marker
     * @default 1
     */
    opacity?: number;
    /**
     * Drawing order
     * @default 1
     */
    zIndex?: number;
    /**
     * CSS class(es) added to the marker element (ignored for `imageLayer`, `videoLayer`)
     */
    className?: string;
    /**
     * CSS properties to set on the marker (background, border, etc.) (ignored for `imagerLayer`, `videoLayer`)
     */
    style?: Record<string, string>;
    /**
     * SVG properties to set on the marker (fill, stroke, etc.) (only for SVG markers)
     */
    svgStyle?: Record<string, string>;
    /**
     * Will make a color of the image/video transparent (only for `imagerLayer`, `videoLayer`)
     */
    chromaKey?: {
        /** @default false */
        enabled: boolean;
        /** @default 0x00ff00 */
        color?: ColorRepresentation | { r: number; g: number; b: number };
        /** @default 0.2 */
        similarity?: number;
        /** @default 0.2 */
        smoothness?: number;
    };
    /**
     * Defines where the marker is placed toward its defined position
     * @default 'center center'
     */
    anchor?: string;
    /**
     * The zoom level which will be applied when calling `gotoMarker()` method or when clicking on the marker in the list
     * @default `current zoom level`
     */
    zoomLvl?: number;
    /**
     * Initial visibility of the marker
     * @default true
     */
    visible?: boolean;
    /**
     * Configuration of the marker tooltip
     * @default `{content: null, position: 'top center', className: null, trigger: 'hover'}`
     */
    tooltip?: string | { content: string; position?: string; className?: string; trigger?: 'hover' | 'click' };
    /**
     * HTML content that will be displayed on the side panel when the marker is clicked
     */
    content?: string;
    /**
     * The name that appears in the list of markers
     * @default `tooltip.content`
     */
    listContent?: string;
    /**
     * Hide the marker in the markers list
     * @default false
     */
    hideList?: boolean;
    /**
     * Autoplay of `videoLayer` markers
     * @default true
     */
    autoplay?: boolean;
    /**
     * Any custom data you want to attach to the marker
     */
    data?: any;
};

export type ParsedMarkerConfig = Omit<MarkerConfig, 'rotation' | 'scale' | 'tooltip' | 'hoverScale'> & {
    rotation?: number;
    scale?:
        | { zoom?: [number, number]; yaw?: [number, number] }
        | ((zoomLevel: number, position: Position) => number);
    tooltip?: { content: string; position?: string; className?: string; trigger?: 'hover' | 'click' };
    hoverScale?: { amount: number; duration: number; easing: string };
};

export type MarkersPluginConfig = {
    /**
     * If a `click` event is triggered on the viewer additionally to the `select-marker` event
     * @default false
     */
    clickEventOnMarker?: boolean;
    /**
     * initial markers
     */
    markers?: MarkerConfig[];
    /**
     * Default animation speed for {@link MarkersPlugin#gotoMarker}
     * @default '8rpm'
     */
    gotoMarkerSpeed?: string | number;
    /**
     * Default mouse hover scaling parameters applied to all markers
     * (`true` = `{ amount: 2, duration: 100, easing: 'linear' }`)
     * @default null
     */
    defaultHoverScale?: boolean | number | { amount?: number; duration?: number; easing?: string };
};

export type ParsedMarkersPluginConfig = Omit<MarkersPluginConfig, 'defaultHoverScale'> & {
    defaultHoverScale?: { amount: number; duration: number; easing: string };
};

export type UpdatableMarkersPluginConfig = Omit<MarkersPluginConfig, 'markers'>;
