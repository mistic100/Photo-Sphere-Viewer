import { addI18n, registerButton } from '@photo-sphere-viewer/core';
import * as events from './events';
import { StereoButton } from './StereoButton';

registerButton(StereoButton, 'caption:right');
addI18n('en', {
    [StereoButton.id]: 'Stereo view',
    stereoNotification: 'Tap anywhere to exit stereo view.',
    pleaseRotate: 'Please rotate your device',
    tapToContinue: '(or tap to continue)',
});

export { StereoPlugin } from './StereoPlugin';
export { events };
