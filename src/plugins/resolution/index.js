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
 * @property {string} [defaultResolution] - the default resolution if no panorama is configured on the viewer
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

    if (this.config.defaultResolution && this.psv.config.panorama) {
      utils.logWarn('ResolutionPlugin, a defaultResolution was provided '
        + 'but a panorama is already configured on the viewer, '
        + 'the defaultResolution will be ignored.');
    }
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
      apply  : resolution => this.__setResolutionIfExists(resolution),
      badge  : !this.config.showBadge ? null : () => this.prop.resolution,
    });

    this.psv.on(CONSTANTS.EVENTS.PANORAMA_LOADED, this);

    if (this.config.resolutions) {
      this.setResolutions(this.config.resolutions, this.psv.config.panorama ? null : this.config.defaultResolution);
      delete this.config.resolutions;
      delete this.config.defaultResolution;
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
   * @param {string} [defaultResolution] - if not provided, the current panorama is kept
   */
  setResolutions(resolutions, defaultResolution) {
    this.resolutions = resolutions;
    this.resolutionsById = {};

    resolutions.forEach((resolution) => {
      if (!resolution.id) {
        throw new PSVError('Missing resolution id');
      }
      this.resolutionsById[resolution.id] = resolution;
    });

    // pick first resolution if no default provided and no current panorama
    if (!this.psv.config.panorama && !defaultResolution) {
      defaultResolution = resolutions[0].id;
    }

    // ensure the default resolution exists
    if (defaultResolution && !this.resolutionsById[defaultResolution]) {
      utils.logWarn(`Resolution ${defaultResolution} unknown`);
      defaultResolution = resolutions[0].id;
    }

    if (defaultResolution) {
      this.setResolution(defaultResolution);
    }

    this.__refreshResolution();
  }

  /**
   * @summary Changes the current resolution
   * @param {string} id
   * @throws {PSVError} if the resolution does not exist
   */
  setResolution(id) {
    if (!this.resolutionsById[id]) {
      throw new PSVError(`Resolution ${id} unknown`);
    }

    return this.__setResolutionIfExists(id);
  }

  /**
   * @private
   * @return {Promise}
   */
  __setResolutionIfExists(id) {
    if (this.resolutionsById[id]) {
      return this.psv.setPanorama(this.resolutionsById[id].panorama, { transition: false, showLoader: false });
    }
    else {
      return Promise.resolve();
    }
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
      this.settings?.updateButton();
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
