/**
 * @summary Loads the XMP data with AJAX
 * @param {string} panorama
 * @returns {Promise.<PhotoSphereViewer.PanoData>}
 * @throws {PSVError} when the image cannot be loaded
 * @private
 */
PhotoSphereViewer.prototype._loadXMP = function(panorama) {
  if (!this.config.usexmpdata) {
    return D.resolved(null);
  }

  var defer = D();
  var xhr = new XMLHttpRequest();
  var progress = 0;

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 0) {
        this.loader.setProgress(100);

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
        this.container.textContent = 'Cannot load image';
        throw new PSVError('Cannot load image');
      }
    }
    else if (xhr.readyState === 3) {
      this.loader.setProgress(progress += 10);
    }
  }.bind(this);

  xhr.onprogress = function(e) {
    if (e.lengthComputable) {
      var new_progress = parseInt(e.loaded / e.total * 100);
      if (new_progress > progress) {
        progress = new_progress;
        this.loader.setProgress(progress);
      }
    }
  }.bind(this);

  xhr.onerror = function() {
    this.container.textContent = 'Cannot load image';
    throw new PSVError('Cannot load image');
  }.bind(this);

  xhr.open('GET', panorama, true);
  xhr.send(null);

  return defer.promise;
};

/**
 * @summary Loads the panorama texture(s)
 * @param {string|string[]} panorama
 * @returns {Promise.<THREE.Texture|THREE.Texture[]>}
 * @fires PhotoSphereViewer.panorama-load-progress
 * @throws {PSVError} when the image cannot be loaded
 * @private
 */
PhotoSphereViewer.prototype._loadTexture = function(panorama) {
  var tempPanorama = [];

  if (Array.isArray(panorama)) {
    if (panorama.length !== 6) {
      throw new PSVError('Must provide exactly 6 image paths when using cubemap.');
    }

    // reorder images
    for (var i = 0; i < 6; i++) {
      tempPanorama[i] = panorama[PhotoSphereViewer.CUBE_MAP[i]];
    }
    panorama = tempPanorama;
  }
  else if (typeof panorama === 'object') {
    if (!PhotoSphereViewer.CUBE_HASHMAP.every(function(side) {
        return !!panorama[side];
      })) {
      throw new PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.');
    }

    // transform into array
    PhotoSphereViewer.CUBE_HASHMAP.forEach(function(side, i) {
      tempPanorama[i] = panorama[side];
    });
    panorama = tempPanorama;
  }

  if (Array.isArray(panorama)) {


    if (this.prop.isCubemap === false) {
      throw new PSVError('The viewer was initialized with an equirectangular panorama, cannot switch to cubemap.');
    }

    if (this.config.fisheye) {
      console.warn('PhotoSphereViewer: fisheye effect with cubemap texture can generate distorsions.');
    }

    if (this.config.cache_texture === PhotoSphereViewer.DEFAULTS.cache_texture) {
      this.config.cache_texture *= 6;
    }

    this.prop.isCubemap = true;

    return this._loadCubemapTexture(panorama);
  }
  else {
    if (this.prop.isCubemap === true) {
      throw new PSVError('The viewer was initialized with an cubemap, cannot switch to equirectangular panorama.');
    }

    this.prop.isCubemap = false;

    return this._loadEquirectangularTexture(panorama);
  }
};

/**
 * @summary Loads the sphere texture
 * @param {string} panorama
 * @returns {Promise.<THREE.Texture>}
 * @fires PhotoSphereViewer.panorama-load-progress
 * @throws {PSVError} when the image cannot be loaded
 * @private
 */
PhotoSphereViewer.prototype._loadEquirectangularTexture = function(panorama) {
  if (this.config.cache_texture) {
    var cache = this.getPanoramaCache(panorama);

    if (cache) {
      this.prop.pano_data = cache.pano_data;

      return D.resolved(cache.image);
    }
  }

  return this._loadXMP(panorama).then(function(pano_data) {
    var defer = D();
    var loader = new THREE.ImageLoader();
    var progress = pano_data ? 100 : 0;

    loader.setCrossOrigin('anonymous');

    var onload = function(img) {
      progress = 100;

      this.loader.setProgress(progress);

      /**
       * @event panorama-load-progress
       * @memberof PhotoSphereViewer
       * @summary Triggered while a panorama image is loading
       * @param {string} panorama
       * @param {int} progress
       */
      this.trigger('panorama-load-progress', panorama, progress);

      // Config XMP data
      if (!pano_data && this.config.pano_data) {
        pano_data = PSVUtils.clone(this.config.pano_data);
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

      this.prop.pano_data = pano_data;

      var texture;

      var ratio = Math.min(pano_data.full_width, PhotoSphereViewer.SYSTEM.maxTextureWidth) / pano_data.full_width;

      // resize image / fill cropped parts with black
      if (ratio !== 1 || pano_data.cropped_width !== pano_data.full_width || pano_data.cropped_height !== pano_data.full_height) {
        var resized_pano_data = PSVUtils.clone(pano_data);

        resized_pano_data.full_width *= ratio;
        resized_pano_data.full_height *= ratio;
        resized_pano_data.cropped_width *= ratio;
        resized_pano_data.cropped_height *= ratio;
        resized_pano_data.cropped_x *= ratio;
        resized_pano_data.cropped_y *= ratio;

        img.width = resized_pano_data.cropped_width;
        img.height = resized_pano_data.cropped_height;

        var buffer = document.createElement('canvas');
        buffer.width = resized_pano_data.full_width;
        buffer.height = resized_pano_data.full_height;

        var ctx = buffer.getContext('2d');
        ctx.drawImage(img, resized_pano_data.cropped_x, resized_pano_data.cropped_y, resized_pano_data.cropped_width, resized_pano_data.cropped_height);

        texture = new THREE.Texture(buffer);
      }
      else {
        texture = new THREE.Texture(img);
      }

      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      if (this.config.cache_texture) {
        this._putPanoramaCache({
          panorama: panorama,
          image: texture,
          pano_data: pano_data
        });
      }

      defer.resolve(texture);
    };

    var onprogress = function(e) {
      if (e.lengthComputable) {
        var new_progress = parseInt(e.loaded / e.total * 100);

        if (new_progress > progress) {
          progress = new_progress;
          this.loader.setProgress(progress);
          this.trigger('panorama-load-progress', panorama, progress);
        }
      }
    };

    var onerror = function(e) {
      this.container.textContent = 'Cannot load image';
      defer.reject(e);
      throw new PSVError('Cannot load image');
    };

    loader.load(panorama, onload.bind(this), onprogress.bind(this), onerror.bind(this));

    return defer.promise;
  }.bind(this));
};

/**
 * @summary Load the six textures of the cube
 * @param {string[]} panorama
 * @returns {Promise.<THREE.Texture[]>}
 * @fires PhotoSphereViewer.panorama-load-progress
 * @throws {PSVError} when the image cannot be loaded
 * @private
 */
PhotoSphereViewer.prototype._loadCubemapTexture = function(panorama) {
  var defer = D();
  var loader = new THREE.ImageLoader();
  var progress = [0, 0, 0, 0, 0, 0];
  var loaded = [];
  var done = 0;

  loader.setCrossOrigin('anonymous');

  var onend = function() {
    loaded.forEach(function(img) {
      img.needsUpdate = true;
      img.minFilter = THREE.LinearFilter;
      img.generateMipmaps = false;
    });

    defer.resolve(loaded);
  };

  var onload = function(i, img) {
    done++;
    progress[i] = 100;

    this.loader.setProgress(PSVUtils.sum(progress) / 6);
    this.trigger('panorama-load-progress', panorama[i], progress[i]);

    var ratio = Math.min(img.width, PhotoSphereViewer.SYSTEM.maxTextureWidth / 2) / img.width;

    // resize image
    if (ratio !== 1) {
      var buffer = document.createElement('canvas');
      buffer.width = img.width * ratio;
      buffer.height = img.height * ratio;

      var ctx = buffer.getContext('2d');
      ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

      loaded[i] = new THREE.Texture(buffer);
    }
    else {
      loaded[i] = new THREE.Texture(img);
    }

    if (this.config.cache_texture) {
      this._putPanoramaCache({
        panorama: panorama[i],
        image: loaded[i]
      });
    }

    if (done === 6) {
      onend();
    }
  };

  var onprogress = function(i, e) {
    if (e.lengthComputable) {
      var new_progress = parseInt(e.loaded / e.total * 100);

      if (new_progress > progress[i]) {
        progress[i] = new_progress;
        this.loader.setProgress(PSVUtils.sum(progress) / 6);
        this.trigger('panorama-load-progress', panorama[i], progress[i]);
      }
    }
  };

  var onerror = function(i, e) {
    this.container.textContent = 'Cannot load image';
    defer.reject(e);
    throw new PSVError('Cannot load image ' + i);
  };

  for (var i = 0; i < 6; i++) {
    if (this.config.cache_texture) {
      var cache = this.getPanoramaCache(panorama[i]);

      if (cache) {
        done++;
        progress[i] = 100;
        loaded[i] = cache.image;
        continue;
      }
    }

    loader.load(panorama[i], onload.bind(this, i), onprogress.bind(this, i), onerror.bind(this, i));
  }

  if (done === 6) {
    defer.resolve(loaded);
  }

  return defer.promise;
};

/**
 * @summary Applies the texture to the scene, creates the scene if needed
 * @param {THREE.Texture|THREE.Texture[]} texture
 * @fires PhotoSphereViewer.panorama-loaded
 * @private
 */
PhotoSphereViewer.prototype._setTexture = function(texture) {
  if (!this.scene) {
    this._createScene();
  }

  if (this.prop.isCubemap) {
    for (var i = 0; i < 6; i++) {
      if (this.mesh.material[i].map) {
        this.mesh.material[i].map.dispose();
      }

      this.mesh.material[i].map = texture[i];
    }
  }
  else {
    if (this.mesh.material.map) {
      this.mesh.material.map.dispose();
    }

    this.mesh.material.map = texture;
  }

  /**
   * @event panorama-loaded
   * @memberof PhotoSphereViewer
   * @summary Triggered when a panorama image has been loaded
   */
  this.trigger('panorama-loaded');

  this.render();
};

/**
 * @summary Creates the 3D scene and GUI components
 * @private
 */
PhotoSphereViewer.prototype._createScene = function() {
  this.raycaster = new THREE.Raycaster();

  this.renderer = PhotoSphereViewer.SYSTEM.isWebGLSupported && this.config.webgl ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.setSize(this.prop.size.width, this.prop.size.height);
  this.renderer.setPixelRatio(PhotoSphereViewer.SYSTEM.pixelRatio);

  var cameraDistance = PhotoSphereViewer.SPHERE_RADIUS;
  if (this.prop.isCubemap) {
    cameraDistance *= Math.sqrt(3);
  }
  if (this.config.fisheye) {
    cameraDistance += PhotoSphereViewer.SPHERE_RADIUS;
  }

  this.camera = new THREE.PerspectiveCamera(this.config.default_fov, this.prop.size.width / this.prop.size.height, 1, cameraDistance);
  this.camera.position.set(0, 0, 0);

  if (this.config.gyroscope && PSVUtils.checkTHREE('DeviceOrientationControls')) {
    this.doControls = new THREE.DeviceOrientationControls(this.camera);
  }

  this.scene = new THREE.Scene();
  this.scene.add(this.camera);

  if (this.prop.isCubemap) {
    this._createCubemap();
  }
  else {
    this._createSphere();
  }

  // create canvas container
  this.canvas_container = document.createElement('div');
  this.canvas_container.className = 'psv-canvas-container';
  this.renderer.domElement.className = 'psv-canvas';
  this.container.appendChild(this.canvas_container);
  this.canvas_container.appendChild(this.renderer.domElement);
};

/**
 * @summary Creates the sphere mesh
 * @private
 */
PhotoSphereViewer.prototype._createSphere = function() {
  // The middle of the panorama is placed at longitude=0
  var geometry = new THREE.SphereGeometry(
    PhotoSphereViewer.SPHERE_RADIUS,
    PhotoSphereViewer.SPHERE_VERTICES,
    PhotoSphereViewer.SPHERE_VERTICES,
    -PSVUtils.HalfPI
  );

  var material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide, // needs to be DoubleSide for CanvasRenderer
    overdraw: PhotoSphereViewer.SYSTEM.isWebGLSupported && this.config.webgl ? 0 : 1
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.scale.x = -1;
  this.mesh.rotation.x = this.config.sphere_correction.tilt;
  this.mesh.rotation.y = this.config.sphere_correction.pan;
  this.mesh.rotation.z = this.config.sphere_correction.roll;

  this.scene.add(this.mesh);
};

/**
 * @summary Creates the cube mesh
 * @private
 */
PhotoSphereViewer.prototype._createCubemap = function() {
  var geometry = new THREE.BoxGeometry(
    PhotoSphereViewer.SPHERE_RADIUS * 2, PhotoSphereViewer.SPHERE_RADIUS * 2, PhotoSphereViewer.SPHERE_RADIUS * 2,
    PhotoSphereViewer.CUBE_VERTICES, PhotoSphereViewer.CUBE_VERTICES, PhotoSphereViewer.CUBE_VERTICES
  );

  var materials = [];
  for (var i = 0; i < 6; i++) {
    materials.push(new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      overdraw: PhotoSphereViewer.SYSTEM.isWebGLSupported && this.config.webgl ? 0 : 1
    }));
  }

  this.mesh = new THREE.Mesh(geometry, materials);
  this.mesh.position.x -= PhotoSphereViewer.SPHERE_RADIUS;
  this.mesh.position.y -= PhotoSphereViewer.SPHERE_RADIUS;
  this.mesh.position.z -= PhotoSphereViewer.SPHERE_RADIUS;
  this.mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, -1));

  this.scene.add(this.mesh);
};

/**
 * @summary Performs transition between the current and a new texture
 * @param {THREE.Texture} texture
 * @param {PhotoSphereViewer.Position} [position]
 * @returns {Promise}
 * @private
 * @throws {PSVError} if the panorama is a cubemap
 */
PhotoSphereViewer.prototype._transition = function(texture, position) {
  if (this.prop.isCubemap) {
    throw new PSVError('Transition is not available with cubemap.');
  }

  // create a new sphere with the new texture
  var geometry = new THREE.SphereGeometry(
    PhotoSphereViewer.SPHERE_RADIUS * 0.9,
    PhotoSphereViewer.SPHERE_VERTICES,
    PhotoSphereViewer.SPHERE_VERTICES,
    -PSVUtils.HalfPI
  );

  var material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    overdraw: PhotoSphereViewer.SYSTEM.isWebGLSupported && this.config.webgl ? 0 : 1,
    map: texture,
    transparent: true,
    opacity: 0
  });

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

  return PSVUtils.animation({
    properties: {
      opacity: { start: 0.0, end: 1.0 }
    },
    duration: this.config.transition.duration,
    easing: 'outCubic',
    onTick: function(properties) {
      material.opacity = properties.opacity;

      this.render();
    }.bind(this)
  })
    .then(function() {
      // remove temp sphere and transfer the texture to the main sphere
      this.mesh.material.map.dispose();
      this.mesh.material.map = texture;

      this.scene.remove(mesh);

      mesh.geometry.dispose();
      mesh.geometry = null;
      mesh.material.dispose();
      mesh.material = null;

      // actually rotate the camera
      if (position) {
        // FIXME: find a better way to handle ranges
        if (this.config.latitude_range || this.config.longitude_range) {
          this.config.longitude_range = this.config.latitude_range = null;
          console.warn('PhotoSphereViewer: trying to perform transition with longitude_range and/or latitude_range, ranges cleared.');
        }

        this.rotate(position);
      }
      else {
        this.render();
      }
    }.bind(this));
};

/**
 * @summary Reverses autorotate direction with smooth transition
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
 * @summary Adds a panorama to the cache
 * @param {PhotoSphereViewer.CacheItem} cache
 * @fires PhotoSphereViewer.panorama-cached
 * @throws {PSVError} when the cache is disabled
 * @private
 */
PhotoSphereViewer.prototype._putPanoramaCache = function(cache) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot add panorama to cache, cache_texture is disabled');
  }

  var existingCache = this.getPanoramaCache(cache.panorama);

  if (existingCache) {
    existingCache.image = cache.image;
    existingCache.pano_data = cache.pano_data;
  }
  else {
    this.prop.cache = this.prop.cache.slice(0, this.config.cache_texture - 1); // remove most ancient elements
    this.prop.cache.unshift(cache);
  }

  /**
   * @event panorama-cached
   * @memberof PhotoSphereViewer
   * @summary Triggered when a panorama is stored in the cache
   * @param {string} panorama
   */
  this.trigger('panorama-cached', cache.panorama);
};

/**
 * @summary Stops all current animations
 * @private
 */
PhotoSphereViewer.prototype._stopAll = function() {
  this.stopAutorotate();
  this.stopAnimation();
  this.stopGyroscopeControl();
};
