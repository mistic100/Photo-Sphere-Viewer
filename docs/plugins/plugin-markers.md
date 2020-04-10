# MarkersPlugin

<md-button class="md-raised md-primary" href="https://photo-sphere-viewer.js.org/api/PSV.plugins.MarkersPlugin.html">API Documentation</md-button>

> Displays various markers/hotspots on the viewer.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/markers.js` and `dist/plugins/markers.css`.

[[toc]]

---

The plugin provides a powerful markers system allowing to define points of interest on the panorama with optional tooltip and description. Markers can be dynamically added/removed and you can react to user click/tap.

There are four types of markers :

- **HTML** defined with the `html` attribute
- **Images** defined with the `image` attribute
- **SVGs** defined with the `rect`, `circle`, `ellipse` or `path` attribute
- **Dynamic polygons & polylines** defined with the `polygonPx`/`polygonRad`/`polylinePx`/`polylineRad` attribute

Markers can be added at startup with the `markers` option or after load with the various methods.


## Example

The following example contains all types of markers. Click anywhere on the panorama to add a red marker, right-click to change it's color and double-click to remove it.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/kdpqLey2/embedded/result,js/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>


## Markers options

#### `id` (required)
- type : `string`

Unique identifier of the marker.

#### `x` & `y` or `latitude` & `longitude` (required)
- type : `integer` or `double`

Position of the marker in **texture coordinates** (pixels) or **spherical coordinates** (radians).
_(This option is ignored for polygons and polylines)_

#### `width` & `height`
- type : `integer`

Size of the marker.
_(This option is ignored for polygons and polylines)_

#### `scale`
- type : 'double | double[]'

Scale factor multiplied by the zoom level. Provide an array of two values for min and max.
By default the scale is constant.

```js
scale: 1 // the marker is scalling with the zoom level (from 0 to 100%)

scale: [0.5, 1] // at minimum zoom level the marker is half its size at maximum zoom level
```

#### `className`
- type : `string`

CSS class(es) added to the marker element.

#### `style`
- type : `object`

CSS properties to set on the marker (background, border, etc.).

```js
style: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    cursor         : 'help'
}
```

#### `svgStyle`
- type : `object`

SVG properties to set on the marker (fill, stroke, etc.). _Only for SVG and polygons/polylines markers._

```js
svgStyle: {
    fill       : 'rgba(0, 0, 0, 0.5)',
    stroke     : '#ff0000',
    strokeWidth: '2px'
}
```

#### `anchor`
- type : `string`
- default : `'center center'`

Defines where the marker is placed toward its defined position. Any CSS position is valid like `bottom center` or `20% 80%`.
_(This option is ignored for polygons and polylines)_

#### `visible`
- type : `boolean`
- default : `true`

Initial visibility of the marker.

#### `tooltip`
- type : `string | {content: string, position: string}`
- default : `{content: null, position: 'top center'}`

Tooltip content and position. Accepted positions are combinations of `top`, `center`, `bottom` and `left`, `center`, `right` with the exception of `center center`.

```js
tooltip: 'This is a marker' // tooltip with default position

tooltip: { // tooltip with custom position
  content : 'This is marker',
  position: 'bottom left'
}
```

#### `content`
- type : `string`

HTML content that will be displayed on the side panel when the marker is clicked.

#### `data`
- type : `any`

Any custom data you want to attach to the marker.


## Markers definition

One of these options is required.

#### `image`
- type : `string`

Path to the image representing the marker. Requires `width` and `height` to be defined.

#### `html`
- type : `string`

HTML content of the marker. It is recommended to define `width` and `height`.

#### `rect`
- type : `integer[2] | {width: integer, height: integer}`

Size of the rectangle.

```js
rect: [10, 5]

rect: {width: 10, height: 5}
```

#### `circle`
- type: `integer`

Radius of the circle.

#### `ellipse`
- type : `integer[2] | {cx: integer, cy: integer}`

Radiuses of the ellipse.

```js
ellipse: [10, 5]

ellipse: {cx: 10, cy: 5}
```

#### `path`
- type : `string`

Definition of the path (0,0 will be placed at the defined x/y or longitude/latitude).

```js
path: 'M 0 0 L 60 60 L 60 0 L 0 60 L 0 0'
```

#### `polygonPx`
- type : `integer[2][]`

Array of points defining the polygon in pixel coordinates on the panorama image.

```js
polygonPx: [[100, 200], [150, 300], [300, 200]]
```


#### `polygonRad`
- type : `double[2][]`

Same as above but coordinates are in longitude and latitude.

```js
polygonRad: [[0.2, 0.4], [0.9, 1.1], [1.5, 0.7]]
```

#### `polylinePx`
- type : `integer[2][]`

Same as `polygonPx` but generates a polyline.

#### `polylineRad`
- type : `double[2][]`

Same as `polygonRad` but generates a polyline.


## Configuration

#### `lang`
- type: `object`
- default:
```js
lang: {
    markers : 'Markers',
    markersList : 'Markers list',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config#lang) object._

#### `clickEventOnMarker`
- type: `boolean`
- default: `false`

If a `click` event is triggered on the viewer additionally to the `select-marker` event.
