# Dual fisheye

::: module
"Dual fisheye" is the raw file format used by many 360 cameras brands.

This adapter is available in the main `@photo-sphere-viewer/core` package.
:::

```js
import { DualFisheyeAdapter } from '@photo-sphere-viewer/core';

const viewer = new Viewer({
    adapter: DualFisheyeAdapter,
    panorama: 'path/panorama.jpg',
});
```

## Example

::: code-demo

```yaml
title: PSV Dual fisheye Demo
packages:
    - name: core
```

<<< ./demos-src/dual-fisheye.js{js:line-numbers}

:::

::: warning
This adapter is currently only tested for raw files of the Ricoh Theta Z1, it might evolve in the future if more configuration is needed
to support other cameras. Feel free to open an issue with some examples files.
:::

## Configuration

#### `resolution`

-   type: `number`
-   default: `64`

The number of faces of the sphere geometry used to display the panorama, higher values can reduce deformations on straight lines at the cost of performances.

_Note: the actual number of faces is `resolution² / 2`._
