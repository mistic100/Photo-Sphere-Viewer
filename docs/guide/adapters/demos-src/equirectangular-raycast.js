import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularRaycastAdapter } from '@photo-sphere-viewer/equirectangular-raycast-adapter';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: EquirectangularRaycastAdapter,
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
