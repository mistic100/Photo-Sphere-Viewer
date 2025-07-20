import { Viewer } from '@photo-sphere-viewer/core';
import { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        GalleryPlugin.withConfig({
            visibleOnLoad: true,
        }),
    ],
});

const gallery = viewer.getPlugin(GalleryPlugin);

gallery.setItems([
    {
        id: 'sphere',
        panorama: baseUrl + 'sphere.jpg',
        thumbnail: baseUrl + 'sphere-small.jpg',
        options: {
            caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
        },
    },
    {
        id: 'sphere-test',
        panorama: baseUrl + 'sphere-test.jpg',
        name: 'Test sphere',
    },
    {
        id: 'key-biscayne',
        panorama: baseUrl + 'tour/key-biscayne-1.jpg',
        thumbnail: baseUrl + 'tour/key-biscayne-1-thumb.jpg',
        name: 'Key Biscayne',
        options: {
            caption: 'Cape Florida Light, Key Biscayne <b>&copy; Pixexid</b>',
        },
    },
]);
