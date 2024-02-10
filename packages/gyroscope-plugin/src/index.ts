import { addI18n, registerButton } from '@photo-sphere-viewer/core';
import { GyroscopeButton } from './GyroscopeButton';
import * as events from './events';

registerButton(GyroscopeButton, 'caption:right');
addI18n('en', {
    [GyroscopeButton.id]: 'Gyroscope',
});

export { GyroscopePlugin } from './GyroscopePlugin';
export * from './model';
export { events };
