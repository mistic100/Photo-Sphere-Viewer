# MarkersPlugin <Badge text="Styles"/>

<Badges module="markers-plugin"/>

::: module
<ApiButton page="modules/MarkersPlugin.html"/>
Displays various shapes, images and texts on the viewer.

This plugin is available in the [@photo-sphere-viewer/markers-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/markers-plugin) package.
:::

## Usage

The plugin provides a powerful markers system allowing to define points of interest on the panorama with optional tooltip and description. Markers can be dynamically added/removed and you can react to user click/tap.

There are five types of markers:

-   **HTML** defined with the `html`/`element`/`elementLayer` attribute
-   **Images** defined with the `image`/`imageLayer` attribute
-   **Videos** defined with the `videoLayer` attribute
-   **SVGs** defined with the `square`/`rect`/`circle`/`ellipse`/`path` attribute
-   **Dynamic polygons & polylines** defined with the `polygon`/`polygonPixels`/`polyline`/`polylinePixels` attribute

Markers can be added at startup with the `markers` option or after load with the various methods.

```js:line-numbers
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const viewer = new Viewer({
    plugins: [
        MarkersPlugin.withConfig({
            markers: [
                {
                    id: 'new-marker',
                    position: { yaw: '45deg', pitch: '0deg' },
                    image: 'assets/pin-red.png',
                    size: { width: 32, height: 32 },
                },
            ],
        }),
    ],
});

const markersPlugin = viewer.getPlugin(MarkersPlugin);

markersPlugin.addEventListener('select-marker', ({ marker }) => {
    markersPlugin.updateMarker({
        id: marker.id,
        image: 'assets/pin-blue.png',
    });
});
```

## Example

The following example contains most types of markers. Click anywhere on the panorama to add a red marker, right-click to change it's color and double-click to remove it.

:::: code-demo

```yaml
title: PSV Markers Demo
packages:
    - name: markers-plugin
      style: true
```

::: code-group

<<< ./demos-src/markers.js{js:line-numbers}
<<< ./demos-src/markers.html [template.html]

:::

::::

## Markers

### Definition

One, and only one, of these options is required for each marker.

#### `image`

-   type: `string`

Path to an image file. Requires `size` to be defined.

```js:line-numbers{3}
{
    id: 'marker-1',
    image: 'pin-red.png',
    position: { yaw: 0, pitch: 0 },
    size: { width: 32, height: 32 },
}
```

#### `imageLayer`

-   type: `string`

Path to an image file.

::: tip "Layers" positionning
There is two ways to position `imageLayer` and `videoLayer` markers:

-   `position` (one value) + `size` + `anchor` (optional) + `rotation` (optional)
-   `position` with four values defining the corners of the image/video

(`elementLayer` can only be positionned with `position` + `rotation`)

<DemoButton href="/demos/markers/layers.html"/>
:::

```js:line-numbers{3}
{
    id: 'marker-1',
    imageLayer: 'pin-red.png',
    position: { yaw: 0, pitch: 0 },
    size: { width: 32, height: 32 },
}

{
    id: 'marker-2',
    imageLayer: 'pin-red.png',
    position: [
        { yaw: -0.2, pitch: 0.2 },
        { yaw: 0.2, pitch: 0.2 },
        { yaw: 0.2, pitch: -0.2 },
        { yaw: -0.2, pitch: -0.2 },
    ],
}
```

::: tip What is the difference between "image" and "imageLayer" ?
Both allows to display an image but the difference is in the rendering technique.
An `image` marker is rendered flat above the viewer but and `imageLayer` is rendered inside the panorama itself, this allows for more natural movements and scaling.
:::

#### `videoLayer`

-   type: `string`

Path to a video file. It is positionned exactly like `imageLayer`. It can be used with the [`chromaKey`](#chromakey) option.

```js:line-numbers{3}
{
    id: 'marker-1',
    videoLayer: 'intro.mp4',
    position: { yaw: 0, pitch: 0 },
    size: { width: 600, height: 400 },
}
```

#### `html`

-   type: `string`

HTML content of the marker. It is recommended to define th `size`.

```js:line-numbers{3}
{
    id: 'marker-1',
    html: '<string>Click here</strong>',
    position: { yaw: 0, pitch: 0 },
    size: { width: 100, height: 30 },
}
```

#### `element`

-   type: `HTMLElement` & [`MarkerElement`](/api/interfaces/MarkersPlugin.MarkerElement.html){target=_blank}

Existing DOM element.

```js:line-numbers{3}
{
    id: 'marker-1',
    element: document.querySelector('#my-marker'),
    position: { yaw: 0, pitch: 0 },
}
```

::: tip Custom element markers
The `element`/`elementLayer` marker accepts [Web Components](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements).
If your component has an `updateMarker()` method it will be called by the plugin on each render with a bunch of properties:

-   `marker`: reference to the marker object itself
-   `position`: computed 2D position in the viewport
-   `viewerPosition`: current camera orientation in yaw+pitch
-   `zoomLevel`: current zoom level
-   `viewerSize`: size of the viewport

<DemoButton href="/demos/markers/custom-element.html"/>
:::

#### `elementLayer`

-   type: `HTMLElement` & [`MarkerElement`](/api/interfaces/MarkersPlugin.MarkerElement.html){target=_blank}

Existing DOM element. Unlike `element`, it is rendered "inside" the scene and has more natural movements and scaling.

```js:line-numbers{3}
{
    id: 'marker-1',
    elementLayer: getYoutubeIframe(videoId),
    position: { yaw: 0, pitch: 0 },
    rotation: { yaw: '10deg' },
}
```

<DemoButton href="/demos/markers/youtube-element.html"/>

#### `polygon`

-   type: `Array<number[2] | string[2] | SphericalPosition> | Array<Array<...>>`

Array of points defining the polygon in spherical coordinates (degrees or radians).  
The polygon can have one or more holes by defined them in a nested array (the syntax is [similar to GeoJSON](https://geojson.readthedocs.io/en/latest/#polygon)).

```js:line-numbers{3,8-11}
{
    id: 'marker-1',
    polygon: [[0.2, 0.4], [0.9, 1.1], [1.5, 0.7]];
}

{
    id: 'marker-2',
    polygon: [
        [[0.2, 0.4], [0.9, 1.1], [1.5, 0.7]],
        [[0.3, 0.5], [1.4, 0.8], [0.8, 1.0]], // holes coordinates must be in reverse order
    ],
}
```

#### `polygonPixels`

-   type: `Array<number[2] | PanoramaPosition> | Array<Array<...>>`

Same as `polygon` but in pixel coordinates on the panorama image.  
The object syntax can be used to define the panorama face when using a cubemap.  
Holes are also supported (see above).

```js:line-numbers{3,9-11}
{
    id: 'marker-1',
    polygonPixels: [[100, 200], [150, 300], [300, 200]],
}

{
    id: 'marker-2',
    polygonPixels: [
        { textureFace: 'front', textureX: 100, textureY: 200 },
        { textureFace: 'front', textureX: 150, textureY: 300 },
        { textureFace: 'front', textureX: 300, textureY: 200 },
    ],
}
```

#### `polyline`

-   type: `Array<number[2] | string[2] | SphericalPosition>`

Same as `polygon` but generates a polyline.

```js:line-numbers{3}
{
    id: 'marker-1',
    polyline: [[0.2, 0.4], [0.9, 1.1]],
}
```

#### `polylinePixels`

-   type: `Array<number[2] | PanoramaPosition>`

Same as `polygonPixels` but generates a polyline.

```js:line-numbers{3}
{
    id: 'marker-1',
    polylinePixels: [[100, 200], [150, 300]],
}
```

#### `square`

-   type: `integer`

Size of the square. 

```js:line-numbers{3}
{
    id: 'marker-1',
    square: 10,
    position: { yaw: 0, pitch: 0 },
}
```

#### `rect`

-   type: `integer[2] | { width: integer, height: integer }`

Size of the rectangle. 

```js:line-numbers{3,9}
{
    id: 'marker-1',
    rect: [10, 5],
    position: { yaw: 0, pitch: 0 },
}

{
    id: 'marker-2',
    rect: { width: 10, height: 5 },
    position: { yaw: 0, pitch: 0 },
}
```

#### `circle`

-   type: `integer`

Radius of the circle.

```js:line-numbers{3}
{
    id: 'marker-1',
    circle: 10,
    position: { yaw: 0, pitch: 0 },
}
```

#### `ellipse`

-   type: `integer[2] | { rx: integer, ry: integer }`;

Radiuses of the ellipse.

```js:line-numbers{3,9}
{
    id: 'marker-1',
    ellipse: [10, 5],
    position: { yaw: 0, pitch: 0 },
}

{
    id: 'marker-2',
    ellipse: { rx: 10, ry: 5 },
    position: { yaw: 0, pitch: 0 },
}
```

#### `path`

-   type: `string`

Definition of the path (0,0 will be placed at the defined `position`).

```js:line-numbers{3}
{
    id: 'marker-1',
    path: 'M0,0 L60,60 L60,0 L0,60 L0,0',
    position: { yaw: 0, pitch: 0 },
}
```


### Options

#### `id` (required)

-   type: `string`

Unique identifier of the marker.

#### `position` (required for all but polygons/polylines)

-   type: `{ yaw, pitch } | { textureX, textureY } | array`

Position of the marker in **spherical coordinates** (radians/degrees) or **texture coordinates** (pixels).

For `imageLayer` and `videoLayer` only it can be defined as an array of four positions (clockwise from top-left) to precisely place the four corners of the element.

_(This option is ignored for polygons and polylines)._

#### `size` (required for images, recommended for html/element)

-   type: `{ width, height }`

Size of the marker in pixels.

_(This option is ignored for polygons and polylines)._

#### `rotation`

-   type: `string | number | { yaw, pitch, roll }`

Rotation applied to the marker, in degrees or radians.

-   For 2D markers (`image`, `element`, `square`, etc.) only `roll` is applicable
-   For 3D markers (`imageLayer`, `videoLayer`, `elementLayer`) all axis are applicable but is ignored if `position` is an array

_(This option is ignored for polygons and polylines)._

#### `scale`

-   type: `double[] | { zoom: double[], yaw: [] }`
-   default: no scaling

Configures the scale of the marker depending on the zoom level and/or the horizontal angle offset. This aims to give a natural feeling to the size of the marker as the users zooms and moves.

_(This option is ignored for polygons, polylines and layers)._

:::: tabs

::: tab Scale by zoom
Scales depending on zoom level, the array contains `[scale at minimum zoom, scale at maximum zoom]` :

```js
scale: {
    // the marker is twice smaller on the minimum zoom level
    zoom: [0.5, 1];
}
```

:::

::: tab Scale by angle
Scales depending on position, the array contains `[scale on center, scale on the side]` :

```js
scale: {
    // the marker is twice bigger when on the side of the screen
    yaw: [1, 2];
}
```

:::

::: tab Scale by zoom & angle
Of course the two configurations can be combined :

```js
scale: {
  zoom: [0.5, 1],
  yaw: [1, 1.5]
}
```

:::

::::

#### `hoverScale`

-   type: `boolean | number | { amount?: number, duration?: number, easing?: string }`
-   default: `null`

Overrides the [global `defaultHoverScale`](#defaulthoverscale). It is merged with the default configuration.  
Defining `hoverScale: false` allows to disable the scaling for this marker.

_(This option is ignored for polygons, polylines and layers)._

<DemoButton href="/demos/markers/hover-scale.html"/>

#### `opacity`

-   type: `number`
-   default: `1`

Opacity of the marker.

#### `zIndex`

-   type: `number`
-   default: `1`

Ordering of the marker.

::: warning
`imageLayer` and `videoLayer` are always renderer first, then `polygon` and `polyline`, then standard markers.
:::

#### `className`

-   type: `string`

CSS class(es) added to the marker element.

_(This option is ignored for `imageLayer` and `videoLayer` markers)._

#### `style`

-   type: `object`

CSS properties to set on the marker (background, border, etc.).

_(For `imageLayer` and `videoLayer` markers only `cursor` can be configured)._

```js:line-numbers
style: {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  cursor         : 'help'
}
```

#### `svgStyle`

-   type: `object`

SVG properties to set on the marker (fill, stroke, etc.).
_(Only for polygons, polylines and svg markers)._

```js:line-numbers
svgStyle: {
  fill       : 'rgba(0, 0, 0, 0.5)',
  stroke     : '#ff0000',
  strokeWidth: '2px'
}
```

::: tip Image and pattern background
You can define complex SVG backgrounds such as images by using a pattern definition.

<DemoButton href="/demos/markers/polygon-pattern.html"/>
:::

#### `chromaKey`

-   type: `object`
-   default: `{ enabled: false }`

Will make a color of the image/video transparent.

_(This option is only applicable to `imagerLayer` and `videoLayer`)._

<DemoButton href="/demos/markers/chroma-key.html"/>

::: dialog "See details" "Marker chroma key"

The `chromaKey` marker option allows to define a color which will be transparent (green screen/blue screen).

```ts:line-numbers
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

#### `anchor`

-   type: `string`
-   default: `'center center'`

Defines where the marker is placed toward its defined position. Any CSS position is valid like `bottom center` or `20% 80%`.

_(This option is ignored for polygons and polylines)._

#### `zoomLvl`

-   type: `number`
-   default: `undefined`

The zoom level which will be applied when calling `gotoMarker()` method or when clicking on the marker in the list.
If not provided, the current zoom level is kept.

#### `visible`

-   type: `boolean`
-   default: `true`

Initial visibility of the marker.

#### `tooltip`

-   type: `string | {content: string, position: string, className: string, trigger: string}`
-   default: `{content: null, position: 'top center', className: null, trigger: 'hover'}`

Accepted positions are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.

Possible triggers are `hover` and `click`.

```js:line-numbers
tooltip: 'This is a marker' // tooltip with default position and style

tooltip: { // tooltip with custom position
  content: 'This is marker',
  position: 'bottom left',
}

tooltip: { // tooltip with a custom class shown on click
  content: 'This is marker',
  className: 'custom-tooltip',
  trigger: 'click',
}
```

::: tip Advanced tooltips
With the use of HTML and CSS you make fairly complex tooltips.

<DemoButton href="/demos/markers/custom-tooltip.html"/>
:::

#### `content`

-   type: `string`

HTML content that will be displayed on the side panel when the marker is clicked.

#### `listContent`

-   type: `string`

The name that appears in the list of markers. If not provided, the tooltip content will be used.

#### `hideList`

-   type: `boolean`
-   default: `false`

Hide the marker in the markers list.

#### `autoplay`

-   type: `boolean`
-   default: `true`

Autoplay of `videoLayer` markers

#### `data`

-   type: `any`

Any custom data you want to attach to the marker. You may access this data in the various [events](#events).

## Configuration

#### `markers`

-   type: `MarkerConfig[]`
-   updatable: no, use `setMarkers()` method

Initial list of markers.

#### `defaultHoverScale`

-   type: `boolean | number | { amount?: number, duration?: number, easing?: string }`
-   default: `null`

Default mouse hover scaling applied to all markers, can be overriden with each marker [`hoverScale` parameter](#hoverscale). Defining `defaultHoverScale: true` will use the default configuration of x2 scaling in 100ms with a linear easing.

#### `gotoMarkerSpeed`

-   type: `string|number`
-   default: `'8rpm'`
-   updatable: yes

Default animation speed for `gotoMarker` method.

#### `clickEventOnMarker`

-   type: `boolean`
-   default: `false`
-   updatable: yes

If a `click` event is triggered on the viewer additionally to the `select-marker` event.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
  markers: 'Markers',
  markersList: 'Markers list',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

## Methods

#### `addMarker(properties)`

Adds a new marker to the viewer.

```js:line-numbers
markersPlugin.addMarker({
    id: 'new-marker',
    position: { yaw: '45deg', pitch: '0deg' },
    image: 'assets/pin-red.png',
});
```

#### `clearMarkers()`

Removes all markers.

#### `getCurrentMarker(): Marker`

Returns the last marker clicked by the user.

#### `gotoMarker(id, [speed]): Promise`

Moves the view to face a specific marker. Default speed is `8rpm`, set it to `0` for an immediate rotation.

```js:line-numbers
markersPlugin.gotoMarker('marker-1', '4rpm')
  .then(() => /* animation complete */);
```

#### `hideMarker(id)` | `showMarker(id)` | `toggleMarker(id)`

Changes the visiblity of a marker.

#### `removeMarker(id)` | `removeMarkers(ids)`

Removes a marker.

#### `setMarkers(properties[])`

Replaces all markers by new ones.

#### `updateMarker(properties)`

Updates a marker with new properties. The type of the marker cannot be changed.

```js:line-numbers
markersPlugin.updateMarker({
    id: 'existing-marker',
    image: 'assets/pin-blue.png',
});
```

#### `showMarkerTooltip(id)` | `hideMarkerTooltip(id)`

Allows to always display a tooltip.

#### `showAllTooltips()` | `hideAllTooltips()` | `toggleAllTooltips()`

Allows to always display all tooltips.

## Events

#### `select-marker(marker, doubleClick, rightClick)`

Triggered when the user clicks on a marker.

```js:line-numbers
markersPlugin.addEventListener('select-marker', ({ marker }) => {
    console.log(`Clicked on marker ${marker.id}`);
});
```

#### `unselect-marker(marker)`

Triggered when a marker was selected and the user clicks elsewhere.

#### `marker-visibility(marker, visible)`

Triggered when the visibility of a marker changes.

```js:line-numbers
markersPlugin.addEventListener('marker-visibility', ({ marker, visible }) => {
    console.log(`Marker ${marker.id} is ${visible ? 'visible' : 'not visible'}`);
});
```

#### `enter-marker(marker)` | `leave-marker(marker)`

Triggered when the user puts the cursor hover or away a marker.

## Buttons

This plugin adds buttons to the default navbar:

-   `markers` allows to hide/show all markers
-   `markersList` allows to open a list of all markers on the left panel

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
