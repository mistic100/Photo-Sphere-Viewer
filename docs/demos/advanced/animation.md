# Intro animation

Use the `Animation` helper and [autorotate plugin](../../plugins/autorotate.md) to create a cool intro.

::: code-demo

```yaml
autoload: true
title: PSV Intro Animation Demo
packages:
    - name: autorotate-plugin
```

```js:line-numbers
import { Viewer, utils } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const animatedValues = {
    pitch: { start: -Math.PI / 2, end: 0 },
    yaw: { start: Math.PI / 2, end: 0 },
    zoom: { start: 0, end: 50 },
    maxFov: { start: 130, end: 90 },
    fisheye: { start: 2, end: 0 },
};

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    defaultPitch: animatedValues.pitch.start,
    defaultYaw: animatedValues.yaw.start,
    defaultZoomLvl: animatedValues.zoom.start,
    maxFov: animatedValues.maxFov.start,
    fisheye: animatedValues.fisheye.start,
    mousemove: false,
    mousewheel: false,
    navbar: [
        'autorotate',
        'zoom',
        {
            title: 'Rerun animation',
            content: '🔄',
            onClick: reset,
        },
        'caption',
        'fullscreen',
    ],
    plugins: [
        AutorotatePlugin.withConfig({
            autostartDelay: null,
            autostartOnIdle: false,
            autorotatePitch: 0,
        }),
    ],
});

const autorotate = viewer.getPlugin(AutorotatePlugin);

let isInit = true;

// setup timer for automatic animation on startup
viewer.addEventListener('ready', () => {
    viewer.navbar.hide();

    setTimeout(() => {
        if (isInit) {
            intro(animatedValues.pitch.end, animatedValues.pitch.end);
        }
    }, 5000);
}, { once: true });

// launch animation to clicked point
viewer.addEventListener('click', ({ data }) => {
    if (isInit) {
        intro(data.pitch, data.yaw);
    }
});

// perform the intro animation
function intro(pitch, yaw) {
    isInit = false;
    autorotate.stop();
    viewer.navbar.hide();

    new utils.Animation({
        properties: {
            ...animatedValues,
            pitch: { start: animatedValues.pitch.start, end: pitch },
            yaw: { start: animatedValues.yaw.start, end: yaw },
        },
        duration: 2500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOptions({
                fisheye: properties.fisheye,
                maxFov: properties.maxFov,
            });
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        autorotate.start();
        viewer.navbar.show();
        viewer.setOptions({
            mousemove: true,
            mousewheel: true,
        });
    });
}

// perform the reverse animation
function reset() {
    isInit = true;
    autorotate.stop();
    viewer.navbar.hide();
    viewer.setOptions({
        mousemove: false,
        mousewheel: false,
    });

    new utils.Animation({
        properties: {
            pitch: { start: viewer.getPosition().pitch, end: animatedValues.pitch.start },
            yaw: { start: viewer.getPosition().yaw, end: animatedValues.yaw.start },
            zoom: { start: viewer.getZoomLevel(), end: animatedValues.zoom.start },
            maxFov: { start: animatedValues.maxFov.end, end: animatedValues.maxFov.start },
            fisheye: { start: animatedValues.fisheye.end, end: animatedValues.fisheye.start },
        },
        duration: 1500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOptions({
                fisheye: properties.fisheye,
                maxFov: properties.maxFov,
            });
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    });
}
```

:::
