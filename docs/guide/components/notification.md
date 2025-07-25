# Notification

::: module
<ApiButton page="classes/Core.Notification.html"/>
Display a small message above the navbar.
:::

## Example

This example consistently displays new notifications.

::: code-demo

```yaml
title: PSV Notification Demo
```

<<< ./demos-src/notification.js{js:line-numbers}

:::

## Methods

### `show(config)`

Show the notification.

| option | type |   |
| ------ | ---- | - |
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
