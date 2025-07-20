import { Viewer } from '@photo-sphere-viewer/core';
import { CubemapVideoAdapter } from '@photo-sphere-viewer/cubemap-video-adapter';
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin';
import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    adapter: CubemapVideoAdapter.withConfig({
        muted: true,
    }),
    caption: 'Dreams of Dalí <b>&copy; The Dalí Museum</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: 'video caption settings fullscreen',

    plugins: [
        VideoPlugin,
        SettingsPlugin,
        ResolutionPlugin.withConfig({
            defaultResolution: 'HD',
            resolutions: [
                {
                    id: 'UHD',
                    label: 'Ultra high',
                    panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_UHD.webm' },
                },
                {
                    id: 'FHD',
                    label: 'High',
                    panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_FHD.webm' },
                },
                {
                    id: 'HD',
                    label: 'Standard',
                    panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_HD.webm' },
                },
            ],
        }),
    ],
});
