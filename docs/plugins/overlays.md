# OverlaysPlugin

<Badges module="overlays-plugin"/>

::: module
<ApiButton page="modules/OverlaysPlugin.html"/>
Display additional images and videos on top of the panorama.
:::

## Usage

Overlays are images and videos "glued" to the panorama. Contrary to [markers](./markers.md) they are part of the 3D scene and not drawn on top of the viewer.

Two kinds of overlays are supported :

-   full size equirectangular/cubemap : will cover the entire panorama
-   positionned rectangle : the image/video has a defined position and size (always in radians/degrees)

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.OverlaysPlugin, {
            overlays: [
                {
                    id: 'fullsize',
                    path: 'path/to/overlay.png',
                },
                {
                    id: 'positionned',
                    path: 'path/to/image.jpg',
                    yaw: '-20deg',
                    pitch: '10deg',
                    width: '40deg',
                    height: '20deg',
                    opacity: 0.5,
                },
                {
                    id: 'video',
                    type: 'video',
                    path: 'path/to/video.mp4',
                    yaw: '20deg',
                    pitch: '10deg',
                    width: '40deg',
                    height: '20deg',
                },
            ],
        }],
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Overlay Demo
packages:
    - name: overlays-plugin
      imports: OverlaysPlugin
```

<<< ./demos-src/overlays.js

:::

::: tip Overlays vs. Markers
Overlays seem very similar to image/video markers but serve different purposes:

-   Markers are for "small" elements, generally interactive
-   Markers are highly configurable (style, tooltip, user events, etc.)
-   Overlays can cover the whole panorama
-   Overlays cannot have a tooltip, change size, etc. You can however listen to click events
-   Overlays are rendered over the panorama itself where markers are rendered flat over the viewer HTML element

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

### Overlays

Overlays can be a single image/video for a spherical gerometry or six images for a cube geometry (no videos).

#### `id` (recommended)

-   type: `string`
-   default: random value

Used to remove the overlay with `removeOverlay()` method.

#### `type`

-   type: `image | video`
-   default: `image`

#### `opacity`

-   type: `number`
-   default: `1`

#### `zIndex`

-   type: `number`
-   default: `0`

#### Spherical overlays

#### `path` (required)

-   type: `string`

Path to the image or video.

#### `yaw`, `pitch`, `width`, `height`

-   type: `number | string`

Definition of the position and size of the overlay, if none of the four properties are configured, the overlay will cover the full sphere, respecting the [panorama data](../guide/adapters/equirectangular.md#cropped-panorama) if applicable.

#### `chromaKey`

-   type: `object`
-   default: `{ enabled: false }`

Will make a color of the image/video transparent.

::: dialog "See details" "Marker chroma key"

The `chromaKey` marker option allows to define a color which will be transparent (green screen/blue screen).

```ts
chromaKey: {
    /**
     * Enable the option
     */
    enabled: true,
    /**
     * Select which color to make transparent (default is green)
     */
    color: 0x00ff00,
    color: { r: 0, g: 255, 0 },
    /**
     * Customize the color detection (default is 0.2 / 0.2)
     */
    similarity: 0.2,
    smoothness: 0.2,
}
```

:::

_(This option is only applicable to spherical overlays)._

#### Cube overlays

#### `path` (required)

-   type: `CubemapPanorama`

Check the [cubemap adapter page](../guide/adapters/cubemap.md#panorama-options) for the possible syntaxes. All six faces are required.

## Methods

#### `addOverlay(config)`

Adds a new overlay.

#### `removeOverlay(id)`

Removes an overlay.

#### `clearOverlays()`

Removes all overlays.

#### `getVideo(id)`

Returns the controller of a video overlay (native HTMLVideoElement) in order to change its state, volume, etc.

```js
overlaysPlugin.getVideo('my-video').muted = false;
```

## Events

#### `overlay-click(overlayId)`

Triggered when an overlay is clicked.

```js
overlaysPlugin.addEventListener('overlay-click', ({ overlayId }) => {
    console.log(`Clicked on overlay ${overlayId}`);
});
```
