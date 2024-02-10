import { addI18n, registerButton } from '@photo-sphere-viewer/core';
import { GalleryButton } from './GalleryButton';
import * as events from './events';

registerButton(GalleryButton, 'caption:left');
addI18n('en', {
    [GalleryButton.id]: 'Gallery',
});

export { GalleryPlugin } from './GalleryPlugin';
export * from './model';
export { events };

/** @internal  */
import './style.scss';
