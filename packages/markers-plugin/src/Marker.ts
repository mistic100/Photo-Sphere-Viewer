import type {
    ExtendedPosition,
    Point,
    Position,
    Size,
    Tooltip,
    TooltipConfig,
    Viewer,
} from '@photo-sphere-viewer/core';
import { CONSTANTS, PSVError, utils } from '@photo-sphere-viewer/core';
import {
    BufferGeometry,
    Group,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneGeometry,
    RepeatWrapping,
    Texture,
    Vector3,
    VideoTexture,
} from 'three';
import type { MarkersPlugin } from './MarkersPlugin';
import { DEFAULT_HOVER_SCALE, MARKER_DATA, SVG_NS } from './constants';
import { MarkerConfig, ParsedMarkerConfig } from './model';
import { getPolygonCenter, getPolylineCenter } from './utils';

export enum MarkerType {
    image = 'image',
    imageLayer = 'imageLayer',
    videoLayer = 'videoLayer',
    html = 'html',
    element = 'element',
    polygon = 'polygon',
    polygonPixels = 'polygonPixels',
    polyline = 'polyline',
    polylinePixels = 'polylinePixels',
    square = 'square',
    rect = 'rect',
    circle = 'circle',
    ellipse = 'ellipse',
    path = 'path',
}

export class Marker {
    readonly type: MarkerType;
    private readonly element: any;

    /**
     * The final description of the marker. Either text content, image, url, SVG attributes, etc.
     */
    definition: any;
    visible = true;

    /** @internal */
    tooltip?: Tooltip;

    config: ParsedMarkerConfig;

    get id(): string {
        return this.config.id;
    }

    get data(): any {
        return this.config.data;
    }

    get domElement(): HTMLElement | SVGElement {
        return !this.is3d() ? this.element : null;
    }

    get threeElement(): Object3D {
        return this.is3d() ? this.element : null;
    }

    get video(): HTMLVideoElement {
        if (this.type === MarkerType.videoLayer) {
            const mesh = this.threeElement.children[0] as Mesh<BufferGeometry, MeshBasicMaterial>;
            return mesh.material.map.image;
        } else {
            utils.logWarn(`Marker ${this.id} is not a video marker`);
        }
    }

    /** @internal */
    readonly state = {
        dynamicSize: false,
        anchor: null as Point,
        visible: false,
        staticTooltip: false,
        position: null as Position,
        position2D: null as Point,
        positions3D: null as Vector3[],
        size: null as Size,
    };

    constructor(
        private readonly viewer: Viewer,
        private readonly plugin: MarkersPlugin,
        config: MarkerConfig
    ) {
        if (!config.id) {
            throw new PSVError('missing marker id');
        }

        this.type = Marker.getType(config);

        // create element
        if (this.isNormal()) {
            this.element = document.createElement('div');
        } else if (this.isPolygon()) {
            this.element = document.createElementNS(SVG_NS, 'polygon');
        } else if (this.isPolyline()) {
            this.element = document.createElementNS(SVG_NS, 'polyline');
        } else if (this.isSvg()) {
            const svgType = this.type === MarkerType.square ? 'rect' : this.type;
            const elt = document.createElementNS(SVG_NS, svgType);
            this.element = document.createElementNS(SVG_NS, 'svg');
            this.domElement.appendChild(elt);
        } else if (this.is3d()) {
            this.element = this.__createMesh();
        }

        if (!this.is3d()) {
            this.element.id = `psv-marker-${config.id}`;
            this.element[MARKER_DATA] = this;
        }

        if (this.isNormal() || this.isSvg()) {
            this.domElement.addEventListener('transitionend', () => {
                // the transition "scale" is only applied manually on mouseover
                // because it must not be present when the scale changes on zoom/move
                this.domElement.style.transition = '';
            });
        }

        this.update(config);

        if (this.type === MarkerType.videoLayer) {
            this.viewer.needsContinuousUpdate(true);
        }
    }

    /**
     * @internal
     */
    destroy() {
        this.hideTooltip();

        if (this.is3d()) {
            delete this.threeElement.children[0].userData[MARKER_DATA];
        } else {
            delete this.element[MARKER_DATA];
        }

        if (this.type === MarkerType.videoLayer) {
            this.viewer.needsContinuousUpdate(false);
        }
    }

    /**
     * Checks if it is a 3D marker (imageLayer)
     */
    is3d(): boolean {
        return this.type === MarkerType.imageLayer
            || this.type === MarkerType.videoLayer;
    }

    /**
     * Checks if it is a normal marker (image or html)
     */
    isNormal(): boolean {
        return this.type === MarkerType.image
            || this.type === MarkerType.html
            || this.type === MarkerType.element;
    }

    /**
     * Checks if it is a polygon/polyline marker
     */
    isPoly(): boolean {
        return this.isPolygon()
            || this.isPolyline();
    }

    /**
     * Checks if it is a polygon/polyline using pixel coordinates
     */
    isPolyPixels(): boolean {
        return this.type === MarkerType.polygonPixels
            || this.type === MarkerType.polylinePixels;
    }

    /**
     * Checks if it is a polygon/polyline using radian coordinates
     */
    isPolyAngles(): boolean {
        return this.type === MarkerType.polygon
            || this.type === MarkerType.polyline;
    }

    /**
     * Checks if it is a polygon marker
     */
    isPolygon(): boolean {
        return this.type === MarkerType.polygon
            || this.type === MarkerType.polygonPixels;
    }

    /**
     * Checks if it is a polyline marker
     */
    isPolyline(): boolean {
        return this.type === MarkerType.polyline
            || this.type === MarkerType.polylinePixels;
    }

    /**
     * Checks if it is an SVG marker
     */
    isSvg(): boolean {
        return this.type === MarkerType.square
            || this.type === MarkerType.rect
            || this.type === MarkerType.circle
            || this.type === MarkerType.ellipse
            || this.type === MarkerType.path;
    }

    /**
     * Computes marker scale
     * @internal
     */
    getScale(zoomLevel: number, position: Position, mouseover: boolean): number {
        let scale = 1;
        if (typeof this.config.scale === 'function') {
            scale = this.config.scale(zoomLevel, position);
        } else if (this.config.scale) {
            if (Array.isArray(this.config.scale.zoom)) {
                const [min, max] = this.config.scale.zoom;
                scale *= min + (max - min) * CONSTANTS.EASINGS.inQuad(zoomLevel / 100);
            }
            if (Array.isArray(this.config.scale.yaw)) {
                const [min, max] = this.config.scale.yaw;
                const halfFov = MathUtils.degToRad(this.viewer.state.hFov) / 2;
                const arc = Math.abs(utils.getShortestArc(this.state.position.yaw, position.yaw));
                scale *= max + (min - max) * CONSTANTS.EASINGS.outQuad(Math.max(0, (halfFov - arc) / halfFov));
            }
        }
        if (mouseover && this.config.hoverScale) {
            scale *= this.config.hoverScale.amount;
        }
        return scale;
    }

    /**
     * Returns the markers list content for the marker, it can be either :
     * - the `listContent`
     * - the `tooltip`
     * - the `html`
     * - the `id`
     * @internal
     */
    getListContent(): string {
        if (this.config.listContent) {
            return this.config.listContent;
        } else if (this.config.tooltip?.content) {
            return this.config.tooltip.content;
        } else if (this.config.html) {
            return this.config.html;
        } else {
            return this.id;
        }
    }

    /**
     * Display the tooltip of this marker
     * @internal
     */
    showTooltip(clientX?: number, clientY?: number) {
        if (this.state.visible && this.config.tooltip?.content && this.state.position2D) {
            const config: TooltipConfig = {
                ...this.config.tooltip,
                style: {
                    // prevents conflicts with tooltip tracking
                    pointerEvents: this.state.staticTooltip ? 'auto' : 'none',
                },
                data: this,
                top: 0,
                left: 0,
            };

            if (this.isPoly() || this.is3d()) {
                if (clientX || clientY) {
                    const viewerPos = utils.getPosition(this.viewer.container);
                    config.top = clientY - viewerPos.y;
                    config.left = clientX - viewerPos.x;
                    config.box = {
                        // separate the tooltip from the cursor
                        width: 20,
                        height: 20,
                    };
                } else {
                    config.top = this.state.position2D.y;
                    config.left = this.state.position2D.x;
                }
            } else {
                // note: state.position2D already has the anchor applied with the default size
                const position = this.viewer.dataHelper.vector3ToViewerCoords(this.state.positions3D[0]);
                let width = this.state.size.width;
                let height = this.state.size.height;

                // only apply scaling for "temporary" tooltips
                if (this.config.hoverScale && !this.state.staticTooltip) {
                    width *= this.config.hoverScale.amount;
                    height *= this.config.hoverScale.amount;
                }

                config.top = position.y - height * this.state.anchor.y + height / 2;
                config.left = position.x - width * this.state.anchor.x + width / 2;
                config.box = { width, height };
            }

            if (this.tooltip) {
                this.tooltip.update(this.config.tooltip.content, config);
            } else {
                this.tooltip = this.viewer.createTooltip(config);
            }
        }
    }

    /**
     * Hides the tooltip of this marker
     * @internal
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.hide();
            this.tooltip = null;
        }
    }

    /**
     * Updates the marker with new properties
     * @throws {@link PSVError} if the configuration is invalid
     * @internal
     */
    update(config: MarkerConfig) {
        const newType = Marker.getType(config, true);

        if (newType !== undefined && newType !== this.type) {
            throw new PSVError('cannot change marker type');
        }

        if (utils.isExtendedPosition(config)) {
            utils.logWarn('Use the "position" property to configure the position of a marker');
            config.position = this.viewer.dataHelper.cleanPosition(config);
        }

        if ('width' in config && 'height' in config) {
            utils.logWarn('Use the "size" property to configure the size of a marker');
            // @ts-ignore
            config.size = { width: config['width'], height: config['height'] };
        }

        this.config = utils.deepmerge(this.config, config as any);
        if (typeof this.config.tooltip === 'string') {
            this.config.tooltip = { content: this.config.tooltip };
        }
        if (this.config.tooltip && !this.config.tooltip.trigger) {
            this.config.tooltip.trigger = 'hover';
        }
        if (this.config.scale && Array.isArray(this.config.scale)) {
            this.config.scale = { zoom: this.config.scale as any };
        }
        if (typeof this.config.hoverScale === 'boolean') {
            this.config.hoverScale = this.config.hoverScale
                ? this.plugin.config.defaultHoverScale || DEFAULT_HOVER_SCALE
                : null;
        } else if (typeof this.config.hoverScale === 'number') {
            this.config.hoverScale = { amount: this.config.hoverScale } as any;
        } else if (!this.config.hoverScale) {
            this.config.hoverScale = this.plugin.config.defaultHoverScale;
        }
        if (this.config.hoverScale) {
            this.config.hoverScale = {
                ...DEFAULT_HOVER_SCALE,
                ...this.plugin.config.defaultHoverScale,
                ...this.config.hoverScale,
            };
        }

        this.visible = this.config.visible !== false;

        this.state.anchor = utils.parsePoint(this.config.anchor);

        if (!this.is3d()) {
            const element = this.domElement;

            // reset CSS class
            element.setAttribute('class', 'psv-marker');
            if (this.isNormal() || this.isSvg()) {
                element.classList.add('psv-marker--normal');
            } else {
                element.classList.add('psv-marker--poly');
            }
            if (this.state.visible) {
                element.classList.add('psv-marker--visible');
            }
            if (this.config.tooltip) {
                element.classList.add('psv-marker--has-tooltip');
            }
            if (this.config.content) {
                element.classList.add('psv-marker--has-content');
            }
            if (this.config.className) {
                utils.addClasses(element, this.config.className);
            }

            // apply style
            element.style.opacity = `${this.config.opacity ?? 1}`;
            if (this.config.style) {
                Object.assign(element.style, this.config.style);
            }
        }

        if (this.isNormal()) {
            this.__updateNormal();
        } else if (this.isPoly()) {
            this.__updatePoly();
        } else if (this.isSvg()) {
            this.__updateSvg();
        } else if (this.is3d()) {
            this.__update3d();
        }
    }

    /**
     * Updates a normal marker
     */
    private __updateNormal() {
        const element = this.domElement;

        if (!utils.isExtendedPosition(this.config.position)) {
            throw new PSVError('missing marker position');
        }
        if (this.config.image && !this.config.size) {
            throw new PSVError('missing marker size');
        }

        if (this.config.size) {
            this.state.dynamicSize = false;
            this.state.size = this.config.size;
            element.style.width = this.config.size.width + 'px';
            element.style.height = this.config.size.height + 'px';
        } else {
            this.state.dynamicSize = true;
        }

        switch (this.type) {
            case MarkerType.image:
                this.definition = this.config.image;
                element.style.backgroundImage = `url(${this.config.image})`;
                break;
            case MarkerType.html:
                this.definition = this.config.html;
                element.innerHTML = this.config.html;
                break;
            case MarkerType.element:
                if (this.definition !== this.config.element) {
                    this.definition = this.config.element;
                    element.childNodes.forEach((n) => n.remove());
                    element.appendChild(this.config.element);
                    this.config.element.style.display = 'block';
                }
                break;
        }

        // set anchor
        element.style.transformOrigin = `${this.state.anchor.x * 100}% ${this.state.anchor.y * 100}%`;

        // convert texture coordinates to spherical coordinates
        this.state.position = this.viewer.dataHelper.cleanPosition(this.config.position);

        // compute x/y/z position
        this.state.positions3D = [this.viewer.dataHelper.sphericalCoordsToVector3(this.state.position)];
    }

    /**
     * Updates an SVG marker
     */
    private __updateSvg() {
        const svgElement = this.domElement.firstElementChild as SVGElement;

        if (!utils.isExtendedPosition(this.config.position)) {
            throw new PSVError('missing marker position');
        }

        this.state.dynamicSize = true;

        // set content
        switch (this.type) {
            case MarkerType.square:
                this.definition = {
                    x: 0,
                    y: 0,
                    width: this.config.square,
                    height: this.config.square,
                };
                break;

            case MarkerType.rect:
                if (Array.isArray(this.config.rect)) {
                    this.definition = {
                        x: 0,
                        y: 0,
                        width: this.config.rect[0],
                        height: this.config.rect[1],
                    };
                } else {
                    this.definition = {
                        x: 0,
                        y: 0,
                        width: this.config.rect.width,
                        height: this.config.rect.height,
                    };
                }
                break;

            case MarkerType.circle:
                this.definition = {
                    cx: this.config.circle,
                    cy: this.config.circle,
                    r: this.config.circle,
                };
                break;

            case MarkerType.ellipse:
                if (Array.isArray(this.config.ellipse)) {
                    this.definition = {
                        cx: this.config.ellipse[0],
                        cy: this.config.ellipse[1],
                        rx: this.config.ellipse[0],
                        ry: this.config.ellipse[1],
                    };
                } else {
                    this.definition = {
                        cx: this.config.ellipse.rx,
                        cy: this.config.ellipse.ry,
                        rx: this.config.ellipse.rx,
                        ry: this.config.ellipse.ry,
                    };
                }
                break;

            case MarkerType.path:
                this.definition = {
                    d: this.config.path,
                };
                break;

            // no default
        }

        Object.entries(this.definition).forEach(([prop, value]) => {
            svgElement.setAttributeNS(null, prop, value as string);
        });

        // set style
        if (this.config.svgStyle) {
            Object.entries(this.config.svgStyle).forEach(([prop, value]) => {
                svgElement.setAttributeNS(null, utils.dasherize(prop), value);
            });
        } else {
            svgElement.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
        }

        // set anchor
        this.domElement.style.transformOrigin = `${this.state.anchor.x * 100}% ${this.state.anchor.y * 100}%`;

        // convert texture coordinates to spherical coordinates
        this.state.position = this.viewer.dataHelper.cleanPosition(this.config.position);

        // compute x/y/z position
        this.state.positions3D = [this.viewer.dataHelper.sphericalCoordsToVector3(this.state.position)];
    }

    /**
     * Updates a polygon marker
     */
    private __updatePoly() {
        const element = this.domElement;

        this.state.dynamicSize = true;

        // set style
        if (this.config.svgStyle) {
            Object.entries(this.config.svgStyle).forEach(([prop, value]) => {
                element.setAttributeNS(null, utils.dasherize(prop), value);
            });

            if (this.isPolyline() && !this.config.svgStyle.fill) {
                element.setAttributeNS(null, 'fill', 'none');
            }
        } else if (this.isPolygon()) {
            element.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
        } else if (this.isPolyline()) {
            element.setAttributeNS(null, 'fill', 'none');
            element.setAttributeNS(null, 'stroke', 'rgb(0,0,0)');
        }

        // fold arrays: [1,2,3,4] => [[1,2],[3,4]]
        const actualPoly: any = this.config[this.type];
        if (!Array.isArray(actualPoly[0])) {
            for (let i = 0; i < actualPoly.length; i++) {
                // @ts-ignore
                actualPoly.splice(i, 2, [actualPoly[i], actualPoly[i + 1]]);
            }
        }

        // convert texture coordinates to spherical coordinates
        if (this.isPolyPixels()) {
            this.definition = (actualPoly as Array<[number, number]>).map((coord) => {
                const sphericalCoords = this.viewer.dataHelper.textureCoordsToSphericalCoords({
                    textureX: coord[0],
                    textureY: coord[1],
                });
                return [sphericalCoords.yaw, sphericalCoords.pitch];
            });
        }
        // clean angles
        else {
            this.definition = (actualPoly as Array<[number | string, number | string]>).map((coord) => {
                return [utils.parseAngle(coord[0]), utils.parseAngle(coord[1], true)];
            });
        }

        const centroid = this.isPolygon() ? getPolygonCenter(this.definition) : getPolylineCenter(this.definition);
        this.state.position = { yaw: centroid[0], pitch: centroid[1] };

        // compute x/y/z positions
        this.state.positions3D = (this.definition as Array<[number, number]>).map((coord) => {
            return this.viewer.dataHelper.sphericalCoordsToVector3({ yaw: coord[0], pitch: coord[1] });
        });
    }

    /**
     * Updates a 3D marker
     */
    private __update3d() {
        const element = this.threeElement;
        const mesh = element.children[0] as Mesh<BufferGeometry, MeshBasicMaterial>;

        this.state.dynamicSize = false;

        if (utils.isExtendedPosition(this.config.position)) {
            if (!this.config.size) {
                throw new PSVError('missing marker size');
            }

            this.state.position = this.viewer.dataHelper.cleanPosition(this.config.position);
            this.state.size = this.config.size;

            mesh.position.set(0.5 - this.state.anchor.x, this.state.anchor.y - 0.5, 0);
            this.viewer.dataHelper.sphericalCoordsToVector3(this.state.position, element.position);

            element.lookAt(0, element.position.y, 0);
            switch (this.config.orientation) {
                case 'horizontal':
                    element.rotateX(this.state.position.pitch < 0 ? -Math.PI / 2 : Math.PI / 2);
                    break;
                case 'vertical-left':
                    element.rotateY(-Math.PI * 0.4);
                    break;
                case 'vertical-right':
                    element.rotateY(Math.PI * 0.4);
                    break;
                // no default
            }

            // 100 is magic number that gives a coherent size at default zoom level
            element.scale.set(this.config.size.width / 100, this.config.size.height / 100, 1);

            const p = mesh.geometry.getAttribute('position');
            this.state.positions3D = [0, 1, 3, 2].map((i) => {
                const v3 = new Vector3();
                v3.fromBufferAttribute(p, i);
                return mesh.localToWorld(v3);
            });
        } else {
            if (this.config.position?.length !== 4) {
                throw new PSVError('missing marker position');
            }

            const positions = this.config.position.map((p) => this.viewer.dataHelper.cleanPosition(p));
            const positions3D = positions.map((p) => this.viewer.dataHelper.sphericalCoordsToVector3(p));

            const centroid = getPolygonCenter(positions.map(({ yaw, pitch }) => [yaw, pitch]));
            this.state.position = { yaw: centroid[0], pitch: centroid[1] };

            this.state.positions3D = positions3D;

            const p = mesh.geometry.getAttribute('position');
            [
                positions3D[0],
                positions3D[1],
                positions3D[3], // not a mistake!
                positions3D[2],
            ].forEach((v, i) => {
                p.setX(i, v.x);
                p.setY(i, v.y);
                p.setZ(i, v.z);
            });
        }

        switch (this.type) {
            case MarkerType.videoLayer:
                if (this.definition !== this.config.videoLayer) {
                    mesh.material.map?.dispose();

                    const video = document.createElement('video');
                    video.crossOrigin = this.viewer.config.withCredentials ? 'use-credentials' : 'anonymous';
                    video.loop = true;
                    video.playsInline = true;
                    video.muted = true;
                    video.autoplay = true;
                    video.preload = 'metadata';
                    video.src = this.config.videoLayer;
                    this.viewer.container.appendChild(video);

                    mesh.material.map = new VideoTexture(video);

                    if (!utils.isExtendedPosition(this.config.position)) {
                        video.addEventListener('loadedmetadata', () => {
                            this.__setTextureWrap(mesh.material.map, { width: video.videoWidth, height: video.videoHeight });
                        }, { once: true });
                    }

                    video.play();

                    this.definition = this.config.videoLayer;
                }
                break;

            case MarkerType.imageLayer:
                if (this.definition !== this.config.imageLayer) {
                    mesh.material.map?.dispose();

                    mesh.material.map = new Texture();
                    this.viewer.textureLoader.loadImage(this.config.imageLayer)
                        .then((image) => {
                            if (!utils.isExtendedPosition(this.config.position)) {
                                this.__setTextureWrap(mesh.material.map, { width: image.width, height: image.height });
                            }

                            mesh.material.map.image = image;
                            mesh.material.map.anisotropy = 4;
                            mesh.material.map.needsUpdate = true;
                            this.viewer.needsUpdate();
                        });

                    this.definition = this.config.imageLayer;
                }
                break;

            // no default
        }

        mesh.material.opacity = this.config.opacity ?? 1;
    }

    /**
     * For layers positionned by corners, applies offset to the texture in order to keep its proportions
     */
    private __setTextureWrap(texture: Texture, imageSize: Size) {
        if (!imageSize.height || !imageSize.width) {
            texture.repeat.set(1, 1);
            texture.offset.set(0, 0);
            return;
        }

        const positions = (this.config.position as ExtendedPosition[]).map((p) => {
            return this.viewer.dataHelper.cleanPosition(p);
        });

        const w1 = utils.greatArcDistance(
            [positions[0].yaw, positions[0].pitch],
            [positions[1].yaw, positions[1].pitch]
        );
        const w2 = utils.greatArcDistance(
            [positions[3].yaw, positions[3].pitch],
            [positions[2].yaw, positions[2].pitch]
        );
        const h1 = utils.greatArcDistance(
            [positions[1].yaw, positions[1].pitch],
            [positions[2].yaw, positions[2].pitch]
        );
        const h2 = utils.greatArcDistance(
            [positions[0].yaw, positions[0].pitch],
            [positions[3].yaw, positions[3].pitch]
        );

        const layerRatio = (w1 + w2) / (h1 + h2);
        const imageRatio = imageSize.width / imageSize.height;

        let hMargin = 0;
        let vMargin = 0;
        if (layerRatio < imageRatio) {
            hMargin = imageRatio - layerRatio;
        } else {
            vMargin = 1 / imageRatio - 1 / layerRatio;
        }

        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(1 - hMargin, 1 - vMargin);
        texture.offset.set(hMargin / 2, vMargin / 2);
    }

    private __createMesh() {
        const material = new MeshBasicMaterial({
            transparent: true,
            opacity: 1,
            depthTest: false,
        });
        const geometry = new PlaneGeometry(1, 1);
        const mesh = new Mesh(geometry, material);
        mesh.userData = { [MARKER_DATA]: this };
        const element = new Group().add(mesh);

        // overwrite the visible property to be tied to the Marker instance
        // and do it without context bleed
        Object.defineProperty(element, 'visible', {
            enumerable: true,
            get: function (this: Object3D) {
                return (this.children[0].userData[MARKER_DATA] as Marker).visible;
            },
            set: function (this: Object3D, visible: boolean) {
                (this.children[0].userData[MARKER_DATA] as Marker).visible = visible;
            },
        });

        return element;
    }

    /**
     * Computes the real size of a marker
     * @description This is done by removing all it's transformations (if any) and making it visible
     * before querying its bounding rect
     */
    updateSize() {
        if (!this.state.dynamicSize) {
            return;
        }
        if (!this.isNormal() && !this.isSvg()) {
            return;
        }

        const element = this.domElement;
        const init = !this.state.size;

        if (init) {
            element.classList.add('psv-marker--transparent');
        }

        if (this.isSvg()) {
            const rect = (element.firstElementChild as SVGElement).getBoundingClientRect();
            this.state.size = {
                width: rect.width,
                height: rect.height,
            };
        } else {
            this.state.size = {
                width: (element as HTMLElement).offsetWidth,
                height: (element as HTMLElement).offsetHeight,
            };
        }

        if (init) {
            element.classList.remove('psv-marker--transparent');
        }

        if (this.isSvg()) {
            // the real size must be declared on the SVG root
            element.style.width = this.state.size.width + 'px';
            element.style.height = this.state.size.height + 'px';
        }

        // custom element HTML marker remain dynamic
        if (this.type !== MarkerType.element) {
            this.state.dynamicSize = false;
        }
    }

    /**
     * Determines the type of a marker by the available properties
     * @throws {@link PSVError} when the marker's type cannot be found
     */
    static getType(config: MarkerConfig, allowNone = false): MarkerType {
        const found: MarkerType[] = [];

        Object.keys(MarkerType).forEach((type) => {
            if ((config as any)[type]) {
                found.push(type as MarkerType);
            }
        });

        if (found.length === 0 && !allowNone) {
            throw new PSVError(`missing marker content, either ${Object.keys(MarkerType).join(', ')}`);
        } else if (found.length > 1) {
            throw new PSVError(`multiple marker content, either ${Object.keys(MarkerType).join(', ')}`);
        }

        return found[0];
    }
}
