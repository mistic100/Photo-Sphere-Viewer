# Cubemap tiles

> Reduce the initial loading time and used bandwidth by slicing big cubemap panoramas into many small tiles.

This adapter is available in the core `photo-sphere-viewer` package in `dist/adapters/cubemap-tiles.js`. It requires `dist/adapters/cubemap.js` to be loaded too.

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.CubemapTilesAdapter,
  panorama: {
    faceSize: 6000,
    nbTiles: 8,
    baseUrl: {
      left  : 'left_low.jpg',
      front : 'front_low.jpg',
      right : 'right_low.jpg',
      back  : 'back_low.jpg',
      top   : 'top_low.jpg',
      bottom: 'bottom_low.jpg',
    },
    tileUrl: (face, col, row) => {
      return `${face}_${col}_${row}.jpg`;
    },
  },
});
```


## Example

::: code-demo

```yaml
title: PSV Cubemap Tiles Demo
resources:
  - path: adapters/cubemap.js
  - path: adapters/cubemap-tiles.js
    imports: CubemapTilesAdapter
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  adapter: PhotoSphereViewer.CubemapTilesAdapter,
  panorama: {
    faceSize: 1500,
    nbTiles : 4,
    baseUrl      : {
      left  : baseUrl + 'cubemap/px.jpg',
      front : baseUrl + 'cubemap/nz.jpg',
      right : baseUrl + 'cubemap/nx.jpg',
      back  : baseUrl + 'cubemap/pz.jpg',
      top   : baseUrl + 'cubemap/py.jpg',
      bottom: baseUrl + 'cubemap/ny.jpg'
    },
    tileUrl : (face, col, row) => {
      const num = row * 4 + col;
      return `${baseUrl}cubemap-tiles/${face}_${('00' + num).slice(-2)}.jpg`;
    },
  },
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,
});
```

:::


## Configuration

#### `flipTopBottom`
- type: `boolean`
- default: `false`

Set to `true` if the top and bottom faces are not correctly oriented.

#### `baseBlur`
- type: `boolean`
- default: `true`

Applies a 1px blur to the base image (option `baseUrl`).

#### `showErrorTile`
- type: `boolean`
- default: `true`

Shows a warning sign on tiles that cannot be loaded.


## Panorama options

When using this adapter the `panorama` option and the `setPanorama()` method accept an object to configure the tiles.

#### `faceSize` (required)
- type: `number`

Size in pixel of a face of the cube.

#### `nbTiles` (required)
- type: `number`

Number of columns and rows on a face. Each tile must be square. Must be power of two (2, 4, 8, 16) and the maximum value is 16.

#### `tileUrl` (required)
- type: `function: (face, col, row) => string`

Function used to build the URL of a tile. `face` will be one of `'left'|'front'|'right'|'back'|'top'|'bottom'`.

#### `baseUrl` (recommended)
- type: `string[] | Record<string, string>`

URL of a low resolution complete panorama image to display while the tiles are loading. It accepts the same format as the standard [cubemap adapter](./cubemap.md#panorama-options).


## Preparing the panorama

The tiles can be easily generated using [ImageMagick](https://imagemagick.org) tool.

Let's say you have a cubemap where each face is 6.000x6.000 pixels and you want to split them into 8x8 tiles, use the following command for each face:

```
magick.exe front.jpg \
  -crop 750x750 \
  -set filename:tile "%[fx:page.x/750]_%[fx:page.y/750]" \
  -set filename:orig %t \
  %[filename:orig]_%[filename:tile].jpg
```

You can also use this [online tool](https://pinetools.com/split-image).


::: tip Performances
It is recommanded to not exceed tiles with a size of 1024x1024 pixels, thus limiting the maximum panorama size to 16.384x16.384 pixels by face (1.6 Gigapixels in total).
:::
