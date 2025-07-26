# Mouse hover scaling

Enable global [mouse hover scaling](../../plugins/markers.md#defaulthoverscale) and customize for each marker.

::: code-demo

```yaml
autoload: true
title: PSV Marker mouse hover scaling Demo
packages:
    - name: markers-plugin
      style: true
```

```js:line-numbers{13,30,39}
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    plugins: [
        MarkersPlugin.withConfig({
            defaultHoverScale: true,
            markers: [
                {
                    id: 'marker-1',
                    position: { pitch: 0.11, yaw: -0.35 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    tooltip: 'Default scaling',
                },
                {
                    id: 'marker-2',
                    position: { pitch: 0.32, yaw: 0.11 },
                    image: baseUrl + 'pictos/pin-red.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    tooltip: 'Disable scaling',
                    hoverScale: false,
                },
                {
                    id: 'marker-3',
                    position: { pitch: -0.05, yaw: 0.04 },
                    image: baseUrl + 'pictos/pin-red.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    tooltip: 'Custom scaling',
                    hoverScale: { amount: 3, easing: 'ease-in-out', duration: 1000 },
                },
            ],
        }),
    ],
});
```

:::
