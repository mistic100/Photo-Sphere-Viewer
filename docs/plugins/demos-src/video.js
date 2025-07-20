import { Viewer } from '@photo-sphere-viewer/core';
import { EquirectangularVideoAdapter } from '@photo-sphere-viewer/equirectangular-video-adapter';
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: EquirectangularVideoAdapter.withConfig({
        muted: true,
    }),
    caption: 'Ayutthaya <b>&copy; meetle</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: 'video autorotate caption settings fullscreen',

    plugins: [
        VideoPlugin.withConfig({
            keypoints: [
                { time: 0, position: { yaw: 0, pitch: 0 } },
                { time: 5, position: { yaw: -Math.PI / 4, pitch: Math.PI / 8 } },
                { time: 10, position: { yaw: -Math.PI / 2, pitch: 0 } },
                { time: 15, position: { yaw: (-3 * Math.PI) / 4, pitch: -Math.PI / 8 } },
                { time: 20, position: { yaw: -Math.PI, pitch: 0 } },
                { time: 25, position: { yaw: (-5 * Math.PI) / 4, pitch: Math.PI / 8 } },
                { time: 30, position: { yaw: (-3 * Math.PI) / 2, pitch: 0 } },
                { time: 35, position: { yaw: (-7 * Math.PI) / 4, pitch: -Math.PI / 8 } },
            ],
        }),
        AutorotatePlugin,
        SettingsPlugin,
        ResolutionPlugin.withConfig({
            defaultResolution: 'HD',
            resolutions: [
                {
                    id: 'UHD',
                    label: 'Ultra high',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_UHD.mp4' },
                },
                {
                    id: 'FHD',
                    label: 'High',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_FHD.mp4' },
                },
                {
                    id: 'HD',
                    label: 'Standard',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_HD.mp4' },
                },
                {
                    id: 'SD',
                    label: 'Low',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_SD.mp4' },
                },
            ],
        }),
    ],
});
