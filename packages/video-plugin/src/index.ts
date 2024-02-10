import { DEFAULTS, addI18n, registerButton } from '@photo-sphere-viewer/core';
import { PlayPauseButton } from './components/PlayPauseButton';
import { TimeCaption } from './components/TimeCaption';
import { VolumeButton } from './components/VolumeButton';
import * as events from './events';

registerButton(PlayPauseButton);
registerButton(VolumeButton);
registerButton(TimeCaption);
DEFAULTS.navbar.unshift(PlayPauseButton.groupId);
addI18n('en', {
    [PlayPauseButton.id]: 'Play/Pause',
    [VolumeButton.id]: 'Volume',
});

export { VideoPlugin } from './VideoPlugin';
export * from './model';
export { events };

/** @internal  */
import './style.scss';
