# MarkersPlugin

<ApiButton page="PSV.plugins.MarkersPlugin.html"/>

> Displays various markers/hotspots on the viewer.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/markers.js` and `dist/plugins/markers.css`.

[[toc]]

## Usage

The plugin provides a powerful markers system allowing to define points of interest on the panorama with optional tooltip and description. Markers can be dynamically added/removed and you can react to user click/tap.

There are four types of markers :

- **HTML** defined with the `html` attribute
- **Images** defined with the `image` or `imageLayer` attribute
- **SVGs** defined with the `rect`, `circle`, `ellipse` or `path` attribute
- **Dynamic polygons & polylines** defined with the `polygonPx`/`polygonRad`/`polylinePx`/`polylineRad` attribute

Markers can be added at startup with the `markers` option or after load with the various methods.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    [PhotoSphereViewer.MarkersPlugin, {
      markers: [
        {
          id: 'new-marker',
          longitude: '45deg',
          latitude: '0deg',
          image: 'assets/pin-red.png',
        },
      ],
    }],
  ],
});

const markersPlugin = viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

markersPlugin.on('select-marker', (e, marker) => {
  markersPlugin.updateMarker({
    id: marker.id,
    image: 'assets/pin-blue.png'
  });
});
```


## Example

The following example contains all types of markers. Click anywhere on the panorama to add a red marker, right-click to change it's color and double-click to remove it.

::: code-demo

```yaml
title: PSV Markers Demo
resources:
  - path: plugins/markers.js
    imports: MarkersPlugin
  - path: plugins/markers.css
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
    [PhotoSphereViewer.MarkersPlugin, {
      // list of markers
      markers: [{
          // image marker that opens the panel when clicked
          id: 'image',
          longitude: 0.32,
          latitude: 0.11,
          image: baseUrl + 'pictos/pin-blue.png',
          width: 32,
          height: 32,
          anchor: 'bottom center',
          tooltip: 'A image marker. <b>Click me!</b>',
          content: document.getElementById('lorem-content').innerHTML
        },
        {
          // image marker rendered in the 3D scene
          id        : 'imageLayer',
          imageLayer: baseUrl + 'pictos/tent.png',
          width     : 120,
          height    : 94,
          longitude : -0.45,
          latitude  : -0.1,
          tooltip   : 'Image embedded in the scene',
        },
        {
          // html marker with custom style
          id: 'text',
          longitude: 0,
          latitude: 0,
          html: 'HTML <b>marker</b> &hearts;',
          anchor: 'bottom right',
          scale: [0.5, 1.5],
          style: {
            maxWidth: '100px',
            color: 'white',
            fontSize: '20px',
            fontFamily: 'Helvetica, sans-serif',
            textAlign: 'center'
          },
          tooltip: {
            content: 'An HTML marker',
            position: 'right'
          }
        },
        {
          // polygon marker
          id: 'polygon',
          polylineRad: [
            [6.2208, 0.0906], [0.0443, 0.1028], [0.2322, 0.0849], [0.4531, 0.0387],
            [0.5022, -0.0056], [0.4587, -0.0396], [0.2520, -0.0453], [0.0434, -0.0575],
            [6.1302, -0.0623], [6.0094, -0.0169], [6.0471, 0.0320], [6.2208, 0.0906],
          ],
          svgStyle: {
            fill: 'rgba(200, 0, 0, 0.2)',
            stroke: 'rgba(200, 0, 50, 0.8)',
            strokeWidth: '2px'
          },
          tooltip: {
            content: 'A dynamic polygon marker',
            position: 'right bottom'
          }
        },
        {
          // polyline marker
          id: 'polyline',
          polylinePx: [
            [2478, 1635], [2184, 1747], [1674, 1953], [1166, 1852],
            [709, 1669], [301, 1519], [94, 1399], [34, 1356]
          ],
          svgStyle: {
            stroke: 'rgba(140, 190, 10, 0.8)',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: '10px'
          },
          tooltip: 'A dynamic polyline marker'
        },
        {
          // circle marker
          id: 'circle',
          circle: 20,
          x: 2500,
          y: 1200,
          tooltip: 'A circle marker'
        }
      ]
    }]
  ]
});

const markersPlugin = viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

/**
 * Create a new marker when the user clicks somewhere
 */
viewer.on('click', (e, data) => {
  if (!data.rightclick) {
    markersPlugin.addMarker({
      id: '#' + Math.random(),
      longitude: data.longitude,
      latitude: data.latitude,
      image: baseUrl + 'pictos/pin-red.png',
      width: 32,
      height: 32,
      anchor: 'bottom center',
      tooltip: 'Generated pin',
      data: {
        generated: true
      }
    });
  }
});

/**
 * Delete a generated marker when the user double-clicks on it
 * Or change the image if the user right-clicks on it
 */
markersPlugin.on('select-marker', (e, marker, data) => {
  if (marker.data && marker.data.generated) {
    if (data.dblclick) {
      markersPlugin.removeMarker(marker);
    } else if (data.rightclick) {
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


## Markers definition

One of these options is required.

| Name | Type | Description |
|---|---|---|
| `image` | `string` | Path to the image representing the marker. Requires `width` and `height` to be defined. |
| `imageLayer` | `string` | Path to the image representing the marker. Requires `width` and `height` to be defined. |
| `html` | `string` | HTML content of the marker. It is recommended to define `width` and `height`. |
| `square` | `integer` | Size of the square. |
| `rect` | `integer[2] |`<br>`{width:int,height:int}` | Size of the rectangle. |
| `circle` | `integer` | Radius of the circle. |
| `ellipse` | `integer[2] |`<br>`{cx:int,cy:int}` | Radiuses of the ellipse. |
| `path` | `string` | Definition of the path (0,0 will be placed at the defined x/y or longitude/latitude). |
| `polygonPx` | `integer[2][]` |Array of points defining the polygon in pixel coordinates on the panorama image. |
| `polygonRad` | `double[2][]` | Same as above but coordinates are in longitude and latitude. |
| `polylinePx` | `integer[2][]` | Same as `polygonPx` but generates a polyline. |
| `polylineRad` | `double[2][]` | Same as `polygonRad` but generates a polyline. |

**Examples :**

```js
{
  image: 'pin-red.png',
  imageLayer: 'pin-blue.png',
  html: 'Click here',
  square: 10,
  rect: [10, 5],
  rect: {width: 10, height: 5},
  circle: 10,
  ellipse: [10, 5],
  ellipse: {cx: 10, cy: 5},
  path: 'M 0 0 L 60 60 L 60 0 L 0 60 L 0 0',
  polygonPx: [[100, 200], [150, 300], [300, 200]],
  polygonRad: [[0.2, 0.4], [0.9, 1.1], [1.5, 0.7]],
  polylinePx: [[100, 200], [150, 300]],
  polylineRad: [[0.2, 0.4], [0.9, 1.1]],
}
```

::: tip What is the difference between "image" and "imageLayer" ?
Both allows to display an image but the difference is in the rendering technique.
And `image` marker is rendered flat above the viewer but and `imageLayer` is rendered inside the panorama itself, this allows for more natural movements and scaling.
:::

::: warning
Texture coordinates are not applicable to cubemaps.
:::



## Markers options

#### `id` (required)
- type: `string`

Unique identifier of the marker.

#### `x` & `y` or `latitude` & `longitude` (required for all but polygons/polylines)
- type: `integer` or `double`

Position of the marker in **texture coordinates** (pixels) or **spherical coordinates** (radians).
_(This option is ignored for polygons and polylines)._

#### `width` & `height` (required for images, recommended for html)
- type: `integer`

Size of the marker in pixels.
_(This option is ignored for polygons and polylines)._

#### `orientation` (only for `imageLayer`)
- type: `'front' | 'horizontal' | 'vertical-left' | 'vertical-right'`
- default: `'front'`

Applies a perspective on the image to make it look like placed on the floor or on a wall.

#### `scale`
- type: `double[] | { zoom: double[], longitude: [] }`
- default: no scalling

Configures the scale of the marker depending on the zoom level and/or the longitude offset. This aims to give a natural feeling to the size of the marker as the users zooms and moves.
_(This option is ignored for polygons, polylines and imageLayer)._

Scales depending on zoom level, the array contains `[scale at minimum zoom, scale at maximum zoom]` :
```js
scale: {
  // the marker is twice smaller on the minimum zoom level
  zoom: [0.5, 1]
}
```

Scales depending on position, the array contains `[scale on center, scale on the side]` :
```js
scale: {
  // the marker is twice bigger when on the side of the screen
  longitude: [1, 2]
}
```

Of course the two configurations can be combined :
```js
scale: {
  zoom: [0.5, 1],
  longitude: [1, 1.5]
}
```

#### `opacity`
- type: `number`
- default: `1`

Opacity of the marker. (Works for `imageLayer` too).

#### `className`
- type: `string`

CSS class(es) added to the marker element.
_(This option is ignored for `imageLayer` markers)._

#### `style`
- type: `object`

CSS properties to set on the marker (background, border, etc.).
_(This option is ignored for `imageLayer` markers)._

```js
style: {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  cursor         : 'help'
}
```

#### `svgStyle`
- type: `object`

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
You can define complex SVG backgrounds such as images by using a pattern definition.

First declare the pattern somewhere in your page :

```html
<svg id="patterns">
  <defs>
    <!-- define pattern origin on its center -->
    <pattern id="image" x="256" y="256" width="512" height="512" patternUnits="userSpaceOnUse">
      <image href="my-image.jpg" x="0" y="0" width="512" height="512"/>
    </pattern>
  </defs>
</svg>
```

And use it in your marker : `fill: 'url(#image)'`.
:::

#### `anchor`
- type: `string`
- default: `'center center'`

Defines where the marker is placed toward its defined position. Any CSS position is valid like `bottom center` or `20% 80%`.
_(This option is ignored for polygons and polylines)._

#### `visible`
- type: `boolean`
- default: `true`

Initial visibility of the marker.

#### `tooltip`
- type: `string | {content: string, position: string, className: string, trigger: string}`
- default: `{content: null, position: 'top center', className: null, trigger: 'hover'}`

Accepted positions are combinations of `top`, `center`, `bottom` and `left`, `center`, `right` with the exception of `center center`.

Possible triggers are `hover` and `click`.

```js
tooltip: 'This is a marker' // tooltip with default position and style

tooltip: { // tooltip with custom position
  content : 'This is marker',
  position: 'bottom left',
}

tooltip: { // tooltip with a custom class shown on click
  content: 'This is marker',
  className: 'custom-tooltip',
  trigger: 'click',
}
```

::: warning
If `trigger` is set to `'click'` you won't be able to display a `content` in the side panel.
:::

#### `listContent`
- type: `string`

The name that appears in the list of markers. If not provided, the tooltip content will be used.

#### `content`
- type: `string`

HTML content that will be displayed on the side panel when the marker is clicked.

#### `hideList`
- type: `boolean`
- default: `false`

Hide the marker in the markers list.

#### `data`
- type: `any`

Any custom data you want to attach to the marker. You may access this data in the various [events](#events).


## Configuration

#### `lang`
- type: `object`
- default:
```js
lang: {
  markers    : 'Markers',
  markersList: 'Markers list',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

#### `clickEventOnMarker`
- type: `boolean`
- default: `false`

If a `click` event is triggered on the viewer additionally to the `select-marker` event.


## Methods

#### `addMarker(properties)`

Adds a new marker to the viewer.

```js
markersPlugin.addMarker({
  id: 'new-marker',
  longitude: '45deg',
  latitude: '0deg',
  image: 'assets/pin-red.png',
});
```

#### `clearMarkers()`

Removes all markers.

#### `getCurrentMarker(): Marker`

Returns the last marker clicked by the user.

#### `gotoMarker(id, speed): Animation`

Moves the view to center a specific marker, with optional [animation](../guide/methods.md#animate-options-animation).

```js
markersPlugin.gotoMarker('marker-1', 1500)
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

#### `marker-visibility(marker, visible)`

Triggered when the visibility of a marker changes.

```js
markersPlugin.on('marker-visibility', (e, marker, visible) => {
  console.log(`Marker ${marker.id} is ${visible ? 'visible' : 'not visible'}`);
});
```

#### `over-marker(marker)` | `leave-marker(marker)`

Triggered when the user puts the cursor hover or away a marker.

```js
markersPlugin.on('over-marker', (e, marker) => {
  console.log(`Cursor is over marker ${marker.id}`);
});
```

#### `select-marker(marker, data)`

Triggered when the user clicks on a marker. The `data` object indicates if the marker was selected with a double a click on a right click.

#### `unselect-marker(marker)`

Triggered when a marker was selected and the user clicks elsewhere.


## Buttons

This plugin adds buttons to the default navbar:
- `markers` allows to hide/show all markers
- `markersList` allows to open a list of all markers on the left panel

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
