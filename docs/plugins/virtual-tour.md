# VirtualTourPlugin <Badge text="Styles"/>

<Badges module="virtual-tour-plugin"/>

::: module
<ApiButton page="modules/VirtualTourPlugin.html"/>
Create virtual tours by linking multiple panoramas.

This plugin is available in the [@photo-sphere-viewer/virtual-tour-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/virtual-tour-plugin) package.
:::

## Usage

```js:line-numbers
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

const viewer = new Viewer({
    plugins: [
        VirtualTourPlugin.withConfig({
            nodes: [...],
            // or
            getNode: async (id) => { ... },
            startNodeId: ...,
        }),
    ],
});
```

The plugin uses a list of nodes which contains a `panorama` with one or more `links` to other nodes and additional options.

The nodes can be provided all at once or asynchronously as the user navigates.

:::: tabs

::: tab Client mode
In client mode you must provide all the `nodes` at once, you can also change the nodes with the `setNodes` method.

```js:line-numbers
nodes: [
    { id: 'node-1', panorama: '001.jpg', links: [{ nodeId: 'node-2', position: { textureX: 1500, textureY: 780 } }] },
    { id: 'node-2', panorama: '002.jpg', links: [{ nodeId: 'node-1', position: { textureX: 3000, textureY: 780 } }] },
],
```

:::

::: tab Server mode
In server mode you provide the `getNode` function which returns a Promise to load the data of a node.

```js:line-numbers
startNodeId: 'node-1',
getNode: async (nodeId) => {
    const res = await fetch(`/api/nodes/${nodeId}`);
    return await res.json();
},
```

:::

::::

There are two different ways to define the position of the links : the manual mode and the GPS mode.

:::: tabs

::: tab Manual mode
In manual mode each link must have `yaw`/`pitch` or `textureX`/`textureY` coordinates to be placed at the correct location on the panorama. This works exactly like the placement of markers.

```js:line-numbers
const node = {
    id: 'node-1',
    panorama: '001.jpg',
    links: [
        {
            nodeId: 'node-2',
            position: { textureX: 1500, textureY: 780 },
        },
    ],
};
```

:::

::: tab GPS mode
In GPS mode each node has positionning coordinates and the links are placed automatically.

```js:line-numbers
const node = {
    id: 'node-1',
    panorama: '001.jpg',
    gps: [-80.156479, 25.666725], // optional altitude as 3rd value
    links: [
        {
            nodeId: 'node-2',
            gps: [-80.156168, 25.666623], // the position of the linked node must be provided here in server mode
        },
    ],
};
```

:::

::::

::: tip
The [Gallery plugin](./gallery.md), [Map plugin](./map.md), [Plan plugin](./plan.md) and [Compass plugin](./compass.md) plugins can be easily integrated with the virtual tour.
:::

## Example

::: code-demo

```yaml
title: PSV Virtual Tour Demo
packages:
    - name: virtual-tour-plugin
      style: true
    - name: gallery-plugin
      style: true
    - name: markers-plugin
      style: true
```

<<< ./demos-src/virtual-tour.js{js:line-numbers}

:::

## Nodes

### Definition

#### `id` (required)

-   type: `string`

Unique identifier of the node

#### `panorama` (required)

Refer to the main [config page](../guide/config.md#panorama-required).

#### `caption` / `description` / `panoData` / `sphereCorrection`

Refer to the main [config page](../guide/config.md).

#### `links` (required in client mode)

-   type: `array`

Definition of the links of this node. [See below](#links).

#### `gps` (required in GPS mode)

-   type: `number[]`

GPS coordinates of this node as an array of two or three values (`[longitude, latitude, altitude?]`).

::: warning Projection system
Only the [ESPG:4326 projection](https://epsg.io/4326) is supported.
:::

#### `name`

-   type: `string`

Short name of this node, used in links tooltips and the GalleryPlugin.

#### `showInGallery`

-   type: `boolean`
-   default: `true`

Display this node in the GalleryPlugin.

#### `thumbnail`

-   type: `string`

Thumbnail for the nodes list in the GalleryPlugin.

#### `markers`

-   type: `MarkerConfig[]`

Additional markers displayed on this node, requires the [Markers plugin](./markers.md).

The markers can be positioned with the classic `position` option (yaw + pitch) or, if `positionMode=gps`, with the `gps` option (longitude + latitude + altitude).

#### `map` (client mode only)

Configuration of the hotspot when using the [Map plugin](map.md). See [global configuration](#map-client-mode-only-1) for details.

Set to `false` to hide the node from the map (note: if `positionMode=manual` this can lead to undesired positionning of the map).

#### `plan` (client+GPS mode only)

Configuration of the hotspot when using the [Plan plugin](plan.md). The node will be automatically placed on the map but you can customize [the style of the hotspot](plan.md#hotspots-1).

Set to `false` to hide the node from the plan.

#### `data`

-   type: `any`

Any custom data you want to attach to the node.

### Links

#### `nodeId` (required)

-   type: `string`

Identifier of the target node.

#### `position` (required in manual mode)

-   type: `{ yaw, pitch } | { textureX, textureY }`

Position of the link in **spherical coordinates** (radians/degrees) or **texture coordinates** (pixels).

#### `gps` (required in GPS+server mode)

-   type: `number[]`

Define the GPS coordinates of the target node. It must be provided in order to position the link without having to load the target node.

#### `linkOffset`

-   type: `{ yaw?, pitch?, depth? }`

Offset added to the final link position, to move the marker/arrow without affecting where the viewer is rotated before going to the next node.

`depth` is only used in 3D render mode to manage overlapping arrows. Note that overlapping arrows are automatically made transparent (depending on `arrowsPosition.linkOverlapAngle`).

#### `arrowStyle`

Overrides the global style of the arrow used to display the link. See global configuration for details.

#### `data`

-   type: `any`

Any custom data you want to attach to the link.

## Configuration

#### `dataMode`

-   type: `'client' | 'server'`
-   default: `'client'`
-   updatable: no

Configure how the nodes configuration is provided.

#### `positionMode`

-   type: `'manual' | 'gps'`
-   default: `'manual'`
-   updatable: no

Configure how the links between nodes are positionned.

#### `renderMode`

-   type: `'2d' | '3d'`
-   default: `'3d'`
-   updatable: no

How the links are displayed.

#### `nodes` (client mode only)

-   type: `array`
-   updatable: no

Initial list of nodes. You can also call `setNodes` method later.

#### `getNode(nodeId)` (required in server mode)

-   type: `function(nodeId: string) => Promise<Node>`
-   updatable: no

Callback to load the configuration of a node.

#### `startNodeId` (required in server mode)

-   type: `string`
-   updatable: no

Id of the initially loaded node. If empty the first node will be displayed. You can also call `setCurrentNode` method later.

#### `preload`

-   type: `boolean | function(node: Node, link: NodeLink) => boolean`
-   default: `false`
-   updatable: no

Enable the preloading of linked nodes, can be a function that returns true or false for each link.

#### `transitionOptions`

-   type: `object | function`
-   default: `{ showLoader: true, speed: '20rpm', effect: 'fade', rotation: true }`
-   updatable: no

Configuration of the transition between nodes. Can be a callback.

::: dialog "See details" "Virtual tour transitionOptions"

`transitionOptions` can be defined as a static object or a function called before switching to a new node.

The default behaviour is to rotate the view to face the direction of the link and perform a fade-in transition to the next node.

**If defined as an object, the type is:**

```ts:line-numbers
{
    /**
     * Show the loader while loading the new panorama
     * @default true
     */
    showLoader?: boolean;
    /**
     * Enable transition between nodes
     * @default 'fade'
     */
    effect?: 'none' | 'fade' | 'black' | 'white';
    /**
     * Speed or duration of the transition between nodes
     * @default '20rpm'
     */
    speed?: string | number;
    /**
     * Enable rotation in the direction of the next node
     * @default true
     */
    rotation?: boolean;
}
```

**If defined as a function, the signature is:**

```ts:line-numbers
(toNode: Node, fromNode?: Node, fromLink?: NodeLink) => ({
    showLoader?: boolean;
    effect?: 'none' | 'fade' | 'black' | 'white';
    speed?: string | number;
    rotation?: boolean;
    /**
     * Define where to rotate the current panorama before switching to the next
     * if not defined it will use the link's position
     */
    rotateTo?: Position;
    /**
     * Define the new zoom level
     * if not defined it will keep the current zoom level
     */
    zoomTo?: number;
})
```

:::

#### `linksOnCompass`

-   type: `boolean`
-   default: `true`
-   updatable: no

If the [Compass plugin](./compass.md) is enabled, displays the links on the compass.

#### `showLinkTooltip`

-   type: `boolean`
-   default: `true`
-   updatable: no

Should a tooltip be displayed on each link. The default tooltip contains `name` + `thumbnail` + `caption`, it is customizable with the [getLinkTooltip](#getlinktooltipcontent-link-node) option.

#### `getLinkTooltip(content, link, node)`

-   type: `function(string, link, node) => string`
-   default: `null`
-   updatable: no

Callback used to replace/modify the tooltip for a link. The first parameter is the default tooltip content.

#### `map` (client mode only)

Configuration when using the [Map plugin](./map.md).

::::: dialog "See details" "Virtual tour map"

Using the Map plugin allows to show the position of each node on a map. It requires some additional configuration, especially when working with GPS coordinates.

::: warning Map image
The map image must be configured with `map.imageUrl` inside the VirtualTour plugin configuration. The `imageUrl` in the Map plugin is ignored.
:::

:::: tabs

::: tab Configure the map manually

This configuration is **required** if `positionMode=manual` but can also be used with `positionMode=gps`.

To define the position of the node on the map you have to configure its `map` property with `x` and `y`.  
You can also configure other things like `color`, `image` and `size`. Please refer to the [Hotspots section](map.md#hotspots-1) of the Map plugin.

```js:line-numbers{10}
plugins: [
    VirtualTourPlugin.withConfig({
        map: {
            imageUrl: 'map.jpg',
        },
        nodes: [
            {
                id: 'node-1',
                panorama: '001.jpg',
                map: { x: 500, y: 815, color: 'red' },
            },
        ],
    }),
],
```

:::

::: tab Configure the map with GPS

This configuration can **only** be used if `positionMode=gps`.

You have to provide additional metadata about the map for the automatic positionning to work : its `size` in pixels and its `extent` (GPS bounds).

```js:line-numbers{5-6,13}
plugins: [
    VirtualTourPlugin.withConfig({
        map: {
            imageUrl: 'map.jpg',
            size: { width: 1600, height: 1200 },
            extent: [-80.158123, 25.668050, -80.153824, 25.665308],
        },
        nodes: [
            {
                id: 'node-1',
                panorama: '001.jpg',
                gps: [-80.155487, 25.666000]
                map: { color: 'red' },
            },
        ],
    }),
],
```

Each node can still have a `map` property to override `color`, `image` and `size`.

:::

::::

:::::

#### `arrowStyle`

-   type: `object`
-   updatable: no

Style of the arrow used to display links.

Default value is:

```js:line-numbers
{
  element: // a circular button with a ripple effect
  size   : { width: 80, height: 80 },
}
```

You can also use `image` (path to an image file) and add custom CSS with `style` and `className`.

#### `arrowsPosition` (3d mode only)

-   type: `object`
-   updatable: no

Default value is:

```js:line-numbers
{
    /* (3D mode) Minimal vertical view angle */
    minPitch: 0.3,
    /* (3D mode) Maximal vertical view angle */
    maxPitch: Math.PI / 2,
    /* (3D mode) Make transparent links that are close to each other */
    linkOverlapAngle: Math.PI / 4,
    /* (2D+GPS mode) vertical offset applied to link markers, to compensate for viewer height */
    linkPitchOffset: -0.1,
}
```

## Methods

#### `setNodes(nodes, [startNodeId])` (client mode only)

Changes the nodes and display the first one (or the one designated by `startNodeId`).

#### `updateNode(node)` (client mode only)

Updates a single node. If it is the current node, the viewer will be updated accordingly. All attributes or optionnal but `id`.

```js:line-numbers
virtualTourPlugin.updateNode({
    id: 'node-1',
    caption: 'New caption',
    links: [...newLinks],
});
```

#### `setCurrentNode(nodeId, [options])`

Changes the current node. `options` allows to override the default `transitionOptions`.

#### `gotoLink(nodeId, [speed]): Promise`

Moves the view to face a specific link. Default speed is `8rpm`, set it to `0` for an immediate rotation.

```js:line-numbers
virtualTourPlugin.gotoLink('2', '4rpm')
  .then(() => /* animation complete */);
```

#### `getCurrentNode()`

Returns the current node.

#### `getLinkPosition(nodeId): Position`

Returns the position of a link in the viewer.

## Events

#### `node-changed(node, data)`

Triggered when the current node is changed.

```js:line-numbers
virtualTourPlugin.addEventListener('node-changed', ({ node, data }) => {
    console.log(`Current node is ${node.id}`);
    if (data.fromNode) {
        // other data are available
        console.log(`Previous node was ${data.fromNode.id}`);
    }
});
```

#### `enter-arrow(link, node)` | `leave-arrow(link, node)`

Triggered when the user puts the cursor hover or away an arrow.

## SCSS variables

| variable           | default                                    | description                             |
| ------------------ | ------------------------------------------ | --------------------------------------- |
| $link-button-color | rgba(255, 255, 255, 0.8)                   | Color of the default arrow image        |
| $link-button-ring  | rgb(97, 170, 242)                          | Color of the ring effect on mouse hover |
| $link-shadow       | drop-shadow(0 10px 2px rgba(0, 0, 0, 0.7)) | Shadow applied to all arrows            |
