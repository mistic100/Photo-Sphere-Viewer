import type { Point, Position, Size, Tooltip, TooltipConfig, Viewer } from '@photo-sphere-viewer/core';
import { CONSTANTS, PSVError, utils } from '@photo-sphere-viewer/core';
import { Group, MathUtils, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, TextureLoader, Vector3 } from 'three';
import { MARKER_DATA, SVG_NS } from './constants';
import { MarkerConfig, ParsedMarkerConfig } from './model';
import { getPolygonCenter, getPolylineCenter } from './utils';

export enum MarkerType {
    image = 'image',
    imageLayer = 'imageLayer',
    html = 'html',
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
    private loader?: TextureLoader;

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

    constructor(private readonly viewer: Viewer, config: MarkerConfig) {
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
            this.element = document.createElementNS(SVG_NS, svgType);
        } else if (this.is3d()) {
            this.element = this.__createMesh();
            this.loader = new TextureLoader();
            if (this.viewer.config.withCredentials) {
                this.loader.setWithCredentials(true);
            }
        }

        if (!this.is3d()) {
            this.element.id = `psv-marker-${config.id}`;
            this.element[MARKER_DATA] = this;
        }

        this.update(config);
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
    }

    /**
     * Checks if it is a 3D marker (imageLayer)
     */
    is3d(): boolean {
        return this.type === MarkerType.imageLayer;
    }

    /**
     * Checks if it is a normal marker (image or html)
     */
    isNormal(): boolean {
        return this.type === MarkerType.image
            || this.type === MarkerType.html;
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
    getScale(zoomLevel: number, position: Position): number {
        if (!this.config.scale) {
            return 1;
        }
        if (typeof this.config.scale === 'function') {
            return this.config.scale(zoomLevel, position);
        }

        let scale = 1;
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
                data: this,
                top: 0,
                left: 0,
            };

            if (this.isPoly()) {
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
                config.top = this.state.position2D.y + this.state.size.height / 2;
                config.left = this.state.position2D.x + this.state.size.width / 2;
                config.box = {
                    width: this.state.size.width,
                    height: this.state.size.height,
                };
            }

            if (this.tooltip) {
                this.tooltip.move(config);
            } else {
                this.tooltip = this.viewer.createTooltip(config);
            }
        }
    }

    /**
     * Recompute the position of the tooltip
     * @internal
     */
    refreshTooltip() {
        if (this.tooltip) {
            this.showTooltip();
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

        this.visible = this.config.visible !== false;

        this.state.anchor = utils.parsePoint(this.config.anchor);

        if (!this.is3d()) {
            const element = this.domElement;

            // reset CSS class
            if (this.isNormal()) {
                element.setAttribute('class', 'psv-marker psv-marker--normal');
            } else {
                element.setAttribute('class', 'psv-marker psv-marker--svg');
            }

            // add CSS classes
            if (this.config.className) {
                utils.addClasses(element, this.config.className);
            }

            if (this.config.tooltip) {
                element.classList.add('psv-marker--has-tooltip');
            }
            if (this.config.content) {
                element.classList.add('psv-marker--has-content');
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

        if (this.config.image) {
            this.definition = this.config.image;
            element.style.backgroundImage = `url(${this.config.image})`;
        } else if (this.config.html) {
            this.definition = this.config.html;
            element.innerHTML = this.config.html;
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
        const element = this.domElement;

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
            element.setAttributeNS(null, prop, value as string);
        });

        // set style
        if (this.config.svgStyle) {
            Object.entries(this.config.svgStyle).forEach(([prop, value]) => {
                element.setAttributeNS(null, utils.dasherize(prop), value);
            });
        } else {
            element.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
        }

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
            this.definition = (actualPoly as [number, number][]).map((coord) => {
                const sphericalCoords = this.viewer.dataHelper.textureCoordsToSphericalCoords({
                    textureX: coord[0],
                    textureY: coord[1],
                });
                return [sphericalCoords.yaw, sphericalCoords.pitch];
            });
        }
        // clean angles
        else {
            this.definition = (actualPoly as [number | string, number | string][]).map((coord) => {
                return [utils.parseAngle(coord[0]), utils.parseAngle(coord[1], true)];
            });
        }

        const centroid = this.isPolygon() ? getPolygonCenter(this.definition) : getPolylineCenter(this.definition);

        this.state.position = {
            yaw: centroid[0],
            pitch: centroid[1],
        };

        // compute x/y/z positions
        this.state.positions3D = (this.definition as [number, number][]).map((coord) => {
            return this.viewer.dataHelper.sphericalCoordsToVector3({ yaw: coord[0], pitch: coord[1] });
        });
    }

    /**
     * Updates a 3D marker
     */
    private __update3d() {
        const element = this.threeElement;

        if (!utils.isExtendedPosition(this.config.position)) {
            throw new PSVError('missing marker position');
        }
        if (!this.config.size) {
            throw new PSVError('missing marker size');
        }

        this.state.dynamicSize = false;
        this.state.size = this.config.size;

        // convert texture coordinates to spherical coordinates
        this.state.position = this.viewer.dataHelper.cleanPosition(this.config.position);

        // compute x/y/z position
        this.state.positions3D = [this.viewer.dataHelper.sphericalCoordsToVector3(this.state.position)];

        switch (this.type) {
            case MarkerType.imageLayer:
                if (this.definition !== this.config.imageLayer) {
                    if (this.viewer.config.requestHeaders) {
                        this.loader.setRequestHeader(this.viewer.config.requestHeaders(this.config.imageLayer));
                    }
                    (element.children[0] as Mesh<any, MeshBasicMaterial>).material.map = this.loader.load(
                        this.config.imageLayer,
                        (texture) => {
                            texture.anisotropy = 4;
                            this.viewer.needsUpdate();
                        }
                    );
                    this.definition = this.config.imageLayer;
                }

                (element.children[0] as Mesh).position.set(this.state.anchor.x - 0.5, this.state.anchor.y - 0.5, 0);

                (element.children[0] as Mesh<any, MeshBasicMaterial>).material.opacity = this.config.opacity ?? 1;

                element.position.copy(this.state.positions3D[0]);

                switch (this.config.orientation) {
                    case 'horizontal':
                        element.lookAt(0, element.position.y, 0);
                        element.rotateX(this.state.position.pitch < 0 ? -Math.PI / 2 : Math.PI / 2);
                        break;
                    case 'vertical-left':
                        element.lookAt(0, 0, 0);
                        element.rotateY(-Math.PI * 0.4);
                        break;
                    case 'vertical-right':
                        element.lookAt(0, 0, 0);
                        element.rotateY(Math.PI * 0.4);
                        break;
                    default:
                        element.lookAt(0, 0, 0);
                        break;
                }

                // 100 is magic number that gives a coherent size at default zoom level
                element.scale.set(this.config.size.width / 100, this.config.size.height / 100, 1);
                break;

            // no default
        }
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
