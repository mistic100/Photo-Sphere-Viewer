/**
 * Viewer class
 * @param {Object} options - Viewer settings
 * @constructor
 */
function PhotoSphereViewer(options) {
  if (!(this instanceof PhotoSphereViewer)) {
    return new PhotoSphereViewer(options);
  }

  if (!PhotoSphereViewer.SYSTEM.loaded) {
    PhotoSphereViewer.loadSystem();
  }

  this.config = PSVUtils.clone(PhotoSphereViewer.DEFAULTS);
  PSVUtils.deepmerge(this.config, options);

  // check system and config
  if (!options.container) {
    throw new PSVError('No value given for container.');
  }

  if (!PhotoSphereViewer.SYSTEM.isCanvasSupported) {
    throw new PSVError('Canvas is not supported.');
  }

  if ((!PhotoSphereViewer.SYSTEM.isWebGLSupported || !this.config.webgl) && !PSVUtils.checkTHREE('CanvasRenderer', 'Projector')) {
    throw new PSVError('Missing Three.js components: CanvasRenderer, Projector. Get them from threejs-examples package.');
  }

  if (this.config.transition && this.config.transition.blur) {
    if (!PhotoSphereViewer.SYSTEM.isWebGLSupported || !this.config.webgl) {
      this.config.transition.blur = false;
      console.warn('PhotoSphereViewer: Using canvas rendering, blur transition disabled.');
    }
    else if (!PSVUtils.checkTHREE('EffectComposer', 'RenderPass', 'ShaderPass', 'MaskPass', 'CopyShader')) {
      throw new PSVError('Missing Three.js components: EffectComposer, RenderPass, ShaderPass, MaskPass, CopyShader. Get them from threejs-examples package.');
    }
  }

  if (this.config.longitude_range && this.config.longitude_range.length !== 2) {
    this.config.longitude_range = null;
    console.warn('PhotoSphereViewer: longitude_range must have exactly two elements.');
  }

  if (this.config.latitude_range) {
    if (this.config.latitude_range.length !== 2) {
      this.config.latitude_range = null;
      console.warn('PhotoSphereViewer: latitude_range must have exactly two elements.');
    }
    else if (this.config.latitude_range[0] > this.config.latitude_range[1]) {
      this.config.latitude_range = [this.config.latitude_range[1], this.config.latitude_range[0]];
      console.warn('PhotoSphereViewer: latitude_range values must be ordered.');
    }
  }
  else if (this.config.tilt_up_max !== undefined || this.config.tilt_down_max !== undefined) {
    this.config.latitude_range = [
      this.config.tilt_down_max !== undefined ? this.config.tilt_down_max - Math.PI / 4 : -PSVUtils.HalfPI,
      this.config.tilt_up_max !== undefined ? this.config.tilt_up_max + Math.PI / 4 : PSVUtils.HalfPI
    ];
    console.warn('PhotoSphereViewer: tilt_up_max and tilt_down_max are deprecated, use latitude_range instead.');
  }

  if (this.config.max_fov < this.config.min_fov) {
    this.config.max_fov = PhotoSphereViewer.DEFAULTS.max_fov;
    this.config.min_fov = PhotoSphereViewer.DEFAULTS.min_fov;
    console.warn('PhotoSphereViewer: max_fov cannot be lower than min_fov.');
  }

  // normalize config
  this.config.min_fov = PSVUtils.stayBetween(this.config.min_fov, 1, 179);
  this.config.max_fov = PSVUtils.stayBetween(this.config.max_fov, 1, 179);
  if (this.config.default_fov === null) {
    this.config.default_fov = this.config.max_fov / 2 + this.config.min_fov / 2;
  }
  else {
    this.config.default_fov = PSVUtils.stayBetween(this.config.default_fov, this.config.min_fov, this.config.max_fov);
  }
  this.config.default_long = PSVUtils.parseAngle(this.config.default_long);
  this.config.default_lat = PSVUtils.stayBetween(PSVUtils.parseAngle(this.config.default_lat, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
  if (this.config.anim_lat === null) {
    this.config.anim_lat = this.config.default_lat;
  }
  else {
    this.config.anim_lat = PSVUtils.stayBetween(PSVUtils.parseAngle(this.config.anim_lat, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
  }
  this.config.anim_speed = PSVUtils.parseSpeed(this.config.anim_speed);
  if (this.config.caption && !this.config.navbar) {
    this.config.navbar = ['caption'];
  }
  if (this.config.longitude_range) {
    this.config.longitude_range = this.config.longitude_range.map(function(angle) {
      return PSVUtils.parseAngle(angle);
    });
  }
  if (this.config.latitude_range) {
    this.config.latitude_range = this.config.latitude_range.map(function(angle) {
      return PSVUtils.stayBetween(PSVUtils.parseAngle(angle, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
    });
  }
  if (this.config.fisheye === true) {
    this.config.fisheye = 1;
  }
  else if (this.config.fisheye === false) {
    this.config.fisheye = 0;
  }

  // references to components
  this.parent = (typeof options.container == 'string') ? document.getElementById(options.container) : options.container;
  this.container = null;
  this.loader = null;
  this.navbar = null;
  this.hud = null;
  this.panel = null;
  this.tooltip = null;
  this.canvas_container = null;
  this.renderer = null;
  this.composer = null;
  this.passes = {};
  this.scene = null;
  this.camera = null;
  this.mesh = null;
  this.raycaster = null;
  this.doControls = null;

  // local properties
  this.prop = {
    latitude: 0, // current latitude of the center
    longitude: 0, // current longitude of the center
    anim_speed: 0, // parsed anim speed (rad/sec)
    zoom_lvl: 0, // current zoom level
    vFov: 0, // vertical FOV
    hFov: 0, // horizontal FOV
    aspect: 0, // viewer aspect ratio
    move_speed: 0.1, // move speed (computed with pixel ratio and config move_speed)
    moving: false, // is the user moving
    zooming: false, // is the user zooming
    start_mouse_x: 0, // start x position of the click/touch
    start_mouse_y: 0, // start y position of the click/touch
    mouse_x: 0, // current x position of the cursor
    mouse_y: 0, // current y position of the cursor
    mouse_history: [], // list of latest positions of the cursor [time, x, y]
    pinch_dist: 0, // distance between fingers when zooming
    direction: null, // direction of the camera (Vector3)
    orientation_reqid: null, // animationRequest id of the device orientation
    autorotate_reqid: null, // animationRequest id of the automatic rotation
    animation_promise: null, // promise of the current animation (either go to position or image transition)
    start_timeout: null, // timeout id of the automatic rotation delay
    size: { // size of the container
      width: 0,
      height: 0
    },
    pano_data: { // panorama metadata
      full_width: 0,
      full_height: 0,
      cropped_width: 0,
      cropped_height: 0,
      cropped_x: 0,
      cropped_y: 0
    }
  };

  // init templates
  Object.keys(PhotoSphereViewer.TEMPLATES).forEach(function(tpl) {
    if (!this.config.templates[tpl]) {
      this.config.templates[tpl] = PhotoSphereViewer.TEMPLATES[tpl];
    }
    if (typeof this.config.templates[tpl] == 'string') {
      this.config.templates[tpl] = doT.template(this.config.templates[tpl]);
    }
  }, this);

  // create actual container
  this.container = document.createElement('div');
  this.container.classList.add('psv-container');
  this.parent.appendChild(this.container);

  // apply config
  if (this.config.size !== null) {
    this._setViewerSize(this.config.size);
  }

  this._onResize();

  var tempZoom = Math.round((this.config.default_fov - this.config.min_fov) / (this.config.max_fov - this.config.min_fov) * 100);
  this.zoom(tempZoom - 2 * (tempZoom - 50), false);

  this.prop.move_speed = 1 / PhotoSphereViewer.SYSTEM.pixelRatio * Math.PI / 180 * this.config.move_speed;

  this.rotate({
    longitude: this.config.default_long,
    latitude: this.config.default_lat
  }, false);

  // load components
  if (this.config.navbar) {
    this.container.classList.add('psv-container--has-navbar');
    this.navbar = new PSVNavBar(this);
    this.navbar.hide();
  }

  this.hud = new PSVHUD(this);
  this.hud.hide();

  this.panel = new PSVPanel(this);

  this.tooltip = new PSVTooltip(this.hud);

  // init
  this.parent.photoSphereViewer = this;

  this._bindEvents();

  if (this.config.autoload) {
    this.load();
  }

  // enable GUI after first render
  this.once('render', function() {
    if (this.config.navbar) {
      this.navbar.show();
    }

    this.hud.show();

    if (this.config.markers) {
      this.config.markers.forEach(function(marker) {
        this.hud.addMarker(marker, false);
      }, this);

      this.hud.updatePositions();
    }

    this.trigger('ready');
  }.bind(this));
}

uEvent.mixin(PhotoSphereViewer);
