# PlanPlugin <Badge text="Styles"/>

<Badges module="plan-plugin"/>

::: module
<ApiButton page="modules/PlanPlugin.html"/>
Adds a [Leaflet](https://leafletjs.com) map on the viewer, showing the location of the panorama and optional hotspots. It uses OpenStreetMap by default.

This plugin is available in the [@photo-sphere-viewer/plan-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/plan-plugin) package.
:::

## Usage

The minimal configuration of this plugin contains `coordinates` (the GPS position of the panorama).

```js:line-numbers
import { PlanPlugin } from '@photo-sphere-viewer/plan-plugin';

const viewer = new Viewer({
    plugins: [
        PlanPlugin.withConfig({
            coordinates: [6.79077, 44.58041],
        }),
    ],
});
```

::: warning
Do not forget to import Leaflet JS and CSS files.
:::

## Example

::: code-demo

```yaml
title: PSV Plan Demo
packages:
    - name: plan-plugin
      style: true
    - name: leaflet
      external: true
      version: 1
      style: true
      js: dist/leaflet-src.esm.js
      css: dist/leaflet.css
```

<<< ./demos-src/plan.js{js:line-numbers}

:::

## Configuration

#### `coordinates` (required)

-   type: `[number, number]`
-   updatable: yes

GPS position of the panorama (longitude, latitude). You can also use `setCoordinates()` method.

#### `bearing`

-   type: `number | string`
-   default: `0`
-   updatable: yes

Rotation offset to apply to the central pin to make it match with the panorama orientation.

#### `layers`

-   type: `array`
-   default: OpenStreetMap
-   updatable: no

List of available base layers, if more than one is defined, a button will allow to switch between layers.

Each element is an object containing `urlTemplate` (for standard raster tiles) **OR** `layer`  (for any custom Leaflet layers), as well as `name` and `attribution`.

```js:line-numbers
layers: [
    {
        name: 'OpenStreetMap',
        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap',
    },
    {
        name: 'OpenTopoMap',
        layer: new L.TileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c'],
            maxZoom: 17,
        }),
        attribution: '&copy; OpenTopoMap',
    },
]
```

_Note: this option is ignored if `configureLeaflet` is used._

#### `configureLeaflet`

-   type: `function<map>`
-   updatable: no

Allows to configure Leaftlet yourself. This will disable the default layer.

```js:line-numbers
configureLeaflet(map) {
    // https://leafletjs.com/reference.html
},
```

#### `size`

-   type: `{ width: string, height: string }`
-   default: `{ width: '300px', height: '200px' }`
-   updatable: yes

The size of the widget.

#### `position`

-   type: `string`
-   default: `bottom left`
-   updatable: yes

Position of the widget, accepted positions are combinations of `top`, `bottom` and `left`, `right`.

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

#### `hotspots`

-   type: `PlanHotspot[]`
-   default: `null`
-   updatable: yes

Markers visible on the map. See below. You can also use `setHotspots()` method.

::: tip
[Markers](./markers.md) can be displayed on the map by defining their `plan` data, which must be an hotspot object.

The marker tooltip is reused if defined. The viewer will be moved to face the marker if clicked on the map.

<DemoButton href="/demos/plan/markers.html"/>
:::

#### `spotStyle`

-   type: `object`
-   updatable: yes

Style of hotspots.

::: dialog "See details" "Plan hotspot style"

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
     * @default 'rgba(255, 255, 255, 0.8)'
     */
    hoverBorderColor?: string;
}
```

:::

#### `defaultZoom`

-   type: `number`
-   default: `15`
-   updatable: no

Default zoom level of the map.

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
-   default: `{ maximize: true, close: true, reset: true }`
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
    mapReset: 'Reset',
    mapLayers: 'Base layer',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Hotspots

#### `id`

-   type: `string`
-   default: generated

Useful to react to clicks with the `select-hotspot` event.

#### `coordinates` (required)

-   type: `[number, number]`

Configure the position of the hotspot on the map.

#### `style`

Allow to override the default `spotStyle`.

#### `tooltip`

-   type: `string | { content: string, className: string }`
-   default: `null`


## Methods

#### `setHotspots(hotspots)`

Changes the hotspots.

```js:line-numbers
mapPlugin.setHotspots([
    { id: '1', coordinates: [6.79077, 44.58041], tooltip: 'Hotspot one' },
    { id: '2', coordinates: [6.79077, 44.58041], image: 'blue-dot.png' },
]);
```

#### `clearHotspots()`

Removes all hotspots.

#### `setCoordinates(coordinates)`

Changes the position of the panorama on the map.

```js:line-numbers
mapPlugin.setCoordinates([6.79077, 44.58041]);
```

#### `close()` | `open()`

Switches between closed and opened mode.

#### `maximize()` | `minimize()`

Switches between maximized and minimized views. (Has no effect if the map is closed).

#### `getLeaflet()`

Returns the Leaflet instance.

#### `setZoom(level)`

Changes the current zoom level.

## Events

#### `select-hotspot(hotspotId)`

Triggered when the user clicks on a hotspot.

```js:line-numbers
planPlugin.addEventListener('select-hotspot', ({ hotspotId }) => {
    console.log(`Clicked on hotspot ${hotspotId}`);
});
```

#### `view-changed(view)`

Triggered when the map is maximized (`view=maximized`), minimized or opened (`view=normal`) or closed (`view=closed`).

## SCSS variables

| variable           | default                   | description                  |
| ------------------ | ------------------------- | ---------------------------- |
| $radius            | 8px                       | Corner radius of the widget  |
| $shadow            | 0 0 5px rgba(0, 0, 0, .7) | Shadow applied to the widget |
| $button-size       | 34px                      | Size of buttons              |
| $button-background | rgba(0, 0, 0, .5)         | Background color of buttons  |
| $button-color      | white                     | Icon color if buttons        |
| $transition        | ease-in-out .3s           | Transition                   |
