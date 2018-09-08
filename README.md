# Photo Sphere Viewer

[![NPM version](https://img.shields.io/npm/v/photo-sphere-viewer.svg?style=flat-square)](https://www.npmjs.com/package/photo-sphere-viewer)
[![jsDelivr Hits](https://data.jsdelivr.com/v1/package/npm/photo-sphere-viewer/badge)](https://www.jsdelivr.com/package/npm/photo-sphere-viewer)
[![Build Status](https://img.shields.io/travis/mistic100/Photo-Sphere-Viewer/master.svg?style=flat-square)](https://travis-ci.org/mistic100/Photo-Sphere-Viewer)
[![Dependencies Status](https://david-dm.org/mistic100/Photo-Sphere-Viewer/status.svg?style=flat-square)](https://david-dm.org/mistic100/Photo-Sphere-Viewer)

Photo Sphere Viewer is a JavaScript library that allows you to display 360×180 degrees panoramas on any web page. Panoramas must use the equirectangular projection and can be taken with the Google Camera, the Ricoh Theta or any 360° camera.

Forked from [JeremyHeleine/Photo-Sphere-Viewer](https://github.com/JeremyHeleine/Photo-Sphere-Viewer).

## Documentation
[photo-sphere-viewer.js.org](https://photo-sphere-viewer.js.org)

## Dependencies

### Required
 * [three.js](https://threejs.org)
 * [doT.js](https://olado.github.io/doT)
 * [uEvent](https://github.com/mistic100/uEvent)

### Optionals
 * [promise-polyfill](https://github.com/taylorhakes/promise-polyfill) for IE compatibility
 * [three/CanvasRendered.js](https://github.com/mrdoob/three.js/blob/master/examples/js/renderers/CanvasRenderer.js) & [three/Projector.js](https://github.com/mrdoob/three.js/blob/master/examples/js/renderers/Projector.js) for browsers without WebGL
 * [three/DeviceOrientationControls.js](https://github.com/mrdoob/three.js/blob/master/examples/js/controls/DeviceOrientationControls.js) for gyroscope support
 * [three/StereoEffect.js](https://github.com/mrdoob/three.js/blob/master/examples/js/effects/StereoEffect.js) for VR support

## Install

#### Manually

[Download the latest release](https://github.com/mistic100/Photo-Sphere-Viewer/releases)

#### With Bower

```bash
$ bower install Photo-Sphere-Viewer
```

#### With npm

```bash
$ npm install photo-sphere-viewer
```

#### Via CDN

Photo Sphere Viewer is available on [jsDelivr](https://cdn.jsdelivr.net/npm/photo-sphere-viewer/dist/) and [unpkg](https://unpkg.com/photo-sphere-viewer/dist/)

## Build

#### Prerequisites
 * NodeJS + NPM: `apt-get install nodejs-legacy npm`

#### Run

Install Node dependencies `npm install` then run `npm run build` in the root directory to generate production files inside `dist`.

#### Other commands

 * `npm run test` to run jshint/jscs/scsslint.
 * `npm run serve` to open the example page with automatic build and livereload.
 * `npm run doc` to generate the documentation.

## License
This library is available under the MIT license.
