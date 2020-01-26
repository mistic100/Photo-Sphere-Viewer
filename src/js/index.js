import * as utils from './utils';
import { DEFAULTS } from './data/config';
import { TEMPLATES } from './data/templates';
import { ICONS } from './data/icons';
import { SYSTEM } from './data/system';
import { PSVError } from './PSVError';
import { Animation } from './Animation';
import { Viewer } from './Viewer';
import { ViewerCompat } from './ViewerCompat';

export {
  Animation,
  DEFAULTS,
  ICONS,
  PSVError,
  SYSTEM,
  TEMPLATES,
  Viewer,
  ViewerCompat,
  utils
};


/**
 * @namespace PSV
 */

/**
 * @typedef {Object} PSV.Point
 * @summary Object defining a point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} PSV.Size
 * @summary Object defining a size
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} PSV.CssSize
 * @summary Object defining a size in CSS (px, % or auto)
 * @property {string} [width]
 * @property {string} [height]
 */

/**
 * @typedef {Object} PSV.SphereCorrection
 * @property {number} pan
 * @property {number} tilt
 * @property {number} roll
 */

/**
 * @typedef {Object} PSV.Position
 * @summary Object defining a spherical position
 * @property {number} longitude
 * @property {number} latitude
 */

/**
 * @typedef {PSV.Position} PSV.ExtendedPosition
 * @summary Object defining a spherical or texture position
 * @description A position that can be expressed either in spherical coordinates (radians or degrees) or in texture coordinates (pixels)
 * @property {number} [longitude]
 * @property {number} [latitude]
 * @property {number} [x]
 * @property {number} [y]
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.AnimateOptions
 * @summary Object defining animation options
 * @property {number} [zoom] - new zoom level between 0 and 100
 */

/**
 * @typedef {PSV.AnimateOptions} PSV.PanoramaOptions
 * @summary Object defining panorama and animation options
 * @property {PSV.SphereCorrection} [sphereCorrection] - new sphere correction to apply to the panorama
 * @property {boolean} [transition=true] - enable transition between all and new panorama
 */

/**
 * @typedef {Object} PSV.CacheItem
 * @summary An entry in the memory cache
 * @property {string} panorama
 * @property {external:THREE.Texture} image
 * @property {PSV.PanoData} panoData
 */

/**
 * @typedef {Object} PSV.TextureData
 * @summary Result of the {@link PSV.TextureLoader#loadTexture} method
 * @property {external:THREE.Texture|external:THREE.Texture[]} texture
 * @property {PSV.PanoData} [panoData]
 */

/**
 * @typedef {Object} PSV.PanoData
 * @summary Crop information of the panorama
 * @property {number} fullWidth
 * @property {number} fullHeight
 * @property {number} croppedWidth
 * @property {number} croppedHeight
 * @property {number} croppedX
 * @property {number} croppedX
 */

/**
 * @typedef {Object} PSV.ClickData
 * @summary Data of the `click` event
 * @property {number} clientX - position in the browser window
 * @property {number} clientY - position in the browser window
 * @property {number} viewerX - position in the viewer
 * @property {number} viewerY - position in the viewer
 * @property {number} longitude - position in spherical coordinates
 * @property {number} latitude - position in spherical coordinates
 * @property {number} textureX - position on the texture
 * @property {number} textureY - position on the texture
 * @property {PSV.Marker} [marker] - clicked marker
 */

/**
 * @typedef {Object} PSV.Options
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
 * @typedef {Object} external:uEvent.EventEmitter
 * @description {@link https://github.com/mistic100/uEvent#api}
 */
