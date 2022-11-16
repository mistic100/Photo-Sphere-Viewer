import { MathUtils } from 'three';
import { AbstractAdapter } from '../adapters/AbstractAdapter';
import { EquirectangularAdapter } from '../adapters/equirectangular';
import { AbstractPlugin } from '../plugins/AbstractPlugin';
import { PSVError } from '../PSVError';
import { clone, deepmerge, each, isNil, logWarn, parseAngle, parseSpeed, pluginInterop } from '../utils';
import { ACTIONS, KEY_CODES } from './constants';

/**
 * @summary Default options
 * @type {PSV.Options}
 * @memberOf PSV
 * @constant
 */
export const DEFAULTS = {
  panorama           : null,
  overlay            : null,
  overlayOpacity     : 1,
  container          : null,
  adapter            : null,
  plugins            : [],
  caption            : null,
  description        : null,
  downloadUrl        : null,
  loadingImg         : null,
  loadingTxt         : 'Loading...',
  size               : null,
  fisheye            : false,
  minFov             : 30,
  maxFov             : 90,
  defaultZoomLvl     : 50,
  defaultLong        : 0,
  defaultLat         : 0,
  sphereCorrection   : null,
  moveSpeed          : 1,
  zoomSpeed          : 1,
  autorotateDelay    : null,
  autorotateIdle     : false,
  autorotateSpeed    : '2rpm',
  autorotateLat      : null,
  autorotateZoomLvl  : null,
  moveInertia        : true,
  mousewheel         : true,
  mousemove          : true,
  mousewheelCtrlKey  : false,
  touchmoveTwoFingers: false,
  useXmpData         : true,
  panoData           : null,
  requestHeaders     : null,
  canvasBackground   : '#000',
  withCredentials    : false,
  navbar             : [
    'autorotate',
    'zoom',
    'move',
    'download',
    'description',
    'caption',
    'fullscreen',
  ],
  lang               : {
    autorotate: 'Automatic rotation',
    zoom      : 'Zoom',
    zoomOut   : 'Zoom out',
    zoomIn    : 'Zoom in',
    move      : 'Move',
    download  : 'Download',
    fullscreen: 'Fullscreen',
    menu      : 'Menu',
    twoFingers: 'Use two fingers to navigate',
    ctrlZoom  : 'Use ctrl + scroll to zoom the image',
    loadError : 'The panorama can\'t be loaded',
  },
  keyboard           : {
    [KEY_CODES.ArrowUp]   : ACTIONS.ROTATE_LAT_UP,
    [KEY_CODES.ArrowDown] : ACTIONS.ROTATE_LAT_DOWN,
    [KEY_CODES.ArrowRight]: ACTIONS.ROTATE_LONG_RIGHT,
    [KEY_CODES.ArrowLeft] : ACTIONS.ROTATE_LONG_LEFT,
    [KEY_CODES.PageUp]    : ACTIONS.ZOOM_IN,
    [KEY_CODES.PageDown]  : ACTIONS.ZOOM_OUT,
    [KEY_CODES.Plus]      : ACTIONS.ZOOM_IN,
    [KEY_CODES.Minus]     : ACTIONS.ZOOM_OUT,
    [KEY_CODES.Space]     : ACTIONS.TOGGLE_AUTOROTATE,
  },
};

/**
 * @summary List of unmodifiable options and their error messages
 * @private
 */
export const READONLY_OPTIONS = {
  panorama : 'Use setPanorama method to change the panorama',
  panoData : 'Use setPanorama method to change the panorama',
  container: 'Cannot change viewer container',
  adapter  : 'Cannot change adapter',
  plugins  : 'Cannot change plugins',
};

/**
 * @summary List of deprecated options and their warning messages
 * @private
 */
export const DEPRECATED_OPTIONS = {
  captureCursor: 'captureCursor is deprecated',
};

/**
 * @summary Parsers/validators for each option
 * @private
 */
export const CONFIG_PARSERS = {
  container        : (container) => {
    if (!container) {
      throw new PSVError('No value given for container.');
    }
    return container;
  },
  adapter          : (adapter) => {
    if (!adapter) {
      adapter = [EquirectangularAdapter];
    }
    else if (Array.isArray(adapter)) {
      adapter = [pluginInterop(adapter[0], AbstractAdapter), adapter[1]];
    }
    else {
      adapter = [pluginInterop(adapter, AbstractAdapter)];
    }
    if (!adapter[0]) {
      throw new PSVError('Un undefined value with given for adapter.');
    }
    return adapter;
  },
  overlayOpacity   : (overlayOpacity) => {
    return MathUtils.clamp(overlayOpacity, 0, 1);
  },
  defaultLong      : (defaultLong) => {
    // defaultLat is between 0 and PI
    return parseAngle(defaultLong);
  },
  defaultLat       : (defaultLat) => {
    // defaultLat is between -PI/2 and PI/2
    return parseAngle(defaultLat, true);
  },
  defaultZoomLvl   : (defaultZoomLvl) => {
    return MathUtils.clamp(defaultZoomLvl, 0, 100);
  },
  minFov           : (minFov, config) => {
    // minFov and maxFov must be ordered
    if (config.maxFov < minFov) {
      logWarn('maxFov cannot be lower than minFov');
      minFov = config.maxFov;
    }
    // minFov between 1 and 179
    return MathUtils.clamp(minFov, 1, 179);
  },
  maxFov           : (maxFov, config) => {
    // minFov and maxFov must be ordered
    if (maxFov < config.minFov) {
      maxFov = config.minFov;
    }
    // maxFov between 1 and 179
    return MathUtils.clamp(maxFov, 1, 179);
  },
  lang             : (lang) => {
    if (Array.isArray(lang.twoFingers)) {
      logWarn('lang.twoFingers must not be an array');
      lang.twoFingers = lang.twoFingers[0];
    }
    return {
      ...DEFAULTS.lang,
      ...lang,
    };
  },
  keyboard         : (keyboard) => {
    // keyboard=true becomes the default map
    if (keyboard === true) {
      return clone(DEFAULTS.keyboard);
    }
    return keyboard;
  },
  autorotateLat    : (autorotateLat, config) => {
    // default autorotateLat is defaultLat
    if (autorotateLat === null) {
      return parseAngle(config.defaultLat, true);
    }
    // autorotateLat is between -PI/2 and PI/2
    else {
      return parseAngle(autorotateLat, true);
    }
  },
  autorotateZoomLvl: (autorotateZoomLvl) => {
    if (isNil(autorotateZoomLvl)) {
      return null;
    }
    else {
      return MathUtils.clamp(autorotateZoomLvl, 0, 100);
    }
  },
  autorotateSpeed  : (autorotateSpeed) => {
    return parseSpeed(autorotateSpeed);
  },
  autorotateIdle   : (autorotateIdle, config) => {
    if (autorotateIdle && isNil(config.autorotateDelay)) {
      logWarn('autorotateIdle requires a non null autorotateDelay');
      return false;
    }
    return autorotateIdle;
  },
  fisheye          : (fisheye) => {
    // translate boolean fisheye to amount
    if (fisheye === true) {
      return 1;
    }
    else if (fisheye === false) {
      return 0;
    }
    return fisheye;
  },
  plugins          : (plugins) => {
    return plugins
      .map((plugin) => {
        if (Array.isArray(plugin)) {
          plugin = [pluginInterop(plugin[0], AbstractPlugin), plugin[1]];
        }
        else {
          plugin = [pluginInterop(plugin, AbstractPlugin)];
        }
        if (!plugin[0]) {
          throw new PSVError('Un undefined value was given for plugins.');
        }
        return plugin;
      });
  },
};

/**
 * @summary Merge user config with default config and performs validation
 * @param {PSV.Options} options
 * @returns {PSV.Options}
 * @memberOf PSV
 * @private
 */
export function getConfig(options) {
  const tempConfig = clone(DEFAULTS);
  deepmerge(tempConfig, options);

  const config = {};

  each(tempConfig, (value, key) => {
    if (DEPRECATED_OPTIONS[key]) {
      logWarn(DEPRECATED_OPTIONS[key]);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
      throw new PSVError(`Unknown option ${key}`);
    }

    if (CONFIG_PARSERS[key]) {
      config[key] = CONFIG_PARSERS[key](value, tempConfig);
    }
    else {
      config[key] = value;
    }
  });

  return config;
}
