# Cubemap video

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.CubemapVideoAdapter,
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
title: PSV Cubemap Video Demo
resources:
  - path: adapters/cubemap-video.js
    imports: CubemapVideoAdapter
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
  adapter: [PhotoSphereViewer.CubemapVideoAdapter, {
    muted: true,
  }],
  caption: 'Dreams of Dalí <b>&copy; The Dalí Museum</b>',
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
          panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_UHD.webm' },
        },
        {
          id      : 'FHD',
          label   : 'High',
          panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_FHD.webm' },
        },
        {
          id      : 'HD',
          label   : 'Standard',
          panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_HD.webm' },
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

#### `equiangular`
- type: `boolean`
- default: `true`

Set to `true` when using an equiangular cubemap (EAC), which is the format used by Youtube. Set to `false` when using a standard cubemap.


## Panorama options

When using this adapter the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)
- type: `string`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.


### Video format

This adapter supports video files consisting of a grid of the six faces of the cube, as used by Youtube for example.

The layout of a frame must be as follow:

![cubemap-video](../../images/cubemap-video.png)
