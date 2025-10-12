import { DEFAULTS, registerButton } from '@photo-sphere-viewer/core';
import * as events from './events';
import { StereoButton } from './StereoButton';

DEFAULTS.lang[StereoButton.id] = 'Stereo view';
registerButton(StereoButton, 'gyroscope:right', 'fullscreen:before');

DEFAULTS.lang.stereoNotification = 'Tap anywhere to exit stereo view.';
DEFAULTS.lang.pleaseRotate = 'Please rotate your device';
DEFAULTS.lang.tapToContinue = '(or tap to continue)';

export { StereoPlugin } from './StereoPlugin';
export { events };
