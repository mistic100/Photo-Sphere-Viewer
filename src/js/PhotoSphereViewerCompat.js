import * as PhotoSphereViewer from 'photo-sphere-viewer';

function snakeCaseToCamelCase(options) {
  if (typeof options === 'object') {
    PhotoSphereViewer.Utils.each(options, (value, key) => {
      if (typeof key === 'string' && key.indexOf('_') !== -1) {
        const camelKey = key.replace(/(_\w)/g, matches => matches[1].toUpperCase());
        options[camelKey] = snakeCaseToCamelCase(value);
      }
    });
  }

  return options;
}

/**
 * Compatibility wrapper for version 3
 */
class PhotoSphereViewerCompat extends PhotoSphereViewer {

  constructor(options) {
    snakeCaseToCamelCase(options);

    if ('default_fov' in options) {
      const minFov = options.minFov !== undefined ? options.minFov : PhotoSphereViewer.DEFAULTS.minFov;
      const maxFov = options.maxFov !== undefined ? options.maxFov : PhotoSphereViewer.DEFAULTS.maxFov;
      const defaultFov = PhotoSphereViewer.Utils.bound(options.default_fov, minFov, maxFov);
      options.defaultZoomLvl = (defaultFov - minFov) / (maxFov - minFov) * 100;
    }

    if (!('time_anim' in options)) {
      options.autorotateDelay = 2000;
    }
    else if (options.time_anim === false) {
      options.autorotateDelay = null;
    }
    else if (typeof options.time_anim === 'number') {
      options.autorotateDelay = options.time_anim;
    }

    if ('anim_speed' in options) {
      options.autorotateSpeed = options.anim_speed;
    }

    if ('anim_lat' in options) {
      options.autorotateLat = options.anim_lat;
    }

    if ('usexmpdata' in options) {
      options.useXmpData = options.usexmpdata;
    }

    if (options.transition === false) {
      options.transitionDuration = 0;
    }
    else if (typeof options.transition === 'object') {
      options.transitionDuration = options.transition.duration;
      options.transitionLoader = options.transition.loader;
    }

    if ('panorama_roll' in options) {
      options.sphereCorrection = options.sphereCorrection || {};
      options.sphereCorrection.roll = options.panorama_roll;
    }

    if (typeof options.navbar === 'string') {
      options.navbar = options.navbar.split(' ');
    }
    if (Array.isArray(options.navbar)) {
      const markersIdx = options.navbar.indexOf('markers');
      if (markersIdx !== -1) {
        options.navbar.splice(markersIdx, 1, 'markersList');
      }
    }

    /* eslint-disable-next-line constructor-super */
    return super(options);
  }

  // GENERAL

  render() {
    this.renderer.render();
  }

  setPanorama(panorama, options = {}, transition = false) {
    snakeCaseToCamelCase(options);
    options.transition = transition;
    return super.setPanorama(panorama, options);
  }

  preloadPanorama(panorama) {
    return this.textureLoader.preloadPanorama(panorama);
  }

  clearPanoramaCache(panorama) {
    this.textureLoader.clearPanoramaCache(panorama);
  }

  getPanoramaCache(panorama) {
    return this.textureLoader.getPanoramaCache(panorama);
  }

  // HUD

  addMarker(marker, render) {
    return this.hud.addMarker(snakeCaseToCamelCase(marker), render);
  }

  getMarker(markerId) {
    return this.hud.getMarker(markerId);
  }

  updateMarker(marker, render) {
    return this.hud.updateMarker(snakeCaseToCamelCase(marker), render);
  }

  removeMarker(marker, render) {
    this.hud.removeMarker(marker, render);
  }

  gotoMarker(markerOrId, duration) {
    this.hud.gotoMarker(markerOrId, duration);
  }

  hideMarker(markerId) {
    this.hud.hideMarker(markerId);
  }

  showMarker(markerId) {
    this.hud.showMarker(markerId);
  }

  clearMarkers(render) {
    this.hud.clearMarkers(render);
  }

  getCurrentMarker() {
    return this.hud.getCurrentMarker();
  }

  // NAVBAR

  showNavbar() {
    this.navbar.show();
  }

  hideNavbar() {
    this.navbar.hide();
  }

  toggleNavbar() {
    this.navbar.toggle();
  }

  getNavbarButton(id, silent) {
    return this.navbar.getButton(id, silent);
  }

  setCaption(html) {
    return this.navbar.setCaption(html);
  }

  // NOTIFICATION

  showNotification(config) {
    this.notification.show(config);
  }

  hideNotification() {
    this.notification.hide();
  }

  isNotificationVisible() {
    return this.notification.isVisible();
  }

  // OVERLAY

  showOverlay(config) {
    this.overlay.show(config);
  }

  hideOverlay() {
    this.overlay.hide();
  }

  isOverlayVisible() {
    return this.overlay.isVisible();
  }

  // PANEL

  showPanel(config) {
    this.panel.show(config);
  }

  hidePanel() {
    this.panel.hide();
  }

  // TOOLTIP

  showTooltip(config) {
    this.prop.mainTooltip = this.tooltip.create(config);
  }

  hideTooltip() {
    if (this.prop.mainTooltip) {
      this.prop.mainTooltip.hide();
      this.prop.mainTooltip = null;
    }
  }

  isTooltipVisible() {
    return !!this.prop.mainTooltip;
  }

}

export default PhotoSphereViewerCompat;
