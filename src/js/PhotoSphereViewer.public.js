/**
 * @summary Starts to load the panorama
 * @returns {Promise}
 * @throws {PSVError} when the panorama is not configured
 */
PhotoSphereViewer.prototype.load = function() {
  if (!this.config.panorama) {
    throw new PSVError('No value given for panorama.');
  }

  return this.setPanorama(this.config.panorama, false);
};

/**
 * @summary Returns the current position of the camera
 * @returns {PhotoSphereViewer.Position}
 */
PhotoSphereViewer.prototype.getPosition = function() {
  return {
    longitude: this.prop.longitude,
    latitude: this.prop.latitude
  };
};

/**
 * @summary Returns the current zoom level
 * @returns {int}
 */
PhotoSphereViewer.prototype.getZoomLevel = function() {
  return this.prop.zoom_lvl;
};

/**
 * @summary Returns the current viewer size
 * @returns {PhotoSphereViewer.Size}
 */
PhotoSphereViewer.prototype.getSize = function() {
  return {
    width: this.prop.size.width,
    height: this.prop.size.height
  };
};

/**
 * @summary Checks if the automatic rotation is enabled
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isAutorotateEnabled = function() {
  return !!this.prop.autorotate_reqid;
};

/**
 * @summary Checks if the gyroscope is enabled
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isGyroscopeEnabled = function() {
  return !!this.prop.orientation_reqid;
};

/**
 * @summary Checks if the viewer is in fullscreen
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isFullscreenEnabled = function() {
  return PSVUtils.isFullscreenEnabled(this.container);
};

/**
 * @summary Performs a render
 * @param {boolean} [updateDirection=true] - should update camera direction
 * @fires PhotoSphereViewer.render
 */
PhotoSphereViewer.prototype.render = function(updateDirection) {
  if (updateDirection !== false) {
    this.prop.direction = this.sphericalCoordsToVector3(this.prop);

    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(this.prop.direction);
  }

  if (this.config.fisheye) {
    this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
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

  /**
   * @event render
   * @memberof PhotoSphereViewer
   * @summary Triggered on each viewer render, **this event is triggered very often**
   */
  this.trigger('render');
};

/**
 * @summary Destroys the viewer
 * @description The memory used by the ThreeJS context is not totally cleared. This will be fixed as soon as possible.
 */
PhotoSphereViewer.prototype.destroy = function() {
  this._stopAll();
  this.stopKeyboardControl();

  if (this.isFullscreenEnabled()) {
    PSVUtils.exitFullscreen();
  }

  // remove listeners
  window.removeEventListener('resize', this);

  if (this.config.mousemove) {
    this.hud.container.removeEventListener('mousedown', this);
    this.hud.container.removeEventListener('touchstart', this);
    window.removeEventListener('mouseup', this);
    window.removeEventListener('touchend', this);
    this.hud.container.removeEventListener('mousemove', this);
    this.hud.container.removeEventListener('touchmove', this);
  }

  if (PhotoSphereViewer.SYSTEM.fullscreenEvent) {
    document.removeEventListener(PhotoSphereViewer.SYSTEM.fullscreenEvent, this);
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
    PSVUtils.cleanTHREEScene(this.scene);
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
  this.prop.cache.length = 0;
};

/**
 * @summary Loads a new panorama file
 * @description Loads a new panorama file, optionally changing the camera position and activating the transition animation.<br>
 * If the "position" is not defined, the camera will not move and the ongoing animation will continue<br>
 * "config.transition" must be configured for "transition" to be taken in account
 * @param {string|string[]} path - URL of the new panorama file
 * @param {PhotoSphereViewer.ExtendedPosition} [position]
 * @param {boolean} [transition=false]
 * @returns {Promise}
 * @throws {PSVError} when another panorama is already loading
 */
PhotoSphereViewer.prototype.setPanorama = function(path, position, transition) {
  if (this.prop.loading_promise !== null) {
    throw new PSVError('Loading already in progress');
  }

  if (typeof position == 'boolean') {
    transition = position;
    position = undefined;
  }

  if (transition && this.prop.isCubemap) {
    throw new PSVError('Transition is not available with cubemap.');
  }

  if (position) {
    this.cleanPosition(position);

    this._stopAll();
  }

  this.config.panorama = path;

  var self = this;

  if (!transition || !this.config.transition || !this.scene) {
    this.loader.show();
    if (this.canvas_container) {
      this.canvas_container.style.opacity = 0;
    }

    this.prop.loading_promise = this._loadTexture(this.config.panorama)
      .then(function(texture) {
        self._setTexture(texture);

        if (position) {
          self.rotate(position);
        }
      })
      .ensure(function() {
        self.loader.hide();
        self.canvas_container.style.opacity = 1;

        self.prop.loading_promise = null;
      })
      .rethrow();
  }
  else {
    if (this.config.transition.loader) {
      this.loader.show();
    }

    this.prop.loading_promise = this._loadTexture(this.config.panorama)
      .then(function(texture) {
        self.loader.hide();

        return self._transition(texture, position);
      })
      .ensure(function() {
        self.loader.hide();

        self.prop.loading_promise = null;
      })
      .rethrow();
  }

  return this.prop.loading_promise;
};

/**
 * @summary Starts the automatic rotation
 * @fires PhotoSphereViewer.autorotate
 */
PhotoSphereViewer.prototype.startAutorotate = function() {
  this._stopAll();

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

  /**
   * @event autorotate
   * @memberof PhotoSphereViewer
   * @summary Triggered when the automatic rotation is enabled/disabled
   * @param {boolean} enabled
   */
  this.trigger('autorotate', true);
};

/**
 * @summary Stops the automatic rotation
 * @fires PhotoSphereViewer.autorotate
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
 * @summary Starts or stops the automatic rotation
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
 * @summary Enables the gyroscope navigation
 * @fires PhotoSphereViewer.gyroscope-updated
 */
PhotoSphereViewer.prototype.startGyroscopeControl = function() {
  if (!this.doControls || !this.doControls.enabled || !this.doControls.deviceOrientation) {
    console.warn('PhotoSphereViewer: gyroscope disabled');
    return;
  }

  this._stopAll();

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

  /**
   * @event gyroscope-updated
   * @memberof PhotoSphereViewer
   * @summary Triggered when the gyroscope mode is enabled/disabled
   * @param {boolean} enabled
   */
  this.trigger('gyroscope-updated', true);
};

/**
 * @summary Disables the gyroscope navigation
 * @fires PhotoSphereViewer.gyroscope-updated
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
 * @summary Enables or disables the gyroscope navigation
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
 * @summary Rotates the view to specific longitude and latitude
 * @param {PhotoSphereViewer.ExtendedPosition} position
 * @param {boolean} [render=true]
 * @fires PhotoSphereViewer._side-reached
 * @fires PhotoSphereViewer.position-updated
 */
PhotoSphereViewer.prototype.rotate = function(position, render) {
  this.cleanPosition(position);

  /**
   * @event _side-reached
   * @memberof PhotoSphereViewer
   * @param {string} side
   * @private
   */
  this.applyRanges(position).forEach(
    this.trigger.bind(this, '_side-reached')
  );

  this.prop.longitude = position.longitude;
  this.prop.latitude = position.latitude;

  if (render !== false && this.renderer) {
    this.render();

    /**
     * @event position-updated
     * @memberof PhotoSphereViewer
     * @summary Triggered when the view longitude and/or latitude changes
     * @param {PhotoSphereViewer.Position} position
     */
    this.trigger('position-updated', this.getPosition());
  }
};

/**
 * @summary Rotates the view to specific longitude and latitude with a smooth animation
 * @param {PhotoSphereViewer.ExtendedPosition} position
 * @param {string|int} duration - animation speed or duration (in milliseconds)
 * @returns {Promise}
 */
PhotoSphereViewer.prototype.animate = function(position, duration) {
  this._stopAll();

  this.cleanPosition(position);

  if (!duration || Math.abs(position.longitude - this.prop.longitude) < PhotoSphereViewer.ANGLE_THRESHOLD && Math.abs(position.latitude - this.prop.latitude) < PhotoSphereViewer.ANGLE_THRESHOLD) {
    this.rotate(position);

    return D.resolved();
  }

  this.applyRanges(position).forEach(
    this.trigger.bind(this, '_side-reached')
  );

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
  var tOffset = PSVUtils.getShortestArc(this.prop.longitude, position.longitude);

  this.prop.animation_promise = PSVUtils.animation({
    properties: {
      longitude: { start: this.prop.longitude, end: this.prop.longitude + tOffset },
      latitude: { start: this.prop.latitude, end: position.latitude }
    },
    duration: duration,
    easing: 'inOutSine',
    onTick: this.rotate.bind(this)
  });

  return this.prop.animation_promise;
};

/**
 * @summary Stops the ongoing animation
 */
PhotoSphereViewer.prototype.stopAnimation = function() {
  if (this.prop.animation_promise) {
    this.prop.animation_promise.cancel();
    this.prop.animation_promise = null;
  }
};

/**
 * @summary Zooms to a specific level between `max_fov` and `min_fov`
 * @param {int} level - new zoom level from 0 to 100
 * @param {boolean} [render=true]
 * @fires PhotoSphereViewer.zoom-updated
 */
PhotoSphereViewer.prototype.zoom = function(level, render) {
  this.prop.zoom_lvl = PSVUtils.bound(Math.round(level), 0, 100);
  this.prop.vFov = this.config.max_fov + (this.prop.zoom_lvl / 100) * (this.config.min_fov - this.config.max_fov);
  this.prop.hFov = THREE.Math.radToDeg(2 * Math.atan(Math.tan(THREE.Math.degToRad(this.prop.vFov) / 2) * this.prop.aspect));

  if (render !== false && this.renderer) {
    this.render();

    /**
     * @event zoom-updated
     * @memberof PhotoSphereViewer
     * @summary Triggered when the zoom level changes
     * @param {int} zoomLevel
     */
    this.trigger('zoom-updated', this.getZoomLevel());
  }
};

/**
 * @summary Increases the zoom level by 1
 */
PhotoSphereViewer.prototype.zoomIn = function() {
  if (this.prop.zoom_lvl < 100) {
    this.zoom(this.prop.zoom_lvl + 1);
  }
};

/**
 * @summary Decreases the zoom level by 1
 */
PhotoSphereViewer.prototype.zoomOut = function() {
  if (this.prop.zoom_lvl > 0) {
    this.zoom(this.prop.zoom_lvl - 1);
  }
};

/**
 * @summary Resizes the viewer
 * @param {PhotoSphereViewer.CssSize} size
 */
PhotoSphereViewer.prototype.resize = function(size) {
  if (size.width) {
    this.container.style.width = size.width;
  }
  if (size.height) {
    this.container.style.height = size.height;
  }

  this._onResize();
};

/**
 * @summary Enters or exits the fullscreen mode
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
 * @summary Enables the keyboard controls (done automatically when entering fullscreen)
 */
PhotoSphereViewer.prototype.startKeyboardControl = function() {
  window.addEventListener('keydown', this);
};

/**
 * @summary Disables the keyboard controls (done automatically when exiting fullscreen)
 */
PhotoSphereViewer.prototype.stopKeyboardControl = function() {
  window.removeEventListener('keydown', this);
};

/**
 * @summary Preload a panorama file without displaying it
 * @param {string} panorama
 * @returns {Promise}
 * @throws {PSVError} when the cache is disabled
 */
PhotoSphereViewer.prototype.preloadPanorama = function(panorama) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot preload panorama, cache_texture is disabled');
  }

  return this._loadTexture(panorama);
};

/**
 * @summary Removes a panorama from the cache or clears the entire cache
 * @param {string} [panorama]
 * @throws {PSVError} when the cache is disabled
 */
PhotoSphereViewer.prototype.clearPanoramaCache = function(panorama) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot clear cache, cache_texture is disabled');
  }

  if (panorama) {
    for (var i = 0, l = this.prop.cache.length; i < l; i++) {
      if (this.prop.cache[i].panorama === panorama) {
        this.prop.cache.splice(i, 1);
        break;
      }
    }
  }
  else {
    this.prop.cache.length = 0;
  }
};

/**
 * @summary Retrieves the cache for a panorama
 * @param {string} panorama
 * @returns {PhotoSphereViewer.CacheItem}
 * @throws {PSVError} when the cache is disabled
 */
PhotoSphereViewer.prototype.getPanoramaCache = function(panorama) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot query cache, cache_texture is disabled');
  }

  return this.prop.cache.filter(function(cache) {
    return cache.panorama === panorama;
  }).shift();
};
