# Migration from v4

[[toc]]

This page is here to help you to migrate from Photo Sphere Viewer 4 to Photo Sphere Viewer 5.

## Packages, ESM and ES6

The previous `photo-sphere-viewer` package has been splitted in to multiple packages. `@photo-sphere-viewer/core` contains the core functionnality (mainly the `Viewer` class) and other packages contain plugins and adapters.

`@photo-sphere-viewer` packages use modern ES6 syntax, which is supported by all major browsers. This means you will need a transpiler like Babel if you want to support oldest browsers.

Each package contains the following files :

-   **index.js** : UMD bundle
-   **index.module.js** : ESM bundle
-   **index.d.ts** : TypeScript declaration
-   **index.css** (optional) : stylesheet
-   **index.scss** (optional) : SASS source

Here is the full list of packages you might need :

-   @photo-sphere-viewer/core
-   @photo-sphere-viewer/cubemap-adapter
-   @photo-sphere-viewer/cubemap-tiles-adapter
-   @photo-sphere-viewer/cubemap-video-adapter
-   @photo-sphere-viewer/equirectangular-tiles-adapter
-   @photo-sphere-viewer/equirectangular-video-adapter
-   @photo-sphere-viewer/autorotate-plugin
-   @photo-sphere-viewer/compass-plugin
-   @photo-sphere-viewer/gallery-plugin
-   @photo-sphere-viewer/gyroscope-plugin
-   @photo-sphere-viewer/markers-plugin
-   @photo-sphere-viewer/resolution-plugin
-   @photo-sphere-viewer/settings-plugin
-   @photo-sphere-viewer/stereo-plugin
-   @photo-sphere-viewer/video-plugin
-   @photo-sphere-viewer/virtual-tour-plugin
-   @photo-sphere-viewer/visible-range-plugin

## Options

### Positions

Photo Sphere Viewer uses two coordinates systems : spherical (longitude + latitude) and pixels on the source image (x + y). Theses options have been renamed to avoid confusion with GPS system.

-   `longitude` → `yaw`
-   `latitude` → `pitch`
-   `x` → `textureX`
-   `y` → `textureY`

### Renamed options

-   `defaultLong` → `defaultYaw`
-   `defaultLat` → `defaultPitch`

### Renamed markers

-   `polygonRad` → `polygon`
-   `polygonPx` → `polygonPixels`
-   `polylineRad` → `polyline`
-   `polylinePx` → `polylinePixels`

## Automatic rotation

All the automatic rotation features have been moved to [a new plugin](../plugins/autorotate.md). The `autorotateXxx` options have been removed.

## Events

For this version, Photo Sphere Viewer dropped uEvent library to rely exclusively on the native events system.

This means you will have to update all your usage of `on()`, `off()`, and `once()` methods. Let's see that with some examples.

:::: tabs

::: tab On/Off Before

```js
viewer.on('position-updated', (e, position) => {
    console.log(position.longitude);
});

viewer.off('position-updated');
```

:::

::: tab On/Off After

```js
const handler = ({ position }) => {
    console.log(position.yaw);
};

viewer.addEventListener('position-updated', handler);

viewer.removeEventListener('position-updated', handler);
```

:::

::: tab Once Before

```js
viewer.once('ready', () => {
    console.log('viewer is ready!');
});
```

:::

::: tab Once After

```js
viewer.addEventListener('ready', () => {
  console.log('viewer is ready');
}, { once: true });
```

:::

::::

## TypeScript

### Renamed types

-   `ViewerOptions` → `ViewerConfig`
-   `ViewerProps` → `ViewerState`
-   `EquirectangularAdapterOptions` → `EquirectangularAdapterConfig`
-   `EquirectangularTilesAdapterOptions` → `EquirectangularTilesAdapterConfig`
-   `EquirectangularVideoAdapterOptions` → `EquirectangularVideoAdapterConfig`
-   `CubemapAdapterOptions` → `CubemapAdapterConfig`
-   `CubemapTilesAdapterOptions` → `CubemapTilesAdapterConfig`
-   `CubemapVideoAdapterOptions` → `CubemapVideoAdapterConfig`
-   `AutorotateKeypointsPluginOptions` → `AutorotatePluginConfig`
-   `CompassPluginOptions` → `CompassPluginConfig`
-   `GalleryPluginOptions` → `GalleryPluginConfig`
-   `GyroscopePluginOptions` → `GyroscopePluginConfig`
-   `MarkersPluginOptions` → `MarkersPluginConfig`
-   `MarkerProperties` → `MarkerConfig`
-   `ResolutionPluginOptions` → `ResolutionPluginConfig`
-   `SettingsPluginOptions` → `SettingsPluginConfig`
-   `VideoPluginOptions` → `VideoPluginConfig`
-   `AutorotateKeypoint` (video plugin) → `VideoKeypoint`
-   `VisibleRangePluginOptions` → `VisibleRangePluginConfig`

### Deleted types

-   `TooltipRenderer`
-   `CubemapArray`
