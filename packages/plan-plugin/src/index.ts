import { addI18n } from '@photo-sphere-viewer/core';
import * as events from './events';

addI18n('en', {
    map: 'Map',
    mapMaximize: 'Maximize',
    mapMinimize: 'Minimize',
    mapLayers: 'Base layer',
    mapReset: 'Reset',
});

export { PlanPlugin } from './PlanPlugin';
export * from './model';
export { events };

/** @internal  */
import './style.scss';
