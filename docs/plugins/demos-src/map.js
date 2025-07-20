import { Viewer } from '@photo-sphere-viewer/core';
import { MapPlugin } from '@photo-sphere-viewer/map-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        MapPlugin.withConfig({
            imageUrl: baseUrl + 'map.jpg',
            center: { x: 807, y: 607 },
            rotation: '135deg',
            defaultZoom: 40,
            shape: 'square',
            hotspots: [
                {
                    x: 450,
                    y: 450,
                    id: 'green-lake',
                    color: 'green',
                    tooltip: 'Lac vert',
                },
                {
                    yaw: '-45deg',
                    distance: 80, // pixels
                },
            ],
        }),
    ],
});
