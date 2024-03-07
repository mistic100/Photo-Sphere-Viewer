# MarkersPlugin <Badge text="Styles"/>

<Badges module="markers-plugin"/>

::: module
<ApiButton page="modules/MarkersPlugin.html"/>
Displays various shapes, images and texts on the viewer.

This plugin is available in the [@photo-sphere-viewer/markers-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/markers-plugin) package.
:::

[[toc]]

## Usage

The plugin provides a powerful markers system allowing to define points of interest on the panorama with optional tooltip and description. Markers can be dynamically added/removed and you can react to user click/tap.

There are four types of markers :

-   **HTML** defined with the `html`/`element` attribute
-   **Images** defined with the `image`/`imageLayer` attribute
-   **Videos** defined with the `videoLayer` attribute
-   **SVGs** defined with the `square`/`rect`/`circle`/`ellipse`/`path` attribute
-   **Dynamic polygons & polylines** defined with the `polygon`/`polygonPixels`/`polyline`/`polylinePixels` attribute

Markers can be added at startup with the `markers` option or after load with the various methods.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.MarkersPlugin, {
            markers: [
                {
                    id: 'new-marker',
                    position: { yaw: '45deg', pitch: '0deg' },
                    image: 'assets/pin-red.png',
                    size: { width: 32, height: 32 },
                },
            ],
        }],
    ],
});

const markersPlugin = viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

markersPlugin.addEventListener('select-marker', ({ marker }) => {
    markersPlugin.updateMarker({
        id: marker.id,
        image: 'assets/pin-blue.png',
    });
});
```

## Example

The following example contains all types of markers. Click anywhere on the panorama to add a red marker, right-click to change it's color and double-click to remove it.

::: code-demo

```yaml
title: PSV Markers Demo
packages:
    - name: markers-plugin
      imports: MarkersPlugin
      style: true
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,

    plugins: [
        [MarkersPlugin, {
            // list of markers
            markers: [
                {
                    // image marker that opens the panel when clicked
                    id: 'image',
                    position: { yaw: 0.32, pitch: 0.11 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    zoomLvl: 100,
                    tooltip: 'A image marker. <b>Click me!</b>',
                    content: document.getElementById('lorem-content').innerHTML,
                },
                {
                    // image marker rendered in the 3D scene
                    id: 'imageLayer',
                    imageLayer: baseUrl + 'pictos/tent.png',
                    size: { width: 120, height: 94 },
                    position: { yaw: -0.45, pitch: -0.1 },
                    tooltip: 'Image embedded in the scene',
                },
                {
                    // html marker with custom style
                    id: 'text',
                    position: { yaw: 0, pitch: 0 },
                    html: 'HTML <b>marker</b> &hearts;',
                    anchor: 'bottom right',
                    scale: [0.5, 1.5],
                    style: {
                        maxWidth: '100px',
                        color: 'white',
                        fontSize: '20px',
                        fontFamily: 'Helvetica, sans-serif',
                        textAlign: 'center',
                    },
                    tooltip: {
                        content: 'An HTML marker',
                        position: 'right',
                    },
                },
                {
                    // polygon marker
                    id: 'polygon',
                    polygon: [
                        [6.2208, 0.0906], [0.0443, 0.1028], [0.2322, 0.0849], [0.4531, 0.0387],
                        [0.5022, -0.0056], [0.4587, -0.0396], [0.252, -0.0453], [0.0434, -0.0575],
                        [6.1302, -0.0623], [6.0094, -0.0169], [6.0471, 0.032], [6.2208, 0.0906],
                    ],
                    svgStyle: {
                        fill: 'rgba(200, 0, 0, 0.2)',
                        stroke: 'rgba(200, 0, 50, 0.8)',
                        strokeWidth: '2px',
                    },
                    tooltip: {
                        content: 'A dynamic polygon marker',
                        position: 'bottom right',
                    },
                },
                {
                    // polyline marker
                    id: 'polyline',
                    polylinePixels: [
                        [2478, 1635], [2184, 1747], [1674, 1953], [1166, 1852],
                        [709, 1669], [301, 1519], [94, 1399], [34, 1356],
                    ],
                    svgStyle: {
                        stroke: 'rgba(140, 190, 10, 0.8)',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: '10px',
                    },
                    tooltip: 'A dynamic polyline marker',
                },
                {
                    // circle marker
                    id: 'circle',
                    circle: 20,
                    position: { textureX: 2500, textureY: 1200 },
                    tooltip: 'A circle marker',
                },
            ],
        }],
    ],
});

const markersPlugin = viewer.getPlugin(MarkersPlugin);

/**
 * Create a new marker when the user clicks somewhere
 */
viewer.addEventListener('click', ({ data }) => {
    if (!data.rightclick) {
        markersPlugin.addMarker({
            id: '#' + Math.random(),
            position: { yaw: data.yaw, pitch: data.pitch },
            image: baseUrl + 'pictos/pin-red.png',
            size: { width: 32, height: 32 },
            anchor: 'bottom center',
            tooltip: 'Generated pin',
            data: {
                generated: true,
            },
        });
    }
});

/**
 * Delete a generated marker when the user double-clicks on it
 * Or change the image if the user right-clicks on it
 */
markersPlugin.addEventListener('select-marker', ({ marker, doubleClick, rightClick }) => {
    if (marker.data?.generated) {
        if (doubleClick) {
            markersPlugin.removeMarker(marker);
        } else if (rightClick) {
            markersPlugin.updateMarker({
                id: marker.id,
                image: baseUrl + 'pictos/pin-blue.png',
            });
        }
    }
});
```

```html
<script type="text/template" id="lorem-content">
    <h1>HTML Ipsum Presents</h1>

    <p><strong>Pellentesque habitant morbi tristique</strong> senectus et netus et malesuada fames ac turpis egestas.
      Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam
      egestas semper. <em>Aenean ultricies mi vitae est.</em> Mauris placerat eleifend leo. Quisque sit amet est et
      sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, <code>commodo vitae</code>, ornare sit amet,
      wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac
      dui. <a href="#">Donec non enim</a> in turpis pulvinar facilisis. Ut felis.</p>

      <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54469.108394396746!2d6.9617553450295855!3d44.151844842645815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12cdaf6678af879d%3A0xcabc15aee7b89386!2sParc%20national%20du%20Mercantour!5e0!3m2!1sfr!2sfr!4v1611498421096!5m2!1sfr!2sfr" width="100%" height="300" frameborder="0" style="border:0;" allowfullscreen="" aria-hidden="false" tabindex="0"></iframe>

    <h2>Header Level 2</h2>

    <ol>
      <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
      <li>Aliquam tincidunt mauris eu risus.</li>
    </ol>

    <blockquote><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus magna. Cras in mi at felis aliquet
      congue. Ut a est eget ligula molestie gravida. Curabitur massa. Donec eleifend, libero at sagittis mollis,
      tellus est malesuada tellus, at luctus turpis elit sit amet quam. Vivamus pretium ornare est.</p></blockquote>

    <h3>Header Level 3</h3>

    <ul>
      <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
      <li>Aliquam tincidunt mauris eu risus.</li>
    </ul>
</script>
```

:::

::: tip
You can try markers live in [the playground](../playground.md).
:::

## Markers

### Definition

One, and only one, of these options is required for each marker.

| Name             | Type                                     | Description                                                                   |
| ---------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `image`          | `string`                                 | Path to an image file. Requires `width` and `height` to be defined.           |
| `imageLayer`     | `string`                                 | Path to an image file.                                                        |
| `videoLayer`     | `string`                                 | Path to a video file.                                                         |
| `html`           | `string`                                 | HTML content of the marker. It is recommended to define `width` and `height`. |
| `element`        | `HTMLElement`                            | Existing DOM element.                                                         |
| `square`         | `integer`                                | Size of the square.                                                           |
| `rect`           | `integer[2]`<br>`{width:int,height:int}` | Size of the rectangle.                                                        |
| `circle`         | `integer`                                | Radius of the circle.                                                         |
| `ellipse`        | `integer[2]`<br>`{rx:int,ry:int}`        | Radiuses of the ellipse.                                                      |
| `path`           | `string`                                 | Definition of the path (0,0 will be placed at the defined `position`).        |
| `polygon`        | `double[2][]`<br>`string[2][]`           | Array of points defining the polygon in spherical coordinates.                |
| `polygonPixels`  | `integer[2][]`                           | Same as `polygon` but in pixel coordinates on the panorama image.             |
| `polyline`       | `double[2][]`<br>`string[2][]`           | Same as `polygon` but generates a polyline.                                   |
| `polylinePixels` | `integer[2][]`                           | Same as `polygonPixels` but generates a polyline.                             |

**Examples :**

```js
{
  image: 'pin-red.png',
  imageLayer: 'pin-blue.png',
  videoLayer: 'intro.mp4',
  html: 'Click here',
  element: document.querySelector('#my-marker'),
  square: 10,
  rect: [10, 5],
  rect: {width: 10, height: 5},
  circle: 10,
  ellipse: [10, 5],
  ellipse: {rx: 10, ry: 5},
  path: 'M 0 0 L 60 60 L 60 0 L 0 60 L 0 0',
  polygon: [[0.2, 0.4], [0.9, 1.1], [1.5, 0.7]],
  polygonPixels: [[100, 200], [150, 300], [300, 200]],
  polyline: [[0.2, 0.4], [0.9, 1.1]],
  polylinePixels: [[100, 200], [150, 300]],
}
```

::: tip What is the difference between "image" and "imageLayer" ?
Both allows to display an image but the difference is in the rendering technique.
And `image` marker is rendered flat above the viewer but and `imageLayer` is rendered inside the panorama itself, this allows for more natural movements and scaling.
:::

::: tip Custom element markers
The `element` marker accepts [Web Components](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements).
If your component has an `updateMarker()` method it will be called by the plugin on each render with a bunch of properties:

-   `marker`: reference to the marker object itself
-   `position`: computed 2D position in the viewport
-   `viewerPosition`: current camera orientation in yaw+pitch
-   `zoomLevel`: current zoom level
-   `viewerSize`: size of the viewport

[Check the demo](../demos/markers/custom-element.md)
:::

::: tip "Layers" positionning
There is two ways to position `imageLayer` and `videoLayer` markers:

-   `position` (one value) + `size` + `anchor` (optional) + `orientation` (optional)
-   `position` with four values defining the corners of the image/video

[Check the demo](../demos/markers/layers.md)
:::

### Options

#### `id` (required)

-   type: `string`

Unique identifier of the marker.

#### `position` (required for all but polygons/polylines)

-   type: `{ yaw, pitch } | { textureX, textureY } | array`

Position of the marker in **spherical coordinates** (radians/degrees) or **texture coordinates** (pixels).

For `imageLayer` and `videoLayer` it can be defined as an array of four positions (clockwise from top-left) to precisely place the four corners of the element.

_(This option is ignored for polygons and polylines)._

#### `size` (required for images, recommended for html/element)

-   type: `{ width, height }`

Size of the marker in pixels.

_(This option is ignored for polygons and polylines)._

#### `rotation`

-   type: `string | number`

Rotation applied to the marker, in degrees or radians.

_(This option is ignored for polygons and polylines)._

#### `orientation` (only for `imageLayer`, `videoLayer`)

-   type: `'front' | 'horizontal' | 'vertical-left' | 'vertical-right'`
-   default: `'front'`

Applies a perspective on the image to make it look like placed on the floor or on a wall.

_(Ignored if `position` is an array)._

#### `scale`

-   type: `double[] | { zoom: double[], yaw: [] }`
-   default: no scaling

Configures the scale of the marker depending on the zoom level and/or the horizontal angle offset. This aims to give a natural feeling to the size of the marker as the users zooms and moves.

_(This option is ignored for polygons, polylines, `imageLayer` and `videoLayer` markers)._

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

Overrides the [global `defaultHoverScale`](#defaulthoverscale). The configuration is merged with the default configuration of x2 scaling in 100ms with a linear easing. Defining `hoverScale: false` allows to disable the scaling for this marker. [See demo](../demos/markers/hover-scale.md).

_(This option is ignored for polygons, polylines and `imageLayer` markers)._

```js
{
    defaultHoverScale: { amount: 1.5, duration: 150 },
    markers: [
        {
            ...,
            hoverScale: { amount: 3 },
            hoverScale: 3,
            hoverScale: false,
        },
    ],
}
```

#### `opacity`

-   type: `number`
-   default: `1`

Opacity of the marker.

#### `zIndex`

-   type: `number`
-   default: `1`

Ordering of the marker.

_(This option is ignored for polygons and polylines markers)._

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

```js
style: {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  cursor         : 'help'
}
```

#### `svgStyle`

-   type: `object`

SVG properties to set on the marker (fill, stroke, etc.).
_(Only for polygons, polylines and svg markers)._

```js
svgStyle: {
  fill       : 'rgba(0, 0, 0, 0.5)',
  stroke     : '#ff0000',
  strokeWidth: '2px'
}
```

::: tip Image and pattern background
You can define complex SVG backgrounds such as images by using a pattern definition. [See demo](../demos/markers/polygon-pattern.md).
:::

#### `chromaKey`

-   type: `object`
-   default: `{ enabled: false }`

Will make a color of the image/video transparent. [See demo](../demos/markers/chroma-key.md).

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

_(This option is only applicable to `imagerLayer` and `videoLayer`)._

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

```js
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

```js
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

#### `gotoMarker(id[, speed]): Animation`

Moves the view to face a specific marker.

```js
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

```js
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

```js
markersPlugin.addEventListener('select-marker', ({ marker }) => {
    console.log(`Clicked on marker ${marker.id}`);
});
```

#### `unselect-marker(marker)`

Triggered when a marker was selected and the user clicks elsewhere.

#### `marker-visibility(marker, visible)`

Triggered when the visibility of a marker changes.

```js
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
