/**
 * @module services
 */

/**
 * @summary Base services class
 * @memberof module:services
 * @abstract
 */
class AbstractService {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    /**
     * @summary Reference to main controller
     * @type {PhotoSphereViewer}
     * @readonly
     */
    this.psv = psv;

    /**
     * @summary Configuration holder
     * @type {PhotoSphereViewer.Options}
     * @readonly
     */
    this.config = psv.config;

    /**
     * @summary Properties holder
     * @type {Object}
     * @readonly
     */
    this.prop = psv.prop;
  }

  /**
   * @summary Destroys the service
   */
  destroy() {
    delete this.psv;
    delete this.config;
    delete this.prop;
  }

}

export { AbstractService };
