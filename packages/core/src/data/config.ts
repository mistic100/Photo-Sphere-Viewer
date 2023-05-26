import { MathUtils } from 'three';
import { adapterInterop } from '../adapters/AbstractAdapter';
import { EquirectangularAdapter } from '../adapters/EquirectangularAdapter';
import { ParsedViewerConfig, ReadonlyViewerConfig, ViewerConfig } from '../model';
import { pluginInterop } from '../plugins/AbstractPlugin';
import { PSVError } from '../PSVError';
import { clone, ConfigParsers, getConfigParser, logWarn, parseAngle } from '../utils';
import { ACTIONS, KEY_CODES } from './constants';

/**
 * Default options
 */
export const DEFAULTS: Required<ParsedViewerConfig> = {
    panorama: null,
    overlay: null,
    overlayOpacity: 1,
    container: null,
    adapter: [EquirectangularAdapter as any, null],
    plugins: [],
    caption: null,
    description: null,
    downloadUrl: null,
    downloadName: null,
    loadingImg: null,
    loadingTxt: 'Loading...',
    size: null,
    fisheye: 0,
    minFov: 30,
    maxFov: 90,
    defaultZoomLvl: 50,
    defaultYaw: 0,
    defaultPitch: 0,
    sphereCorrection: null,
    moveSpeed: 1,
    zoomSpeed: 1,
    moveInertia: true,
    mousewheel: true,
    mousemove: true,
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,
    useXmpData: true,
    panoData: null,
    requestHeaders: null,
    canvasBackground: '#000',
    withCredentials: false,
    // prettier-ignore
    navbar: [
        'zoom',
        'move',
        'download',
        'description',
        'caption',
        'fullscreen',
    ],
    renderer:{ alpha: true, antialias: true },
    lang: {
        zoom: 'Zoom',
        zoomOut: 'Zoom out',
        zoomIn: 'Zoom in',
        moveUp: 'Move up',
        moveDown: 'Move down',
        moveLeft: 'Move left',
        moveRight: 'Move right',
        download: 'Download',
        fullscreen: 'Fullscreen',
        menu: 'Menu',
        close: 'Close',
        twoFingers: 'Use two fingers to navigate',
        ctrlZoom: 'Use ctrl + scroll to zoom the image',
        loadError: "The panorama can't be loaded",
    },
    keyboard: 'fullscreen',
    keyboardActions: {
        [KEY_CODES.ArrowUp]: ACTIONS.ROTATE_UP,
        [KEY_CODES.ArrowDown]: ACTIONS.ROTATE_DOWN,
        [KEY_CODES.ArrowRight]: ACTIONS.ROTATE_RIGHT,
        [KEY_CODES.ArrowLeft]: ACTIONS.ROTATE_LEFT,
        [KEY_CODES.PageUp]: ACTIONS.ZOOM_IN,
        [KEY_CODES.PageDown]: ACTIONS.ZOOM_OUT,
        [KEY_CODES.Plus]: ACTIONS.ZOOM_IN,
        [KEY_CODES.Minus]: ACTIONS.ZOOM_OUT,
    },
};

/**
 * List of unmodifiable options and their error messages
 * @internal
 */
export const READONLY_OPTIONS: Record<ReadonlyViewerConfig, string> = {
    panorama: 'Use setPanorama method to change the panorama',
    panoData: 'Use setPanorama method to change the panorama',
    overlay: 'Use setOverlay method to changer the overlay',
    overlayOpacity: 'Use setOverlay method to changer the overlay',
    container: 'Cannot change viewer container',
    adapter: 'Cannot change adapter',
    plugins: 'Cannot change plugins',
};

/**
 * Parsers/validators for each option
 * @internal
 */
export const CONFIG_PARSERS: ConfigParsers<ViewerConfig, ParsedViewerConfig> = {
    container: (container) => {
        if (!container) {
            throw new PSVError('No value given for container.');
        }
        return container;
    },
    adapter: (adapter, { defValue }) => {
        if (!adapter) {
            adapter = defValue;
        } else if (Array.isArray(adapter)) {
            adapter = [adapterInterop(adapter[0]), adapter[1]];
        } else {
            adapter = [adapterInterop(adapter), null];
        }
        if (!adapter[0]) {
            throw new PSVError('An undefined value was given for adapter.');
        }
        if (!(adapter[0] as any).id) {
            throw new PSVError(`Adapter has no id.`);
        }
        return adapter;
    },
    overlayOpacity: (overlayOpacity) => {
        return MathUtils.clamp(overlayOpacity, 0, 1);
    },
    defaultYaw: (defaultYaw) => {
        // defaultYaw is between 0 and PI
        return parseAngle(defaultYaw);
    },
    defaultPitch: (defaultPitch) => {
        // defaultPitch is between -PI/2 and PI/2
        return parseAngle(defaultPitch, true);
    },
    defaultZoomLvl: (defaultZoomLvl) => {
        return MathUtils.clamp(defaultZoomLvl, 0, 100);
    },
    minFov: (minFov, { rawConfig }) => {
        // minFov and maxFov must be ordered
        if (rawConfig.maxFov < minFov) {
            logWarn('maxFov cannot be lower than minFov');
            minFov = rawConfig.maxFov;
        }
        // minFov between 1 and 179
        return MathUtils.clamp(minFov, 1, 179);
    },
    maxFov: (maxFov, { rawConfig }) => {
        // minFov and maxFov must be ordered
        if (maxFov < rawConfig.minFov) {
            maxFov = rawConfig.minFov;
        }
        // maxFov between 1 and 179
        return MathUtils.clamp(maxFov, 1, 179);
    },
    renderer: (rendererConfig) => {
        return {
            ...DEFAULTS.renderer,
            ...rendererConfig,
        };
    },
    lang: (lang) => {
        if (Array.isArray(lang.twoFingers)) {
            logWarn('lang.twoFingers must not be an array');
            lang.twoFingers = lang.twoFingers[0];
        }
        return {
            ...DEFAULTS.lang,
            ...lang,
        };
    },
    keyboard: (keyboard) => {
        if (!keyboard) {
            return false;
        }
        if (typeof keyboard === 'object') {
            logWarn(`Use keyboardActions to configure the keyboard actions, keyboard option must be either true, false, 'fullscreen' or 'always'`);
            return 'fullscreen';
        }
        return keyboard === 'always' ? 'always' : 'fullscreen';
    },
    keyboardActions: (keyboardActions, { rawConfig }) => {
        if (rawConfig.keyboard && typeof rawConfig.keyboard === 'object') {
            return rawConfig.keyboard;
        }
        return keyboardActions;
    },
    fisheye: (fisheye) => {
        // translate boolean fisheye to amount
        if (fisheye === true) {
            return 1;
        } else if (fisheye === false) {
            return 0;
        }
        return fisheye;
    },
    requestHeaders: (requestHeaders) => {
        if (requestHeaders && typeof requestHeaders === 'object') {
            return () => requestHeaders;
        }
        if (typeof requestHeaders === 'function') {
            return requestHeaders;
        }
        return null;
    },
    plugins: (plugins) => {
        return plugins.map((plugin, i) => {
            if (Array.isArray(plugin)) {
                plugin = [pluginInterop(plugin[0]), plugin[1]];
            } else {
                plugin = [pluginInterop(plugin), null];
            }
            if (!plugin[0]) {
                throw new PSVError(`An undefined value was given for plugin ${i}.`);
            }
            if (!(plugin[0] as any).id) {
                throw new PSVError(`Plugin ${i} has no id.`);
            }
            return plugin;
        });
    },
    navbar: (navbar) => {
        if (navbar === false) {
            return null;
        }
        if (navbar === true) {
            // true becomes the default array
            return clone(DEFAULTS.navbar as string[]);
        }
        if (typeof navbar === 'string') {
            // can be a space or coma separated list
            return navbar.split(/[ ,]/);
        }
        return navbar;
    },
};

/**
 * @internal
 */
export const getViewerConfig = getConfigParser<ViewerConfig, ParsedViewerConfig>(DEFAULTS, CONFIG_PARSERS);
