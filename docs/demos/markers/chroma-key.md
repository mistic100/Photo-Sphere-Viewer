# Chroma key video markers

Example usage of a transparent `videoLayer` marker using [`chromaKey`](../../plugins/markers.md#chromakey).

::: code-demo

```yaml
autoload: true
title: PSV Marker layers Demo
packages:
    - name: markers-plugin
      style: true
```

```js:line-numbers{19-23}
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
                    id: 'video-greenscreen',
                    videoLayer: baseUrl + 'pictos/t-rex.mp4',
                    position: { yaw: -0.3, pitch: 0 },
                    size: { width: 500, height: 500 },
                    chromaKey: {
                        enabled: true,
                        color: '#009200',
                        similarity: 0.1,
                    },
                },
                {
                    id: 'video',
                    videoLayer: baseUrl + 'pictos/t-rex.mp4',
                    position: { yaw: 0.3, pitch: 0 },
                    size: { width: 500, height: 500 },
                },
            ],
        }),
    ],
});
```

:::
