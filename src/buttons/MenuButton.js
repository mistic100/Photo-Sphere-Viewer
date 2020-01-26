import { BUTTON_DATA, EVENTS, IDS } from '../data/constants';
import menuIcon from '../icons/menu.svg';
import menuTemplate from '../templates/menu';
import { getClosest } from '../utils';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar menu button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class MenuButton extends AbstractButton {

  static id = 'menu';
  static icon = menuIcon;

  /**
   * @param {PSV.components.Navbar} navbar
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
  onClick() {
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
      content     : menuTemplate(this.parent.collapsed, this.psv),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? getClosest(e.target, 'li') : undefined;
        const buttonId = li ? li.dataset[BUTTON_DATA] : undefined;

        if (buttonId) {
          this.parent.getButton(buttonId).onClick();
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
