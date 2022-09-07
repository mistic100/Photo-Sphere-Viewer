# Overlay

<ApiButton page="PSV.components.Overlay.html"/>

> Display a message with an illustration on top of the viewer.


## Example

This example displays an overlay at startup.

::: code-demo

```yaml
title: PSV Overlay Demo
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
});

function showOverlay() {
  viewer.overlay.show({
    image: document.getElementById('overlay-icon').innerHTML,
    text: 'Lorem ipsum dolor sit amet',
    dissmisable: true,
  });
}

viewer.once('ready', showOverlay);
```

```html
<script type="text/template" id="overlay-icon">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path d="M94.2 19.4a2 2 0 00-1.7-.4 188.1 188.1 0 01-85.1 0 2 2 0 00-1.7.4c-.4.4-.7 1-.7 1.6v58c0 .6.3 1.2.8 1.6.4.4 1.1.5 1.7.4 27.8-6.5 57.3-6.5 85.1 0h.5c.5 0 .9-.2 1.2-.4.5-.4.8-1 .8-1.6V21c-.1-.6-.4-1.2-.9-1.6zM21.9 74.2L34 55.6l7.2 11 3.6 5.5c-7.7.3-15.3.9-22.9 2.1zM50 72.1h-.5l-4.3-6.6L60 41.8l20.1 32.7A189 189 0 0050 72.1zm41 4.4l-5.7-1.1L61.7 37a2 2 0 00-1.7-1 2 2 0 00-1.7.9L42.8 61.8l-7.1-10.9c-.4-.6-1-.9-1.7-.9s-1.3.3-1.7.9L16.5 75 9 76.5v-53c26.9 5.9 55.1 5.9 82 0v53z"/>
    <path d="M23 31a8 8 0 00-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8a8 8 0 00-8-8zm0 12a4 4 0 01-4-4c0-2.2 1.8-4 4-4s4 1.8 4 4a4 4 0 01-4 4z"/>
  </svg>
</script>
```

:::

## Methods

### `show(config)`

Show the overlay.

| option | type | |
|---|---|---|
| `id` | `string` | Unique identifier of the overlay, this will be used to `hide` the overlay only if the content has not been replaced by something else. |
| `text` (required) | `string` | Main message of the overlay. |
| `subtext` | `string` | Secondary message of the overlay. |
| `image` | `string` | SVG icon or image displayed above the text. |

### `hide([id])`

Hide the overlay, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.

### `isVisible([id]): boolean`

Check if the overlay is visible.


## Events

### `show-overlay(id)`

Triggered when the overlay is shown.

### `hide-overlay(id)`

Triggered when the overlay is hidden.
