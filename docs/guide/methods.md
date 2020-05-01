# Methods

[[toc]]

## Presentation

Many methods are available to control the viewer from your application. The full list of methods is available on the <ApiLink page="PSV.Viewer.html"/>.

::: tip Modular architecture
Photo Sphere Viewer is internally splitted in multiple components, this has an impact on where are located each method. For example, the methods to control the navbar are in the `navbar` object.

The important components are :
  - `navbar`
  - `hud`
  - `panel`
:::

It is good practice to wait for the `ready` event before calling any method.

```js
viewer.once('ready', () => {
  viewer.rotate({
    x: 1500,
    y: 1000
  });
});
```

## Main methods

This section describes the most useful methods available, remember to check the <ApiLink page="PSV.Viewer.html"/> for a full list.

#### `destroy()`

Removes the viewer from the page and frees memory used by three.js.

#### `animate(options): Animation`

Rotates and zooms the view with a smooth animation. You can change the position (`longitude`, `latitude` or `x`, `y`) and the zoom level (`zoom`). The `speed` option is either a duration in milliseconds or string containing the speed in revolutions per minute (`2rpm`) or degrees per second (`10dps`). It returns a `PSV.Animation` which is a standard Promise with an additional `cancel` method.

```js
viewer.animate({
  longitude: Math.PI / 2,
  latitude: '20deg',
  zoom: 50,
  speed: '-2rpm',
})
  .then(() => /* animation complete */);
```

#### `getPosition(): Position`

Returns the current position of the view.

#### `getZoomLevel(): number`

Returns the current zoom level between 0 and 100.

#### `rotate(position)`

Immediately rotates the view without animation.

```js
// you can also use longitude and latitude
viewer.rotate({
  x: 1500,
  y: 600,
});
```

#### `setOption(option, value)` | `setOptions(options)`

Updates one or more options of the viewer. Some options cannot be changed : `panorama`, `panoData`, `container` and `plugins`.

```js
viewer.setOption('fisheye', true);
```

#### `setPanorama(panorama, options): Promise`

Changes the panorama image with an optional transition animation (enabled by default). You can also set the new `sphereCorrection` and `panoData` if needed.

```js
viewer.setPanorama('image.jpg')
  .then(() => /* update complete */);
```

#### `zoom(level)` | `zoomIn()` | `zoomOut()`

Changes the zoom level without animation.
