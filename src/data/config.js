import { PSVError } from '../PSVError';
import { bound, clone, deepmerge, each, isInteger, logWarn, parseAngle, parseSpeed } from '../utils';
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
  sphereCorrection   : {
    pan : 0,
    tilt: 0,
    roll: 0,
  },
  longitudeRange     : null,
  latitudeRange      : null,
  moveSpeed          : 1,
  zoomButtonIncrement: 2,
  autorotateDelay    : null,
  autorotateSpeed    : '2rpm',
  autorotateLat      : null,
  transitionDuration : 1500,
  transitionLoader   : true,
  moveInertia        : true,
  mousewheel         : true,
  mousewheelSpeed    : 1,
  mousemove          : true,
  captureCursor      : false,
  touchmoveTwoFingers: false,
  clickEventOnMarker : false,
  useXmpData         : true,
  panoData           : null,
  withCredentials    : false,
  cacheTexture       : 0,
  navbar             : [
    'autorotate',
    'zoomOut',
    'zoomRange',
    'zoomIn',
    'download',
    'markers',
    'markersList',
    'caption',
    'gyroscope',
    'stereo',
    'fullscreen',
  ],
  lang               : {
    autorotate        : 'Automatic rotation',
    zoom              : 'Zoom',
    zoomOut           : 'Zoom out',
    zoomIn            : 'Zoom in',
    download          : 'Download',
    fullscreen        : 'Fullscreen',
    markers           : 'Markers',
    markersList       : 'Markers list',
    menu              : 'Menu',
    gyroscope         : 'Gyroscope',
    stereo            : 'Stereo view',
    stereoNotification: 'Click anywhere to exit stereo view.',
    pleaseRotate      : ['Please rotate your device', '(or tap to continue)'],
    twoFingers        : ['Use two fingers to navigate'],
    loadError         : 'The panorama can\'t be loaded',
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
  templates          : {},
  icons              : {},
  markers            : [],
};

/**
 * @summary List of unmodifiable options and their error messages
 * @private
 */
export const READONLY_OPTIONS = {
  panorama : 'Use setPanorama method to change the panorama',
  panoData : 'Use setPanorama method to change the panorama',
  container: 'Cannot change viewer container',
  templates: 'Cannot change templates',
  icons    : 'Cannot change icons',
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
  defaultLat     : (defaultLat) => {
    // defaultLat is between -PI/2 and PI/2
    return parseAngle(defaultLat, true);
  },
  longitudeRange : (longitudeRange) => {
    // longitude range must have two values
    if (longitudeRange && longitudeRange.length !== 2) {
      logWarn('longitudeRange must have exactly two elements');
      return null;
    }
    // longitudeRange between 0 and 2*PI
    if (longitudeRange) {
      return longitudeRange.map(angle => parseAngle(angle));
    }
    return null;
  },
  latitudeRange  : (latitudeRange) => {
    // latitude range must have two values
    if (latitudeRange && latitudeRange.length !== 2) {
      logWarn('latitudeRange must have exactly two elements');
      return latitudeRange;
    }
    // latitude range must be ordered
    else if (latitudeRange && latitudeRange[0] > latitudeRange[1]) {
      logWarn('latitudeRange values must be ordered');
      // eslint-disable-next-line no-param-reassign
      latitudeRange = [latitudeRange[1], latitudeRange[0]];
    }
    // latitudeRange is between -PI/2 and PI/2
    if (latitudeRange) {
      return latitudeRange.map(angle => parseAngle(angle, true));
    }
    return null;
  },
  minFov         : (minFov, config) => {
    // minFov and maxFov must be ordered
    if (config.maxFov < minFov) {
      logWarn('maxFov cannot be lower than minFov');
      // eslint-disable-next-line no-param-reassign
      minFov = config.maxFov;
    }
    // minFov between 1 and 179
    return bound(minFov, 1, 179);
  },
  maxFov         : (maxFov, config) => {
    // minFov and maxFov must be ordered
    if (maxFov < config.minFov) {
      // eslint-disable-next-line no-param-reassign
      maxFov = config.minFov;
    }
    // maxFov between 1 and 179
    return bound(maxFov, 1, 179);
  },
  cacheTexture   : (cacheTexture) => {
    // cacheTexture must be a positive integer or false
    if (cacheTexture && (!isInteger(cacheTexture) || cacheTexture < 0)) {
      logWarn('invalid value for cacheTexture');
      return 0;
    }
    return cacheTexture;
  },
  lang           : (lang) => {
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
