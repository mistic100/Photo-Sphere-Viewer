import { Viewer, DualFisheyeAdapter } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: DualFisheyeAdapter,
    panorama: baseUrl + 'dualfisheye.jpg',
    caption: 'Kotka archipelago, Finland <b>&copy; Jonna Luostari</b>',
    sphereCorrection: { tilt: 0.1 },
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
