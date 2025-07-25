# Introduction to plugins

Plugins are used to add new functionalities to Photo Sphere Viewer. They can access all internal APIs of the viewer as well as the Three.js renderer to make the viewer even more awesome.

## Import official plugins

Official plugins (listed on the left menu) are available in various `@photo-sphere-viewer/***-plugin` packages. Some plugins also have an additional CSS file.

**Example for the Markers plugin:**

::::: tabs

:::: tab Import from a CDN

```html:line-numbers
<head>
    <!-- stylesheets of PSV core -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/markers-plugin/index.min.css" />
</head>

<script type="importmap">
    {
        "imports": {
            // imports of PSV core and three
            "@photo-sphere-viewer/markers-plugin": "https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/markers-plugin/index.module.js"
        }
    }
</script>

<script type="module">
    import { Viewer } from '@photo-sphere-viewer/core';
    import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

    const viewer = new Viewer({
        plugins: [
            MarkersPlugin,
        ],
    });
</script>
```

::::

:::: tab Install with NPM and a build tool

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const viewer = new Viewer({
    plugins: [
        MarkersPlugin,
    ],
});
```

::: tip Stylesheet
Import `@photo-sphere-viewer/markers-plugin/index.css` with the prefered way depending on your tooling.
:::

::::

:::::

## Using a plugin

All plugins consists of a JavaScript class which must be provided to the `plugins` array. Some plugins will also take a configuration object provided with the static method `withConfig`.

```js:line-numbers
const viewer = new Viewer({
    plugins: [
        PluginA,
        PluginB.withConfig({
            option1: 'foo',
            option2: 'bar',
        }),
    ],
});
```

### Methods and events

After initialization the plugin instance can be obtained with the `getPlugin` method, allowing to call methods on the plugin and subscribe to events.

```js:line-numbers
const markersPlugin = viewer.getPlugin(MarkersPlugin);

markersPlugin.addMarker(/* ... */);

markersPlugin.addEventListener('select-marker', () => {
    /* ... */
});
```

### Update options

Some plugins allow their configuration to be modified after init with the `setOption()` and `setOptions()` methods. The updatable configuration properties are documented on each plugin page.

```js:line-numbers
markersPlugin.setOption('gotoMarkerSpeed', '3rpm');

markersPlugin.setOptions({
    gotoMarkerSpeed: '3rpm',
    clickEventOnMarker: true,
});
```
