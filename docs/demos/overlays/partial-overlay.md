# Partial overlay

By using [`panoData`](../../plugins/overlays.md#panodata) on an overlay you can display smaller image above the panorama. The logic to define the data is the same as for [cropped panoramas](../../guide/adapters/equirectangular.md#cropped-panorama).

::: code-demo

```yaml
autoload: true
title: PSV Partial overlay Demo
packages:
    - name: overlays-plugin
```

```js:line-numbers{17-21}
import { Viewer } from '@photo-sphere-viewer/core';
import { OverlaysPlugin } from '@photo-sphere-viewer/overlays-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    plugins: [
        OverlaysPlugin.withConfig({
            overlays: [
                {
                    id: 'paper',
                    path: baseUrl + 'sphere-paper-overlay.png',
                    panoData: {
                        fullWidth: 3000,
                        croppedX: 1250,
                        croppedY: 500,
                    },
                },
            ],
        }),
    ],
});
```

:::
