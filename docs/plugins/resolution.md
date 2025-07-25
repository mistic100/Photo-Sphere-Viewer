# ResolutionPlugin

<Badges module="resolution-plugin"/>

::: module
<ApiButton page="modules/ResolutionPlugin.html"/>
Adds a button to choose between multiple resolutions of the panorama. **Requires the [Settings plugin](./settings.md).**

This plugin is available in the [@photo-sphere-viewer/resolution-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/resolution-plugin) package.
:::

::: warning
ResolutionPlugin is not compatible with GalleryPlugin.
:::

## Usage

Once enabled the plugin will add a new setting the user can use to change the resolution of the panorama.

```js:line-numbers
import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';

const viewer = new Viewer({
    plugins: [
        SettingsPlugin,
        ResolutionPlugin.withConfig({
            defaultResolution: 'SD',
            resolutions: [
                {
                    id: 'SD',
                    label: 'Small',
                    panorama: 'sphere_small.jpg',
                },
                {
                    id: 'HD',
                    label: 'Normal',
                    panorama: 'sphere.jpg',
                },
            ],
        }),
    ],
});
```

## Example

The following example provides two resolutions for the panorama, "small" is loaded by default.

::: code-demo

```yaml
title: PSV Resolution Demo
packages:
    - name: settings-plugin
      style: true
    - name: resolution-plugin
```

<<< ./demos-src/resolution.js{js:line-numbers}

:::

## Configuration

#### `resolutions`

-   type: `object[]`
-   updatable: no, use `setResolutions()` method

List of available resolutions. Each resolution consists of an object with the properties `id`, `label`, `panorama` and `panoData` (optional).

#### `defaultResolution`

-   type: `string`
-   updatable: no

The id of the default resolution to load. If not provided the first resolution will be used.

::: warning
If a `panorama` is initially configured on the viewer, this setting is ignored.
:::

#### `showBadge`

-   type: `boolean`
-   default: `true`
-   updatable: no

Show the resolution id as a badge on the settings button.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    resolution: 'Quality',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

## Methods

#### `setResolutions(resolutions, defaultResolution?)`

Changes the available resolutions.

## Events

#### `resolution-changed(id)`

Triggered when the resolution is changed.

```js:line-numbers
resolutionPlugin.addEventListener('resolution-changed', ({ resolutionId }) => {
    console.log(`Current resolution: ${resolutionId}`);
});
```
