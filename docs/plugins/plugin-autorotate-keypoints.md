# AutorotateKeypointsPlugin

<md-button class="md-raised md-primary" href="https://photo-sphere-viewer.js.org/api/PSV.plugins.AutorotateKeypointsPlugin.html">API Documentation</md-button>

> Replaces the standard autorotate animation by a smooth transition between multiple points.

This plugin is available in the core `photo-sphere-viewer` package at `plugins/autorotate-keypoints.js`.

[[toc]]


## Usage

The plugin is configured with `keypoints` which can be either a position object (`longitude` + `latitude`) or the identifier of an existing [marker](../guide/markers).

It is also possible to configure each keypoint with a pause time and a tooltip.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    PhotoSphereViewer.AutorotateKeypointsPlugin,
  ],
});

const keypointsPlugin = viewer.getPlugin(PhotoSphereViewer.AutorotateKeypointsPlugin);

keypointsPlugin.setKeypoints([
  'existing-marker-id',
  
  { longitude: Math.PI / 2, latitude: 0 },
  
  {
    position: { longitude: Math.PI, latitude: Math.PI / 6 },
    pause   : 5000,
    tooltip : 'This is interesting',
  },
  
  {
    markerId: 'another-marker', // will use the marker tooltip if any
    pause   : 2500,
  },
]);
```

The plugin reacts to the standard `autorotateDelay` and `autorotateSpeed` options and can be started with `startAutorotate` or the button in the navbar.


## Example

The following demo randomly generates some markers and automatically pan between them.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/qsp01or4/embedded/result,js/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>


## Configuration

#### `startFromClosest`
- type: `boolean`
- default: `true`

Start from the closest keypoint instead of the first keypoint of the array.

#### `keypoints`
- type: `Keypoints[]`

Initial keypoints, does the same thing as calling `setKeypoints` just after initialisation.
