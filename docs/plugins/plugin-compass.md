# CompassPlugin

<ApiButton page="PSV.plugins.CompassPlugin.html"/>

> Adds a compass on the viewer to represent which portion of the sphere is currently visible.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/compass.js` and `dist/plugins/compass.css`.

[[toc]]


## Usage

The plugin can be configured with `hotspots` which are small dots on the compass. It can also use markers.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    [PhotoSphereViewer.CompassPlugin, {
      hotspots: [
        { longitude: '45deg' },
        { longitude: '60deg', color: 'red' },
      ],
    }],
  ],
});
```


## Example

::: code-demo

```yaml
title: PSV Compass Demo
resources:
  - path: plugins/compass.js
    imports: CompassPlugin
  - path: plugins/compass.css
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
    [PhotoSphereViewer.CompassPlugin, {
      hotspots: [
        { longitude: '0deg' },
        { longitude: '90deg' },
        { longitude: '180deg' },
        { longitude: '270deg' },
      ],
    }],
    [PhotoSphereViewer.MarkersPlugin, {
      markers: [
        {
          id: 'pin',
          longitude: 0.11,
          latitude: 0.32,
          image: baseUrl + 'pictos/pin-blue.png',
          width: 32,
          height: 32,
          anchor: 'bottom center',
          data : { compass: '#304ACC' },
        },
        {
          id: 'polygon',
          polygonPx: [2941, 1413, 3042, 1402, 3222, 1419, 3433, 1463, 3480, 1505, 3438, 1538, 3241, 1543, 3041, 1555, 2854, 1559, 2739, 1516, 2775, 1469, 2941, 1413 ],
          svgStyle : {
            fill       : 'rgba(255,0,0,0.2)',
            stroke     : 'rgba(255, 0, 50, 0.8)',
            strokeWidth: '2px',
          },
          data: { compass: 'rgba(255, 0, 50, 0.8)' },
        },
        {
          id: 'polyline',
          polylinePx: [2478, 1635, 2184, 1747, 1674, 1953, 1166, 1852, 709, 1669, 301, 1519, 94, 1399, 34, 1356],
          svgStyle: {
            stroke        : 'rgba(80, 150, 50, 0.8)',
            strokeLinecap : 'round',
            strokeLinejoin: 'round',
            strokeWidth   : '20px',
          },
          data: { compass: 'rgba(80, 150, 50, 0.8)' },
        },
      ],
    }],
  ],
});
```

:::

::: tip
The north is always at longitude=0, if you need to change where is the north you can use `panoData.poseHeading` or `sphereCorrection.pan` option.
:::


## Configuration

#### `size`
- type: `string`
- default: `'120px'`

The size of the compass, can be declared in `px`, `rem`, `vh`, etc.

#### `position`
- type: `string`
- default: `'top left'`

Accepted positions are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.

#### `navigation`
- type: `boolean`
- default: `true`

Allows to click on the compass to rotate the viewer.

#### `hotspots`
- type: `Hotspot[]`
- default: `null`

Small dots visible on the compass. Each spot consist of a position (either `x`/`y` or `longitude`/`latitude`) and an optional `color` which overrides the global `hotspotColor`.

::: tip
[Markers](plugin-markers.md) can be displayed on the compass by defining their `compass` data which can be `true` or a specific color.

```js
markers: [
  { 
    id: 'marker-1', 
    image: 'pin.png', 
    longitude: '15deg', latitude: 0, 
    data: { compass: true },
  },
  { 
    id: 'marker-2', 
    text: 'Warning', 
    longitude: '-45deg', latitude: 0, 
    data: { compass: 'orange' },
  },
]
```

:::

#### `backgroundSvg`
- type: `string`
- default: SVG provided by the plugin

SVG used as background of the compass (must be square).

#### `coneColor`
- type: `string`
- default: `'rgba(255, 255, 255, 0.2)'`

Color of the cone of the compass.

#### `navigationColor`
- type: `string`
- default: `'rgba(255, 0, 0, 0.2)'`

Color of the navigation cone.

#### `hotspotColor`
- type: `string`
- default: `'rgba(0, 0, 0, 0.5)'`

Default color of hotspots.


## Methods

#### `setHotspots(hotspots)`

Changes the hotspots.

```js
compassPlugin.setHotspots([
  { longitude: '0deg' },
  { longitude: '10deg', color: 'red' },
]);
```

#### `clearHotspots()`

Removes all hotspots
