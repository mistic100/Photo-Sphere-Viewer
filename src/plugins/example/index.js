import { AbstractPlugin, CONSTANTS } from 'photo-sphere-viewer';

import '../../styles/plugins/example.scss';

/**
 * @summary Demo plugin which will overlay the current position on the viewer
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class ExamplePlugin extends AbstractPlugin {

  static get id() {
    return 'example';
  }

  /**
   * @param {PSV.Viewer} psv
   * @param {*} options
   */
  constructor(psv, options) {
    super(psv);
    this.options = options;
  }

  init() {
    this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);

    this.container = document.createElement('div');
    this.container.className = 'psv-example-plugin__container';

    this.psv.container.appendChild(this.container);

    this.__update(this.psv.prop.position);
  }

  destroy() {
    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);

    delete this.options;

    super.destroy();
  }

  handleEvent(e) {
    if (e.type === CONSTANTS.EVENTS.POSITION_UPDATED) {
      this.__update(e.args[0]);
    }
  }

  __update(position) {
    this.container.innerHTML = `longitude: ${position.longitude}<br>latitude: ${position.latitude}`;
  }

}
