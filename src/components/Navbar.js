import { AutorotateButton } from '../buttons/AutorotateButton';
import { CustomButton } from '../buttons/CustomButton';
import { DownloadButton } from '../buttons/DownloadButton';
import { FullscreenButton } from '../buttons/FullscreenButton';
import { MenuButton } from '../buttons/MenuButton';
import { ZoomInButton } from '../buttons/ZoomInButton';
import { ZoomOutButton } from '../buttons/ZoomOutButton';
import { ZoomRangeButton } from '../buttons/ZoomRangeButton';
import { DEFAULTS } from '../data/config';
import { PSVError } from '../PSVError';
import '../styles/navbar.scss';
import { clone, logWarn } from '../utils';
import { AbstractComponent } from './AbstractComponent';
import { NavbarCaption } from './NavbarCaption';

/**
 * @summary List of available buttons
 * @type {Object<string, Class<PSV.buttons.AbstractButton>>}
 * @private
 */
const AVAILABLE_BUTTONS = {};

/**
 * @summary Register a new button available for all viewers
 * @param {Class<PSV.buttons.AbstractButton>} button
 * @memberOf PSV
 */
export function registerButton(button) {
  if (!button.id) {
    throw new PSVError('Button ID is required');
  }

  AVAILABLE_BUTTONS[button.id] = button;
}

[
  AutorotateButton,
  ZoomInButton,
  ZoomRangeButton,
  ZoomOutButton,
  DownloadButton,
  FullscreenButton,
].forEach(registerButton);

/**
 * @summary Navigation bar class
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.components
 */
export class Navbar extends AbstractComponent {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-navbar');

    /**
     * @summary List of buttons of the navbar
     * @member {PSV.buttons.AbstractButton[]}
     * @override
     */
    this.children = [];

    /**
     * @summary List of collapsed buttons
     * @member {PSV.buttons.AbstractButton[]}
     * @private
     */
    this.collapsed = [];
  }

  /**
   * @summary Change the buttons visible on the navbar
   * @param {string|Array<string|PSV.NavbarCustomButton>} buttons
   */
  setButtons(buttons) {
    this.children.slice().forEach(item => item.destroy());
    this.children.length = 0;

    /* eslint-disable no-new */
    this.__cleanButtons(buttons).forEach((button) => {
      if (typeof button === 'object') {
        new CustomButton(this, button);
      }
      else if (AVAILABLE_BUTTONS[button]) {
        new AVAILABLE_BUTTONS[button](this);
      }
      else if (button === 'caption') {
        new NavbarCaption(this, this.psv.config.caption);
      }
      else if (button === 'zoom') {
        new ZoomOutButton(this);
        new ZoomRangeButton(this);
        new ZoomInButton(this);
      }
      else {
        throw new PSVError('Unknown button ' + button);
      }
    });

    new MenuButton(this);
    /* eslint-enable no-new */

    this.children.forEach((item) => {
      if (typeof item.checkSupported === 'function') {
        item.checkSupported();
      }
    });
  }

  /**
   * @summary Sets the bar caption
   * @param {string} html
   */
  setCaption(html) {
    const caption = this.getButton('caption', false);

    if (!caption) {
      throw new PSVError('Cannot set caption, the navbar caption container is not initialized.');
    }

    caption.setCaption(html);
  }

  /**
   * @summary Returns a button by its identifier
   * @param {string} id
   * @param {boolean} [warnNotFound=true]
   * @returns {PSV.buttons.AbstractButton}
   */
  getButton(id, warnNotFound = true) {
    let button = null;

    this.children.some((item) => {
      if (item.prop.id === id) {
        button = item;
        return true;
      }
      else {
        return false;
      }
    });

    if (!button && warnNotFound) {
      logWarn(`button "${id}" not found in the navbar`);
    }

    return button;
  }

  /**
   * @summary Shows the navbar
   */
  show() {
    this.container.classList.add('psv-navbar--open');
    this.prop.visible = true;
  }

  /**
   * @summary Hides the navbar
   */
  hide() {
    this.container.classList.remove('psv-navbar--open');
    this.prop.visible = false;
  }

  /**
   * @override
   */
  refreshUi() {
    super.refreshUi();

    if (this.psv.prop.uiRefresh === true) {
      const availableWidth = this.container.offsetWidth;

      let totalWidth = 0;
      const visibleButtons = [];
      const collapsableButtons = [];

      this.children.forEach((item) => {
        if (item.prop.visible) {
          totalWidth += item.prop.width;
          visibleButtons.push(item);
          if (item.prop.collapsable) {
            collapsableButtons.push(item);
          }
        }
      });

      if (!visibleButtons.length) {
        return;
      }

      if (availableWidth < totalWidth && collapsableButtons.length > 0) {
        collapsableButtons.forEach(item => item.collapse());
        this.collapsed = collapsableButtons;

        this.getButton(MenuButton.id).show(false);
      }
      else if (availableWidth >= totalWidth && this.collapsed.length > 0) {
        this.collapsed.forEach(item => item.uncollapse());
        this.collapsed = [];

        this.getButton(MenuButton.id).hide(false);
      }

      const caption = this.getButton(NavbarCaption.id, false);
      if (caption) {
        caption.refreshUi();
      }
    }
  }

  /**
   * @summary Ensure the buttons configuration is correct
   * @private
   */
  __cleanButtons(buttons) {
    // true becomes the default array
    if (buttons === true) {
      return clone(DEFAULTS.navbar);
    }
    // can be a space or coma separated list
    else if (typeof buttons === 'string') {
      return buttons.split(/[ ,]/);
    }
    else {
      return buttons || [];
    }
  }

}
