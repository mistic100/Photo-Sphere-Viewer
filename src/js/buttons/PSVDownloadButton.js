import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar download button class
 * @extends module:components/buttons.AbstractButton
 * @memberof module:components/buttons
 */
class PSVDownloadButton extends AbstractButton {

  static get id() {
    return 'download';
  }

  static get icon() {
    return 'download';
  }

  get collapsable() {
    return true;
  }

  /**
   * @param {module:components.PSVNavbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-download-button');
  }

  /**
   * @override
   * @description Asks the browser to download the panorama source file
   */
  __onClick() {
    const link = document.createElement('a');
    link.href = this.psv.config.panorama;
    link.download = this.psv.config.panorama;
    this.psv.container.appendChild(link);
    link.click();

    setTimeout(() => {
      this.psv.container.removeChild(link);
    }, 100);
  }

}

export { PSVDownloadButton };
