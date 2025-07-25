# Make a screenshot

Adds a button that will download a screenshot of the visible panorama.

::: code-demo

```yaml
autoload: true
title: PSV Screenshot Demo
```

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    navbar: [
        {
            content: 'Screenshot',
            onClick(viewer) {
                viewer.addEventListener('render', () => {
                    const link = document.createElement('a');
                    link.download = 'screenshot.png';
                    link.href = viewer.renderer.renderer.domElement.toDataURL();
                    link.click();
                }, { once: true });
                viewer.needsUpdate();
            },
        },
    ],
});
```

:::

::: warning
This example uses an internal API of Photo Sphere Viewer, Typescript users will need a `// @ts-ignore` command.
:::
