# Getting Started

<Badges module="core"/>

::: tip Playground
Test Photo Sphere Viewer with you own panorama in the [Playground](../playground.md)
:::

## Install Photo Sphere Viewer

#### With npm or yarn

```bash
npm install @photo-sphere-viewer/core

yarn add @photo-sphere-viewer/core
```

#### Via CDN

Photo Sphere Viewer is available on [jsDelivr](https://www.jsdelivr.com/?query=@photo-sphere-viewer)

#### Manually

You can also [download the latest release](https://github.com/mistic100/Photo-Sphere-Viewer/releases)

## Dependencies

-   [Three.js](https://threejs.org)

## Your first viewer

Include all JS & CSS files in your page manually or with your favorite bundler and init the viewer.

::::: tabs

:::: tab Import from a CDN

Importing the library from a CDN (or static files) requires the use of an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) and declare your script tag with `type="module"`.

```html:line-numbers
<head>
    <!-- for optimal display on high DPI devices -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core/index.min.css" />
</head>

<!-- the viewer container must have a defined size -->
<div id="viewer" style="width: 100vw; height: 100vh;"></div>

<script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three/build/three.module.js",
            "@photo-sphere-viewer/core": "https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/core/index.module.js"
        }
    }
</script>

<script type="module">
    import { Viewer } from '@photo-sphere-viewer/core';

    const viewer = new Viewer({
        container: document.querySelector('#viewer'),
        panorama: 'path/to/panorama.jpg',
    });
</script>
```

::::

:::: tab Install with NPM and a build tool

We will not detail more this section as it is highly dependent on which build tool you use.

```html:line-numbers
<head>
    <!-- for optimal display on high DPI devices -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<!-- the viewer container must have a defined size -->
<div id="viewer" style="width: 100vw; height: 100vh;"></div>
```

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';

const viewer = new Viewer({
    container: document.querySelector('#viewer'),
    panorama: 'path/to/panorama.jpg',
});
```

::: tip Stylesheet
Import `@photo-sphere-viewer/core/index.css` with the prefered way depending on your tooling.
:::

::::

:::::

<br>

::: code-demo

```yaml
autoload: true
title: PSV Basic Demo
```

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
});
```

:::

The `panorama` must be an [equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection) of your photo. Other modes are supported through [adapters](./adapters/).

::: tip Cropped panoramas
If your image is not covering a full 360°×180° sphere, it will be deformed. You can fix it by providing [cropping data](./adapters/equirectangular.md#cropped-panorama).
:::
