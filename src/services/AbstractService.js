/**
 * @namespace PSV.services
 */

/**
 * @summary Base services class
 * @memberof PSV.services
 * @abstract
 */
export class AbstractService {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    /**
     * @summary Reference to main controller
     * @type {PSV.Viewer}
     * @readonly
     */
    this.psv = psv;

    /**
     * @summary Configuration holder
     * @type {PSV.Options}
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
