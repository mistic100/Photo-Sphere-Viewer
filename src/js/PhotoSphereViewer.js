/**
 * @typedef {Object} PhotoSphereViewer.Point
 * @summary Object defining a point
 * @property {int} x
 * @property {int} y
 */

/**
 * @typedef {Object} PhotoSphereViewer.Size
 * @summary Object defining a size
 * @property {int} width
 * @property {int} height
 */

/**
 * @typedef {Object} PhotoSphereViewer.CssSize
 * @summary Object defining a size in CSS (px, % or auto)
 * @property {string} [width]
 * @property {string} [height]
 */

/**
 * @typedef {Object} PhotoSphereViewer.Position
 * @summary Object defining a spherical position
 * @property {float} longitude
 * @property {float} latitude
 */

/**
 * @typedef {PhotoSphereViewer.Position} PhotoSphereViewer.ExtendedPosition
 * @summary Object defining a spherical or texture position
 * @description A position that can be expressed either in spherical coordinates (radians or degrees) or in texture coordinates (pixels)
 * @property {int} x
 * @property {int} y
 */

/**
 * @typedef {PhotoSphereViewer.ExtendedPosition} PhotoSphereViewer.AnimateOptions
 * @summary Object defining animation options
 * @property {number} zoom - target zoom level between 0 and 100
 */

/**
 * @typedef {Object} PhotoSphereViewer.SphereCorrection
 * @property {number} pan
 * @property {number} tilt
 * @property {number} roll
 */

/**
 * @typedef {PhotoSphereViewer.AnimateOptions} PhotoSphereViewer.PanoramaOptions
 * @summary Object defining panorama and animation options
 * @property {PhotoSphereViewer.SphereCorrection} sphere_correction - new sphere correction to apply to the panorama
 */

/**
 * @typedef {Object} PhotoSphereViewer.CacheItem
 * @summary An entry in the memory cache
 * @property {string} panorama
 * @property {THREE.Texture} image
 * @property {PhotoSphereViewer.PanoData} pano_data
 */

/**
 * @typedef {Object} PhotoSphereViewer.PanoData
 * @summary Crop information of the panorama
 * @property {int} full_width
 * @property {int} full_height
 * @property {int} cropped_width
 * @property {int} cropped_height
 * @property {int} cropped_x
 * @property {int} cropped_y
 */

/**
 * @typedef {Object} PhotoSphereViewer.ClickData
 * @summary Data of the `click` event
 * @property {int} client_x - position in the browser window
 * @property {int} client_y - position in the browser window
 * @property {int} viewer_x - position in the viewer
 * @property {int} viewer_y - position in the viewer
 * @property {float} longitude - position in spherical coordinates
 * @property {float} latitude - position in spherical coordinates
 * @property {int} texture_x - position on the texture
 * @property {int} texture_y - position on the texture
 * @property {PSVMarker} [marker] - clicked marker
 */

/**
 * Viewer class
 * @param {Object} options - see {@link http://photo-sphere-viewer.js.org/#options}
 * @constructor
 * @fires PhotoSphereViewer.ready
 * @throws {PSVError} when the configuration is incorrect
 */
function PhotoSphereViewer(options) {
  // return instance if called as a function
  if (!(this instanceof PhotoSphereViewer)) {
    return new PhotoSphereViewer(options);
  }

  // init global system variables
  if (!PhotoSphereViewer.SYSTEM.loaded) {
    PhotoSphereViewer._loadSystem();
  }

  /**
   * @summary Configuration object
   * @member {Object}
   * @readonly
   */
  this.config = PSVUtils.clone(PhotoSphereViewer.DEFAULTS);
  PSVUtils.deepmerge(this.config, options);

  // check container
  if (!options.container) {
    throw new PSVError('No value given for container.');
  }

  // must support canvas
  if (!PhotoSphereViewer.SYSTEM.isCanvasSupported) {
    throw new PSVError('Canvas is not supported.');
  }

  // additional scripts if webgl not supported/disabled
  if ((!PhotoSphereViewer.SYSTEM.isWebGLSupported || !this.config.webgl) && !PSVUtils.checkTHREE('CanvasRenderer', 'Projector')) {
    throw new PSVError('Missing Three.js components: CanvasRenderer, Projector. Get them from three.js-examples package.');
  }

  // longitude range must have two values
  if (this.config.longitude_range && this.config.longitude_range.length !== 2) {
    this.config.longitude_range = null;
    console.warn('PhotoSphereViewer: longitude_range must have exactly two elements.');
  }

  if (this.config.latitude_range) {
    // latitude range must have two values
    if (this.config.latitude_range.length !== 2) {
      this.config.latitude_range = null;
      console.warn('PhotoSphereViewer: latitude_range must have exactly two elements.');
    }
    // latitude range must be ordered
    else if (this.config.latitude_range[0] > this.config.latitude_range[1]) {
      this.config.latitude_range = [this.config.latitude_range[1], this.config.latitude_range[0]];
      console.warn('PhotoSphereViewer: latitude_range values must be ordered.');
    }
  }
  // migrate legacy tilt_up_max and tilt_down_max
  else if (this.config.tilt_up_max !== undefined || this.config.tilt_down_max !== undefined) {
    this.config.latitude_range = [
      this.config.tilt_down_max !== undefined ? this.config.tilt_down_max - Math.PI / 4 : -PSVUtils.HalfPI,
      this.config.tilt_up_max !== undefined ? this.config.tilt_up_max + Math.PI / 4 : PSVUtils.HalfPI
    ];
    console.warn('PhotoSphereViewer: tilt_up_max and tilt_down_max are deprecated, use latitude_range instead.');
  }

  // min_fov and max_fov must be ordered
  if (this.config.max_fov < this.config.min_fov) {
    var temp_fov = this.config.max_fov;
    this.config.max_fov = this.config.min_fov;
    this.config.min_fov = temp_fov;
    console.warn('PhotoSphereViewer: max_fov cannot be lower than min_fov.');
  }

  // cache_texture must be a positive integer or false
  if (this.config.cache_texture && (!PSVUtils.isInteger(this.config.cache_texture) || this.config.cache_texture < 0)) {
    this.config.cache_texture = PhotoSphereViewer.DEFAULTS.cache_texture;
    console.warn('PhotoSphereViewer: invalid value for cache_texture');
  }

  // panorama_roll is deprecated
  if ('panorama_roll' in this.config) {
    this.config.sphere_correction.roll = this.config.panorama_roll;
    console.warn('PhotoSphereViewer: panorama_roll is deprecated, use sphere_correction.roll instead');
  }

  // gyroscope is deprecated
  if ('gyroscope' in this.config) {
    console.warn('PhotoSphereViewer: gyroscope is deprecated, the control is automatically created if DeviceOrientationControls.js is loaded');
  }

  // keyboard=true becomes the default map
  if (this.config.keyboard === true) {
    this.config.keyboard = PSVUtils.clone(PhotoSphereViewer.DEFAULTS.keyboard);
  }

  // min_fov/max_fov between 1 and 179
  this.config.min_fov = PSVUtils.bound(this.config.min_fov, 1, 179);
  this.config.max_fov = PSVUtils.bound(this.config.max_fov, 1, 179);

  // default default_fov is middle point between min_fov and max_fov
  if (this.config.default_fov === null) {
    this.config.default_fov = this.config.max_fov / 2 + this.config.min_fov / 2;
  }
  // default_fov between min_fov and max_fov
  else {
    this.config.default_fov = PSVUtils.bound(this.config.default_fov, this.config.min_fov, this.config.max_fov);
  }

  // default anim_lat is default_lat
  if (this.config.anim_lat === null) {
    this.config.anim_lat = this.config.default_lat;
  }
  // parse anim_lat, is between -PI/2 and PI/2
  else {
    this.config.anim_lat = PSVUtils.parseAngle(this.config.anim_lat, true);
  }

  // parse longitude_range, between 0 and 2*PI
  if (this.config.longitude_range) {
    this.config.longitude_range = this.config.longitude_range.map(function(angle) {
      return PSVUtils.parseAngle(angle);
    });
  }

  // parse latitude_range, between -PI/2 and PI/2
  if (this.config.latitude_range) {
    this.config.latitude_range = this.config.latitude_range.map(function(angle) {
      return PSVUtils.parseAngle(angle, true);
    });
  }

  // parse anim_speed
  this.config.anim_speed = PSVUtils.parseSpeed(this.config.anim_speed);

  // reactivate the navbar if the caption is provided
  if (this.config.caption && !this.config.navbar) {
    this.config.navbar = ['caption'];
  }

  // translate boolean fisheye to amount
  if (this.config.fisheye === true) {
    this.config.fisheye = 1;
  }
  else if (this.config.fisheye === false) {
    this.config.fisheye = 0;
  }

  /**
   * @summary Top most parent
   * @member {HTMLElement}
   * @readonly
   */
  this.parent = (typeof options.container === 'string') ? document.getElementById(options.container) : options.container;

  /**
   * @summary Main container
   * @member {HTMLElement}
   * @readonly
   */
  this.container = null;

  /**
   * @member {module:components.PSVLoader}
   * @readonly
   */
  this.loader = null;

  /**
   * @member {module:components.PSVNavBar}
   * @readonly
   */
  this.navbar = null;

  /**
   * @member {module:components.PSVHUD}
   * @readonly
   */
  this.hud = null;

  /**
   * @member {module:components.PSVPanel}
   * @readonly
   */
  this.panel = null;

  /**
   * @member {module:components.PSVTooltip}
   * @readonly
   */
  this.tooltip = null;

  /**
   * @member {module:components.PSVNotification}
   * @readonly
   */
  this.notification = null;

  /**
   * @member {module:components.PSVOverlay}
   * @readonly
   */
  this.overlay = null;

  /**
   * @member {HTMLElement}
   * @readonly
   * @private
   */
  this.canvas_container = null;

  /**
   * @member {THREE.WebGLRenderer | THREE.CanvasRenderer}
   * @readonly
   * @private
   */
  this.renderer = null;

  /**
   * @member {THREE.StereoEffect}
   * @private
   */
  this.stereoEffect = null;

  /**
   * @member {NoSleep}
   * @private
   */
  this.noSleep = null;

  /**
   * @member {THREE.Scene}
   * @readonly
   * @private
   */
  this.scene = null;

  /**
   * @member {THREE.PerspectiveCamera}
   * @readonly
   * @private
   */
  this.camera = null;

  /**
   * @member {THREE.Mesh}
   * @readonly
   * @private
   */
  this.mesh = null;

  /**
   * @member {THREE.Raycaster}
   * @readonly
   * @private
   */
  this.raycaster = null;

  /**
   * @member {THREE.DeviceOrientationControls}
   * @readonly
   * @private
   */
  this.doControls = null;

  /**
   * @summary Internal properties
   * @member {Object}
   * @readonly
   * @property {boolean} needsUpdate - if the view needs to be renderer
   * @property {boolean} isCubemap - if the panorama is a cubemap
   * @property {PhotoSphereViewer.Position} position - current direction of the camera
   * @property {THREE.Vector3} direction - direction of the camera
   * @property {float} anim_speed - parsed animation speed (rad/sec)
   * @property {int} zoom_lvl - current zoom level
   * @property {float} vFov - vertical FOV
   * @property {float} hFov - horizontal FOV
   * @property {float} aspect - viewer aspect ratio
   * @property {float} move_speed - move speed (computed with pixel ratio and configuration move_speed)
   * @property {boolean} moving - is the user moving
   * @property {boolean} zooming - is the user zooming
   * @property {int} start_mouse_x - start x position of the click/touch
   * @property {int} start_mouse_y - start y position of the click/touch
   * @property {int} mouse_x - current x position of the cursor
   * @property {int} mouse_y - current y position of the cursor
   * @property {Array[]} mouse_history - list of latest positions of the cursor, [time, x, y]
   * @property {int} gyro_alpha_offset - current alpha offset for gyroscope controls
   * @property {int} pinch_dist - distance between fingers when zooming
   * @property main_reqid - animationRequest id of the main event loop
   * @property {function} orientation_cb - update callback of the device orientation
   * @property {function} autorotate_cb - update callback of the automatic rotation
   * @property {Promise} animation_promise - promise of the current animation (either go to position or image transition)
   * @property {Promise} loading_promise - promise of the setPanorama method
   * @property start_timeout - timeout id of the automatic rotation delay
   * @property {PhotoSphereViewer.ClickData} dblclick_data - temporary storage of click data between two clicks
   * @property dblclick_timeout - timeout id for double click
   * @property {PhotoSphereViewer.CacheItem[]} cache - cached panoramas
   * @property {PhotoSphereViewer.Size} size - size of the container
   * @property {PhotoSphereViewer.PanoData} pano_data - panorama metadata
   */
  this.prop = {
    needsUpdate: true,
    isCubemap: undefined,
    position: {
      longitude: 0,
      latitude: 0
    },
    ready: false,
    direction: null,
    anim_speed: 0,
    zoom_lvl: 0,
    vFov: 0,
    hFov: 0,
    aspect: 0,
    move_speed: 0.1,
    moving: false,
    zooming: false,
    start_mouse_x: 0,
    start_mouse_y: 0,
    mouse_x: 0,
    mouse_y: 0,
    mouse_history: [],
    gyro_alpha_offset: 0,
    pinch_dist: 0,
    main_reqid: null,
    orientation_cb: null,
    autorotate_cb: null,
    animation_promise: null,
    loading_promise: null,
    start_timeout: null,
    dblclick_data: null,
    dblclick_timeout: null,
    cache: [],
    size: {
      width: 0,
      height: 0
    },
    pano_data: {
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
    if (typeof this.config.templates[tpl] === 'string') {
      this.config.templates[tpl] = doT.template(this.config.templates[tpl]);
    }
  }, this);

  // init
  this.parent.photoSphereViewer = this;

  // create actual container
  this.container = document.createElement('div');
  this.container.classList.add('psv-container');
  this.parent.appendChild(this.container);

  // apply container size
  if (this.config.size !== null) {
    this._setViewerSize(this.config.size);
  }
  this._onResize();

  // apply default zoom level
  var tempZoom = (this.config.default_fov - this.config.min_fov) / (this.config.max_fov - this.config.min_fov) * 100;
  this.config.default_zoom_lvl = tempZoom - 2 * (tempZoom - 50);

  // actual move speed depends on pixel-ratio
  this.prop.move_speed = THREE.Math.degToRad(this.config.move_speed / PhotoSphereViewer.SYSTEM.pixelRatio);

  // load loader (!!)
  this.loader = new PSVLoader(this);
  this.loader.hide();

  // load navbar
  this.navbar = new PSVNavBar(this);
  this.navbar.hide();

  // load hud
  this.hud = new PSVHUD(this);
  this.hud.hide();

  // load side panel
  this.panel = new PSVPanel(this);

  // load hud tooltip
  this.tooltip = new PSVTooltip(this.hud);

  // load notification
  this.notification = new PSVNotification(this);

  // load overlay
  this.overlay = new PSVOverlay(this);

  // attach event handlers
  this._bindEvents();

  // load panorama
  if (this.config.panorama) {
    this.setPanorama(this.config.panorama);
  }

  // enable GUI after first render
  this.once('render', function() {
    if (this.config.navbar) {
      this.container.classList.add('psv-container--has-navbar');
      this.navbar.show();
    }

    this.hud.show();

    if (this.config.markers) {
      this.config.markers.forEach(function(marker) {
        this.hud.addMarker(marker, false);
      }, this);

      this.hud.renderMarkers();
    }

    // Queue animation
    if (this.config.time_anim !== false) {
      this.prop.start_timeout = window.setTimeout(this.startAutorotate.bind(this), this.config.time_anim);
    }

    setTimeout(function() {
      // start render loop
      this._run();

      /**
       * @event ready
       * @memberof PhotoSphereViewer
       * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
       */
      this.trigger('ready');
    }.bind(this), 0);
  }.bind(this));

  PhotoSphereViewer.SYSTEM.touchEnabled.then(function(enabled) {
    if (enabled) {
      this.container.classList.add('psv-is-touch');
    }
  }.bind(this));
}

/**
 * @summary Triggers an event on the viewer
 * @function trigger
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string} name
 * @param {...*} [arguments]
 * @returns {uEvent.Event}
 */

/**
 * @summary Triggers an event on the viewer and returns the modified value
 * @function change
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string} name
 * @param {*} value
 * @param {...*} [arguments]
 * @returns {*}
 */

/**
 * @summary Attaches an event listener on the viewer
 * @function on
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string|Object.<string, function>} name - event name or events map
 * @param {function} [callback]
 * @returns {PhotoSphereViewer}
 */

/**
 * @summary Removes an event listener from the viewer
 * @function off
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string|Object.<string, function>} name - event name or events map
 * @param {function} [callback]
 * @returns {PhotoSphereViewer}
 */

/**
 * @summary Attaches an event listener called once on the viewer
 * @function once
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string|Object.<string, function>} name - event name or events map
 * @param {function} [callback]
 * @returns {PhotoSphereViewer}
 */

uEvent.mixin(PhotoSphereViewer);
