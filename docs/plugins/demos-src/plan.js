import { Viewer } from '@photo-sphere-viewer/core';
import { PlanPlugin } from '@photo-sphere-viewer/plan-plugin';
import { TileLayer } from 'leaflet';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        PlanPlugin.withConfig({
            defaultZoom: 14,
            coordinates: [6.78677, 44.58241],
            bearing: '120deg',
            layers: [
                {
                    name: 'OpenStreetMap',
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    attribution: '&copy; OpenStreetMap',
                },
                {
                    name: 'OpenTopoMap',
                    layer: new TileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                        subdomains: ['a', 'b', 'c'],
                        maxZoom: 17,
                    }),
                    attribution: '&copy; OpenTopoMap',
                },
            ],
            hotspots: [
                {
                    coordinates: [6.7783, 44.58506],
                    id: 'green-lake',
                    tooltip: 'Lac vert',
                    color: 'green',
                },
            ],
        }),
    ],
});
