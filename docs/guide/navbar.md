# Navbar customization

<DemoButton href="/demos/basic/custom-navbar.html"/>

## Core buttons

The `navbar` option is a nested-array to configure the content of the navbar, distributed in groups.

```ts:line-numbers
// default value
navbar: [
    ['zoom', 'move'],
    ['download', 'description'],
    ['caption'],
    ['fullscreen', 'menu'],
]
```

The option can also be declared as a string and use brackets to declare groups:

```ts
navbar: '[zoom move] [download description] caption [fullscreen menu]'
```

The following core elements are available:

-   `zoomOut`
-   `zoomIn`
-   `zoom` = `zoomOut` + `zoomIn`
-   `moveLeft`
-   `moveRight`
-   `moveTop`
-   `moveDown`
-   `move` = `moveLeft` + `moveRight` + `moveTop` + `moveDown`
-   `download`
-   `description`
-   `caption`
-   `fullscreen`
-   `menu`

::: info Note
- the `caption` element is always isolated in its own group
- the `description` button is forced on small screens when there is not enough space to display the caption
- the `menu` button is forced if needed when the navbar is full
:::

## Plugins buttons

Some [plugins](../plugins/) add new buttons to the navbar and will be automatically shown if you don't override the `navbar` option. However if you do, you will have to manually add said buttons in your configuration. The buttons codes are documented on each plugin page.

## Custom buttons

You can also add as many custom buttons you want. A custom button is an object with the following options:

#### `content` (required)

-   type : `string`

Content of the button. Preferably a square image or SVG icon.

#### `onClick(viewer)`

-   type : `function(Viewer)`

Function called when the button is clicked.

#### `id`

-   type : `string`

Unique identifier of the button, usefull when using the `navbar.getButton()` method.

#### `title`

-   type : `string`

Tooltip displayed when the mouse is over the button.

For translation purposes it can be a key in the main [`lang`](./config.md#lang) object.

#### `className`

-   type : `string`

CSS class added to the button.

#### `disabled`

-   type : `boolean`
-   default : `false`

Initially disable the button.

#### `visible`

-   type : `boolean`
-   default : `true`

Initially show the button.

The API allows to change the visibility of the button at any time:

```js
viewer.navbar.getButton('my-button').show();
```

## Custom elements

You can also add more complex elements to the navbar. Custom elements are defined like custom buttons with the following differences:

#### `type` (required)

Must be equal to `element`.

#### `content` (required)

-   type : `HTMLElement` & [`NavbarButtonElement`](/api/interfaces/Core.NavbarButtonElement.html){target=_blank}

Can be an existing element in a the DOM or a [Web Component](https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements).
If your component has an `attachViewer()` method it will be called with the instance of the viewer as first parameter.

<DemoButton href="/demos/advanced/navbar-element.html"></DemoButton>
