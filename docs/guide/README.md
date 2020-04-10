# Getting Started

[[toc]]

::: danger New version
Photo Sphere Viewer 4 is not compatible with previous versions. If you are using version 3 , please follow the [migration guide](./migration-v3.html). You can also read the [version 3 documentation](https://photo-sphere-viewer-3.netlify.com).
:::

## Install Photo Sphere Viewer

#### With npm or yarn

```bash
npm install photo-sphere-viewer

yarn add photo-sphere-viewer
```

#### Via CDN

Photo Sphere Viewer is available on [jsDelivr](https://www.jsdelivr.com/package/npm/photo-sphere-viewer)

#### Manually

You can also [download the latest release](https://github.com/mistic100/Photo-Sphere-Viewer/releases)

## Dependencies

#### Required
 * [three.js](https://threejs.org) (use `build/three.min.js` file)
 * [uEvent 2](https://github.com/mistic100/uEvent) (use `browser.js` file)

#### Optionals
 * [promise-polyfill](https://github.com/taylorhakes/promise-polyfill) for IE compatibility (use `dist/polyfill.min.js` file)


## Your first viewer

Include all JS & CSS files in your page manually or with your favorite bundler and init the viewer.

The `panorama` must be an [equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection) of your photo. You can also use [cubemap projection](cubemap) with a special syntax.

:::: tabs

::: tab "Direct import"
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/photo-sphere-viewer.min.css"/>

<script src="https://cdn.jsdelivr.net/npm/three/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/uevent@2/browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/photo-sphere-viewer.min.js"></script>

<div id="viewer"></div>

<style>
  /* the viewer container must have a defined size */
  #viewer {
    width: 100vw;
    height: 50vh;
  }
</style>

<script>
  var viewer = new PhotoSphereViewer.Viewer({
    container: document.querySelector('#viewer'),
    panorama: 'path/to/panorama.jpg'
  });
</script>
```
:::

::: tab "ES import"
Import `photo-sphere-viewer/dist/photo-sphere-viewer.css` with the prefered way depending on your tooling.

```html
<div id="viewer"></div>

<style>
  /* the viewer container must have a defined size */
  #viewer {
    width: 100vw;
    height: 50vh;
  }
</style>
```

```js
import { Viewer } from 'photo-sphere-viewer';

const viewer = new Viewer({
  container: document.querySelector('#viewer'),
  panorama: 'path/to/panorama.jpg'
});
```
:::

::::

---

::: tip Cropped panoramas
If your image is not covering a full 360°×180° sphere, it will be deformed. You can fix it by providing [cropping data](./cropped-panorama).
:::

::: tip Caching
Previous version of Photo Sphere Viewer had a caching system, which was buggy and thus disabled by default.

Photo Sphere Viewer 4 uses [THREE.js Cache](https://threejs.org/docs/index.html#api/en/loaders/Cache), enabled by default. You can disable this cache by calling `THREE.Cache.enabled = false;` after importing Photo Sphere Viewer.
:::
