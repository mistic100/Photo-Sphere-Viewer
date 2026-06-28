import { Viewer, DualFisheyeAdapter } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';


import { Viewer } from '@photo-sphere-viewer/core';
import { DualFisheyeVideoAdapter } from '@photo-sphere-viewer/dual-fisheye-video-adapter';
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: DualFisheyeVideoAdapter.withConfig({
        muted: true,
    }),
    panorama: {
        // TODO: correct path
        source: 'TODO.mp4'
    },
    sphereCorrection: { tilt: 0.1 },
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
