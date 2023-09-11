import {
    Euler,
    Group,
    Intersection,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Raycaster,
    Renderer as ThreeRenderer,
    Scene,
    Vector2,
    WebGLRenderer,
    WebGLRenderTarget,
    LinearSRGBColorSpace,
    Vector3,
} from 'three';
import { SPHERE_RADIUS, VIEWER_DATA } from '../data/constants';
import { SYSTEM } from '../data/system';
import {
    BeforeAnimateEvent,
    BeforeRenderEvent,
    ConfigChangedEvent,
    PositionUpdatedEvent,
    RenderEvent,
    SizeUpdatedEvent,
    ZoomUpdatedEvent,
} from '../events';
import { PanoData, PanoramaOptions, Point, SphereCorrection, TextureData } from '../model';
import { Animation, isNil } from '../utils';
import type { Viewer } from '../Viewer';
import { AbstractService } from './AbstractService';
import type { AbstractAdapter } from '../adapters/AbstractAdapter';

const vector2 = new Vector2();

export type CustomRenderer = Pick<ThreeRenderer, 'render'> & {
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
    private readonly mesh: Mesh;
    private readonly meshContainer: Group;
    private readonly raycaster: Raycaster;
    private readonly container: HTMLElement;

    private timestamp?: number;
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
        this.renderer.domElement.className = 'psv-canvas';

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(50, 16 / 9, 0.1, 2 * SPHERE_RADIUS);
        this.camera.matrixWorldAutoUpdate = false;

        this.mesh = this.viewer.adapter.createMesh();
        this.mesh.userData = { [VIEWER_DATA]: true };

        this.meshContainer = new Group();
        this.meshContainer.add(this.mesh);
        this.scene.add(this.meshContainer);

        this.raycaster = new Raycaster();

        this.container = document.createElement('div');
        this.container.className = 'psv-canvas-container';
        this.container.appendChild(this.renderer.domElement);
        this.viewer.container.appendChild(this.container);

        this.viewer.addEventListener(SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(ZoomUpdatedEvent.type, this);
        this.viewer.addEventListener(PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(ConfigChangedEvent.type, this);

        this.hide();
    }

    /**
     * @internal
     */
    init() {
        this.show();
        this.renderer.setAnimationLoop((t) => this.__renderLoop(t));
    }

    /**
     * @internal
     */
    override destroy() {
        // cancel render loop
        this.renderer.setAnimationLoop(null);

        // destroy ThreeJS view
        this.cleanScene(this.scene);

        // remove container
        this.viewer.container.removeChild(this.container);

        this.viewer.removeEventListener(SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(ZoomUpdatedEvent.type, this);
        this.viewer.removeEventListener(PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(ConfigChangedEvent.type, this);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        // prettier-ignore
        switch (e.type) {
            case SizeUpdatedEvent.type: this.__onSizeUpdated(); break;
            case ZoomUpdatedEvent.type: this.__onZoomUpdated(); break;
            case PositionUpdatedEvent.type: this.__onPositionUpdated(); break;
            case ConfigChangedEvent.type:
                if ((e as ConfigChangedEvent).containsOptions('fisheye')) {
                    this.__onPositionUpdated();
                }
                if ((e as ConfigChangedEvent).containsOptions('canvasBackground')) {
                    this.container.style.background = this.config.canvasBackground;
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
    setCustomRenderer(factory: (renderer: WebGLRenderer) => CustomRenderer) {
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
    }

    /**
     * Updates the fov of the camera
     */
    private __onZoomUpdated() {
        this.camera.fov = this.state.vFov;
        this.camera.updateProjectionMatrix();
        this.viewer.needsUpdate();
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
        this.camera.updateMatrixWorld();
        this.viewer.needsUpdate();
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
            (this.customRenderer || this.renderer).render(this.scene, this.camera);
            this.viewer.dispatchEvent(new RenderEvent());
            this.state.needsUpdate = false;
        }
    }

    /**
     * Applies the texture to the scene, creates the scene if needed
     * @internal
     */
    setTexture(textureData: TextureData) {
        if ((this.viewer.adapter.constructor as typeof AbstractAdapter).supportsOverlay) {
            this.setOverlay(null, 0);
        }

        if (this.state.textureData) {
            this.viewer.adapter.disposeTexture(this.state.textureData);
        }

        this.state.textureData = textureData;
        this.state.panoData = textureData.panoData;

        this.viewer.adapter.setTexture(this.mesh, textureData);

        this.viewer.needsUpdate();
    }

    /**
     * Applies the overlay to the mesh
     * @internal
     */
    setOverlay(textureData: TextureData, opacity: number) {
        if (this.state.overlayData) {
            this.viewer.adapter.disposeTexture(this.state.overlayData);
        }

        this.state.overlayData = textureData;

        this.viewer.adapter.setOverlay(this.mesh, textureData, opacity);

        this.viewer.needsUpdate();
    }

    /**
     * Applies a panorama data pose to a Mesh
     * @internal
     */
    setPanoramaPose(panoData: PanoData, mesh: Mesh = this.mesh) {
        // By Google documentation the angles are applied on the camera in order : heading, pitch, roll
        // here we apply the reverse transformation on the sphere
        const cleanCorrection = this.viewer.dataHelper.cleanPanoramaPose(panoData);

        mesh.rotation.set(-cleanCorrection.tilt, -cleanCorrection.pan, -cleanCorrection.roll, 'ZXY');
    }

    /**
     * Applies a SphereCorrection to a Group
     * @internal
     */
    setSphereCorrection(sphereCorrection: SphereCorrection, group: Object3D = this.meshContainer) {
        const cleanCorrection = this.viewer.dataHelper.cleanSphereCorrection(sphereCorrection);

        group.rotation.set(cleanCorrection.tilt, cleanCorrection.pan, cleanCorrection.roll, 'ZXY');
    }

    /**
     * Performs transition between the current and a new texture
     * @internal
     */
    transition(textureData: TextureData, options: PanoramaOptions): Animation<any> {
        const positionProvided = !isNil(options.position);
        const zoomProvided = !isNil(options.zoom);

        const e = new BeforeAnimateEvent(
            positionProvided ? this.viewer.dataHelper.cleanPosition(options.position) : undefined,
            options.zoom
        );
        this.viewer.dispatchEvent(e);

        // create temp group and new mesh, half size to be in "front" of the first one
        const group = new Group();
        const mesh = this.viewer.adapter.createMesh(0.5);
        this.viewer.adapter.setTexture(mesh, textureData, true);
        this.viewer.adapter.setTextureOpacity(mesh, 0);
        this.setPanoramaPose(textureData.panoData, mesh);
        this.setSphereCorrection(options.sphereCorrection, group);

        // rotate the new sphere to make the target position face the camera
        if (positionProvided && options.transition === 'fade-only') {
            const currentPosition = this.viewer.getPosition();

            // rotation along the vertical axis
            const verticalAxis = new Vector3(0, 1, 0);
            group.rotateOnWorldAxis(verticalAxis, e.position.yaw - currentPosition.yaw);

            // rotation along the camera horizontal axis
            const horizontalAxis = new Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new Vector3())).normalize();
            group.rotateOnWorldAxis(horizontalAxis, e.position.pitch - currentPosition.pitch);
        }

        group.add(mesh);
        this.scene.add(group);

        // make sure the new texture is transfered to the GPU before starting the animation
        this.renderer.setRenderTarget(new WebGLRenderTarget<any>());
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        const { duration, properties } = this.viewer.dataHelper.getAnimationProperties(
            options.transition as any,
            options.transition === true ? e.position : null,
            e.zoomLevel
        );

        const animation = new Animation({
            properties: {
                ...properties,
                opacity: { start: 0.0, end: 1.0 },
            },
            duration: duration,
            easing: 'inOutCubic',
            onTick: (props) => {
                this.viewer.adapter.setTextureOpacity(mesh, props.opacity);

                if (positionProvided && options.transition === true) {
                    this.viewer.dynamics.position.setValue({
                        yaw: props.yaw,
                        pitch: props.pitch,
                    });
                }
                if (zoomProvided) {
                    this.viewer.dynamics.zoom.setValue(props.zoom);
                }

                this.viewer.needsUpdate();
            },
        });

        animation.then((completed) => {
            if (completed) {
                // remove temp sphere and transfer the texture to the main mesh
                this.setTexture(textureData);
                this.viewer.adapter.setTextureOpacity(this.mesh, 1);
                this.setPanoramaPose(textureData.panoData);
                this.setSphereCorrection(options.sphereCorrection);

                // actually rotate the camera
                if (positionProvided && options.transition === 'fade-only') {
                    this.viewer.rotate(options.position);
                }
            } else {
                this.viewer.adapter.disposeTexture(textureData);
            }

            this.scene.remove(group);
            mesh.geometry.dispose();
            mesh.geometry = null;
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
            .filter((i) => (i.object as Mesh).isMesh && !!i.object.userData) as Array<Intersection<Mesh>>;

        if (this.customRenderer?.getIntersections) {
            intersections.push(...this.customRenderer.getIntersections(this.raycaster, vector2));
        }

        return intersections;
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
        object.traverse((item: any) => {
            if (item.geometry) {
                item.geometry.dispose();
            }

            if (item.material) {
                if (Array.isArray(item.material)) {
                    item.material.forEach((material: any) => {
                        if (material.map) {
                            material.map.dispose();
                        }

                        material.dispose();
                    });
                } else {
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
                this.cleanScene(item);
            }
        });
    }
}
