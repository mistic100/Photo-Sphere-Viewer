/**
 * @summary Number of pixels bellow which a mouse move will be considered as a click
 * @type {int}
 * @readonly
 * @private
 */
PhotoSphereViewer.MOVE_THRESHOLD = 4;

/**
 * @summary Angle in radians bellow which two angles are considered identical
 * @type {float}
 * @readonly
 * @private
 */
PhotoSphereViewer.ANGLE_THRESHOLD = 0.003;

/**
 * @summary Delay in milliseconds between two clicks to consider a double click
 * @type {int}
 * @readonly
 * @private
 */
PhotoSphereViewer.DBLCLICK_DELAY = 300;

/**
 * @summary Time size of the mouse position history used to compute inertia
 * @type {int}
 * @readonly
 * @private
 */
PhotoSphereViewer.INERTIA_WINDOW = 300;

/**
 * @summary Radius of the THREE.SphereGeometry
 * Half-length of the THREE.BoxGeometry
 * @type {int}
 * @readonly
 * @private
 */
PhotoSphereViewer.SPHERE_RADIUS = 100;

/**
 * @summary Number of vertice of the THREE.SphereGeometry
 * @type {int}
 * @readonly
 * @private
 */
PhotoSphereViewer.SPHERE_VERTICES = 64;

/**
 * @summary Number of vertices of each side of the THREE.BoxGeometry
 * @type {int}
 * @readonly
 * @private
 */
PhotoSphereViewer.CUBE_VERTICES = 8;

/**
 * @summary Order of cube textures for arrays
 * @type {int[]}
 * @readonly
 * @private
 */
PhotoSphereViewer.CUBE_MAP = [0, 2, 4, 5, 3, 1];

/**
 * @summary Order of cube textures for maps
 * @type {string[]}
 * @readonly
 * @private
 */
PhotoSphereViewer.CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];

/**
 * @summary System properties
 * @type {Object}
 * @readonly
 * @private
 */
PhotoSphereViewer.SYSTEM = {
  loaded: false,
  pixelRatio: 1,
  isWebGLSupported: false,
  isCanvasSupported: false,
  deviceOrientationSupported: null,
  maxTextureWidth: 0,
  mouseWheelEvent: null,
  fullscreenEvent: null
};

/**
 * @summary SVG icons sources
 * @type {Object.<string, string>}
 * @readonly
 */
PhotoSphereViewer.ICONS = {};

/**
 * @summary Default options, see {@link http://photo-sphere-viewer.js.org/#options}
 * @type {Object}
 * @readonly
 */
PhotoSphereViewer.DEFAULTS = {
  panorama: null,
  container: null,
  caption: null,
  usexmpdata: true,
  pano_data: null,
  webgl: true,
  min_fov: 30,
  max_fov: 90,
  default_fov: null,
  default_long: 0,
  default_lat: 0,
  sphere_correction: {
    pan: 0,
    tilt: 0,
    roll: 0
  },
  longitude_range: null,
  latitude_range: null,
  move_speed: 1,
  zoom_speed: 2,
  time_anim: 2000,
  anim_speed: '2rpm',
  anim_lat: null,
  fisheye: false,
  navbar: [
    'autorotate',
    'zoom',
    'download',
    'markers',
    'caption',
    'gyroscope',
    'stereo',
    'fullscreen'
  ],
  tooltip: {
    offset: 5,
    arrow_size: 7,
    delay: 100
  },
  lang: {
    autorotate: 'Automatic rotation',
    zoom: 'Zoom',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    download: 'Download',
    fullscreen: 'Fullscreen',
    markers: 'Markers',
    gyroscope: 'Gyroscope',
    stereo: 'Stereo view',
    stereo_notification: 'Click anywhere to exit stereo view.',
    please_rotate: ['Please rotate your device', '(or tap to continue)'],
    two_fingers: ['Use two fingers to navigate']
  },
  mousewheel: true,
  mousewheel_factor: 1,
  mousemove: true,
  mousemove_hover: false,
  touchmove_two_fingers: false,
  keyboard: {
    'ArrowUp': 'rotateLatitudeUp',
    'ArrowDown': 'rotateLatitudeDown',
    'ArrowRight': 'rotateLongitudeRight',
    'ArrowLeft': 'rotateLongitudeLeft',
    'PageUp': 'zoomIn',
    'PageDown': 'zoomOut',
    '+': 'zoomIn',
    '-': 'zoomOut',
    ' ': 'toggleAutorotate'
  },
  move_inertia: true,
  click_event_on_marker: false,
  transition: {
    duration: 1500,
    loader: true
  },
  loading_img: null,
  loading_txt: 'Loading...',
  size: null,
  cache_texture: 0,
  templates: {},
  markers: [],
  with_credentials: false
};

/**
 * @summary doT.js templates
 * @type {Object.<string, string>}
 * @readonly
 */
PhotoSphereViewer.TEMPLATES = {
  markersList: '\
<div class="psv-markers-list-container"> \
  <h1 class="psv-markers-list-title">{{= it.config.lang.markers }}</h1> \
  <ul class="psv-markers-list"> \
  {{~ it.markers: marker }} \
    <li data-psv-marker="{{= marker.id }}" class="psv-markers-list-item {{? marker.className }}{{= marker.className }}{{?}}"> \
      {{? marker.image }}<img class="psv-markers-list-image" src="{{= marker.image }}"/>{{?}} \
      <p class="psv-markers-list-name">{{? marker.tooltip }}{{= marker.tooltip.content }}{{?? marker.html }}{{= marker.html }}{{??}}{{= marker.id }}{{?}}</p> \
    </li> \
  {{~}} \
  </ul> \
</div>'
};
