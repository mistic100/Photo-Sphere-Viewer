# GalleryPlugin

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

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/6hj7rbew/embedded/result,js,html/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Configuration

#### `items`
- type: `array`
- default: `[]`

The list of items, see bellow.

#### `visibleOnLoad`
- type: `boolean`
- default: `false`

Displays the gallery when loading the first panorama. The user will be able to toggle the gallery with the navbar button.

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
