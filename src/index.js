import { AbstractAdapter } from './adapters/AbstractAdapter';
import { EquirectangularAdapter } from './adapters/equirectangular';
import { AbstractButton } from './buttons/AbstractButton';
import { AbstractComponent } from './components/AbstractComponent';
import { registerButton } from './components/Navbar';
import { DEFAULTS } from './data/config';
import * as CONSTANTS from './data/constants';
import './data/constants'; // for jsdoc
import { SYSTEM } from './data/system';
import { AbstractPlugin } from './plugins/AbstractPlugin';
import { PSVError } from './PSVError';
import * as utils from './utils';
import { Viewer } from './Viewer';
import './styles/index.scss';

export {
  AbstractAdapter,
  AbstractButton,
  AbstractComponent,
  AbstractPlugin,
  CONSTANTS,
  DEFAULTS,
  EquirectangularAdapter,
  PSVError,
  registerButton,
  SYSTEM,
  utils,
  Viewer
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
 * @summary Object defining a size in CSS
 * @property {string} [width]
 * @property {string} [height]
 */

/**
 * @typedef {Object} PSV.SphereCorrection
 * @summary Object defining angular corrections to a sphere
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
 * @typedef {PSV.Position | PSV.Point} PSV.ExtendedPosition
 * @summary Object defining a spherical or texture position
 * @description A position that can be expressed either in spherical coordinates (radians or degrees) or in texture coordinates (pixels)
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.AnimateOptions
 * @summary Object defining animation options
 * @property {number|string} speed - animation speed or duration in milliseconds
 * @property {number} [zoom] - new zoom level between 0 and 100
 */

/**
 * @typedef {Object} PSV.PanoData
 * @summary Crop information of the panorama
 * @property {number} fullWidth
 * @property {number} fullHeight
 * @property {number} croppedWidth
 * @property {number} croppedHeight
 * @property {number} croppedX
 * @property {number} croppedY
 * @property {number} [poseHeading]
 * @property {number} [posePitch]
 * @property {number} [poseRoll]
 */

/**
 * @callback PanoDataProvider
 * @summary Function to compute panorama data once the image is loaded
 * @memberOf PSV
 * @param {Image} image - loaded image
 * @returns {PSV.PanoData} computed panorama data
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.PanoramaOptions
 * @summary Object defining panorama and animation options
 * @property {string} [caption] - new navbar caption
 * @property {string} [description] - new panel description
 * @property {boolean|number} [transition=1500] - duration of the transition between all and new panorama
 * @property {boolean} [showLoader=true] - show the loader while loading the new panorama
 * @property {number} [zoom] - new zoom level between 0 and 100
 * @property {PSV.SphereCorrection} [sphereCorrection] - new sphere correction to apply to the panorama
 * @property {PSV.PanoData | PSV.PanoDataProvider} [panoData] - new data used for this panorama
 * @property {*} [overlay] - new overlay to apply to the panorama
 * @property {number} [overlayOpacity] - new overlay opacity
 */

/**
 * @typedef {Object} PSV.TextureData
 * @summary Result of the {@link PSV.adapters.AbstractAdapter#loadTexture} method
 * @property {*} panorama
 * @property {external:THREE.Texture|external:THREE.Texture[]|Record<string, external:THREE.Texture[]>} texture
 * @property {PSV.PanoData} [panoData]
 */

/**
 * @typedef {Object} PSV.ClickData
 * @summary Data of the `click` event
 * @property {boolean} rightclick - if it's a right click
 * @property {number} clientX - position in the browser window
 * @property {number} clientY - position in the browser window
 * @property {number} viewerX - position in the viewer
 * @property {number} viewerY - position in the viewer
 * @property {number} longitude - position in spherical coordinates
 * @property {number} latitude - position in spherical coordinates
 * @property {number} [textureX] - position on the texture, if applicable
 * @property {number} [textureY] - position on the texture, if applicable
 * @property {PSV.plugins.MarkersPlugin.Marker} [marker] - clicked marker
 * @property {THREE.Object3D[]} [objects]
 * @property {EventTarget} [target]
 */

/**
 * @typedef {Object} PSV.NavbarCustomButton
 * @summary Definition of a custom navbar button
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [content]
 * @property {string} [className]
 * @property {function} onClick
 * @property {boolean} [disabled=false]
 * @property {boolean} [visible=true]
 * @property {boolean} [collapsable=true]
 * @property {boolean} [tabbable=true]
 */

/**
 * @typedef {Object} PSV.Options
 * @summary Viewer options, see {@link https://photo-sphere-viewer.js.org/guide/config.html}
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
 * @typedef {Object} external:THREE.Euler
 * @summary {@link https://threejs.org/docs/index.html#api/en/math/Euler}
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
 * @external uEvent
 * @description {@link https://github.com/mistic100/uEvent}
 */

/**
 * @typedef {Object} external:uEvent.EventEmitter
 * @description {@link https://github.com/mistic100/uEvent#api}
 */
