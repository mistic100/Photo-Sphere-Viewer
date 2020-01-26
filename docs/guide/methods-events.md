# Methods and events

[[toc]]

## Methods

Many methods are available to control the viewer from your application. The full list of methods is available on the [API Documentation](https://photo-sphere-viewer.js.org/api/PSV.Viewer.html).

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

## Events

Photo Sphere Viewer uses [uEvent API](https://github.com/mistic100/uEvent#uevent). The full list of events is available on the [API Documentation](https://photo-sphere-viewer.js.org/api/PSV.html#.event:autorotate).

Event listeners take an `Event` object as first parameter, this object is generally not used. Other parameters are available after this event object.

```js
viewer.on('select-marker', (e, marker) => {
  console.log(`Marker ${marker.id} is clicked`);
});
```
