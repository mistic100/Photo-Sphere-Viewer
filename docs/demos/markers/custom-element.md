# Custom element

Use a custom WebComponent as marker.

:::: code-demo

```yaml
autoload: true
title: PSV Marker element Demo
packages:
    - name: markers-plugin
      style: true
```

::: code-group

``` js:line-numbers [CustomMarkerElement.js]
// declare the custom element
class CustomMarkerElement extends HTMLElement {
    constructor() {
        super();

        this.fmt = new Intl.NumberFormat({ maximumSignificantDigits: 4 });

        const dom = this.attachShadow({ mode: 'closed' });

        const style = document.createElement('style');
        style.innerText = `
:host {
    display: block;
    position: relative;
    width: 50px;
    height: 50px;
}

button {
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    color: white;
    border-radius: 50%;
    filter: drop-shadow(0 10px 5px rgba(0, 0, 0, 0.2));
}

.tooltip {
    box-sizing: border-box;
    width: 300px;
    position: absolute;
    bottom: calc(100% + 10px);
    left: calc(50% -  150px);
    background: rgba(30, 30, 30, 0.8);
    color: white;
    text-shadow: 0 1px #000;
    border-radius: 10px;
    transform-origin: 50% calc(100% + 35px);
    transform: rotate(30deg);
    opacity: 0;
}
.tooltip.bottom {
    bottom: auto;
    top: calc(100% + 10px);
    transform-origin: 50% -35px;
}

.tooltip.hovered {
    animation: rotate-bounce-out 200ms ease forwards;
}

.tooltip slot::slotted(img) {
    width: 100%;
    border-radius: 10px 10px 0 0;
}
.tooltip slot::slotted(h2),
.tooltip slot::slotted(p) {
    margin: 1rem;
    text-align: justify;
}
.tooltip pre {
    font-size: 0.8em;
    margin: 1rem;
}

.tooltip::after {
    content: '';
    width: 0px;
    height: 0px;
    color: rgba(30, 30, 30, 0.8);
    border: 10px solid transparent;
    border-top-color: currentColor;
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -10px;
}
.tooltip.bottom::after {
    border-top-color: transparent;
    border-bottom-color: currentColor;
    top: auto;
    bottom: 100%;
}

button:hover {
    animation: ripple 1s ease-out;
}

.tooltip.hiding {
    animation: hide 200ms ease forwards;
}

button:hover + .tooltip {
    animation: show 300ms ease forwards;
}

@keyframes ripple {
    0% { box-shadow: 0 0 0 0 rgba(97, 170, 242, 0); }
    20% { box-shadow: 0 0 0 5px rgba(97, 170, 242, 1); }
    100% { box-shadow: 0 0 0 20px rgba(97, 170, 242, 0); }
}
@keyframes show {
    0% { transform: rotate(30deg); opacity: 0; }
    70% { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); opacity: 1; }
}
@keyframes hide {
    0% { transform: rotate(0deg); opacity: 1; }
    100% { transform: rotate(30deg); opacity: 0; }
}
`;
        dom.appendChild(style);

        const button = document.createElement('button');
        button.innerHTML = `<svg viewBox="0 0 100 100">
<circle cx=50 cy=50 r=25 fill="currentColor"/>
<circle cx=50 cy=50 r=40 stroke-width=10 fill="none" stroke="currentColor"/>
</svg>`;
        dom.appendChild(button);

        this.tooltip = document.createElement('div');
        this.tooltip.classList.add('tooltip');
        dom.appendChild(this.tooltip);
        this.tooltip.innerHTML = '<slot></slot>';

        this.legend = document.createElement('pre');
        this.tooltip.appendChild(this.legend);

        button.addEventListener('mouseleave', () => {
            this.tooltip.classList.add('hiding');
        });

        dom.addEventListener('animationend', () => {
            this.tooltip.classList.remove('hiding');
        });
    }

    updateMarker({ marker, position, viewerPosition, zoomLevel, viewerSize }) {
        this.legend.innerText = `Params
position: ${position.x}px x ${position.y}px
viewerPosition: ${this.fmt.format(viewerPosition.yaw)}rad / ${this.fmt.format(viewerPosition.pitch)}rad
zoomLevel: ${zoomLevel}%
viewerSize: ${viewerSize.width}px x ${viewerSize.height}px
`;
        this.tooltip.classList.toggle('bottom', position.y < viewerSize.height / 3);
    }
}

// register the custom element
customElements.define('custom-marker', CustomMarkerElement);
```

```js:line-numbers{15-16} [viewer.js]
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
                id: 'element',
                // get the custom element instance
                element: document.querySelector('#custom-marker-element'),
                listContent: 'Custom element',
                position: { yaw: 0, pitch: -0.3 },
                zIndex: 10,
            }],
        }),
    ],
});
```

```html [template.html]
<custom-marker id="custom-marker-element" style="display: none">
    <img src="https://photo-sphere-viewer-data.netlify.app/assets/sphere-small.jpg" />
    <h2>Custom element</h2>
    <p>Use an existing element as marker. This WebComponent contains it's own animations and tooltip.</p>
</custom-marker>
```

:::

::::
