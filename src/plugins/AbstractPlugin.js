import { EventEmitter } from 'uevent';

/**
 * @namespace PSV.plugins
 */

/**
 * @summary Base plugins class
 * @memberof PSV.plugins
 * @abstract
 */
export class AbstractPlugin extends EventEmitter {

  /**
   * @summary Unique identifier of the plugin
   * @member {string}
   * @readonly
   * @static
   */
  static id = null;

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super();

    /**
     * @summary Reference to main controller
     * @type {PSV.Viewer}
     * @readonly
     */
    this.psv = psv;
  }

  /**
   * @summary Destroys the plugin
   * @package
   */
  destroy() {
    delete this.psv;
  }

}
