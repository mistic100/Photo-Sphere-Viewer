# Intro animation

Use the `Animation` helper to create a cool intro.

::: code-demo

```yaml
title: PSV Intro Animation Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  defaultLat: -Math.PI / 2,
  defaultLong: Math.PI,
  defaultZoomLvl: 0,
  fisheye: 4,
  navbar: [
    'zoom',
    {
      title: 'Rerun animation',
      content: '🔄',
      onClick: intro,
    },
    'caption',
    'fullscreen'
  ],
});

viewer.on('ready', intro);
   
function intro() {
  // default far plane is too close to render fisheye=4
  // you can also skip this line and start with fisheye=2
  viewer.renderer.camera.far *= 2;
  
  new PhotoSphereViewer.utils.Animation({
    properties: {
      lat: { start: -Math.PI / 2, end: 0.2 },
      long: { start: Math.PI, end: 0 },
      zoom: { start: 0, end: 50 },
      fisheye: { start: 4, end: 0 },
    },
    duration: 2000,
    easing: 'inOutQuad',
    onTick: (properties) => {
      viewer.setOption('fisheye', properties.fisheye);
      viewer.rotate({ longitude: properties.long, latitude: properties.lat });
      viewer.zoom(properties.zoom);
    }
  });
}
```

:::
