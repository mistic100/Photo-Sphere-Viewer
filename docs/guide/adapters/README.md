# Adapters

Adapters are small pieces of code responsible to load the panorama texture(s) in the THREE.js scene.

::: warning
This feature is not released yet, it will be available in the next major version of Photo Sphere Viewer. Exisintg cubemaps don't need any adapter.
:::

The supported adapters are:
- `equirectangular`: the default adapter, used to load full or partial equirectangular panoramas
- [cubemap](cubemap.md): used to load cubemaps projections (six textures)
- [equirectangular tiles](tiles.md): used to load tiled equirectangular panoramas

## Import an adapter

Official adapters (listed on the left menu) are available in the the main `photo-sphere-viewer` package inside the `dist/adapters` directory.

**Example for the Cubemap adapter:**

:::: tabs

::: tab Direct import
```html
<!-- base imports of PSV and dependencies -->

<script src="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/adapters/cubemap.min.js"></script>
```

```js
new PhotoSphereViewer.Viewer({
  adapter: [PhotoSphereViewer.CubemapAdapter, {
    // optional adapter config
  }],
  panorama: // specific to the adapter,
});
```
:::

::: tab ES import
```js
import { CubemapAdapter } from 'photo-sphere-viewer/dist/adapters/cubemap';

new Viewer({
  adapter: [CubemapAdapter, {
    // optional adapter config
  }],
  panorama: // specific to the adapter,
});
```
:::

::::
