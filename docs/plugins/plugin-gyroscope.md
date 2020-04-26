# GyroscopePlugin

<ApiButton href="https://photo-sphere-viewer.js.org/api/PSV.plugins.GyroscopePlugin.html"/>

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


## Configuration

#### `lang`
- type: `object`
- default:
```js
lang: {
    gyroscope : 'Gyroscope',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._
