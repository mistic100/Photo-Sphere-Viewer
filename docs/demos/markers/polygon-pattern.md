# Polygon pattern

Use custom SVG patterns as polygon `fill`.

:::: code-demo

```yaml
autoload: true
title: PSV Marker polygon pattern Demo
packages:
    - name: markers-plugin
      style: true
```

::: code-group

```js:line-numbers{22,34} [viewer.js]
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    plugins: [
        MarkersPlugin.withConfig({
            markers: [
                {
                    id: 'polygon-1',
                    polygon: [
                        [6.2208, 0.0906], [0.0443, 0.1028], [0.2322, 0.0849], [0.4531, 0.0387],
                        [0.5022, -0.0056], [0.4587, -0.0396], [0.252, -0.0453], [0.0434, -0.0575],
                        [6.1302, -0.0623], [6.0094, -0.0169], [6.0471, 0.032], [6.2208, 0.0906],
                    ],
                    svgStyle: {
                        fill: 'url(#dots)',
                        stroke: 'rgba(255, 0, 50, 0.8)',
                        strokeWidth: '2px',
                    },
                },
                {
                    id: 'polygon-2',
                    polygonPixels: [
                        [3104,1193],[2984,1365],[2939,1328],[2855,1345],[2817,1327],[2703,1398],
                        [2645,1413],[2499,1398],[2456,1373],[2456,1152],[3104,1095],
                    ],
                    svgStyle: {
                        fill: 'url(#image)',
                    },
                },
            ],
        }),
    ],
});
```

```html [template.html]
<svg id="patterns" style="position: absolute; top: -1000px">
    <defs>
        <pattern id="dots" x="10" y="10" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="10" style="stroke: none; fill: rgba(255, 0, 0, 0.6)" />
        </pattern>
        <pattern id="image" x="256" y="256" width="512" height="512" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="512" height="512" fill="#6dd0f7" />
            <image
                href="https://photo-sphere-viewer-data.netlify.app/assets/cubemap-test/3.png"
                x="128" y="128" width="256" height="256"
            />
        </pattern>
    </defs>
</svg>
```

:::

::::
