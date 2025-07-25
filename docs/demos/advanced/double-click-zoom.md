# Double click zoom

Zoom to the cursor position on double-click.

::: code-demo

```yaml
autoload: true
title: PSV Double click zoom Demo
```

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
});

viewer.addEventListener('dblclick', ({ data }) => {
    viewer.animate({
        yaw: data.yaw,
        pitch: data.pitch,
        zoom: 100,
        speed: 1000,
    });
});
```

:::
