import { DEFAULTS } from '@photo-sphere-viewer/core';
import * as events from './events';

DEFAULTS.lang['map'] = 'Map';
DEFAULTS.lang['mapMaximize'] = 'Maximize';
DEFAULTS.lang['mapMinimize'] = 'Minimize';
DEFAULTS.lang['mapReset'] = 'Reset';
DEFAULTS.lang['mapLayers'] = 'Base layer';

export { PlanPlugin } from './PlanPlugin';
export * from './model';
export { events };

/** @internal  */
import './styles/index.scss';
