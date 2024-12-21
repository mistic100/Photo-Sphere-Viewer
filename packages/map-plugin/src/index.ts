import { DEFAULTS } from '@photo-sphere-viewer/core';
import * as events from './events';

DEFAULTS.lang['map'] = 'Map';
DEFAULTS.lang['mapMaximize'] = 'Maximize';
DEFAULTS.lang['mapMinimize'] = 'Minimize';
DEFAULTS.lang['mapNorth'] = 'Go to north';
DEFAULTS.lang['mapReset'] = 'Reset';

export { MapPlugin } from './MapPlugin';
export * from './model';
export { events };

/** @internal  */
import './styles/index.scss';
