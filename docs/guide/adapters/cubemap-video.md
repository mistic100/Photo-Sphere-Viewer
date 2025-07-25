# Cubemap video

<Badges module="cubemap-video-adapter"/>

::: module
This adapter is available in the [@photo-sphere-viewer/cubemap-video-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-video-adapter) package.
:::

```js:line-numbers
import { CubemapVideoAdapter } from '@photo-sphere-viewer/cubemap-video-adapter';

const viewer = new Viewer({
    adapter: CubemapVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [VideoPlugin],
});
```

::: warning
This adapter requires to use the [VideoPlugin](../../plugins/video.md).
:::

## Example

::: code-demo

```yaml
title: PSV Cubemap Video Demo
packages:
    - name: cubemap-video-adapter
    - name: video-plugin
      style: true
    - name: settings-plugin
      style: true
    - name: resolution-plugin
```

<<< ./demos-src/cubemap-video.js{js:line-numbers}

:::

::: tip Positions definitions
This adapter does not support pixel positions, only `yaw`+`pitch`.
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

It can also be an existing `MediaStream`, for example to display the feed of an USB 360° camera, or a pre-existing `HTMLVideoElement` for more control over video playback.

#### `equiangular`

-   type: `boolean`
-   default: `true`

Set to `true` when using an equiangular cubemap (EAC), which is the format used by Youtube. Set to `false` when using a standard cubemap.

### Video format

This adapter supports video files consisting of a grid of the six faces of the cube, as used by Youtube for example.

The layout of a frame must be as follow:

![cubemap-video](/images/cubemap-video.png)
