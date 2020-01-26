import { AbstractButton } from './AbstractButton';
import download from '../icons/download.svg';

/**
 * @summary Navigation bar download button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class DownloadButton extends AbstractButton {

  static id = 'download';
  static icon = download;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-download-button', true);
  }

  /**
   * @override
   * @description Asks the browser to download the panorama source file
   */
  onClick() {
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
