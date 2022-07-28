# CompassPlugin

<ApiButton page="PSV.plugins.CompassPlugin.html"/>

> Adds a compass on the viewer to represent which portion of the sphere is currently visible.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/compass.js` and `dist/plugins/compass.css`.

[[toc]]


## Usage

The plugin can be configured with `hotspots` which are small dots on the compass. It can also use markers as hotspots (see bellow).

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

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/efpdoak2/embedded/result,js,html/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

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
