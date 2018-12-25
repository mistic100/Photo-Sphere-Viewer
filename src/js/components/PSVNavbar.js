import { PSVAutorotateButton } from '../buttons/PSVAutorotateButton';
import { PSVCustomButton } from '../buttons/PSVCustomButton';
import { PSVDownloadButton } from '../buttons/PSVDownloadButton';
import { PSVFullscreenButton } from '../buttons/PSVFullscreenButton';
import { PSVGyroscopeButton } from '../buttons/PSVGyroscopeButton';
import { PSVMarkersButton } from '../buttons/PSVMarkersButton';
import { PSVMarkersListButton } from '../buttons/PSVMarkersListButton';
import { PSVStereoButton } from '../buttons/PSVStereoButton';
import { PSVZoomButton } from '../buttons/PSVZoomButton';
import { PSVError } from '../PSVError';
import { logWarn } from '../utils';
import { AbstractComponent } from './AbstractComponent';
import { PSVNavbarCaption } from './PSVNavbarCaption';

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

    if (this.psv.config.navbar) {
      this.setButtons(this.psv.config.navbar);
    }
  }

  /**
   * @override
   */
  destroy() {
    super.destroy();
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
      else {
        switch (button) {
          case PSVAutorotateButton.id:
            new PSVAutorotateButton(this);
            break;

          case PSVZoomButton.id:
            new PSVZoomButton(this);
            break;

          case PSVDownloadButton.id:
            new PSVDownloadButton(this);
            break;

          case PSVMarkersButton.id:
            new PSVMarkersButton(this);
            break;

          case PSVMarkersListButton.id:
            new PSVMarkersListButton(this);
            break;

          case PSVFullscreenButton.id:
            new PSVFullscreenButton(this);
            break;

          case PSVStereoButton.id:
            new PSVStereoButton(this);
            break;

          case PSVGyroscopeButton.id:
            new PSVGyroscopeButton(this);
            break;

          case 'caption':
            new PSVNavbarCaption(this, this.psv.config.caption);
            break;

          default:
            throw new PSVError('Unknown button ' + button);
        }
      }
    });
    /* eslint-enable no-new */
  }

  /**
   * @summary Sets the bar caption
   * @param {string} html
   */
  setCaption(html) {
    const caption = this.getButton('caption', true);

    if (!caption) {
      throw new PSVError('Cannot set caption, the navbar caption container is not initialized.');
    }

    caption.setCaption(html);
  }

  /**
   * @summary Returns a button by its identifier
   * @param {string} id
   * @param {boolean} [silent=false]
   * @returns {module:components/buttons.AbstractButton}
   */
  getButton(id, silent) {
    let button = null;

    this.children.some((item) => {
      if (item.id === id) {
        button = item;
        return true;
      }
      else {
        return false;
      }
    });

    if (!button && !silent) {
      logWarn(`button "${id}" not found in the navbar`);
    }

    return button;
  }

  /**
   * @summary Shows the navbar
   */
  show() {
    this.container.classList.add('psv-navbar--open');
    this.visible = true;
  }

  /**
   * @summary Hides the navbar
   */
  hide() {
    this.container.classList.remove('psv-navbar--open');
    this.visible = false;
  }

}

export { PSVNavbar };
