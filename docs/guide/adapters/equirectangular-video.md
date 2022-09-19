# Equirectangular video

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
  panorama: {
    source: 'path/video.mp4', // also supports webm
  },
  plugins: [
    PhotoSphereViewer.VideoPlugin,
  ],
});
```

::: warning
This adapter requires to use the [VideoPlugin](../../plugins/plugin-video.md).
:::


## Example

::: code-demo

```yaml
title: PSV Equirectangular Video Demo
resources:
  - path: adapters/equirectangular-video.js
    imports: EquirectangularVideoAdapter
  - path: plugins/video.js
    imports: VideoPlugin
  - path: plugins/video.css
  - path: plugins/settings.js
    imports: SettingsPlugin
  - path: plugins/settings.css
  - path: plugins/resolution.js
    imports: ResolutionPlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  adapter: [PhotoSphereViewer.EquirectangularVideoAdapter, {
    muted: true,
  }],
  caption: 'Ayutthaya <b>&copy; meetle</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,
  navbar: 'video autorotate caption settings fullscreen',

  plugins: [
    PhotoSphereViewer.VideoPlugin,
    PhotoSphereViewer.SettingsPlugin,
    [PhotoSphereViewer.ResolutionPlugin, {
      defaultResolution: 'HD',
      resolutions: [
        {
          id      : 'UHD',
          label   : 'Ultra high',
          panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_UHD.mp4' },
        },
        {
          id      : 'FHD',
          label   : 'High',
          panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_FHD.mp4' },
        },
        {
          id      : 'HD',
          label   : 'Standard',
          panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_HD.mp4' },
        },
        {
          id      : 'SD',
          label   : 'Low',
          panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_SD.mp4' },
        },
      ]
    }]
  ],
});
```

:::


## Configuration

#### `autoplay`
- type: `boolean`
- default: `false`

Automatically starts the video on load.

#### `muted`
- type: `boolean`
- default: `false` (`true` if `autoplay=true`)

Mute the video by default.

#### `resolution`
- type: `number`
- default: `64`

The number of faces of the sphere geometry used to display the panorama, higher values can reduce deformations on straight lines at the cost of performances.

_Note: the actual number of faces is `resolution² / 2`._


## Panorama options

When using this adapter the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)
- type: `string`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.
