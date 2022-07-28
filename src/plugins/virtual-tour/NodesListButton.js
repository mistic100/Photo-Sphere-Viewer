import { AbstractButton, CONSTANTS } from '../..';
import { ID_PANEL_NODES_LIST } from './constants';
import nodesList from './nodes-list.svg';

/**
 * @summary Navigation bar markers list button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class NodesListButton extends AbstractButton {

  static id = 'nodesList';
  static icon = nodesList;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-nodes-list-button', true);

    /**
     * @type {PSV.plugins.VirtualTourPlugin}
     */
    this.plugin = this.psv.getPlugin('virtual-tour');

    if (this.plugin) {
      this.psv.on(CONSTANTS.EVENTS.OPEN_PANEL, this);
      this.psv.on(CONSTANTS.EVENTS.CLOSE_PANEL, this);
    }
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.OPEN_PANEL, this);
    this.psv.off(CONSTANTS.EVENTS.CLOSE_PANEL, this);

    super.destroy();
  }

  /**
   * @override
   */
  isSupported() {
    return !!this.plugin && !this.plugin.isServerSide() && !this.plugin.gallery;
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case CONSTANTS.EVENTS.OPEN_PANEL:  this.toggleActive(e.args[0] === ID_PANEL_NODES_LIST); break;
      case CONSTANTS.EVENTS.CLOSE_PANEL: this.toggleActive(false); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles nodes list
   */
  onClick() {
    this.plugin.toggleNodesList();
  }

}
