# Intro animation

Use the `Animation` helper to create a cool intro.

::: code-demo

```yaml
title: PSV Intro Animation Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const animatedValues = {
  latitude : { start: -Math.PI / 2, end: 0.2 },
  longitude: { start: Math.PI, end: 0 },
  zoom     : { start: 0, end: 50 },
  fisheye  : { start: 2, end: 0 },
};

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  defaultLat: animatedValues.latitude.start,
  defaultLong: animatedValues.longitude.start,
  defaultZoomLvl: animatedValues.zoom.start,
  fisheye: animatedValues.fisheye.start,
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
  new PhotoSphereViewer.utils.Animation({
    properties: animatedValues,
    duration: 2500,
    easing: 'inOutQuad',
    onTick: (properties) => {
      viewer.setOption('fisheye', properties.fisheye);
      viewer.rotate({ longitude: properties.longitude, latitude: properties.latitude });
      viewer.zoom(properties.zoom);
    }
  });
}
```

:::
