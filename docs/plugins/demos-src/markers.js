import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        MarkersPlugin.withConfig({
            // list of markers
            markers: [
                {
                    // image marker that opens the panel when clicked
                    id: 'image',
                    position: { yaw: 0.32, pitch: 0.11 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    zoomLvl: 100,
                    tooltip: 'A image marker. <b>Click me!</b>',
                    content: document.getElementById('lorem-content').innerHTML,
                },
                {
                    // image marker rendered in the 3D scene
                    id: 'imageLayer',
                    imageLayer: baseUrl + 'pictos/tent.png',
                    size: { width: 120, height: 94 },
                    position: { yaw: -0.45, pitch: -0.1 },
                    tooltip: 'Image embedded in the scene',
                },
                {
                    // html marker with custom style
                    id: 'text',
                    position: { yaw: 0, pitch: 0 },
                    html: 'HTML <b>marker</b> &hearts;',
                    anchor: 'bottom right',
                    scale: [0.5, 1.5],
                    style: {
                        maxWidth: '100px',
                        color: 'white',
                        fontSize: '20px',
                        fontFamily: 'Helvetica, sans-serif',
                        textAlign: 'center',
                    },
                    tooltip: {
                        content: 'An HTML marker',
                        position: 'right',
                    },
                },
                {
                    // polygon marker
                    id: 'polygon',
                    polygon: [
                        [6.2208, 0.0906], [0.0443, 0.1028], [0.2322, 0.0849], [0.4531, 0.0387],
                        [0.5022, -0.0056], [0.4587, -0.0396], [0.252, -0.0453], [0.0434, -0.0575],
                        [6.1302, -0.0623], [6.0094, -0.0169], [6.0471, 0.0320], [6.2208, 0.0906],
                    ],
                    svgStyle: {
                        fill: 'rgba(200, 0, 0, 0.2)',
                        stroke: 'rgba(200, 0, 50, 0.8)',
                        strokeWidth: '2px',
                    },
                    tooltip: {
                        content: 'A dynamic polygon marker',
                        position: 'bottom right',
                    },
                },
                {
                    // polyline marker
                    id: 'polyline',
                    polylinePixels: [
                        [2478, 1635], [2184, 1747], [1674, 1953], [1166, 1852],
                        [709, 1669], [301, 1519], [94, 1399], [34, 1356],
                    ],
                    svgStyle: {
                        stroke: 'rgba(140, 190, 10, 0.8)',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: '10px',
                    },
                    tooltip: 'A dynamic polyline marker',
                },
                {
                    // circle marker
                    id: 'circle',
                    circle: 20,
                    position: { textureX: 2500, textureY: 1200 },
                    tooltip: 'A circle marker',
                },
            ],
        }),
    ],
});

const markersPlugin = viewer.getPlugin(MarkersPlugin);

/**
 * Create a new marker when the user clicks somewhere
 */
viewer.addEventListener('click', ({ data }) => {
    if (!data.rightclick) {
        markersPlugin.addMarker({
            id: '#' + Math.random(),
            position: { yaw: data.yaw, pitch: data.pitch },
            image: baseUrl + 'pictos/pin-red.png',
            size: { width: 32, height: 32 },
            anchor: 'bottom center',
            tooltip: 'Generated pin',
            data: {
                generated: true,
            },
        });
    }
});

/**
 * Delete a generated marker when the user double-clicks on it
 * Or change the image if the user right-clicks on it
 */
markersPlugin.addEventListener('select-marker', ({ marker, doubleClick, rightClick }) => {
    if (marker.data?.generated) {
        if (doubleClick) {
            markersPlugin.removeMarker(marker);
        } else if (rightClick) {
            markersPlugin.updateMarker({
                id: marker.id,
                image: baseUrl + 'pictos/pin-blue.png',
            });
        }
    }
});
