# Youtube element

Example usage of `elementLayer` marker to integrate a Youtube video.

::: code-demo

```yaml
autoload: true
title: PSV Marker Youtube Demo
packages:
    - name: markers-plugin
      style: true
```

```js:line-numbers{6,7,26}
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const iframe = document.createElement('iframe');
iframe.src = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?si=h2PQuWtQtGzNxMm?autoplay=0';
iframe.width = '640px';
iframe.style.aspectRatio = `${16/9}`;
iframe.style.border = 'none';
iframe.allow = 'fullscreen';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'artist-workshop.jpg',
    caption: 'Artist Workshop <b>&copy; Oliksiy Yakovlyev (HDRI Haven)</b> & Rick Astley',
    defaultYaw: -0.5,
    defaultPitch: 0.2,
    defaultZoomLvl: 70,

    plugins: [
        MarkersPlugin.withConfig({
            markers: [
                {
                    id: 'youtube',
                    elementLayer: iframe,
                    position: { yaw: -0.7, pitch: 0.32},
                    rotation: { yaw: -0.2 },
                },
            ],
        }),
    ],
});
```

:::
