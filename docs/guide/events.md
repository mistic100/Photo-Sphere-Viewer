# Events

## Presentation

Photo Sphere Viewer objects (`Viewer` and plugins) all implement the [EventTarget API](https://developer.mozilla.org/docs/Web/API/EventTarget) to dispatch events. It also implements a custom TypeScript interface which allows events to be strongly typed.

Event listeners are called with a single `Event` subclass which has additional properties. Notably :

-   `type` is the name of the event
-   `target` is a reference to the viewer (or plugin) itself

```js:line-numbers
import { events } from '@photo-sphere-viewer/core';

// use a constant (prefered)
viewer.addEventListener(events.PositionUpdateEvent.type, (e) => {
    // e.type === 'position-updated'
    // e.target === viewer
    // e.position
});

// or a magic value
viewer.addEventListener('position-updated', ({ position }) => ());
```

The full list of events is available in the [API Reference](/api/modules/Core.events.html){target=_blank}.

## Main events

This section describes the most useful events available.

### `click(data)` | `dblclick(data)`

- data: [`ClickData`](/api/types/Core.ClickData.html){target=_blank}

Triggered when the user clicks on the viewer (excluding the navbar and the side panel), it contains many information about where the user clicked including a [marker](../plugins/markers.md) if the `clickEventOnMarker` option is enabled.

```js:line-numbers
viewer.addEventListener('click', ({ data }) => {
    console.log(`${data.rightclick ? 'right ' : ''}clicked at yaw: ${data.yaw} pitch: ${data.pitch}`);
});
```

A `click` event is always fired before a `dblclick`.

### `position-updated(position)`

Triggered when the view yaw and/or pitch change.

```js:line-numbers
viewer.addEventListener('position-updated', ({ position }) => {
    console.log(`new position is yaw: ${position.yaw} pitch: ${position.pitch}`);
});
```

### `ready`

Triggered once when the panorama image has been loaded and the viewer is ready to perform the first render.

```js:line-numbers
viewer.addEventListener('ready', () => {
    console.log(`viewer is ready`);
}, { once: true });
```

### `zoom-updated(zoomLevel)`

Triggered when the zoom level changes.

```js:line-numbers
viewer.addEventListener('zoom-updated', ({ zoomLevel }) => {
    console.log(`new zoom level is ${zoomLevel}`);
});
```
