import * as THREE from 'three';
import { DEFAULTS, utils, Viewer } from 'photo-sphere-viewer';
import GyroscopePlugin from 'photo-sphere-viewer/dist/plugins/gyroscope';
import StereoPlugin from 'photo-sphere-viewer/dist/plugins/stereo';
import MarkersPlugin from 'photo-sphere-viewer/dist/plugins/markers';
import VisibleRangePlugin from 'photo-sphere-viewer/dist/plugins/visible-range';

/**
 * @private
 */
function snakeCaseToCamelCase(options) {
  if (typeof options === 'object') {
    utils.each(options, (value, key) => {
      if (typeof key === 'string' && key.indexOf('_') !== -1) {
        const camelKey = key.replace(/(_\w)/g, matches => matches[1].toUpperCase());
        options[camelKey] = snakeCaseToCamelCase(value);
        delete options[key];
      }
    });
  }

  return options;
}

/**
 * @private
 */
const RENAMED_OPTIONS = {
  animSpeed       : 'autorotateSpeed',
  animLat         : 'autorotateLat',
  usexmpdata      : 'useXmpData',
  mousemoveHover  : 'captureCursor',
  zoomSpeed       : 'zoomButtonIncrement',
  mousewheelFactor: 'mousewheelSpeed',
};

/**
 * @summary Compatibility wrapper for version 3
 * @memberOf PSV
 * @deprecated
 */
export default class ViewerCompat extends Viewer {

  /**
   * @param {PSV.Options} options
   * @fires PSV.ready
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  constructor(options) {
    snakeCaseToCamelCase(options);

    utils.each(RENAMED_OPTIONS, (newName, oldName) => {
      if (oldName in options) {
        options[newName] = options[oldName];
        delete options[oldName];
      }
    });

    if ('defaultFov' in options) {
      const minFov = options.minFov !== undefined ? options.minFov : DEFAULTS.minFov;
      const maxFov = options.maxFov !== undefined ? options.maxFov : DEFAULTS.maxFov;
      const defaultFov = utils.bound(options.defaultFov, minFov, maxFov);
      options.defaultZoomLvl = (defaultFov - minFov) / (maxFov - minFov) * 100;
      delete options.defaultFov;
    }

    if (!('timeAnim' in options)) {
      options.autorotateDelay = 2000;
    }
    else if (options.timeAnim === false) {
      options.autorotateDelay = null;
    }
    else if (typeof options.timeAnim === 'number') {
      options.autorotateDelay = options.timeAnim;
    }
    delete options.timeAnim;

    delete options.transition;

    if ('panoramaRoll' in options) {
      options.sphereCorrection = options.sphereCorrection || {};
      options.sphereCorrection.roll = options.panoramaRoll;
      delete options.panoramaRoll;
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

    const clickEventOnMarker = options.clickEventOnMarker;
    delete options.clickEventOnMarker;

    const markers = options.markers;
    delete options.markers;

    const longitudeRange = options.longitudeRange;
    delete options.longitudeRange;

    const latitudeRange = options.latitudeRange;
    delete options.latitudeRange;

    options.plugins = [];
    if (GyroscopePlugin) {
      options.plugins.push(GyroscopePlugin);
    }
    if (StereoPlugin) {
      options.plugins.push(StereoPlugin);
    }
    if (MarkersPlugin) {
      options.plugins.push([MarkersPlugin, { clickEventOnMarker, markers }]);
    }
    if (VisibleRangePlugin) {
      options.plugins.push([VisibleRangePlugin, { longitudeRange, latitudeRange }]);
    }

    super(options);

    this.gyroscope = this.getPlugin(GyroscopePlugin);
    this.stereo = this.getPlugin(StereoPlugin);
    this.markers = this.getPlugin(MarkersPlugin);
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
    if (panorama) {
      THREE.Cache.remove(panorama);
    }
    else {
      THREE.Cache.clear();
    }
  }

  // GYROSCOPE / STEREO

  isGyroscopeEnabled() {
    return this.gyroscope && this.gyroscope.isEnabled();
  }

  startGyroscopeControl() {
    return this.gyroscope && this.gyroscope.start();
  }

  stopGyroscopeControl() {
    this.gyroscope && this.gyroscope.stop();
  }

  toggleGyroscopeControl() {
    this.gyroscope && this.gyroscope.toggle();
  }

  isStereoEnabled() {
    return this.stereo && this.stereo.isEnabled();
  }

  startStereoView() {
    return this.stereo && this.stereo.start();
  }

  stopStereoView() {
    this.stereo && this.stereo.stop();
  }

  toggleStereoView() {
    this.stereo && this.stereo.toggle();
  }

  // MARKERS

  addMarker(marker, render) {
    return this.markers && this.markers.addMarker(snakeCaseToCamelCase(marker), render);
  }

  getMarker(markerId) {
    return this.markers && this.markers.getMarker(markerId);
  }

  updateMarker(marker, render) {
    return this.markers && this.markers.updateMarker(snakeCaseToCamelCase(marker), render);
  }

  removeMarker(marker, render) {
    this.markers && this.markers.removeMarker(marker, render);
  }

  gotoMarker(markerOrId, duration) {
    this.markers && this.markers.gotoMarker(markerOrId, duration);
  }

  hideMarker(markerId) {
    this.markers && this.markers.hideMarker(markerId);
  }

  showMarker(markerId) {
    this.markers && this.markers.showMarker(markerId);
  }

  clearMarkers(render) {
    this.markers && this.markers.clearMarkers(render);
  }

  getCurrentMarker() {
    return this.markers && this.markers.getCurrentMarker();
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
