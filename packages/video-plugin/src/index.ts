import { DEFAULTS, registerButton } from '@photo-sphere-viewer/core';
import { PlayPauseButton } from './components/PlayPauseButton';
import { TimeCaption } from './components/TimeCaption';
import { VolumeButton } from './components/VolumeButton';
import * as events from './events';

DEFAULTS.lang[PlayPauseButton.id] = 'Play/Pause';
DEFAULTS.lang[VolumeButton.id] = 'Volume';
registerButton(PlayPauseButton);
registerButton(VolumeButton);
registerButton(TimeCaption);
DEFAULTS.navbar.unshift(PlayPauseButton.groupId);

export { VideoPlugin } from './VideoPlugin';
export * from './model';
export { events };

/** @internal  */
import './styles/index.scss';
