# Tooltip

::: module
<ApiButton page="classes/Core.Tooltip.html"/>
Add custom tooltips over the viewer.
:::

To add a tooltip you must call `viewer.createTooltip()`, this will a return a tooltip instance with methods : `move()`, `update()` and `hide()`. This allows to have multiple tooltips at the same time.

## Example

This example adds a persistent tooltip following the cursor.

::: code-demo

```yaml
title: PSV Tooltip Demo
```

<<< ./demos-src/tooltip.js{js:line-numbers}

:::

## Methods

### `viewer.createTooltip(config)`

Create a tooltip.

| option | type |   |
| ------ | ---- | - |
| `content` (required)  | `string` | HTML content of the tooltip. |
| `top` & `left` (required) | `number` | Pixel coordinates of the tooltip relative to the top-left corner of the viewer. |
| `position` (default `top center`) | `string` | Tooltip position toward it's arrow tip. Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`. |
| `className` | `string` | Additional CSS class added to the tooltip. |
| `data` | `any` | User data associated to the tooltip (useful for events). |

### `tooltip.move(config)`

Updates the position of the tooltip, the parameters are the same `top`, `left` and `position` as above.

### `tooltip.update(content)`

Updates the content of the tooltip.

### `tooltip.hide()`

Hide and destroy the tooltip.

## Events

### `show-tooltip(data)`

Triggered when a tooltip is shown.

### `hide-tooltip(data)`

Triggered when a tooltip is hidden.
