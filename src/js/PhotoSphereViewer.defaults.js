/**
 * Number of pixels bellow which a mouse move will be considered as a click
 * @type {int}
 */
PhotoSphereViewer.MOVE_THRESHOLD = 4;

/**
 * Time size of the mouse position history used to compute inertia
 * @type {int}
 */
PhotoSphereViewer.INERTIA_WINDOW = 300;

/**
 * Map between keyboard events "keyCode|which" and "key"
 * @type {Object.<int, string>}
 */
PhotoSphereViewer.KEYMAP = {
  33: 'PageUp',
  34: 'PageDown',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  107: '+',
  109: '-'
};

/**
 * SVG icons sources
 * @type {Object.<string, string>}
 */
PhotoSphereViewer.ICONS = {};

/**
 * System properties
 * @type {Object}
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
 * PhotoSphereViewer defaults
 * @type {Object}
 */
PhotoSphereViewer.DEFAULTS = {
  panorama: null,
  container: null,
  caption: null,
  autoload: true,
  usexmpdata: true,
  pano_data: null,
  webgl: true,
  sphere_segments: 64,
  min_fov: 30,
  max_fov: 90,
  default_fov: null,
  default_long: 0,
  default_lat: 0,
  longitude_range: null,
  latitude_range: null,
  move_speed: 1,
  time_anim: 2000,
  anim_speed: '2rpm',
  anim_lat: null,
  navbar: [
    'autorotate',
    'zoom',
    'download',
    'markers',
    'caption',
    'gyroscope',
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
    gyroscope: 'Gyroscope'
  },
  mousewheel: true,
  mousemove: true,
  keyboard: true,
  gyroscope: false,
  move_inertia: true,
  click_event_on_marker: false,
  transition: {
    duration: 1500,
    loader: true,
    blur: false
  },
  loading_img: null,
  loading_txt: 'Loading...',
  size: null,
  templates: {},
  markers: []
};

/**
 * doT.js templates
 * @type {Object.<string, string>}
 */
PhotoSphereViewer.TEMPLATES = {
  markersList: '\
<div class="psv-markers-list"> \
  <h1>{{= it.config.lang.markers }}</h1> \
  <ul> \
  {{~ it.markers: marker }} \
    <li data-psv-marker="{{= marker.id }}" {{? marker.className }}class="{{= marker.className }}"{{?}}> \
      {{? marker.image }}<img class="marker-image" src="{{= marker.image }}"/>{{?}} \
      <p class="marker-name {{? !marker.image }}no-image{{?}}">{{? marker.tooltip }}{{= marker.tooltip.content }}{{?? marker.html }}{{= marker.html }}{{??}}{{= marker.id }}{{?}}</p> \
    </li> \
  {{~}} \
  </ul> \
</div>'
};
