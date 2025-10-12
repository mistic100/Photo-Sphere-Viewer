import { Viewer } from '@photo-sphere-viewer/core';
import { CubemapAdapter } from '@photo-sphere-viewer/cubemap-adapter';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: CubemapAdapter,
    panorama: {
        left: baseUrl + 'cubemap/px.jpg',
        front: baseUrl + 'cubemap/nz.jpg',
        right: baseUrl + 'cubemap/nx.jpg',
        back: baseUrl + 'cubemap/pz.jpg',
        top: baseUrl + 'cubemap/py.jpg',
        bottom: baseUrl + 'cubemap/ny.jpg',
    },
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
