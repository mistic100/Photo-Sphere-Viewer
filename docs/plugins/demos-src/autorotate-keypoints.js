import { Viewer } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    navbar: [
        'autorotate',
        'zoom',
        {
            // a custom button to change keypoints
            title: 'Change points',
            content: '🔄',
            onClick: randomPoints,
        },
        'caption',
        'fullscreen',
    ],

    plugins: [
        AutorotatePlugin.withConfig({
            autostartDelay: 1000,
            autorotateSpeed: '3rpm',
        }),
        MarkersPlugin,
    ],
});

const autorotatePlugin = viewer.getPlugin(AutorotatePlugin);
const markersPlugin = viewer.getPlugin(MarkersPlugin);

viewer.addEventListener('ready', randomPoints, { once: true });

/**
 * Randomize the keypoints and add corresponding markers
 */
function randomPoints() {
    const points = [];

    for (let i = 0, l = Math.random() * 2 + 4; i < l; i++) {
        points.push({
            position: {
                yaw: ((i + Math.random()) * 2 * Math.PI) / l,
                pitch: (Math.random() * Math.PI) / 3 - Math.PI / 6,
            },
            pause: i % 3 === 0 ? 2000 : 0,
            tooltip: 'Test tooltip',
        });
    }

    markersPlugin.setMarkers(
        points.map((pt, i) => {
            return {
                id: '#' + i,
                position: pt.position,
                image: baseUrl + 'pictos/pin-red.png',
                size: { width: 32, height: 32 },
                anchor: 'bottom center',
            };
        }),
    );

    autorotatePlugin.setKeypoints(points);
}
