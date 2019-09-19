# Photo Sphere Viewer

[![NPM version](https://img.shields.io/npm/v/photo-sphere-viewer.svg)](https://www.npmjs.com/package/photo-sphere-viewer)
[![jsDelivr Hits](https://data.jsdelivr.com/v1/package/npm/photo-sphere-viewer/badge?style=rounded)](https://www.jsdelivr.com/package/npm/photo-sphere-viewer)
[![Build Status](https://github.com/mistic100/Photo-Sphere-Viewer/workflows/CI/badge.svg)](https://github.com/mistic100/Photo-Sphere-Viewer/actions)
[![Dependencies Status](https://david-dm.org/mistic100/Photo-Sphere-Viewer/status.svg)](https://david-dm.org/mistic100/Photo-Sphere-Viewer)

Photo Sphere Viewer is a JavaScript library that allows you to display 360×180 degrees panoramas on any web page. Panoramas must use the equirectangular projection and can be taken with the Google Camera, the Ricoh Theta or any 360° camera.

Forked from [JeremyHeleine/Photo-Sphere-Viewer](https://github.com/JeremyHeleine/Photo-Sphere-Viewer).

## Documentation
[photo-sphere-viewer.js.org](https://photo-sphere-viewer.js.org)

## Dependencies

### Required
 * [three.js](https://threejs.org)
 * [uEvent](https://github.com/mistic100/uEvent)

### Optionals
 * [promise-polyfill](https://github.com/taylorhakes/promise-polyfill) for IE compatibility
 * [three/CanvasRendered.js](https://github.com/mrdoob/three.js/blob/master/examples/js/renderers/CanvasRenderer.js) & [three/Projector.js](https://github.com/mrdoob/three.js/blob/master/examples/js/renderers/Projector.js) for browsers without WebGL
 * [three/DeviceOrientationControls.js](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/DeviceOrientationControls.js) for gyroscope support
 * [three/StereoEffect.js](https://github.com/mrdoob/three.js/blob/master/examples/js/effects/StereoEffect.js) for VR support
 * [NoSleep.js](https://github.com/richtr/NoSleep.js) for better VR experience

## Install

#### Manually

[Download the latest release](https://github.com/mistic100/Photo-Sphere-Viewer/releases)

#### With npm

```bash
$ npm install photo-sphere-viewer
```

#### Via CDN

Photo Sphere Viewer is available on [jsDelivr](https://cdn.jsdelivr.net/npm/photo-sphere-viewer/dist/)

## License
This library is available under the MIT license.
