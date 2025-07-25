# Cubemap

<Badges module="cubemap-adapter"/>

::: module
[Cube mapping](https://en.wikipedia.org/wiki/Cube_mapping) is a kind of projection where the environment is mapped to the six faces of a cube around the viewer.

This adapter is available in the [@photo-sphere-viewer/cubemap-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-adapter) package.
:::

```js:line-numbers
import {  CubemapAdapter } from '@photo-sphere-viewer/cubemap-adapter';

const viewer = new Viewer({
    adapter: CubemapAdapter,
    panorama: {
        left: 'path/to/left.jpg',
        front: 'path/to/front.jpg',
        right: 'path/to/right.jpg',
        back: 'path/to/back.jpg',
        top: 'path/to/top.jpg',
        bottom: 'path/to/bottom.jpg',
    },
});
```

## Example

::: code-demo

```yaml
title: PSV Cubemap Demo
packages:
    - name: cubemap-adapter
```

<<< ./demos-src/cubemap.js{js:line-numbers}

:::

::: tip Positions definitions
With this adapter, pixel positions require an additional `textureFace` attribute (example: `{ textureFace: 'front', textureX: 200, textureY: 800 }`).
:::

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept three types of cubemaps.

### Separate files

Each face is in a separate file, all files will be loaded before showing the panorama.

::: code-group
```js:line-numbers [array]
// order is important
panorama: [
  'path/to/left.jpg',
  'path/to/front.jpg',
  'path/to/right.jpg',
  'path/to/back.jpg',
  'path/to/top.jpg',
  'path/to/bottom.jpg',
]
```
```js:line-numbers [object]
panorama: {
  left:   'path/to/left.jpg',
  front:  'path/to/front.jpg',
  right:  'path/to/right.jpg',
  back:   'path/to/back.jpg',
  top:    'path/to/top.jpg',
  bottom: 'path/to/bottom.jpg',
}
```
```js:line-numbers [object (alt)]
panorama: {
  type: 'separate',
  paths: /* array or object */,
  // optional, set to `true` if the top and bottom faces are not correctly oriented
  flipTopBottom: false,
}
```
:::

::: tip Partial cubemap
It is possible to skip the loading of one or more faces by providing a `null` URL.
:::

### Stripe

All faces are in a single file arranged in an horizontal stripe. The default stripe order is `left, front, right, back, top, bottom` but it can be changed with the `order` field.

![](/images/cubemap-stripe.png)

```js:line-numbers
panorama: {
  type: 'stripe',
  path: 'path/to/panorama.jpg',
  // optional, set to `true` if the top and bottom faces are not correctly oriented
  flipTopBottom: false,
  // optional, change order of the faces on the stripe
  order: ['left', 'right', 'top', 'bottom', 'back', 'front'],
}
```

### Polyhedron net

All faces are in a single file arranged in an horizontal "T" unfolded cube.

![](/images/cubemap-net.png)

```js:line-numbers
panorama: {
  type: 'net',
  path: 'path/to/panorama.jpg',
}
```
