import { Group, PerspectiveCamera, Raycaster, Scene, Vector3, WebGLRenderer } from 'three';
import { EVENTS, MESH_USER_DATA, SPHERE_RADIUS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { each, isExtendedPosition } from '../utils';
import { Animation } from '../utils/Animation';
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
     * @member {external:THREE.WebGLRenderer}
     * @readonly
     * @protected
     */
    this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(SYSTEM.pixelRatio);
    this.renderer.domElement.className = 'psv-canvas';

    /**
     * @member {external:THREE.Scene}
     * @readonly
     * @protected
     */
    this.scene = new Scene();

    /**
     * @member {external:THREE.PerspectiveCamera}
     * @readonly
     * @protected
     */
    this.camera = new PerspectiveCamera(50, 16 / 9, 0.1, 2 * SPHERE_RADIUS);

    /**
     * @member {external:THREE.Mesh}
     * @readonly
     * @protected
     */
    this.mesh = this.psv.adapter.createMesh();
    this.mesh.userData = { [MESH_USER_DATA]: true };

    /**
     * @member {external:THREE.Group}
     * @readonly
     * @private
     */
    this.meshContainer = new Group();
    this.meshContainer.add(this.mesh);
    this.scene.add(this.meshContainer);

    /**
     * @member {external:THREE.Raycaster}
     * @readonly
     * @protected
     */
    this.raycaster = new Raycaster();

    /**
     * @member {number}
     * @private
     */
    this.timestamp = null;

    /**
     * @member {boolean}
     * @private
     */
    this.ready = false;

    /**
     * @member {HTMLElement}
     * @readonly
     * @package
     */
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'psv-canvas-container';
    this.canvasContainer.style.background = this.psv.config.canvasBackground;
    this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
    this.canvasContainer.appendChild(this.renderer.domElement);
    this.psv.container.appendChild(this.canvasContainer);

    psv.on(EVENTS.SIZE_UPDATED, this);
    psv.on(EVENTS.ZOOM_UPDATED, this);
    psv.on(EVENTS.POSITION_UPDATED, this);
    psv.on(EVENTS.CONFIG_CHANGED, this);

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    // cancel render loop
    this.renderer.setAnimationLoop(null);

    // destroy ThreeJS view
    this.__cleanTHREEScene(this.scene);

    // remove container
    this.psv.container.removeChild(this.canvasContainer);

    delete this.canvasContainer;
    delete this.renderer;
    delete this.scene;
    delete this.camera;
    delete this.mesh;
    delete this.meshContainer;
    delete this.raycaster;

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} evt
   * @private
   */
  handleEvent(evt) {
    /* eslint-disable */
    switch (evt.type) {
      // @formatter:off
      case EVENTS.SIZE_UPDATED:     this.__onSizeUpdated(); break;
      case EVENTS.ZOOM_UPDATED:     this.__onZoomUpdated(); break;
      case EVENTS.POSITION_UPDATED: this.__onPositionUpdated(); break;
      case EVENTS.CONFIG_CHANGED:
        if (evt.args[0].includes('fisheye')) {
          this.__onPositionUpdated();
        }
        if (evt.args[0].includes('mousemove')) {
          this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
        }
        break;
      // @formatter:on
    }
    /* eslint-enable */
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
   * @summary Updates the size of the renderer and the aspect of the camera
   * @private
   */
  __onSizeUpdated() {
    this.renderer.setSize(this.prop.size.width, this.prop.size.height);
    this.camera.aspect = this.prop.aspect;
    this.camera.updateProjectionMatrix();
    this.prop.needsUpdate = true;
  }

  /**
   * @summary Updates the fov of the camera
   * @private
   */
  __onZoomUpdated() {
    this.camera.fov = this.prop.vFov;
    this.camera.updateProjectionMatrix();
    this.prop.needsUpdate = true;
  }

  /**
   * @summary Updates the position of the camera
   * @private
   */
  __onPositionUpdated() {
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(this.prop.direction);
    if (this.config.fisheye) {
      this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
    }
    this.prop.needsUpdate = true;
  }

  /**
   * @summary Main event loop, calls {@link render} if `prop.needsUpdate` is true
   * @param {number} timestamp
   * @fires PSV.before-render
   * @private
   */
  __renderLoop(timestamp) {
    const elapsed = this.timestamp !== null ? timestamp - this.timestamp : 0;
    this.timestamp = timestamp;

    this.psv.trigger(EVENTS.BEFORE_RENDER, timestamp, elapsed);
    each(this.psv.dynamics, d => d.update(elapsed));

    if (this.prop.idleTime > 0 && timestamp - this.prop.idleTime > this.config.autorotateDelay) {
      this.psv.startAutorotate();
    }

    if (this.prop.needsUpdate) {
      this.render();
      this.prop.needsUpdate = false;
    }
  }

  /**
   * @summary Performs a render
   * @description Do not call this method directly, instead call
   * {@link PSV.Viewer#needsUpdate} on {@link PSV.event:before-render}.
   * @fires PSV.render
   */
  render() {
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
    this.prop.panoData = textureData.panoData;

    this.psv.adapter.setTexture(this.mesh, textureData);

    if (!this.ready) {
      this.renderer.setAnimationLoop(t => this.__renderLoop(t));
      this.ready = true;
    }

    this.psv.needsUpdate();

    this.psv.trigger(EVENTS.PANORAMA_LOADED, textureData);
  }

  /**
   * @summary Applies the overlay to the mesh
   * @param {PSV.TextureData} textureData
   * @param {number} opacity
   * @package
   */
  setOverlay(textureData, opacity) {
    this.psv.adapter.setOverlay(this.mesh, textureData, opacity);
    this.psv.needsUpdate();
  }

  /**
   * @summary Apply a panorama data pose to a Mesh
   * @param {PSV.PanoData} [panoData]
   * @param {external:THREE.Mesh} [mesh=this.mesh]
   * @package
   */
  setPanoramaPose(panoData, mesh = this.mesh) {
    // By Google documentation the angles are applied on the camera in order : heading, pitch, roll
    // here we apply the reverse transformation on the sphere
    const cleanCorrection = this.psv.dataHelper.cleanPanoramaPose(panoData);

    mesh.rotation.set(
      -cleanCorrection.tilt,
      -cleanCorrection.pan,
      -cleanCorrection.roll,
      'ZXY'
    );
  }

  /**
   * @summary Apply a SphereCorrection to a Mesh
   * @param {PSV.SphereCorrection} [sphereCorrection]
   * @param {external:THREE.Mesh} [mesh=this.meshContainer]
   * @package
   */
  setSphereCorrection(sphereCorrection, mesh = this.meshContainer) {
    const cleanCorrection = this.psv.dataHelper.cleanSphereCorrection(sphereCorrection);

    mesh.rotation.set(
      cleanCorrection.tilt,
      cleanCorrection.pan,
      cleanCorrection.roll,
      'ZXY'
    );
  }

  /**
   * @summary Performs transition between the current and a new texture
   * @param {PSV.TextureData} textureData
   * @param {PSV.PanoramaOptions} options
   * @returns {PSV.Animation}
   * @package
   */
  transition(textureData, options) {
    const positionProvided = isExtendedPosition(options);
    const zoomProvided = 'zoom' in options;

    // create temp group and new mesh, half size to be in "front" of the first one
    const group = new Group();
    const mesh = this.psv.adapter.createMesh(0.5);
    this.psv.adapter.setTexture(mesh, textureData, true);
    this.psv.adapter.setTextureOpacity(mesh, 0);
    this.setPanoramaPose(textureData.panoData, mesh);
    this.setSphereCorrection(options.sphereCorrection, group);

    // rotate the new sphere to make the target position face the camera
    if (positionProvided) {
      const cleanPosition = this.psv.dataHelper.cleanPosition(options);
      const currentPosition = this.psv.getPosition();

      // Longitude rotation along the vertical axis
      const verticalAxis = new Vector3(0, 1, 0);
      group.rotateOnWorldAxis(verticalAxis, cleanPosition.longitude - currentPosition.longitude);

      // Latitude rotation along the camera horizontal axis
      const horizontalAxis = new Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new Vector3())).normalize();
      group.rotateOnWorldAxis(horizontalAxis, cleanPosition.latitude - currentPosition.latitude);
    }

    group.add(mesh);
    this.scene.add(group);

    const animation = new Animation({
      properties: {
        opacity: { start: 0.0, end: 1.0 },
        zoom   : zoomProvided ? { start: this.psv.getZoomLevel(), end: options.zoom } : undefined,
      },
      duration  : options.transition,
      easing    : 'outCubic',
      onTick    : (properties) => {
        this.psv.adapter.setTextureOpacity(mesh, properties.opacity);
        this.psv.adapter.setTextureOpacity(this.mesh, 1 - properties.opacity);

        if (zoomProvided) {
          this.psv.zoom(properties.zoom);
        }

        this.psv.needsUpdate();
      },
    });

    animation
      .then((completed) => {
        if (completed) {
          // remove temp sphere and transfer the texture to the main mesh
          this.setTexture(textureData);
          this.psv.adapter.setTextureOpacity(this.mesh, 1);
          this.setPanoramaPose(textureData.panoData);
          this.setSphereCorrection(options.sphereCorrection);

          // actually rotate the camera
          if (positionProvided) {
            this.psv.rotate(options);
          }
        }
        else {
          this.psv.adapter.disposeTexture(textureData);
        }

        this.scene.remove(group);
        mesh.geometry.dispose();
        mesh.geometry = null;
      });

    return animation;
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

      if (item.dispose && !(item instanceof Scene)) {
        item.dispose();
      }

      if (item !== object) {
        this.__cleanTHREEScene(item);
      }
    });
  }

}
