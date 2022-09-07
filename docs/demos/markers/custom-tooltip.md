# Custom tooltip

Advanced styling of a marker's tooltip.

::: code-demo

```yaml
title: PSV Marker custom tooltip Demo
resources:
  - path: plugins/markers.js
    imports: MarkersPlugin
  - path: plugins/markers.css
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  
  plugins: [
    [PhotoSphereViewer.MarkersPlugin, {
      // list of markers
      markers: [{
        id       : 'custom-tooltip',
        tooltip  : {
          content  : document.querySelector('#tooltip-content').innerText,
          className: 'custom-tooltip',
          trigger  : 'click',
        },
        latitude : 0.11,
        longitude: -0.35,
        image    : baseUrl + 'pictos/pin-blue.png',
        width    : 32,
        height   : 32,
        anchor   : 'bottom center',
      }],
    }],
  ],
});

const markersPlugin = viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

viewer.once('ready', () => {
  viewer.animate({
    longitude: 0,
    latitude: 0.5,
    speed: 1000,
  })
  .then(() => {
    markersPlugin.showMarkerTooltip('custom-tooltip');
  });
});
```

```css
.custom-tooltip {
  max-width: none;
  width: 300px;
  padding: 0;
  box-shadow: 0 0 0 3px white;
}

.custom-tooltip img {
  width: 100%;
  border-radius: 4px 4px 0 0;
}

.custom-tooltip h2, .custom-tooltip p {
  margin: 1rem;
  text-align: justify;
}
```

```html
<script type="text/template" id="tooltip-content">
  <img src="https://photo-sphere-viewer-data.netlify.app/assets/sphere-small.jpg">
  <article>
    <h2>Lorem ipsum</h2>
    <p>
      Vivamus magna. Cras in mi at felis aliquet
      congue. Ut a est eget ligula molestie gravida. Curabitur massa. Donec eleifend, libero at sagittis mollis,
      tellus est malesuada tellus, at luctus turpis elit sit amet quam. Vivamus pretium ornare est.
    </p>
  </article>
</script>
```

:::
