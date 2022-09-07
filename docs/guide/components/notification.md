# Notification

<ApiButton page="PSV.components.Notification.html"/>

> Display a small message above the navbar.


## Example

This example consistently displays new notifications.

::: code-demo

```yaml
title: PSV Notification Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,
  navbar: [
    'zoom',
    'caption',
    'fullscreen',
  ],
});

let i = 1;
setInterval(function() {
  viewer.notification.show({
    content: `Annoying notification #${i++}`,
    timeout: 1000,
  });
}, 2000);

```

:::


## Methods

### `show(config)`

Show the notification.

| option | type | |
|---|---|---|
| `id` | `string` | Unique identifier of the notification, this will be used to `hide` the notification only if the content has not been replaced by something else. |
| `content` (required) | `string` | HTML content of the notification. |
| `timeout` | `number` | Auto-hide delay in milliseconds. |

### `hide([id])`

Hide the notification, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.

### `isVisible([id]): boolean`

Check if the notification is visible.


## Events

### `show-notification(id)`

Triggered when the notification is shown.

### `hide-notification(id)`

Triggered when the notification is hidden.
