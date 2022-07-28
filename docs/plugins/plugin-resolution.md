# ResolutionPlugin

<ApiButton page="PSV.plugins.ResolutionPlugin.html"/>

> Adds a button to choose between multiple resolutions of the panorama. **Requires the [Settings plugin](./plugin-settings.md).**

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/resolution.js`.

[[toc]]

::: warning
ResolutionPlugin is not compatible with GalleryPlugin.
:::


## Usage

Once enabled the plugin will add a new setting the user can use to change the resolution of the panorama.

```js
const viewer = new PhotoSphereViewer.Viewer({
  panorama: 'sphere_small.jpg', // must match with one of the resolutions
  plugins: [
    PhotoSphereViewer.SettingsPlugin,
    [PhotoSphereViewer.ResolutionPlugin, {
      resolutions: [
        {
          id      : 'SD',
          label   : 'Small',
          panorama: 'sphere_small.jpg',
        },
        {
          id      : 'HD',
          label   : 'Normal',
          panorama: 'sphere.jpg',
        },
      ],
    }],
  ],
});
```


## Example

The following example provides two resolutions for the panorama, "small" is loaded by default.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/1cmn20zb/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Configuration

#### `resolutions`
- type: `object[]`

List of available resolutions. Each resolution consist of an object with the properties `id`, `label` and `panorama`.
Cubemaps are supported.

#### `showBadge`
- type: `boolean`
- default: `true`

Show the resolution id as a badge on the settings button.

#### `lang`
- type: `object`
- default:
```js
lang: {
    resolution : 'Quality',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._


## Events

#### `resolution-changed(id)`

Triggered when the resolution is changed.

```js
resolutionPlugin.on('resolution-changed', (e, id) => {
  console.log(`Current resolution: ${id}`);
});
```
