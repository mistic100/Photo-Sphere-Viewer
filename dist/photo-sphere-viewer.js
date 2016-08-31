/*!
 * Photo Sphere Viewer 3.2.1
 * Copyright (c) 2014-2015 Jérémy Heleine
 * Copyright (c) 2015-2016 Damien "Mistic" Sorel
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three', 'D.js', 'uevent', 'doT'], factory);
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('three'), require('d.js'), require('uevent'), require('dot'));
  }
  else {
    root.PhotoSphereViewer = factory(root.THREE, root.D, root.uEvent, root.doT);
  }
}(this, function(THREE, D, uEvent, doT) {
"use strict";

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
    },
    cache: {
      items: {},
      registry: []
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


/**
 * Loads the XMP data with AJAX
 * @returns {promise}
 * @private
 */
PhotoSphereViewer.prototype._loadXMP = function() {
  if (!this.config.usexmpdata) {
    return D.resolved(null);
  }

  var defer = D();
  var xhr = new XMLHttpRequest();
  var self = this;
  var progress = 0;

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 0) {
        if (self.loader) {
          self.loader.setProgress(100);
        }

        var binary = xhr.responseText;
        var a = binary.indexOf('<x:xmpmeta'), b = binary.indexOf('</x:xmpmeta>');
        var data = binary.substring(a, b);

        // No data retrieved
        if (a === -1 || b === -1 || data.indexOf('GPano:') === -1) {
          defer.resolve(null);
        }
        else {
          var pano_data = {
            full_width: parseInt(PSVUtils.getXMPValue(data, 'FullPanoWidthPixels')),
            full_height: parseInt(PSVUtils.getXMPValue(data, 'FullPanoHeightPixels')),
            cropped_width: parseInt(PSVUtils.getXMPValue(data, 'CroppedAreaImageWidthPixels')),
            cropped_height: parseInt(PSVUtils.getXMPValue(data, 'CroppedAreaImageHeightPixels')),
            cropped_x: parseInt(PSVUtils.getXMPValue(data, 'CroppedAreaLeftPixels')),
            cropped_y: parseInt(PSVUtils.getXMPValue(data, 'CroppedAreaTopPixels'))
          };

          if (!pano_data.full_width || !pano_data.full_height || !pano_data.cropped_width || !pano_data.cropped_height) {
            console.warn('PhotoSphereViewer: invalid XMP data');
            defer.resolve(null);
          }
          else {
            defer.resolve(pano_data);
          }
        }
      }
      else {
        self.container.textContent = 'Cannot load image';
        throw new PSVError('Cannot load image');
      }
    }
    else if (xhr.readyState === 3) {
      if (self.loader) {
        self.loader.setProgress(progress += 10);
      }
    }
  };

  xhr.onprogress = function(e) {
    if (e.lengthComputable && self.loader) {
      var new_progress = parseInt(e.loaded / e.total * 100);
      if (new_progress > progress) {
        progress = new_progress;
        self.loader.setProgress(progress);
      }
    }
  };

  xhr.onerror = function() {
    self.container.textContent = 'Cannot load image';
    throw new PSVError('Cannot load image');
  };

  if (true === this.config.caching.enabled && true === this.isPanoCached(this.config.panorama)) {
    var cachedPano = self._getPanoCache(this.config.panorama);
    defer.resolve(cachedPano.xmpdata);
  }
  else {
    xhr.open('GET', this.config.panorama, true);
    xhr.send(null);
  }
  return defer.promise;
};

/**
 * Loads the sphere texture
 * @param {String} pano - The panorama image uri - if not set, use config.panorama
 * @param {Function} progressCallback - The callback that will be invoked while loading the panorama image, with the percentage as argument.
 * @returns {promise}
 * @private
 */
PhotoSphereViewer.prototype._loadTexture = function(pano, progressCallback) {
  var self = this;
  var targetPano = pano || self.config.panorama;

  return this._loadXMP().then(function(pano_data) {
    var defer = D();
    var loader = new THREE.ImageLoader();
    var progress = pano_data ? 100 : 0;

    loader.setCrossOrigin('anonymous');

    var onload = function(img) {
      if (self.loader) {
        self.loader.setProgress(100);
      }

      // Config XMP data
      if (!pano_data && self.config.pano_data) {
        pano_data = PSVUtils.clone(self.config.pano_data);
      }

      // Default XMP data
      if (!pano_data) {
        pano_data = {
          full_width: img.width,
          full_height: img.height,
          cropped_width: img.width,
          cropped_height: img.height,
          cropped_x: 0,
          cropped_y: 0
        };
      }

      self.prop.pano_data = pano_data;

      var r = Math.min(pano_data.full_width, PhotoSphereViewer.SYSTEM.maxTextureWidth) / pano_data.full_width;
      var resized_pano_data = PSVUtils.clone(pano_data);

      resized_pano_data.full_width *= r;
      resized_pano_data.full_height *= r;
      resized_pano_data.cropped_width *= r;
      resized_pano_data.cropped_height *= r;
      resized_pano_data.cropped_x *= r;
      resized_pano_data.cropped_y *= r;

      img.width = resized_pano_data.cropped_width;
      img.height = resized_pano_data.cropped_height;

      // create a new image containing the source image and black for cropped parts
      var buffer = document.createElement('canvas');
      buffer.width = resized_pano_data.full_width;
      buffer.height = resized_pano_data.full_height;

      var ctx = buffer.getContext('2d');
      ctx.drawImage(img, resized_pano_data.cropped_x, resized_pano_data.cropped_y, resized_pano_data.cropped_width, resized_pano_data.cropped_height);

      var texture = new THREE.Texture(buffer);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      // Cache handling.
      if (true === self.config.caching.enabled) {
        var tmpCacheItem = {
          path: targetPano,
          xmpdata: pano_data,
          texture: texture
        };
        self._savePanoCache(targetPano, tmpCacheItem).then(function() {
          self.trigger('pano-preloaded', targetPano);
        });
      }
      defer.resolve(texture, pano_data);
    };

    var onprogress = function(e) {
      if (e.lengthComputable && self.loader) {
        var new_progress = parseInt(e.loaded / e.total * 100);
        if (new_progress > progress) {
          progress = new_progress;
          self.loader.setProgress(progress);
        }
        if (progressCallback instanceof Function) {
          progressCallback(new_progress);
        }
      }
    };

    var onerror = function() {
      self.container.textContent = 'Cannot load image';
      throw new PSVError('Cannot load image');
    };

    if (true === self.config.caching.enabled && true === self.isPanoCached(targetPano)) {
      var cachedPano = self._getPanoCache(targetPano);
      defer.resolve(cachedPano.texture);
    }
    else {
      loader.load(targetPano, onload, onprogress, onerror);
    }
    return defer.promise;
  });
};

/**
 * Applies the texture to the scene
 * Creates the scene if needed
 * @param {THREE.Texture} texture - The sphere texture
 * @returns {promise}
 * @private
 */
PhotoSphereViewer.prototype._setTexture = function(texture) {
  if (!this.scene) {
    this._createScene();
  }

  if (this.mesh.material.map) {
    this.mesh.material.map.dispose();
  }

  this.mesh.material.map = texture;

  this.trigger('panorama-loaded');

  this.render();

  return D.resolved();
};

/**
 * Creates the 3D scene and GUI components
 * @private
 */
PhotoSphereViewer.prototype._createScene = function() {
  this.raycaster = new THREE.Raycaster();

  // Renderer depends on whether WebGL is supported or not
  this.renderer = PhotoSphereViewer.SYSTEM.isWebGLSupported && this.config.webgl ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.setSize(this.prop.size.width, this.prop.size.height);
  this.renderer.setPixelRatio(PhotoSphereViewer.SYSTEM.pixelRatio);

  this.camera = new THREE.PerspectiveCamera(this.config.default_fov, this.prop.size.width / this.prop.size.height, 1, PhotoSphereViewer.SPHERE_RADIUS * 2);
  this.camera.position.set(0, 0, 0);

  if (this.config.gyroscope && PSVUtils.checkTHREE('DeviceOrientationControls')) {
    this.doControls = new THREE.DeviceOrientationControls(this.camera);
  }

  this.scene = new THREE.Scene();
  this.scene.add(this.camera);

  // The middle of the panorama is placed at longitude=0
  var geometry = new THREE.SphereGeometry(PhotoSphereViewer.SPHERE_RADIUS, this.config.sphere_segments, this.config.sphere_segments, -PSVUtils.HalfPI);

  var material = new THREE.MeshBasicMaterial();
  material.side = THREE.DoubleSide;

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.scale.x = -1;

  this.scene.add(this.mesh);

  // create canvas container
  this.canvas_container = document.createElement('div');
  this.canvas_container.className = 'psv-canvas-container';
  this.renderer.domElement.className = 'psv-canvas';
  this.container.appendChild(this.canvas_container);
  this.canvas_container.appendChild(this.renderer.domElement);

  // Queue animation
  if (this.config.time_anim !== false) {
    this.prop.start_timeout = window.setTimeout(this.startAutorotate.bind(this), this.config.time_anim);
  }

  // Init shader renderer
  if (this.config.transition && this.config.transition.blur) {
    this.composer = new THREE.EffectComposer(this.renderer);

    this.passes.render = new THREE.RenderPass(this.scene, this.camera);

    this.passes.copy = new THREE.ShaderPass(THREE.CopyShader);
    this.passes.copy.renderToScreen = true;

    this.passes.blur = new THREE.ShaderPass(THREE.GodraysShader);
    this.passes.blur.enabled = false;
    this.passes.blur.renderToScreen = true;

    // values for minimal luminosity change
    this.passes.blur.uniforms.fDensity.value = 0.0;
    this.passes.blur.uniforms.fWeight.value = 0.5;
    this.passes.blur.uniforms.fDecay.value = 0.5;
    this.passes.blur.uniforms.fExposure.value = 1.0;

    this.composer.addPass(this.passes.render);
    this.composer.addPass(this.passes.copy);
    this.composer.addPass(this.passes.blur);
  }
};

/**
 * Perform transition between current and new texture
 * @param {THREE.Texture} texture
 * @param {{latitude: float, longitude: float}} [position]
 * @returns {promise}
 * @private
 */
PhotoSphereViewer.prototype._transition = function(texture, position) {
  var self = this;

  // create a new sphere with the new texture
  var geometry = new THREE.SphereGeometry(150, 32, 32, -PSVUtils.HalfPI);

  var material = new THREE.MeshBasicMaterial();
  material.side = THREE.DoubleSide;
  material.map = texture;
  material.transparent = true;
  material.opacity = 0;

  var mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1;

  // rotate the new sphere to make the target position face the camera
  if (position) {
    // Longitude rotation along the vertical axis
    mesh.rotateY(position.longitude - this.prop.longitude);

    // Latitude rotation along the camera horizontal axis
    var axis = new THREE.Vector3(0, 1, 0).cross(this.camera.getWorldDirection()).normalize();
    var q = new THREE.Quaternion().setFromAxisAngle(axis, position.latitude - this.prop.latitude);
    mesh.quaternion.multiplyQuaternions(q, mesh.quaternion);
  }

  this.scene.add(mesh);
  this.render();

  // animation with blur/zoom ?
  var original_zoom_lvl = this.prop.zoom_lvl;
  if (this.config.transition.blur) {
    this.passes.copy.enabled = false;
    this.passes.blur.enabled = true;
  }

  var onTick = function(properties) {
    material.opacity = properties.opacity;

    if (self.config.transition.blur) {
      self.passes.blur.uniforms.fDensity.value = properties.density;
      self.zoom(properties.zoom, false);
    }

    self.render();
  };

  // 1st half animation
  return PSVUtils.animation({
      properties: {
        density: { start: 0.0, end: 1.5 },
        opacity: { start: 0.0, end: 0.5 },
        zoom: { start: original_zoom_lvl, end: 100 }
      },
      duration: self.config.transition.duration / (self.config.transition.blur ? 4 / 3 : 2),
      easing: self.config.transition.blur ? 'outCubic' : 'linear',
      onTick: onTick
    })
    .then(function() {
      // 2nd half animation
      return PSVUtils.animation({
        properties: {
          density: { start: 1.5, end: 0.0 },
          opacity: { start: 0.5, end: 1.0 },
          zoom: { start: 100, end: original_zoom_lvl }
        },
        duration: self.config.transition.duration / (self.config.transition.blur ? 4 : 2),
        easing: self.config.transition.blur ? 'inCubic' : 'linear',
        onTick: onTick
      });
    })
    .then(function() {
      // disable blur shader
      if (self.config.transition.blur) {
        self.passes.copy.enabled = true;
        self.passes.blur.enabled = false;

        self.zoom(original_zoom_lvl, false);
      }

      // remove temp sphere and transfer the texture to the main sphere
      self.mesh.material.map.dispose();
      self.mesh.material.map = texture;

      self.scene.remove(mesh);

      mesh.geometry.dispose();
      mesh.geometry = null;
      mesh.material.dispose();
      mesh.material = null;

      // actually rotate the camera
      if (position) {
        // FIXME: find a better way to handle ranges
        if (self.config.latitude_range || self.config.longitude_range) {
          self.config.longitude_range = self.config.latitude_range = null;
          console.warn('PhotoSphereViewer: trying to perform transition with longitude_range and/or latitude_range, ranges cleared.');
        }

        self.rotate(position);
      }
      else {
        self.render();
      }
    });
};

/**
 * Reverse autorotate direction with smooth transition
 * @private
 */
PhotoSphereViewer.prototype._reverseAutorotate = function() {
  var self = this;
  var newSpeed = -this.config.anim_speed;
  var range = this.config.longitude_range;
  this.config.longitude_range = null;

  PSVUtils.animation({
      properties: {
        speed: { start: this.config.anim_speed, end: 0 }
      },
      duration: 300,
      easing: 'inSine',
      onTick: function(properties) {
        self.config.anim_speed = properties.speed;
      }
    })
    .then(function() {
      return PSVUtils.animation({
        properties: {
          speed: { start: 0, end: newSpeed }
        },
        duration: 300,
        easing: 'outSine',
        onTick: function(properties) {
          self.config.anim_speed = properties.speed;
        }
      });
    })
    .then(function() {
      self.config.longitude_range = range;
      self.config.anim_speed = newSpeed;
    });
};

/**
 * Remove a panorama image from the internal cache.
 * @param {String} panorama - The panorama uri, if missing, all the cache will bhe cleared.
 * @private
 * @return {Boolean} False if cache is disabled, true otherwise.
 */
PhotoSphereViewer.prototype._clearTexture = function(panorama) {
  if (true === this.config.caching.enabled) {
    if (panorama) {
      if ('undefined' != typeof this.prop.cache.items[panorama]) {
        delete this.prop.cache.items[panorama];
        this.prop.cache.registry.splice(this.prop.cache.registry.indexOf(panorama), 1);
      }
    }
    else {
      delete this.prop.cache.items;
      this.prop.cache.items = {};
      this.prop.cache.registry = [];
    }
    return true;
  }
  return false;
};

/**
 * Check if the cache size has reached the limit
 * @private
 * @return {Promise}
 */
PhotoSphereViewer.prototype._normalizeCacheSize = function() {
  var defer = D();
  if (true === this.config.caching.enabled) {
    // Unlimited cache?
    if (0 === this.config.caching.maxSize) {
      defer.resolve(true);
    }
    else if (this.prop.cache.registry.length >= this.config.caching.maxSize) {
      // Always remove the older item to make room for the next one.
      defer.resolve(this._clearTexture(this.prop.cache.registry[0]));
    }
    else {
      defer.resolve(true);
    }
  }
  else {
    defer.resolve(false);
  }
  return defer.promise;
};

/**
 * Save a panorama into the internal cache.
 * @param {String} pano - The panorama path
 * @param {Object} item - The panorama cache item.
 * @return {Promise}
 */
PhotoSphereViewer.prototype._savePanoCache = function(pano, item) {
  var defer = D();
  var self = this;
  this._normalizeCacheSize().then(function() {
    self.prop.cache.registry.push(pano);
    self.prop.cache.items[pano] = item;
    defer.resolve(pano);
  });
  return defer.promise;
};

/**
 * Retrieve a panorama cached item.
 * @param {String} pano - The panorama path
 * @return {Object|null} - The panorama Object, null if not present.
 */
PhotoSphereViewer.prototype._getPanoCache = function(pano) {
  if ('undefined' !== typeof this.prop.cache.items[pano]) {
    return this.prop.cache.items[pano];
  }
  else {
    // May be worth throwing an exception?
    return null;
  }
};


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
 * Radius of the THREE.Sphere
 * @type {int}
 */
PhotoSphereViewer.SPHERE_RADIUS = 100;

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
  fisheye: false,
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
  markers: [],
  caching: {
    enabled: true,
    maxSize: 5
  }
};

/**
 * doT.js templates
 * @type {Object.<string, string>}
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


/**
 * Add all needed event listeners
 * @private
 */
PhotoSphereViewer.prototype._bindEvents = function() {
  window.addEventListener('resize', this);
  document.addEventListener(PhotoSphereViewer.SYSTEM.fullscreenEvent, this);

  // all interation events are binded to the HUD only
  if (this.config.mousemove) {
    this.hud.container.style.cursor = 'move';
    this.hud.container.addEventListener('mousedown', this);
    this.hud.container.addEventListener('touchstart', this);
    window.addEventListener('mouseup', this);
    window.addEventListener('touchend', this);
    this.hud.container.addEventListener('mousemove', this);
    this.hud.container.addEventListener('touchmove', this);
  }

  if (this.config.mousewheel) {
    this.hud.container.addEventListener(PhotoSphereViewer.SYSTEM.mouseWheelEvent, this);
  }

  this.on('_side-reached', function(side) {
    if (this.isAutorotateEnabled()) {
      if (side === 'left' || side === 'right') {
        this._reverseAutorotate();
      }
    }
  });
};

/**
 * Handle events
 * @param {Event} evt
 * @private
 */
PhotoSphereViewer.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    // @formatter:off
    case 'resize': PSVUtils.throttle(this._onResize(), 50); break;
    case 'keydown':     this._onKeyDown(evt);     break;
    case 'mousedown':   this._onMouseDown(evt);   break;
    case 'touchstart':  this._onTouchStart(evt);  break;
    case 'mouseup':     this._onMouseUp(evt);     break;
    case 'touchend':    this._onTouchEnd(evt);    break;
    case 'mousemove':   this._onMouseMove(evt);   break;
    case 'touchmove':   this._onTouchMove(evt);   break;
    case PhotoSphereViewer.SYSTEM.fullscreenEvent:  this._fullscreenToggled();  break;
    case PhotoSphereViewer.SYSTEM.mouseWheelEvent:  this._onMouseWheel(evt);      break;
    // @formatter:on
  }
};

/**
 * Resizes the canvas when the window is resized
 * @private
 */
PhotoSphereViewer.prototype._onResize = function() {
  if (this.container.clientWidth != this.prop.size.width || this.container.clientHeight != this.prop.size.height) {
    this.prop.size.width = parseInt(this.container.clientWidth);
    this.prop.size.height = parseInt(this.container.clientHeight);
    this.prop.aspect = this.prop.size.width / this.prop.size.height;

    if (this.renderer) {
      this.renderer.setSize(this.prop.size.width, this.prop.size.height);
      if (this.composer) {
        this.composer.reset(new THREE.WebGLRenderTarget(this.prop.size.width, this.prop.size.height));
      }
      this.render();
    }

    this.trigger('size-updated', this.getSize());
  }
};

/**
 * Rotate or zoom on key down
 * @param {KeyboardEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onKeyDown = function(evt) {
  var dLong = 0;
  var dLat = 0;
  var dZoom = 0;

  var key = evt.key || PhotoSphereViewer.KEYMAP[evt.keyCode || evt.which];

  switch (key) {
    // @formatter:off
    case 'ArrowUp': dLat = 0.01; break;
    case 'ArrowDown': dLat = -0.01; break;
    case 'ArrowRight': dLong = 0.01; break;
    case 'ArrowLeft': dLong = -0.01; break;
    case 'PageUp':case '+': dZoom = 1; break;
    case 'PageDown':case '-': dZoom = -1; break;
    // @formatter:on
  }

  if (dZoom !== 0) {
    this.zoom(this.prop.zoom_lvl + dZoom);
  }
  else if (dLat !== 0 || dLong !== 0) {
    this.rotate({
      longitude: this.prop.longitude + dLong * this.prop.move_speed * this.prop.hFov,
      latitude: this.prop.latitude + dLat * this.prop.move_speed * this.prop.vFov
    });
  }
};

/**
 * The user wants to move
 * @param {MouseEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onMouseDown = function(evt) {
  this._startMove(evt);
};

/**
 * The user wants to move (touch version)
 * @param {TouchEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onTouchStart = function(evt) {
  if (evt.touches.length === 1) {
    this._startMove(evt.touches[0]);
  }
  else if (evt.touches.length === 2) {
    this._startZoom(evt);
  }
};

/**
 * Initializes the movement
 * @param {MouseEvent|Touch} evt
 * @private
 */
PhotoSphereViewer.prototype._startMove = function(evt) {
  if (this.isGyroscopeEnabled()) {
    return;
  }

  this.stopAll();

  this.prop.mouse_x = this.prop.start_mouse_x = parseInt(evt.clientX);
  this.prop.mouse_y = this.prop.start_mouse_y = parseInt(evt.clientY);
  this.prop.moving = true;
  this.prop.zooming = false;

  this.prop.mouse_history.length = 0;
  this._logMouseMove(evt);
};

/**
 * Initializes the zoom
 * @param {TouchEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._startZoom = function(evt) {
  var t = [
    { x: parseInt(evt.touches[0].clientX), y: parseInt(evt.touches[0].clientY) },
    { x: parseInt(evt.touches[1].clientX), y: parseInt(evt.touches[1].clientY) }
  ];

  this.prop.pinch_dist = Math.sqrt(Math.pow(t[0].x - t[1].x, 2) + Math.pow(t[0].y - t[1].y, 2));
  this.prop.moving = false;
  this.prop.zooming = true;
};

/**
 * The user wants to stop moving
 * @param {MouseEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onMouseUp = function(evt) {
  this._stopMove(evt);
};

/**
 * The user wants to stop moving (touch version)
 * @param {TouchEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onTouchEnd = function(evt) {
  this._stopMove(evt.changedTouches[0]);
};

/**
 * Stops the movement
 * If the move threshold was not reached, a click event is triggered
 *    otherwise a animation is launched to simulate inertia
 * @param {MouseEvent|Touch} evt
 * @private
 */
PhotoSphereViewer.prototype._stopMove = function(evt) {
  if (this.prop.moving) {
    // move threshold to trigger a click
    if (Math.abs(evt.clientX - this.prop.start_mouse_x) < PhotoSphereViewer.MOVE_THRESHOLD && Math.abs(evt.clientY - this.prop.start_mouse_y) < PhotoSphereViewer.MOVE_THRESHOLD) {
      this._click(evt);
      this.prop.moving = false;
    }
    // inertia animation
    else if (this.config.move_inertia) {
      this._logMouseMove(evt);
      this._stopMoveInertia(evt);
    }
    else {
      this.prop.moving = false;
    }
  }

  this.prop.mouse_history.length = 0;
  this.prop.zooming = false;
};

/**
 * Performs an animation to simulate inertia when stop moving
 * @param {MouseEvent|Touch} evt
 * @private
 */
PhotoSphereViewer.prototype._stopMoveInertia = function(evt) {
  var self = this;

  var direction = {
    x: evt.clientX - this.prop.mouse_history[0][1],
    y: evt.clientY - this.prop.mouse_history[0][2]
  };

  var norm = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

  this.prop.animation_promise = PSVUtils.animation({
    properties: {
      clientX: { start: evt.clientX, end: evt.clientX + direction.x },
      clientY: { start: evt.clientY, end: evt.clientY + direction.y }
    },
    duration: norm * PhotoSphereViewer.INERTIA_WINDOW / 100,
    easing: 'outCirc',
    onTick: function(properties) {
      self._move(properties);
    },
    onCancel: function() {
      self.prop.moving = false;
    },
    onDone: function() {
      self.prop.moving = false;
    }
  });
};

/**
 * Trigger an event with all coordinates when a simple click is performed
 * @param {MouseEvent|Touch} evt
 * @private
 */
PhotoSphereViewer.prototype._click = function(evt) {
  var boundingRect = this.container.getBoundingClientRect();

  var data = {
    target: evt.target,
    client_x: evt.clientX,
    client_y: evt.clientY,
    viewer_x: parseInt(evt.clientX - boundingRect.left),
    viewer_y: parseInt(evt.clientY - boundingRect.top)
  };

  var intersect = this.viewerCoordsToVector3(data.viewer_x, data.viewer_y);

  if (intersect) {
    var sphericalCoords = this.vector3ToSphericalCoords(intersect);

    data.longitude = sphericalCoords.longitude;
    data.latitude = sphericalCoords.latitude;

    var textureCoords = this.sphericalCoordsToTextureCoords(data.longitude, data.latitude);

    data.texture_x = textureCoords.x;
    data.texture_y = textureCoords.y;

    this.trigger('click', data);
  }
};

/**
 * The user moves the image
 * @param {MouseEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onMouseMove = function(evt) {
  if (evt.buttons !== 0) {
    evt.preventDefault();
    this._move(evt);
  }
};

/**
 * The user moves the image (touch version)
 * @param {TouchEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onTouchMove = function(evt) {
  if (evt.touches.length === 1) {
    evt.preventDefault();
    this._move(evt.touches[0]);
  }
  else if (evt.touches.length === 2) {
    evt.preventDefault();
    this._zoom(evt);
  }
};

/**
 * Performs movement
 * @param {MouseEvent|Touch} evt
 * @private
 */
PhotoSphereViewer.prototype._move = function(evt) {
  if (this.prop.moving) {
    var x = parseInt(evt.clientX);
    var y = parseInt(evt.clientY);

    this.rotate({
      longitude: this.prop.longitude - (x - this.prop.mouse_x) / this.prop.size.width * this.prop.move_speed * this.prop.hFov,
      latitude: this.prop.latitude + (y - this.prop.mouse_y) / this.prop.size.height * this.prop.move_speed * this.prop.vFov
    });

    this.prop.mouse_x = x;
    this.prop.mouse_y = y;

    this._logMouseMove(evt);
  }
};

/**
 * Zoom
 * @param {TouchEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._zoom = function(evt) {
  if (this.prop.zooming) {
    var t = [
      { x: parseInt(evt.touches[0].clientX), y: parseInt(evt.touches[0].clientY) },
      { x: parseInt(evt.touches[1].clientX), y: parseInt(evt.touches[1].clientY) }
    ];

    var p = Math.sqrt(Math.pow(t[0].x - t[1].x, 2) + Math.pow(t[0].y - t[1].y, 2));
    var delta = 80 * (p - this.prop.pinch_dist) / this.prop.size.width;

    this.zoom(this.prop.zoom_lvl + delta);

    this.prop.pinch_dist = p;
  }
};

/**
 * The user wants to zoom (wheel version)
 * @param {MouseWheelEvent} evt
 * @private
 */
PhotoSphereViewer.prototype._onMouseWheel = function(evt) {
  evt.preventDefault();
  evt.stopPropagation();

  var delta = evt.deltaY !== undefined ? -evt.deltaY : (evt.wheelDelta !== undefined ? evt.wheelDelta : -evt.detail);

  if (delta !== 0) {
    var direction = parseInt(delta / Math.abs(delta));
    this.zoom(this.prop.zoom_lvl + direction);
  }
};

/**
 * Fullscreen state has changed
 * @private
 */
PhotoSphereViewer.prototype._fullscreenToggled = function() {
  var enabled = this.isFullscreenEnabled();

  if (this.config.keyboard) {
    if (enabled) {
      this.startKeyboardControl();
    }
    else {
      this.stopKeyboardControl();
    }
  }

  this.trigger('fullscreen-updated', enabled);
};

/**
 * Store each mouse position during a mouse move
 * Positions older than "INERTIA_WINDOW" are removed
 * Positions before a pause of "INERTIA_WINDOW" / 10 are removed
 * @param {MouseEvent|Touch} evt
 * @private
 */
PhotoSphereViewer.prototype._logMouseMove = function(evt) {
  var now = Date.now();
  this.prop.mouse_history.push([now, evt.clientX, evt.clientY]);

  var previous = null;

  for (var i = 0; i < this.prop.mouse_history.length;) {
    if (this.prop.mouse_history[0][i] < now - PhotoSphereViewer.INERTIA_WINDOW) {
      this.prop.mouse_history.splice(i, 1);
    }
    else if (previous && this.prop.mouse_history[0][i] - previous > PhotoSphereViewer.INERTIA_WINDOW / 10) {
      this.prop.mouse_history.splice(0, i);
      i = 0;
      previous = this.prop.mouse_history[0][i];
    }
    else {
      i++;
      previous = this.prop.mouse_history[0][i];
    }
  }
};



/**
 * Starts to load the panorama
 */
PhotoSphereViewer.prototype.load = function() {
  if (!this.config.panorama) {
    throw new PSVError('No value given for panorama.');
  }

  this.setPanorama(this.config.panorama, false);
};

/**
 * Returns teh current position on the camera
 * @returns {{longitude: float, latitude: float}}
 */
PhotoSphereViewer.prototype.getPosition = function() {
  return {
    longitude: this.prop.longitude,
    latitude: this.prop.latitude
  };
};

/**
 * Returns the current zoom level
 * @returns {float}
 */
PhotoSphereViewer.prototype.getZoomLevel = function() {
  return this.prop.zoom_lvl;
};

/**
 * Returns the current viewer size
 * @returns {{width: int, height: int}}
 */
PhotoSphereViewer.prototype.getSize = function() {
  return {
    width: this.prop.size.width,
    height: this.prop.size.height
  };
};

/**
 * Check if the automatic rotation is enabled
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isAutorotateEnabled = function() {
  return !!this.prop.autorotate_reqid;
};

/**
 * Check if the gyroscope is enabled
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isGyroscopeEnabled = function() {
  return !!this.prop.orientation_reqid;
};

/**
 * Check if the viewer is in fullscreen
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isFullscreenEnabled = function() {
  return PSVUtils.isFullscreenEnabled(this.container);
};

/**
 * Performs a render
 * @param {boolean} [updateDirection=true] - should update camera direction
 */
PhotoSphereViewer.prototype.render = function(updateDirection) {
  if (updateDirection !== false) {
    this.prop.direction = this.sphericalCoordsToVector3(this.prop.longitude, this.prop.latitude);

    if (this.config.fisheye) {
      this.prop.direction.multiplyScalar(this.config.fisheye / 2);
      this.camera.position.copy(this.prop.direction).negate();
    }

    this.camera.lookAt(this.prop.direction);
    // this.camera.rotation.z = 0;
  }

  this.camera.aspect = this.prop.aspect;
  this.camera.fov = this.prop.vFov;
  this.camera.updateProjectionMatrix();

  if (this.composer) {
    this.composer.render();
  }
  else {
    this.renderer.render(this.scene, this.camera);
  }

  this.trigger('render');
};

/**
 * Destroys the viewer
 */
PhotoSphereViewer.prototype.destroy = function() {
  this.stopAll();
  this.stopKeyboardControl();

  if (this.isFullscreenEnabled()) {
    PSVUtils.exitFullscreen();
  }

  // remove listeners
  window.removeEventListener('resize', this);
  document.removeEventListener(PhotoSphereViewer.SYSTEM.fullscreenEvent, this);

  if (this.config.mousemove) {
    this.hud.container.removeEventListener('mousedown', this);
    this.hud.container.removeEventListener('touchstart', this);
    window.removeEventListener('mouseup', this);
    window.removeEventListener('touchend', this);
    this.hud.container.removeEventListener('mousemove', this);
    this.hud.container.removeEventListener('touchmove', this);
  }

  if (this.config.mousewheel) {
    this.hud.container.removeEventListener(PhotoSphereViewer.SYSTEM.mouseWheelEvent, this);
  }

  // destroy components
  if (this.tooltip) this.tooltip.destroy();
  if (this.hud) this.hud.destroy();
  if (this.loader) this.loader.destroy();
  if (this.navbar) this.navbar.destroy();
  if (this.panel) this.panel.destroy();
  if (this.doControls) this.doControls.disconnect();

  // destroy ThreeJS view
  if (this.scene) {
    this.scene.remove(this.camera);
    this.scene.remove(this.mesh);
  }

  if (this.mesh) {
    this.mesh.geometry.dispose();
    this.mesh.geometry = null;
    this.mesh.material.map.dispose();
    this.mesh.material.map = null;
    this.mesh.material.dispose();
    this.mesh.material = null;
  }

  // remove container
  if (this.canvas_container) {
    this.container.removeChild(this.canvas_container);
  }
  this.parent.removeChild(this.container);

  delete this.parent.photoSphereViewer;

  // clean references
  delete this.parent;
  delete this.container;
  delete this.loader;
  delete this.navbar;
  delete this.hud;
  delete this.panel;
  delete this.tooltip;
  delete this.canvas_container;
  delete this.renderer;
  delete this.composer;
  delete this.scene;
  delete this.camera;
  delete this.mesh;
  delete this.doControls;
  delete this.raycaster;
  delete this.passes;
  delete this.config;
};

/**
 * Load a panorama file
 * If the "position" is not defined the camera will not move and the ongoing animation will continue
 * "config.transition" must be configured for "transition" to be taken in account
 * @param {string} path - URL of the new panorama file
 * @param {Object} [position] - latitude & longitude or x & y
 * @param {boolean} [transition=false]
 * @returns {promise}
 */
PhotoSphereViewer.prototype.setPanorama = function(path, position, transition) {
  if (typeof position == 'boolean') {
    transition = position;
    position = undefined;
  }

  if (position) {
    this.cleanPosition(position);

    this.stopAll();
  }

  this.config.panorama = path;

  var self = this;

  if (!transition || !this.config.transition || !this.scene) {
    this.loader = new PSVLoader(this);

    return this._loadTexture()
      .then(this._setTexture.bind(this))
      .then(function() {
        if (self.loader) {
          self.loader.destroy();
          self.loader = null;
        }

        if (position) {
          self.rotate(position);
        }
        else {
          self.render();
        }
      })
      .rethrow();
  }
  else {
    if (this.config.transition.loader) {
      this.loader = new PSVLoader(this);
    }

    return this._loadTexture()
      .then(function(texture) {
        if (self.loader) {
          self.loader.destroy();
          self.loader = null;
        }

        return self._transition(texture, position);
      })
      .rethrow();
  }
};

/**
 * Stops all current animations
 */
PhotoSphereViewer.prototype.stopAll = function() {
  this.stopAutorotate();
  this.stopAnimation();
  this.stopGyroscopeControl();
};

/**
 * Starts the autorotate animation
 */
PhotoSphereViewer.prototype.startAutorotate = function() {
  this.stopAll();

  var self = this;
  var last = null;
  var elapsed = null;

  (function run(timestamp) {
    if (timestamp) {
      elapsed = last === null ? 0 : timestamp - last;
      last = timestamp;

      self.rotate({
        longitude: self.prop.longitude + self.config.anim_speed * elapsed / 1000,
        latitude: self.prop.latitude - (self.prop.latitude - self.config.anim_lat) / 200
      });
    }

    self.prop.autorotate_reqid = window.requestAnimationFrame(run);
  }(null));

  this.trigger('autorotate', true);
};

/**
 * Stops the autorotate animation
 */
PhotoSphereViewer.prototype.stopAutorotate = function() {
  if (this.prop.start_timeout) {
    window.clearTimeout(this.prop.start_timeout);
    this.prop.start_timeout = null;
  }

  if (this.prop.autorotate_reqid) {
    window.cancelAnimationFrame(this.prop.autorotate_reqid);
    this.prop.autorotate_reqid = null;

    this.trigger('autorotate', false);
  }
};

/**
 * Launches/stops the autorotate animation
 */
PhotoSphereViewer.prototype.toggleAutorotate = function() {
  if (this.isAutorotateEnabled()) {
    this.stopAutorotate();
  }
  else {
    this.startAutorotate();
  }
};

/**
 * Starts the gyroscope interaction
 */
PhotoSphereViewer.prototype.startGyroscopeControl = function() {
  if (!this.config.gyroscope) {
    console.warn('PhotoSphereViewer: gyroscope disabled');
    return;
  }

  this.stopAll();

  var self = this;

  (function run() {
    self.doControls.update();
    self.prop.direction = self.camera.getWorldDirection();

    var sphericalCoords = self.vector3ToSphericalCoords(self.prop.direction);
    self.prop.longitude = sphericalCoords.longitude;
    self.prop.latitude = sphericalCoords.latitude;

    self.render(false);

    self.prop.orientation_reqid = window.requestAnimationFrame(run);
  }());

  this.trigger('gyroscope-updated', true);
};

/**
 * Stops the gyroscope interaction
 */
PhotoSphereViewer.prototype.stopGyroscopeControl = function() {
  if (this.prop.orientation_reqid) {
    window.cancelAnimationFrame(this.prop.orientation_reqid);
    this.prop.orientation_reqid = null;

    this.trigger('gyroscope-updated', false);

    this.render();
  }
};

/**
 * Toggles the gyroscope interaction
 */
PhotoSphereViewer.prototype.toggleGyroscopeControl = function() {
  if (this.isGyroscopeEnabled()) {
    this.stopGyroscopeControl();
  }
  else {
    this.startGyroscopeControl();
  }
};

/**
 * Rotate the camera
 * @param {object} position - latitude & longitude or x & y
 * @param {boolean} [render=true]
 */
PhotoSphereViewer.prototype.rotate = function(position, render) {
  this.cleanPosition(position);
  this.applyRanges(position);

  this.prop.longitude = position.longitude;
  this.prop.latitude = position.latitude;

  if (render !== false && this.renderer) {
    this.render();

    this.trigger('position-updated', this.getPosition());
  }
};

/**
 * Rotate the camera with animation
 * @param {object} position - latitude & longitude or x & y
 * @param {string|int} duration - animation speed (per spec) or duration (milliseconds)
 */
PhotoSphereViewer.prototype.animate = function(position, duration) {
  this.stopAll();

  if (!duration) {
    this.rotate(position);
    return;
  }

  this.cleanPosition(position);
  this.applyRanges(position);

  if (!duration && typeof duration != 'number') {
    // desired radial speed
    duration = duration ? PSVUtils.parseSpeed(duration) : this.config.anim_speed;
    // get the angle between current position and target
    var angle = Math.acos(
      Math.cos(this.prop.latitude) * Math.cos(position.latitude) * Math.cos(this.prop.longitude - position.longitude) +
      Math.sin(this.prop.latitude) * Math.sin(position.latitude)
    );
    // compute duration
    duration = angle / duration * 1000;
  }

  // longitude offset for shortest arc
  var tOffset = this.getShortestArc(this.prop.longitude, position.longitude);

  this.prop.animation_promise = PSVUtils.animation({
    properties: {
      longitude: { start: this.prop.longitude, end: this.prop.longitude + tOffset },
      latitude: { start: this.prop.latitude, end: position.latitude }
    },
    duration: duration,
    easing: 'inOutSine',
    onTick: this.rotate.bind(this)
  });
};

/**
 * Stop the ongoing animation
 */
PhotoSphereViewer.prototype.stopAnimation = function() {
  if (this.prop.animation_promise) {
    this.prop.animation_promise.cancel();
    this.prop.animation_promise = null;
  }
};

/**
 * Zoom
 * @param {int} level
 * @param {boolean} [render=true]
 */
PhotoSphereViewer.prototype.zoom = function(level, render) {
  this.prop.zoom_lvl = PSVUtils.stayBetween(Math.round(level), 0, 100);
  this.prop.vFov = this.config.max_fov + (this.prop.zoom_lvl / 100) * (this.config.min_fov - this.config.max_fov);
  this.prop.hFov = 2 * Math.atan(Math.tan(this.prop.vFov * Math.PI / 180 / 2) * this.prop.aspect) * 180 / Math.PI;

  if (render !== false && this.renderer) {
    this.render();

    this.trigger('zoom-updated', this.getZoomLevel());
  }
};

/**
 * Zoom in
 */
PhotoSphereViewer.prototype.zoomIn = function() {
  if (this.prop.zoom_lvl < 100) {
    this.zoom(this.prop.zoom_lvl + 1);
  }
};

/**
 * Zoom out
 */
PhotoSphereViewer.prototype.zoomOut = function() {
  if (this.prop.zoom_lvl > 0) {
    this.zoom(this.prop.zoom_lvl - 1);
  }
};

/**
 * Enables/disables fullscreen
 */
PhotoSphereViewer.prototype.toggleFullscreen = function() {
  if (!this.isFullscreenEnabled()) {
    PSVUtils.requestFullscreen(this.container);
  }
  else {
    PSVUtils.exitFullscreen();
  }
};

/**
 * Starts listening keyboard events
 */
PhotoSphereViewer.prototype.startKeyboardControl = function() {
  window.addEventListener('keydown', this);
};

/**
 * Stops listening keyboard events
 */
PhotoSphereViewer.prototype.stopKeyboardControl = function() {
  window.removeEventListener('keydown', this);
};

/**
 * Manually preload a panorama image (without showing it) and save it into internal cache.
 * @param {String} pano - the file path
 * @param {Function} callback - Progress callback, will receive the percentage as argument.
 * @return {promise|false}
 */
PhotoSphereViewer.prototype.preloadPano = function(pano, callback) {
  if (false === this.config.caching.enabled) {
    console.warn('The cache is disabled. Please use caching.enabled: true.');
    return false;
  }
  var progressCallback = callback || null;
  return this._loadTexture(pano, progressCallback);
};

/**
 * Remove a panorama image from the cache.
 * @param {string} the file path
 * @return {Boolean}
 */
PhotoSphereViewer.prototype.clearCachedPanoramas = function(pano) {
  if (false === this.config.caching.enabled) {
    console.warn('The cache is disabled.');
    return true;
  }
  return this._clearTexture(pano);
};

/**
 * Return true if the panorama is present in the cache.
 * @param {string} the panorama file path.
 * @return {Boolean} True if the panorama is fully loaded, false otherwise.
 */
PhotoSphereViewer.prototype.isPanoCached = function(pano) {
  if ('undefined' === typeof this.prop.cache.items[pano]) {
    return false;
  }
  return true;
};


/**
 * Return an estimated size of the cached panoramas.
 * @return {integer} the aproximative cache size.
 */
PhotoSphereViewer.prototype.getCacheSize = function() {
  return this.prop.cache.registry.length;
};

/**
 * Return an estimated size of the cached panoramas.
 * @return {integer} the aproximative cache size.
 */
PhotoSphereViewer.prototype.getCache = function() {
  return this.prop.cache;
};


/**
 * Init the global SYSTEM var with information generic support information
 */
PhotoSphereViewer.loadSystem = function() {
  var S = PhotoSphereViewer.SYSTEM;
  S.loaded = true;
  S.pixelRatio = window.devicePixelRatio || 1;
  S.isWebGLSupported = PSVUtils.isWebGLSupported();
  S.isCanvasSupported = PSVUtils.isCanvasSupported();
  S.maxTextureWidth = S.isWebGLSupported ? PSVUtils.getMaxTextureWidth() : 4096;
  S.mouseWheelEvent = PSVUtils.mouseWheelEvent();
  S.fullscreenEvent = PSVUtils.fullscreenEvent();
  S.deviceOrientationSupported = D();

  window.addEventListener('deviceorientation', PhotoSphereViewer.deviceOrientationListener, false);
};

/**
 * Resolve or reject SYSTEM.deviceOrientationSupported
 * We can only be sure device orientation is supported once received an event with coherent data
 * @param {DeviceOrientationEvent} event
 */
PhotoSphereViewer.deviceOrientationListener = function(event) {
  if (event.alpha !== null) {
    PhotoSphereViewer.SYSTEM.deviceOrientationSupported.resolve();
  }
  else {
    PhotoSphereViewer.SYSTEM.deviceOrientationSupported.reject();
  }

  window.removeEventListener('deviceorientation', PhotoSphereViewer.deviceOrientationListener);
};

/**
 * Sets the viewer size
 * @param {object} size
 * @private
 */
PhotoSphereViewer.prototype._setViewerSize = function(size) {
  ['width', 'height'].forEach(function(dim) {
    if (size[dim]) {
      if (/^[0-9.]+$/.test(size[dim])) size[dim] += 'px';
      this.parent.style[dim] = size[dim];
    }
  }, this);
};

/**
 * Converts pixel texture coordinates to spherical radians coordinates
 * @param {int} x
 * @param {int} y
 * @returns {{longitude: float, latitude: float}}
 */
PhotoSphereViewer.prototype.textureCoordsToSphericalCoords = function(x, y) {
  var relativeX = (x + this.prop.pano_data.cropped_x) / this.prop.pano_data.full_width * PSVUtils.TwoPI;
  var relativeY = (y + this.prop.pano_data.cropped_y) / this.prop.pano_data.full_height * Math.PI;

  return {
    longitude: relativeX >= Math.PI ? relativeX - Math.PI : relativeX + Math.PI,
    latitude: PSVUtils.HalfPI - relativeY
  };
};

/**
 * Converts spherical radians coordinates to pixel texture coordinates
 * @param {float} longitude
 * @param {float} latitude
 * @returns {{x: int, y: int}}
 */
PhotoSphereViewer.prototype.sphericalCoordsToTextureCoords = function(longitude, latitude) {
  var relativeLong = longitude / PSVUtils.TwoPI * this.prop.pano_data.full_width;
  var relativeLat = latitude / Math.PI * this.prop.pano_data.full_height;

  return {
    x: parseInt(longitude < Math.PI ? relativeLong + this.prop.pano_data.full_width / 2 : relativeLong - this.prop.pano_data.full_width / 2) - this.prop.pano_data.cropped_x,
    y: parseInt(this.prop.pano_data.full_height / 2 - relativeLat) - this.prop.pano_data.cropped_y
  };
};

/**
 * Converts spherical radians coordinates to a THREE.Vector3
 * @param {float} longitude
 * @param {float} latitude
 * @returns {THREE.Vector3}
 */
PhotoSphereViewer.prototype.sphericalCoordsToVector3 = function(longitude, latitude) {
  return new THREE.Vector3(
    PhotoSphereViewer.SPHERE_RADIUS * -Math.cos(latitude) * Math.sin(longitude),
    PhotoSphereViewer.SPHERE_RADIUS * Math.sin(latitude),
    PhotoSphereViewer.SPHERE_RADIUS * Math.cos(latitude) * Math.cos(longitude)
  );
};

/**
 * Converts a THREE.Vector3 to spherical radians coordinates
 * @param {THREE.Vector3} vector
 * @returns {{longitude: float, latitude: float}}
 */
PhotoSphereViewer.prototype.vector3ToSphericalCoords = function(vector) {
  var phi = Math.acos(vector.y / Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z));
  var theta = Math.atan2(vector.x, vector.z);

  return {
    longitude: theta < 0 ? -theta : PSVUtils.TwoPI - theta,
    latitude: PSVUtils.HalfPI - phi
  };
};

/**
 * Converts position on the viewer to a THREE.Vector3
 * @param {int} viewer_x
 * @param {int} viewer_y
 * @returns {THREE.Vector3}
 */
PhotoSphereViewer.prototype.viewerCoordsToVector3 = function(viewer_x, viewer_y) {
  var screen = new THREE.Vector2(
    2 * viewer_x / this.prop.size.width - 1,
    -2 * viewer_y / this.prop.size.height + 1
  );

  this.raycaster.setFromCamera(screen, this.camera);

  var intersects = this.raycaster.intersectObjects(this.scene.children);

  if (intersects.length === 1) {
    return intersects[0].point;
  }
  else {
    return null;
  }
};

/**
 * Converts a THREE.Vector3 to position on the viewer
 * @param {THREE.Vector3} vector
 * @returns {{top: int, left: int}}
 */
PhotoSphereViewer.prototype.vector3ToViewerCoords = function(vector) {
  vector = vector.clone();
  vector.project(this.camera);

  return {
    top: parseInt((1 - vector.y) / 2 * this.prop.size.height),
    left: parseInt((vector.x + 1) / 2 * this.prop.size.width)
  };
};

/**
 * Converts x/y to latitude/longitude if present and ensure boundaries
 * @param {object} position - latitude & longitude or x & y
 */
PhotoSphereViewer.prototype.cleanPosition = function(position) {
  if (position.hasOwnProperty('x') && position.hasOwnProperty('y')) {
    var sphericalCoords = this.textureCoordsToSphericalCoords(position.x, position.y);
    position.longitude = sphericalCoords.longitude;
    position.latitude = sphericalCoords.latitude;
  }

  position.longitude = PSVUtils.parseAngle(position.longitude);
  position.latitude = PSVUtils.stayBetween(PSVUtils.parseAngle(position.latitude, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
};

/**
 * Apply "longitude_range" and "latitude_range"
 * @param {{latitude: float, longitude: float}} position
 */
PhotoSphereViewer.prototype.applyRanges = function(position) {
  var range, offset;

  if (this.config.longitude_range) {
    range = PSVUtils.clone(this.config.longitude_range);
    offset = this.prop.hFov / 180 * Math.PI / 2;

    range[0] = PSVUtils.parseAngle(range[0] + offset);
    range[1] = PSVUtils.parseAngle(range[1] - offset);

    if (range[0] > range[1]) { // when the range cross longitude 0
      if (position.longitude > range[1] && position.longitude < range[0]) {
        if (position.longitude > (range[0] / 2 + range[1] / 2)) { // detect which side we are closer too
          position.longitude = range[0];
          this.trigger('_side-reached', 'left');
        }
        else {
          position.longitude = range[1];
          this.trigger('_side-reached', 'right');
        }
      }
    }
    else {
      if (position.longitude < range[0]) {
        position.longitude = range[0];
        this.trigger('_side-reached', 'left');
      }
      else if (position.longitude > range[1]) {
        position.longitude = range[1];
        this.trigger('_side-reached', 'right');
      }
    }
  }

  if (this.config.latitude_range) {
    range = PSVUtils.clone(this.config.latitude_range);
    offset = this.prop.vFov / 180 * Math.PI / 2;

    range[0] = PSVUtils.parseAngle(range[0] + offset, -Math.PI);
    range[1] = PSVUtils.parseAngle(range[1] - offset, -Math.PI);

    if (position.latitude < range[0]) {
      position.latitude = range[0];
      this.trigger('_side-reached', 'bottom');
    }
    else if (position.latitude > range[1]) {
      position.latitude = range[1];
      this.trigger('_side-reached', 'top');
    }
  }
};

/**
 * Compute the shortest offset between two longitudes
 * @param {float} from
 * @param {float} to
 * @returns {float}
 */
PhotoSphereViewer.prototype.getShortestArc = function(from, to) {
  var tCandidates = [
    0, // direct
    PSVUtils.TwoPI, // clock-wise cross zero
    -PSVUtils.TwoPI // counter-clock-wise cross zero
  ];

  return tCandidates.reduce(function(value, candidate) {
    candidate = to - from + candidate;
    return Math.abs(candidate) < Math.abs(value) ? candidate : value;
  }, Infinity);
};


/**
 * Base sub-component class
 * @param {PhotoSphereViewer | PSVComponent} parent - the parent with a "container" property
 * @constructor
 */
function PSVComponent(parent) {
  this.psv = parent instanceof PhotoSphereViewer ? parent : parent.psv;
  this.parent = parent;
  this.container = null;

  // expose some methods to the viewer
  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      this.psv[method] = this[method].bind(this);
    }, this);
  }
}

/**
 * Creates the component
 */
PSVComponent.prototype.create = function() {
  this.container = document.createElement('div');

  if (this.constructor.className) {
    this.container.className = this.constructor.className;
  }

  this.parent.container.appendChild(this.container);
};

/**
 * Destroys the component
 */
PSVComponent.prototype.destroy = function() {
  this.parent.container.removeChild(this.container);

  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      delete this.psv[method];
    }, this);
  }

  delete this.container;
  delete this.psv;
  delete this.parent;
};

/**
 * Hides the component
 */
PSVComponent.prototype.hide = function() {
  this.container.style.display = 'none';
};

/**
 * Restores component visibility
 */
PSVComponent.prototype.show = function() {
  this.container.style.display = null;
};


/**
 * HUD class
 * @param {PhotoSphereViewer} psv
 * @constructor
 */
function PSVHUD(psv) {
  PSVComponent.call(this, psv);

  this.$svg = null;
  this.markers = {};
  this.currentMarker = null;
  this.hoveringMarker = null;

  this.create();
}

PSVHUD.prototype = Object.create(PSVComponent.prototype);
PSVHUD.prototype.constructor = PSVHUD;

PSVHUD.className = 'psv-hud';
PSVHUD.publicMethods = [
  'addMarker',
  'removeMarker',
  'updateMarker',
  'clearMarkers',
  'getMarker',
  'getCurrentMarker',
  'gotoMarker',
  'hideMarker',
  'showMarker',
  'toggleMarker'
];

PSVHUD.svgNS = 'http://www.w3.org/2000/svg';

/**
 * Creates the HUD
 */
PSVHUD.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.$svg = document.createElementNS(PSVHUD.svgNS, 'svg');
  this.$svg.setAttribute('class', 'psv-hud-svg-container');
  this.container.appendChild(this.$svg);

  // Markers events via delegation
  this.container.addEventListener('mouseenter', this, true);
  this.container.addEventListener('mouseleave', this, true);
  this.container.addEventListener('mousemove', this, true);

  // Viewer events
  this.psv.on('click', this);
  this.psv.on('render', this);
};

/**
 * Destroys the HUD
 */
PSVHUD.prototype.destroy = function() {
  this.clearMarkers(false);

  this.container.removeEventListener('mouseenter', this);
  this.container.removeEventListener('mouseleave', this);
  this.container.removeEventListener('mousemove', this);

  this.psv.off('click', this);
  this.psv.off('render', this);

  delete this.$svg;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVHUD.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'mouseenter':  this._onMouseEnter(e);        break;
    case 'mouseleave':  this._onMouseLeave(e);        break;
    case 'mousemove':   this._onMouseMove(e);         break;
    case 'click':       this._onClick(e.args[0], e);  break;
    case 'render':      this.updatePositions();       break;
    // @formatter:on
  }
};

/**
 * Add a new marker to HUD
 * @param {Object} properties
 * @param {boolean} [render=true]
 * @returns {PSVMarker}
 */
PSVHUD.prototype.addMarker = function(properties, render) {
  if (!properties.id) {
    throw new PSVError('missing marker id');
  }

  if (this.markers[properties.id]) {
    throw new PSVError('marker "' + properties.id + '" already exists');
  }

  var marker = new PSVMarker(properties, this.psv);

  if (marker.isNormal()) {
    this.container.appendChild(marker.$el);
  }
  else {
    this.$svg.appendChild(marker.$el);
  }

  this.markers[marker.id] = marker;

  if (render !== false) {
    this.updatePositions();
  }

  return marker;
};

/**
 * Get a marker by it's id or external object
 * @param {*} marker
 * @returns {PSVMarker}
 */
PSVHUD.prototype.getMarker = function(marker) {
  var id = typeof marker === 'object' ? marker.id : marker;

  if (!this.markers[id]) {
    throw new PSVError('cannot find marker "' + id + '"');
  }

  return this.markers[id];
};

/**
 * Get the current selected marker
 * @returns {PSVMarker}
 */
PSVHUD.prototype.getCurrentMarker = function() {
  return this.currentMarker;
};

/**
 * Update a marker
 * @param {*} marker
 * @param {boolean} [render=true]
 * @returns {PSVMarker}
 */
PSVHUD.prototype.updateMarker = function(input, render) {
  var marker = this.getMarker(input);

  marker.update(input);

  if (render !== false) {
    this.updatePositions();
  }

  return marker;
};

/**
 * Remove a marker
 * @param {*} marker
 * @param {boolean} [render=true]
 */
PSVHUD.prototype.removeMarker = function(marker, render) {
  marker = this.getMarker(marker);

  if (marker.isNormal()) {
    this.container.removeChild(marker.$el);
  }
  else {
    this.$svg.removeChild(marker.$el);
  }

  if (this.hoveringMarker == marker) {
    this.psv.tooltip.hideTooltip();
  }

  delete this.markers[marker.id];

  if (render !== false) {
    this.updatePositions();
  }
};

/**
 * Remove all markers
 * @param {boolean} [render=true]
 */
PSVHUD.prototype.clearMarkers = function(render) {
  Object.keys(this.markers).forEach(function(marker) {
    this.removeMarker(marker, false);
  }, this);

  if (render !== false) {
    this.updatePositions();
  }
};

/**
 * Go to a specific marker
 * @param {*} marker
 * @param {string|int} [duration]
 */
PSVHUD.prototype.gotoMarker = function(marker, duration) {
  marker = this.getMarker(marker);
  this.psv.animate(marker, duration);
};

/**
 * Hide a marker
 * @param {*} marker
 */
PSVHUD.prototype.hideMarker = function(marker) {
  this.getMarker(marker).visible = false;
  this.updatePositions();
};

/**
 * Show a marker
 * @param {*} marker
 */
PSVHUD.prototype.showMarker = function(marker) {
  this.getMarker(marker).visible = true;
  this.updatePositions();
};

/**
 * Toggle a marker
 * @param {*} marker
 */
PSVHUD.prototype.toggleMarker = function(marker) {
  this.getMarker(marker).visible ^= true;
  this.updatePositions();
};

/**
 * Update visibility and position of all markers
 */
PSVHUD.prototype.updatePositions = function() {
  var rotation = !this.psv.isGyroscopeEnabled() ? 0 : this.psv.camera.rotation.z / Math.PI * 180;

  for (var id in this.markers) {
    var marker = this.markers[id];
    var isVisible = marker.visible;

    if (isVisible && marker.isPolygon()) {
      var positions = this._getPolygonPositions(marker);
      isVisible = positions.length > 2;

      if (isVisible) {
        marker.position2D = this._getPolygonDimensions(marker, positions);

        var points = '';
        positions.forEach(function(pos) {
          points += pos.left + ',' + pos.top + ' ';
        });

        marker.$el.setAttributeNS(null, 'points', points);
      }
    }
    else if (isVisible) {
      var position = this._getMarkerPosition(marker);
      isVisible = this._isMarkerVisible(marker, position);

      if (isVisible) {
        marker.position2D = position;

        marker.$el.style.transform = 'translate3D(' + position.left + 'px, ' + position.top + 'px, ' + '0px)' +
          (!marker.lockRotation && rotation ? ' rotateZ(' + rotation + 'deg)' : '');
      }
    }

    PSVUtils.toggleClass(marker.$el, 'psv-marker--visible', isVisible);
  }
};

/**
 * Determine if a point marker is visible
 * It tests if the point is in the general direction of the camera, then check if it's in the viewport
 * @param {PSVMarker} marker
 * @param {{top: int, left: int}} position
 * @returns {boolean}
 * @private
 */
PSVHUD.prototype._isMarkerVisible = function(marker, position) {
  return marker.position3D.dot(this.psv.prop.direction) > 0 &&
    position.left + marker.width >= 0 &&
    position.left - marker.width <= this.psv.prop.size.width &&
    position.top + marker.height >= 0 &&
    position.top - marker.height <= this.psv.prop.size.height;
};

/**
 * Compute HUD coordinates of a marker
 * @param {PSVMarker} marker
 * @returns {{top: int, left: int}}
 * @private
 */
PSVHUD.prototype._getMarkerPosition = function(marker) {
  if (marker.dynamicSize) {
    // make the marker visible to get it's size
    marker.$el.classList.add('psv-marker--transparent');
    var rect = marker.$el.getBoundingClientRect();
    marker.$el.classList.remove('psv-marker--transparent');

    marker.width = rect.right - rect.left;
    marker.height = rect.bottom - rect.top;
  }

  var position = this.psv.vector3ToViewerCoords(marker.position3D);

  position.top -= marker.height * marker.anchor.top;
  position.left -= marker.width * marker.anchor.left;

  return position;
};

/**
 * Compute HUD coordinates of each point of a polygon
 * It handles points behind the camera by creating intermediary points suitable for the projector
 * @param {PSVMarker} marker
 * @returns {{top: int, left: int}[]}
 * @private
 */
PSVHUD.prototype._getPolygonPositions = function(marker) {
  var nbVectors = marker.positions3D.length;

  // compute if each vector is visible
  var positions3D = marker.positions3D.map(function(vector) {
    return {
      vector: vector,
      visible: vector.dot(this.psv.prop.direction) > 0
    };
  }, this);

  // get pairs of visible/invisible vector for each invisible vector connected to a visible vector
  var toBeComputed = [];
  positions3D.forEach(function(pos, i) {
    if (!pos.visible) {
      var neighbours = [
        i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1],
        i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1]
      ];

      neighbours.forEach(function(neighbour) {
        if (neighbour.visible) {
          toBeComputed.push({
            visible: neighbour,
            invisible: pos,
            index: i
          });
        }
      });
    }
  });

  // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)
  toBeComputed.reverse().forEach(function(pair) {
    positions3D.splice(pair.index, 0, {
      vector: this._getPolygonIntermediaryPoint(pair.visible.vector, pair.invisible.vector),
      visible: true
    });
  }, this);

  // translate vectors to screen pos
  return positions3D
    .filter(function(pos) {
      return pos.visible;
    })
    .map(function(pos) {
      return this.psv.vector3ToViewerCoords(pos.vector);
    }, this);
};

/**
 * Given one point in the same direction of the camera and one point behind the camera,
 * computes an intermediary point on the great circle delimiting the half sphere visible by the camera.
 * The point is shifted by .01 rad because the projector cannot handle points exactly on this circle.
 * @link http://math.stackexchange.com/a/1730410/327208
 *
 * @param P1 {THREE.Vector3}
 * @param P2 {THREE.Vector3}
 * @returns {THREE.Vector3}
 * @private
 */
PSVHUD.prototype._getPolygonIntermediaryPoint = function(P1, P2) {
  var C = this.psv.prop.direction.clone().normalize();
  var N = new THREE.Vector3().crossVectors(P1, P2).normalize();
  var V = new THREE.Vector3().crossVectors(N, P1).normalize();
  var H = new THREE.Vector3().addVectors(P1.clone().multiplyScalar(-C.dot(V)), V.clone().multiplyScalar(C.dot(P1))).normalize();
  var a = new THREE.Vector3().crossVectors(H, C);
  return H.applyAxisAngle(a, 0.01).multiplyScalar(PhotoSphereViewer.SPHERE_RADIUS);
};

/**
 * Compute the boundaries positions of a polygon marker
 * Alters the marker width and height
 * @param {PSVMarker} marker
 * @param {{top: int, left: int}[]} positions
 * @returns {{top: int, left: int}}
 * @private
 */
PSVHUD.prototype._getPolygonDimensions = function(marker, positions) {
  var minX = +Infinity;
  var minY = +Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;

  positions.forEach(function(pos) {
    minX = Math.min(minX, pos.left);
    minY = Math.min(minY, pos.top);
    maxX = Math.max(maxX, pos.left);
    maxY = Math.max(maxY, pos.top);
  });

  marker.width = maxX - minX;
  marker.height = maxY - minY;

  return {
    top: minY,
    left: minX
  };
};

/**
 * The mouse enters a point marker : show the tooltip
 * @param {MouseEvent} e
 * @private
 */
PSVHUD.prototype._onMouseEnter = function(e) {
  var marker;
  if (e.target && (marker = e.target.psvMarker) && marker.tooltip && !marker.isPolygon()) {
    this.hoveringMarker = marker;

    this.psv.tooltip.showTooltip({
      content: marker.tooltip.content,
      position: marker.tooltip.position,
      top: marker.position2D.top,
      left: marker.position2D.left,
      marker: marker
    });
  }
};

/**
 * The mouse leaves a marker : hide the tooltip
 * @param {MouseEvent} e
 * @private
 */
PSVHUD.prototype._onMouseLeave = function(e) {
  var marker;
  if (e.target && (marker = e.target.psvMarker)) {
    // do not hide if we enter the tooltip itself while hovering a polygon
    if (marker.isPolygon() && e.relatedTarget && PSVUtils.hasParent(e.relatedTarget, this.psv.tooltip.container)) {
      return;
    }

    this.hoveringMarker = null;

    this.psv.tooltip.hideTooltip();
  }
};

/**
 * The mouse hovers a polygon marker, the tooltip follow the cursor.
 * @param {MouseEvent} e
 * @private
 */
PSVHUD.prototype._onMouseMove = function(e) {
  if (!this.psv.prop.moving) {
    var marker;
    // do not hide if we enter the tooltip while hovering a polygon
    if (e.target && (marker = e.target.psvMarker) && marker.tooltip && marker.isPolygon() ||
      e.target && PSVUtils.hasParent(e.target, this.psv.tooltip.container) && (marker = this.hoveringMarker)) {

      this.hoveringMarker = marker;

      var boundingRect = this.psv.container.getBoundingClientRect();

      // simulate a marker with the size of the tooltip arrow to separate it from the cursor
      this.psv.tooltip.showTooltip({
        content: marker.tooltip.content,
        position: marker.tooltip.position,
        top: e.clientY - boundingRect.top - this.psv.config.tooltip.arrow_size / 2,
        left: e.clientX - boundingRect.left - this.psv.config.tooltip.arrow_size,
        marker: {
          width: this.psv.config.tooltip.arrow_size * 2,
          height: this.psv.config.tooltip.arrow_size * 2
        }
      });
    }
    else if (this.hoveringMarker && this.hoveringMarker.isPolygon()) {
      this.psv.tooltip.hideTooltip();
    }
  }
};

/**
 * The mouse button is release : show/hide the panel if threshold was not reached, or do nothing
 * @param {Object} data
 * @param {Event} e
 * @private
 */
PSVHUD.prototype._onClick = function(data, e) {
  var marker;
  if (data.target && (marker = PSVUtils.getClosest(data.target, '.psv-marker')) && marker.psvMarker) {
    this.currentMarker = marker.psvMarker;
    this.psv.trigger('select-marker', marker.psvMarker);

    if (this.psv.config.click_event_on_marker) {
      // add the marker to event data
      data.marker = marker.psvMarker;
    }
    else {
      e.stopPropagation();
    }
  }
  else if (this.currentMarker) {
    this.psv.trigger('unselect-marker', this.currentMarker);
    this.currentMarker = null;
  }

  if (marker && marker.psvMarker && marker.psvMarker.content) {
    this.psv.panel.showPanel(marker.psvMarker.content);
  }
  else if (this.psv.panel.prop.opened) {
    e.stopPropagation();
    this.psv.panel.hidePanel();
  }
};


/**
 * Loader class
 * @param {PhotoSphereViewer} psv
 * @constructor
 */
function PSVLoader(psv) {
  PSVComponent.call(this, psv);

  this.canvas = null;
  this.loader = null;

  this.create();
}

PSVLoader.prototype = Object.create(PSVComponent.prototype);
PSVLoader.prototype.constructor = PSVLoader;

PSVLoader.className = 'psv-loader-container';

/**
 * Creates the loader content
 */
PSVLoader.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.loader = document.createElement('div');
  this.loader.className = 'psv-loader';
  this.container.appendChild(this.loader);

  this.canvas = document.createElement('canvas');
  this.canvas.className = 'psv-loader-canvas';

  this.canvas.width = this.loader.clientWidth;
  this.canvas.height = this.loader.clientWidth;
  this.loader.appendChild(this.canvas);

  this.tickness = (this.loader.offsetWidth - this.loader.clientWidth) / 2;

  var inner;
  if (this.psv.config.loading_img) {
    inner = document.createElement('img');
    inner.className = 'psv-loader-image';
    inner.src = this.psv.config.loading_img;
  }
  else if (this.psv.config.loading_txt) {
    inner = document.createElement('div');
    inner.className = 'psv-loader-text';
    inner.innerHTML = this.psv.config.loading_txt;
  }
  if (inner) {
    var a = Math.round(Math.sqrt(2 * Math.pow(this.canvas.width / 2 - this.tickness / 2, 2)));
    inner.style.maxWidth = a + 'px';
    inner.style.maxHeight = a + 'px';
    this.loader.appendChild(inner);
  }
};

/**
 * Destroys the loader
 */
PSVLoader.prototype.destroy = function() {
  delete this.loader;
  delete this.canvas;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Sets the loader progression
 * @param {int} value - from 0 to 100
 */
PSVLoader.prototype.setProgress = function(value) {
  var context = this.canvas.getContext('2d');

  context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  context.lineWidth = this.tickness;
  context.strokeStyle = PSVUtils.getStyle(this.loader, 'color');

  context.beginPath();
  context.arc(
    this.canvas.width / 2, this.canvas.height / 2,
    this.canvas.width / 2 - this.tickness / 2,
    -Math.PI / 2, value / 100 * 2 * Math.PI - Math.PI / 2
  );
  context.stroke();
};


/**
 * Object representing a marker
 * @param {Object} properties
 * @param {PhotoSphereViewer} psv
 * @constructor
 */
function PSVMarker(properties, psv) {
  if (!properties.id) {
    throw new PSVError('missing marker id');
  }

  if (properties.image && (!properties.width || !properties.height)) {
    throw new PSVError('missing marker width/height');
  }

  if (properties.image || properties.html) {
    if ((!properties.hasOwnProperty('x') || !properties.hasOwnProperty('y')) && (!properties.hasOwnProperty('latitude') || !properties.hasOwnProperty('longitude'))) {
      throw new PSVError('missing marker position, latitude/longitude or x/y');
    }
  }

  // public properties
  this.psv = psv;
  this.visible = true;
  this.lockRotation = false;
  this.dynamicSize = false;

  // private properties
  var _id = properties.id;
  var _type = PSVMarker.getType(properties, false);
  var $el;

  // readonly properties
  Object.defineProperties(this, {
    id: {
      configurable: false,
      enumerable: true,
      get: function() {
        return _id;
      },
      set: function(value) {
      }
    },
    type: {
      configurable: false,
      enumerable: true,
      get: function() {
        return _type;
      },
      set: function(value) {
      }
    },
    $el: {
      configurable: false,
      enumerable: true,
      get: function() {
        return $el;
      },
      set: function(value) {
      }
    },
    _def: {
      configurable: false,
      enumerable: true,
      get: function() {
        return this[_type];
      },
      set: function(value) {
        this[_type] = value;
      }
    }
  });

  // create element
  if (this.isNormal()) {
    $el = document.createElement('div');
  }
  else if (this.isPolygon()) {
    $el = document.createElementNS(PSVHUD.svgNS, 'polygon');
  }
  else {
    $el = document.createElementNS(PSVHUD.svgNS, this.type);
  }

  $el.id = 'psv-marker-' + this.id;
  $el.psvMarker = this;

  this.update(properties);
}

/**
 * Determines the type of a marker by the available properties
 * @param {object} properties
 * @param {boolean} allowNone
 * @returns {string}
 */
PSVMarker.getType = function(properties, allowNone) {
  var definitions = ['image', 'html', 'polygon_px', 'polygon_rad', 'rect', 'circle', 'ellipse', 'path'];

  var found = [];
  definitions.forEach(function(type) {
    if (properties[type]) {
      found.push(type);
    }
  });

  if (found.length === 0 && !allowNone) {
    throw new PSVError('missing marker content, either ' + definitions.join(', '));
  }
  else if (found.length > 1) {
    throw new PSVError('multiple marker content, either ' + definitions.join(', '));
  }

  return found[0];
};

/**
 * Is it a normal marker (image or html)
 * @returns {boolean}
 */
PSVMarker.prototype.isNormal = function() {
  return this.type == 'image' || this.type == 'html';
};

/**
 * Is it a polygon marker
 * @returns {boolean}
 */
PSVMarker.prototype.isPolygon = function() {
  return this.type == 'polygon_px' || this.type == 'polygon_rad';
};

/**
 * Is it an SVG marker
 * @returns {boolean}
 */
PSVMarker.prototype.isSvg = function() {
  return this.type == 'rect' || this.type == 'circle' || this.type == 'ellipse' || this.type == 'path';
};

/**
 * Update the marker with new or current properties
 * @param {object} [properties]
 */
PSVMarker.prototype.update = function(properties) {
  // merge objects
  if (properties && properties !== this) {
    var newType = PSVMarker.getType(properties, true);

    if (newType !== undefined && newType !== this.type) {
      throw new PSVError('cannot change marker type');
    }

    PSVUtils.deepmerge(this, properties);
  }

  // reset CSS class
  if (this.isNormal()) {
    this.$el.setAttribute('class', 'psv-marker psv-marker--normal');
  }
  else {
    this.$el.setAttribute('class', 'psv-marker psv-marker--svg');
  }

  // add CSS classes
  if (this.className) {
    PSVUtils.addClasses(this.$el, this.className);
  }
  if (this.tooltip) {
    this.$el.classList.add('has-tooltip');
    if (typeof this.tooltip === 'string') {
      this.tooltip = { content: this.tooltip };
    }
  }

  // apply style
  if (this.style) {
    PSVUtils.deepmerge(this.$el.style, this.style);
  }

  // parse anchor
  this.anchor = PSVUtils.parsePosition(this.anchor);
  this.$el.style.transformOrigin = this.anchor.left * 100 + '% ' + this.anchor.top * 100 + '%';

  if (this.isNormal()) {
    this._updateNormal();
  }
  else if (this.isPolygon()) {
    this._updatePolygon();
  }
  else {
    this._updateSvg();
  }
};

/**
 * Update a normal marker
 * @private
 */
PSVMarker.prototype._updateNormal = function() {
  if (this.width && this.height) {
    this.$el.style.width = this.width + 'px';
    this.$el.style.height = this.height + 'px';
    this.dynamicSize = false;
  }
  else {
    this.dynamicSize = true;
  }

  if (this.image) {
    this.$el.style.backgroundImage = 'url(' + this.image + ')';
  }
  else {
    this.$el.innerHTML = this.html;
  }

  // convert texture coordinates to spherical coordinates
  this.psv.cleanPosition(this);

  // compute x/y/z position
  this.position3D = this.psv.sphericalCoordsToVector3(this.longitude, this.latitude);
};

/**
 * Update an SVG marker
 * @private
 */
PSVMarker.prototype._updateSvg = function() {
  this.dynamicSize = true;

  // set content
  switch (this.type) {
    case 'rect':
      if (typeof this._def == 'number') {
        this._def = {
          x: 0,
          y: 0,
          width: this._def,
          height: this._def
        };
      }
      else if (Array.isArray(this._def)) {
        this._def = {
          x: 0,
          y: 0,
          width: this._def[0],
          height: this._def[1]
        };
      }
      else {
        this._def.x = this._def.y = 0;
      }
      break;

    case 'circle':
      if (typeof this._def == 'number') {
        this._def = {
          cx: this._def,
          cy: this._def,
          r: this._def
        };
      }
      else if (Array.isArray(this._def)) {
        this._def = {
          cx: this._def[0],
          cy: this._def[0],
          r: this._def[0]
        };
      }
      else {
        this._def.cx = this._def.cy = this._def.r;
      }
      break;

    case 'ellipse':
      if (typeof this._def == 'number') {
        this._def = {
          cx: this._def,
          cy: this._def,
          rx: this._def,
          ry: this._def
        };
      }
      else if (Array.isArray(this._def)) {
        this._def = {
          cx: this._def[0],
          cy: this._def[1],
          rx: this._def[0],
          ry: this._def[1]
        };
      }
      else {
        this._def.cx = this._def.rx;
        this._def.cy = this._def.ry;
      }
      break;

    case 'path':
      if (typeof this._def == 'string') {
        this._def = {
          d: this._def
        };
      }
      break;
  }

  Object.getOwnPropertyNames(this._def).forEach(function(prop) {
    this.$el.setAttributeNS(null, prop, this._def[prop]);
  }, this);

  // set style
  if (this.svgStyle) {
    Object.getOwnPropertyNames(this.svgStyle).forEach(function(prop) {
      this.$el.setAttributeNS(null, prop, this.svgStyle[prop]);
    }, this);
  }
  else {
    this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
  }

  // convert texture coordinates to spherical coordinates
  this.psv.cleanPosition(this);

  // compute x/y/z position
  this.position3D = this.psv.sphericalCoordsToVector3(this.longitude, this.latitude);
};

/**
 * Update a polygon marker
 * @private
 */
PSVMarker.prototype._updatePolygon = function() {
  this.dynamicSize = true;

  // set style
  if (this.svgStyle) {
    Object.getOwnPropertyNames(this.svgStyle).forEach(function(prop) {
      this.$el.setAttributeNS(null, prop, this.svgStyle[prop]);
    }, this);
  }
  else {
    this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
  }

  // fold arrays: [1,2,3,4] => [[1,2],[3,4]]
  [this.polygon_rad, this.polygon_px].forEach(function(polygon) {
    if (polygon && typeof polygon[0] != 'object') {
      for (var i = 0; i < polygon.length; i++) {
        polygon.splice(i, 2, [polygon[i], polygon[i + 1]]);
      }
    }
  });

  // convert texture coordinates to spherical coordinates
  if (this.polygon_px) {
    this.polygon_rad = this.polygon_px.map(function(coord) {
      var sphericalCoords = this.psv.textureCoordsToSphericalCoords(coord[0], coord[1]);
      return [sphericalCoords.longitude, sphericalCoords.latitude];
    }, this);
  }
  // clean angles
  else {
    this.polygon_rad = this.polygon_rad.map(function(coord) {
      return [
        PSVUtils.parseAngle(coord[0]),
        PSVUtils.stayBetween(PSVUtils.parseAngle(coord[1], -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI)
      ];
    });
  }

  // TODO : compute the center of the polygon
  this.longitude = this.polygon_rad[0][0];
  this.latitude = this.polygon_rad[0][1];

  // compute x/y/z positions
  this.positions3D = this.polygon_rad.map(function(coord) {
    return this.psv.sphericalCoordsToVector3(coord[0], coord[1]);
  }, this);
};


/**
 * Navigation bar class
 * @param {PhotoSphereViewer} psv
 * @constructor
 */
function PSVNavBar(psv) {
  PSVComponent.call(this, psv);

  this.config = this.psv.config.navbar;
  this.items = [];

  // all buttons
  if (this.config === true) {
    this.config = PSVUtils.clone(PhotoSphereViewer.DEFAULTS.navbar);
  }
  // space separated list
  else if (typeof this.config == 'string') {
    this.config = this.config.split(' ');
  }
  // migration from object
  else if (!Array.isArray(this.config)) {
    console.warn('PhotoSphereViewer: hashmap form of "navbar" is deprecated, use an array instead.');

    var config = this.config;
    this.config = [];
    for (var key in config) {
      if (config[key]) {
        this.config.push(key);
      }
    }

    this.config.sort(function(a, b) {
      return PhotoSphereViewer.DEFAULTS.navbar.indexOf(a) - PhotoSphereViewer.DEFAULTS.navbar.indexOf(b);
    });
  }

  this.create();
}

PSVNavBar.prototype = Object.create(PSVComponent.prototype);
PSVNavBar.prototype.constructor = PSVNavBar;

PSVNavBar.className = 'psv-navbar psv-navbar--open';
PSVNavBar.publicMethods = ['showNavbar', 'hideNavbar', 'toggleNavbar', 'getNavbarButton'];

/**
 * Creates the navbar
 */
PSVNavBar.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.config.forEach(function(button) {
    if (typeof button == 'object') {
      this.items.push(new PSVNavBarCustomButton(this, button));
    }
    else {
      switch (button) {
        case PSVNavBarAutorotateButton.id:
          this.items.push(new PSVNavBarAutorotateButton(this));
          break;

        case PSVNavBarZoomButton.id:
          this.items.push(new PSVNavBarZoomButton(this));
          break;

        case PSVNavBarDownloadButton.id:
          this.items.push(new PSVNavBarDownloadButton(this));
          break;

        case PSVNavBarMarkersButton.id:
          this.items.push(new PSVNavBarMarkersButton(this));
          break;

        case PSVNavBarFullscreenButton.id:
          this.items.push(new PSVNavBarFullscreenButton(this));
          break;

        case PSVNavBarGyroscopeButton.id:
          if (this.psv.config.gyroscope) {
            this.items.push(new PSVNavBarGyroscopeButton(this));
          }
          break;

        case 'caption':
          this.items.push(new PSVNavBarCaption(this, this.psv.config.caption));
          break;

        case 'spacer':
          button = 'spacer-5';
        /* falls through */
        default:
          var matches = button.match(/^spacer\-([0-9]+)$/);
          if (matches !== null) {
            this.items.push(new PSVNavBarSpacer(this, matches[1]));
          }
          else {
            throw new PSVError('Unknown button ' + button);
          }
          break;
      }
    }
  }, this);
};

/**
 * Destroys the navbar
 */
PSVNavBar.prototype.destroy = function() {
  this.items.forEach(function(item) {
    item.destroy();
  });

  delete this.items;
  delete this.config;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Returns a button by it's identifier
 * @param {string|number} id
 * @returns {PSVNavBarButton}
 */
PSVNavBar.prototype.getNavbarButton = function(id) {
  var button = null;

  this.items.some(function(item) {
    if (item.id === id) {
      button = item;
      return true;
    }
  });

  if (!button) {
    console.warn('PhotoSphereViewer: button "' + id + '" not found in the navbar.');
  }

  return button;
};

/**
 * Show the navbar
 */
PSVNavBar.prototype.showNavbar = function() {
  this.toggleNavbar(true);
};

/**
 * Hides the navbar
 */
PSVNavBar.prototype.hideNavbar = function() {
  this.toggleNavbar(false);
};

/**
 * Toggles the navbar
 * @param active
 */
PSVNavBar.prototype.toggleNavbar = function(active) {
  PSVUtils.toggleClass(this.container, 'psv-navbar--open', active);
};


/**
 * Navbar caption class
 * @param {PSVNavBar} navbar
 * @param caption (String)
 * @constructor
 */
function PSVNavBarCaption(navbar, caption) {
  PSVComponent.call(this, navbar);

  this.create();

  this.setCaption(caption);
}

PSVNavBarCaption.prototype = Object.create(PSVComponent.prototype);
PSVNavBarCaption.prototype.constructor = PSVNavBarCaption;

PSVNavBarCaption.className = 'psv-caption';
PSVNavBarCaption.publicMethods = ['setCaption'];

/**
 * Sets the bar caption
 * @param {string} html
 */
PSVNavBarCaption.prototype.setCaption = function(html) {
  if (!html) {
    this.container.innerHTML = '';
  }
  else {
    this.container.innerHTML = html;
  }
};


/**
 * Navbar spacer class
 * @param {PSVNavBar} navbar
 * @param {int} weight
 * @constructor
 */
function PSVNavBarSpacer(navbar, weight) {
  PSVComponent.call(this, navbar);

  this.weight = weight;

  this.create();

  this.container.classList.add('psv-spacer--weight-' + (weight || 5));
}

PSVNavBarSpacer.prototype = Object.create(PSVComponent.prototype);
PSVNavBarSpacer.prototype.constructor = PSVNavBarSpacer;

PSVNavBarSpacer.className = 'psv-spacer';


/**
 * Panel class
 * @param {PhotoSphereViewer} psv
 * @constructor
 */
function PSVPanel(psv) {
  PSVComponent.call(this, psv);

  this.content = null;

  this.prop = {
    mouse_x: 0,
    mouse_y: 0,
    mousedown: false,
    opened: false
  };

  this.create();
}

PSVPanel.prototype = Object.create(PSVComponent.prototype);
PSVPanel.prototype.constructor = PSVPanel;

PSVPanel.className = 'psv-panel';
PSVPanel.publicMethods = ['showPanel', 'hidePanel'];

/**
 * Creates the panel
 */
PSVPanel.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.innerHTML =
    '<div class="psv-panel-resizer"></div>' +
    '<div class="psv-panel-close-button"></div>' +
    '<div class="psv-panel-content"></div>';

  this.content = this.container.querySelector('.psv-panel-content');

  var closeBtn = this.container.querySelector('.psv-panel-close-button');
  closeBtn.addEventListener('click', this.hidePanel.bind(this));

  // Stop event bubling from panel
  if (this.psv.config.mousewheel) {
    this.container.addEventListener(PhotoSphereViewer.SYSTEM.mouseWheelEvent, function(e) {
      e.stopPropagation();
    });
  }

  // Event for panel resizing + stop bubling
  var resizer = this.container.querySelector('.psv-panel-resizer');
  resizer.addEventListener('mousedown', this);
  resizer.addEventListener('touchstart', this);
  this.psv.container.addEventListener('mouseup', this);
  this.psv.container.addEventListener('touchend', this);
  this.psv.container.addEventListener('mousemove', this);
  this.psv.container.addEventListener('touchmove', this);
};

/**
 * Destroys the panel
 */
PSVPanel.prototype.destroy = function() {
  this.psv.container.removeEventListener('mousemove', this);
  this.psv.container.removeEventListener('touchmove', this);
  this.psv.container.removeEventListener('mouseup', this);
  this.psv.container.removeEventListener('touchend', this);

  delete this.prop;
  delete this.content;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVPanel.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'mousedown': this._onMouseDown(e); break;
    case 'touchstart': this._onTouchStart(e); break;
    case 'mousemove': this._onMouseMove(e); break;
    case 'touchmove': this._onTouchMove(e); break;
    case 'mouseup': this._onMouseUp(e); break;
    case 'touchend': this._onMouseUp(e); break;
    // @formatter:on
  }
};

/**
 * Shows the panel
 * @param {string} content
 * @param {boolean} noMargin
 */
PSVPanel.prototype.showPanel = function(content, noMargin) {
  this.content.innerHTML = content;
  this.content.scrollTop = 0;
  this.container.classList.add('psv-panel--open');

  PSVUtils.toggleClass(this.content, 'psv-panel-content--no-margin', !!noMargin);

  this.prop.opened = true;
  this.psv.trigger('open-panel');
};


/**
 * Hides the panel
 */
PSVPanel.prototype.hidePanel = function() {
  this.content.innerHTML = null;
  this.prop.opened = false;
  this.container.classList.remove('psv-panel--open');
  this.psv.trigger('close-panel');
};

/**
 * The user wants to move
 * @param {MouseEvent} evt
 * @private
 */
PSVPanel.prototype._onMouseDown = function(evt) {
  evt.stopPropagation();
  this._startResize(evt);
};

/**
 * The user wants to move (mobile version)
 * @param {TouchEvent} evt
 * @private
 */
PSVPanel.prototype._onTouchStart = function(evt) {
  evt.stopPropagation();
  this._startResize(evt.changedTouches[0]);
};

/**
 * Initializes the movement
 * @param {MouseEvent|Touch} evt
 * @private
 */
PSVPanel.prototype._startResize = function(evt) {
  this.prop.mouse_x = parseInt(evt.clientX);
  this.prop.mouse_y = parseInt(evt.clientY);
  this.prop.mousedown = true;
  this.content.classList.add('psv-panel-content--no-interaction');
};

/**
 * The user wants to stop moving
 * @param {MouseEvent} evt
 * @private
 */
PSVPanel.prototype._onMouseUp = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this.prop.mousedown = false;
    this.content.classList.remove('psv-panel-content--no-interaction');
  }
};

/**
 * The user resizes the panel
 * @param {MouseEvent} evt
 * @private
 */
PSVPanel.prototype._onMouseMove = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this._resize(evt);
  }
};

/**
 * The user resizes the panel (mobile version)
 * @param {TouchEvent} evt
 * @private
 */
PSVPanel.prototype._onTouchMove = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this._resize(evt.touches[0]);
  }
};

/**
 * Panel resizing
 * @param {MouseEvent|Touch} evt
 * @private
 */
PSVPanel.prototype._resize = function(evt) {
  var x = parseInt(evt.clientX);
  var y = parseInt(evt.clientY);

  this.container.style.width = (this.container.offsetWidth - (x - this.prop.mouse_x)) + 'px';

  this.prop.mouse_x = x;
  this.prop.mouse_y = y;
};


/**
 * Tooltip class
 * @param {PSVHUD} hud
 * @constructor
 */
function PSVTooltip(hud) {
  PSVComponent.call(this, hud);

  this.config = this.psv.config.tooltip;

  this.timeout = null;

  this.create();
}

PSVTooltip.prototype = Object.create(PSVComponent.prototype);
PSVTooltip.prototype.constructor = PSVTooltip;

PSVTooltip.className = 'psv-tooltip';
PSVTooltip.publicMethods = ['showTooltip', 'hideTooltip', 'isTooltipVisible'];

PSVTooltip.leftMap = { 0: 'left', 0.5: 'center', 1: 'right' };
PSVTooltip.topMap = { 0: 'top', 0.5: 'center', 1: 'bottom' };

/**
 * Creates the tooltip
 */
PSVTooltip.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.innerHTML = '<div class="psv-tooltip-arrow"></div><div class="psv-tooltip-content"></div>';
  this.container.style.top = '-1000px';
  this.container.style.left = '-1000px';

  this.content = this.container.querySelector('.psv-tooltip-content');
  this.arrow = this.container.querySelector('.psv-tooltip-arrow');

  this.psv.on('render', this);
};

/**
 * Destroys the tooltip
 */
PSVTooltip.prototype.destroy = function() {
  this.psv.off('render', this);

  delete this.config;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVTooltip.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'render': this.hideTooltip(); break;
    // @formatter:on
  }
};

/**
 * Returns if the tooltip is visible
 * @returns {boolean}
 */
PSVTooltip.prototype.isTooltipVisible = function() {
  return this.container.classList.contains('psv-tooltip--visible');
};

/**
 * Show the tooltip
 * @param {Object} config
 * @param {string} config.content
 * @param {int} config.top
 * @param {int} config.left
 * @param {string} [config.position='top center']
 * @param {string} [config.className]
 * @param {PSVMarker} [config.marker]
 */
PSVTooltip.prototype.showTooltip = function(config) {
  if (this.timeout) {
    window.clearTimeout(this.timeout);
    this.timeout = null;
  }

  var isUpdate = this.isTooltipVisible();
  var t = this.container;
  var c = this.content;
  var a = this.arrow;

  if (!config.position) {
    config.position = ['top', 'center'];
  }

  if (!config.marker) {
    config.marker = {
      width: 0,
      height: 0
    };
  }

  // parse position
  if (typeof config.position === 'string') {
    var tempPos = PSVUtils.parsePosition(config.position);

    if (!(tempPos.left in PSVTooltip.leftMap) || !(tempPos.top in PSVTooltip.topMap)) {
      throw new PSVError('unable to parse tooltip position "' + tooltip.position + '"');
    }

    config.position = [PSVTooltip.topMap[tempPos.top], PSVTooltip.leftMap[tempPos.left]];
  }

  if (config.position[0] == 'center' && config.position[1] == 'center') {
    throw new PSVError('unable to parse tooltip position "center center"');
  }

  if (isUpdate) {
    // Remove every other classes (Firefox does not implements forEach)
    for (var i = t.classList.length - 1; i >= 0; i--) {
      var item = t.classList.item(i);
      if (item != 'psv-tooltip' && item != 'visible') {
        t.classList.remove(item);
      }
    }
  }
  else {
    t.className = 'psv-tooltip'; // reset the class
  }

  if (config.className) {
    PSVUtils.addClasses(t, config.className);
  }

  c.innerHTML = config.content;
  t.style.top = '0px';
  t.style.left = '0px';

  // compute size
  var rect = t.getBoundingClientRect();
  var style = {
    posClass: config.position.slice(),
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    top: 0,
    left: 0,
    arrow_top: 0,
    arrow_left: 0
  };

  // set initial position
  this._computeTooltipPosition(style, config);

  // correct position if overflow
  var refresh = false;
  if (style.top < this.config.offset) {
    style.posClass[0] = 'bottom';
    refresh = true;
  }
  else if (style.top + style.height > this.psv.prop.size.height - this.config.offset) {
    style.posClass[0] = 'top';
    refresh = true;
  }
  if (style.left < this.config.offset) {
    style.posClass[1] = 'right';
    refresh = true;
  }
  else if (style.left + style.width > this.psv.prop.size.width - this.config.offset) {
    style.posClass[1] = 'left';
    refresh = true;
  }
  if (refresh) {
    this._computeTooltipPosition(style, config);
  }

  // apply position
  t.style.top = style.top + 'px';
  t.style.left = style.left + 'px';

  a.style.top = style.arrow_top + 'px';
  a.style.left = style.arrow_left + 'px';

  t.classList.add('psv-tooltip--' + style.posClass.join('-'));

  // delay for correct transition between the two classes
  if (!isUpdate) {
    var self = this;
    this.timeout = window.setTimeout(function() {
      t.classList.add('psv-tooltip--visible');
      self.psv.trigger('show-tooltip');
      self.timeout = null;
    }, this.config.delay);
  }
};

/**
 * Hide the tooltip
 */
PSVTooltip.prototype.hideTooltip = function() {
  if (this.timeout) {
    window.clearTimeout(this.timeout);
    this.timeout = null;
  }

  if (this.isTooltipVisible()) {
    this.container.classList.remove('psv-tooltip--visible');
    this.psv.trigger('hide-tooltip');

    var self = this;
    this.timeout = window.setTimeout(function() {
      self.content.innerHTML = null;
      self.container.style.top = '-1000px';
      self.container.style.left = '-1000px';
      self.timeout = null;
    }, this.config.delay);
  }
};

/**
 * Compute the position of the tooltip and its arrow
 * @param {Object} style
 * @param {Object} config
 * @private
 */
PSVTooltip.prototype._computeTooltipPosition = function(style, config) {
  var topBottom = false;

  switch (style.posClass[0]) {
    case 'bottom':
      style.top = config.top + config.marker.height + this.config.offset + this.config.arrow_size;
      style.arrow_top = -this.config.arrow_size * 2;
      topBottom = true;
      break;

    case 'center':
      style.top = config.top + config.marker.height / 2 - style.height / 2;
      style.arrow_top = style.height / 2 - this.config.arrow_size;
      break;

    case 'top':
      style.top = config.top - style.height - this.config.offset - this.config.arrow_size;
      style.arrow_top = style.height;
      topBottom = true;
      break;
  }

  switch (style.posClass[1]) {
    case 'right':
      if (topBottom) {
        style.left = config.left + config.marker.width / 2 - this.config.offset - this.config.arrow_size;
        style.arrow_left = this.config.offset;
      }
      else {
        style.left = config.left + config.marker.width + this.config.offset + this.config.arrow_size;
        style.arrow_left = -this.config.arrow_size * 2;
      }
      break;

    case 'center':
      style.left = config.left + config.marker.width / 2 - style.width / 2;
      style.arrow_left = style.width / 2 - this.config.arrow_size;
      break;

    case 'left':
      if (topBottom) {
        style.left = config.left - style.width + config.marker.width / 2 + this.config.offset + this.config.arrow_size;
        style.arrow_left = style.width - this.config.offset - this.config.arrow_size * 2;
      }
      else {
        style.left = config.left - style.width - this.config.offset - this.config.arrow_size;
        style.arrow_left = style.width;
      }
      break;
  }
};


/**
 * Navigation bar button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarButton(navbar) {
  PSVComponent.call(this, navbar);

  if (this.constructor.id) {
    this.id = this.constructor.id;
  }

  this.enabled = true;
}

PSVNavBarButton.prototype = Object.create(PSVComponent.prototype);
PSVNavBarButton.prototype.constructor = PSVNavBarButton;

/**
 * Creates the button
 */
PSVNavBarButton.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  if (this.constructor.icon) {
    this.setIcon(this.constructor.icon);
  }

  this.container.addEventListener('click', function() {
    if (this.enabled) {
      this._onClick();
    }
  }.bind(this));
};

/**
 * Set the button icon (from PSV icons list)
 * @param {string} icon
 * @param {HTMLElement} [container] - default is the main button container
 */
PSVNavBarButton.prototype.setIcon = function(icon, container) {
  if (!container) {
    container = this.container;
  }
  if (icon) {
    container.innerHTML = PhotoSphereViewer.ICONS[icon];
    container.querySelector('svg').classList.add('psv-button-svg');
  }
  else {
    container.innerHTML = '';
  }
};

/**
 * Changes the active state of the button
 * @param {boolean} [active] - forced state
 */
PSVNavBarButton.prototype.toggleActive = function(active) {
  active = PSVUtils.toggleClass(this.container, 'psv-button--active', active);

  if (this.constructor.iconActive) {
    this.setIcon(active ? this.constructor.iconActive : this.constructor.icon);
  }
};

/**
 * Disables the button
 */
PSVNavBarButton.prototype.disable = function() {
  this.container.classList.add('psv-button--disabled');

  this.enabled = false;
};

/**
 * Enables the button
 */
PSVNavBarButton.prototype.enable = function() {
  this.container.classList.remove('psv-button--disabled');

  this.enabled = true;
};

/**
 * Action when the button is clicked
 * @private
 * @abstract
 */
PSVNavBarButton.prototype._onClick = function() {

};


/**
 * Navigation bar autorotate button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarAutorotateButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarAutorotateButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarAutorotateButton.prototype.constructor = PSVNavBarAutorotateButton;

PSVNavBarAutorotateButton.id = 'autorotate';
PSVNavBarAutorotateButton.className = 'psv-button psv-button--hover-scale psv-autorotate-button';
PSVNavBarAutorotateButton.icon = 'play.svg';
PSVNavBarAutorotateButton.iconActive = 'play-active.svg';

/**
 * Creates the button
 */
PSVNavBarAutorotateButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.title = this.psv.config.lang.autorotate;

  this.psv.on('autorotate', this);
};

/**
 * Destroys the button
 */
PSVNavBarAutorotateButton.prototype.destroy = function() {
  this.psv.off('autorotate', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVNavBarAutorotateButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'autorotate': this.toggleActive(e.args[0]); break;
    // @formatter:on
  }
};

/**
 * Toggles autorotate on click
 * @private
 */
PSVNavBarAutorotateButton.prototype._onClick = function() {
  this.psv.toggleAutorotate();
};


/**
 * Navigation bar custom button class
 * @param {PSVNavBar} navbar
 * @param config {Object}
 * @constructor
 */
function PSVNavBarCustomButton(navbar, config) {
  PSVNavBarButton.call(this, navbar);

  this.config = config;

  if (this.config.id) {
    this.id = this.config.id;
  }

  this.create();
}

PSVNavBarCustomButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarCustomButton.prototype.constructor = PSVNavBarCustomButton;

PSVNavBarCustomButton.className = 'psv-button psv-custom-button';

/**
 * Creates the button
 */
PSVNavBarCustomButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  if (this.config.className) {
    PSVUtils.addClasses(this.container, this.config.className);
  }

  if (this.config.title) {
    this.container.title = this.config.title;
  }

  if (this.config.content) {
    this.container.innerHTML = this.config.content;
  }

  if (this.config.enabled === false || this.config.disabled === true) {
    this.disable();
  }

  if (this.config.visible === false || this.config.hidden === true) {
    this.hide();
  }
};

/**
 * Destroys the button
 */
PSVNavBarCustomButton.prototype.destroy = function() {
  delete this.config;

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Calls user method on click
 * @private
 */
PSVNavBarCustomButton.prototype._onClick = function() {
  if (this.config.onClick) {
    this.config.onClick.apply(this.psv);
  }
};


/**
 * Navigation bar download button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarDownloadButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarDownloadButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarDownloadButton.prototype.constructor = PSVNavBarDownloadButton;

PSVNavBarDownloadButton.id = 'download';
PSVNavBarDownloadButton.className = 'psv-button psv-button--hover-scale psv-download-button';
PSVNavBarDownloadButton.icon = 'download.svg';

/**
 * Creates the button
 */
PSVNavBarDownloadButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.title = this.psv.config.lang.download;
};

/**
 * Asks the browser to download the panorama source file
 * @private
 */
PSVNavBarDownloadButton.prototype._onClick = function() {
  var link = document.createElement('a');
  link.href = this.psv.config.panorama;
  link.download = this.psv.config.panorama;
  this.psv.container.appendChild(link);
  link.click();
};


/**
 * Navigation bar fullscreen button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarFullscreenButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarFullscreenButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarFullscreenButton.prototype.constructor = PSVNavBarFullscreenButton;

PSVNavBarFullscreenButton.id = 'fullscreen';
PSVNavBarFullscreenButton.className = 'psv-button psv-button--hover-scale psv-fullscreen-button';
PSVNavBarFullscreenButton.icon = 'fullscreen-in.svg';
PSVNavBarFullscreenButton.iconActive = 'fullscreen-out.svg';

/**
 * Creates the button
 */
PSVNavBarFullscreenButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.title = this.psv.config.lang.fullscreen;

  this.psv.on('fullscreen-updated', this);
};

/**
 * Destroys the button
 */
PSVNavBarFullscreenButton.prototype.destroy = function() {
  this.psv.off('fullscreen-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVNavBarFullscreenButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'fullscreen-updated': this.toggleActive(e.args[0]); break;
    // @formatter:on
  }
};

/**
 * Toggles fullscreen on click
 * @private
 */
PSVNavBarFullscreenButton.prototype._onClick = function() {
  this.psv.toggleFullscreen();
};


/**
 * Navigation bar gyroscope button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarGyroscopeButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarGyroscopeButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarGyroscopeButton.prototype.constructor = PSVNavBarGyroscopeButton;

PSVNavBarGyroscopeButton.id = 'gyroscope';
PSVNavBarGyroscopeButton.className = 'psv-button psv-button--hover-scale psv-gyroscope-button';
PSVNavBarGyroscopeButton.icon = 'compass.svg';

/**
 * Creates the button
 * The buttons get visible once the gyroscope API is ready
 */
PSVNavBarGyroscopeButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.title = this.psv.config.lang.gyroscope;

  PhotoSphereViewer.SYSTEM.deviceOrientationSupported.promise.then(
    this._onAvailabilityChange.bind(this, true),
    this._onAvailabilityChange.bind(this, false)
  );

  this.hide();

  this.psv.on('gyroscope-updated', this);
};

/**
 * Destroys the button
 */
PSVNavBarGyroscopeButton.prototype.destroy = function() {
  this.psv.off('gyroscope-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVNavBarGyroscopeButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'gyroscope-updated': this.toggleActive(e.args[0]); break;
    // @formatter:on
  }
};

/**
 * Toggle gyroscope on click
 * @private
 */
PSVNavBarGyroscopeButton.prototype._onClick = function() {
  this.psv.toggleGyroscopeControl();
};

/**
 * Update button display when API is ready
 * @param {boolean} available
 * @private
 */
PSVNavBarGyroscopeButton.prototype._onAvailabilityChange = function(available) {
  if (available) {
    if (PSVUtils.checkTHREE('DeviceOrientationControls')) {
      this.show();
    }
    else {
      throw new PSVError('Missing Three.js components: DeviceOrientationControls. Get them from threejs-examples package.');
    }
  }
};


/**
 * Navigation bar markers button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarMarkersButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.prop = {
    panelOpened: false,
    panelOpening: false
  };

  this.create();
}

PSVNavBarMarkersButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarMarkersButton.prototype.constructor = PSVNavBarMarkersButton;

PSVNavBarMarkersButton.id = 'markers';
PSVNavBarMarkersButton.className = 'psv-button psv-button--hover-scale psv-markers-button';
PSVNavBarMarkersButton.icon = 'pin.svg';
PSVNavBarMarkersButton.publicMethods = ['toggleMarkersList', 'showMarkersList', 'hideMarkersList'];

/**
 * Creates the button
 */
PSVNavBarMarkersButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.title = this.psv.config.lang.markers;

  this.psv.on('open-panel', this);
  this.psv.on('close-panel', this);
};

/**
 * Destroys the button
 */
PSVNavBarMarkersButton.prototype.destroy = function() {
  this.psv.off('open-panel', this);
  this.psv.off('close-panel', this);

  delete this.prop;

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVNavBarMarkersButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'open-panel': this._onPanelOpened(); break;
    case 'close-panel': this._onPanelClosed(); break;
    // @formatter:on
  }
};

/**
 * Toggles markers list on click
 * @private
 */
PSVNavBarMarkersButton.prototype._onClick = function() {
  this.toggleMarkersList();
};

/**
 * Toggle the visibility of markers list
 */
PSVNavBarMarkersButton.prototype.toggleMarkersList = function() {
  if (this.prop.panelOpened) {
    this.hideMarkersList();
  }
  else {
    this.showMarkersList();
  }
};

/**
 * Open side panel with list of markers
 */
PSVNavBarMarkersButton.prototype.showMarkersList = function() {
  var markers = [];
  for (var id in this.psv.hud.markers) {
    markers.push(this.psv.hud.markers[id]);
  }

  var html = this.psv.config.templates.markersList({
    markers: this.psv.change('render-markers-list', markers),
    config: this.psv.config
  });

  this.prop.panelOpening = true;
  this.psv.panel.showPanel(html, true);

  this.psv.panel.container.querySelector('.psv-markers-list').addEventListener('click', this._onClickItem.bind(this));
};

/**
 * Close side panel
 */
PSVNavBarMarkersButton.prototype.hideMarkersList = function() {
  if (this.prop.panelOpened) {
    this.psv.panel.hidePanel();
  }
};

/**
 * Click on an item
 * @param {MouseEvent} e
 * @private
 */
PSVNavBarMarkersButton.prototype._onClickItem = function(e) {
  var li;
  if (e.target && (li = PSVUtils.getClosest(e.target, 'li')) && li.dataset.psvMarker) {
    this.psv.hud.gotoMarker(li.dataset.psvMarker, 1000);
    this.psv.panel.hidePanel();
  }
};

/**
 * Update status when the panel is updated
 * @private
 */
PSVNavBarMarkersButton.prototype._onPanelOpened = function() {
  if (this.prop.panelOpening) {
    this.prop.panelOpening = false;
    this.prop.panelOpened = true;
  }
  else {
    this.prop.panelOpened = false;
  }

  this.toggleActive(this.prop.panelOpened);
};

/**
 * Update status when the panel is updated
 * @private
 */
PSVNavBarMarkersButton.prototype._onPanelClosed = function() {
  this.prop.panelOpened = false;
  this.prop.panelOpening = false;

  this.toggleActive(this.prop.panelOpened);
};


/**
 * Navigation bar zoom button class
 * @param {PSVNavBar} navbar
 * @constructor
 */
function PSVNavBarZoomButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.zoom_range = null;
  this.zoom_value = null;

  this.prop = {
    mousedown: false,
    buttondown: false,
    longPressInterval: null
  };

  this.create();
}

PSVNavBarZoomButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarZoomButton.prototype.constructor = PSVNavBarZoomButton;

PSVNavBarZoomButton.id = 'zoom';
PSVNavBarZoomButton.className = 'psv-button psv-zoom-button';

/**
 * Creates the button
 */
PSVNavBarZoomButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  var zoom_minus = document.createElement('div');
  zoom_minus.className = 'psv-zoom-button-minus';
  zoom_minus.title = this.psv.config.lang.zoomOut;
  this.setIcon('zoom-out.svg', zoom_minus);
  this.container.appendChild(zoom_minus);

  var zoom_range_bg = document.createElement('div');
  zoom_range_bg.className = 'psv-zoom-button-range';
  this.container.appendChild(zoom_range_bg);

  this.zoom_range = document.createElement('div');
  this.zoom_range.className = 'psv-zoom-button-line';
  this.zoom_range.title = this.psv.config.lang.zoom;
  zoom_range_bg.appendChild(this.zoom_range);

  this.zoom_value = document.createElement('div');
  this.zoom_value.className = 'psv-zoom-button-handle';
  this.zoom_value.title = this.psv.config.lang.zoom;
  this.zoom_range.appendChild(this.zoom_value);

  var zoom_plus = document.createElement('div');
  zoom_plus.className = 'psv-zoom-button-plus';
  zoom_plus.title = this.psv.config.lang.zoomIn;
  this.setIcon('zoom-in.svg', zoom_plus);
  this.container.appendChild(zoom_plus);

  this.zoom_range.addEventListener('mousedown', this);
  this.zoom_range.addEventListener('touchstart', this);
  this.psv.container.addEventListener('mousemove', this);
  this.psv.container.addEventListener('touchmove', this);
  this.psv.container.addEventListener('mouseup', this);
  this.psv.container.addEventListener('touchend', this);
  zoom_minus.addEventListener('mousedown', this._zoomOut.bind(this));
  zoom_plus.addEventListener('mousedown', this._zoomIn.bind(this));

  this.psv.on('zoom-updated', this);

  this.psv.once('ready', function() {
    this._moveZoomValue(this.psv.prop.zoom_lvl);
  }.bind(this));
};

/**
 * Destroys the button
 */
PSVNavBarZoomButton.prototype.destroy = function() {
  this.psv.container.removeEventListener('mousemove', this);
  this.psv.container.removeEventListener('touchmove', this);
  this.psv.container.removeEventListener('mouseup', this);
  this.psv.container.removeEventListener('touchend', this);

  delete this.zoom_range;
  delete this.zoom_value;

  this.psv.off('zoom-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param {Event} e
 * @private
 */
PSVNavBarZoomButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'mousedown': this._initZoomChangeWithMouse(e); break;
    case 'touchstart': this._initZoomChangeByTouch(e); break;
    case 'mousemove': this._changeZoomWithMouse(e); break;
    case 'touchmove': this._changeZoomByTouch(e); break;
    case 'mouseup': this._stopZoomChange(e); break;
    case 'touchend': this._stopZoomChange(e); break;
    case 'zoom-updated': this._moveZoomValue(e.args[0]); break;
    // @formatter:on
  }
};

/**
 * Moves the zoom cursor
 * @param {int} level
 * @private
 */
PSVNavBarZoomButton.prototype._moveZoomValue = function(level) {
  this.zoom_value.style.left = (level / 100 * this.zoom_range.offsetWidth - this.zoom_value.offsetWidth / 2) + 'px';
};

/**
 * The user wants to zoom
 * @param {MouseEvent} evt
 * @private
 */
PSVNavBarZoomButton.prototype._initZoomChangeWithMouse = function(evt) {
  if (!this.enabled) {
    return;
  }

  this.prop.mousedown = true;
  this._changeZoom(evt.clientX);
};

/**
 * The user wants to zoom (mobile version)
 * @param {TouchEvent} evt
 * @private
 */
PSVNavBarZoomButton.prototype._initZoomChangeByTouch = function(evt) {
  if (!this.enabled) {
    return;
  }

  this.prop.mousedown = true;
  this._changeZoom(evt.changedTouches[0].clientX);
};

/**
 * The user clicked the + button
 * Zoom in and register long press timer
 * @private
 */
PSVNavBarZoomButton.prototype._zoomIn = function() {
  if (!this.enabled) {
    return;
  }

  this.prop.buttondown = true;
  this.psv.zoomIn();
  window.setTimeout(this._startLongPressInterval.bind(this, 1), 200);
};

/**
 * The user clicked the - button
 * Zoom out and register long press timer
 * @private
 */
PSVNavBarZoomButton.prototype._zoomOut = function() {
  if (!this.enabled) {
    return;
  }

  this.prop.buttondown = true;
  this.psv.zoomOut();
  window.setTimeout(this._startLongPressInterval.bind(this, -1), 200);
};

/**
 * Continue zooming as long as the user press the button
 * @param value
 * @private
 */
PSVNavBarZoomButton.prototype._startLongPressInterval = function(value) {
  if (this.prop.buttondown) {
    this.prop.longPressInterval = window.setInterval(function() {
      this.psv.zoom(this.psv.prop.zoom_lvl + value);
    }.bind(this), 50);
  }
};

/**
 * The user wants to stop zooming
 * @private
 */
PSVNavBarZoomButton.prototype._stopZoomChange = function() {
  if (!this.enabled) {
    return;
  }

  window.clearInterval(this.prop.longPressInterval);
  this.prop.longPressInterval = null;
  this.prop.mousedown = false;
  this.prop.buttondown = false;
};

/**
 * The user moves the zoom cursor
 * @param {MouseEvent} evt
 * @private
 */
PSVNavBarZoomButton.prototype._changeZoomWithMouse = function(evt) {
  if (!this.enabled) {
    return;
  }

  evt.preventDefault();
  this._changeZoom(evt.clientX);
};

/**
 * The user moves the zoom cursor (mobile version)
 * @param {TouchEvent} evt
 * @private
 */
PSVNavBarZoomButton.prototype._changeZoomByTouch = function(evt) {
  if (!this.enabled) {
    return;
  }

  evt.preventDefault();
  this._changeZoom(evt.changedTouches[0].clientX);
};

/**
 * Zoom change
 * @param {int} x - mouse/touch position
 * @private
 */
PSVNavBarZoomButton.prototype._changeZoom = function(x) {
  if (this.prop.mousedown) {
    var user_input = parseInt(x) - this.zoom_range.getBoundingClientRect().left;
    var zoom_level = user_input / this.zoom_range.offsetWidth * 100;
    this.psv.zoom(zoom_level);
  }
};


/**
 * Custom error used in the lib
 * {@link http://stackoverflow.com/a/27724419/1207670}
 * @param {*} message
 * @constructor
 */
function PSVError(message) {
  this.message = message;

  // Use V8's native method if available, otherwise fallback
  if ('captureStackTrace' in Error) {
    Error.captureStackTrace(this, PSVError);
  }
  else {
    this.stack = (new Error()).stack;
  }
}

PSVError.prototype = Object.create(Error.prototype);
PSVError.prototype.name = 'PSVError';
PSVError.prototype.constructor = PSVError;


/**
 * Static utilities for PSV
 * @type {object}
 */
var PSVUtils = {};

/**
 * Short-Hand for PI*2
 * @type {float}
 */
PSVUtils.TwoPI = Math.PI * 2.0;

/**
 * Short-Hand for PI/2
 * @type {float}
 */
PSVUtils.HalfPI = Math.PI / 2.0;

/**
 * Check if some Three.js components are loaded
 * @param {...string} components
 * @returns {boolean}
 */
PSVUtils.checkTHREE = function(components) {
  for (var i = 0, l = arguments.length; i < l; i++) {
    if (!(arguments[i] in THREE)) {
      return false;
    }
  }

  return true;
};

/**
 * Detects whether canvas is supported
 * @returns {boolean}
 */
PSVUtils.isCanvasSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
};

/**
 * Tries to return a canvas webgl context
 * @returns {WebGLRenderingContext}
 */
PSVUtils.getWebGLCtx = function() {
  var canvas = document.createElement('canvas');
  var names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
  var context = null;

  if (!canvas.getContext) {
    return null;
  }

  if (names.some(function(name) {
      try {
        context = canvas.getContext(name);
        return (context && typeof context.getParameter == 'function');
      } catch (e) {
        return false;
      }
    })) {
    return context;
  }
  else {
    return null;
  }
};

/**
 * Detects whether WebGL is supported
 * @returns {boolean}
 */
PSVUtils.isWebGLSupported = function() {
  return !!window.WebGLRenderingContext && PSVUtils.getWebGLCtx() !== null;
};

/**
 * Gets max texture width in WebGL context
 * @returns {int}
 */
PSVUtils.getMaxTextureWidth = function() {
  var ctx = PSVUtils.getWebGLCtx();
  if (ctx !== null) {
    return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
  }
};

/**
 * Toggles a CSS class
 * @param {HTMLElement} element
 * @param {string} className
 * @param {boolean} [active] - forced state
 * @return {boolean} new state
 */
PSVUtils.toggleClass = function(element, className, active) {
  if (active === undefined) {
    return element.classList.toggle(className);
  }
  else if (active && !element.classList.contains(className)) {
    element.classList.add(className);
    return true;
  }
  else if (!active) {
    element.classList.remove(className);
    return false;
  }
};

/**
 * Adds one or several CSS classes to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
PSVUtils.addClasses = function(element, className) {
  if (!className) {
    return;
  }
  className.split(' ').forEach(function(name) {
    element.classList.add(name);
  });
};

/**
 * Removes one or several CSS classes to an element
 * @param {HTMLElement} element
 * @param {string} className
 */
PSVUtils.removeClasses = function(element, className) {
  if (!className) {
    return;
  }
  className.split(' ').forEach(function(name) {
    element.classList.remove(name);
  });
};

/**
 * Search if an element has a particular, at any level including itself
 * @param {HTMLElement} el
 * @param {HTMLElement} parent
 * @returns {boolean}
 */
PSVUtils.hasParent = function(el, parent) {
  do {
    if (el === parent) {
      return true;
    }
  } while (!!(el = el.parentNode));

  return false;
};

/**
 * Get closest parent (can by itself)
 * @param {HTMLElement} el (HTMLElement)
 * @param {string} selector
 * @returns {HTMLElement}
 */
PSVUtils.getClosest = function(el, selector) {
  var matches = el.matches || el.msMatchesSelector;

  do {
    if (matches.bind(el)(selector)) {
      return el;
    }
  } while (!!(el = el.parentElement));

  return null;
};

/**
 * Get the event name for mouse wheel
 * @returns {string}
 */
PSVUtils.mouseWheelEvent = function() {
  return 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"
    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
      'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
};

/**
 * Get the event name for fullscreen event
 * @returns {string}
 */
PSVUtils.fullscreenEvent = function() {
  var map = {
    'exitFullscreen': 'fullscreenchange',
    'webkitExitFullscreen': 'webkitfullscreenchange',
    'mozCancelFullScreen': 'mozfullscreenchange',
    'msExitFullscreen': 'msFullscreenEnabled'
  };

  for (var exit in map) {
    if (exit in document) return map[exit];
  }

  return 'fullscreenchange';
};

/**
 * Ensures that a number is in a given interval
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
PSVUtils.stayBetween = function(x, min, max) {
  return Math.max(min, Math.min(max, x));
};

/**
 * Returns the value of a given attribute in the panorama metadata
 * @param {string} data
 * @param {string} attr
 * @returns (string)
 */
PSVUtils.getXMPValue = function(data, attr) {
  var result;
  // XMP data are stored in children
  if ((result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>')) !== null) {
    return result[1];
  }
  // XMP data are stored in attributes
  else if ((result = data.match('GPano:' + attr + '="(.*?)"')) !== null) {
    return result[1];
  }
  else {
    return null;
  }
};

/**
 * Detects whether fullscreen is enabled or not
 * @param {HTMLElement} elt
 * @returns {boolean}
 */
PSVUtils.isFullscreenEnabled = function(elt) {
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) === elt;
};

/**
 * Enters fullscreen mode
 * @param {HTMLElement} elt
 */
PSVUtils.requestFullscreen = function(elt) {
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
};

/**
 * Exits fullscreen mode
 */
PSVUtils.exitFullscreen = function() {
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
};

/**
 * Gets an element style
 * @param {HTMLElement} elt
 * @param {string} prop
 * @returns {*}
 */
PSVUtils.getStyle = function(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
};

/**
 * Translate CSS values like "top center" or "10% 50%" as top and left positions
 * The implementation is as close as possible to the "background-position" specification
 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
 * @param {string} value
 * @returns {{top: float, left: float}}
 */
PSVUtils.parsePosition = function(value) {
  if (!value) {
    return { top: 0.5, left: 0.5 };
  }

  if (typeof value === 'object') {
    return value;
  }

  var tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

  if (tokens.length === 1) {
    if (PSVUtils.parsePosition.positions[tokens[0]] !== undefined) {
      tokens = [tokens[0], 'center'];
    }
    else {
      tokens = [tokens[0], tokens[0]];
    }
  }

  var xFirst = tokens[1] != 'left' && tokens[1] != 'right' && tokens[0] != 'top' && tokens[0] != 'bottom';

  tokens = tokens.map(function(token) {
    return PSVUtils.parsePosition.positions[token] || token;
  });

  if (!xFirst) {
    tokens.reverse();
  }

  var parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

  if (parsed) {
    return {
      left: parsed[1] / 100,
      top: parsed[2] / 100
    };
  }
  else {
    return { top: 0.5, left: 0.5 };
  }
};

PSVUtils.parsePosition.positions = { 'top': '0%', 'bottom': '100%', 'left': '0%', 'right': '100%', 'center': '50%' };

/**
 * Parse an speed
 * @param {string} speed - The speed, in radians/degrees/revolutions per second/minute
 * @returns {float} radians per second
 */
PSVUtils.parseSpeed = function(speed) {
  if (typeof speed == 'string') {
    speed = speed.toString().trim();

    // Speed extraction
    var speed_value = parseFloat(speed.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
    var speed_unit = speed.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

    // "per minute" -> "per second"
    if (speed_unit.match(/(pm|per minute)$/)) {
      speed_value /= 60;
    }

    // Which unit?
    switch (speed_unit) {
      // Degrees per minute / second
      case 'dpm':
      case 'degrees per minute':
      case 'dps':
      case 'degrees per second':
        speed = speed_value * Math.PI / 180;
        break;

      // Radians per minute / second
      case 'radians per minute':
      case 'radians per second':
        speed = speed_value;
        break;

      // Revolutions per minute / second
      case 'rpm':
      case 'revolutions per minute':
      case 'rps':
      case 'revolutions per second':
        speed = speed_value * PSVUtils.TwoPI;
        break;

      // Unknown unit
      default:
        throw new PSVError('unknown speed unit "' + speed_unit + '"');
    }
  }

  return speed;
};

/**
 * Parses an angle value in radians or degrees and return a normalized value in radians
 * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
 * @param {float|boolean} [reference =0] - base value for normalization, false to disable
 * @returns (double)
 */
PSVUtils.parseAngle = function(angle, reference) {
  if (typeof angle == 'string') {
    var match = angle.toLowerCase().trim().match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

    if (!match) {
      throw new PSVError('unknown angle "' + angle + '"');
    }

    var value = parseFloat(match[1]);
    var unit = match[2];

    if (unit) {
      switch (unit) {
        case 'deg':
        case 'degs':
          angle = value / 180 * Math.PI;
          break;
        case 'rad':
        case 'rads':
          angle = value;
          break;
        default:
          throw new PSVError('unknown angle unit "' + unit + '"');
      }
    }
  }

  if (reference !== false) {
    if (reference === undefined) {
      reference = 0;
    }

    angle = (angle - reference) % PSVUtils.TwoPI;

    if (angle < 0) {
      angle = PSVUtils.TwoPI + angle;
    }

    angle += reference;
  }

  return angle;
};

/**
 * Utility for animations, interpolates each property with an easing and optional delay
 * @param {Object} options
 * @param {Object[]} options.properties
 * @param {number} options.properties[].start
 * @param {number} options.properties[].end
 * @param {int} options.duration
 * @param {int} [options.delay]
 * @param {string} [options.easing='linear']
 * @param {Function} options.onTick - called with interpolated properties and progression (0 to 1)
 * @param {Function} [options.onDone]
 * @param {Function} [options.onCancel]
 * @returns {promise} with an additional "cancel" method
 */
PSVUtils.animation = function(options) {
  var defer = D();
  var start = null;

  if (!options.easing || typeof options.easing == 'string') {
    options.easing = PSVUtils.animation.easings[options.easing || 'linear'];
  }

  function run(timestamp) {
    // the animation has been cancelled
    if (defer.promise.getStatus() === -1) {
      return;
    }

    // first iteration
    if (start === null) {
      start = timestamp;
    }

    // compute progress
    var progress = (timestamp - start) / options.duration;
    var current = {};
    var name;

    if (progress < 1.0) {
      // interpolate properties
      for (name in options.properties) {
        current[name] = options.properties[name].start + (options.properties[name].end - options.properties[name].start) * options.easing(progress);
      }

      options.onTick(current, progress);

      window.requestAnimationFrame(run);
    }
    else {
      // call onTick one last time with final values
      for (name in options.properties) {
        current[name] = options.properties[name].end;
      }

      options.onTick(current, 1.0);

      if (options.onDone) {
        options.onDone();
      }

      defer.resolve();
    }
  }

  if (options.delay !== undefined) {
    window.setTimeout(function() {
      window.requestAnimationFrame(run);
    }, options.delay);
  }
  else {
    window.requestAnimationFrame(run);
  }

  // add a "cancel" to the promise
  var promise = defer.promise;
  promise.cancel = function() {
    if (options.onCancel) {
      options.onCancel();
    }
    defer.reject();
  };
  return promise;
};

/**
 * Collection of easing functions
 * {@link https://gist.github.com/frederickk/6165768}
 * @type {Object.<string, Function>}
 */
// @formatter:off
// jscs:disable
/* jshint ignore:start */
PSVUtils.animation.easings = {
  linear: function(t) { return t; },

  inQuad: function(t) { return t*t; },
  outQuad: function(t) { return t*(2-t); },
  inOutQuad: function(t) { return t<.5 ? 2*t*t : -1+(4-2*t)*t; },

  inCubic: function(t) { return t*t*t; },
  outCubic: function(t) { return (--t)*t*t+1; },
  inOutCubic: function(t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },

  inQuart: function(t) { return t*t*t*t; },
  outQuart: function(t) { return 1-(--t)*t*t*t; },
  inOutQuart: function(t) { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },

  inQuint: function(t) { return t*t*t*t*t; },
  outQuint: function(t) { return 1+(--t)*t*t*t*t; },
  inOutQuint: function(t) { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; },

  inSine: function(t) { return 1-Math.cos(t*(Math.PI/2)); },
  outSine: function(t) { return Math.sin(t*(Math.PI/2)); },
  inOutSine: function(t) { return .5-.5*Math.cos(Math.PI*t); },

  inExpo: function(t) { return Math.pow(2, 10*(t-1)); },
  outExpo: function(t) { return 1-Math.pow(2, -10*t); },
  inOutExpo: function(t) { t=t*2-1; return t<0 ? .5*Math.pow(2, 10*t) : 1-.5*Math.pow(2, -10*t); },

  inCirc: function(t) { return 1-Math.sqrt(1-t*t); },
  outCirc: function(t) { t--; return Math.sqrt(1-t*t); },
  inOutCirc: function(t) { t*=2; return t<1 ? .5-.5*Math.sqrt(1-t*t) : .5+.5*Math.sqrt(1-(t-=2)*t); }
};
/* jshint ignore:end */
// jscs:enable
// @formatter:off

/**
 * Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
 * @param {Function} func
 * @param {int} wait
 * @returns {Function}
 */
PSVUtils.throttle = function(func, wait) {
  var self, args, result;
  var timeout = null;
  var previous = 0;
  var later = function() {
    previous = Date.now();
    timeout = null;
    result = func.apply(self, args);
    if (!timeout) self = args = null;
  };
  return function() {
    var now = Date.now();
    if (!previous) previous = now;
    var remaining = wait - (now - previous);
    self = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(self, args);
      if (!timeout) self = args = null;
    }
    else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};

/**
 *  Function to test if an object is a plain object, i.e. is constructed
 *  by the built-in Object constructor and inherits directly from Object.prototype
 *  or null. Some built-in objects pass the test, e.g. Math which is a plain object
 *  and some host or exotic objects may pass also.
 *  {@link http://stackoverflow.com/a/5878101/1207670}
 *  @param {*} obj
 *  @returns {boolean}
 */
PSVUtils.isPlainObject = function(obj) {
  // Basic check for Type object that's not null
  if (typeof obj == 'object' && obj !== null) {
    // If Object.getPrototypeOf supported, use it
    if (typeof Object.getPrototypeOf == 'function') {
      var proto = Object.getPrototypeOf(obj);
      return proto === Object.prototype || proto === null;
    }

    // Otherwise, use internal class
    // This should be reliable as if getPrototypeOf not supported, is pre-ES5
    return Object.prototype.toString.call(obj) == '[object Object]';
  }

  // Not an object
  return false;
};

/**
 * Merge the enumerable attributes of two objects.
 * Modified to replace arrays instead of merge.
 * Modified to alter the target object.
 * @copyright Nicholas Fisher {@link mailto:nfisher110@gmail.com} - modified by Damien "Mistic" Sorel
 * @param {Object} target
 * @param {Object} src
 * @returns {Object} target
 */
PSVUtils.deepmerge = function(target, src) {
  var first = src;

  return (function merge(target, src) {
    if (Array.isArray(src)) {
      if (!target || !Array.isArray(target)) {
        target = [];
      }
      else {
        target.length = 0;
      }
      src.forEach(function(e, i) {
        target[i] = merge(null, e);
      });
    }
    else if (typeof src == 'object') {
      if (!target || Array.isArray(target)) {
        target = {};
      }
      Object.keys(src).forEach(function(key) {
        if (typeof src[key] != 'object' || !src[key] || !PSVUtils.isPlainObject(src[key])) {
          target[key] = src[key];
        }
        else if (src[key] != first) {
          if (!target[key]) {
            target[key] = merge(null, src[key]);
          }
          else {
            merge(target[key], src[key]);
          }
        }
      });
    }
    else {
      target = src;
    }

    return target;
  }(target, src));
};

/**
 * Clone an object
 * @param {Object} src
 * @returns {Object}
 */
PSVUtils.clone = function(src) {
  return PSVUtils.deepmerge(null, src);
};


/**
 * Godrays shader for THREE.js
 * {@link http://demo.bkcore.com/threejs/webgl_tron_godrays.html}
 */
THREE.GodraysShader = {
  uniforms: {
    tDiffuse: { type: 't', value: 0, texture: null },
    fX: { type: 'f', value: 0.5 },
    fY: { type: 'f', value: 0.5 },
    fExposure: { type: 'f', value: 0.6 },
    fDecay: { type: 'f', value: 0.93 },
    fDensity: { type: 'f', value: 0.96 },
    fWeight: { type: 'f', value: 0.4 },
    fClamp: { type: 'f', value: 1.0 }
  },

  // @formatter:off
  vertexShader: [
    'varying vec2 vUv;',

    'void main()',
    '{',
      'vUv = vec2( uv.x, uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}'
  ].join('\n'),
  // @formatter:off

  // @formatter:on
  fragmentShader: [
    'varying vec2 vUv;',
    'uniform sampler2D tDiffuse;',

    'uniform float fX;',
    'uniform float fY;',
    'uniform float fExposure;',
    'uniform float fDecay;',
    'uniform float fDensity;',
    'uniform float fWeight;',
    'uniform float fClamp;',

    'const int iSamples = 20;',

    'void main()',
    '{',
      'vec2 deltaTextCoord = vec2(vUv - vec2(fX,fY));',
      'deltaTextCoord *= 1.0 /  float(iSamples) * fDensity;',
      'vec2 coord = vUv;',
      'float illuminationDecay = 1.0;',
      'vec4 FragColor = vec4(0.0);',

      'for(int i=0; i < iSamples ; i++)',
      '{',
        'coord -= deltaTextCoord;',
        'vec4 texel = texture2D(tDiffuse, coord);',
        'texel *= illuminationDecay * fWeight;',

        'FragColor += texel;',

        'illuminationDecay *= fDecay;',
      '}',

      'FragColor *= fExposure;',
      'FragColor = clamp(FragColor, 0.0, fClamp);',
      'gl_FragColor = FragColor;',
    '}'
  ].join('\n')
  // @formatter:on
};


/**
 * requestAnimationFrame polyfill
 * {@link http://mattsnider.com/cross-browser-and-legacy-supported-requestframeanimation}
 * @license MIT
 */
(function(w) {
    "use strict";
    // most browsers have an implementation
    w.requestAnimationFrame = w.requestAnimationFrame ||
            w.mozRequestAnimationFrame || w.webkitRequestAnimationFrame ||
            w.msRequestAnimationFrame;
    w.cancelAnimationFrame = w.cancelAnimationFrame ||
            w.mozCancelAnimationFrame || w.webkitCancelAnimationFrame ||
            w.msCancelAnimationFrame;

    // polyfill, when necessary
    if (!w.requestAnimationFrame) {
        var aAnimQueue = [],
            aProcessing = [],
            iRequestId = 0,
            iIntervalId;

        // create a mock requestAnimationFrame function
        w.requestAnimationFrame = function(callback) {
            aAnimQueue.push([++iRequestId, callback]);

            if (!iIntervalId) {
                iIntervalId = setInterval(function() {
                    if (aAnimQueue.length) {
                        var time = +new Date();
                        // Process all of the currently outstanding frame
                        // requests, but none that get added during the
                        // processing.
                        // Swap the arrays so we don't have to create a new
                        // array every frame.
                        var temp = aProcessing;
                        aProcessing = aAnimQueue;
                        aAnimQueue = temp;
                        while (aProcessing.length) {
                            aProcessing.shift()[1](time);
                        }
                    } else {
                        // don't continue the interval, if unnecessary
                        clearInterval(iIntervalId);
                        iIntervalId = undefined;
                    }
                }, 1000 / 50);  // estimating support for 50 frames per second
            }

            return iRequestId;
        };

        // create a mock cancelAnimationFrame function
        w.cancelAnimationFrame = function(requestId) {
            // find the request ID and remove it
            var i, j;
            for (i = 0, j = aAnimQueue.length; i < j; i += 1) {
                if (aAnimQueue[i][0] === requestId) {
                    aAnimQueue.splice(i, 1);
                    return;
                }
            }

            // If it's not in the queue, it may be in the set we're currently
            // processing (if cancelAnimationFrame is called from within a
            // requestAnimationFrame callback).
            for (i = 0, j = aProcessing.length; i < j; i += 1) {
                if (aProcessing[i][0] === requestId) {
                    aProcessing.splice(i, 1);
                    return;
                }
            }
        };
    }
})(window);


PhotoSphereViewer.ICONS['compass.svg'] = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><path d="M49.997,0C22.38,0.004,0.005,22.383,0,50.002C0.005,77.614,22.38,99.995,49.997,100C77.613,99.995,99.996,77.614,100,50.002C99.996,22.383,77.613,0.004,49.997,0z M49.997,88.81c-21.429-0.04-38.772-17.378-38.809-38.807c0.037-21.437,17.381-38.775,38.809-38.812C71.43,11.227,88.769,28.567,88.81,50.002C88.769,71.432,71.43,88.77,49.997,88.81z"/><path d="M72.073,25.891L40.25,41.071l-0.003-0.004l-0.003,0.009L27.925,74.109l31.82-15.182l0.004,0.004l0.002-0.007l-0.002-0.004L72.073,25.891z M57.837,54.411L44.912,42.579l21.092-10.062L57.837,54.411z"/><!--Created by iconoci from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['download.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><path d="M83.285,35.575H66.271L66.277,3H32.151v32.575H16.561l33.648,32.701L83.285,35.575z"/><path d="M83.316,64.199v16.32H16.592v-16.32H-0.094v32.639H100V64.199H83.316z"/><!--Created by Michael Zenaty from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['fullscreen-in.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><polygon points="100,39.925 87.105,39.925 87.105,18.895 66.075,18.895 66.075,6 100,6"/><polygon points="100,93.221 66.075,93.221 66.075,80.326 87.105,80.326 87.105,59.295 100,59.295"/><polygon points="33.925,93.221 0,93.221 0,59.295 12.895,59.295 12.895,80.326 33.925,80.326"/><polygon points="12.895,39.925 0,39.925 0,6 33.925,6 33.925,18.895 12.895,18.895"/><!--Created by Garrett Knoll from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['fullscreen-out.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><polygon points="66.075,7 78.969,7 78.969,28.031 100,28.031 100,40.925 66.075,40.925"/><polygon points="66.075,60.295 100,60.295 100,73.19 78.969,73.19 78.969,94.221 66.075,94.221"/><polygon points="0,60.295 33.925,60.295 33.925,94.221 21.031,94.221 21.031,73.19 0,73.19"/><polygon points="21.031,7 33.925,7 33.925,40.925 0,40.925 0,28.031 21.031,28.031"/><!--Created by Garrett Knoll from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['pin.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enable-background="new 0 0 48 48" xml:space="preserve"><path d="M24,0C13.798,0,5.499,8.3,5.499,18.501c0,10.065,17.57,28.635,18.318,29.421C23.865,47.972,23.931,48,24,48s0.135-0.028,0.183-0.078c0.748-0.786,18.318-19.355,18.318-29.421C42.501,8.3,34.202,0,24,0z M24,7.139c5.703,0,10.342,4.64,10.342,10.343c0,5.702-4.639,10.342-10.342,10.342c-5.702,0-10.34-4.64-10.34-10.342C13.66,11.778,18.298,7.139,24,7.139z"/><!--Created by Daniele Marucci from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['play-active.svg'] = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 41 41" enable-background="new 0 0 41 41" xml:space="preserve"><path d="M40.5,14.1c-0.1-0.1-1.2-0.5-2.898-1C37.5,13.1,37.4,13,37.4,12.9C34.5,6.5,28,2,20.5,2S6.6,6.5,3.7,12.9c0,0.1-0.1,0.1-0.2,0.2c-1.7,0.6-2.8,1-2.9,1L0,14.4v12.1l0.6,0.2c0.1,0,1.1,0.399,2.7,0.899c0.1,0,0.2,0.101,0.2,0.199C6.3,34.4,12.9,39,20.5,39c7.602,0,14.102-4.6,16.9-11.1c0-0.102,0.1-0.102,0.199-0.2c1.699-0.601,2.699-1,2.801-1l0.6-0.3V14.3L40.5,14.1z M6.701,11.5C9.7,7,14.8,4,20.5,4c5.8,0,10.9,3,13.8,7.5c0.2,0.3-0.1,0.6-0.399,0.5c-3.799-1-8.799-2-13.6-2c-4.7,0-9.5,1-13.2,2C6.801,12.1,6.601,11.8,6.701,11.5z M25.1,20.3L18.7,24c-0.3,0.2-0.7,0-0.7-0.5v-7.4c0-0.4,0.4-0.6,0.7-0.4 l6.399,3.8C25.4,19.6,25.4,20.1,25.1,20.3z M34.5,29.201C31.602,33.9,26.4,37,20.5,37c-5.9,0-11.1-3.1-14-7.898c-0.2-0.302,0.1-0.602,0.4-0.5c3.9,1,8.9,2.1,13.6,2.1c5,0,9.9-1,13.602-2C34.4,28.602,34.602,28.9,34.5,29.201z"/><!--Created by Nick Bluth from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['play.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 41 41" enable-background="new 0 0 41 41" xml:space="preserve"><path d="M40.5,14.1c-0.1-0.1-1.2-0.5-2.899-1c-0.101,0-0.2-0.1-0.2-0.2C34.5,6.5,28,2,20.5,2S6.6,6.5,3.7,12.9c0,0.1-0.1,0.1-0.2,0.2c-1.7,0.6-2.8,1-2.9,1L0,14.4v12.1l0.6,0.2c0.1,0,1.1,0.4,2.7,0.9c0.1,0,0.2,0.1,0.2,0.199C6.3,34.4,12.9,39,20.5,39c7.601,0,14.101-4.6,16.9-11.1c0-0.101,0.1-0.101,0.2-0.2c1.699-0.6,2.699-1,2.8-1l0.6-0.3V14.3L40.5,14.1zM20.5,4c5.8,0,10.9,3,13.8,7.5c0.2,0.3-0.1,0.6-0.399,0.5c-3.8-1-8.8-2-13.6-2c-4.7,0-9.5,1-13.2,2c-0.3,0.1-0.5-0.2-0.4-0.5C9.7,7,14.8,4,20.5,4z M20.5,37c-5.9,0-11.1-3.1-14-7.899c-0.2-0.301,0.1-0.601,0.4-0.5c3.9,1,8.9,2.1,13.6,2.1c5,0,9.9-1,13.601-2c0.3-0.1,0.5,0.2,0.399,0.5C31.601,33.9,26.4,37,20.5,37z M39.101,24.9c0,0.1-0.101,0.3-0.2,0.3c-2.5,0.9-10.4,3.6-18.4,3.6c-7.1,0-15.6-2.699-18.3-3.6C2.1,25.2,2,25,2,24.9V16c0-0.1,0.1-0.3,0.2-0.3c2.6-0.9,10.6-3.6,18.2-3.6c7.5,0,15.899,2.7,18.5,3.6c0.1,0,0.2,0.2,0.2,0.3V24.9z"/><path d="M18.7,24l6.4-3.7c0.3-0.2,0.3-0.7,0-0.8l-6.4-3.8c-0.3-0.2-0.7,0-0.7,0.4v7.4C18,24,18.4,24.2,18.7,24z"/><!--Created by Nick Bluth from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['zoom-in.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 20 20" enable-background="new 0 0 20 20" xml:space="preserve"><path d="M14.043,12.22c2.476-3.483,1.659-8.313-1.823-10.789C8.736-1.044,3.907-0.228,1.431,3.255c-2.475,3.482-1.66,8.312,1.824,10.787c2.684,1.908,6.281,1.908,8.965,0l4.985,4.985c0.503,0.504,1.32,0.504,1.822,0c0.505-0.503,0.505-1.319,0-1.822L14.043,12.22z M7.738,13.263c-3.053,0-5.527-2.475-5.527-5.525c0-3.053,2.475-5.527,5.527-5.527c3.05,0,5.524,2.474,5.524,5.527C13.262,10.789,10.788,13.263,7.738,13.263z"/><polygon points="8.728,4.009 6.744,4.009 6.744,6.746 4.006,6.746 4.006,8.73 6.744,8.73 6.744,11.466 8.728,11.466 8.728,8.73 11.465,8.73 11.465,6.746 8.728,6.746"/><!--Created by Ryan Canning from the Noun Project--></svg>';

PhotoSphereViewer.ICONS['zoom-out.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 20 20" enable-background="new 0 0 20 20" xml:space="preserve"><path d="M14.043,12.22c2.476-3.483,1.659-8.313-1.823-10.789C8.736-1.044,3.907-0.228,1.431,3.255c-2.475,3.482-1.66,8.312,1.824,10.787c2.684,1.908,6.281,1.908,8.965,0l4.985,4.985c0.503,0.504,1.32,0.504,1.822,0c0.505-0.503,0.505-1.319,0-1.822L14.043,12.22z M7.738,13.263c-3.053,0-5.527-2.475-5.527-5.525c0-3.053,2.475-5.527,5.527-5.527c3.05,0,5.524,2.474,5.524,5.527C13.262,10.789,10.788,13.263,7.738,13.263z"/><rect x="4.006" y="6.746" width="7.459" height="1.984"/><!--Created by Ryan Canning from the Noun Project--></svg>';

PhotoSphereViewer.Error = PSVError;
PhotoSphereViewer.Utils = PSVUtils;

return PhotoSphereViewer;
}));
