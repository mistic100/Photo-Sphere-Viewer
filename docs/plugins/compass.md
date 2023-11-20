# CompassPlugin <Badge text="Styles"/>

<Badges module="compass-plugin"/>

::: module
<ApiButton page="modules/CompassPlugin.html"/>
Adds a compass on the viewer to represent which portion of the sphere is currently visible.

This plugin is available in the [@photo-sphere-viewer/compass-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/compass-plugin) package.
:::

[[toc]]

## Usage

The plugin can be configured with a list of `hotspots` which are small dots on the compass. It can also display markers positions.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.CompassPlugin, {
            hotspots: [
                { yaw: '45deg' }, 
                { yaw: '60deg', color: 'red' },
            ],
        }],
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Compass Demo
packages:
    - name: compass-plugin
      imports: CompassPlugin
      style: true
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
        [CompassPlugin, {
            hotspots: [
                { yaw: '0deg' },
                { yaw: '90deg' },
                { yaw: '180deg' },
                { yaw: '270deg' },
            ],
        }],
        [MarkersPlugin, {
            markers: [
                {
                    id: 'pin',
                    position: { yaw: 0.11, pitch: 0.32 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    data: { compass: '#304ACC' },
                },
                {
                    id: 'polygon',
                    polygonPixels: [
                        2941, 1413, 3042, 1402, 3222, 1419, 3433, 1463, 
                        3480, 1505, 3438, 1538, 3241, 1543, 3041, 1555, 
                        2854, 1559, 2739, 1516, 2775, 1469, 2941, 1413,
                    ],
                    svgStyle: {
                        fill: 'rgba(255,0,0,0.2)',
                        stroke: 'rgba(255, 0, 50, 0.8)',
                        strokeWidth: '2px',
                    },
                    data: { compass: 'rgba(255, 0, 50, 0.8)' },
                },
                {
                    id: 'polyline',
                    polylinePixels: [
                        2478, 1635, 2184, 1747, 1674, 1953, 1166, 1852, 
                        709, 1669, 301, 1519, 94, 1399, 34, 1356,
                    ],
                    svgStyle: {
                        stroke: 'rgba(80, 150, 50, 0.8)',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: '20px',
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
The north is always at yaw=0, if you need to change where is the north you can use `panoData.poseHeading` or `sphereCorrection.pan` option.
:::

## Configuration

#### `size`

-   type: `string`
-   default: `'120px'`
-   updatable: yes

The size of the widget, can be declared in `px`, `rem`, `vh`, etc.

#### `position`

-   type: `string`
-   default: `'top left'`
-   updatable: yes

Position of the widget, accepted positions are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.

#### `navigation`

-   type: `boolean`
-   default: `true`
-   updatable: no

Allows to click on the compass to rotate the viewer.

#### `hotspots`

-   type: `CompassHotspot[]`
-   default: `null`
-   updatable: yes

Small dots visible on the compass. Each spot consists of a position (either `yaw`/`pitch` or `textureX`/`textureY`) and an optional `color` which overrides the global `hotspotColor`.

::: tip
[Markers](./markers.md) can be displayed on the compass by defining their `compass` data, which can be `true` or a specific color.

```js{6,12}
markers: [
    {
        id: 'marker-1',
        image: 'pin.png',
        position: { yaw: '15deg', pitch: 0 },
        data: { compass: true },
    },
    {
        id: 'marker-2',
        text: 'Warning',
        position: { yaw: '-45deg', pitch: 0 },
        data: { compass: 'orange' },
    },
];
```

:::

#### `backgroundSvg`

-   type: `string`
-   default: SVG provided by the plugin
-   updatable: yes

SVG used as background of the compass (must be square).

#### `coneColor`

-   type: `string`
-   default: `'rgba(255, 255, 255, 0.2)'`
-   updatable: yes

Color of the cone of the compass.

#### `navigationColor`

-   type: `string`
-   default: `'rgba(255, 0, 0, 0.2)'`
-   updatable: yes

Color of the navigation cone.

#### `hotspotColor`

-   type: `string`
-   default: `'rgba(0, 0, 0, 0.5)'`
-   updatable: yes

Default color of hotspots.

#### `className`

-   type: `string`
-   updatable: yes

CSS class(es) added to the compass element.

## Methods

#### `setHotspots(hotspots)`

Changes the hotspots.

```js
compassPlugin.setHotspots([
    { yaw: '0deg' }, 
    { yaw: '10deg', color: 'red' },
]);
```

#### `clearHotspots()`

Removes all hotspots.
