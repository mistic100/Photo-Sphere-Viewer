import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, utils } from '../..';
import { EVENTS } from './constants';


/**
 * @typedef {Object} PSV.plugins.ResolutionPlugin.Resolution
 * @property {string} id
 * @property {string} label
 * @property {*} panorama
 */

/**
 * @typedef {Object} PSV.plugins.ResolutionPlugin.Options
 * @property {PSV.plugins.ResolutionPlugin.Resolution[]} resolutions - list of available resolutions
 * @property {boolean} [showBadge=true] - show the resolution id as a badge on the settings button
 */


DEFAULTS.lang.resolution = 'Quality';


export { EVENTS } from './constants';


/**
 * @summary Adds a setting to choose between multiple resolutions of the panorama.
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class ResolutionPlugin extends AbstractPlugin {

  static id = 'resolution';

  static EVENTS = EVENTS;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.ResolutionPlugin.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @type {PSV.plugins.SettingsPlugin}
     * @readonly
     * @private
     */
    this.settings = null;

    /**
     * @summary Available resolutions
     * @member {PSV.plugins.ResolutionPlugin.Resolution[]}
     */
    this.resolutions = [];

    /**
     * @summary Available resolutions
     * @member {Object.<string, PSV.plugins.ResolutionPlugin.Resolution>}
     * @private
     */
    this.resolutionsById = {};

    /**
     * @type {Object}
     * @property {string} resolution - Current resolution
     * @private
     */
    this.prop = {
      resolution: null,
    };

    /**
     * @type {PSV.plugins.ResolutionPlugin.Options}
     */
    this.config = {
      showBadge: true,
      ...options,
    };
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.settings = this.psv.getPlugin('settings');

    if (!this.settings) {
      throw new PSVError('Resolution plugin requires the Settings plugin');
    }

    this.settings.addSetting({
      id     : ResolutionPlugin.id,
      type   : 'options',
      label  : this.psv.config.lang.resolution,
      current: () => this.prop.resolution,
      options: () => this.__getSettingsOptions(),
      apply  : resolution => this.setResolution(resolution),
      badge  : !this.config.showBadge ? null : () => this.prop.resolution,
    });

    this.psv.on(CONSTANTS.EVENTS.PANORAMA_LOADED, this);

    if (this.config.resolutions) {
      this.setResolutions(this.config.resolutions);
      delete this.config.resolutions;
    }
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.PANORAMA_LOADED, this);

    this.settings.removeSetting(ResolutionPlugin.id);

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    if (e.type === CONSTANTS.EVENTS.PANORAMA_LOADED) {
      this.__refreshResolution();
    }
  }

  /**
   * @summary Changes the available resolutions
   * @param {PSV.plugins.ResolutionPlugin.Resolution[]} resolutions
   */
  setResolutions(resolutions) {
    this.resolutions = resolutions;
    this.resolutionsById = {};

    resolutions.forEach((resolution) => {
      if (!resolution.id) {
        throw new PSVError('Missing resolution id');
      }
      this.resolutionsById[resolution.id] = resolution;
    });

    this.__refreshResolution();
  }

  /**
   * @summary Changes the current resolution
   * @param {string} id
   */
  setResolution(id) {
    if (!this.resolutionsById[id]) {
      throw new PSVError(`Resolution ${id} unknown`);
    }

    return this.psv.setPanorama(this.resolutionsById[id].panorama, { transition: false, showLoader: false });
  }

  /**
   * @summary Returns the current resolution
   * @return {string}
   */
  getResolution() {
    return this.prop.resolution;
  }

  /**
   * @summary Updates current resolution on panorama load
   * @private
   */
  __refreshResolution() {
    const resolution = this.resolutions.find(r => utils.deepEqual(this.psv.config.panorama, r.panorama));
    if (this.prop.resolution !== resolution?.id) {
      this.prop.resolution = resolution?.id;
      this.settings?.updateBadge();
      this.trigger(EVENTS.RESOLUTION_CHANGED, this.prop.resolution);
    }
  }

  /**
   * @summary Returns options for Settings plugin
   * @return {PSV.plugins.SettingsPlugin.Option[]}
   * @private
   */
  __getSettingsOptions() {
    return this.resolutions
      .map(resolution => ({
        id   : resolution.id,
        label: resolution.label,
      }));
  }

}
