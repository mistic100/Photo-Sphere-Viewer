# Custom navbar

Customize the navbar with default and custom buttons.

::: code-demo

```yaml
title: PSV Navbar Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new PhotoSphereViewer.Viewer({
  container: 'viewer',
  panorama: baseUrl + 'sphere.jpg',
  caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
  navbar: [
    'zoom',
    'move',
    {
      title    : 'Change image',
      content  : document.querySelector('#icon').innerText,
      onClick  : function () {
        this.setPanorama(baseUrl + 'sphere-test.jpg', {
          caption    : '',
          description: null,
        });
      },
    },
    'caption',
    'fullscreen',
  ],
});
```

```html
<script type="text/template" id="icon">
<svg viewBox="160 160 432 432" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M376 162.89c-117.52 0-213.11 95.6-213.11 213.11 0 117.52 95.6 213.11 213.11 213.11 117.52 0 213.11-95.6 213.11-213.11 0-117.52-95.6-213.11-213.12-213.11zm0 390.7c-97.92 0-177.6-79.67-177.6-177.59S278.08 198.41 376 198.41c97.92 0 177.6 79.67 177.6 177.59S473.92 553.59 376 553.59zm149.43-195.35-25.1 25.1-17.77-17.75V376c0 58.77-47.8 106.56-106.55 106.56S269.45 434.75 269.45 376 317.25 269.45 376 269.45c20.8 0 40.16 6.07 56.57 16.4l-26.18 26.2a70.24 70.24 0 0 0-30.39-7.08c-39.16 0-71.04 31.86-71.04 71.04 0 39.17 31.88 71.03 71.04 71.03s71.05-31.86 71.05-71.04c0-3.24-.54-6.33-.97-9.45l-16.8 16.8-24.9-24.9L465 297.82z"/></svg>
</script>
```

:::
