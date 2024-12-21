# VideoPlugin <Badge text="Styles"/>

<Badges module="video-plugin"/>

::: module
<ApiButton page="modules/VideoPlugin.html"/>
Adds controls to the video [adapters](../guide/adapters/).

This plugin is available in the [@photo-sphere-viewer/video-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/video-plugin) package.
:::

## Usage

To use this plugin you must also load one of the video adapters : [equirectangular](../guide/adapters/equirectangular-video.md) or [cubemap](../guide/adapters/cubemap-video.md).

Once enabled it will add various elements to the viewer:

-   Play/pause button
-   Volume button
-   Time indicator in the navbar
-   Progressbar above the navbar
-   Play button in the center of the viewer

It also supports advanced autorotate with timed `keypoints`.

```js
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin';

const viewer = new Viewer({
    adapter: EquirectangularVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [
        VideoPlugin,
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Video Demo
packages:
    - name: equirectangular-video-adapter
    - name: video-plugin
      imports: VideoPlugin
      style: true
    - name: autorotate-plugin
    - name: settings-plugin
      style: true
    - name: resolution-plugin
```

<<< ./demos-src/video.js

:::

## Configuration

#### `keypoints`

-   type: `Array<{ position, time }>`
-   updatable: no, use `setKeypoints()` method

Defines timed keypoints that will be used by the autorotate button.

```js
keypoints: [
    { time: 0, position: { yaw: 0, pitch: 0 } },
    { time: 5.5, position: { yaw: 0.25, pitch: 0 } },
    { time: 12.8, position: { yaw: 0.3, pitch: -12 } },
];
```

::: warning
The usage of keypoints requires to load the [Autorotate plugin](./autorotate.md).
:::

#### `progressbar`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays a progressbar on top of the navbar.

#### `bigbutton`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays a big "play" button in the center of the viewer.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
  videoPlay: 'Play/Pause',
  videoVolume: 'Volume',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Multi resolution

You can offer multiple resolutions of your video with the [ResolutionPlugin](./resolution.md).

```js
const viewer = new Viewer({
    adapter: EquirectangularVideoAdapter,
    plugins: [
        VideoPlugin,
        SettingsPlugin,
        [ResolutionPlugin, {
            defaultResolution: 'FHD',
            resolutions: [
                {
                    id: 'UHD',
                    label: 'Ultra high',
                    panorama: { source: 'path/video-uhd.mp4' },
                },
                {
                    id: 'FHD',
                    label: 'High',
                    panorama: { source: 'path/video-fhd.mp4' },
                },
                {
                    id: 'HD',
                    label: 'Standard',
                    panorama: { source: 'path/video-hd.mp4' },
                },
            ],
        }],
    ],
});
```

## Methods

#### `setKeypoints(keypoints)`

Changes the keypoints.

## Events

#### `play-pause(playing)`

Triggered when the video starts playing or is paused.

#### `volume-change(volume)`

Triggered when the video volume changes.

#### `progress(time, duration, progress)`

Triggered when the video play progression changes.

## Buttons

This plugin adds buttons to the default navbar:

-   `videoPlay` allows to play/pause the video
-   `videoVolume` allows to change the volume/mute the video
-   `videoTime` shows the video time and duration (not a real button)

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.

## SCSS variables

| variable                    | default                              | description                                                      |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| $progressbar-height         | 3px                                  | Height of the progress bar                                       |
| $progressbar-height-active  | 5px                                  | Height of the progress bar on mouse hover                        |
| $progressbar-progress-color | core.$buttons-color                  | Color of the playing progress bar                                |
| $progressbar-buffer-color   | core.$buttons-active-background      | Color of the buffer progress bar                                 |
| $progressbar-handle-size    | 9px                                  | Size of the seek handle                                          |
| $progressbar-handle-color   | white                                | Color of the seek handle                                         |
| $volume-height              | 80px                                 | Height of the volume control                                     |
| $volume-width               | $progressbar-height-active           | Width of the volume control                                      |
| $volume-bar-color           | $progressbar-progress-color          | Color of the volume controle                                     |
| $volume-track-color         | $progressbar-buffer-color            | Background color of the volume control                           |
| $volume-handle-size         | $progressbar-handle-size             | Size of the volume handle                                        |
| $volume-handle-color        | $progressbar-handle-color            | Color of the volume handle                                       |
| $bigbutton-color            | core.$buttons-color                  | Color of the central play button                                 |
| $bigbutton-size             | (portrait: 20vw,<br>landscape: 10vw) | Size if the central play button, depending on screen orientation |
