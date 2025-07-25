# Layers markers

Example usage of `imageLayer` and `videoLayer` markers.

::: code-demo

```yaml
autoload: true
title: PSV Marker layers Demo
packages:
    - name: markers-plugin
      style: true
```

```js:line-numbers{18-22,30-34}
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'artist-workshop.jpg',
    caption: 'Artist Workshop <b>&copy; Oliksiy Yakovlyev (HDRI Haven)</b> & Rick Astley',
    defaultYaw: 2.5,
    defaultPitch: 0.1,

    plugins: [
        MarkersPlugin.withConfig({
            markers: [
                {
                    id: 'video',
                    videoLayer: baseUrl + 'pictos/rick.webm',
                    position: [
                        { yaw: 2.90978, pitch: 0.25583 }, { yaw: 3.20036, pitch: 0.25220 },
                        { yaw: 3.20567, pitch: -0.28784 }, { yaw: 2.92182, pitch: -0.31297 },
                    ],
                    style: {
                        cursor: 'pointer',
                    },
                    tooltip: 'Play / Pause',
                },
                {
                    id: 'image',
                    imageLayer: baseUrl + 'pictos/rick.jpg',
                    position: [
                        { yaw: 2.17063, pitch: 0.47556 }, { yaw: 2.47392, pitch: 0.47121 },
                        { yaw: 2.47818, pitch: 0.24468 }, { yaw: 2.17698, pitch: 0.24809 },
                    ],
                },
            ],
        }),
    ],
});

const markers = viewer.getPlugin(MarkersPlugin);

markers.addEventListener('select-marker', ({ marker }) => {
    if (marker.id === 'video') {
        if (marker.video.paused) {
            marker.video.play();
        } else {
            marker.video.pause();
        }
    }
});

// below is custom animation to make Rick's position change

const positions = [
    [
        { yaw: 2.17063, pitch: 0.47556 }, { yaw: 2.47392, pitch: 0.47121 },
        { yaw: 2.47818, pitch: 0.24468 }, { yaw: 2.17698, pitch: 0.24809 },
    ],
    [
        { yaw: 2.53028, pitch: 0.45475 }, { yaw: 2.73576, pitch: 0.42324 },
        { yaw: 2.72772, pitch: 0.25040 }, { yaw: 2.52465, pitch: 0.27152 },
    ],
    [
        { yaw: 2.52182, pitch: 0.22277 }, { yaw: 2.71813, pitch: 0.20591 },
        { yaw: 2.71176, pitch: 0.04947 }, { yaw: 2.51667, pitch: 0.05490 },
    ],
    [
        { yaw: 2.24036, pitch: 0.21062 }, { yaw: 2.42582, pitch: 0.20913 },
        { yaw: 2.42649, pitch: 0.05818 }, { yaw: 2.24091, pitch: 0.05868 },
    ],
    [
        { yaw: 1.95249, pitch: 0.46809 }, { yaw: 2.11880, pitch: 0.48289 },
        { yaw: 2.12564, pitch: 0.28968 }, { yaw: 1.96142, pitch: 0.27917 },
    ],
    [
        { yaw: 2.35634, pitch: -0.08720 }, { yaw: 2.50943, pitch: -0.08660 },
        { yaw: 2.51593, pitch: -0.27962 }, { yaw: 2.35963, pitch: -0.28636 },
    ],
    [
        { yaw: 1.97055, pitch: 0.24636 }, { yaw: 2.12267, pitch: 0.25273 },
        { yaw: 2.12077, pitch: 0.14738 }, { yaw: 1.97077, pitch: 0.14508 },
    ],
    [
        { yaw: 1.73189, pitch: 0.44483 }, { yaw: 1.91183, pitch: 0.47555 },
        { yaw: 1.91775, pitch: 0.34020 }, { yaw: 1.73849, pitch: 0.31800 },
    ],
    [
        { yaw: 1.77034, pitch: 0.29604 }, { yaw: 1.88900, pitch: 0.30949 },
        { yaw: 1.89234, pitch: 0.13656 }, { yaw: 1.77210, pitch: 0.13185 },
    ],
    [
        { yaw: 1.75644, pitch: 0.10757 }, { yaw: 1.89867, pitch: 0.11271 },
        { yaw: 1.90351, pitch: 0.00480 }, { yaw: 1.76327, pitch: 0.00579 },
    ],
];

let opacity = 1;
let dir = -1;
let last = 0;
let wait = 0;
function animateRick(time) {
    if (wait > 0) {
        wait -= time - last;
    } else {
        opacity = Math.max(0, Math.min(1, opacity + dir * (time - last) / 500));
        markers.updateMarker({ id: 'image', opacity });

        if (opacity === 0) {
            markers.updateMarker({ id: 'image', position: positions[Math.floor(Math.random() * positions.length)] });
            dir = 1;
        } else if (opacity === 1) {
            dir = -1;
            wait = 500;
        }
    }

    last = time;
    requestAnimationFrame(animateRick);
}

viewer.addEventListener('ready', () => requestAnimationFrame(animateRick));
```

:::
