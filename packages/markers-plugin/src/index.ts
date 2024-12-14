import { DEFAULTS, registerButton } from '@photo-sphere-viewer/core';
import * as events from './events';
import { MarkersButton } from './MarkersButton';
import { MarkersListButton } from './MarkersListButton';

DEFAULTS.lang[MarkersButton.id] = 'Markers';
DEFAULTS.lang[MarkersListButton.id] = 'Markers list';
registerButton(MarkersButton, 'caption:left');
registerButton(MarkersListButton, 'caption:left');

export type { Marker } from './markers/Marker';
export type { MarkerType } from './MarkerType';
export { MarkersPlugin } from './MarkersPlugin';
export * from './model';
export { events };

/** @internal  */
import './styles/index.scss';
