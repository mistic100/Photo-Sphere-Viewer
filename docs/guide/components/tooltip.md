# Tooltip

<ApiButton page="PSV.services.TooltipRenderer.html"/>

> Add custom tooltips over the viewer.

To add a tooltip you must call `viewer.tooltip.create()`, this will a return a tooltip instance with two methods : `move()` and `hide()`. This allows to have multiple tooltips at the same time.


## Example

This example adds a persistent tooltip following the cursor.

::: code-demo

```yaml
title: PSV Tooltip Demo
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
  navbar: 'zoom caption fullscreen',
});

let tooltip;

function onMouseMove(e) {
  if (!tooltip) {
    tooltip = viewer.tooltip.create({
      content: '&copy; Damien Sorel',
      left: e.clientX,
      top: e.clientY,
      position: 'top right',
    });
  } else {
    tooltip.move({
      left: e.clientX,
      top: e.clientY,
      position: 'top right',
    });
  }
}

function onMouseLeave() {
  if (tooltip) {
    tooltip.hide();
    tooltip = null;
  }
}

viewer.once('ready', function() {
  viewer.parent.addEventListener('mousemove', onMouseMove);
  viewer.parent.addEventListener('mouseleave', onMouseLeave);
});
```

:::


## Methods

### `create(config)`

Create a tooltip.

| option | type | |
|---|---|---|
| `content` (required) | `string` |HTML content of the tooltip. |
| `top` & `left` (required) | `number` | Pixel coordinates of the tooltip relative to the top-left corner of the viewer. |
| `position` (default `top center`) | `string` | Tooltip position toward it's arrow tip. Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`. |
| `className` | `string` | Additional CSS class added to the tooltip. |
| `data` | `any` | User data associated to the tooltip (useful for events). |

### `tooltip.move(config)`

Updates the position of the tooltip, the parameters are the same `top`, `left` and `position` as above.

### `tooltip.hide()`

Hide and destroy the tooltip.


## Events

### `show-tooltip(data)`

Triggered when the tooltip is shown.

### `hide-tooltip(data)`

Triggered when the tooltip is hidden.
