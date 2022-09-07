# AutorotateKeypointsPlugin

<ApiButton page="PSV.plugins.AutorotateKeypointsPlugin.html"/>

> Replaces the standard autorotate animation by a smooth transition between multiple points.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/autorotate-keypoints.js`.

[[toc]]


## Usage

The plugin is configured with `keypoints` which can be either a position object (either `x`/`y` or `longitude`/`latitude`) or the identifier of an existing [marker](./plugin-markers.md).

It is also possible to configure each keypoint with a pause time and a tooltip.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    [PhotoSphereViewer.AutorotateKeypointsPlugin, {
      keypoints: [
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
       ],
    }],
  ],
});
```

The plugin reacts to the standard `autorotateDelay` and `autorotateSpeed` options and can be started with `startAutorotate` or the button in the navbar.


## Example

The following demo randomly generates some markers and automatically pan between them.

::: code-demo

```yaml
title: PSV Autorotate Keypoints Demo
resources:
  - path: plugins/autorotate-keypoints.js
    imports: AutorotateKeypointsPlugin
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
  autorotateDelay: 1000,
  autorotateSpeed: '3rpm',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,

  navbar: [
    'autorotate',
    'zoom',
    {
      // a custom button to change keypoints
      title: 'Change points',
      content: '🔄',
      onClick: randomPoints,
    },
    'caption',
    'fullscreen',
  ],

  plugins: [
    PhotoSphereViewer.AutorotateKeypointsPlugin,
    PhotoSphereViewer.MarkersPlugin,
  ],
});

const autorotatePlugin = viewer.getPlugin(PhotoSphereViewer.AutorotateKeypointsPlugin);
const markersPlugin = viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

viewer.once('ready', randomPoints);

/**
 * Randomize the keypoints and add corresponding markers
 */
function randomPoints() {
  const points = [];

  for (let i = 0, l = Math.random() * 2 + 4; i < l; i++) {
    points.push({
      position: {
        longitude: (i + Math.random()) * 2 * Math.PI / l,
        latitude: Math.random() * Math.PI / 3 - Math.PI / 6,
      },
      pause: i % 3 === 0 ? 2000 : 0,
      tooltip: 'Test tooltip',
    });
  }

  markersPlugin.setMarkers(points.map((pt, i) => {
    return {
      id: '#' + i,
      latitude: pt.position.latitude,
      longitude: pt.position.longitude,
      image: baseUrl + 'pictos/pin-red.png',
      width: 32,
      height: 32,
      anchor: 'bottom center',
    };
  }));

  autorotatePlugin.setKeypoints(points);
}
```

:::


## Configuration

#### `startFromClosest`
- type: `boolean`
- default: `true`

Start from the closest keypoint instead of the first keypoint of the array.

#### `keypoints`
- type: `Keypoints[]`

Initial keypoints, does the same thing as calling `setKeypoints` just after initialisation.


## Methods

#### `setKeypoints(keypoints)`

Changes or remove the keypoints.
