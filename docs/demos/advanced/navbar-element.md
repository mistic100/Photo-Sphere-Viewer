# Navbar element

Use a custom WebComponent in the [navbar](../../guide/navbar.md). This example implements a custom zoom control.

:::: code-demo

```yaml
autoload: true
title: PSV Navbar element Demo
```

::: code-group

```js:line-numbers [CustomNavbarButton.js]
// declare the custom element
class CustomNavbarButton extends HTMLElement {
    constructor() {
        super();

        const dom = this.attachShadow({ mode: 'closed' });

        const style = document.createElement('style');
        style.innerText = `
:host {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 0 10px;
}

#title {
    font-weight: bold;
}

input {
    margin: 0 10px;
}

#value {
    font-family: monospace;
    width: 2em;
}
`;
        dom.appendChild(style);

        const title = document.createElement('span');
        title.id = 'title';
        title.innerText = 'Zoom';
        dom.appendChild(title);

        this.input = document.createElement('input');
        this.input.type = 'range';
        dom.appendChild(this.input);

        this.value = document.createElement('span');
        this.value.id = 'value';
        dom.appendChild(this.value);

        this.input.addEventListener('input', () => {
            this.viewer.zoom(this.input.valueAsNumber);
        });
    }

    onUpdate() {
        this.input.value = this.viewer.getZoomLevel();
        this.value.innerText = this.input.valueAsNumber;
    }

    attachViewer(viewer) {
        this.viewer = viewer;
        this.onUpdate();
        viewer.addEventListener('zoom-updated', () => this.onUpdate());
    }
}

// register the custom element
customElements.define('custom-navbar-button', CustomNavbarButton);
```

```js:line-numbers [viewer.js]
import { Viewer } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    navbar: [
        {
            // instanciate the custom element
            content: document.createElement('custom-navbar-button'),
        },
        'caption',
        'fullscreen',
    ],
});
```

:::

::::
