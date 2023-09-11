import { CONSTANTS, CustomRenderer, Position, Viewer } from '@photo-sphere-viewer/core';
import {
    AmbientLight,
    BackSide,
    Camera,
    Group,
    Intersection,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PerspectiveCamera,
    PointLight,
    REVISION,
    Raycaster,
    Scene,
    Vector2,
    WebGLRenderer,
} from 'three';
import type { VirtualTourPlugin } from './VirtualTourPlugin';
import { ARROW_GEOM, ARROW_OUTLINE_GEOM, LINK_DATA } from './constants';
import { VirtualTourLink } from './model';
import { setMeshColor } from './utils';

// https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733
const LIGHT_INTENSITY = parseInt(REVISION) >= 155 ? Math.PI : 1;

/**
 * Custom renderer to draw the arrows atop the panorama, without being impacted by the zoom level
 */
export class ArrowsRenderer implements CustomRenderer {
    private renderer: WebGLRenderer;

    private readonly camera: PerspectiveCamera;
    private readonly scene: Scene;
    private readonly group: Group;

    constructor(
        private viewer: Viewer,
        private plugin: VirtualTourPlugin
    ) {
        this.camera = new PerspectiveCamera(50, 16 / 9, 0.1, 2 * CONSTANTS.SPHERE_RADIUS);
        this.scene = new Scene();

        const ambientLight = new AmbientLight(0xffffff, LIGHT_INTENSITY);
        this.scene.add(ambientLight);

        const localLight = new PointLight(0xffffff, LIGHT_INTENSITY, 0, 0);
        localLight.position.set(0, 0, 0);
        this.scene.add(localLight);

        this.group = new Group();
        this.scene.add(this.group);

        // position the arrows slighly above/bellow the bottom/top of the viewer
        let positionY = CONSTANTS.SPHERE_RADIUS * Math.atan(MathUtils.degToRad(this.camera.fov / 2)) - 1.5;
        if (this.plugin.config.arrowPosition === 'bottom') {
            positionY *= -1;
        }
        this.group.position.set(0, positionY, 0);
    }

    destroy() {
        delete this.viewer;
        delete this.plugin;
        delete this.renderer;
    }

    withRenderer(renderer: WebGLRenderer) {
        this.renderer = renderer;
        return this;
    }

    updateCamera() {
        this.camera.aspect = this.viewer.state.aspect;

        // the camera rotate around the center of the sphere
        this.camera.position.copy(this.viewer.state.direction).negate();
        this.camera.lookAt(0, 0, 0);

        this.camera.updateProjectionMatrix();
    }

    render(scene: Scene, camera: Camera) {
        this.renderer.render(scene, camera);
        this.renderer.autoClear = false;
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);
        this.renderer.autoClear = true;
    }

    getIntersections(raycaster: Raycaster, vector: Vector2): Array<Intersection<Mesh>> {
        raycaster.setFromCamera(vector, this.camera);

        return raycaster.intersectObjects(this.group.children);
    }

    clearArrows() {
        this.group.clear();
    }

    addArrow(link: VirtualTourLink, position: Position, depth: number) {
        const size = link.arrowStyle?.size || this.plugin.config.arrowStyle.size;

        const mesh = new Mesh(ARROW_GEOM, new MeshLambertMaterial());
        mesh.userData = { [LINK_DATA]: link };
        mesh.renderOrder = 1000 + this.group.children.length;
        mesh.scale.multiplyScalar(size);
        mesh.rotation.order = 'YXZ';
        mesh.rotateY(-position.yaw);
        // 2 = base distance to center
        this.viewer.dataHelper.sphericalCoordsToVector3(
            { yaw: position.yaw, pitch: 0 },
            mesh.position,
            2 * depth * size
        );

        const outlineMesh = new Mesh(ARROW_OUTLINE_GEOM, new MeshBasicMaterial({ side: BackSide }));
        outlineMesh.scale.copy(mesh.scale);
        outlineMesh.position.copy(mesh.position);
        outlineMesh.rotation.copy(mesh.rotation);

        setMeshColor(mesh, link.arrowStyle?.color || this.plugin.config.arrowStyle.color);
        setMeshColor(outlineMesh, link.arrowStyle?.outlineColor || this.plugin.config.arrowStyle.outlineColor);

        this.group.add(mesh);
        this.group.add(outlineMesh);

        // arrows are renderer last and on top of their outline
        // the depth buffer must be cleared only once
        mesh.onBeforeRender = function (renderer) {
            if (this.renderOrder === 1000) {
                renderer.clearDepth();
            }
        };
    }
}
