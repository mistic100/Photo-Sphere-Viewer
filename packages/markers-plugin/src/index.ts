import { addI18n, registerButton } from '@photo-sphere-viewer/core';
import { MarkersButton } from './MarkersButton';
import { MarkersListButton } from './MarkersListButton';
import * as events from './events';

registerButton(MarkersButton, 'caption:left');
registerButton(MarkersListButton, 'caption:left');
addI18n('en', {
    [MarkersButton.id]: 'Markers',
    [MarkersListButton.id]: 'Markers list',
});

export type { Marker } from './markers/Marker';
export type { MarkerType } from './MarkerType';
export { MarkersPlugin } from './MarkersPlugin';
export * from './model';
export { events };

/** @internal  */
import './style.scss';
