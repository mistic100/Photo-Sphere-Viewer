import { AbstractButton, CONSTANTS } from 'photo-sphere-viewer';
import MarkersPlugin from './index';
import pinList from './pin-list.svg';

/**
 * @summary Navigation bar markers list button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class MarkersListButton extends AbstractButton {

  static id = 'markersList';
  static icon = pinList;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-markers-list-button', true);

    /**
     * @type {PSV.plugins.MarkersPlugin}
     */
    this.plugin = this.psv.getPlugin(MarkersPlugin.id);

    if (this.plugin) {
      this.psv.on(CONSTANTS.EVENTS.OPEN_PANEL, this);
      this.psv.on(CONSTANTS.EVENTS.CLOSE_PANEL, this);
    }

    this.hide();
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
    return !!this.plugin;
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
      case CONSTANTS.EVENTS.OPEN_PANEL:  this.toggleActive(e.args[0] === MarkersPlugin.ID_PANEL_MARKERS_LIST); break;
      case CONSTANTS.EVENTS.CLOSE_PANEL: this.toggleActive(false); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles markers list
   */
  onClick() {
    this.plugin.toggleMarkersList();
  }

}
