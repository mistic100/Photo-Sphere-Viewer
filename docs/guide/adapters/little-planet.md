# Little planet <Badge text="4.7.1"/>

> Displays an [equirectangular](equirectangular.md) panorama with a little planet effect.

This adapter is available in the core `photo-sphere-viewer` package in `dist/adapters/little-planet.js`.

::: warning Compatibility
This adapter is not complatible with some options and plugins, it is provided as it just for fun.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.LittlePlanetAdapter,
  panorama: 'path/panorama.jpg',
});
```


## Example

::: code-demo

```yaml
title: PSV Little Planet Demo
resources:
  - path: adapters/little-planet.js
    imports: LittlePlanetAdapter
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  adapter: PhotoSphereViewer.LittlePlanetAdapter,
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  loadingImg: baseUrl + 'loader.gif',
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: true,
});
```

:::
