# StereoPlugin

<ApiButton page="PSV.plugins.StereoPlugin.html"/>

> Adds stereo view on mobile devices. **Requires the [Gyroscope plugin](./plugin-gyroscope.md).**

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/stereo.js`.


## Usage

Once enabled the plugin will add a new "Stereo view" button only shown when the gyroscope API is available.

The plugin uses the WakeLock API to prevent the display from dimming or shuting down. As of August 2020 this API is only available on Chrome and Edge, for others browsers you can install [NoSleep.js](http://richtr.github.io/NoSleep.js) (no further configuration is needed, just make it available in your page).

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    PhotoSphereViewer.GyroscopePlugin,
    PhotoSphereViewer.StereoPlugin,
  ],
});
```


## Configuration

#### `lang`
- type: `object`
- default:
```js
lang: {
    stereo : 'Stereo view',
    stereoNotification : 'Click anywhere to exit stereo view.',
    pleaseRotate : ['Please rotate your device', '(or tap to continue)'],
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._
