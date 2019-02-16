import { PSVAutorotateButton } from '../buttons/PSVAutorotateButton';
import { PSVCustomButton } from '../buttons/PSVCustomButton';
import { PSVDownloadButton } from '../buttons/PSVDownloadButton';
import { PSVFullscreenButton } from '../buttons/PSVFullscreenButton';
import { PSVGyroscopeButton } from '../buttons/PSVGyroscopeButton';
import { PSVMarkersButton } from '../buttons/PSVMarkersButton';
import { PSVMarkersListButton } from '../buttons/PSVMarkersListButton';
import { PSVMenuButton } from '../buttons/PSVMenuButton';
import { PSVStereoButton } from '../buttons/PSVStereoButton';
import { PSVZoomInButton } from '../buttons/PSVZoomInButton';
import { PSVZoomOutButton } from '../buttons/PSVZoomOutButton';
import { PSVZoomRangeButton } from '../buttons/PSVZoomRangeButton';
import { PSVError } from '../PSVError';
import { logWarn } from '../utils';
import { AbstractComponent } from './AbstractComponent';
import { PSVNavbarCaption } from './PSVNavbarCaption';

const STANDARD_BUTTONS = [
  PSVAutorotateButton,
  PSVZoomInButton,
  PSVZoomRangeButton,
  PSVZoomOutButton,
  PSVDownloadButton,
  PSVMarkersButton,
  PSVMarkersListButton,
  PSVFullscreenButton,
  PSVStereoButton,
  PSVGyroscopeButton,
];

const STANDARD_BUTTONS_BY_ID = STANDARD_BUTTONS.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});

/**
 * @summary Navigation bar class
 * @extends module:components.AbstractComponent
 * @memberof module:components
 */
class PSVNavbar extends AbstractComponent {

  /**
   * @param {PhotoSphereViewer} psv
   */
  constructor(psv) {
    super(psv, 'psv-navbar');

    /**
     * @summary List of buttons of the navbar
     * @member {module:components/buttons.AbstractButton[]}
     * @override
     */
    this.children = [];

    /**
     * @summary List of collapsed buttons
     * @member {module:components/buttons.AbstractButton[]}
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
        new PSVCustomButton(this, button);
      }
      else if (STANDARD_BUTTONS_BY_ID[button]) {
        new STANDARD_BUTTONS_BY_ID[button](this);
      }
      else if (button === 'caption') {
        new PSVNavbarCaption(this, this.psv.config.caption);
      }
      else if (button === 'zoom') {
        new PSVZoomOutButton(this);
        new PSVZoomRangeButton(this);
        new PSVZoomInButton(this);
      }
      else {
        throw new PSVError('Unknown button ' + button);
      }
    });

    new PSVMenuButton(this);
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
   * @returns {module:components/buttons.AbstractButton}
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

        this.getButton(PSVMenuButton.id).show(false);
      }
      else if (availableWidth >= totalWidth && this.collapsed.length > 0) {
        this.collapsed.forEach(item => item.uncollapse());
        this.collapsed = [];

        this.getButton(PSVMenuButton.id).hide(false);
      }

      const caption = this.getButton(PSVNavbarCaption.id, false);
      if (caption) {
        caption.refresh();
      }
    }
  }

}

export { PSVNavbar };
