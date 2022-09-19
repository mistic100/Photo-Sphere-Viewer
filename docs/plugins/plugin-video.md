# VideoPlugin

<ApiButton page="PSV.plugins.VideoPlugin.html"/>

> Adds controls to the video [adapters](../guide/adapters).

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/video.js` and `dist/plugins/video.css`.


## Usage

To use this plugin you must also load one of the video adapters : [equirectangular](../guide/adapters/equirectangular-video.md) or [cubemap](../guide/adapters/cubemap-video.md).

Once enabled it will add various elements to the viewer:

- Play/pause button
- Volume button
- time indicator in the navbar
- Progressbar above the navbar
- Play button in the center of the viewer

It also supports advanced autorotate with timed `keypoints`.

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
  panorama: {
    source: 'path/video.mp4',
  },
  plugins: [
    [PhotoSphereViewer.VideoPlugin, {}],
  ],
});
```

### Multi resolution

You can offer multiple resolutions of your video with the [ResolutionPlugin](./plugin-resolution.md).

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
  plugins: [
    PhotoSphereViewer.VideoPlugin,
    PhotoSphereViewer.SettingsPlugin,
    [PhotoSphereViewer.ResolutionPlugin, {
      defaultResolution: 'FHD',
      resolutions: [
        {
          id      : 'UHD',
          label   : 'Ultra high',
          panorama: { source: 'path/video-uhd.mp4' },
        },
        {
          id      : 'FHD',
          label   : 'High',
          panorama: { source: 'path/video-fhd.mp4' },
        },
        {
          id      : 'HD',
          label   : 'Standard',
          panorama: { source: 'path/video-hd.mp4' },
        },
      ],
    }],
  ],
});
```

## Example

::: code-demo

```yaml
title: PSV Video Demo
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
    [PhotoSphereViewer.VideoPlugin, {
      keypoints  : [
        { time: 0, position: { longitude: 0, latitude: 0 } },
        { time: 5, position: { longitude: -Math.PI / 4, latitude: Math.PI / 8 } },
        { time: 10, position: { longitude: -Math.PI / 2, latitude: 0 } },
        { time: 15, position: { longitude: -3 * Math.PI / 4, latitude: -Math.PI / 8 } },
        { time: 20, position: { longitude: -Math.PI, latitude: 0 } },
        { time: 25, position: { longitude: -5 * Math.PI / 4, latitude: Math.PI / 8 } },
        { time: 30, position: { longitude: -3 * Math.PI / 2, latitude: 0 } },
        { time: 35, position: { longitude: -7 * Math.PI / 4, latitude: -Math.PI / 8 } },
      ]
    }],
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

#### `keypoints`
- type: `Array<{ position, time }>`

Defines timed keypoints that will be used by the autorotate button.

```js
keypoints: [
  { time: 0,    position: { longitude: 0,    latitude: 0 } },
  { time: 5.5,  position: { longitude: 0.25, latitude: 0 } },
  { time: 12.8, position: { longitude: 0.3,  latitude: -12 } },
]
```

#### `progressbar`
- type: `boolean`
- default: `true`

Displays a progressbar on top of the navbar.

#### `bigbutton`
- type: `boolean`
- default: `true`

Displays a big "play" button in the center of the viewer.

#### `lang`
- type: `object`
- default:
```js
lang: {
  videoPlay  : 'Play/Pause',
  videoVolume: 'Volume',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._


## Events

#### `play`

Triggered when the video starts playing.

#### `pause`

Triggered when the video is paused.

#### `volume-change(volume)`

Triggered when the video volume changes.

#### `progress({ time, duration, progress })`

Triggered when the video play progression changes.


## Buttons

This plugin adds buttons to the default navbar:
- `videoPlay` allows to play/pause the video
- `videoVolume` allows to change the volume/mute the video
- `videoTime` shows the video time and duration (not a button)

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
