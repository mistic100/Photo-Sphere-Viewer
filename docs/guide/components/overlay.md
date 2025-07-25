# Overlay

::: module
<ApiButton page="classes/Core.Overlay.html"/>
Display a message with an illustration on top of the viewer.
:::

## Example

This example displays an overlay at startup.

::: code-demo

```yaml
title: PSV Overlay Demo
```

<<< ./demos-src/overlay.js{js:line-numbers}

:::

## Methods

### `show(config)`

Show the overlay.

| option | type |   |
| ------ | ---- | - |
| `id` | `string` | Unique identifier of the overlay, this will be used to `hide` the overlay only if the content has not been replaced by something else. |
| `title` (required) | `string` | Main message of the overlay.  |
| `text` | `string` | Secondary message of the overlay. |
| `image` | `string` | SVG icon or image displayed above the text. |
| `dismissible` | `boolean` | If the overlay can be hidden by click or Escape key (default: `true`). |

### `hide([id])`

Hide the overlay, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.

### `isVisible([id]): boolean`

Check if the overlay is visible.

## Events

### `show-overlay(id)`

Triggered when the overlay is shown.

### `hide-overlay(id)`

Triggered when the overlay is hidden.
