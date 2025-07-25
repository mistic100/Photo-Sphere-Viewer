# Show markers on the plan

Configure [markers](../../plugins/markers.md) to be displayed on the [plan](../../plugins/plan.md).

::: code-demo

```yaml
autoload: true
title: PSV plan markers Demo
packages:
    - name: plan-plugin
      style: true
    - name: markers-plugin
      style: true
    - name: leaflet
      external: true
      version: 1
      style: true
      js: dist/leaflet-src.esm.js
      css: dist/leaflet.css
```

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';
import { PlanPlugin } from '@photo-sphere-viewer/plan-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    plugins: [
        PlanPlugin.withConfig({
            defaultZoom: 14,
            coordinates: [6.78677, 44.58241],
            bearing: '120deg',
            size: { width: '300px', height: '300px' },
        }),
        MarkersPlugin.withConfig({
            markers: [
                {
                    id: 'mountain',
                    tooltip: 'A mountain',
                    position: { yaw: 0.11, pitch: 0.32 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    data: {
                        plan: {
                            coordinates: [6.79077, 44.58041],
                            size: 25,
                            image: baseUrl + 'pictos/pin-blue.png',
                        },
                    },
                },
            ],
        }),
    ],
});
```

:::
