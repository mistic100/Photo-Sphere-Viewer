import { DEFAULTS, registerButton } from '@photo-sphere-viewer/core';
import * as events from './events';
import { GalleryButton } from './GalleryButton';

DEFAULTS.lang[GalleryButton.id] = 'Gallery';
registerButton(GalleryButton, 'caption:left');

export { GalleryPlugin } from './GalleryPlugin';
export * from './model';
export { events };

/** @internal  */
import './styles/index.scss';
