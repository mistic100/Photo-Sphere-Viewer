import {
  AmbientLight,
  BackSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PointLight
} from 'three';
import { AbstractPlugin, CONSTANTS, PSVError, utils } from '../..';
import { ClientSideDatasource } from './ClientSideDatasource';
import {
  ARROW_GEOM,
  ARROW_OUTLINE_GEOM,
  DEFAULT_ARROW,
  DEFAULT_MARKER,
  EVENTS,
  LINK_DATA,
  MODE_3D,
  MODE_CLIENT,
  MODE_GPS,
  MODE_MANUAL,
  MODE_MARKERS,
  MODE_SERVER
} from './constants';
import { ServerSideDatasource } from './ServerSideDatasource';
import './style.scss';
import { bearing, distance, setMeshColor } from './utils';


/**
 * @callback GetNode
 * @summary Function to load a node
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @param {string} nodeId
 * @returns {PSV.plugins.VirtualTourPlugin.Node|Promise<PSV.plugins.VirtualTourPlugin.Node>}
 */

/**
 * @callback Preload
 * @summary Function to determine if a link must be preloaded
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @param {PSV.plugins.VirtualTourPlugin.Node} node
 * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
 * @returns {boolean}
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.Node
 * @summary Definition of a single node in the tour
 * @property {string} id - unique identifier of the node
 * @property {*} panorama
 * @property {PSV.plugins.VirtualTourPlugin.NodeLink[]} [links] - links to other nodes
 * @property {number[]} [position] - GPS position (longitude, latitude, optional altitude)
 * @property {PSV.PanoData | PSV.PanoDataProvider} [panoData] - data used for this panorama
 * @property {PSV.SphereCorrection} [sphereCorrection] - sphere correction to apply to this panorama
 * @property {string} [name] - short name of the node
 * @property {string} [caption] - caption visible in the navbar
 * @property {string} [description] - description visible in the side panel
 * @property {string} [thumbnail] - thumbnail for the gallery
 * @property {PSV.plugins.MarkersPlugin.Properties[]} [markers] - additional markers to use on this node
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.plugins.VirtualTourPlugin.NodeLink
 * @summary Definition of a link between two nodes
 * @property {string} nodeId - identifier of the target node
 * @property {string} [name] - override the name of the node (tooltip)
 * @property {number[]} [position] - override the GPS position of the node
 * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - override global marker style
 * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - override global arrow style
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.ArrowStyle
 * @summary Style of the arrow in 3D mode
 * @property {string} [color=0xaaaaaa]
 * @property {string} [hoverColor=0xaa5500]
 * @property {number} [outlineColor=0x000000]
 * @property {number[]} [scale=[0.5,2]]
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.Options
 * @property {'client'|'server'} [dataMode='client'] - configure data mode
 * @property {'manual'|'gps'} [positionMode='manual'] - configure positioning mode
 * @property {'markers'|'3d'} [renderMode='3d'] - configure rendering mode of links
 * @property {PSV.plugins.VirtualTourPlugin.Node[]} [nodes] - initial nodes
 * @property {PSV.plugins.VirtualTourPlugin.GetNode} [getNode]
 * @property {string} [startNodeId] - id of the initial node, if not defined the first node will be used
 * @property {boolean|PSV.plugins.VirtualTourPlugin.Preload} [preload=false] - preload linked panoramas
 * @property {boolean|string|number} [rotateSpeed='20rpm'] - speed of rotation when clicking on a link, if 'false' the viewer won't rotate at all
 * @property {boolean|number} [transition=1500] - duration of the transition between nodes
 * @property {boolean} [linksOnCompass] - if the Compass plugin is enabled, displays the links on the compass, defaults to `true` on in markers render mode
 * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - global marker style
 * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - global arrow style
 * @property {number} [markerLatOffset=-0.1] - (GPS & Markers mode) latitude offset applied to link markers, to compensate for viewer height
 * @property {'top'|'bottom'} [arrowPosition='bottom'] - (3D mode) arrows vertical position
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.NodeChangedData
 * @summary Data associated to the "node-changed" event
 * @type {PSV.plugins.VirtualTourPlugin.Node} [fromNode] - The previous node
 * @type {PSV.plugins.VirtualTourPlugin.NodeLink} [fromLink] - The link that was clicked in the previous node
 * @type {PSV.Position} [fromLinkPosition] - The position of the link on the previous node
 */


export { EVENTS, MODE_3D, MODE_CLIENT, MODE_GPS, MODE_MANUAL, MODE_MARKERS, MODE_SERVER } from './constants';


/**
 * @summary Create virtual tours by linking multiple panoramas
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class VirtualTourPlugin extends AbstractPlugin {

  static id = 'virtual-tour';

  static EVENTS = EVENTS;
  static MODE_CLIENT = MODE_CLIENT;
  static MODE_SERVER = MODE_SERVER;
  static MODE_3D = MODE_3D;
  static MODE_MARKERS = MODE_MARKERS;
  static MODE_MANUAL = MODE_MANUAL;
  static MODE_GPS = MODE_GPS;

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.VirtualTourPlugin.Options} [options]
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {Object}
     * @property {PSV.plugins.VirtualTourPlugin.Node} currentNode
     * @property {PSV.Tooltip} currentTooltip
     * @property {string} loadingNode
     * @property {function} stopObserver
     * @private
     */
    this.prop = {
      currentNode   : null,
      currentTooltip: null,
      loadingNode   : null,
      stopObserver  : null,
    };

    /**
     * @type {Record<string, boolean | Promise>}
     * @private
     */
    this.preload = {};

    /**
     * @member {PSV.plugins.VirtualTourPlugin.Options}
     * @private
     */
    this.config = {
      dataMode       : MODE_CLIENT,
      positionMode   : MODE_MANUAL,
      renderMode     : MODE_3D,
      preload        : false,
      rotateSpeed    : '20rpm',
      transition     : CONSTANTS.DEFAULT_TRANSITION,
      markerLatOffset: -0.1,
      arrowPosition  : 'bottom',
      linksOnCompass : options?.renderMode === MODE_MARKERS,
      ...options,
      markerStyle: {
        ...DEFAULT_MARKER,
        ...options?.markerStyle,
      },
      arrowStyle : {
        ...DEFAULT_ARROW,
        ...options?.arrowStyle,
      },
    };

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @private
     */
    this.markers = null;

    /**
     * @type {PSV.plugins.CompassPlugin}
     * @private
     */
    this.compass = null;

    /**
     * @type {PSV.plugins.GalleryPlugin}
     * @private
     */
    this.gallery = null;

    /**
     * @type {PSV.plugins.VirtualTourPlugin.AbstractDatasource}
     */
    this.datasource = null;

    /**
     * @type {external:THREE.Group}
     * @private
     */
    this.arrowsGroup = null;

    if (this.is3D()) {
      this.arrowsGroup = new Group();

      const localLight = new PointLight(0xffffff, 1, 0);
      localLight.position.set(0, this.config.arrowPosition === 'bottom' ? 2 : -2, 0);
      this.arrowsGroup.add(localLight);
    }
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.markers = this.psv.getPlugin('markers');
    this.compass = this.psv.getPlugin('compass');
    this.gallery = this.psv.getPlugin('gallery');

    if (!this.is3D() && !this.markers) {
      throw new PSVError('VirtualTour plugin requires the Markers plugin in markers mode.');
    }

    if (this.markers?.config.markers) {
      utils.logWarn('No default markers can be configured on Markers plugin when using VirtualTour plugin. '
        + 'Consider defining `markers` on each tour node.');
      delete this.markers.config.markers;
    }

    this.datasource = this.isServerSide() ? new ServerSideDatasource(this) : new ClientSideDatasource(this);

    if (this.is3D()) {
      this.psv.once(CONSTANTS.EVENTS.READY, () => {
        this.__positionArrows();
        this.psv.renderer.scene.add(this.arrowsGroup);

        const ambientLight = new AmbientLight(0xffffff, 1);
        this.psv.renderer.scene.add(ambientLight);

        this.psv.needsUpdate();
      });

      this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.on(CONSTANTS.EVENTS.CLICK, this);
      this.prop.stopObserver = this.psv.observeObjects(LINK_DATA, this);
    }
    else {
      this.markers.on('select-marker', this);
    }

    if (this.isServerSide()) {
      if (this.config.startNodeId) {
        this.setCurrentNode(this.config.startNodeId);
      }
    }
    else if (this.config.nodes) {
      this.setNodes(this.config.nodes, this.config.startNodeId);
      delete this.config.nodes;
    }
  }

  /**
   * @package
   */
  destroy() {
    if (this.markers) {
      this.markers.off('select-marker', this);
    }
    if (this.arrowsGroup) {
      this.psv.renderer.scene.remove(this.arrowsGroup);
    }

    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.CLICK, this);
    this.prop.stopObserver?.();

    this.datasource.destroy();

    delete this.preload;
    delete this.datasource;
    delete this.markers;
    delete this.compass;
    delete this.gallery;
    delete this.arrowsGroup;

    super.destroy();
  }

  handleEvent(e) {
    let link;
    switch (e.type) {
      case 'select-marker':
        link = e.args[0].data?.[LINK_DATA];
        if (link) {
          this.setCurrentNode(link.nodeId, link);
        }
        break;

      case CONSTANTS.EVENTS.POSITION_UPDATED:
      case CONSTANTS.EVENTS.ZOOM_UPDATED:
        if (this.arrowsGroup) {
          this.__positionArrows();
        }
        break;

      case CONSTANTS.EVENTS.CLICK:
        link = e.args[0].objects.find(o => o.userData[LINK_DATA])?.userData[LINK_DATA];
        if (link) {
          this.setCurrentNode(link.nodeId, link);
        }
        break;

      case CONSTANTS.OBJECT_EVENTS.ENTER_OBJECT:
        this.__onEnterObject(e.detail.object, e.detail.viewerPoint);
        break;
      case CONSTANTS.OBJECT_EVENTS.HOVER_OBJECT:
        this.__onHoverObject(e.detail.object, e.detail.viewerPoint);
        break;
      case CONSTANTS.OBJECT_EVENTS.LEAVE_OBJECT:
        this.__onLeaveObject(e.detail.object);
        break;

      default:
    }
  }

  /**
   * @summary Tests if running in server mode
   * @return {boolean}
   */
  isServerSide() {
    return this.config.dataMode === MODE_SERVER;
  }

  /**
   * @summary Tests if running in GPS mode
   * @return {boolean}
   */
  isGps() {
    return this.config.positionMode === MODE_GPS;
  }

  /**
   * @summary Tests if running in 3D mode
   * @return {boolean}
   */
  is3D() {
    return this.config.renderMode === MODE_3D;
  }

  /**
   * @summary Sets the nodes (client mode only)
   * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
   * @param {string} [startNodeId]
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  setNodes(nodes, startNodeId) {
    if (this.isServerSide()) {
      throw new PSVError('Cannot set nodes in server side mode');
    }

    this.datasource.setNodes(nodes);

    if (!startNodeId) {
      startNodeId = nodes[0].id;
    }
    else if (!this.datasource.nodes[startNodeId]) {
      startNodeId = nodes[0].id;
      utils.logWarn(`startNodeId not found is provided nodes, resetted to ${startNodeId}`);
    }

    this.setCurrentNode(startNodeId);

    if (this.gallery) {
      this.gallery.setItems(
        nodes.map(node => ({
          id       : node.id,
          panorama : node.panorama,
          name     : node.name,
          thumbnail: node.thumbnail,
          options  : {
            caption         : node.caption,
            panoData        : node.panoData,
            sphereCorrection: node.sphereCorrection,
            description     : node.description,
          },
        })),
        (id) => {
          this.setCurrentNode(id);
          this.gallery.hide();
        }
      );
    }
  }

  /**
   * @summary Changes the current node
   * @param {string} nodeId
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} [fromLink]
   * @returns {Promise<boolean>} resolves false if the loading was aborted by another call
   */
  setCurrentNode(nodeId, fromLink = null) {
    if (nodeId === this.prop.currentNode?.id) {
      return Promise.resolve(true);
    }

    this.psv.hideError();

    this.prop.loadingNode = nodeId;

    const fromNode = this.prop.currentNode;
    const fromLinkPosition = fromNode && fromLink ? this.__getLinkPosition(fromNode, fromLink) : null;

    return Promise.all([
      // if this node is already preloading, wait for it
      Promise.resolve(this.preload[nodeId])
        .then(() => {
          if (this.prop.loadingNode !== nodeId) {
            throw utils.getAbortError();
          }

          return this.datasource.loadNode(nodeId);
        }),
      Promise.resolve(fromLinkPosition ? this.config.rotateSpeed : false)
        .then((speed) => { // eslint-disable-line consistent-return
          if (speed) {
            return this.psv.animate({ ...fromLinkPosition, speed });
          }
        })
        .then(() => {
          this.psv.loader.show();
        }),
    ])
      .then(([node]) => {
        if (this.prop.loadingNode !== nodeId) {
          throw utils.getAbortError();
        }

        this.prop.currentNode = node;

        if (this.prop.currentTooltip) {
          this.prop.currentTooltip.hide();
          this.prop.currentTooltip = null;
        }

        if (this.is3D()) {
          this.arrowsGroup.remove(...this.arrowsGroup.children.filter(o => o.type === 'Mesh'));
        }

        this.markers?.clearMarkers();
        this.compass?.clearHotspots();

        return this.psv.setPanorama(node.panorama, {
          transition      : this.config.transition,
          caption         : node.caption,
          description     : node.description,
          panoData        : node.panoData,
          sphereCorrection: node.sphereCorrection,
        })
          .then((completed) => {
            if (!completed) {
              throw utils.getAbortError();
            }
          });
      })
      .then(() => {
        if (this.prop.loadingNode !== nodeId) {
          throw utils.getAbortError();
        }

        const node = this.prop.currentNode;

        if (node.markers) {
          if (this.markers) {
            this.markers.setMarkers(node.markers);
          }
          else {
            utils.logWarn(`Node ${node.id} markers ignored because the plugin is not loaded.`);
          }
        }

        this.__renderLinks(node);
        this.__preload(node);

        /**
         * @event node-changed
         * @memberof PSV.plugins.VirtualTourPlugin
         * @summary Triggered when the current node is changed
         * @param {string} nodeId
         * @param {PSV.plugins.VirtualTourPlugin.NodeChangedData} data
         */
        this.trigger(EVENTS.NODE_CHANGED, nodeId, {
          fromNode,
          fromLink,
          fromLinkPosition,
        });

        this.prop.loadingNode = null;

        return true;
      })
      .catch((err) => {
        if (utils.isAbortError(err)) {
          return false;
        }

        this.psv.showError(this.psv.config.lang.loadError);

        this.psv.loader.hide();
        this.psv.navbar.setCaption('');

        this.prop.loadingNode = null;

        throw err;
      });
  }

  /**
   * @summary Adds the links for the node
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @private
   */
  __renderLinks(node) {
    const positions = [];

    node.links.forEach((link) => {
      const position = this.__getLinkPosition(node, link);
      positions.push(position);

      if (this.is3D()) {
        const mesh = new Mesh(ARROW_GEOM, new MeshLambertMaterial());
        mesh.userData = { [LINK_DATA]: link, longitude: position.longitude };
        mesh.rotation.order = 'YXZ';
        mesh.rotateY(-position.longitude);
        this.psv.dataHelper
          .sphericalCoordsToVector3({ longitude: position.longitude, latitude: 0 }, mesh.position)
          .multiplyScalar(1 / CONSTANTS.SPHERE_RADIUS);

        const outlineMesh = new Mesh(ARROW_OUTLINE_GEOM, new MeshBasicMaterial({ side: BackSide }));
        outlineMesh.position.copy(mesh.position);
        outlineMesh.rotation.copy(mesh.rotation);

        setMeshColor(mesh, link.arrowStyle?.color || this.config.arrowStyle.color);
        setMeshColor(outlineMesh, link.arrowStyle?.outlineColor || this.config.arrowStyle.outlineColor);

        this.arrowsGroup.add(mesh);
        this.arrowsGroup.add(outlineMesh);
      }
      else {
        if (this.isGps()) {
          position.latitude += this.config.markerLatOffset;
        }

        this.markers.addMarker({
          ...this.config.markerStyle,
          ...link.markerStyle,
          id      : `tour-link-${link.nodeId}`,
          tooltip : link.name,
          visible : true,
          hideList: true,
          content : null,
          data    : { [LINK_DATA]: link },
          ...position,
        }, false);
      }
    });

    if (this.is3D()) {
      this.__positionArrows();
    }
    else {
      this.markers.renderMarkers();
    }

    if (this.config.linksOnCompass && this.compass) {
      this.compass.setHotspots(positions);
    }
  }

  /**
   * @summary Computes the marker position for a link
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
   * @return {PSV.Position}
   * @private
   */
  __getLinkPosition(node, link) {
    if (this.isGps()) {
      const p1 = [MathUtils.degToRad(node.position[0]), MathUtils.degToRad(node.position[1])];
      const p2 = [MathUtils.degToRad(link.position[0]), MathUtils.degToRad(link.position[1])];
      const h1 = node.position[2] !== undefined ? node.position[2] : link.position[2] || 0;
      const h2 = link.position[2] !== undefined ? link.position[2] : node.position[2] || 0;

      let latitude = 0;
      if (h1 !== h2) {
        latitude = Math.atan((h2 - h1) / distance(p1, p2));
      }

      const longitude = bearing(p1, p2);

      return { longitude, latitude };
    }
    else {
      return this.psv.dataHelper.cleanPosition(link);
    }
  }

  /**
   * @private
   */
  __onEnterObject(mesh, viewerPoint) {
    const link = mesh.userData[LINK_DATA];

    setMeshColor(mesh, link.arrowStyle?.hoverColor || this.config.arrowStyle.hoverColor);

    if (link.name) {
      this.prop.currentTooltip = this.psv.tooltip.create({
        left   : viewerPoint.x,
        top    : viewerPoint.y,
        content: link.name,
      });
    }

    this.psv.needsUpdate();
  }


  /**
   * @private
   */
  __onHoverObject(mesh, viewerPoint) {
    if (this.prop.currentTooltip) {
      this.prop.currentTooltip.move({
        left: viewerPoint.x,
        top : viewerPoint.y,
      });
    }
  }


  /**
   * @private
   */
  __onLeaveObject(mesh) {
    const link = mesh.userData[LINK_DATA];

    setMeshColor(mesh, link.arrowStyle?.color || this.config.arrowStyle.color);

    if (this.prop.currentTooltip) {
      this.prop.currentTooltip.hide();
      this.prop.currentTooltip = null;
    }

    this.psv.needsUpdate();
  }

  /**
   * @summary Updates to position of the group of arrows
   * @private
   */
  __positionArrows() {
    this.arrowsGroup.position.copy(this.psv.prop.direction).multiplyScalar(0.5);
    const s = this.config.arrowStyle.scale;
    const f = s[1] + (s[0] - s[1]) * (this.psv.getZoomLevel() / 100);
    const y = 2.5 - (this.psv.getZoomLevel() / 100) * 1.5;
    this.arrowsGroup.position.y += this.config.arrowPosition === 'bottom' ? -y : y;
    this.arrowsGroup.scale.set(f, f, f);
  }

  /**
   * @summary Manage the preload of the linked panoramas
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @private
   */
  __preload(node) {
    if (!this.config.preload) {
      return;
    }

    this.preload[node.id] = true;

    this.prop.currentNode.links
      .filter(link => !this.preload[link.nodeId])
      .filter((link) => {
        if (typeof this.config.preload === 'function') {
          return this.config.preload(this.prop.currentNode, link);
        }
        else {
          return true;
        }
      })
      .forEach((link) => {
        this.preload[link.nodeId] = this.datasource.loadNode(link.nodeId)
          .then((linkNode) => {
            return this.psv.textureLoader.preloadPanorama(linkNode.panorama);
          })
          .then(() => {
            this.preload[link.nodeId] = true;
          })
          .catch(() => {
            delete this.preload[link.nodeId];
          });
      });
  }

}
