# MapPlugin <Badge text="Styles"/>

<Badges module="map-plugin"/>

::: module
<ApiButton page="modules/MapPlugin.html"/>
Adds a interactive map on the viewer, with zoom/pan and optional hotspots.

This plugin is available in the [@photo-sphere-viewer/map-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/map-plugin) package.
:::

::: tip
Looking for geographic map ? (OpenStreetMap, Google, etc) try the [Plan plugin](plan.md) instead.
:::

## Usage

The minimal configuration of this plugin contains `imageUrl` and `center` (the position of the panorama on the map, in pixels). The map rotation can be ajusted with `rotation`.

```js:line-numbers
import { MapPlugin } from '@photo-sphere-viewer/map-plugin';

const viewer = new Viewer({
    plugins: [
        MapPlugin.withConfig({
            imageUrl: 'path/to/map.jpg',
            center: { x: 785, y: 421 },
            rotation: '-12deg',
        }),
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Map Demo
packages:
    - name: map-plugin
      style: true
```

<<< ./demos-src/map.js{js:line-numbers}

:::

::: tip
The north of the compass is always toward the top of the map, before rotation.
:::

## Configuration

#### `imageUrl` (required)

-   type: `string`
-   updatable: no, use `setImage()` method

URL of the image to use as map.

#### `center` (required)

-   type: `{ x: number, y: number }`
-   updatable: yes

The position of the panorama on the map, in pixels. You can also use `setCenter()` method.

#### `rotation`

-   type: `number | string`
-   default: `0`
-   updatable: yes

Rotation to apply to the map to make it match with the panorama, it can be declared in radians or in degrees (ex: `'45deg'`).

#### `shape`

-   type: `'round' | 'square'`
-   default: `'round'`
-   updatable: yes

The shape of the widget.

#### `size`

-   type: `string`
-   default: `200px`
-   updatable: yes

The size of the widget, can be declared in `px`, `rem`, `vh`, etc.

#### `position`

-   type: `string`
-   default: `bottom left`
-   updatable: yes

Position of the widget, accepted positions are combinations of `top`, `bottom` and `left`, `right`.

#### `static`

-   type: `boolean`
-   default: `false`
-   updatable: yes

If `true` the map will not rotate, only the central pin will, to indicate where the panorama is oriented.

#### `overlayImage`

-   type: `string`
-   default: default SVG
-   updatable: yes

SVG or image URL drawn on top of the map, can be `null` to disable.

#### `pinImage`

-   type: `string`
-   default: default SVG
-   updatable: yes

SVG or image URL used for the central pin.

#### `pinSize`

-   type: `number`
-   default: `35`
-   updatable: yes

Size of the central pin.

#### `coneColor`

-   type: `string`
-   default: `#1E78E6`
-   updatable: yes

Color of the cone of the compass, set to `null` to disable.

#### `coneSize`

-   type: `number`
-   default: `40`
-   updatable: yes

Size of the cone of the compass.

#### `hotspots`

-   type: `MapHotspot[]`
-   default: `null`
-   updatable: yes

Small dots visible on the map. See below. You can also use `setHotspots()` method.

::: tip
[Markers](./markers.md) can be displayed on the map by defining their `map` data, which must be an hotspot object (minus `yaw` which is know from the marker position).

The marker tooltip is reused if defined. The viewer will be moved to face the marker if clicked on the map.

<DemoButton href="/demos/map/markers.html"/>
:::

#### `spotStyle`

-   type: `object`
-   updatable: yes

Style of hotspots.

::: dialog "See details" "Map hotspot style"

The hotspots are represented by a circle with configurable size and color, but can also be an image.

```ts:line-numbers
{
    /**
     * Size of the hotspot
     * @default 15
     */
    size?: number;
    /**
     * SVG or image URL used for hotspot
     */
    image?: string;
    /**
     * Color of the hotspot when no image is provided
     * @default 'white'
     */
    color?: string;
    /**
     * Size of the border
     * @default 0
     */
    borderSize?: number;
    /**
     * Color of the border
     * @default null
     */
    borderColor?: string;
    /**
     * Size on mouse hover
     * @default null
     */
    hoverSize?: number;
    /**
     * SVG or image URL on mouse hover
     * @default null
     */
    hoverImage?: string;
    /**
     * Color on mouse hover
     * @default null
     */
    hoverColor?: string;
    /**
     * Size of the border on mouse hover
     * @default 4
     */
    hoverBorderSize?: number;
    /**
     * Color of the border on mouse hover
     * @default 'rgba(255, 255, 255, 0.6)'
     */
    hoverBorderColor?: string;
    /**
     * Stacking position of the hotpost, defaults to declaration order
     * @default null
     */
    zIndex?: number;
}
```

:::

#### `defaultZoom`

-   type: `number`
-   default: `100`
-   updatable: no

Default zoom level of the map.

#### `maxZoom`

-   type: `number`
-   default: `200`
-   updatable: yes

Maximum zoom level of the map.

#### `minZoom`

-   type: `number`
-   default: `20`
-   updatable: yes

Minimum zoom level of the map.

#### `visibleOnLoad`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays the map when loading the first panorama.

#### `minimizeOnHotspotClick`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Always minimize the map when an hotspot/marker is clicked.

#### `buttons`

-   type: `object`
-   default: `{ north: true, maximize: true, close: true, reset: true }`
-   updatable: no

Configure which buttons are visible around the map.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    map: 'Map',
    mapMaximize: 'Maximize',
    mapMinimize: 'Minimize',
    mapNorth: 'Go to north',
    mapReset: 'Reset',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Hotspots

#### `id`

-   type: `string`
-   default: generated

Useful to react to clicks with the `select-hotspot` event.

#### `yaw`+`distance` or `x`+`y` (required)

-   type: `number`

Configure the position of the hotspot on the map, either with a angle and a distance (in pixels on the map image) or absolute x/y coordinates (also in pixels on the map image).

#### `style`

Allow to override the default `spotStyle`.

#### `tooltip`

-   type: `string | { content: string, className: string }`
-   default: `null`


## Methods

#### `setHotspots(hotspots)`

Changes the hotspots.

```js
mapPlugin.setHotspots([
    { id: '1', yaw: '0deg', distance: 120, tooltip: 'Hotspot one' },
    { id: '2', x: 150, y: 310, image: 'blue-dot.png' },
]);
```

#### `clearHotspots()`

Removes all hotspots.

#### `setImage(url, center?, rotation?)`

Changes the image of the map.

```js
mapPlugin.setImage('map2.jpg', { x: 500, y: 500 });
```

#### `setCenter(center)`

Changes the position of the panorama on the map.

```js
mapPlugin.setCenter({ x: 500, y: 500 });
```

#### `close()` | `open()`

Switches between closed and opened mode.

#### `maximize()` | `minimize()`

Switches between maximized and minimized views. (Has no effect if the map is closed).

#### `setZoom(level)`

Changes the current zoom level (between `minZoom` and `maxZoom`).

## Events

#### `select-hotspot(hotspotId)`

Triggered when the user clicks on a hotspot.

```js
mapPlugin.addEventListener('select-hotspot', ({ hotspotId }) => {
    console.log(`Clicked on hotspot ${hotspotId}`);
});
```

#### `view-changed(view)`

Triggered when the map is maximized (`view=maximized`), minimized or opened (`view=normal`) or closed (`view=closed`).

## SCSS variables

| variable            | default                   | description                                        |
| ------------------- | ------------------------- | -------------------------------------------------- |
| $radius             | 8px                       | Corner radius of the widget (only if shape=square) |
| $shadow             | 0 0 5px rgba(0, 0, 0, .7) | Shadow applied to the widget                       |
| $background         | rgba(61, 61, 61, .7)      | Background color of the map                        |
| $button-size        | 34px                      | Size of buttons                                    |
| $button-background  | rgba(0, 0, 0, .5)         | Background color of buttons                        |
| $button-color       | core.$buttons-color       | Color of buttons                                   |
| $toolbar-font       | 12px sans-serif           | Font for the zoom indicator                        |
| $toolbar-text-color | white                     | Color of the zoom indicator                        |
| $toolbar-background | #222                      | Background color of the zoom indicator             |
| $transition         | ease-in-out .3s           | Transition                                         |
