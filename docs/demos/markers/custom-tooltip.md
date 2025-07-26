# Custom tooltip

Advanced styling of a marker's [tooltip](../../plugins/markers.md#tooltip).

:::: code-demo

```yaml
autoload: true
title: PSV Marker custom tooltip Demo
packages:
    - name: markers-plugin
      style: true
```

::: code-group

```js:line-numbers{15-20} [viewer.js]
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    plugins: [
        MarkersPlugin.withConfig({
            markers: [{
                id: 'custom-tooltip',
                tooltip: {
                    content: document.querySelector('#tooltip-content').innerText,
                    className: 'custom-tooltip',
                    position: 'top',
                    trigger: 'click',
                },
                position: { pitch: 0.11, yaw: -0.35 },
                image: baseUrl + 'pictos/pin-blue.png',
                size: { width: 32, height: 32 },
                anchor: 'bottom center',
            }],
        }),
    ],
});

const markersPlugin = viewer.getPlugin(MarkersPlugin);

viewer.addEventListener('ready', () => {
    viewer
        .animate({
            yaw: 0,
            pitch: 0.5,
            speed: 1000,
        })
        .then(() => {
            markersPlugin.showMarkerTooltip('custom-tooltip');
        });
}, { once: true });
```

```css:line-numbers [style.css]
.custom-tooltip {
    max-width: none;
    width: 300px;
    box-shadow: 0 0 0 3px white;
}

.custom-tooltip .psv-tooltip-content {
    padding: 0;
}

.custom-tooltip img {
    width: 100%;
    border-radius: 4px 4px 0 0;
}

.custom-tooltip h2,
.custom-tooltip p {
    margin: 1rem;
    text-align: justify;
}
```

```html [template.html]
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

::::
