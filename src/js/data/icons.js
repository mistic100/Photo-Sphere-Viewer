import compass from '../../icons/compass.svg';
import download from '../../icons/download.svg';
import error from '../../icons/error.svg';
import fullscreenIn from '../../icons/fullscreen-in.svg';
import fullscreenOut from '../../icons/fullscreen-out.svg';
import gesture from '../../icons/gesture.svg';
import info from '../../icons/info.svg';
import menu from '../../icons/menu.svg';
import mobileRotate from '../../icons/mobile-rotate.svg';
import pin from '../../icons/pin.svg';
import pinList from '../../icons/pin-list.svg';
import playActive from '../../icons/play-active.svg';
import play from '../../icons/play.svg';
import stereo from '../../icons/stereo.svg';
import zoomIn from '../../icons/zoom-in.svg';
import zoomOut from '../../icons/zoom-out.svg';

/**
 * @summary Default icons
 * @type {Object<string, string>}
 * @constant
 * @memberOf module:data/config
 */
const ICONS = {
  compass,
  download,
  error,
  fullscreenIn,
  fullscreenOut,
  gesture,
  info,
  menu,
  mobileRotate,
  pin,
  pinList,
  play,
  playActive,
  stereo,
  zoomIn,
  zoomOut,
};

/**
 * @summary Gets icons from config
 * @param {Object<string, string>} options
 * @returns {Object<string, string>}
 * @memberOf module:data/config
 */
function getIcons(options) {
  const icons = {};

  Object.keys(ICONS).forEach((name) => {
    if (!options || !options[name]) {
      icons[name] = ICONS[name];
    }
    else {
      icons[name] = options[name];
    }
  });

  return icons;
}

export { ICONS, getIcons };
