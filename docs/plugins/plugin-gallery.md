# GalleryPlugin <Badge text="4.7.0"/>

<ApiButton page="PSV.plugins.GalleryPlugin.html"/>

> Adds a gallery on the bottom of the viewer to navigate between multiple panoramas.

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/gallery.js` and `dist/plugins/gallery.css`.

[[toc]]

::: warning
GalleryPlugin is not compatible with ResolutionPlugin.
:::


## Usage

The plugin has a list of `items`, each configuring the corresponding panorama, a name and a thumbnail.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    [PhotoSphereViewer.GalleryPlugin, {
      items: [
        {
          id: 'pano-1',
          name: 'Panorama 1',
          panorama: 'path/to/pano-1.jpg',
          thumbnail: 'path/to/pano-1-thumb.jpg',
        },
        {
          id: 'pano-2',
          name: 'Panorama 2',
          panorama: 'path/to/pano-2.jpg',
          thumbnail: 'path/to/pano-2-thumb.jpg',
        },
      ],
    }],
  ],
});
```


## Example

::: code-demo

```yaml
title: PSV Gallery Demo
resources:
  - path: plugins/gallery.js
    imports: GalleryPlugin
  - path: plugins/gallery.css
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,

  plugins: [
    [PhotoSphereViewer.GalleryPlugin, {
      visibleOnLoad: true,
    }],
  ],
});

const gallery = viewer.getPlugin(PhotoSphereViewer.GalleryPlugin);

gallery.setItems([
  {
    id       : 'sphere',
    panorama : baseUrl + 'sphere.jpg',
    thumbnail: baseUrl + 'sphere-small.jpg',
    options  : {
      caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    },
  },
  {
    id      : 'sphere-test',
    panorama: baseUrl + 'sphere-test.jpg',
    name    : 'Test sphere',
  },
  {
    id       : 'key-biscayne',
    panorama : baseUrl + 'tour/key-biscayne-1.jpg',
    thumbnail: baseUrl + 'tour/key-biscayne-1-thumb.jpg',
    name     : 'Key Biscayne',
    options  : {
      caption: 'Cape Florida Light, Key Biscayne <b>&copy; Pixexid</b>',
    },
  },
]);
```

:::


## Configuration

#### `items`
- type: `array`
- default: `[]`

The list of items, see bellow.

#### `visibleOnLoad`
- type: `boolean`
- default: `false`

Displays the gallery when loading the first panorama. The user will be able to toggle the gallery with the navbar button.

#### `hideOnClick` <Badge text="4.7.3"/>
- type: `boolean`
- default: `true

Hides the gallery when the user clicks on an item.

#### `thumbnailSize` <Badge text="4.7.1"/>
- type: `{ width: number, height: number }`
- default: `{ width: 200, height: 100 }`

Size of the thumbnails.

### Items

#### `id` (required)
- type: `number|string`

Unique identifier of the item.

#### `thumbnail` (recommended)
- type: `string`
- default: `''`

URL of the thumbnail.

#### `name`
- type: `string`
- default: `''`

Text visible over the thumbnail.

#### `panorama` (required)

Refer to the main [config page](../guide/config.md#panorama-required).

#### `options`
- type: `PanoramaOptions`
- default: `null`

Any option supported by the [setPanorama()](../guide/methods.md#setpanorama-panorama-options-promise) method.


## Methods

#### `setItems(items)`

Changes the list of items.


## Buttons

This plugin adds buttons to the default navbar:
- `gallery` allows to toggle the gallery panel

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
