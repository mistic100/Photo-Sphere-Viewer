import { EVENTS, IDS } from '../data/constants';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar markers list button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVMarkersListButton extends AbstractButton {

  static get id() {
    return 'markersList';
  }

  static get icon() {
    return 'pinList';
  }

  get collapsable() {
    return true;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-markers-list-button');

    this.psv.on(EVENTS.OPEN_PANEL, this);
    this.psv.on(EVENTS.CLOSE_PANEL, this);

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    this.psv.off(EVENTS.OPEN_PANEL, this);
    this.psv.off(EVENTS.CLOSE_PANEL, this);

    super.destroy();
  }

  /**
   * @override
   */
  refresh() {
    const nbMarkers = this.psv.hud.getNbMarkers();
    if (nbMarkers === 0 && this.prop.visible) {
      this.hide();
    }
    else if (nbMarkers > 0 && !this.prop.visible) {
      this.show();
    }
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
      case EVENTS.OPEN_PANEL:  this.toggleActive(e.args[0] === IDS.MARKERS_LIST); break;
      case EVENTS.CLOSE_PANEL: this.toggleActive(false); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   * @description Toggles markers list
   */
  __onClick() {
    this.psv.toggleMarkersList();
  }

}

export { PSVMarkersListButton };
