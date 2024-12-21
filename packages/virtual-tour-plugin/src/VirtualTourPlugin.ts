import type { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import type { Point, Position, Tooltip, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, PSVError, events, utils } from '@photo-sphere-viewer/core';
import type { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import type { MapPlugin, events as mapEvents } from '@photo-sphere-viewer/map-plugin';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { PlanPlugin, events as planEvents } from '@photo-sphere-viewer/plan-plugin';
import { MathUtils } from 'three';
import { ArrowsRenderer } from './ArrowsRenderer';
import { DEFAULT_ARROW, LINK_DATA, LINK_ID, LOADING_TOOLTIP } from './constants';
import { AbstractDatasource } from './datasources/AbstractDataSource';
import { ClientSideDatasource } from './datasources/ClientSideDatasource';
import { ServerSideDatasource } from './datasources/ServerSideDatasource';
import { EnterArrowEvent, LeaveArrowEvent, NodeChangedEvent, VirtualTourEvents } from './events';
import {
    GpsPosition,
    VirtualTourLink,
    VirtualTourNode,
    VirtualTourPluginConfig,
    VirtualTourTransitionOptions,
} from './model';
import { gpsToSpherical } from './utils';

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
            showLoader: true,
            speed: '20rpm',
            effect: 'fade',
            rotation: true,
        },
        linksOnCompass: true,
        showLinkTooltip: true,
        getLinkTooltip: null,
        arrowStyle: DEFAULT_ARROW,
        arrowsPosition: {
            minPitch: 0.3,
            maxPitch: Math.PI / 2,
            linkOverlapAngle: Math.PI / 4,
            linkPitchOffset: -0.1,
        },
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
            if (renderMode !== '3d' && renderMode !== '2d') {
                throw new PSVError('VirtualTourPlugin: invalid renderMode');
            }
            return renderMode;
        },
        arrowsPosition(arrowsPosition, { defValue }) {
            return { ...defValue, ...arrowsPosition };
        },
        arrowStyle(arrowStyle, { defValue }) {
            return { ...defValue, arrowStyle };
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
    },
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
    static override readonly VERSION = PKG_VERSION;
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
    private plan?: PlanPlugin;
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

        this.arrowsRenderer = new ArrowsRenderer(this.viewer, this);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.arrowsRenderer.init();

        utils.checkStylesheet(this.viewer.container, 'virtual-tour-plugin');

        this.markers = this.viewer.getPlugin('markers');
        this.compass = this.viewer.getPlugin('compass');

        if (this.markers?.config.markers) {
            utils.logWarn(
                'No default markers can be configured on the MarkersPlugin when using the VirtualTourPlugin. '
                + 'Consider defining `markers` on each tour node.',
            );
            delete this.markers.config.markers;
        }

        if (this.isGps) {
            this.plan = this.viewer.getPlugin('plan');
        }

        if (!this.isServerSide) {
            this.gallery = this.viewer.getPlugin('gallery');
            this.map = this.viewer.getPlugin('map');

            if (this.config.map && !this.map) {
                utils.logWarn('The map is configured on the VirtualTourPlugin but the MapPlugin is not loaded.');
            }
        }

        this.datasource = this.isServerSide
            ? new ServerSideDatasource(this, this.viewer)
            : new ClientSideDatasource(this, this.viewer);

        if (this.map) {
            this.map.addEventListener('select-hotspot', this);
            this.map.setImage(this.config.map.imageUrl);
        }

        this.plan?.addEventListener('select-hotspot', this);

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
        this.map?.removeEventListener('select-hotspot', this);
        this.plan?.removeEventListener('select-hotspot', this);

        this.datasource.destroy();
        this.arrowsRenderer.destroy();

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
        if (e instanceof events.ClickEvent) {
            const link = e.data.objects.find(o => o.userData[LINK_DATA])?.userData[LINK_DATA];
            if (link) {
                this.setCurrentNode(link.nodeId, null, link);
            }
        } else if (e.type === 'select-hotspot') {
            const id = (e as mapEvents.SelectHotspot | planEvents.SelectHotspot).hotspotId;
            if (id.startsWith(LINK_ID)) {
                this.setCurrentNode(id.substring(LINK_ID.length));
            }
        }
    }

    /**
     * Returns the current node
     */
    getCurrentNode(): VirtualTourNode {
        return this.state.currentNode;
    }

    /**
     * Sets the nodes (client mode only)
     * @throws {@link PSVError} if not in client mode
     */
    setNodes(nodes: VirtualTourNode[], startNodeId?: string) {
        if (this.isServerSide) {
            throw new PSVError('Cannot set nodes in server side mode');
        }

        this.__hideTooltip();
        this.state.currentNode = null;

        (this.datasource as ClientSideDatasource).setNodes(nodes);

        if (!startNodeId) {
            startNodeId = nodes[0].id;
        } else if (!this.datasource.nodes[startNodeId]) {
            startNodeId = nodes[0].id;
            utils.logWarn(`startNodeId not found is provided nodes, resetted to ${startNodeId}`);
        }
        this.setCurrentNode(startNodeId);

        this.__setGalleryItems();
        this.__setMapHotspots();
        this.__setPlanHotspots();
    }

    /**
     * Changes the current node
     * @returns {Promise<boolean>} resolves false if the loading was aborted by another call
     */
    setCurrentNode(
        nodeId: string,
        options?: VirtualTourTransitionOptions & {
            /**
             * reload the node even if already loaded
             */
            forceUpdate?: boolean;
        },
        fromLink?: VirtualTourLink,
    ): Promise<boolean> {
        if (nodeId === this.state.currentNode?.id && !options?.forceUpdate) {
            return Promise.resolve(true);
        }

        if (options?.forceUpdate && this.isServerSide) {
            (this.datasource as ServerSideDatasource).clearCache();
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
                    ...getConfig.defaults.transitionOptions,
                    rotateTo: fromLinkPosition,
                    zoomTo: fromLinkPosition ? this.viewer.getZoomLevel() : null, // prevents the adapter to apply InitialHorizontalFOVDegrees
                    ...(typeof this.config.transitionOptions === 'function'
                        ? this.config.transitionOptions(node, fromNode, fromLink)
                        : this.config.transitionOptions),
                    ...options,
                };

                if (!transitionOptions.effect) {
                    transitionOptions.effect = 'none';
                }

                this.__hideTooltip();

                this.arrowsRenderer.clear();

                if (this.gallery?.config.hideOnClick) {
                    this.gallery.hide();
                }

                this.map?.minimize();
                this.plan?.minimize();

                if (transitionOptions.rotation && transitionOptions.effect === 'none') {
                    return this.viewer
                        .animate({
                            ...transitionOptions.rotateTo,
                            zoom: transitionOptions.zoomTo,
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

                this.markers?.clearMarkers();

                if (this.config.linksOnCompass) {
                    this.compass?.clearHotspots();
                }

                return this.viewer
                    .setPanorama(node.panorama, {
                        caption: node.caption,
                        description: node.description,
                        panoData: node.panoData,
                        sphereCorrection: node.sphereCorrection,
                        showLoader: transitionOptions.showLoader,
                        position: transitionOptions.rotateTo,
                        zoom: transitionOptions.zoomTo,
                        transition: transitionOptions.effect === 'none'
                            ? false
                            : {
                                    effect: transitionOptions.effect,
                                    rotation: transitionOptions.rotation,
                                    speed: transitionOptions.speed,
                                },
                    })
                    .then((completed) => {
                        if (!completed) {
                            throw utils.getAbortError();
                        }

                        return node;
                    });
            })
            .then((node) => {
                if (this.state.loadingNode !== nodeId) {
                    throw utils.getAbortError();
                }

                this.state.currentNode = node;

                this.map?.setCenter(this.__getNodeMapPosition(node));
                this.plan?.setCoordinates(node.gps);

                this.__addNodeMarkers(node);
                this.__renderLinks(node);
                this.__preload(node);

                this.state.loadingNode = null;

                this.dispatchEvent(
                    new NodeChangedEvent(node, {
                        fromNode,
                        fromLink,
                        fromLinkPosition,
                    }),
                );

                this.viewer.resetIdleTimer();

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
     * Rotate the view to face the link
     */
    async gotoLink(nodeId: string, speed: string | number = '8rpm'): Promise<void> {
        const position = this.getLinkPosition(nodeId);

        if (!speed) {
            this.viewer.rotate(position);
        } else {
            await this.viewer.animate({
                ...position,
                speed,
            });
        }
    }

    /**
     * Returns the position of a link in the viewer
     */
    getLinkPosition(nodeId: string): Position {
        const link = this.state.currentNode?.links.find(link => link.nodeId === nodeId);

        if (!link) {
            throw new PSVError(`Cannot find link "${nodeId}"`);
        }

        return this.__getLinkPosition(this.state.currentNode, link);
    }

    /**
     * Updates a node (client mode only)
     * All properties but "id" are optional, the new config will be merged with the previous
     * @throws {@link PSVError} if not in client mode
     */
    updateNode(newNode: Partial<VirtualTourNode> & { id: VirtualTourNode['id'] }) {
        if (this.isServerSide) {
            throw new PSVError('Cannot update node in server side mode');
        }

        const node = (this.datasource as ClientSideDatasource).updateNode(newNode);

        if (newNode.name || newNode.thumbnail || newNode.panorama) {
            this.__setGalleryItems();
        }
        if (newNode.name || newNode.gps || newNode.map) {
            this.__setMapHotspots();
        }
        if (newNode.name || newNode.gps || newNode.plan) {
            this.__setPlanHotspots();
        }

        if (this.state.currentNode?.id === node.id) {
            this.__hideTooltip();

            if (newNode.panorama || newNode.panoData || newNode.sphereCorrection) {
                this.setCurrentNode(node.id, { forceUpdate: true });
                return;
            }

            if (newNode.caption) {
                this.viewer.setOption('caption', node.caption);
            }
            if (newNode.description) {
                this.viewer.setOption('description', node.description);
            }

            if (newNode.links || newNode.gps) {
                this.__renderLinks(node);
            }

            if (newNode.gps) {
                this.plan?.setCoordinates(node.gps);
            }

            if (newNode.map || newNode.gps) {
                this.map?.setCenter(this.__getNodeMapPosition(node));
            }

            if (newNode.markers || newNode.gps) {
                this.__addNodeMarkers(node);
            }
        }
    }

    /**
     * Updates the gallery plugin
     */
    private __setGalleryItems() {
        if (this.gallery) {
            this.gallery.setItems(
                Object.values(this.datasource.nodes).map(node => ({
                    id: node.id,
                    panorama: node.panorama,
                    name: node.name,
                    thumbnail: node.thumbnail,
                })),
                (id) => {
                    this.setCurrentNode(id as string);
                },
            );
        }
    }

    /**
     * Update the map plugin
     */
    private __setMapHotspots() {
        if (this.map) {
            this.map.setHotspots(
                Object.values(this.datasource.nodes).map(node => ({
                    ...(node.map || {}),
                    ...this.__getNodeMapPosition(node),
                    id: LINK_ID + node.id,
                    tooltip: node.name,
                })),
            );
        }
    }

    /**
     * Updates the plan plugin
     */
    private __setPlanHotspots() {
        if (this.plan) {
            this.plan.setHotspots(
                Object.values(this.datasource.nodes).map(node => ({
                    ...(node.plan || {}),
                    coordinates: node.gps,
                    id: LINK_ID + node.id,
                    tooltip: node.name,
                })),
            );
        }
    }

    /**
     * Adds the links for the node
     */
    private __renderLinks(node: VirtualTourNode) {
        this.arrowsRenderer.clear();

        const positions: Position[] = [];

        node.links.forEach((link) => {
            const position = this.__getLinkPosition(node, link);
            position.yaw += link.linkOffset?.yaw ?? 0;
            position.pitch += link.linkOffset?.pitch ?? 0;

            if (this.isGps && !this.is3D) {
                position.pitch += this.config.arrowsPosition.linkPitchOffset;
            }

            positions.push(position);

            this.arrowsRenderer.addLinkArrow(link, position, link.linkOffset?.depth);
        });

        this.arrowsRenderer.render();

        if (this.config.linksOnCompass) {
            this.compass?.setHotspots(positions);
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
    private async __getTooltipContent(link: VirtualTourLink): Promise<string> {
        const node = await this.datasource.loadNode(link.nodeId);
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

        let content = elements.join('');
        if (this.config.getLinkTooltip) {
            content = this.config.getLinkTooltip(content, link, node);
        }
        return content;
    }

    /** @internal */
    __onEnterArrow(link: VirtualTourLink, evt: MouseEvent) {
        const viewerPos = utils.getPosition(this.viewer.container);

        const viewerPoint: Point = {
            x: evt.clientX - viewerPos.x,
            y: evt.clientY - viewerPos.y,
        };

        if (this.config.showLinkTooltip) {
            this.state.currentTooltip = this.viewer.createTooltip({
                ...LOADING_TOOLTIP,
                left: viewerPoint.x,
                top: viewerPoint.y,
                box: {
                    // separate the tooltip from the cursor
                    width: 20,
                    height: 20,
                },
            });

            this.__getTooltipContent(link).then((content) => {
                if (content) {
                    this.state.currentTooltip.update(content);
                } else {
                    this.__hideTooltip();
                }
            });
        }

        this.map?.setActiveHotspot(LINK_ID + link.nodeId);
        this.plan?.setActiveHotspot(LINK_ID + link.nodeId);

        this.dispatchEvent(new EnterArrowEvent(link, this.state.currentNode));
    }

    /** @internal */
    __onHoverArrow(evt: MouseEvent) {
        const viewerPos = utils.getPosition(this.viewer.container);

        const viewerPoint: Point = {
            x: evt.clientX - viewerPos.x,
            y: evt.clientY - viewerPos.y,
        };

        this.state.currentTooltip?.move({
            left: viewerPoint.x,
            top: viewerPoint.y,
        });
    }

    /** @internal */
    __onLeaveArrow(link: VirtualTourLink) {
        this.__hideTooltip();

        this.map?.setActiveHotspot(null);
        this.plan?.setActiveHotspot(null);

        this.dispatchEvent(new LeaveArrowEvent(link, this.state.currentNode));
    }

    /**
     * Hides the tooltip
     */
    private __hideTooltip() {
        this.state.currentTooltip?.hide();
        this.state.currentTooltip = null;
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
            .filter(link => !this.state.preload[link.nodeId])
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
        if (node.markers) {
            if (this.markers) {
                this.markers.setMarkers(
                    node.markers.map((marker) => {
                        if (marker.gps && this.isGps) {
                            marker.position = gpsToSpherical(node.gps, marker.gps);
                            if (marker.data?.['map']) {
                                Object.assign(marker.data['map'], this.__getGpsMapPosition(marker.gps));
                            }
                            if (marker.data?.['plan']) {
                                marker.data['plan'].coordinates = marker.gps;
                            }
                        }
                        return marker;
                    }),
                );
            } else {
                utils.logWarn(`Node ${node.id} markers ignored because the plugin is not loaded.`);
            }
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
        if (this.isGps && map && map.extent && map.size) {
            return {
                x: MathUtils.mapLinear(gps[0], map.extent[0], map.extent[2], 0, map.size.width),
                y: MathUtils.mapLinear(gps[1], map.extent[1], map.extent[3], 0, map.size.height),
            };
        } else {
            return null;
        }
    }
}
