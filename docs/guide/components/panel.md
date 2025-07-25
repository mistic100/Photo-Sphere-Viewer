# Panel

::: module
<ApiButton page="classes/Core.Panel.html"/>
Display HTML content on a sidebar on the right of the viewer.
:::

## Example

This example adds a custom button to toggle a panel.

:::: code-demo

```yaml
title: PSV Panel Demo
```

::: code-group

<<< ./demos-src/panel.js{js:line-numbers}
<<< ./demos-src/panel.html [template.html]

:::

::::

## Methods

### `show(config)`

Open the side panel.

| option | type |   |
| ------ | ---- | - |
| `id` | `string` | Unique identifier of the panel, this will be used to `hide` the panel only if the content has not been replaced by something else. It will be used to store the width defined by the user when using the resize handle. |
| `content` (required) | `string` | HTML content of the panel. |
| `noMargin` (default&nbsp;`false`) | `boolean` | Remove the default margins inside the panel. |
| `width` (default&nbsp;`400px`) | `string` | Initial width of the panel (example: `100%`, `600px`). |
| `clickHandler(target)` | `function<HTMLElement>` | Function called when the user clicks inside the panel or presses the Enter key while an element focused. |

::: tip Content focus
After openning, the first focusable element (`a`, `button` or anything with `tabindex`) will be focused, allowing the user to navigate with the Tab key and activate the `clickHandler` with the `Enter` key.
:::

### `hide([id])`

Hide the panel, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.

### `isVisible([id]): boolean`

Check if the panel is opened.

## Events

### `show-panel(id)`

Triggered when the panel is shown.

### `hide-panel(id)`

Triggered when the panel is hidden.
