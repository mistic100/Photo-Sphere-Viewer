# GalleryPlugin <Badge text="Styles"/>

<Badges module="gallery-plugin"/>

::: module
<ApiButton page="modules/GalleryPlugin.html"/>
Adds a gallery on the bottom of the viewer to navigate between multiple panoramas.

This plugin is available in the [@photo-sphere-viewer/gallery-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/gallery-plugin) package.
:::

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
packages:
    - name: gallery-plugin
      imports: GalleryPlugin
      style: true
```

<<< ./demos-src/gallery.js

:::

## Configuration

#### `items`

-   type: `GalleryItem[]`
-   updatable: no, use `setItems()` method

The list of items, see below.

#### `visibleOnLoad`

-   type: `boolean`
-   default: `false`
-   updatable: no

Displays the gallery when loading the first panorama. The user will be able to toggle the gallery with the navbar button.

#### `hideOnClick`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Hides the gallery when the user clicks on an item (forced to `true` on screens < 500px).

#### `thumbnailSize`

-   type: `{ width: number, height: number }`
-   default: `{ width: 200, height: 100 }`
-   updatable: yes

Size of the thumbnails.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    gallery: 'Gallery',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Items

#### `id` (required)

-   type: `number|string`

Unique identifier of the item.

#### `thumbnail` (recommended)

-   type: `string`
-   default: `''`

URL of the thumbnail.

#### `name`

-   type: `string`
-   default: `''`

Text visible over the thumbnail.

#### `panorama` (required)

Refer to the main [config page](../guide/config.md#panorama-required).

#### `options`

-   type: `PanoramaOptions`
-   default: `null`

Any option supported by the [setPanorama()](../guide/methods.md#setpanorama-panorama-options-promise) method.

## Methods

#### `setItems(items)`

Changes the list of items.

## Buttons

This plugin adds buttons to the default navbar:

-   `gallery` allows to toggle the gallery panel

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.

## SCSS variables

| variable | default | description |
| -------- | ------- | ----------- |
| $psv-gallery-breakpoint | 500px | Screen size below which the gallery is displayed full-height |
| $psv-gallery-padding | 15px | Padding of the container |
| $psv-gallery-border | 1px solid $psv-caption-text-color | Border between the gallery and the navbar |
| $psv-gallery-background | $psv-navbar-background | Background of the gallery |
| $psv-gallery-item-radius | 5px | Corner radius of gallery items |
| $psv-gallery-item-active-border | 3px solid white | Border of active gallery item |
| $psv-gallery-title-font | $psv-caption-font | Font of the gallery item title |
| $psv-gallery-title-color | $psv-caption-text-color | Color of the gallery item title |
| $psv-gallery-title-background | rgba(0, 0, 0, .6) | Background of the gallery item title |
| $psv-gallery-thumb-hover-scale | 1.2 | Scale factor of thumbnails on mouse hover |
