import { addI18n } from '@photo-sphere-viewer/core';
import * as events from './events';

addI18n('en', {
    map: 'Map',
    mapMaximize: 'Maximize',
    mapMinimize: 'Minimize',
    mapNorth: 'Go to north',
    mapReset: 'Reset',
});

export { MapPlugin } from './MapPlugin';
export * from './model';
export { events };

/** @internal  */
import './style.scss';
