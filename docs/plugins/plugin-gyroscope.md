# GyroscopePlugin

<md-button class="md-raised md-primary" href="https://photo-sphere-viewer.js.org/api/PSV.plugins.GyroscopePlugin.html">API Documentation</md-button>

> Adds gyroscope controls on mobile devices.

This plugin is available in the core `photo-sphere-viewer` package at `plugins/gyroscope.js`.


## Usage

Once enabled the plugin will add a new "Gyroscope" button only shown when the gyroscope API is available.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    PhotoSphereViewer.GyroscopePlugin,
  ],
});
```


## Demo

TODO
