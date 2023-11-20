import { ExtendedPosition } from '@photo-sphere-viewer/core';

export type CompassHotspot = ExtendedPosition & {
    /**
     * override the global "hotspotColor"
     */
    color?: string;
};

export type CompassPluginConfig = {
    /**
     * size of the compass
     * @default '120px'
     */
    size?: string;

    /**
     * position of the compass
     * @default 'top left'
     */
    position?: string | [string, string];

    /**
     * SVG used as background of the compass
     */
    backgroundSvg?: string;

    /**
     * color of the cone of the compass
     * @default 'rgba(255, 255, 255, 0.5)'
     */
    coneColor?: string;

    /**
     * allows to click on the compass to rotate the viewer
     * @default true
     */
    navigation?: boolean;

    /**
     * color of the navigation cone
     * @default 'rgba(255, 0, 0, 0.2)'
     */
    navigationColor?: string;

    /**
     * small dots visible on the compass (will contain every marker with the "compass" data)
     */
    hotspots?: CompassHotspot[];

    /**
     * default color of hotspots
     * @default 'rgba(0, 0, 0, 0.5)'
     */
    hotspotColor?: string;

    /**
     * CSS class(es) added to the compass element.
     */
    className?: string;
};

export type ParsedCompassPluginConfig = Omit<CompassPluginConfig, 'position'> & {
    position: [string, string];
};

export type UpdatableCompassPluginConfig = Omit<CompassPluginConfig, 'navigation'>;
