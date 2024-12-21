import { Object3D, Texture, WebGLRendererParameters } from 'three';
import { AdapterConstructor } from './adapters/AbstractAdapter';
import { ACTIONS } from './data/constants';
import { PluginConstructor } from './plugins/AbstractPlugin';
import { Viewer } from './Viewer';
import { AnimationOptions } from './utils';

/**
 * A wrapper around a Promise with an initial value before resolution
 */
export type ResolvableBoolean = { initial: boolean; promise: Promise<boolean> };

/**
 * Object defining a point
 */
export type Point = {
    x: number;
    y: number;
};

/**
 * Object defining a size
 */
export type Size = {
    width: number;
    height: number;
};

/**
 * Object defining a size in CSS
 */
export type CssSize = {
    width: string;
    height: string;
};

/**
 * Object defining angular corrections to a sphere
 */
export type SphereCorrection<T = number | string> = {
    pan?: T;
    tilt?: T;
    roll?: T;
};

/**
 * Object defining a spherical position (radians)
 */
export type Position = {
    yaw: number;
    pitch: number;
};

/**
 * Object defining a spherical position (radians or degrees)
 */
export type SphericalPosition = {
    yaw: number | string;
    pitch: number | string;
};

/**
 * Object defining a position on the panorama image (pixels)
 */
export type PanoramaPosition = {
    textureX: number;
    textureY: number;
    textureFace?: string;
};

/**
 * Object defining a spherical or panorama position
 */
export type ExtendedPosition = SphericalPosition | PanoramaPosition;

/**
 * Object defining options for {@link Viewer.animate}
 */
export type AnimateOptions = Partial<ExtendedPosition> & {
    /**
     * Animation speed or duration in milliseconds
     */
    speed: string | number;
    /**
     * New zoom level between 0 and 100
     */
    zoom?: number;
    /**
     * Easing function used for the animation
     * @default 'inOutSine'
     */
    easing?: AnimationOptions<any>['easing'];
};

/**
 * Configuration of an equirectangular panorama
 */
export type EquirectangularPanorama = {
    path: string;
    data?: PanoData | PanoDataProvider;
};

/**
 * Crop information of an equirectangular panorama
 */
export type PanoData = {
    isEquirectangular?: true;
    fullWidth: number;
    fullHeight?: number;
    croppedWidth?: number;
    croppedHeight?: number;
    croppedX: number;
    croppedY: number;
    poseHeading?: number;
    posePitch?: number;
    poseRoll?: number;
    /* @internal */
    initialHeading?: number;
    /* @internal */
    initialPitch?: number;
    /* @internal */
    initialFov?: number;
};

/**
 * Function to compute panorama data once the image is loaded
 */
export type PanoDataProvider = (image: HTMLImageElement, xmpData?: PanoData) => PanoData;

/**
 * Object defining options for {@link Viewer.setPanorama}
 */
export type PanoramaOptions = {
    /**
     * new panorama position
     */
    position?: ExtendedPosition;
    /**
     * new navbar caption
     */
    caption?: string;
    /**
     * new panorama description
     */
    description?: string;
    /**
     * new zoom level between 0 and 100
     */
    zoom?: number;
    /**
     * enable transition (rotation + fading) between old and new panorama
     * @default true
     */
    transition?: boolean | TransitionOptions;
    /**
     * show the loader while loading the new panorama
     * @default true
     */
    showLoader?: boolean;
    /**
     * new sphere correction to apply to the panorama
     */
    sphereCorrection?: SphereCorrection;
    /**
     * new data used for this panorama
     */
    panoData?: PanoData | PanoDataProvider;
};

export type TransitionOptions = {
    /** @default 1500 */
    speed?: string | number;
    /** @default true */
    rotation?: boolean;
    /** @default 'fade' */
    effect?: 'fade' | 'black' | 'white';
};

/**
 * Result of {@link AbstractAdapter.loadTexture}
 */
export type TextureData<TTexture = Texture | Texture[] | Record<string, Texture>, TPanorama = any, TData = any> = {
    /**
     * Actual texture or list of textures
     */
    texture: TTexture;
    /**
     * Original panorama definition
     */
    panorama: TPanorama;
    /**
     * Panorama metadata
     */
    panoData?: TData;
    /**
     * Key used in the loader cache
     */
    cacheKey?: string;
};

/**
 * Data of {@link events.ClickEvent}
 */
export type ClickData = {
    /**
     * if it's a right click
     */
    rightclick: boolean;
    /**
     * position in the browser window
     */
    clientX: number;
    /**
     * position in the browser window
     */
    clientY: number;
    /**
     * position in the viewer
     */
    viewerX: number;
    /**
     * position in the viewer
     */
    viewerY: number;
    /**
     * position in spherical coordinates
     */
    yaw: number;
    /**
     * position in spherical coordinates
     */
    pitch: number;
    /**
     * position on the texture, if applicable
     */
    textureX?: number;
    /**
     * position on the texture, if applicable
     */
    textureY?: number;
    /**
     * position on the texture, if applicable
     */
    textureFace?: string;
    /**
     * Original element which received the click
     */
    target?: HTMLElement;
    /**
     * Original event which triggered the click
     */
    originalEvent?: Event;
    /**
     * List of THREE scenes objects under the mouse
     */
    objects: Object3D[];
    /**
     * clicked Marker
     */
    marker?: any;
};

/**
 * Custom Web Component interface for navbar buttons
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface NavbarButtonElement extends HTMLElement {
    attachViewer?(viewer: Viewer): void;
}

/**
 * Definition of a custom navbar button
 */
export type NavbarCustomButton = {
    /**
     * Unique identifier of the button, usefull when using the {@link Navbar.getButton} method
     */
    id?: string;
    /**
     * Tooltip displayed when the mouse is over the button
     * If can be a key in the global `lang` config
     */
    title?: string;
    /**
     * Content of the button. Preferably a square image or SVG icon
     */
    content: string | NavbarButtonElement;
    /**
     * CSS class added to the button
     */
    className?: string;
    /**
     * Function called when the button is clicked
     */
    onClick?: (viewer: Viewer) => void;
    /**
     * initial state of the button
     * @default false
     */
    disabled?: boolean;
    /**
     * initial visibility of the button
     * @default true
     */
    visible?: boolean;
    /**
     * if the button can be moved to menu when the navbar is too small
     * @default true
     */
    collapsable?: boolean;
    /**
     * if the button is accessible with the keyboard
     * @default true
     */
    tabbable?: boolean;
};

/**
 * Viewer configuration
 * @see https://photo-sphere-viewer.js.org/guide/config.html
 */
export type ViewerConfig = {
    container: HTMLElement | string;
    panorama?: any;
    /** @default equirectangular */
    adapter?: AdapterConstructor | [AdapterConstructor, any];
    plugins?: Array<PluginConstructor | [PluginConstructor, any]>;
    /** @default null */
    caption?: string;
    /** @default null */
    description?: string;
    /** @default null */
    downloadUrl?: string;
    /** @default null */
    downloadName?: string;
    /** @default null */
    loadingImg?: string;
    /** @default 'Loading...' */
    loadingTxt?: string;
    /** @default `container` size */
    size?: CssSize;
    /** @default false */
    fisheye?: boolean | number;
    /** @default 30 */
    minFov?: number;
    /** @default 90 */
    maxFov?: number;
    /** @default 50 */
    defaultZoomLvl?: number;
    /** @default 0 */
    defaultYaw?: number | string;
    /** @default 0 */
    defaultPitch?: number | string;
    /** @default `0,0,0` */
    sphereCorrection?: SphereCorrection;
    /** @default 1 */
    moveSpeed?: number;
    /** @default 1 */
    zoomSpeed?: number;
    /** @default 0.8 */
    moveInertia?: boolean | number;
    /** @default true */
    mousewheel?: boolean;
    /** @default true */
    mousemove?: boolean;
    /** @default false */
    mousewheelCtrlKey?: boolean;
    /** @default false */
    touchmoveTwoFingers?: boolean;
    panoData?: PanoData | PanoDataProvider;
    requestHeaders?: Record<string, string> | ((url: string) => Record<string, string>);
    /** @default '#000' */
    canvasBackground?: string;
    /** @default '{ speed: 1500, rotation: true, effect: "fade" }' */
    defaultTransition?: TransitionOptions;
    /** @default '{ alpha: true, antialias: true }' */
    rendererParameters?: WebGLRendererParameters;
    /** @default false */
    withCredentials?: boolean;
    /** @default 'zoom move download description caption fullscreen' */
    navbar?: boolean | string | Array<string | NavbarCustomButton>;
    lang?: Record<string, string>;
    keyboard?: boolean | 'always' | 'fullscreen';
    keyboardActions?: Record<string, ACTIONS | ((viewer: Viewer, e: KeyboardEvent) => void)>;
};

/**
 * Viewer configuration after applying parsers
 */
export type ParsedViewerConfig = Omit<
    ViewerConfig,
    | 'adapter'
    | 'plugins'
    | 'defaultYaw'
    | 'defaultPitch'
    | 'moveInertia'
    | 'fisheye'
    | 'requestHeaders'
    | 'navbar'
> & {
    adapter?: [AdapterConstructor, any];
    plugins?: Array<[PluginConstructor, any]>;
    defaultYaw?: number;
    defaultPitch?: number;
    moveInertia?: number;
    fisheye?: number;
    requestHeaders?: (url: string) => Record<string, string>;
    navbar?: Array<string | NavbarCustomButton>;
};

/**
 * Readonly viewer configuration
 */
export type ReadonlyViewerConfig =
    | 'panorama'
    | 'panoData'
    | 'container'
    | 'adapter'
    | 'plugins';

/**
 * Updatable viewer configuration
 */
export type UpdatableViewerConfig = Omit<ViewerConfig, ReadonlyViewerConfig>;
