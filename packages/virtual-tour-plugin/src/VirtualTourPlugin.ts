import type { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import type { Point, Position, Tooltip, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, PSVError, events, utils } from '@photo-sphere-viewer/core';
import type { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import type { MapPlugin, events as mapEvents } from '@photo-sphere-viewer/map-plugin';
import type { Marker, MarkerConfig, MarkersPlugin, events as markersEvents } from '@photo-sphere-viewer/markers-plugin';
import { MathUtils, Mesh } from 'three';
import { ArrowsRenderer } from './ArrowsRenderer';
import { DEFAULT_ARROW, DEFAULT_MARKER, LINK_DATA, LINK_ID } from './constants';
import { AbstractDatasource } from './datasources/AbstractDataSource';
import { ClientSideDatasource } from './datasources/ClientSideDatasource';
import { ServerSideDatasource } from './datasources/ServerSideDatasource';
import { NodeChangedEvent, VirtualTourEvents } from './events';
import {
    GpsPosition,
    VirtualTourLink,
    VirtualTourMarkerStyle,
    VirtualTourNode,
    VirtualTourPluginConfig,
    VirtualTourTransitionOptions,
} from './model';
import { gpsDistance, gpsToSpherical, setMeshColor } from './utils';

const getConfig = utils.getConfigParser<VirtualTourPluginConfig>(
    {
        dataMode: 'client',
        positionMode: 'manual',
        renderMode: '3d',
        nodes: null,
        getNode: null,
        startNodeId: null,
        preload: false,
        transitionOptions: {
            speed: '20rpm',
            fadeIn: true,
            rotation: true,
        },
        rotateSpeed: null,
        transition: null,
        linksOnCompass: true,
        markerStyle: DEFAULT_MARKER,
        arrowStyle: DEFAULT_ARROW,
        markerPitchOffset: -0.1,
        arrowPosition: 'bottom',
        map: null,
    },
    {
        dataMode(dataMode) {
            if (dataMode !== 'client' && dataMode !== 'server') {
                throw new PSVError('VirtualTourPlugin: invalid dataMode');
            }
            return dataMode;
        },
        positionMode(positionMode) {
            if (positionMode !== 'gps' && positionMode !== 'manual') {
                throw new PSVError('VirtualTourPlugin: invalid positionMode');
            }
            return positionMode;
        },
        renderMode(renderMode) {
            if (renderMode !== '3d' && renderMode !== 'markers') {
                throw new PSVError('VirtualTourPlugin: invalid renderMode');
            }
            return renderMode;
        },
        markerStyle(markerStyle, { defValue }) {
            // historically the user set "html=null" to override the marker type
            if (markerStyle.html === null) {
                markerStyle.element = null;
            }
            return { ...defValue, ...markerStyle };
        },
        arrowStyle(arrowStyle, { defValue }) {
            return { ...defValue, ...arrowStyle };
        },
        map(map, { rawConfig }) {
            if (map) {
                if (rawConfig.dataMode === 'server') {
                    utils.logWarn('VirtualTourPlugin: The map cannot be used in server side mode');
                    return null;
                }
                if (!map.imageUrl) {
                    utils.logWarn('VirtualTourPlugin: configuring the map requires at least "imageUrl"');
                    return null;
                }
            }
            return map;
        },
        transitionOptions(transitionOptions, { rawConfig }) {
            if (typeof transitionOptions === 'object') {
                if (!utils.isNil(rawConfig.transition)) {
                    utils.logWarn('VirtualTourPlugin: "transition" option is deprecated, use "transitionOptions" instead');
                    if (typeof rawConfig.transition === 'number') {
                        transitionOptions.speed = rawConfig.transition;
                    } else if (rawConfig.transition === false) {
                        transitionOptions.fadeIn = false;
                    }
                }
                if (!utils.isNil(rawConfig.rotateSpeed)) {
                    utils.logWarn('VirtualTourPlugin: "rotateSpeed" option is deprecated, use "transitionOptions" instead');
                    if (rawConfig.rotateSpeed === false) {
                        transitionOptions.rotation = false;
                    }
                }
            }
            return transitionOptions;
        },
    }
);

/**
 * Creates virtual tours by linking multiple panoramas
 */
export class VirtualTourPlugin extends AbstractConfigurablePlugin<
    VirtualTourPluginConfig,
    VirtualTourPluginConfig,
    never,
    VirtualTourEvents
> {
    static override readonly id = 'virtual-tour';
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions = Object.keys(getConfig.defaults);

    private readonly state = {
        currentNode: null as VirtualTourNode,
        currentTooltip: null as Tooltip,
        loadingNode: null as string,
        preload: {} as Record<string, boolean | Promise<any>>,
    };

    private datasource: AbstractDatasource;
    private arrowsRenderer: ArrowsRenderer;

    private map?: MapPlugin;
    private markers?: MarkersPlugin;
    private compass?: CompassPlugin;
    private gallery?: GalleryPlugin;

    get is3D(): boolean {
        return this.config.renderMode === '3d';
    }

    get isServerSide(): boolean {
        return this.config.dataMode === 'server';
    }

    get isGps(): boolean {
        return this.config.positionMode === 'gps';
    }

    constructor(viewer: Viewer, config: VirtualTourPluginConfig) {
        super(viewer, config);

        if (this.is3D) {
            this.arrowsRenderer = new ArrowsRenderer(this.viewer, this);
        }
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'virtual-tour-plugin');

        this.markers = this.viewer.getPlugin('markers');
        this.compass = this.viewer.getPlugin('compass');
        this.gallery = this.viewer.getPlugin('gallery');

        if (!this.is3D && !this.markers) {
            throw new PSVError('VirtualTour plugin requires the Markers plugin in markers mode.');
        }

        if (this.markers?.config.markers) {
            utils.logWarn(
                'No default markers can be configured on Markers plugin when using VirtualTour plugin. '
                + 'Consider defining `markers` on each tour node.'
            );
            delete this.markers.config.markers;
        }

        if (this.config.map) {
            this.map = this.viewer.getPlugin('map');
            if (!this.map) {
                utils.logWarn('The map is configured on the VirtualTourPlugin but the MapPlugin is not loaded.');
            }
        }

        this.datasource = this.isServerSide
            ? new ServerSideDatasource(this, this.viewer)
            : new ClientSideDatasource(this, this.viewer);

        if (this.is3D) {
            this.viewer.observeObjects(LINK_DATA);

            this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
            this.viewer.addEventListener(events.SizeUpdatedEvent.type, this);
            this.viewer.addEventListener(events.ClickEvent.type, this);
            this.viewer.addEventListener(events.ObjectEnterEvent.type, this);
            this.viewer.addEventListener(events.ObjectHoverEvent.type, this);
            this.viewer.addEventListener(events.ObjectLeaveEvent.type, this);
            this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });

            this.viewer.renderer.setCustomRenderer((renderer) => this.arrowsRenderer.withRenderer(renderer));
        } else {
            this.markers.addEventListener('enter-marker', this);
            this.markers.addEventListener('select-marker', this);
        }

        if (this.map) {
            this.map.addEventListener('select-hotspot', this);
            this.map.setImage(this.config.map.imageUrl);
        }

        if (this.isServerSide) {
            if (this.config.startNodeId) {
                this.setCurrentNode(this.config.startNodeId);
            }
        } else if (this.config.nodes) {
            this.setNodes(this.config.nodes, this.config.startNodeId);
            delete this.config.nodes;
        }
    }

    /**
     * @internal
     */
    override destroy() {
        if (this.markers) {
            this.markers.removeEventListener('enter-marker', this);
            this.markers.removeEventListener('select-marker', this);
        }

        if (this.is3D) {
            this.viewer.renderer.setCustomRenderer(null);
        }

        this.map?.removeEventListener('select-hotspot', this);

        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ClickEvent.type, this);
        this.viewer.removeEventListener(events.ObjectEnterEvent.type, this);
        this.viewer.removeEventListener(events.ObjectHoverEvent.type, this);
        this.viewer.removeEventListener(events.ObjectLeaveEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);

        this.viewer.unobserveObjects(LINK_DATA);

        this.datasource.destroy();
        this.arrowsRenderer?.destroy();

        delete this.datasource;
        delete this.markers;
        delete this.compass;
        delete this.gallery;
        delete this.arrowsRenderer;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.SizeUpdatedEvent || e instanceof events.PositionUpdatedEvent || e instanceof events.ReadyEvent) {
            this.arrowsRenderer.updateCamera();

        } else if (e instanceof events.ClickEvent) {
            const link = e.data.objects.find((o) => o.userData[LINK_DATA])?.userData[LINK_DATA];
            if (link) {
                this.setCurrentNode(link.nodeId, null, link);
            }
        } else if (e.type === 'select-marker') {
            const marker = (e as markersEvents.SelectMarkerEvent).marker;
            const link = marker.data?.[LINK_DATA];
            if (link) {
                this.setCurrentNode(link.nodeId, null, link);
            }
        } else if (e.type === 'enter-marker') {
            const marker = (e as markersEvents.EnterMarkerEvent).marker;
            const link = marker.data?.[LINK_DATA];
            if (link) {
                this.__onEnterMarker(marker, link);
            }
        } else if (e instanceof events.ObjectEnterEvent) {
            if (e.userDataKey === LINK_DATA) {
                this.__onEnterObject(e.object, e.viewerPoint);
            }
        } else if (e instanceof events.ObjectLeaveEvent) {
            if (e.userDataKey === LINK_DATA) {
                this.__onLeaveObject(e.object);
            }
        } else if (e instanceof events.ObjectHoverEvent) {
            if (e.userDataKey === LINK_DATA) {
                this.__onHoverObject(e.viewerPoint);
            }
        } else if (e.type === 'select-hotspot') {
            const id = (e as mapEvents.SelectHotspot).hotspotId;
            if (id.startsWith(LINK_ID)) {
                this.setCurrentNode(id.substring(LINK_ID.length));
            }
        }
    }

    /**
     * Sets the nodes (client mode only)
     * @throws {@link PSVError} if not in client mode
     */
    setNodes(nodes: VirtualTourNode[], startNodeId?: string) {
        if (this.isServerSide) {
            throw new PSVError('Cannot set nodes in server side mode');
        }

        (this.datasource as ClientSideDatasource).setNodes(nodes);

        if (!startNodeId) {
            startNodeId = nodes[0].id;
        } else if (!this.datasource.nodes[startNodeId]) {
            startNodeId = nodes[0].id;
            utils.logWarn(`startNodeId not found is provided nodes, resetted to ${startNodeId}`);
        }

        this.setCurrentNode(startNodeId);

        if (this.gallery) {
            this.gallery.setItems(
                nodes.map((node) => ({
                    id: node.id,
                    panorama: node.panorama,
                    name: node.name,
                    thumbnail: node.thumbnail,
                    options: {
                        caption: node.caption,
                        panoData: node.panoData,
                        sphereCorrection: node.sphereCorrection,
                        description: node.description,
                    },
                })),
                (id) => {
                    this.setCurrentNode(id as string);
                }
            );
        }

        if (this.map) {
            this.map.setHotspots([
                ...nodes.map((node) => {
                    return {
                        ...(node.map || {}),
                        ...this.__getNodeMapPosition(node),
                        id: LINK_ID + node.id,
                        tooltip: node.name,
                    };
                }),
            ]);
        }
    }

    /**
     * Changes the current node
     * @returns {Promise<boolean>} resolves false if the loading was aborted by another call
     */
    setCurrentNode(
        nodeId: string,
        options?: VirtualTourTransitionOptions,
        fromLink?: VirtualTourLink
    ): Promise<boolean> {
        if (nodeId === this.state.currentNode?.id) {
            return Promise.resolve(true);
        }

        this.viewer.hideError();

        this.state.loadingNode = nodeId;

        const fromNode = this.state.currentNode;
        const fromLinkPosition = fromNode && fromLink ? this.__getLinkPosition(fromNode, fromLink) : null;

        // if this node is already preloading, wait for it
        return Promise.resolve(this.state.preload[nodeId])
            .then(() => {
                if (this.state.loadingNode !== nodeId) {
                    throw utils.getAbortError();
                }

                return this.datasource.loadNode(nodeId);
            })
            .then((node) => {
                if (this.state.loadingNode !== nodeId) {
                    throw utils.getAbortError();
                }

                const transitionOptions: VirtualTourTransitionOptions = {
                    speed: (getConfig.defaults.transitionOptions as any).speed,
                    fadeIn: (getConfig.defaults.transitionOptions as any).fadeIn,
                    rotation: (getConfig.defaults.transitionOptions as any).rotation,
                    rotateTo: fromLinkPosition,
                    ...(typeof this.config.transitionOptions === 'function'
                        ? this.config.transitionOptions(node, fromNode, fromLink)
                        : this.config.transitionOptions),
                    ...options,
                };

                if (transitionOptions.rotation && !transitionOptions.fadeIn) {
                    return this.viewer
                        .animate({
                            ...transitionOptions.rotateTo,
                            speed: transitionOptions.speed,
                        })
                        .then(() => [node, transitionOptions] as [VirtualTourNode, VirtualTourTransitionOptions]);
                } else {
                    return Promise.resolve([node, transitionOptions] as [VirtualTourNode, VirtualTourTransitionOptions]);
                }
            })
            .then(([node, transitionOptions]) => {
                if (this.state.loadingNode !== nodeId) {
                    throw utils.getAbortError();
                }

                this.viewer.loader.show();

                this.state.currentNode = node;

                if (this.state.currentTooltip) {
                    this.state.currentTooltip.hide();
                    this.state.currentTooltip = null;
                }

                this.arrowsRenderer?.clearArrows();
                this.gallery?.hide();
                this.markers?.clearMarkers();
                this.compass?.clearHotspots();
                this.map?.minimize();

                return this.viewer
                    .setPanorama(node.panorama, {
                        caption: node.caption,
                        description: node.description,
                        panoData: node.panoData,
                        sphereCorrection: node.sphereCorrection,
                        transition: !transitionOptions.fadeIn ? false : transitionOptions.rotation ? true : 'fade-only',
                        speed: transitionOptions.speed,
                        position: transitionOptions.rotateTo,
                        zoom: transitionOptions.zoomTo,
                    })
                    .then((completed) => {
                        if (!completed) {
                            throw utils.getAbortError();
                        }
                    });
            })
            .then(() => {
                if (this.state.loadingNode !== nodeId) {
                    throw utils.getAbortError();
                }

                const node = this.state.currentNode;

                if (this.map) {
                    const center = this.__getNodeMapPosition(node);
                    this.map.setCenter(center);
                }

                if (node.markers) {
                    this.__addNodeMarkers(node);
                }

                this.__renderLinks(node);
                this.__preload(node);

                this.state.loadingNode = null;

                this.dispatchEvent(
                    new NodeChangedEvent(node, {
                        fromNode,
                        fromLink,
                        fromLinkPosition,
                    })
                );

                return true;
            })
            .catch((err) => {
                if (utils.isAbortError(err)) {
                    return false;
                }

                this.viewer.showError(this.viewer.config.lang.loadError);

                this.viewer.loader.hide();
                this.viewer.navbar.setCaption('');

                this.state.loadingNode = null;

                throw err;
            });
    }

    /**
     * Adds the links for the node
     */
    private __renderLinks(node: VirtualTourNode) {
        const positions: Position[] = [];

        let minDist = Number.POSITIVE_INFINITY;
        let maxDist = Number.NEGATIVE_INFINITY;
        const linksDist: Record<string, number> = {};

        if (this.isGps) {
            node.links.forEach((link) => {
                const dist = gpsDistance(node.gps, link.gps);
                linksDist[link.nodeId] = dist;
                minDist = Math.min(dist, minDist);
                maxDist = Math.max(dist, maxDist);
            });
        }

        node.links.forEach((link) => {
            const position = this.__getLinkPosition(node, link);
            position.yaw += link.linkOffset?.yaw ?? 0;
            position.pitch += link.linkOffset?.pitch ?? 0;
            positions.push(position);

            if (this.is3D) {
                let depth = 1;
                if (!utils.isNil(link.linkOffset?.depth)) {
                    depth = link.linkOffset.depth;
                } else if (this.isGps && minDist !== maxDist) {
                    depth = MathUtils.mapLinear(linksDist[link.nodeId], minDist, maxDist, 0.5, 1.5);
                }
                this.arrowsRenderer.addArrow(link, position, depth);
            } else {
                if (this.isGps) {
                    position.pitch += this.config.markerPitchOffset;
                }

                const config: MarkerConfig | VirtualTourMarkerStyle = {
                    ...this.config.markerStyle,
                    ...link.markerStyle,
                    tooltip: {
                        className: 'psv-virtual-tour-tooltip',
                        content: link.name,
                    },
                    position: position,
                    id: LINK_ID + link.nodeId,
                    visible: true,
                    hideList: true,
                    data: { [LINK_DATA]: link },
                };

                if (typeof config.element === 'function') {
                    config.element = config.element(link);
                }

                this.markers.addMarker(config as any, false);
            }
        });

        if (this.is3D) {
            this.viewer.needsUpdate();
        } else {
            this.markers.renderMarkers();
        }

        if (this.config.linksOnCompass && this.compass) {
            this.compass.setHotspots(positions);
        }
    }

    /**
     * Computes the marker position for a link
     */
    private __getLinkPosition(node: VirtualTourNode, link: VirtualTourLink): Position {
        if (this.isGps) {
            return gpsToSpherical(node.gps, link.gps);
        } else {
            return this.viewer.dataHelper.cleanPosition(link.position);
        }
    }

    /**
     * Returns the complete tootlip content for a node
     */
    private async __getTooltipContent(nodeId: string): Promise<string> {
        const node = await this.datasource.loadNode(nodeId);
        const elements: string[] = [];

        if (node.name || node.thumbnail || node.caption) {
            if (node.name) {
                elements.push(`<h3>${node.name}</h3>`);
            }
            if (node.thumbnail) {
                elements.push(`<img src="${node.thumbnail}">`);
            }
            if (node.caption) {
                elements.push(`<p>${node.caption}</p>`);
            }
        }

        return elements.join('');
    }

    private __onEnterMarker(marker: Marker, link: VirtualTourLink) {
        this.__getTooltipContent(link.nodeId)
            .then((content) => {
                if (content) {
                    this.markers.updateMarker({
                        id: marker.id,
                        tooltip: {
                            className: 'psv-virtual-tour-tooltip',
                            content: content, 
                        },
                    });
                }
            });
    }

    private __onEnterObject(mesh: Mesh, viewerPoint: Point) {
        const link: VirtualTourLink = mesh.userData[LINK_DATA];

        setMeshColor(mesh as any, link.arrowStyle?.hoverColor || this.config.arrowStyle.hoverColor);

        this.__getTooltipContent(link.nodeId)
            .then((content) => {
                if (content) {
                    this.state.currentTooltip = this.viewer.createTooltip({
                        left: viewerPoint.x,
                        top: viewerPoint.y,
                        box: {
                            // separate the tooltip from the cursor
                            width: 20,
                            height: 20,
                        },
                        className: 'psv-virtual-tour-tooltip',
                        content: content,
                    });
                }
            });

        this.map?.setActiveHotspot(LINK_ID + link.nodeId);

        this.viewer.needsUpdate();
        this.viewer.setCursor('pointer');
    }

    private __onHoverObject(viewerPoint: Point) {
        if (this.state.currentTooltip) {
            this.state.currentTooltip.move({
                left: viewerPoint.x,
                top: viewerPoint.y,
            });
        }
    }

    private __onLeaveObject(mesh: Mesh) {
        const link = mesh.userData[LINK_DATA];

        setMeshColor(mesh as any, link.arrowStyle?.color || this.config.arrowStyle.color);

        if (this.state.currentTooltip) {
            this.state.currentTooltip.hide();
            this.state.currentTooltip = null;
        }

        this.map?.setActiveHotspot(null);

        this.viewer.needsUpdate();
        this.viewer.setCursor(null);
    }

    /**
     * Manage the preload of the linked panoramas
     */
    private __preload(node: VirtualTourNode) {
        if (!this.config.preload) {
            return;
        }

        this.state.preload[node.id] = true;

        this.state.currentNode.links
            .filter((link) => !this.state.preload[link.nodeId])
            .filter((link) => {
                if (typeof this.config.preload === 'function') {
                    return this.config.preload(this.state.currentNode, link);
                } else {
                    return true;
                }
            })
            .forEach((link) => {
                this.state.preload[link.nodeId] = this.datasource
                    .loadNode(link.nodeId)
                    .then((linkNode) => {
                        return this.viewer.textureLoader.preloadPanorama(linkNode.panorama);
                    })
                    .then(() => {
                        this.state.preload[link.nodeId] = true;
                    })
                    .catch(() => {
                        delete this.state.preload[link.nodeId];
                    });
            });
    }

    /**
     * Changes the markers to the ones defined on the node
     */
    private __addNodeMarkers(node: VirtualTourNode) {
        if (this.markers) {
            this.markers.setMarkers(
                node.markers.map((marker) => {
                    if (marker.gps && this.isGps) {
                        marker.position = gpsToSpherical(node.gps, marker.gps);
                        if (marker.data?.['map'] && this.map) {
                            Object.assign(marker.data['map'], this.__getGpsMapPosition(marker.gps));
                        }
                    }
                    return marker;
                })
            );
        } else {
            utils.logWarn(`Node ${node.id} markers ignored because the plugin is not loaded.`);
        }
    }

    /**
     * Gets the position of a node on the map, if applicable
     */
    private __getNodeMapPosition(node: VirtualTourNode): Point {
        const fromGps = this.__getGpsMapPosition(node.gps);
        if (fromGps) {
            return fromGps;
        } else if (node.map) {
            return { x: node.map.x, y: node.map.y };
        } else {
            return null;
        }
    }

    /**
     * Gets a gps position on the map
     */
    private __getGpsMapPosition(gps: GpsPosition): Point {
        const map = this.config.map;
        if (this.isGps && map.extent && map.size) {
            return {
                x: MathUtils.mapLinear(gps[0], map.extent[0], map.extent[2], 0, map.size.width),
                y: MathUtils.mapLinear(gps[1], map.extent[1], map.extent[3], 0, map.size.height),
            };
        } else {
            return null;
        }
    }
}
