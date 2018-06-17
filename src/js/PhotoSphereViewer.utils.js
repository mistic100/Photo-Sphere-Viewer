/**
 * @summary Inits the global SYSTEM var with generic support information
 * @private
 */
PhotoSphereViewer._loadSystem = function() {
  var S = PhotoSphereViewer.SYSTEM;
  S.loaded = true;
  S.pixelRatio = window.devicePixelRatio || 1;
  S.isWebGLSupported = PSVUtils.isWebGLSupported();
  S.isCanvasSupported = PSVUtils.isCanvasSupported();
  S.maxTextureWidth = S.isWebGLSupported ? PSVUtils.getMaxTextureWidth() : 4096;
  S.mouseWheelEvent = PSVUtils.mouseWheelEvent();
  S.fullscreenEvent = PSVUtils.fullscreenEvent();
  S.deviceOrientationSupported = PSVUtils.isDeviceOrientationSupported();
  S.touchEnabled = PSVUtils.isTouchEnabled();
};

/**
 * @summary Sets the viewer size
 * @param {PhotoSphereViewer.Size} size
 * @private
 */
PhotoSphereViewer.prototype._setViewerSize = function(size) {
  ['width', 'height'].forEach(function(dim) {
    if (size[dim]) {
      if (/^[0-9.]+$/.test(size[dim])) {
        size[dim] += 'px';
      }
      this.parent.style[dim] = size[dim];
    }
  }, this);
};

/**
 * @summary Converts pixel texture coordinates to spherical radians coordinates
 * @param {PhotoSphereViewer.Point} point
 * @returns {PhotoSphereViewer.Position}
 */
PhotoSphereViewer.prototype.textureCoordsToSphericalCoords = function(point) {
  if (this.prop.isCubemap) {
    throw new PSVError('Unable to use texture coords with cubemap.');
  }

  var relativeX = (point.x + this.prop.pano_data.cropped_x) / this.prop.pano_data.full_width * PSVUtils.TwoPI;
  var relativeY = (point.y + this.prop.pano_data.cropped_y) / this.prop.pano_data.full_height * Math.PI;

  return {
    longitude: relativeX >= Math.PI ? relativeX - Math.PI : relativeX + Math.PI,
    latitude: PSVUtils.HalfPI - relativeY
  };
};

/**
 * @summary Converts spherical radians coordinates to pixel texture coordinates
 * @param {PhotoSphereViewer.Position} position
 * @returns {PhotoSphereViewer.Point}
 */
PhotoSphereViewer.prototype.sphericalCoordsToTextureCoords = function(position) {
  if (this.prop.isCubemap) {
    throw new PSVError('Unable to use texture coords with cubemap.');
  }

  var relativeLong = position.longitude / PSVUtils.TwoPI * this.prop.pano_data.full_width;
  var relativeLat = position.latitude / Math.PI * this.prop.pano_data.full_height;

  return {
    x: parseInt(position.longitude < Math.PI ? relativeLong + this.prop.pano_data.full_width / 2 : relativeLong - this.prop.pano_data.full_width / 2) - this.prop.pano_data.cropped_x,
    y: parseInt(this.prop.pano_data.full_height / 2 - relativeLat) - this.prop.pano_data.cropped_y
  };
};

/**
 * @summary Converts spherical radians coordinates to a THREE.Vector3
 * @param {PhotoSphereViewer.Position} position
 * @returns {THREE.Vector3}
 */
PhotoSphereViewer.prototype.sphericalCoordsToVector3 = function(position) {
  return new THREE.Vector3(
    PhotoSphereViewer.SPHERE_RADIUS * -Math.cos(position.latitude) * Math.sin(position.longitude),
    PhotoSphereViewer.SPHERE_RADIUS * Math.sin(position.latitude),
    PhotoSphereViewer.SPHERE_RADIUS * Math.cos(position.latitude) * Math.cos(position.longitude)
  );
};

/**
 * @summary Converts a THREE.Vector3 to spherical radians coordinates
 * @param {THREE.Vector3} vector
 * @returns {PhotoSphereViewer.Position}
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
 * @summary Converts position on the viewer to a THREE.Vector3
 * @param {PhotoSphereViewer.Point} viewerPoint
 * @returns {THREE.Vector3}
 */
PhotoSphereViewer.prototype.viewerCoordsToVector3 = function(viewerPoint) {
  var screen = new THREE.Vector2(
    2 * viewerPoint.x / this.prop.size.width - 1,
    -2 * viewerPoint.y / this.prop.size.height + 1
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
 * @summary Converts a THREE.Vector3 to position on the viewer
 * @param {THREE.Vector3} vector
 * @returns {PhotoSphereViewer.Point}
 */
PhotoSphereViewer.prototype.vector3ToViewerCoords = function(vector) {
  vector = vector.clone();
  vector.project(this.camera);

  return {
    x: parseInt((vector.x + 1) / 2 * this.prop.size.width),
    y: parseInt((1 - vector.y) / 2 * this.prop.size.height)
  };
};

/**
 * @summary Converts x/y to latitude/longitude if present and ensure boundaries
 * @param {PhotoSphereViewer.ExtendedPosition} position - mutated
 * @private
 */
PhotoSphereViewer.prototype.cleanPosition = function(position) {
  if (position.hasOwnProperty('x') && position.hasOwnProperty('y')) {
    PSVUtils.deepmerge(position, this.textureCoordsToSphericalCoords(position));
  }

  position.longitude = PSVUtils.parseAngle(position.longitude);
  position.latitude = PSVUtils.parseAngle(position.latitude, true);
};

/**
 * @summary Apply "longitude_range" and "latitude_range"
 * @param {PhotoSphereViewer.Position} position - mutated
 * @returns {string[]} list of sides that were reached
 * @private
 */
PhotoSphereViewer.prototype.applyRanges = function(position) {
  var range, offset, sidesReached = [];

  if (this.config.longitude_range) {
    range = PSVUtils.clone(this.config.longitude_range);
    offset = THREE.Math.degToRad(this.prop.hFov) / 2;

    range[0] = PSVUtils.parseAngle(range[0] + offset);
    range[1] = PSVUtils.parseAngle(range[1] - offset);

    if (range[0] > range[1]) { // when the range cross longitude 0
      if (position.longitude > range[1] && position.longitude < range[0]) {
        if (position.longitude > (range[0] / 2 + range[1] / 2)) { // detect which side we are closer too
          position.longitude = range[0];
          sidesReached.push('left');
        }
        else {
          position.longitude = range[1];
          sidesReached.push('right');
        }
      }
    }
    else {
      if (position.longitude < range[0]) {
        position.longitude = range[0];
        sidesReached.push('left');
      }
      else if (position.longitude > range[1]) {
        position.longitude = range[1];
        sidesReached.push('right');
      }
    }
  }

  if (this.config.latitude_range) {
    range = PSVUtils.clone(this.config.latitude_range);
    offset = THREE.Math.degToRad(this.prop.vFov) / 2;

    range[0] = PSVUtils.parseAngle(Math.min(range[0] + offset, range[1]), true);
    range[1] = PSVUtils.parseAngle(Math.max(range[1] - offset, range[0]), true);

    if (position.latitude < range[0]) {
      position.latitude = range[0];
      sidesReached.push('bottom');
    }
    else if (position.latitude > range[1]) {
      position.latitude = range[1];
      sidesReached.push('top');
    }
  }

  return sidesReached;
};
