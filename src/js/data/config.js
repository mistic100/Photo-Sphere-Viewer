/**
 * @module data/config
 */

import { PSVError } from '../PSVError';
import { bound, clone, deepmerge, isInteger, logWarn, parseAngle, parseSpeed } from '../utils';
import { ACTIONS } from './constants';
import { SYSTEM } from './system';

/**
 * @summary Default options
 * @type {PhotoSphereViewer.Options}
 * @constant
 * @memberOf module:data/config
 */
const DEFAULTS = {
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
  zoomSpeed          : 2,
  autorotateDelay    : null,
  autorotateSpeed    : '2rpm',
  autorotateLat      : null,
  transitionDuration : 1500,
  transitionLoader   : true,
  moveInertia        : true,
  mousewheel         : true,
  mousewheelFactor   : 1,
  mousemove          : true,
  mousemoveHover     : false,
  touchmoveTwoFingers: false,
  clickEventOnMarker : false,
  webgl              : true,
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
 * @summary Merge and clean user config with default config
 * @param {PhotoSphereViewer.Options} options
 * @returns {PhotoSphereViewer.Options}
 * @memberOf module:data/config
 */
function getConfig(options) {
  const config = clone(DEFAULTS);
  deepmerge(config, options);

  config.webgl &= SYSTEM.isWebGLSupported;

  // check container
  if (!config.container) {
    throw new PSVError('No value given for container.');
  }

  // must support canvas
  if (!SYSTEM.isCanvasSupported) {
    throw new PSVError('Canvas is not supported.');
  }

  // additional scripts if webgl not supported/disabled
  if (!config.webgl && !SYSTEM.checkTHREE('CanvasRenderer', 'Projector')) {
    throw new PSVError('Missing Three.js components: CanvasRenderer, Projector.');
  }

  // longitude range must have two values
  if (config.longitudeRange && config.longitudeRange.length !== 2) {
    config.longitudeRange = null;
    logWarn('longitudeRange must have exactly two elements');
  }

  if (config.latitudeRange) {
    // latitude range must have two values
    if (config.latitudeRange.length !== 2) {
      config.latitudeRange = null;
      logWarn('latitudeRange must have exactly two elements');
    }
    // latitude range must be ordered
    else if (config.latitudeRange[0] > config.latitudeRange[1]) {
      config.latitudeRange = [config.latitudeRange[1], config.latitudeRange[0]];
      logWarn('latitudeRange values must be ordered');
    }
  }

  // minFov and maxFov must be ordered
  if (config.maxFov < config.minFov) {
    [config.maxFov, config.minFov] = [config.minFov, config.maxFov];
    logWarn('maxFov cannot be lower than minFov');
  }

  // cacheTexture must be a positive integer or false
  if (config.cacheTexture && (!isInteger(config.cacheTexture) || config.cacheTexture < 0)) {
    config.cacheTexture = 0;
    logWarn('invalid value for cacheTexture');
  }

  // navbar=true becomes the default array
  if (config.navbar === true) {
    config.navbar = clone(DEFAULTS.navbar);
  }
  // navbar can be a space separated list
  else if (typeof config.navbar === 'string') {
    config.navbar = config.navbar.split(' ');
  }

  // keyboard=true becomes the default map
  if (config.keyboard === true) {
    config.keyboard = clone(DEFAULTS.keyboard);
  }

  // minFov/maxFov between 1 and 179
  config.minFov = bound(config.minFov, 1, 179);
  config.maxFov = bound(config.maxFov, 1, 179);

  // default autorotateLat is defaultLat
  if (config.autorotateLat === null) {
    config.autorotateLat = config.defaultLat;
  }
  // parse autorotateLat, is between -PI/2 and PI/2
  else {
    config.autorotateLat = parseAngle(config.autorotateLat, true);
  }

  // parse longitudeRange, between 0 and 2*PI
  if (config.longitudeRange) {
    config.longitudeRange = config.longitudeRange.map(angle => parseAngle(angle));
  }

  // parse latitudeRange, between -PI/2 and PI/2
  if (config.latitudeRange) {
    config.latitudeRange = config.latitudeRange.map(angle => parseAngle(angle, true));
  }

  // parse autorotateSpeed
  config.autorotateSpeed = parseSpeed(config.autorotateSpeed);

  // reactivate the navbar if the caption is provided
  if (config.caption && !config.navbar) {
    config.navbar = ['caption'];
  }

  // translate boolean fisheye to amount
  if (config.fisheye === true) {
    config.fisheye = 1;
  }
  else if (config.fisheye === false) {
    config.fisheye = 0;
  }

  return config;
}

export { DEFAULTS, getConfig };
