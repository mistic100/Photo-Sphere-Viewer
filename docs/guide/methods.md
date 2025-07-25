# Methods

## Presentation

Many methods are available to control the viewer from your application. The full list of methods is available in the [API Reference](/api/classes/Core.Viewer.html){target=_blank}.

::: tip Modular architecture
Photo Sphere Viewer is internally splitted in multiple components, this has an impact on where are located each method. For example, the methods to control the navbar are in the `navbar` object.

Read more about [reusable components](./components/).
:::

It is good practice to wait for the `ready` event before calling any method.

```js:line-numbers
viewer.addEventListener('ready', () => {
    viewer.rotate({
        textureX: 1500,
        textureY: 1000,
    });
}, { once: true });
```

## Main methods

This section describes the most useful methods available.

::: tip Positions definitions
Some methods takes positionnal arguments, this is either on combination `yaw` and `pitch` (radians or degrees) or `textureX` and `textureY` properties, corresponding to the pixel position on the source panorama file.

When using a [cubemap](./adapters/cubemap.md) you will also have to provide `textureFace`.
:::

### `animate(options): Animation`

- options: [`AnimateOptions`](/api/types/Core.AnimateOptions.html){target=_blank}

Rotate and zoom the view with a smooth animation. You can change the position (`yaw`, `pitch` or `textureX`, `textureY`) and the zoom level (`zoom`).

The `speed` option is either a duration in milliseconds or a string containing the speed in revolutions per minute (`2rpm`).

The method returns a `Animation` object which is a standard Promise with an additional `cancel` method.

```js:line-numbers
viewer.animate({
    yaw: Math.PI / 2,
    pitch: '20deg',
    zoom: 50,
    speed: '2rpm',
})
    .then(() => /* animation complete */);
```

### `destroy()`

Remove the viewer from the page and free the memory used by Three.js.

### `getPlugin(pluginId): PluginInstance`

Return the instance of plugin, more details on [the dedicated page](../plugins/).

### `getPosition(): Position`

Return the current position of the view.

### `getZoomLevel(): number`

Return the current zoom level between 0 and 100.

### `rotate(position)`

Immediately rotate the view without animation.

```js:line-numbers
// you can also use yaw and pitch
viewer.rotate({
    textureX: 1500,
    textureY: 600,
});
```

### `setOption(option, value)`

Update an option of the viewer. Some options cannot be changed : `panorama`, `panoData`, `container`, `adapter` and `plugins`.

```js:line-numbers
viewer.setOption('fisheye', true);
```

### `setOptions(options)`

Update multiple options at once.

```js:line-numbers
viewer.setOptions({
    fisheye: true,
});
```

### `setPanorama(panorama[, options]): Promise`

- options: [`PanoramaOptions`](/api/types/Core.PanoramaOptions.html){target=_blank}

Change the panorama image with an optional transition animation (enabled by default).

The method returns a Promise resolved when the new panorama has finished loading.

```js:line-numbers
viewer.setPanorama('image.jpg')
  .then(() => /* update complete */);

viewer.setPanorama('image.jpg', { transition: false });

viewer.setPanorama('image.jpg', {
    caption: 'The new caption',
    position: { yaw: 0, pitch: 0 },
    transition: {
        rotation: false,
        effect: 'black',
    },
    // more options in the API doc
});
```

### `zoom(level)` | `zoomIn([step = 1])` | `zoomOut([step = 1])`

Change the zoom level without animation.
