# Events

[[toc]]

## Presentation

Photo Sphere Viewer uses [uEvent API](https://github.com/mistic100/uEvent#uevent). The full list of events is available on the [API Documentation](https://photo-sphere-viewer.js.org/api/PSV.html#.event:autorotate).

Event listeners take an `Event` object as first parameter, this object is generally not used. Other parameters are available after this event object.

## Main events

This section describes the most useful events available, remember to check the [API Documentation](https://photo-sphere-viewer.js.org/api/PSV.html#.event:autorotate) for a full list.

#### `click(data)` | `dblclick(data)`

Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel), it contains many information about where the user clicked including a [marker](../plugins/plugin-markers.md) if the `clickEventOnMarker` option is enabled.

```js
viewer.on('click', (e, data) => {
  console.log(`${data.rightclick ? 'right clicked' : 'clicked'} at longitude: ${data.longitude} latitude: ${data.latitude}`);
});
```

The simple `click` event is always fired before  a `dblclick`.

#### `position-updated(position)`

Triggered when the view longitude and/or latitude changes.

```js
viewer.on('position-updated', (e, position) => {
  console.log(`new position is longitude: ${position.longitude} latitude: ${position.latitude}`);
});
```

#### `ready`

Triggered when the panorama image has been loaded and the viewer is ready to perform the first render.

#### `zoom-updated(level)`

Triggered when the zoom level changes.
