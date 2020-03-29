# StereoPlugin

<md-button class="md-raised md-primary" href="https://photo-sphere-viewer.js.org/api/PSV.plugins.StereoPlugin.html">API Documentation</md-button>

> Adds stereo view on mobile devices. **Requires the Gyroscope plugin.**

This plugin is available in the core `photo-sphere-viewer` package at `plugins/stereo.js`.


## Usage

Once enabled the plugin will add a new "Stereo view" button only shown when the gyroscope API is available.

It is recommended to install [NoSleep.js](http://richtr.github.io/NoSleep.js) to prevent display sleep when using this feature.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
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

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config#lang) object._
