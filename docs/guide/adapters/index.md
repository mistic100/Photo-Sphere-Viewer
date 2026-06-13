# Adapters

Adapters are small pieces of code responsible to load the panorama texture(s) in the Three.js scene.

The supported adapters are:

-   [equirectangular](equirectangular.md): the default adapter, used to load full or partial equirectangular panoramas
-   [equirectangular tiles](equirectangular-tiles.md): used to load tiled equirectangular panoramas
-   [equirectangular video](equirectangular-video.md): used to load equirectangular videos
-   [cubemap](cubemap.md): used to load cubemaps projections (six textures)
-   [cubemap tiles](cubemap-tiles.md): used to load tiled cubemap panoramas
-   [cubemap video](cubemap-video.md): used to load cubemap video
-   [dual fisheye](dual-fisheye.md): used to display raw files of 360 cameras like the Ricoh Theta Z1

## Import an adapter

Official adapters are available in various `@photo-sphere-viewer/***-adapter` packages. All adapters consist of a JavaScrpt class which must be provided to the `adapter` option. Some adapters will also take a configuration object provided with the static method `withConfig`.

**Example for the Cubemap adapter:**

:::: tabs

::: tab Import from a CDN

```html:line-numbers
<script type="importmap">
    {
        "imports": {
            // imports of PSV core and three
            "@photo-sphere-viewer/cubemap-adapter": "https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/cubemap-adapter/index.module.js"
        }
    }
</script>

<script type="module">
    import { Viewer } from '@photo-sphere-viewer/core';
    import { CubemapAdapter } from '@photo-sphere-viewer/cubemap-adapter';

    new Viewer({
        adapter: CubemapAdapter,
        // OR
        adapter: CubemapAdapter.withConfig({
            // optional adapter config
        }),
        panorama: // specific to the adapter,
    });
</script>
```

:::

::: tab Install with NPM and a build tool

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';
import { CubemapAdapter } from '@photo-sphere-viewer/cubemap-adapter';

new Viewer({
    adapter: CubemapAdapter,
    panorama: // specific to the adapter,
});
```

:::

::::
