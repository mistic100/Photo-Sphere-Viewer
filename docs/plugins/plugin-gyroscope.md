# GyroscopePlugin

<ApiButton page="PSV.plugins.GyroscopePlugin.html"/>

> Adds gyroscope controls on mobile devices.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/gyroscope.js`.


## Usage

Once enabled the plugin will add a new "Gyroscope" button only shown when the gyroscope API is available.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    PhotoSphereViewer.GyroscopePlugin,
  ],
});
```

::: warning
There are known inconsistencies of orientation data accross devices. If the panorama does not display in the expected orientation, this plugin is not faulty.
:::

## Configuration

#### `touchmove`
- type: `boolean`
- default: `true`

Allows to pan horizontally the camera when the gyroscope is enabled (requires global `mousemove=true`).

#### `absolutePosition`
- type: `boolean`
- default: `false`

By default the camera will keep its current horizontal position when the gyroscope is enabled. Turn this option `true` to enable absolute positionning and only use the device orientation.

#### `lang`
- type: `object`
- default:
```js
lang: {
    gyroscope : 'Gyroscope',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._
