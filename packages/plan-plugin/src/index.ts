import { DEFAULTS, registerButton } from '@photo-sphere-viewer/core';
import { PlanButton } from './components/PlanButton';
import * as events from './events';

DEFAULTS.lang['map'] = 'Map';
DEFAULTS.lang['mapMaximize'] = 'Maximize';
DEFAULTS.lang['mapMinimize'] = 'Minimize';
DEFAULTS.lang['mapReset'] = 'Reset';
DEFAULTS.lang['mapLayers'] = 'Base layer';
registerButton(PlanButton, 'map:right', 'start');

export { PlanPlugin } from './PlanPlugin';
export * from './model';
export { events };

/** @internal  */
import './styles/index.scss';
