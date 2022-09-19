# Migration from v3

[[toc]]

> Photo Sphere Viewer 4 is a complete rewrite of the internals of the library using ES6 modules and a modular plugin system. The library is still compatible with less modern browsers and any build systems (or no build system at all) but many methods and options have been moved and renamed.


## Plugins

The following features have been moved into separated plugins :
 - markers : [MarkersPlugin](../plugins/plugin-markers.md)
 - gyroscope support : [GyroscopePlugin](../plugins/plugin-gyroscope.md)
 - stereo view : [StereoPlugin](../plugins/plugin-stereo.md)
 - longitude and latitude ranges : [VisibleRangePlugin](../plugins/plugin-visible-range.md)


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
- `mousemove_hover` → removed

### Deleted options

- `transition` → use `transition` and `showLoader` options of `setPanorama()`
- `tooltip` → the properties of the tooltip are now extracted from the stylesheet
- `webgl` → WebGL is now always enabled since three.js deprecated the CanvasRenderer
- `panorama_roll` → use `sphereCorrection` with the `roll` property
- `mousewheel_factor`


## Methods

### Moved methods

In version 3, all methods where on the main `PhotoSphereViewer` object. Now in version 4, many methods have been moved to sub-objects for the renderer, hud, left-panel, etc.
Bellow is the mapping of the most common methods, please check the <ApiLink page="PSV.Viewer.html"/> for a complete list of methods.

#### General

- `render()` → `needsUpdate()` (prefered) or `renderer.render()`
- `preloadPanorama()` → `textureLoader.preloadPanorama()`
- `clearPanoramaCache()` → removed, use `THREE.Cache.clear()`
- `getPanoramaCache()` → removed, use `THREE.Cache.get()`

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
- `hidePanel()` → `panel.hide()`

#### Tooltip

- `showTooltip()` → `tooltip.show()`
- `hideTooltip()` → `tooltip.hide()`
- `isTooltipVisible()` → `tooltip.isVisible()`


## Events

Although the events are now triggered by the new sub-objects, you only have to use `on()` and `off()` on the main object, for the sake of simplicity.


## Markers

Markers' properties are not directly stored in the `Marker` object anymore but in its `config` attribute. You should only use `markersPlugin.updateMarker()` to update these properties.
