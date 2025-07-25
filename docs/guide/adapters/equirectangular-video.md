# Equirectangular video

<Badges module="equirectangular-video-adapter"/>

::: module
This adapter is available in the [@photo-sphere-viewer/equirectangular-video-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/equirectangular-video-adapter) package.
:::

```js:line-numbers
import { EquirectangularVideoAdapter } from '@photo-sphere-viewer/equirectangular-video-adapter';

const viewer = new Viewer({
    adapter: EquirectangularVideoAdapter,
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
title: PSV Equirectangular Video Demo
packages:
    - name: equirectangular-video-adapter
    - name: video-plugin
      style: true
    - name: settings-plugin
      style: true
    - name: resolution-plugin
```

<<< ./demos-src/equirectangular-video.js{js:line-numbers}

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

```js:line-numbers
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

const viewer = new Viewer({
    container: 'photosphere',
    adapter: EquirectangularVideoAdapter.withConfig({
        autoplay: true,
        muted: true,
    }),
    panorama: {
        source: stream,
    },
});
```

#### `data`

-   type: `object | function<Video, PanoData>`

Can by used to define cropping information if the video does not cover a full sphere.

```js:line-numbers
panorama: {
    source: 'path/video.mp4',
    data: {
        fullWidth: 6000,
        // "fullHeight" optional, always "fullWidth / 2"
        croppedX: 1000,
        croppedY: 500,
    },
}
```
