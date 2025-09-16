import {
    Box3,
    ColorManagement,
    Euler,
    Frustum,
    Group,
    Intersection,
    LinearSRGBColorSpace,
    LinearToneMapping,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Raycaster,
    Scene,
    SphereGeometry,
    Vector2,
    Vector3,
    WebGLRenderTarget,
    WebGLRenderer,
} from 'three';
import { SPHERE_RADIUS, VIEWER_DATA } from '../data/constants';
import { SYSTEM } from '../data/system';
import {
    BeforeAnimateEvent,
    BeforeRenderEvent,
    ConfigChangedEvent,
    PositionUpdatedEvent,
    RenderEvent,
    RollUpdatedEvent,
    SizeUpdatedEvent,
    ZoomUpdatedEvent,
} from '../events';
import {
    PanoData,
    PanoramaOptions,
    Point,
    SphereCorrection,
    TextureData,
    TransitionOptions,
} from '../model';
import { Animation, isNil } from '../utils';
import { Viewer } from '../Viewer';
import { AbstractService } from './AbstractService';

// https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
ColorManagement.enabled = false;

const vector2 = new Vector2();
const matrix4 = new Matrix4();
const box3 = new Box3();

export type CustomRenderer = Pick<WebGLRenderer, 'render'> & {
    getIntersections?(raycaster: Raycaster, vector: Vector2): Array<Intersection<Mesh>>;
};

/**
 * Controller for the three.js scene
 */
export class Renderer extends AbstractService {
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    /** @internal */
    public readonly camera: PerspectiveCamera;
    /** @internal */
    public mesh: Object3D;
    private meshContainer: Group;
    private readonly raycaster: Raycaster;
    private readonly frustum: Frustum;
    private readonly container: HTMLElement;

    private timestamp?: number;
    private frustumNeedsUpdate = true;
    private customRenderer?: CustomRenderer;

    get panoramaPose(): Euler {
        return this.mesh.rotation;
    }

    get sphereCorrection(): Euler {
        return this.meshContainer.rotation;
    }

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer);

        this.renderer = new WebGLRenderer(this.config.rendererParameters);
        this.renderer.setPixelRatio(SYSTEM.pixelRatio);
        // https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791
        this.renderer.outputColorSpace = LinearSRGBColorSpace;
        this.renderer.toneMapping = LinearToneMapping;
        this.renderer.domElement.className = 'psv-canvas';
        this.renderer.domElement.style.background = this.config.canvasBackground;

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(50, 16 / 9, 0.1, 2 * SPHERE_RADIUS);
        this.camera.matrixAutoUpdate = false;

        // mesh used to detect clicks on the viewer
        const raycasterMesh = new Mesh(
            new SphereGeometry(SPHERE_RADIUS).scale(-1, 1, 1),
            new MeshBasicMaterial({ opacity: 0, transparent: true, depthTest: false, depthWrite: false }),
        );
        raycasterMesh.userData = { [VIEWER_DATA]: true };
        this.scene.add(raycasterMesh);

        this.raycaster = new Raycaster();
        this.frustum = new Frustum();

        this.container = document.createElement('div');
        this.container.className = 'psv-canvas-container';
        this.container.appendChild(this.renderer.domElement);
        this.viewer.container.appendChild(this.container);

        this.container.addEventListener('contextmenu', e => e.preventDefault());

        this.viewer.addEventListener(SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(ZoomUpdatedEvent.type, this);
        this.viewer.addEventListener(PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(RollUpdatedEvent.type, this);
        this.viewer.addEventListener(ConfigChangedEvent.type, this);

        this.hide();
    }

    /**
     * @internal
     */
    init() {
        this.show();
        this.renderer.setAnimationLoop(t => this.__renderLoop(t));
    }

    /**
     * @internal
     */
    override destroy() {
        // destroy ThreeJS
        this.renderer.setAnimationLoop(null);
        this.cleanScene(this.scene);
        this.renderer.dispose();

        // remove container
        this.viewer.container.removeChild(this.container);

        this.viewer.removeEventListener(SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(ZoomUpdatedEvent.type, this);
        this.viewer.removeEventListener(PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(RollUpdatedEvent.type, this);
        this.viewer.removeEventListener(ConfigChangedEvent.type, this);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case SizeUpdatedEvent.type: this.__onSizeUpdated(); break;
            case ZoomUpdatedEvent.type: this.__onZoomUpdated(); break;
            case PositionUpdatedEvent.type: this.__onPositionUpdated(); break;
            case RollUpdatedEvent.type: this.__onPositionUpdated(); break;
            case ConfigChangedEvent.type:
                if ((e as ConfigChangedEvent).containsOptions('fisheye')) {
                    this.__onPositionUpdated();
                }
                if ((e as ConfigChangedEvent).containsOptions('canvasBackground')) {
                    this.renderer.domElement.style.background = this.config.canvasBackground;
                }
                break;
        }
    }

    /**
     * Hides the viewer
     */
    hide() {
        this.container.style.opacity = '0';
    }

    /**
     * Shows the viewer
     */
    show() {
        this.container.style.opacity = '1';
    }

    /**
     * Resets or replaces the THREE renderer by a custom one
     */
    setCustomRenderer(factory: ((renderer: WebGLRenderer) => CustomRenderer) | null) {
        if (factory) {
            this.customRenderer = factory(this.renderer);
        } else {
            this.customRenderer = null;
        }
        this.viewer.needsUpdate();
    }

    /**
     * Updates the size of the renderer and the aspect of the camera
     */
    private __onSizeUpdated() {
        this.renderer.setSize(this.state.size.width, this.state.size.height);
        this.camera.aspect = this.state.aspect;
        this.camera.updateProjectionMatrix();
        this.viewer.needsUpdate();
        this.frustumNeedsUpdate = true;
    }

    /**
     * Updates the fov of the camera
     */
    private __onZoomUpdated() {
        this.camera.fov = this.state.vFov;
        this.camera.updateProjectionMatrix();
        this.viewer.needsUpdate();
        this.frustumNeedsUpdate = true;
    }

    /**
     * Updates the position of the camera
     */
    private __onPositionUpdated() {
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(this.state.direction);
        if (this.config.fisheye) {
            this.camera.position
                .copy(this.state.direction)
                .multiplyScalar(this.config.fisheye / 2)
                .negate();
        }
        this.camera.rotateZ(-this.state.roll);

        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();

        this.viewer.needsUpdate();
        this.frustumNeedsUpdate = true;
    }

    /**
     * Main event loop, performs a render if `state.needsUpdate` is true
     */
    private __renderLoop(timestamp: number) {
        const elapsed = !this.timestamp ? 0 : timestamp - this.timestamp;
        this.timestamp = timestamp;

        this.viewer.dispatchEvent(new BeforeRenderEvent(timestamp, elapsed));
        this.viewer.dynamics.update(elapsed);

        if (this.state.needsUpdate || this.state.continuousUpdateCount > 0) {
            this.state.needsUpdate = false;
            (this.customRenderer || this.renderer).render(this.scene, this.camera);
            this.viewer.dispatchEvent(new RenderEvent());
        }
    }

    /**
     * Applies the texture to the scene, creates the scene if needed
     * @internal
     */
    setTexture(textureData: TextureData) {
        if (!this.meshContainer) {
            this.meshContainer = new Group();
            this.scene.add(this.meshContainer);
        }

        if (this.state.textureData) {
            this.viewer.adapter.disposeTexture(this.state.textureData);
        }

        if (this.mesh) {
            this.meshContainer.remove(this.mesh);
            this.viewer.adapter.disposeMesh(this.mesh);
        }

        this.mesh = this.viewer.adapter.createMesh(textureData.panoData);
        this.viewer.adapter.setTexture(this.mesh, textureData, false);
        this.meshContainer.add(this.mesh);

        this.state.textureData = textureData;

        this.viewer.needsUpdate();
    }

    /**
     * Applies a panorama data pose to a Mesh
     * @internal
     */
    setPanoramaPose(panoData: PanoData, mesh: Object3D = this.mesh) {
        const cleanCorrection = this.viewer.dataHelper.cleanPanoramaPose(panoData);
        mesh.rotation.set(-cleanCorrection.tilt, cleanCorrection.pan, cleanCorrection.roll, 'YXZ');
    }

    /**
     * Applies a SphereCorrection to a Group
     * @internal
     */
    setSphereCorrection(sphereCorrection: SphereCorrection, group: Object3D = this.meshContainer) {
        const cleanCorrection = this.viewer.dataHelper.cleanSphereCorrection(sphereCorrection);
        group.rotation.set(cleanCorrection.tilt, cleanCorrection.pan, cleanCorrection.roll, 'YXZ');
    }

    /**
     * Performs transition between the current and a new texture
     * @internal
     */
    transition(textureData: TextureData, options: PanoramaOptions, transition: TransitionOptions): Animation<any> {
        // do not animate zoom in black/white transition without rotation
        const zoomTransition = transition.effect === 'fade' || transition.rotation;

        const positionProvided = !isNil(options.position);
        const zoomProvided = !isNil(options.zoom);

        const e = new BeforeAnimateEvent(
            positionProvided ? this.viewer.dataHelper.cleanPosition(options.position) : undefined,
            options.zoom,
        );
        this.viewer.dispatchEvent(e);

        const tempContainer = new Group();
        const newMesh = this.viewer.adapter.createMesh(textureData.panoData);
        this.viewer.adapter.setTexture(newMesh, textureData, true);
        this.viewer.adapter.setTextureOpacity(newMesh, 0);
        this.setPanoramaPose(textureData.panoData, newMesh);
        this.setSphereCorrection(options.sphereCorrection, tempContainer);

        // rotate the new sphere to make the target position face the camera
        if (positionProvided && !transition.rotation) {
            const currentPosition = this.viewer.getPosition();

            // rotation along the vertical axis
            const verticalAxis = new Vector3(0, 1, 0);
            tempContainer.rotateOnWorldAxis(verticalAxis, e.position.yaw - currentPosition.yaw);

            // rotation along the camera horizontal axis
            const horizontalAxis = new Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new Vector3())).normalize();
            tempContainer.rotateOnWorldAxis(horizontalAxis, e.position.pitch - currentPosition.pitch);
        }

        tempContainer.add(newMesh);
        this.scene.add(tempContainer);

        // make sure the new texture is transfered to the GPU before starting the animation
        this.renderer.setRenderTarget(new WebGLRenderTarget<any>());
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        const { duration, properties } = this.viewer.dataHelper.getAnimationProperties(
            transition.speed,
            transition.rotation ? e.position : null,
            zoomTransition ? e.zoomLevel : null,
        );

        const animation = new Animation({
            properties: {
                ...properties,
                opacity: { start: 0.0, end: 1.0 },
            },
            duration: duration,
            easing: 'inOutCubic',
            onTick: (props) => {
                switch (transition.effect) {
                    case 'fade':
                        this.viewer.adapter.setTextureOpacity(newMesh, props.opacity);
                        break;
                    case 'black':
                    case 'white':
                        if (props.opacity < 0.5) {
                            this.renderer.toneMappingExposure = transition.effect === 'black'
                                ? MathUtils.mapLinear(props.opacity, 0, 0.5, 1, 0)
                                : MathUtils.mapLinear(props.opacity, 0, 0.5, 1, 5);
                        } else {
                            this.renderer.toneMappingExposure = transition.effect === 'black'
                                ? MathUtils.mapLinear(props.opacity, 0.5, 1, 0, 1)
                                : MathUtils.mapLinear(props.opacity, 0.5, 1, 5, 1);

                            this.mesh.visible = false;
                            this.viewer.adapter.setTextureOpacity(newMesh, 1);

                            if (zoomProvided && !zoomTransition) {
                                this.viewer.dynamics.zoom.setValue(e.zoomLevel);
                            }
                        }
                        break;
                }

                if (positionProvided && transition.rotation) {
                    this.viewer.dynamics.position.setValue({
                        yaw: props.yaw,
                        pitch: props.pitch,
                    });
                }
                if (zoomProvided && zoomTransition) {
                    this.viewer.dynamics.zoom.setValue(props.zoom);
                }

                this.viewer.needsUpdate();
            },
        });

        animation.then((completed) => {
            tempContainer.remove(newMesh);
            this.scene.remove(tempContainer);

            if (completed) {
                // remove old texture and mesh
                this.viewer.adapter.disposeTexture(this.state.textureData);
                this.meshContainer.remove(this.mesh);
                this.viewer.adapter.disposeMesh(this.mesh);

                // promote new texture and mesh
                this.mesh = newMesh;
                this.meshContainer.add(newMesh);
                this.state.textureData = textureData;

                // apply rotations
                this.setPanoramaPose(textureData.panoData);
                this.setSphereCorrection(options.sphereCorrection);

                if (positionProvided && !transition.rotation) {
                    this.viewer.rotate(options.position);
                }
            } else {
                this.viewer.adapter.disposeTexture(textureData);
                this.viewer.adapter.disposeMesh(newMesh);
            }
        });

        return animation;
    }

    /**
     * Returns intersections with objects in the scene
     */
    getIntersections(viewerPoint: Point): Array<Intersection<Mesh>> {
        vector2.x = (2 * viewerPoint.x) / this.state.size.width - 1;
        vector2.y = (-2 * viewerPoint.y) / this.state.size.height + 1;

        this.raycaster.setFromCamera(vector2, this.camera);

        const intersections = this.raycaster
            .intersectObjects(this.scene.children, true)
            .filter(i => i.object.visible)
            .filter(i => (i.object as Mesh).isMesh && !!i.object.userData) as Array<Intersection<Mesh>>;

        if (this.customRenderer?.getIntersections) {
            intersections.push(...this.customRenderer.getIntersections(this.raycaster, vector2));
        }

        return intersections;
    }

    /**
     * Checks if an object/point is currently visible
     */
    isObjectVisible(value: Object3D | Vector3): boolean {
        if (!value) {
            return false;
        }

        if (this.frustumNeedsUpdate) {
            matrix4.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
            this.frustum.setFromProjectionMatrix(matrix4);
            this.frustumNeedsUpdate = false;
        }

        if ((value as Vector3).isVector3) {
            return this.frustum.containsPoint(value as Vector3);
        } else if ((value as Mesh).isMesh && (value as Mesh).geometry) {
            // Frustum.intersectsObject uses the boundingSphere by default
            // for better precision we prefer the boundingBox
            const mesh = value as Mesh;
            if (!mesh.geometry.boundingBox) {
                mesh.geometry.computeBoundingBox();
            }
            box3.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld);
            return this.frustum.intersectsBox(box3);
        } else if ((value as Object3D).isObject3D) {
            return this.frustum.intersectsObject(value as Object3D);
        } else {
            return false;
        }
    }

    /**
     * Adds an object to the THREE scene
     */
    addObject(object: Object3D) {
        this.scene.add(object);
    }

    /**
     * Removes an object from the THREE scene
     */
    removeObject(object: Object3D) {
        this.scene.remove(object);
    }

    /**
     * Calls `dispose` on all objects and textures
     * @internal
     */
    cleanScene(object: any) {
        const disposeMaterial = (material: any) => {
            material.map?.dispose();

            if (material.uniforms) {
                Object.values(material.uniforms).forEach((uniform: any) => {
                    uniform.value?.dispose?.();
                });
            }

            material.dispose();
        };

        object.traverse((item: any) => {
            item.geometry?.dispose();

            if (item.material) {
                if (Array.isArray(item.material)) {
                    item.material.forEach((material: any) => {
                        disposeMaterial(material);
                    });
                } else {
                    disposeMaterial(item.material);
                }
            }

            if (!(item instanceof Scene)) {
                item.dispose?.();
            }

            if (item !== object) {
                this.cleanScene(item);
            }
        });
    }
}
