# Migration from v3

[[toc]]

> Photo Sphere Viewer 4 is a complete rewrite of the internals of the library using ES6 modules. The library is still compatible with less modern browsers and any build systems (or no build system at all) but many methods and options have been moved and renamed.

## Compatibility wrapper

For a quick migration from Photo Sphere Viewer 3 you can use the `CompatViewer` class instead of ` PhotoSphereViewer`.

```js
var viewer = new  PhotoSphereViewer.CompatViewer({
  // old options
});
```

::: warning
Please note this wrapper is not fully tested and only addresses renamed options and moved methods.

It does not cover the signature changes of event methods (`on` and `once`).
:::


## Options

### Renamed options

The viewer configuration is globally the same as version 3 but **every snake_case properties are now in camelCase**, for example `default_lat` is now named `defaultLat`.
Be sure to rename your configuration properties, the old naming is not supported at all.

#### Other renamed options :

- `usexmpdata` → `useXmpData`
- `anim_speed` → `autorotateSpeed`
- `anim_lat` → `autorotateLat`
- `time_anim` → `autorotateDelay`
- `default_fov`→ `defaultZoomLvl`
- `mousemove_hover` → `captureCursor`
- `zoom_speed` → `zoomButtonIncrement`
- `mousewheel_factor` → `mousewheelSpeed`

### Deleted options

- `transition` → splitted in `transitionDuration` and `transitionLoader`
- `tooltip` → the properties of the tooltip are now extracted from the stylesheet
- `webgl` → WebGL is now always enabled since three.js deprecated the CanvasRenderer
- `panorama_roll` → use `sphereCorrection` with the `roll` property


## Methods

### Moved methods

In version 3, all methods where on the main `PhotoSphereViewer` object. Now in version 4, many methods have been moved to sub-objects for the renderer, hud, left-panel, etc.
Bellow is the mapping of the most common methods, please check the [API documentation](https://photo-sphere-viewer.js.org/api/) for a complete list of methods.

#### General

- `render()` → `needsUpdate()` (prefered) or `renderer.render()`
- `preloadPanorama()` → `textureLoader.preloadPanorama()`
- `clearPanoramaCache()` → `textureLoader.clearPanoramaCache()`
- `getPanoramaCache()` → `textureLoader.getPanoramaCache()`

#### Markers

Moved to [Markers plugin](../plugins/plugin-markers).

#### Gyroscope and stereao view

Moved to [Gyroscope plugin](../plugins/plugin-gyroscope) and [Stereo plugin](../plugins/plugin-stereo).

#### Navbar

- `showNavbar()` → `navbar.show()`
- `hideNavbar()` → `navbar.hide()`
- `toggleNavbar()` → `navbar.toggle()`
- `getNavbarButton()` → `navbar.getButton()`
- `setCaption()` → `navbar.setCaption()`

#### Notification

- `showNotification()` → `notification.show()`
- `hideNotification()` → `notification.hide()`
- `isNotificationVisible()` → `notification.isVisible()`

#### Overlay

- `showOverlay()` → `overlay.show()`
- `hideOverlay()` → `overlay.hide()`
- `isOverlayVisible()` → `overlay.isVisible()`

#### Panel

- `showPanel()` → `panel.show()`
- `hidePabel()` → `panel.hide()`

#### Tooltip

- `showTooltip()` → `tooltip.show()`
- `hideTooltip()` → `tooltip.hide()`
- `isTooltipVisible()` → `tooltip.isVisible()`


## Events

Although the events are now triggered by the new sub-objects, you only have to use `on()` and `off()` on the main object, for the sake of simplicity.


## Markers

Markers' properties are not directly stored in the `Marker` object anymore but in its `config` attribute. You should only use `markersPlugin.updateMarker()` to update these properties.
