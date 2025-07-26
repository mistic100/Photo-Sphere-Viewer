# Cropped panorama

Display [cropped panorama](../../guide/adapters/equirectangular.md#cropped-panorama) by reading its XMP metadata or compute the position on the fly.

::: code-demo

```yaml
autoload: true
title: PSV Cropped Demo
```

```js:line-numbers{9}
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere-cropped.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    canvasBackground: '#77addb',
    defaultZoomLvl: 0,
});
```

:::
