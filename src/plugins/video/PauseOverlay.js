import { AbstractComponent, CONSTANTS, utils } from '../..';
import { EVENTS } from './constants';
import playIcon from './play.svg';

/**
 * @private
 */
export class PauseOverlay extends AbstractComponent {

  constructor(plugin) {
    super(plugin.psv, 'psv-video-overlay');

    /**
     * @type {PSV.plugins.VideoPlugin}
     * @private
     * @readonly
     */
    this.plugin = plugin;

    /**
     * @type {HTMLElement}
     * @private
     * @readonly
     */
    this.button = document.createElement('button');
    this.button.className = 'psv-video-bigbutton psv--capture-event';
    this.button.innerHTML = playIcon;
    this.container.appendChild(this.button);

    this.psv.on(CONSTANTS.EVENTS.PANORAMA_LOADED, this);
    this.plugin.on(EVENTS.PLAY, this);
    this.plugin.on(EVENTS.PAUSE, this);
    this.button.addEventListener('click', this);
  }

  /**
   * @private
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.PANORAMA_LOADED, this);
    this.plugin.off(EVENTS.PLAY, this);
    this.plugin.off(EVENTS.PAUSE, this);

    delete this.plugin;

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
      case CONSTANTS.EVENTS.PANORAMA_LOADED:
      case EVENTS.PLAY:
      case EVENTS.PAUSE:
        utils.toggleClass(this.button, 'psv-video-bigbutton--pause', !this.plugin.isPlaying());
        break;
      case 'click':
        this.plugin.playPause();
        break;
    }
    /* eslint-enable */
  }

}
