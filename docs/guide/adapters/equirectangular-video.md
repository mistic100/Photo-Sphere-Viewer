# Equirectangular video

<Badges module="equirectangular-video-adapter"/>

::: module
This adapter is available in the [@photo-sphere-viewer/equirectangular-video-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/equirectangular-video-adapter) package.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [PhotoSphereViewer.VideoPlugin],
});
```

::: warning
This adapter requires to use the [VideoPlugin](../../plugins/video.md).
:::

## Example

::: code-demo

```yaml
title: PSV Equirectangular Video Demo
packages:
    - name: equirectangular-video-adapter
      imports: EquirectangularVideoAdapter
    - name: video-plugin
      imports: VideoPlugin
      style: true
    - name: settings-plugin
      imports: SettingsPlugin
      style: true
    - name: resolution-plugin
      imports: ResolutionPlugin
```

<<< ./demos-src/equirectangular-video.js

:::

## Configuration

#### `autoplay`

-   type: `boolean`
-   default: `false`

Automatically starts the video on load.

#### `muted`

-   type: `boolean`
-   default: `false`

Mute the video by default.

#### `resolution`

See the [equirectangular adapter configuration](./equirectangular.md#resolution).

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)

-   type: `string | MediaStream | HTMLVideoElement`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.

It can also be an existing `MediaStream`, for example to display the feed of an USB 360° camera, or a pre-existing `HTMLVideoElement` for more control over video playback.

```js
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

const viewer = new Viewer({
    container: 'photosphere',
    adapter: [EquirectangularVideoAdapter, {
        autoplay: true,
        muted: true,
    }],
    panorama: {
        source: stream,
    },
});
```
