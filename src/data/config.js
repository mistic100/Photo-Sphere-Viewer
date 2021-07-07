import { PSVError } from '../PSVError';
import EquirectangularAdapter from '../adapters/equirectangular';
import { bound, clone, deepmerge, each, logWarn, parseAngle, parseSpeed } from '../utils';
import { ACTIONS } from './constants';

/**
 * @summary Default options
 * @type {PSV.Options}
 * @memberOf PSV
 * @constant
 */
export const DEFAULTS = {
  panorama           : null,
  container          : null,
  adapter            : null,
  caption            : null,
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
  sphereCorrectionReorder: false,
  moveSpeed          : 1,
  zoomSpeed          : 1,
  autorotateDelay    : null,
  autorotateSpeed    : '2rpm',
  autorotateLat      : null,
  moveInertia        : true,
  mousewheel         : true,
  mousemove          : true,
  captureCursor      : false,
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
    'caption',
    'fullscreen',
  ],
  lang               : {
    autorotate: 'Automatic rotation',
    zoom      : 'Zoom',
    zoomOut   : 'Zoom out',
    zoomIn    : 'Zoom in',
    download  : 'Download',
    fullscreen: 'Fullscreen',
    menu      : 'Menu',
    twoFingers: 'Use two fingers to navigate',
    ctrlZoom  : 'Use ctrl + scroll to zoom the image',
    loadError : 'The panorama can\'t be loaded',
  },
  keyboard           : {
    'ArrowUp'   : ACTIONS.ROTATE_LAT_UP,
    'ArrowDown' : ACTIONS.ROTATE_LAT_DOWN,
    'ArrowRight': ACTIONS.ROTATE_LONG_RIGHT,
    'ArrowLeft' : ACTIONS.ROTATE_LONG_LEFT,
    'PageUp'    : ACTIONS.ZOOM_IN,
    'PageDown'  : ACTIONS.ZOOM_OUT,
    '+'         : ACTIONS.ZOOM_IN,
    '-'         : ACTIONS.ZOOM_OUT,
    ' '         : ACTIONS.TOGGLE_AUTOROTATE,
  },
  plugins            : [],
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
  zoomButtonIncrement: 'zoomButtonIncrement is deprecated, use zoomSpeed',
  mousewheelSpeed    : 'mousewheelSpeed is deprecated, use zoomSpeed',
};

/**
 * @summary Parsers/validators for each option
 * @private
 */
export const CONFIG_PARSERS = {
  container      : (container) => {
    if (!container) {
      throw new PSVError('No value given for container.');
    }
    return container;
  },
  adapter        : (adapter) => {
    if (!adapter) {
      return [EquirectangularAdapter];
    }
    else if (Array.isArray(adapter)) {
      return adapter;
    }
    else {
      return [adapter];
    }
  },
  defaultLong    : (defaultLong) => {
    // defaultLat is between 0 and PI
    return parseAngle(defaultLong);
  },
  defaultLat     : (defaultLat) => {
    // defaultLat is between -PI/2 and PI/2
    return parseAngle(defaultLat, true);
  },
  minFov         : (minFov, config) => {
    // minFov and maxFov must be ordered
    if (config.maxFov < minFov) {
      logWarn('maxFov cannot be lower than minFov');
      minFov = config.maxFov;
    }
    // minFov between 1 and 179
    return bound(minFov, 1, 179);
  },
  maxFov         : (maxFov, config) => {
    // minFov and maxFov must be ordered
    if (maxFov < config.minFov) {
      maxFov = config.minFov;
    }
    // maxFov between 1 and 179
    return bound(maxFov, 1, 179);
  },
  lang           : (lang) => {
    if (Array.isArray(lang.twoFingers)) {
      logWarn('lang.twoFingers must not be an array');
      lang.twoFingers = lang.twoFingers[0];
    }
    return {
      ...DEFAULTS.lang,
      ...lang,
    };
  },
  keyboard       : (keyboard) => {
    // keyboard=true becomes the default map
    if (keyboard === true) {
      return clone(DEFAULTS.keyboard);
    }
    return keyboard;
  },
  autorotateLat  : (autorotateLat, config) => {
    // default autorotateLat is defaultLat
    if (autorotateLat === null) {
      return parseAngle(config.defaultLat, true);
    }
    // autorotateLat is between -PI/2 and PI/2
    else {
      return parseAngle(autorotateLat, true);
    }
  },
  autorotateSpeed: (autorotateSpeed) => {
    return parseSpeed(autorotateSpeed);
  },
  fisheye        : (fisheye) => {
    // translate boolean fisheye to amount
    if (fisheye === true) {
      return 1;
    }
    else if (fisheye === false) {
      return 0;
    }
    return fisheye;
  },
  plugins        : (plugins) => {
    return plugins
      .map((plugin) => {
        if (Array.isArray(plugin)) {
          return plugin;
        }
        else {
          return [plugin];
        }
      })
      .filter(plugin => !!plugin[0]);
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
