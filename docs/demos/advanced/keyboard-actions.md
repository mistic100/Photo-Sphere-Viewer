# Keyboard actions

Add custom actions on keyboard presses with [`keyboardActions`](../../guide/config.md#keyboardactions).

:::: code-demo

```yaml
autoload: true
title: PSV Keyboard actions Demo
```

::: code-group

```js:line-numbers [viewer.js]
import { Viewer, DEFAULTS } from '@photo-sphere-viewer/core';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    keyboard: 'always',
    keyboardActions: {
        ...DEFAULTS.keyboardActions,
        'h': (viewer, evt) => {
            if (viewer.panel.isVisible('help')) {
                viewer.panel.hide();
            } else {
                viewer.panel.show({
                    id: 'help',
                    content: document.querySelector('#help-content').innerText,
                });
            }
        },
        'f': (viewer, evt) => {
            if (!evt.ctrlKey && !evt.altKey) {
                viewer.toggleFullscreen();
            }
        },
    },
});

viewer.notification.show(`Press H to display the help panel, and F to toggle fullscreen`);

// REMOVE THIS (only to make it working inside the demo iframe)
window.parent.addEventListener('keydown', e => viewer.eventsHandler.handleEvent(e));
window.parent.addEventListener('keyup', e => viewer.eventsHandler.handleEvent(e));
```

```html [template.html]
<script type="text/template" id="help-content">
    <p><strong>Pellentesque habitant morbi tristique</strong> senectus et netus et malesuada fames ac turpis egestas.
      Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam
      egestas semper. <em>Aenean ultricies mi vitae est.</em> Mauris placerat eleifend leo. Quisque sit amet est et
      sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, <code>commodo vitae</code>, ornare sit amet,
      wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac
      dui. <a href="#">Donec non enim</a> in turpis pulvinar facilisis. Ut felis.</p>
</script>
```

:::

::::
