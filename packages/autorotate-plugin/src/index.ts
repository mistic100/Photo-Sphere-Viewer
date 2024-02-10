import { addI18n, registerButton } from '@photo-sphere-viewer/core';
import { AutorotateButton } from './AutorotateButton';
import * as events from './events';

registerButton(AutorotateButton, 'start');
addI18n('en', {
    [AutorotateButton.id]: 'Automatic rotation',
});

export { AutorotatePlugin } from './AutorotatePlugin';
export * from './model';
export { events };
