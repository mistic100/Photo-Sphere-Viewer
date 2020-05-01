import * as THREE from 'three';
import { Animation } from '../Animation';
import { CUBE_VERTICES, EVENTS, SPHERE_RADIUS, SPHERE_VERTICES } from '../data/constants';
import { SYSTEM } from '../data/system';
import { logWarn } from '../utils';
import { AbstractService } from './AbstractService';

/**
 * @summary Viewer and renderer
 * @extends PSV.services.AbstractService
 * @memberof PSV.services
 */
export class Renderer extends AbstractService {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @member {number}
     * @private
     */
    this.mainReqid = undefined;

    /**
     * @member {external:THREE.WebGLRenderer}
     * @readonly
     * @protected
     */
    this.renderer = null;

    /**
     * @member {external:THREE.Scene}
     * @readonly
     * @protected
     */
    this.scene = null;

    /**
     * @member {external:THREE.PerspectiveCamera}
     * @readonly
     * @protected
     */
    this.camera = null;

    /**
     * @member {external:THREE.Mesh}
     * @readonly
     * @protected
     */
    this.mesh = null;

    /**
     * @member {external:THREE.Raycaster}
     * @readonly
     * @protected
     */
    this.raycaster = null;

    /**
     * @member {HTMLElement}
     * @readonly
     * @protected
     */
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'psv-canvas-container';
    this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
    this.psv.container.appendChild(this.canvasContainer);

    psv.on(EVENTS.SIZE_UPDATED, (e, size) => {
      if (this.renderer) {
        this.renderer.setSize(size.width, size.height);
      }
    });

    psv.on(EVENTS.CONFIG_CHANGED, () => {
      this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
    });

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    // cancel render loop
    if (this.mainReqid) {
      window.cancelAnimationFrame(this.mainReqid);
    }

    // destroy ThreeJS view
    if (this.scene) {
      this.__cleanTHREEScene(this.scene);
    }

    // remove container
    this.psv.container.removeChild(this.canvasContainer);

    delete this.canvasContainer;
    delete this.renderer;
    delete this.scene;
    delete this.camera;
    delete this.mesh;
    delete this.raycaster;

    super.destroy();
  }

  /**
   * @summary Hides the viewer
   */
  hide() {
    this.canvasContainer.style.opacity = 0;
  }

  /**
   * @summary Shows the viewer
   */
  show() {
    this.canvasContainer.style.opacity = 1;
  }

  /**
   * @summary Main event loop, calls {@link render} if `prop.needsUpdate` is true
   * @param {number} timestamp
   * @fires PSV.before-render
   * @package
   */
  __renderLoop(timestamp) {
    this.psv.trigger(EVENTS.BEFORE_RENDER, timestamp);

    if (this.prop.needsUpdate) {
      this.render();
      this.prop.needsUpdate = false;
    }

    this.mainReqid = window.requestAnimationFrame(t => this.__renderLoop(t));
  }

  /**
   * @summary Performs a render
   * @description Do not call this method directly, instead call
   * {@link PSV.Viewer#needsUpdate} on {@link PSV.event:before-render}.
   * @fires PSV.render
   */
  render() {
    this.prop.direction = this.psv.dataHelper.sphericalCoordsToVector3(this.prop.position);
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(this.prop.direction);

    if (this.config.fisheye) {
      this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
    }

    this.camera.aspect = this.prop.aspect;
    this.camera.fov = this.prop.vFov;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);

    this.psv.trigger(EVENTS.RENDER);
  }

  /**
   * @summary Applies the texture to the scene, creates the scene if needed
   * @param {PSV.TextureData} textureData
   * @fires PSV.panorama-loaded
   * @package
   */
  setTexture(textureData) {
    const { texture, panoData } = textureData;
    this.prop.panoData = panoData;

    if (!this.scene) {
      this.__createScene();
    }

    if (this.prop.isCubemap) {
      for (let i = 0; i < 6; i++) {
        if (this.mesh.material[i].map) {
          this.mesh.material[i].map.dispose();
        }

        this.mesh.material[i].map = texture[i];
      }
    }
    else {
      if (this.mesh.material.map) {
        this.mesh.material.map.dispose();
      }

      this.mesh.material.map = texture;
    }

    this.psv.needsUpdate();

    this.psv.trigger(EVENTS.PANORAMA_LOADED);
  }

  /**
   * @summary Apply a SphereCorrection to a Mesh
   * @param {PSV.SphereCorrection} sphereCorrection
   * @param {external:THREE.Mesh} [mesh=this.mesh]
   * @package
   */
  setSphereCorrection(sphereCorrection, mesh = this.mesh) {
    const cleanCorrection = this.psv.dataHelper.cleanSphereCorrection(sphereCorrection);

    mesh.rotation.set(
      cleanCorrection.tilt,
      cleanCorrection.pan,
      cleanCorrection.roll
    );
  }

  /**
   * @summary Creates the 3D scene and GUI components
   * @private
   */
  __createScene() {
    this.raycaster = new THREE.Raycaster();

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.prop.size.width, this.prop.size.height);
    this.renderer.setPixelRatio(SYSTEM.pixelRatio);

    this.camera = new THREE.PerspectiveCamera(this.prop.vFov, this.prop.size.width / this.prop.size.height, 1, 3 * SPHERE_RADIUS);
    this.camera.position.set(0, 0, 0);

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    if (this.prop.isCubemap) {
      this.mesh = this.__createCubemap();
    }
    else {
      this.mesh = this.__createSphere();
    }

    this.scene.add(this.mesh);

    // create canvas container
    this.renderer.domElement.className = 'psv-canvas';
    this.canvasContainer.appendChild(this.renderer.domElement);
  }

  /**
   * @summary Creates the sphere mesh
   * @param {number} [scale=1]
   * @returns {external:THREE.Mesh}
   * @private
   */
  __createSphere(scale = 1) {
    // The middle of the panorama is placed at longitude=0
    const geometry = new THREE.SphereGeometry(SPHERE_RADIUS * scale, SPHERE_VERTICES, SPHERE_VERTICES, -Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(-1, 1, 1);

    return mesh;
  }

  /**
   * @summary Creates the cube mesh
   * @param {number} [scale=1]
   * @returns {external:THREE.Mesh}
   * @private
   */
  __createCubemap(scale = 1) {
    const cubeSize = SPHERE_RADIUS * 2 * scale;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_VERTICES, CUBE_VERTICES, CUBE_VERTICES);

    const materials = [];
    for (let i = 0; i < 6; i++) {
      materials.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
      }));
    }

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.scale.set(1, 1, -1);

    return mesh;
  }

  /**
   * @summary Performs transition between the current and a new texture
   * @param {PSV.TextureData} textureData
   * @param {PSV.PanoramaOptions} options
   * @returns {PSV.Animation}
   * @package
   */
  transition(textureData, options) {
    const { texture } = textureData;

    let positionProvided = this.psv.dataHelper.isExtendedPosition(options);
    const zoomProvided = 'zoom' in options;

    let mesh;

    if (this.prop.isCubemap) {
      if (positionProvided) {
        logWarn('cannot perform cubemap transition to different position');
        positionProvided = false;
      }

      mesh = this.__createCubemap(0.9);

      mesh.material.forEach((material, i) => {
        material.map = texture[i];
        material.transparent = true;
        material.opacity = 0;
      });
    }
    else {
      mesh = this.__createSphere(0.9);

      mesh.material.map = texture;
      mesh.material.transparent = true;
      mesh.material.opacity = 0;

      if (options.sphereCorrection) {
        this.setSphereCorrection(options.sphereCorrection, mesh);
      }
    }

    // rotate the new sphere to make the target position face the camera
    if (positionProvided) {
      const cleanPosition = this.psv.dataHelper.cleanPosition(options);

      // Longitude rotation along the vertical axis
      const verticalAxis = new THREE.Vector3(0, 1, 0);
      mesh.rotateOnWorldAxis(verticalAxis, cleanPosition.longitude - this.prop.position.longitude);

      // Latitude rotation along the camera horizontal axis
      const horizontalAxis = new THREE.Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new THREE.Vector3())).normalize();
      mesh.rotateOnWorldAxis(horizontalAxis, cleanPosition.latitude - this.prop.position.latitude);

      // TODO: find a better way to handle ranges
      if (this.config.latitudeRange || this.config.longitudeRange) {
        this.config.longitudeRange = null;
        this.config.latitudeRange = null;
        logWarn('trying to perform transition with longitudeRange and/or latitudeRange, ranges cleared');
      }
    }

    this.scene.add(mesh);
    this.psv.needsUpdate();

    return new Animation({
      properties: {
        opacity: { start: 0.0, end: 1.0 },
        zoom   : zoomProvided ? { start: this.prop.zoomLvl, end: options.zoom } : undefined,
      },
      duration  : options.transition,
      easing    : 'outCubic',
      onTick    : (properties) => {
        if (this.prop.isCubemap) {
          for (let i = 0; i < 6; i++) {
            mesh.material[i].opacity = properties.opacity;
          }
        }
        else {
          mesh.material.opacity = properties.opacity;
        }

        if (zoomProvided) {
          this.psv.zoom(properties.zoom);
        }

        this.psv.needsUpdate();
      },
    })
      .then(() => {
        // remove temp sphere and transfer the texture to the main sphere
        this.setTexture(textureData);
        this.scene.remove(mesh);

        mesh.geometry.dispose();
        mesh.geometry = null;

        if (options.sphereCorrection) {
          this.setSphereCorrection(options.sphereCorrection);
        }
        else {
          this.setSphereCorrection({});
        }

        // actually rotate the camera
        if (positionProvided) {
          this.psv.rotate(options);
        }
      });
  }

  /**
   * @summary Calls `dispose` on all objects and textures
   * @param {external:THREE.Object3D} object
   * @private
   */
  __cleanTHREEScene(object) {
    object.traverse((item) => {
      if (item.geometry) {
        item.geometry.dispose();
      }

      if (item.material) {
        if (Array.isArray(item.material)) {
          item.material.forEach((material) => {
            if (material.map) {
              material.map.dispose();
            }

            material.dispose();
          });
        }
        else {
          if (item.material.map) {
            item.material.map.dispose();
          }

          item.material.dispose();
        }
      }

      if (item.dispose) {
        item.dispose();
      }

      if (item !== object) {
        this.__cleanTHREEScene(item);
      }
    });
  }

}
