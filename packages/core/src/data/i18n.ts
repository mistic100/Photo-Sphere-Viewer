import { ViewerConfig } from '../model';

export const LANGS: Record<string, ViewerConfig['lang']> = {
    en: {
        zoom: 'Zoom',
        zoomOut: 'Zoom out',
        zoomIn: 'Zoom in',
        moveUp: 'Move up',
        moveDown: 'Move down',
        moveLeft: 'Move left',
        moveRight: 'Move right',
        description: 'Description',
        download: 'Download',
        fullscreen: 'Fullscreen',
        loading: 'Loading...',
        menu: 'Menu',
        close: 'Close',
        twoFingers: 'Use two fingers to navigate',
        ctrlZoom: 'Use ctrl + scroll to zoom the image',
        loadError: 'The panorama cannot be loaded',
    },
};

/**
 * Adds a translation to the library
 */
export function addI18n(code: string, lang: ViewerConfig['lang']) {
    if (!LANGS[code]) {
        LANGS[code] = {} as any;
    }
    Object.assign(LANGS[code], lang);
}
