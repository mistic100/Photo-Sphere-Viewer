# VirtualTourPlugin

<ApiButton page="PSV.plugins.VirtualTourPlugin.html"/>

> Create virtual tours by linking multiple panoramas.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/virtual-tour.js` and `dist/plugins/virtual-tour.css`.

[[toc]]

## Usage

The plugin allows to define `nodes` which contains a `panorama` and one or more `links` to other nodes. The links are represented with a 3D arrow (default) or using the [Markers plugin](./plugin-markers.md).

There are two different ways to define the position of the links : the manual mode and the GPS mode.

:::: tabs

::: tab Manual mode
In manual mode each link must have `longitude`/`latitude` or `x`/`y` coordinates to be placed at the correct location on the panorama. This works exactly like the placement of markers.

```js
const node = {
  id: 'node-1',
  panorama: '001.jpg',
  links: [{
    nodeId: 'node-2',
    x: 1500,
    y: 780,
  }],
};
```
:::

::: tab GPS mode
In GPS mode each node has positionning coordinates and the links are placed automatically.

```js
const node = {
  id: 'node-1',
  panorama: '001.jpg',
  position: [-80.156479, 25.666725], // optional altitude as 3rd value
  links: [{
    nodeId: 'node-2',
    position: [-80.156168, 25.666623], // the position of the linked node must be provided here in server mode
  }],
};
```
:::

::::


The nodes can be provided all at once or asynchronously as the user navigates.

:::: tabs

::: tab Client mode
In client mode you must provide all `nodes` all at once, you can also change all the nodes with the `setNodes` method.

```js
const nodes = [
  { id: 'node-1', panorama: '001.jpg', links: [{ nodeId: 'node-2', x: 1500, y: 780}] },
  { id: 'node-2', panorama: '002.jpg', links: [{ nodeId: 'node-1', x: 3000, y: 780}] },
];
```
:::

::: tab Server mode
In server mode you provide the `getNode callbacks function which returns a Promise to load the data of a node.

```js
getNode = async (nodeId) => {
  const res = await fetch(`/api/nodes/${nodeId}`);
  return await res.json();
};
```
:::

::::

::: tip
If the [Gallery plugin](./plugin-gallery.md) is loaded, it will be configured with the list of nodes (client mode only).
:::


## Example

::: code-demo

```yaml
title: PSV Virtual Tour Demo
resources:
  - path: plugins/virtual-tour.js
    imports: VirtualTourPlugin
  - path: plugins/virtual-tour.css
  - path: plugins/gallery.js
    imports: GalleryPlugin
  - path: plugins/gallery.css
  - path: plugins/markers.js
    imports: MarkersPlugin
  - path: plugins/markers.css
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  caption: 'Cape Florida Light, Key Biscayne <b>&copy; Pixexid</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,
  defaultLong: '130deg',
  navbar: 'zoom move download gallery caption fullscreen',

  plugins: [
    PhotoSphereViewer.MarkersPlugin,
    [PhotoSphereViewer.GalleryPlugin, {
      thumbnailSize: { width: 100, height: 100 },
    }],
    [PhotoSphereViewer.VirtualTourPlugin, {
      positionMode: PhotoSphereViewer.VirtualTourPlugin.MODE_GPS,
      renderMode  : PhotoSphereViewer.VirtualTourPlugin.MODE_3D,
    }],
  ],
});

const virtualTour = viewer.getPlugin(PhotoSphereViewer.VirtualTourPlugin);

virtualTour.setNodes([
  {
    id      : '1',
    panorama: baseUrl + 'tour/key-biscayne-1.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-1-thumb.jpg',
    name    : 'One',
    links   : [
      { nodeId: '2' },
    ],
    markers: [
      {
        id: 'marker-1',
        image: baseUrl + 'pictos/pin-red.png',
        tooltip: 'Cape Florida Light, Key Biscayne',
        width    : 32,
        height   : 32,
        anchor   : 'bottom center',
        longitude: '105deg',
        latitude: '35deg',
      }
    ],
    position: [-80.156479, 25.666725, 3],
    panoData: { poseHeading: 327 },
  },
  {
    id      : '2',
    panorama: baseUrl + 'tour/key-biscayne-2.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-2-thumb.jpg',
    name    : 'Two',
    links   : [
      { nodeId: '3' },
      { nodeId: '1' },
    ],
    position: [-80.156168, 25.666623, 3],
    panoData: { poseHeading: 318 },
  },
  {
    id      : '3',
    panorama: baseUrl + 'tour/key-biscayne-3.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-3-thumb.jpg',
    name    : 'Three',
    links   : [
      { nodeId: '4' },
      { nodeId: '2' },
      { nodeId: '5' },
    ],
    position: [-80.155932, 25.666498, 5],
    panoData: { poseHeading: 328 },
  },
  {
    id      : '4',
    panorama: baseUrl + 'tour/key-biscayne-4.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-4-thumb.jpg',
    name    : 'Four',
    links   : [
      { nodeId: '3' },
      { nodeId: '5' },
    ],
    position: [-80.156089, 25.666357, 3],
    panoData: { poseHeading: 78 },
  },
  {
    id      : '5',
    panorama: baseUrl + 'tour/key-biscayne-5.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-5-thumb.jpg',
    name    : 'Five',
    links   : [
      { nodeId: '6' },
      { nodeId: '3' },
      { nodeId: '4' },
    ],
    position: [-80.156292, 25.666446, 2],
    panoData: { poseHeading: 190 },
  },
  {
    id      : '6',
    panorama: baseUrl + 'tour/key-biscayne-6.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-6-thumb.jpg',
    name    : 'Six',
    links   : [
      { nodeId: '5' },
      { nodeId: '7' },
    ],
    position: [-80.156465, 25.666496, 2],
    panoData: { poseHeading: 328 },
  },
  {
    id       : '7',
    panorama : baseUrl + 'tour/key-biscayne-7.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-7-thumb.jpg',
    name     : 'Seven',
    links    : [
      { nodeId: '6' },
    ],
    position : [-80.157070, 25.666500, 3],
    panoData : { poseHeading: 250 },
  },
], '2');
```

:::


## Nodes options

#### `id` (required)
- type: `string`

Unique identifier of the node

#### `panorama` (required)

Refer to the main [config page](../guide/config.md#panorama-required).

#### `links` (required in client mode)
- type: `array`

Definition of the links of this node. See bellow.

#### `position` (required in GPS mode)
- type: `number[]`

GPS coordinates of this node as an array of two or three values (`[longitude, latitude, altitude]`).

::: warning Projection system
Only the [ESPG:4326 projection](https://epsg.io/4326) is supported.
:::

#### `name`
- type: `string`

Short name of this node, used in links tooltips and the gallery.

#### `caption`

Replace the global caption. Refer to the main [config page](../guide/config.md#caption).

#### `description`

Replace the global description. Refer to the main [config page](../guide/config.md#description).

#### `thumbnail`
- type: `string`

Thumbnail for the nodes list in the gallery.

#### `markers`
- type: `array`

Additional markers displayed on this node, requires the [Markers plugin](./plugin-markers.md).

#### `panoData`

Refer to the main [config page](../guide/config.md#panodata).

#### `sphereCorrection`

Refer to the main [config page](../guide/config.md#spherecorrection).


## Links options

#### `nodeId` (required)
- type: `string`

Identifier of the target node.

#### `x` & `y` or `latitude` & `longitude` (required in manual mode)
- type: `integer` or `double`

Position of the link in **texture coordinates** (pixels) or **spherical coordinates** (radians).

#### `position` (required in GPS+server mode)
- type: `number[]`

Overrides the GPS coordinates of the target node.

#### `name`
- type: `string`

Overrides the tooltip content (defaults to the node's `name` property).

#### `arrowStyle` (3d mode only)
- type: `object`

Overrides the global style of the arrow used to display the link. See global configuration for details.

#### `markerStyle` (markers mode only)
- type: `object`

Overrides the global style of the marker used to display the link. See global configuration for details.


## Configuration

#### `dataMode`
- type: `'client' | 'server'`
- default: `'client'`

Configure how the nodes configuration is provided.

#### `positionMode`
- type: `'manual' | 'gps'`
- default: `'manual'`

Configure how the links between nodes are positionned.

#### `renderMode`
- type: `'markers' | '3d'`
- default: `'3d'`

How the links are displayed, `markers` requires the [Markers plugin](./plugin-markers.md).

#### `nodes` (client mode only)
- type: `array`

Initial list of nodes. You can also call `setNodes` method later.

#### `getNode(nodeId)` (required in server mode)
- type: `function(nodeId: string) => Promise<Node>`

Callback to load the configuration of a node.

#### `startNodeId`
- type: `string`

Id of the initially loaded node. If empty the first node will be displayed. You can also call `setCurrentNode` method later.

#### `preload`
- type: `boolean | function(node: Node, link: NodeLink) => boolean`
- default: `false`

Enable the preloading of linked nodes, can be a function that returns true or false for each link.

#### `rotateSpeed`
- type: `boolean | string | number`
- default: `20rpm`

When a link is clicked, adds a panorama rotation to face it before actually changing the node. If `false` the viewer won't rotate at all and keep the current orientation.

#### `transition`
- type: `boolean | number`
- default: `1500`

Duration of the transition between nodes.

#### `linksOnCompass`
- type: `boolean`
- default: `true` if markers render mode

If the [Compass plugin](plugin-compass.md) is enabled, displays the links on the compass.

#### `markerStyle` (markers mode only)
- type: `object`

Style of the marker used to display links.

Default value is:
```js
{
  html     : arrowIconSvg, // an SVG provided by the plugin
  width    : 80,
  height   : 80,
  scale    : [0.5, 2],
  anchor   : 'top center',
  className: 'psv-virtual-tour__marker',
  style : {
    color: 'rgba(0, 208, 255, 0.8)',
  },
}
```

::: tip
If you want to use another marker type like `image` you must define `html: null` to remove the default value.
```js
markerStyle: {
  html : null,
  image: 'path/to/image.png',
}
```
:::

#### `arrowStyle` (3d mode only)
- type: `object`

Style of the arrow used to display links.

Default value is:
```js
{
  color       : 0xaaaaaa,
  hoverColor  : 0xaa5500,
  outlineColor: 0x000000,
  scale       : [0.5, 2],
}
```

(The 3D model cannot be modified).

#### `markerLatOffset` (markers+GPS mode only)
- type: `number`
- default: `-0.1`

Vertical offset in radians applied to the markers to compensate for the viewer position above ground.

#### `arrowPosition` (3d mode only)
- type: `'top' | 'bottom'`
- default: `'bottom'`

Vertical position of the arrows.


## Methods

#### `setNodes(nodes, [startNodeId])` (client mode only)

Changes the nodes and display the first one (or the one designated by `startNodeId`).

#### `setCurrentNode(nodeId)`

Changes the current node.


## Events

#### `node-changed(nodeId, data)`

Triggered when the current node is changed.

```js
virtualTourPlugin.on('node-changed', (e, nodeId, data) => {
  console.log(`Current node is ${nodeId}`);
  if (data.fromNode) { // other data are available
    console.log(`Previous node was ${data.fromNode.id}`);
  }
});
```


## Buttons

This plugin adds buttons to the default navbar:
- `nodesList` allows to open a list of all nodes on the left panel (client mode only)

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.

::: warning Deprecated
This button will be removed and replaced by the [Gallery plugin](./plugin-gallery.md).
:::
