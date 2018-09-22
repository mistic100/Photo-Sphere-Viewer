import * as uEvent from 'uevent';
import * as utils from './utils';
import * as constants from './data/constants';
import { DEFAULTS } from './data/config';
import { TEMPLATES } from './data/templates';
import { ICONS } from './data/icons';
import { SYSTEM } from './data/system';
import { PSVError } from './PSVError';
import { PSVAnimation } from './PSVAnimation';
import { PhotoSphereViewer } from './PhotoSphereViewer';

/**
 * @typedef {Object} PhotoSphereViewer.Point
 * @summary Object defining a point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} PhotoSphereViewer.Size
 * @summary Object defining a size
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} PhotoSphereViewer.CssSize
 * @summary Object defining a size in CSS (px, % or auto)
 * @property {string} [width]
 * @property {string} [height]
 */

/**
 * @typedef {Object} PhotoSphereViewer.SphereCorrection
 * @property {number} pan
 * @property {number} tilt
 * @property {number} roll
 */

/**
 * @typedef {Object} PhotoSphereViewer.Position
 * @summary Object defining a spherical position
 * @property {number} longitude
 * @property {number} latitude
 */

/**
 * @typedef {PhotoSphereViewer.Position} PhotoSphereViewer.ExtendedPosition
 * @summary Object defining a spherical or texture position
 * @description A position that can be expressed either in spherical coordinates (radians or degrees) or in texture coordinates (pixels)
 * @property {number} [longitude]
 * @property {number} [latitude]
 * @property {number} [x]
 * @property {number} [y]
 */

/**
 * @typedef {PhotoSphereViewer.ExtendedPosition} PhotoSphereViewer.AnimateOptions
 * @summary Object defining animation options
 * @property {number} [zoom] - new zoom level between 0 and 100
 */

/**
 * @typedef {PhotoSphereViewer.AnimateOptions} PhotoSphereViewer.PanoramaOptions
 * @summary Object defining panorama and animation options
 * @property {PhotoSphereViewer.SphereCorrection} [sphereCorrection] - new sphere correction to apply to the panorama
 * @property {boolean} [transition=true] - enable transition between all and new panorama
 */

/**
 * @typedef {Object} PhotoSphereViewer.CacheItem
 * @summary An entry in the memory cache
 * @property {string} panorama
 * @property {external:THREE.Texture} image
 * @property {PhotoSphereViewer.PanoData} panoData
 */

/**
 * @typedef {Object} PhotoSphereViewer.TextureData
 * @summary Result of the {@link PSVTextureLoader#loadTexture} method
 * @property {external:THREE.Texture|external:THREE.Texture[]} texture
 * @property {PhotoSphereViewer.PanoData} [panoData]
 */

/**
 * @typedef {Object} PhotoSphereViewer.PanoData
 * @summary Crop information of the panorama
 * @property {number} fullWidth
 * @property {number} fullHeight
 * @property {number} croppedWidth
 * @property {number} croppedHeight
 * @property {number} croppedX
 * @property {number} croppedX
 */

/**
 * @typedef {Object} PhotoSphereViewer.ClickData
 * @summary Data of the `click` event
 * @property {number} clientX - position in the browser window
 * @property {number} clientY - position in the browser window
 * @property {number} viewerX - position in the viewer
 * @property {number} viewerY - position in the viewer
 * @property {number} longitude - position in spherical coordinates
 * @property {number} latitude - position in spherical coordinates
 * @property {number} textureX - position on the texture
 * @property {number} textureY - position on the texture
 * @property {PSVMarker} [marker] - clicked marker
 */

/**
 * @typedef {Object} PhotoSphereViewer.Options
 * @summary Viewer options, see {@link http://photo-sphere-viewer.js.org/#options}
 */

/**
 * @external NoSleep
 * @description {@link https://github.com/richtr/NoSleep.js}
 */

/**
 * @external THREE
 * @description {@link https://threejs.org}
 */

/**
 * @typedef {Object} external:THREE.Vector3
 * @summary {@link https://threejs.org/docs/index.html#api/en/math/Vector3}
 */

/**
 * @typedef {Object} external:THREE.Texture
 * @summary {@link https://threejs.org/docs/index.html#api/en/textures/Texture}
 */

/**
 * @typedef {Object} external:THREE.Scene
 * @summary {@link https://threejs.org/docs/index.html#api/en/scenes/Scene}
 */

/**
 * @typedef {Object} external:THREE.WebGLRenderer
 * @summary {@link https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer}
 */

/**
 * @typedef {Object} external:THREE.CanvasRenderer
 * @summary {@link https://github.com/mrdoob/three.js/blob/r97/examples/js/renderers/CanvasRenderer.js}
 */

/**
 * @typedef {Object} external:THREE.StereoEffect
 * @summary {@link https://github.com/mrdoob/three.js/blob/dev/examples/js/effects/StereoEffect.js}
 */

/**
 * @typedef {Object} external:THREE.PerspectiveCamera
 * @summary {@link https://threejs.org/docs/index.html#api/en/cameras/PerspectiveCamera}
 */

/**
 * @typedef {Object} external:THREE.Mesh
 * @summary {@link https://threejs.org/docs/index.html#api/en/objects/Mesh}
 */

/**
 * @typedef {Object} external:THREE.Raycaster
 * @summary {@link https://threejs.org/docs/index.html#api/en/core/Raycaster}
 */

/**
 * @typedef {Object} external:THREE.DeviceOrientationControls
 * @summary {@link https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/DeviceOrientationControls.js}
 */

/**
 * @external uEvent
 * @description {@link https://github.com/mistic100/uEvent}
 */

/**
 * @typedef {Object} external:uEvent.Event
 * @property {string} type
 * @property {Array} args
 */

/**
 * @summary Triggers an event on the viewer
 * @function trigger
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string} name
 * @param {...*} [arguments]
 * @returns {external:uEvent.Event}
 */

/**
 * @summary Triggers an event on the viewer and returns the modified value
 * @function change
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string} name
 * @param {*} value
 * @param {...*} [arguments]
 * @returns {*}
 */

/**
 * @summary Attaches an event listener on the viewer
 * @function on
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string|Object<string, function>} name - event name or events map
 * @param {function} [callback]
 * @returns {PhotoSphereViewer}
 */

/**
 * @summary Removes an event listener from the viewer
 * @function off
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string|Object<string, function>} name - event name or events map
 * @param {function} [callback]
 * @returns {PhotoSphereViewer}
 */

/**
 * @summary Attaches an event listener called once on the viewer
 * @function once
 * @memberof PhotoSphereViewer
 * @instance
 * @param {string|Object<string, function>} name - event name or events map
 * @param {function} [callback]
 * @returns {PhotoSphereViewer}
 */

PhotoSphereViewer.Utils = utils;
PhotoSphereViewer.CONSTANTS = constants;
PhotoSphereViewer.DEFAULTS = DEFAULTS;
PhotoSphereViewer.TEMPLATES = TEMPLATES;
PhotoSphereViewer.ICONS = ICONS;
PhotoSphereViewer.SYSTEM = SYSTEM;
PhotoSphereViewer.PSVError = PSVError;
PhotoSphereViewer.PSVAnimation = PSVAnimation;

uEvent.mixin(PhotoSphereViewer);

export default PhotoSphereViewer;
