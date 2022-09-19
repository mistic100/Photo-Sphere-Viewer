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
  plugins: [
    PhotoSphereViewer.SettingsPlugin,
    [PhotoSphereViewer.ResolutionPlugin, {
      defaultResolution: 'SD',
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

::: code-demo

```yaml
title: PSV Resolution Demo
resources:
  - path: plugins/settings.js
    imports: SettingsPlugin
  - path: plugins/settings.css
  - path: plugins/resolution.js
    imports: ResolutionPlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,

  plugins: [
    PhotoSphereViewer.SettingsPlugin,
    [PhotoSphereViewer.ResolutionPlugin, {
      defaultResolution: 'SD',
      resolutions: [
        {
          id      : 'SD',
          label   : 'Small',
          panorama: baseUrl + 'sphere-small.jpg',
        },
        {
          id      : 'HD',
          label   : 'Normal',
          panorama: baseUrl + 'sphere.jpg',
        },
      ],
    }],
  ],
});
```

:::

## Configuration

#### `resolutions`
- type: `object[]`

List of available resolutions. Each resolution consist of an object with the properties `id`, `label` and `panorama`.
Cubemaps are supported.

#### `defaultResolution` <Badge text="4.7.2"/>
- type: `string`

The id of the default resolution to load. If not provided the first resolution will be used.

::: warning
If a `panorama` is initially configured on the viewer, this setting is ignored.
:::

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
