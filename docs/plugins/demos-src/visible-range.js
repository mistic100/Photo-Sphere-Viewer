import { Viewer } from '@photo-sphere-viewer/core';
import { VisibleRangePlugin } from '@photo-sphere-viewer/visible-range-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    defaultZoomLvl: 30,

    plugins: [
        VisibleRangePlugin.withConfig({
            horizontalRange: [-Math.PI / 2, Math.PI / 2],
            verticalRange: [-Math.PI / 3, Math.PI / 3],
        }),
    ],
});
