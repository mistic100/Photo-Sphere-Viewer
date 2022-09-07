# VisibleRangePlugin

<ApiButton page="PSV.plugins.VisibleRangePlugin.html"/>

> Locks visible longitude and/or latitude.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/visible-range.js`.

[[toc]]


## Usage

The plugin allows to define `latitudeRange` and `longitudeRange` to lock to viewable zone. It affects manual moves and automatic rotation.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    [PhotoSphereViewer.VisibleRangePlugin, {
      longitudeRange: [-Math.PI / 2, Math.PI / 2],
      latitudeRange : [-Math.PI / 3, Math.PI / 3],
    }],
  ],
});

const visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);

visibleRangePlugin.setLongitudeRange(['0deg', '180deg']);
visibleRangePlugin.setLatitudeRange(null);
```

Alternatively, if `usePanoData` is set to `true`, the visible range is limited to the [cropped panorama data](../guide/adapters/equirectangular.md#cropped-panorama) provided to the viewer.

## Example

::: code-demo

```yaml
title: PSV Visible Range Demo
resources:
  - path: plugins/visible-range.js
    imports: VisibleRangePlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

let visibleRangePlugin;

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere-cropped.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,
  defaultZoomLvl: 30,

  navbar: [
    'autorotate',
    // custom buttons to clear and set the range
      {
        content  : 'Clear range',
        className: 'custom-button',
        onClick  : () => {
          visibleRangePlugin.setLongitudeRange(null);
          visibleRangePlugin.setLatitudeRange(null);
        },
      },
      {
        content  : 'Set custom range',
        className: 'custom-button',
        onClick  : () => {
          visibleRangePlugin.setLongitudeRange([-Math.PI / 2, Math.PI / 2]);
          visibleRangePlugin.setLatitudeRange([-Math.PI / 3, Math.PI / 3]);
        },
      },
      {
        content  : 'Set range from panoData',
        className: 'custom-button',
        onClick  : () => {
          visibleRangePlugin.setRangesFromPanoData();
        },
      },
    'caption',
    'fullscreen',
  ],

  plugins: [
    [PhotoSphereViewer.VisibleRangePlugin, {
      usePanoData: true,
    }],
  ],
});

visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);
```

:::


## Configuration

#### `longitudeRange`
- type: `double[]|string[]`
- default: `null`

Visible longitude as two angles.

#### `latitudeRange`
- type: `double[]|string[]`
- default: `null`

Visible latitude as two angles.

#### `usePanoData`
- type: `boolean`
- default: `false`

Use cropped panorama data as visible range immediately after load.


## Methods

#### `setLatitudeRange(range)` | `setLongitudeRange(range)`

Change or remove the ranges.

#### `setRangesFromPanoData()`

Use cropped panorama data as visible range.
