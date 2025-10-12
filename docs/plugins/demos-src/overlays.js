import { Viewer } from '@photo-sphere-viewer/core';
import { OverlaysPlugin } from '@photo-sphere-viewer/overlays-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        OverlaysPlugin.withConfig({
            overlays: [
                {
                    id: 'xray',
                    path: baseUrl + 'sphere-overlay.png',
                    opacity: 0.8,
                },
            ],
        }),
    ],
});
