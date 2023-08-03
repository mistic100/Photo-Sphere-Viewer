import type { Viewer } from '@photo-sphere-viewer/core';
import { PSVError, utils } from '@photo-sphere-viewer/core';
import { VirtualTourLink, VirtualTourNode } from '../model';
import type { VirtualTourPlugin } from '../VirtualTourPlugin';

export abstract class AbstractDatasource {
    nodes: Record<string, VirtualTourNode> = {};

    constructor(
        protected readonly plugin: VirtualTourPlugin,
        protected readonly viewer: Viewer
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    destroy() {}

    /**
     * @summary Loads a node
     * @param {string} nodeId
     * @return {Promise<PSV.plugins.VirtualTourPlugin.Node>}
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
        if ('position' in node) {
            utils.logWarn('Use the "gps" property to configure the GPS position of a virtual node');
            // @ts-ignore
            node.gps = node['position'];
        }
        if (this.plugin.isGps && !(node.gps?.length >= 2)) {
            throw new PSVError(`No GPS position provided for node ${node.id}`);
        }
        if (!this.plugin.isGps && node.markers?.some((marker) => marker.gps && !marker.position)) {
            throw new PSVError(`Cannot use GPS positioning for markers in manual mode`);
        }
    }

    /**
     * Checks the configuration of a link
     */
    protected checkLink(node: VirtualTourNode, link: VirtualTourLink) {
        if (!link.nodeId) {
            throw new PSVError(`Link of node ${node.id} has no target id`);
        }
        if (Array.isArray(link.position)) {
            utils.logWarn('Use the "gps" property to configure the GPS position of a virtual link');
            link.gps = link.position as any;
            delete link.position;
        }
        if (utils.isExtendedPosition(link)) {
            utils.logWarn('Use the "position" property to configure the position of a virtual link');
            link.position = this.viewer.dataHelper.cleanPosition(link);
        }
        if (!this.plugin.isGps && !utils.isExtendedPosition(link.position)) {
            throw new PSVError(`No position provided for link ${link.nodeId} of node ${node.id}`);
        }
        if (this.plugin.isGps && !link.gps) {
            throw new PSVError(`No GPS position provided for link ${link.nodeId} of node ${node.id}`);
        }
    }
}
