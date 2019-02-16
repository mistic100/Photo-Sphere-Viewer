import { BUTTON_DATA, EVENTS, IDS } from '../data/constants';
import { getClosest } from '../utils';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar menu button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVMenuButton extends AbstractButton {

  static get id() {
    return 'menu';
  }

  static get icon() {
    return 'menu';
  }

  get collapsable() {
    return false;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-menu-button');

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
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case EVENTS.OPEN_PANEL:  this.toggleActive(e.args[0] === IDS.MENU); break;
      case EVENTS.CLOSE_PANEL: this.toggleActive(false); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  hide(refresh) {
    super.hide(refresh);
    this.__hideMenu();
  }

  /**
   * @override
   */
  show(refresh) {
    super.show(refresh);

    if (this.prop.active) {
      this.__showMenu();
    }
  }

  /**
   * @override
   * @description Toggles menu
   */
  __onClick() {
    if (this.prop.active) {
      this.__hideMenu();
    }
    else {
      this.__showMenu();
    }
  }

  __showMenu() {
    this.psv.panel.show({
      id          : IDS.MENU,
      content     : this.psv.templates.menu(this.parent.collapsed, this.psv),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? getClosest(e.target, 'li') : undefined;
        const buttonId = li ? li.dataset[BUTTON_DATA] : undefined;

        if (buttonId) {
          this.parent.getButton(buttonId).__onClick();
          this.__hideMenu();
        }
      },
    });
  }

  __hideMenu() {
    if (this.psv.panel) {
      this.psv.panel.hide(IDS.MENU);
    }
  }

}

export { PSVMenuButton };
