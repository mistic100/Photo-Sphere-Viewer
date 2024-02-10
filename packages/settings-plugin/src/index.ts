import { addI18n, registerButton } from '@photo-sphere-viewer/core';
import * as events from './events';
import { SettingsButton } from './SettingsButton';

registerButton(SettingsButton, 'fullscreen:left');
addI18n('en', {
    [SettingsButton.id]: 'Settings',
});

export { SettingsPlugin } from './SettingsPlugin';
export * from './model';
export { events };

/** @internal  */
import './style.scss';
