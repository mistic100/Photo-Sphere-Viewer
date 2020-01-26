import { AutorotateButton } from '../buttons/AutorotateButton';
import { CustomButton } from '../buttons/CustomButton';
import { DownloadButton } from '../buttons/DownloadButton';
import { FullscreenButton } from '../buttons/FullscreenButton';
import { GyroscopeButton } from '../buttons/GyroscopeButton';
import { MarkersButton } from '../buttons/MarkersButton';
import { MarkersListButton } from '../buttons/MarkersListButton';
import { MenuButton } from '../buttons/MenuButton';
import { StereoButton } from '../buttons/StereoButton';
import { ZoomInButton } from '../buttons/ZoomInButton';
import { ZoomOutButton } from '../buttons/ZoomOutButton';
import { ZoomRangeButton } from '../buttons/ZoomRangeButton';
import { PSVError } from '../PSVError';
import { logWarn } from '../utils';
import { AbstractComponent } from './AbstractComponent';
import { NavbarCaption } from './NavbarCaption';

const STANDARD_BUTTONS = [
  AutorotateButton,
  ZoomInButton,
  ZoomRangeButton,
  ZoomOutButton,
  DownloadButton,
  MarkersButton,
  MarkersListButton,
  FullscreenButton,
  StereoButton,
  GyroscopeButton,
];

const STANDARD_BUTTONS_BY_ID = STANDARD_BUTTONS.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});

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

    if (this.psv.config.navbar) {
      this.setButtons(this.psv.config.navbar);
    }
  }

  /**
   * @summary Change the buttons visible on the navbar
   * @param {Array<string|object>} buttons
   */
  setButtons(buttons) {
    this.children.forEach(item => item.destroy());
    this.children.length = 0;

    /* eslint-disable no-new */
    buttons.forEach((button) => {
      if (typeof button === 'object') {
        new CustomButton(this, button);
      }
      else if (STANDARD_BUTTONS_BY_ID[button]) {
        new STANDARD_BUTTONS_BY_ID[button](this);
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
  refresh() {
    super.refresh();

    if (this.psv.prop.uiRefresh === true) {
      const availableWidth = this.container.offsetWidth;

      let totalWidth = 0;
      const visibleButtons = [];
      const collapsableButtons = [];

      this.children.forEach((item) => {
        if (item.prop.visible) {
          totalWidth += item.prop.width;
          visibleButtons.push(item);
          if (item.collapsable) {
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
        caption.refresh();
      }
    }
  }

}
