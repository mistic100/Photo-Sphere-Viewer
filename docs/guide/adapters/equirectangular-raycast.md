# Equirectangular raycast

<Badges module="equirectangular-raycast-adapter"/>

::: module
This adapter renders equirectangular panoramas with a fragment shader that computes the texture mapping mathematically per pixel, instead of relying on UV interpolation across the vertices of a tessellated sphere. This eliminates the polar distortion visible at the top and bottom of the panorama with the default adapter, especially on straight lines passing through the poles.

This adapter is available in the [@photo-sphere-viewer/equirectangular-raycast-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/equirectangular-raycast-adapter) package.
:::

```js:line-numbers
import { EquirectangularRaycastAdapter } from '@photo-sphere-viewer/equirectangular-raycast-adapter';

const viewer = new Viewer({
    adapter: EquirectangularRaycastAdapter,
    panorama: 'path/panorama.jpg',
});
```

::: tip Comparison with the default adapter
The default [equirectangular adapter](./equirectangular.md) approximates the projection by interpolating UV coordinates across a sphere of `resolution² / 2` faces. The raycast adapter uses a minimal sphere geometry and computes the exact spherical-to-UV mapping in the fragment shader, so quality does not depend on tessellation. The trade-off is more per-pixel GPU work; on most modern devices the cost is negligible.
:::

## Example

::: code-demo

```yaml
title: PSV Equirectangular Raycast Demo
packages:
    - name: equirectangular-raycast-adapter
```

<<< ./demos-src/equirectangular-raycast.js{js:line-numbers}

:::

## Configuration

#### `useXmpData`

See the [equirectangular adapter configuration](./equirectangular.md#usexmpdata).

::: tip
The raycast adapter has no `resolution` option. The geometry is intentionally minimal because the projection is computed in the shader.
:::

## Cropped panorama

Cropped panoramas are supported with the same `panoData` / XMP mechanism as the default adapter. See the [equirectangular adapter documentation](./equirectangular.md#cropped-panorama) for details.
