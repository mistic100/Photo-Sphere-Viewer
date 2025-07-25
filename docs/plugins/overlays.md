# OverlaysPlugin

<Badges module="overlays-plugin"/>

::: module
<ApiButton page="modules/OverlaysPlugin.html"/>
Display additional images on top of the panorama.

This plugin is available in the [@photo-sphere-viewer/overlays-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/overlays-plugin) package.
:::

## Usage

Overlays are images "glued" to the panorama. Contrary to [markers](./markers.md) they are part of the 3D scene and not drawn on top of the viewer.
Both equirectangular (full or cropped) and cubemaps are supported.

```js:line-numbers
import { OverlaysPlugin } from '@photo-sphere-viewer/overlays-plugin';

const viewer = new Viewer({
    plugins: [
        OverlaysPlugin.withConfig({
            overlays: [
                {
                    id: 'overlay',
                    path: 'path/to/overlay.png',
                },
            ],
        }),
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Overlay Demo
packages:
    - name: overlays-plugin
```

<<< ./demos-src/overlays.js{js:line-numbers}

:::

## Configuration

#### `overlays`

-   type: `OverlayConfig[]`
-   updatable: no

The list of overlays, see below. Can be updated with various [methods](#methods).

#### `autoclear`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Automatically remove all overlays when the panorama changes.

#### `inheritSphereCorrection`

-   type: `boolean`
-   default: `true`
-   updatable: no

Applies the global [`sphereCorrection`](../guide/config.md#spherecorrection) to each overlay.

### Overlays

Overlays can be a single image/video for a spherical gerometry or six images for a cube geometry (no videos).

#### `id` (recommended)

-   type: `string`
-   default: random value

Used to remove the overlay with `removeOverlay()` method.

#### `opacity`

-   type: `number`
-   default: `1`

#### `zIndex`

-   type: `number`
-   default: `0`

#### Spherical overlays

#### `path` (required)

-   type: `string`

Path to the image.

#### `panoData`

-   type: `PanoData`

This option acts the same as the core [`panoData`](../guide/config.md#panodata) and allows to display partial panoramas.

_Note:_ The `fullWidth` provided here is not necessarily the same of the base panorama, `croppedX/croppedY` will be scaled accordingly.

<DemoButton href="/demos/overlays/partial-overlay.html"/>

#### Cube overlays

#### `path` (required)

-   type: `CubemapPanorama`

Check the [cubemap adapter page](../guide/adapters/cubemap.md#panorama-options) for the possible syntaxes. All six faces are required but some can be `null`.

## Methods

#### `addOverlay(config)`

Adds a new overlay.

#### `removeOverlay(id)`

Removes an overlay.

#### `clearOverlays()`

Removes all overlays.

## Events

#### `overlay-click(overlayId)`

Triggered when an overlay is clicked.

```js:line-numbers
overlaysPlugin.addEventListener('overlay-click', ({ overlayId }) => {
    console.log(`Clicked on overlay ${overlayId}`);
});
```
