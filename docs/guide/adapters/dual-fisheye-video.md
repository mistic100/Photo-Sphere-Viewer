# Dual fisheye

::: module
"Dual fisheye" is the raw file format used by many 360 cameras brands.

This adapter is available in the main `@photo-sphere-viewer/dual-fisheye-video-adapter` package.
:::

```js
import { DualFisheyeVideoAdapter } from '@photo-sphere-viewer/dual-fisheye-video-adapter';

const viewer = new Viewer({
    adapter: DualFisheyeVideoAdapter,
    panorama: 'path/panorama.mp4',
});
```

## Example

::: code-demo

```yaml
title: PSV Dual fisheye Video Demo
packages:
    - name: dual-fisheye-video-adapter
```

<<< ./demos-src/dual-fisheye-video.js{js:line-numbers}

:::

::: warning
This adapter is currently only tested for raw files of the Ricoh Theta Z1, it might evolve in the future if more configuration is needed
to support other cameras. Feel free to open an issue with some example files.
:::

## Configuration

See the [equirectangular video adapter configuration](./equirectangular-video.md#resolution).
