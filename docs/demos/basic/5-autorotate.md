# Autorotate

Automatically performs a rotation if the user is inactive.

::: code-demo

```yaml
title: PSV Autorotate Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',  
  autorotateDelay: 1000,
  autorotateIdle: true,
});
```

:::

