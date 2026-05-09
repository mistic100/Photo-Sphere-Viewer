# Equirectangular raycast video

<Badges module="equirectangular-raycast-video-adapter"/>

::: module
This adapter renders equirectangular videos using the same per-pixel projection as the [equirectangular raycast adapter](./equirectangular-raycast.md), avoiding the polar distortion produced by UV-interpolated sphere geometry.

This adapter is available in the [@photo-sphere-viewer/equirectangular-raycast-video-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/equirectangular-raycast-video-adapter) package.
:::

```js:line-numbers
import { EquirectangularRaycastVideoAdapter } from '@photo-sphere-viewer/equirectangular-raycast-video-adapter';

const viewer = new Viewer({
    adapter: EquirectangularRaycastVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [VideoPlugin],
});
```

::: warning
This adapter requires the [VideoPlugin](../../plugins/video.md).
:::

## Example

::: code-demo

```yaml
title: PSV Equirectangular Raycast Video Demo
packages:
    - name: equirectangular-raycast-video-adapter
    - name: video-plugin
      style: true
    - name: settings-plugin
      style: true
    - name: resolution-plugin
```

<<< ./demos-src/equirectangular-raycast-video.js{js:line-numbers}

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

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)

-   type: `string | MediaStream | HTMLVideoElement`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.

It can also be an existing `MediaStream`, for example to display the feed of a USB 360° camera, or a pre-existing `HTMLVideoElement` for more control over video playback.

#### `data`

-   type: `object | function<Video, PanoData>`

Can be used to define cropping information if the video does not cover a full sphere. See the [equirectangular video adapter](./equirectangular-video.md#data) for the data shape.
