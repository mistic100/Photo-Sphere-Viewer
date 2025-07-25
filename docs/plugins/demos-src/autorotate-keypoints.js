import { Viewer } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const points = [
    { yaw: 0.1029, pitch: 0.3158 },
    { yaw: 0.8532, pitch: -0.1646 },
    { yaw: 2.7755, pitch: 0.7840 },
    { yaw: 3.3742, pitch: 0.4757 },
    { yaw: 4.6591, pitch: 0.6579 },
    { yaw: 5.7976, pitch: -0.0401 },
];

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        AutorotatePlugin.withConfig({
            autostartDelay: 1000,
            autorotateSpeed: '3rpm',
            keypoints: points.map((pt, i) => ({
                position: pt,
                pause: i % 3 === 1 ? 2000 : 0,
                tooltip: 'Test tooltip',
            })),
        }),
        MarkersPlugin.withConfig({
            markers: points.map((pt, i) => ({
                id: '#' + i,
                position: pt,
                image: baseUrl + 'pictos/pin-red.png',
                size: { width: 32, height: 32 },
                anchor: 'bottom center',
            })),
        }),
    ],
});
