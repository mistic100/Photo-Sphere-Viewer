import { PSVError, utils } from 'photo-sphere-viewer';

/**
 * @summary Checks the configuration of a node
 * @param {PSV.plugins.VirtualTourPlugin.Node} node
 * @param {boolean} isGps
 * @private
 */
export function checkNode(node, isGps) {
  if (!node.id) {
    throw new PSVError('No id given for node');
  }
  if (!node.panorama) {
    throw new PSVError(`No panorama provided for node ${node.id}`);
  }
  if (isGps && !(node.position?.length >= 2)) {
    throw new PSVError(`No position provided for node ${node.id}`);
  }
}

/**
 * @summary Checks the configuration of a link
 * @param {PSV.plugins.VirtualTourPlugin.Node} node
 * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
 * @param {boolean} isGps
 * @private
 */
export function checkLink(node, link, isGps) {
  if (!link.nodeId) {
    throw new PSVError(`Link of node ${node.id} has no target id`);
  }
  if (!isGps && !utils.isExtendedPosition(link)) {
    throw new PSVError(`No position provided for link ${link.nodeId} of node ${node.id}`);
  }
  if (isGps && !link.position) {
    throw new PSVError(`No GPS position provided for link ${link.nodeId} of node ${node.id}`);
  }
}

/**
 * @summary Changes the color of a mesh
 * @param {external:THREE.Mesh} mesh
 * @param {*} color
 * @private
 */
export function setMeshColor(mesh, color) {
  mesh.material.color.set(color);
}

/**
 * @summary Returns the distance between two GPS points
 * @param {number[]} p1
 * @param {number[]} p2
 * @return {number}
 * @private
 */
export function distance(p1, p2) {
  return utils.greatArcDistance(p1, p2) * 6371e3;
}

/**
 * @summary Returns the bearing between two GPS points
 * {@link http://www.movable-type.co.uk/scripts/latlong.html}
 * @param {number[]} p1
 * @param {number[]} p2
 * @return {number}
 * @private
 */
export function bearing(p1, p2) {
  const [λ1, φ1] = p1;
  const [λ2, φ2] = p2;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return Math.atan2(y, x);
}
