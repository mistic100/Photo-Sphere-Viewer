# Zero config

Simple panorama with minimal options.

::: code-demo

```yaml
autoload: true
title: PSV Basic Demo
```

```js:line-numbers
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
});
```

:::
