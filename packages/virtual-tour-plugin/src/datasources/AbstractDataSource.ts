import type { Viewer } from '@photo-sphere-viewer/core';
import { PSVError, utils } from '@photo-sphere-viewer/core';
import { VirtualTourLink, VirtualTourNode } from '../model';
import type { VirtualTourPlugin } from '../VirtualTourPlugin';

export abstract class AbstractDatasource {
    nodes: Record<string, VirtualTourNode> = {};

    constructor(
        protected readonly plugin: VirtualTourPlugin,
        protected readonly viewer: Viewer,
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    destroy() {}

    /**
     * Loads a node
     */
    abstract loadNode(nodeId: string): Promise<VirtualTourNode>;

    /**
     * Checks the configuration of a node
     */
    protected checkNode(node: VirtualTourNode) {
        if (!node.id) {
            throw new PSVError('No id given for node');
        }
        if (!node.panorama) {
            throw new PSVError(`No panorama provided for node ${node.id}`);
        }
        if (this.plugin.isGps && !(node.gps?.length >= 2)) {
            throw new PSVError(`No GPS position provided for node ${node.id}`);
        }
        if (!this.plugin.isGps && node.markers?.some(marker => marker.gps && !marker.position)) {
            throw new PSVError(`Cannot use GPS positioning for markers in manual mode`);
        }
        if (!node.links) {
            utils.logWarn(`Node ${node.id} has no links`);
            node.links = [];
        }
    }

    /**
     * Checks the configuration of a link
     */
    protected checkLink(node: VirtualTourNode, link: VirtualTourLink) {
        if (!link.nodeId) {
            throw new PSVError(`Link of node ${node.id} has no target id`);
        }
        if (link.nodeId === node.id) {
            throw new PSVError(`Node ${node.id} links to itself`);
        }
        if (!this.plugin.isGps && !utils.isExtendedPosition(link.position)) {
            throw new PSVError(`No position provided for link ${link.nodeId} of node ${node.id}`);
        }
        if (this.plugin.isGps && !link.gps) {
            throw new PSVError(`No GPS position provided for link ${link.nodeId} of node ${node.id}`);
        }
    }
}
