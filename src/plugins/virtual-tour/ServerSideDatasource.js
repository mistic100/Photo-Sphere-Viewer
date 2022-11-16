import { PSVError, utils } from 'photo-sphere-viewer';
import { AbstractDatasource } from './AbstractDatasource';
import { checkLink, checkNode } from './utils';

/**
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @private
 */
export class ServerSideDatasource extends AbstractDatasource {

  constructor(plugin) {
    super(plugin);

    if (!plugin.config.getNode) {
      throw new PSVError('Missing getNode() option.');
    }

    this.nodeResolver = plugin.config.getNode;
  }

  loadNode(nodeId) {
    if (this.nodes[nodeId]) {
      return Promise.resolve(this.nodes[nodeId]);
    }
    else {
      return Promise.resolve(this.nodeResolver(nodeId))
        .then((node) => {
          checkNode(node, this.plugin.isGps());
          if (!node.links) {
            utils.logWarn(`Node ${node.id} has no links`);
            node.links = [];
          }

          node.links.forEach((link) => {
            // copy essential data
            if (this.nodes[link.nodeId]) {
              link.position = link.position || this.nodes[link.nodeId].position;
              link.name = link.name || this.nodes[link.nodeId].name;
            }

            checkLink(node, link, this.plugin.isGps());
          });

          this.nodes[nodeId] = node;
          return node;
        });
    }
  }

}
