# Dual fisheye

::: module
"Dual fisheye" is the raw file format used by many 360 cameras brands.

This adapter is available in the [@photo-sphere-viewer/dual-fisheye-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/dual-fisheye-adapter) package.
:::

:::: tabs

::: tab Panorama

```js
import { DualFisheyeAdapter } from '@photo-sphere-viewer/dual-fisheye-adapter';

const viewer = new Viewer({
    adapter: DualFisheyeAdapter,
    panorama: 'path/panorama.jpg',
});
```

:::

::: tab Video

```js
import { DualFisheyeVideoAdapter } from '@photo-sphere-viewer/dual-fisheye-adapter';

const viewer = new Viewer({
    adapter: DualFisheyeVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [VideoPlugin],
});
```

:::

::::

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

## Panorama options

The panorama is expected to have the two fisheye images side by side.

![](/images/dualfisheye.jpg)

::: tip Video files
If you have two separate `insv` files, this ffmpeg command can be used to combine them into a single video file (adjust scale, codec and quality as desired).

```
ffmpeg -i input_left.insv -i input_right.insv \
    -filter_complex "[0:v][1:v]hstack=inputs=2,scale=4096:-1,vflip[v];[0:a][1:a]amerge=inputs=2[a]" \
    -map "[v]" -map "[a]" \
    -c:v libsvtav1 -crf 25 \
    output.mp4
```
:::
