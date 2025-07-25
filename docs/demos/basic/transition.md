# Panorama transition

This interactive demo shows the various possibilities of the [`defaultTransition`](../../guide/config.md#defaulttransition) option. Click the "Run" button to test the transition (with random orientation and zoom).

::: code-demo

```yaml
autoload: true
hideHeader: true
title: PSV Transition Demo
packages:
    - name: lil-gui
      version: '0.20'
      external: true
      js: dist/lil-gui.esm.min.js
```

```js
import { GUI } from 'lil-gui';
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const panos = [
    baseUrl + 'tour/key-biscayne-1.jpg',
    baseUrl + 'tour/key-biscayne-2.jpg',
    baseUrl + 'tour/key-biscayne-3.jpg',
    baseUrl + 'tour/key-biscayne-4.jpg',
    baseUrl + 'tour/key-biscayne-5.jpg',
    baseUrl + 'tour/key-biscayne-6.jpg',
    baseUrl + 'tour/key-biscayne-7.jpg',
];

const viewer = new Viewer({
    container: 'viewer',
    panorama: panos[0],
    caption: 'Cape Florida Light, Key Biscayne <b>&copy; Pixexid</b>',
});

let i = 0;
const config = {
    enabled: true,
    speed_mode: 'duration',
    speed_duration: 1.5,
    speed_speed: 3,
    rotation: true,
    effect: 'fade',

    run() {
        i++;
        if (i === panos.length) i = 0;
        viewer.setPanorama(panos[i], {
            position: {
                yaw: (((Math.random() - 0.5) * 3) / 2) * Math.PI,
                pitch: (((Math.random() - 0.5) * 3) / 4) * Math.PI,
            },
            zoom: Math.random() * 60 + 20,
        });
    }
};

const gui = new GUI({ title: 'Transition Options' });

gui.add(config, 'enabled');
gui.add(config, 'rotation');
gui.add(config, 'effect', ['fade', 'black', 'white']);

const speed = gui.addFolder('Speed/Duration');
speed.add(config, 'speed_mode', ['duration', 'speed']).name('Mode');
speed.add(config, 'speed_duration', 0.5, 10, 0.5).name('Duration (s)');
speed.add(config, 'speed_speed', 0.5, 10, 0.5).name('Speed (rpm)');

gui.add(config, 'run').name('Run');

gui.onChange(() => {
    viewer.setOption('defaultTransition', !config.enabled ? null : {
        rotation: config.rotation,
        effect: config.effect,
        speed: config.speed_mode === 'duration' ? config.speed_duration * 1000 : config.speed_speed + 'rpm',
    });
});
```

:::
