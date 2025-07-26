# Fisheye

Display the panorama with a [fisheye](../../guide/config.md#fisheye) effect.

::: code-demo

```yaml
autoload: true
title: PSV Fisheye Demo
```

```js:line-numbers{11}
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    defaultPitch: 0.6,
    defaultZoomLvl: 20,
    fisheye: true,
});
```

:::
