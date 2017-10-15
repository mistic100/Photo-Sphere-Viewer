# Photo Sphere Viewer

[![Bower version](https://img.shields.io/bower/v/Photo-Sphere-Viewer.svg?style=flat-square)](http://photo-sphere-viewer.js.org)
[![NPM version](https://img.shields.io/npm/v/photo-sphere-viewer.svg?style=flat-square)](https://www.npmjs.com/package/photo-sphere-viewer)
[![jsDelivr Hits](https://data.jsdelivr.com/v1/package/npm/photo-sphere-viewer/badge)](https://www.jsdelivr.com/package/npm/photo-sphere-viewer)
[![Build Status](https://img.shields.io/travis/mistic100/Photo-Sphere-Viewer/master.svg?style=flat-square)](https://travis-ci.org/mistic100/Photo-Sphere-Viewer)
[![Dependencies Status](https://david-dm.org/mistic100/Photo-Sphere-Viewer/status.svg?style=flat-square)](https://david-dm.org/mistic100/Photo-Sphere-Viewer)

Photo Sphere Viewer is a JavaScript library that allows you to display 360×180 degrees panoramas on any web page. Panoramas must use the equirectangular projection and can be taken with the Google Camera, the Ricoh Theta or any 360° camera.

Forked from [JeremyHeleine/Photo-Sphere-Viewer](https://github.com/JeremyHeleine/Photo-Sphere-Viewer).

## Documentation
[photo-sphere-viewer.js.org](http://photo-sphere-viewer.js.org)

## Dependencies
 * [three.js](http://threejs.org)
 * [doT.js](http://olado.github.io/doT)
 * [uEvent](https://github.com/mistic100/uEvent)
 * [D.js](http://malko.github.io/D.js)

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
 * Grunt CLI: `npm install -g grunt-cli`
 * Bower: `npm install -g bower`

#### Run

Install Node and Bower dependencies `npm install & bower install` then run `grunt` in the root directory to generate production files inside `dist`.

#### Other commands

 * `grunt test` to run jshint/jscs/scsslint.
 * `grunt serve` to open the example page with automatic build and livereload.
 * `grunt jsdoc` to generate the documentation.

## License
This library is available under the MIT license.
