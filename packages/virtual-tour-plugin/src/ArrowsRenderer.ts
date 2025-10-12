import { AbstractComponent, events, Position, utils, type Viewer } from '@photo-sphere-viewer/core';
import type { GalleryPlugin, events as GalleryEvents } from '@photo-sphere-viewer/gallery-plugin';
import { MathUtils, PerspectiveCamera, Scene } from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { LINK_DATA } from './constants';
import { VirtualTourArrowStyle, VirtualTourLink } from './model';
import { type VirtualTourPlugin } from './VirtualTourPlugin';

const ARROW_DATA = 'arrow';

type ArrowData = {
    yaw: number;
    conflict: boolean;
};

/**
 * @internal
 */
export class ArrowsRenderer extends AbstractComponent {
    private renderer: CSS3DRenderer | CSS2DRenderer;
    private scene: Scene;
    private camera: PerspectiveCamera;

    private gallery?: GalleryPlugin;

    get is3D() {
        return this.plugin.is3D;
    }

    get arrowsPosition() {
        return this.plugin.config.arrowsPosition;
    }

    get arrowStyle() {
        return this.plugin.config.arrowStyle;
    }

    constructor(parent: Viewer, private plugin: VirtualTourPlugin) {
        super(parent, {
            className: 'psv-virtual-tour-arrows',
        });

        this.renderer = this.is3D
            ? new CSS3DRenderer({
                    element: this.container,
                })
            : new CSS2DRenderer({
                    element: this.container,
                });

        this.camera = this.is3D ? new PerspectiveCamera(30, 1) : null;
        this.scene = new Scene();

        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });
        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(events.RenderEvent.type, this);
        this.viewer.addEventListener(events.ClickEvent.type, this);

        this.container.addEventListener('mouseenter', this, true);
        this.container.addEventListener('mouseleave', this, true);
        this.container.addEventListener('mousemove', this, true);

        this.container.addEventListener('contextmenu', e => e.preventDefault());
    }

    init() {
        if (this.is3D) {
            this.gallery = this.viewer.getPlugin('gallery');

            this.gallery?.addEventListener('show-gallery', this);
            this.gallery?.addEventListener('hide-gallery', this);
        }
    }

    override destroy(): void {
        this.viewer.removeEventListener(events.ReadyEvent.type, this);
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.RenderEvent.type, this);
        this.viewer.removeEventListener(events.ClickEvent.type, this);

        this.gallery?.removeEventListener('show-gallery', this);
        this.gallery?.removeEventListener('hide-gallery', this);

        super.destroy();
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case events.ReadyEvent.type:
            case events.SizeUpdatedEvent.type:
            case events.PositionUpdatedEvent.type:
                this.__updateCamera();
                break;
            case events.RenderEvent.type:
                this.render();
                break;
            case events.ClickEvent.type: {
                if ((e as events.ClickEvent).data.rightclick) {
                    break;
                }
                const link = this.__getTargetLink((e as events.ClickEvent).data.target, true);
                if (link) {
                    this.plugin.setCurrentNode(link.nodeId, null, link);
                }
                break;
            }
            case 'mouseenter': {
                const link = this.__getTargetLink(utils.getEventTarget(e));
                if (link) {
                    this.plugin.__onEnterArrow(link);
                }
                break;
            }
            case 'mouseleave': {
                const link = this.__getTargetLink(utils.getEventTarget(e));
                if (link) {
                    this.plugin.__onLeaveArrow(link);
                }
                break;
            }
            case 'hide-gallery':
                this.__onToggleGallery(false);
                break;
            case 'show-gallery':
                if (!(e as GalleryEvents.ShowGalleryEvent).fullscreen) {
                    this.__onToggleGallery(true);
                }
                break;
        }
    }

    private __updateCamera() {
        const size = this.viewer.getSize();
        this.renderer.setSize(size.width, size.height);

        if (this.is3D) {
            const position = this.viewer.getPosition();
            position.pitch = MathUtils.clamp(position.pitch, -this.arrowsPosition.maxPitch, -this.arrowsPosition.minPitch);

            this.viewer.dataHelper.sphericalCoordsToVector3(
                position,
                this.camera.position,
                size.height * 2,
            ).negate();

            this.camera.lookAt(0, 0, 0);
            this.camera.translateY(size.height / 3);
            this.camera.updateProjectionMatrix();
        }
    }

    render() {
        if (this.is3D) {
            const position = this.viewer.getPosition();

            const objectsAndDist: Array<[CSS3DObject, number]> = [];
            let minDist = Number.MAX_SAFE_INTEGER;
            this.scene.children
                .forEach((object) => {
                    const data = object.userData[ARROW_DATA] as ArrowData;
                    if (data.conflict) {
                        const distance = Math.abs(utils.getShortestArc(position.yaw, data.yaw));
                        minDist = Math.min(minDist, distance);
                        objectsAndDist.push([object as CSS3DObject, distance]);
                    }
                });

            objectsAndDist.forEach(([object, distance]) => {
                const fade = distance !== minDist;
                object.element.style.opacity = fade ? '0.5' : null;
                object.element.style.zIndex = fade ? '-1' : null;
            });

            this.renderer.render(this.scene, this.camera);
        } else {
            this.renderer.render(this.scene, this.viewer.renderer.camera);
        }
    }

    clear() {
        this.scene.clear();
    }

    private __buildArrowElement(link: VirtualTourLink, style?: VirtualTourArrowStyle): HTMLElement {
        if (style?.image) {
            const image = document.createElement('img');
            image.src = style.image;
            return image;
        } else if (style?.element) {
            if (typeof style.element === 'function') {
                return style.element(link);
            } else {
                return style.element;
            }
        }
    }

    addLinkArrow(link: VirtualTourLink, position: Position, depth = 1): HTMLElement {
        let element = this.__buildArrowElement(link, link.arrowStyle);
        if (!element) {
            element = this.__buildArrowElement(link, this.arrowStyle);
        }
        (element as any)[LINK_DATA] = link;

        const conf = {
            ...this.arrowStyle,
            ...link.arrowStyle,
        };

        element.classList.add('psv-virtual-tour-link');
        if (conf.className) {
            utils.addClasses(element, conf.className);
        }
        if (conf.style) {
            Object.assign(element.style, conf.style);
        }

        if (this.is3D) {
            // 1.5 ratio is arbitrary
            element.style.width = conf.size.width * 1.5 + 'px';
            element.style.height = conf.size.height * 1.5 + 'px';

            let conflict = false;
            this.scene.children.forEach((object) => {
                const data = object.userData[ARROW_DATA] as ArrowData;
                if (Math.abs(utils.getShortestArc(data.yaw, position.yaw)) < this.arrowsPosition.linkOverlapAngle) {
                    data.conflict = true;
                    conflict = true;
                }
            });

            const object = new CSS3DObject(element);
            object.userData[ARROW_DATA] = { yaw: position.yaw, conflict } as ArrowData;

            object.rotation.set(-Math.PI / 2, 0, Math.PI - position.yaw);

            this.viewer.dataHelper.sphericalCoordsToVector3(
                { yaw: position.yaw, pitch: 0 },
                object.position,
                depth * 100,
            );

            this.scene.add(object);
        } else {
            element.style.width = conf.size.width + 'px';
            element.style.height = conf.size.height + 'px';
            element.style.pointerEvents = 'auto'; // CSS2DObject does not do it...

            const object = new CSS2DObject(element);

            this.viewer.dataHelper.sphericalCoordsToVector3(
                position,
                object.position,
            );

            this.scene.add(object);
        }

        return element;
    }

    private __getTargetLink(target: HTMLElement, closest = false): VirtualTourLink {
        const target2 = closest ? utils.getClosest(target, '.psv-virtual-tour-link') : target;
        return target2 ? (target2 as any)[LINK_DATA] : undefined;
    }

    private __onToggleGallery(visible: boolean) {
        if (!visible) {
            this.container.style.marginBottom = '';
        } else {
            this.container.style.marginBottom = (this.viewer.container.querySelector<HTMLElement>('.psv-gallery').offsetHeight) + 'px';
        }
    }
}
