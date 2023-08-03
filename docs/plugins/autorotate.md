# AutorotatePlugin

<Badges module="autorotate-plugin"/>

::: module
<ApiButton page="modules/AutorotatePlugin.html"/>
Adds an automatic rotation of the panorama, which starts automatically on idle or with a click on a button. The rotation can also be configured to visit specific points.

This plugin is available in the [@photo-sphere-viewer/autorotate-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/autorotate-plugin) package.
:::

[[toc]]

## Usage

:::: tabs

::: tab Standard

In standard mode the panorama will simply rotate around, you can configure the `autorotatePitch` and `autorotateZoomLvl`.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.AutorotatePlugin, {
            autorotatePitch: '5deg',
        }],
    ],
});
```

:::

::: tab Keypoints

In keypoints mode the plugin is configured with a list of `keypoints` which can be either a position object (either `yaw`/`pitch` or `textureX`/`textureY`) or the identifier of an existing [marker](./markers.md).

It is also possible to configure each keypoint with a pause time and a tooltip.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.AutorotatePlugin, {
            keypoints: [
                'existing-marker-id',

                { yaw: Math.PI / 2, pitch: 0 },

                {
                    position: { yaw: Math.PI, pitch: Math.PI / 6 },
                    pause: 5000,
                    tooltip: 'This is interesting',
                },

                {
                    markerId: 'another-marker', // will use the marker tooltip if any
                    pause: 2500,
                },
            ],
        }],
    ],
});
```

:::

::::

## Example

### Standard

::: code-demo

```yaml
title: PSV Autorotate Demo
packages:
    - name: autorotate-plugin
      imports: AutorotatePlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        [PhotoSphereViewer.AutorotatePlugin, {
            autostartDelay: 1000,
            autorotatePitch: '5deg',
        }],
    ],
});
```

:::

### Keypoints

::: code-demo

```yaml
title: PSV Autorotate Keypoints Demo
packages:
    - name: autorotate-plugin
      imports: AutorotatePlugin
    - name: markers-plugin
      imports: MarkersPlugin
      style: true
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    navbar: [
        'autorotate',
        'zoom',
        {
            // a custom button to change keypoints
            title: 'Change points',
            content: '🔄',
            onClick: randomPoints,
        },
        'caption',
        'fullscreen',
    ],

    plugins: [
        [PhotoSphereViewer.AutorotatePlugin, {
            autostartDelay: 1000,
            autorotateSpeed: '3rpm',
        }],
        PhotoSphereViewer.MarkersPlugin,
    ],
});

const autorotatePlugin = viewer.getPlugin(PhotoSphereViewer.AutorotatePlugin);
const markersPlugin = viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

viewer.addEventListener('ready', randomPoints, { once: true });

/**
 * Randomize the keypoints and add corresponding markers
 */
function randomPoints() {
    const points = [];

    for (let i = 0, l = Math.random() * 2 + 4; i < l; i++) {
        points.push({
            position: {
                yaw: ((i + Math.random()) * 2 * Math.PI) / l,
                pitch: (Math.random() * Math.PI) / 3 - Math.PI / 6,
            },
            pause: i % 3 === 0 ? 2000 : 0,
            tooltip: 'Test tooltip',
        });
    }

    markersPlugin.setMarkers(
        points.map((pt, i) => {
            return {
                id: '#' + i,
                position: pt.position,
                image: baseUrl + 'pictos/pin-red.png',
                size: { width: 32, height: 32 },
                anchor: 'bottom center',
            };
        })
    );

    autorotatePlugin.setKeypoints(points);
}
```

:::

## Configuration

#### `autostartDelay`

-   type: `integer`
-   default: `2000`
-   updatable: yes

Delay after which the automatic rotation will begin, in milliseconds.

#### `autostartOnIdle`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Restarts the automatic rotation if the user is idle for `autostartDelay`.

**Note:** the rotation won't restart of the user explicitly clicks on the navbar button.

#### `autorotateSpeed`

-   type: `string`
-   default: `2rpm`
-   updatable: yes

Speed of the automatic rotation. Can be a negative value to reverse the rotation.

#### `autorotatePitch`

-   type: `double | string`
-   default: `defaultPitch`
-   updatable: yes

Vertical angle at which the automatic rotation is performed.

#### `autorotateZoomLvl`

-   type: `number`
-   default: `null`
-   updatable: yes

Zoom level at which the automatic rotation is performed. If `null` the current zoom is kept.

#### `keypoints`

-   type: `AutorotateKeypoint[]`
-   updatable: no, use `setKeypoints()` method

Initial keypoints, does the same thing as calling `setKeypoints()` just after initialisation.

#### `startFromClosest`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Start from the closest keypoint instead of the first keypoint of the array.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    autorotate: 'Automatic rotation',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

## Methods

#### `setKeypoints(keypoints)`

Changes or remove the keypoints.

#### `start()` / `stop()` / `toggle()`

As it says.

## Events

#### `autorotate(autorotateEnabled)`

Triggered when the automatic rotation is enabled/disabled.

## Buttons

This plugin adds buttons to the default navbar:

-   `autorotate` allows to toggle the rotation on and off

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
