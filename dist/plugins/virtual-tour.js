/*!
* Photo Sphere Viewer 4.7.3
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2022 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.VirtualTourPlugin = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, three, photoSphereViewer) { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  /**
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @private
   */

  var AbstractDatasource = /*#__PURE__*/function () {
    /**
     * @type {Record<string, PSV.plugins.VirtualTourPlugin.Node>}
     */

    /**
     * @param {PSV.plugins.VirtualTourPlugin} plugin
     */
    function AbstractDatasource(plugin) {
      this.nodes = {};
      this.plugin = plugin;
    }

    var _proto = AbstractDatasource.prototype;

    _proto.destroy = function destroy() {
      delete this.plugin;
    }
    /**
     * @summary Loads a node
     * @param {string} nodeId
     * @return {Promise<PSV.plugins.VirtualTourPlugin.Node>}
     */
    ;

    _proto.loadNode = function loadNode(nodeId) {
      // eslint-disable-line no-unused-vars
      throw new photoSphereViewer.PSVError('loadNode not implemented');
    }
    /**
     * @summary Loades nodes linked to another node
     * @param {string} nodeId
     * @return {Promise<void>}
     */
    ;

    _proto.loadLinkedNodes = function loadLinkedNodes(nodeId) {
      // eslint-disable-line no-unused-vars
      throw new photoSphereViewer.PSVError('loadLinkedNodes not implemented');
    };

    return AbstractDatasource;
  }();

  /**
   * @summary Checks the configuration of a node
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {boolean} isGps
   * @private
   */

  function checkNode(node, isGps) {
    var _node$position;

    if (!node.id) {
      throw new photoSphereViewer.PSVError('No id given for node');
    }

    if (!node.panorama) {
      throw new photoSphereViewer.PSVError("No panorama provided for node " + node.id);
    }

    if (isGps && !(((_node$position = node.position) == null ? void 0 : _node$position.length) >= 2)) {
      throw new photoSphereViewer.PSVError("No position provided for node " + node.id);
    }
  }
  /**
   * @summary Checks the configuration of a link
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
   * @param {boolean} isGps
   * @private
   */

  function checkLink(node, link, isGps) {
    if (!link.nodeId) {
      throw new photoSphereViewer.PSVError("Link of node " + node.id + " has no target id");
    }

    if (!isGps && !photoSphereViewer.utils.isExtendedPosition(link)) {
      throw new photoSphereViewer.PSVError("No position provided for link " + link.nodeId + " of node " + node.id);
    }
  }
  /**
   * @summary Changes the color of a mesh
   * @param {external:THREE.Mesh} mesh
   * @param {*} color
   * @private
   */

  function setMeshColor(mesh, color) {
    mesh.material.color.set(color);
  }
  /**
   * @summary Returns the distance between two GPS points
   * @param {number[]} p1
   * @param {number[]} p2
   * @return {number}
   * @private
   */

  function distance(p1, p2) {
    return photoSphereViewer.utils.greatArcDistance(p1, p2) * 6371e3;
  }
  /**
   * @summary Returns the bearing between two GPS points
   * {@link http://www.movable-type.co.uk/scripts/latlong.html}
   * @param {number[]} p1
   * @param {number[]} p2
   * @return {number}
   * @private
   */

  function bearing(p1, p2) {
    var λ1 = p1[0],
        φ1 = p1[1];
    var λ2 = p2[0],
        φ2 = p2[1];
    var y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    var x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    return Math.atan2(y, x);
  }

  /**
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @private
   */

  var ClientSideDatasource = /*#__PURE__*/function (_AbstractDatasource) {
    _inheritsLoose(ClientSideDatasource, _AbstractDatasource);

    function ClientSideDatasource() {
      return _AbstractDatasource.apply(this, arguments) || this;
    }

    var _proto = ClientSideDatasource.prototype;

    _proto.loadNode = function loadNode(nodeId) {
      if (this.nodes[nodeId]) {
        return Promise.resolve(this.nodes[nodeId]);
      } else {
        return Promise.reject(new photoSphereViewer.PSVError("Node " + nodeId + " not found"));
      }
    };

    _proto.loadLinkedNodes = function loadLinkedNodes(nodeId) {
      if (!this.nodes[nodeId]) {
        return Promise.reject(new photoSphereViewer.PSVError("Node " + nodeId + " not found"));
      } else {
        return Promise.resolve();
      }
    };

    _proto.setNodes = function setNodes(rawNodes) {
      var _this = this;

      if (!(rawNodes != null && rawNodes.length)) {
        throw new photoSphereViewer.PSVError('No nodes provided');
      }

      var nodes = {};
      var linkedNodes = {};
      rawNodes.forEach(function (node) {
        checkNode(node, _this.plugin.isGps());

        if (nodes[node.id]) {
          throw new photoSphereViewer.PSVError("Duplicate node " + node.id);
        }

        if (!node.links) {
          photoSphereViewer.utils.logWarn("Node " + node.id + " has no links");
          nodes.links = [];
        }

        nodes[node.id] = node;
      });
      rawNodes.forEach(function (node) {
        node.links.forEach(function (link) {
          checkLink(node, link, _this.plugin.isGps());

          if (!nodes[link.nodeId]) {
            throw new photoSphereViewer.PSVError("Target node " + link.nodeId + " of node " + node.id + " does not exists");
          } // copy essential data


          link.position = link.position || nodes[link.nodeId].position;
          link.name = link.name || nodes[link.nodeId].name;
          linkedNodes[link.nodeId] = true;
        });
      });
      rawNodes.forEach(function (node) {
        if (!linkedNodes[node.id]) {
          photoSphereViewer.utils.logWarn("Node " + node.id + " is never linked to");
        }
      });
      this.nodes = nodes;
    };

    return ClientSideDatasource;
  }(AbstractDatasource);

  var metadata$1={version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"};var uuid$1="8B1A6E5B-A7CC-4471-9CA0-BD64D80ABB79";var type$1="BufferGeometry";var data$1={attributes:{position:{itemSize:3,type:"Float32Array",array:[-25,-15,-2.5,0,0,-2.5,0,-5,-2.5,0,-5,-2.5,0,0,-2.5,25,-15,-2.5,0,-5,-2.5,25,-15,-2.5,25,-20,-2.5,0,-5,-2.5,-25,-20,-2.5,-25,-15,-2.5,25,-15,2.5,25,-20,2.5,25,-15,-2.5,25,-15,-2.5,25,-20,2.5,25,-20,-2.5,25,-20,2.5,0,-5,2.5,25,-20,-2.5,25,-20,-2.5,0,-5,2.5,0,-5,-2.5,0,-5,2.5,-25,-20,2.5,0,-5,-2.5,0,-5,-2.5,-25,-20,2.5,-25,-20,-2.5,-25,-20,2.5,-25,-15,2.5,-25,-20,-2.5,-25,-20,-2.5,-25,-15,2.5,-25,-15,-2.5,-25,-15,2.5,0,0,2.5,-25,-15,-2.5,-25,-15,-2.5,0,0,2.5,0,0,-2.5,0,0,2.5,25,-15,2.5,0,0,-2.5,0,0,-2.5,25,-15,2.5,25,-15,-2.5,25,-20,2.5,25,-15,2.5,0,-5,2.5,0,-5,2.5,25,-15,2.5,0,0,2.5,0,-5,2.5,0,0,2.5,-25,-15,2.5,-25,-15,2.5,-25,-20,2.5,0,-5,2.5],normalized:false},normal:{itemSize:3,type:"Float32Array",array:[0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],normalized:false}},boundingSphere:{center:[0,-10,0],radius:27.041634}};var arrowGeometryJson = {metadata:metadata$1,uuid:uuid$1,type:type$1,data:data$1};

  var arrowIconSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 210 210\" x=\"0px\" y=\"0px\"><path fill=\"currentColor\" transform=\"translate(0 10)\" d=\"M0 181l105 -181 105 181 -105 -61 -105 61zm105 -167l0 99 86 50 -86 -148z\"/><!-- Created by Saifurrijal from the Noun Project --></svg>\n";

  var metadata={version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"};var uuid="B12A1453-6E56-40AC-840B-BA7DF5DB9E2A";var type="BufferGeometry";var data={attributes:{position:{itemSize:3,type:"Float32Array",array:[-26,-21.766189,-3.5,-26,-14.433809,-3.5,0,-6.16619,-3.5,0,-6.16619,-3.5,-26,-14.433809,-3.5,0,1.16619,-3.5,0,-6.16619,-3.5,0,1.16619,-3.5,26,-14.43381,-3.5,26,-14.43381,-3.5,26,-21.766191,-3.5,0,-6.16619,-3.5,-26,-14.433809,3.5,0,1.16619,3.5,-26,-14.433809,-3.5,-26,-14.433809,-3.5,0,1.16619,3.5,0,1.16619,-3.5,0,1.16619,3.5,26,-14.43381,3.5,0,1.16619,-3.5,0,1.16619,-3.5,26,-14.43381,3.5,26,-14.43381,-3.5,26,-14.43381,3.5,26,-21.766191,3.5,26,-14.43381,-3.5,26,-14.43381,-3.5,26,-21.766191,3.5,26,-21.766191,-3.5,26,-21.766191,3.5,0,-6.16619,3.5,26,-21.766191,-3.5,26,-21.766191,-3.5,0,-6.16619,3.5,0,-6.16619,-3.5,0,-6.16619,3.5,-26,-21.766189,3.5,0,-6.16619,-3.5,0,-6.16619,-3.5,-26,-21.766189,3.5,-26,-21.766189,-3.5,-26,-21.766189,3.5,-26,-14.433809,3.5,-26,-21.766189,-3.5,-26,-21.766189,-3.5,-26,-14.433809,3.5,-26,-14.433809,-3.5,-26,-21.766189,3.5,0,-6.16619,3.5,-26,-14.433809,3.5,-26,-14.433809,3.5,0,-6.16619,3.5,0,1.16619,3.5,0,1.16619,3.5,0,-6.16619,3.5,26,-14.43381,3.5,26,-14.43381,3.5,0,-6.16619,3.5,26,-21.766191,3.5],normalized:false},normal:{itemSize:3,type:"Float32Array",array:[0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,-0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,0.514495,0.857492,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,-0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,0.514495,-0.857492,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],normalized:false}},boundingSphere:{center:[0,-10.3,0],radius:28.630814}};var arrowOutlineGeometryJson = {metadata:metadata,uuid:uuid,type:type,data:data};

  var nodesList = "<svg viewBox=\"0 0 700 700\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"currentColor\" d=\"M113.2 198.6v305l-62 15.5A41.2 41.2 0 0 1 0 479v-256a41.2 41.2 0 0 1 51.2-40zm473.6 305v-305l62-15.5a41.2 41.2 0 0 1 51.2 40v256a41.2 41.2 0 0 1-51.2 40zm-349.3 43h-42c-18 0-33.3-11.6-38.9-27.8l91-97 56 56zm57 0 178.7-186 72.4 78.3v66.6a41.2 41.2 0 0 1-41.2 41.2zm251-168.4-56.8-61.6c-8-8.8-21.8-8.9-30-.3L332 448.2l-70.5-70.5c-8.2-8.2-21.6-8-29.6.5L154.4 461V196.7a41.2 41.2 0 0 1 41.2-41.2h308.8a41.2 41.2 0 0 1 41.2 41.2zm-298.4-58a61.8 61.8 0 1 0 0-123.5 61.8 61.8 0 0 0 0 123.5zm0-41.2a20.6 20.6 0 1 1 0-41.1 20.6 20.6 0 0 1 0 41.1z\"/><!-- Created by Andrejs Kirm from the Noun Project --></svg>\n";

  /**
   * @summary In client mode all the nodes are provided in the config or with the `setNodes` method
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_CLIENT = 'client';
  /**
   * @summary In server mode the nodes are fetched asynchronously
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_SERVER = 'server';
  /**
   * @summary In manual mode each link is positionned manually on the panorama
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_MANUAL = 'manual';
  /**
   * @summary In GPS mode each node is globally positionned and the links are automatically computed
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_GPS = 'gps';
  /**
   * @summaru In markers mode the links are represented using markers
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_MARKERS = 'markers';
  /**
   * @summaru In 3D mode the links are represented using 3d arrows
   * @type {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var MODE_3D = '3d';
  /**
   * @summary Available events
   * @enum {string}
   * @memberof PSV.plugins.VirtualTourPlugin
   * @constant
   */

  var EVENTS = {
    /**
     * @event node-changed
     * @memberof PSV.plugins.VirtualTourPlugin
     * @summary Triggered when the current node changes
     * @param {string} nodeId
     */
    NODE_CHANGED: 'node-changed',

    /**
     * @event filter:render-nodes-list
     * @memberof PSV.plugins.VirtualTourPlugin
     * @summary Used to alter the list of nodes displayed on the side-panel
     * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
     * @returns {PSV.plugins.VirtualTourPlugin.Node[]}
     */
    RENDER_NODES_LIST: 'render-nodes-list'
  };
  /**
   * @summary Property name added to markers
   * @type {string}
   * @constant
   * @private
   */

  var LINK_DATA = 'tourLink';
  /**
   * @summary Default style of the link marker
   * @type {PSV.plugins.MarkersPlugin.Properties}
   * @constant
   * @private
   */

  var DEFAULT_MARKER = {
    html: arrowIconSvg,
    width: 80,
    height: 80,
    scale: [0.5, 2],
    anchor: 'top center',
    className: 'psv-virtual-tour__marker',
    style: {
      color: 'rgba(0, 208, 255, 0.8)'
    }
  };
  /**
   * @summary Default style of the link arrow
   * @type {PSV.plugins.VirtualTourPlugin.ArrowStyle}
   * @constant
   * @private
   */

  var DEFAULT_ARROW = {
    color: 0xaaaaaa,
    hoverColor: 0xaa5500,
    outlineColor: 0x000000,
    scale: [0.5, 2]
  };
  /**
   * @type {external:THREE.BufferedGeometry}
   * @constant
   * @private
   */

  var _ref = function () {
    var loader = new three.ObjectLoader();
    var geometries = loader.parseGeometries([arrowGeometryJson, arrowOutlineGeometryJson]);
    var arrow = geometries[arrowGeometryJson.uuid];
    var arrowOutline = geometries[arrowOutlineGeometryJson.uuid];
    var scale = 0.015;
    var rot = Math.PI / 2;
    arrow.scale(scale, scale, scale);
    arrow.rotateX(rot);
    arrowOutline.scale(scale, scale, scale);
    arrowOutline.rotateX(rot);
    return {
      ARROW_GEOM: arrow,
      ARROW_OUTLINE_GEOM: arrowOutline
    };
  }(),
      ARROW_GEOM = _ref.ARROW_GEOM,
      ARROW_OUTLINE_GEOM = _ref.ARROW_OUTLINE_GEOM;
  var ID_PANEL_NODES_LIST = 'virtualTourNodesList';
  /**
   * @summary Nodes list template
   * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
   * @param {string} title
   * @param {string} currentNodeId
   * @returns {string}
   * @constant
   * @private
   */

  var NODES_LIST_TEMPLATE = function NODES_LIST_TEMPLATE(nodes, title, currentNodeId) {
    return "\n<div class=\"psv-panel-menu psv-panel-menu--stripped psv-virtual-tour__menu\">\n  <h1 class=\"psv-panel-menu-title\">" + nodesList + " " + title + "</h1>\n  <ul class=\"psv-panel-menu-list\">\n    " + nodes.map(function (node) {
      return "\n    <li data-node-id=\"" + node.id + "\" tabindex=\"0\"\n        class=\"psv-panel-menu-item " + (currentNodeId === node.id ? 'psv-panel-menu-item--active' : '') + "\">\n      " + (node.thumbnail ? "<span class=\"psv-panel-menu-item-icon\"><img src=\"" + node.thumbnail + "\"/></span>" : '') + "\n      <span class=\"psv-panel-menu-item-label\">" + (node.caption || node.name) + "</span>\n    </li>\n    ";
    }).join('') + "\n  </ul>\n</div>\n";
  };

  /**
   * @summary Navigation bar markers list button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var NodesListButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(NodesListButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function NodesListButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-nodes-list-button', true) || this;
      /**
       * @type {PSV.plugins.VirtualTourPlugin}
       */

      _this.plugin = _this.psv.getPlugin('virtual-tour');

      if (_this.plugin) {
        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL, _assertThisInitialized(_this));

        _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLOSE_PANEL, _assertThisInitialized(_this));
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = NodesListButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLOSE_PANEL, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return !!this.plugin && !this.plugin.isServerSide() && !this.plugin.gallery;
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case photoSphereViewer.CONSTANTS.EVENTS.OPEN_PANEL:
          this.toggleActive(e.args[0] === ID_PANEL_NODES_LIST);
          break;

        case photoSphereViewer.CONSTANTS.EVENTS.CLOSE_PANEL:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles nodes list
     */
    ;

    _proto.onClick = function onClick() {
      this.plugin.toggleNodesList();
    };

    return NodesListButton;
  }(photoSphereViewer.AbstractButton);
  NodesListButton.id = 'nodesList';
  NodesListButton.icon = nodesList;

  /**
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @private
   */

  var ServerSideDatasource = /*#__PURE__*/function (_AbstractDatasource) {
    _inheritsLoose(ServerSideDatasource, _AbstractDatasource);

    function ServerSideDatasource(plugin) {
      var _this;

      _this = _AbstractDatasource.call(this, plugin) || this;

      if (!plugin.config.getNode) {
        throw new photoSphereViewer.PSVError('Missing getNode() option.');
      }

      _this.nodeResolver = plugin.config.getNode;
      _this.linksResolver = plugin.config.getLinks;
      return _this;
    }

    var _proto = ServerSideDatasource.prototype;

    _proto.loadNode = function loadNode(nodeId) {
      var _this2 = this;

      if (this.nodes[nodeId]) {
        return Promise.resolve(this.nodes[nodeId]);
      } else {
        return Promise.resolve(this.nodeResolver(nodeId)).then(function (node) {
          checkNode(node, _this2.plugin.isGps());
          _this2.nodes[nodeId] = node;
          return node;
        });
      }
    };

    _proto.loadLinkedNodes = function loadLinkedNodes(nodeId) {
      var _this3 = this;

      if (!this.nodes[nodeId]) {
        return Promise.reject(new photoSphereViewer.PSVError("Node " + nodeId + " not found"));
      } else if (this.nodes[nodeId].links) {
        return Promise.resolve();
      } else {
        if (!this.linksResolver) {
          this.nodes[nodeId].links = [];
          return Promise.resolve();
        }

        photoSphereViewer.utils.logWarn("getLinks() option is deprecated, instead make getNode() also return the node' links.");
        return Promise.resolve(this.linksResolver(nodeId)).then(function (links) {
          return links || [];
        }).then(function (links) {
          var node = _this3.nodes[nodeId];
          links.forEach(function (link) {
            checkLink(node, link, _this3.plugin.isGps()); // copy essential data

            if (_this3.nodes[link.nodeId]) {
              link.position = link.position || _this3.nodes[link.nodeId].position;
              link.name = link.name || _this3.nodes[link.nodeId].name;
            }

            if (_this3.plugin.isGps() && !link.position) {
              throw new photoSphereViewer.PSVError("No GPS position provided for link " + link.nodeId + " of node " + node.id);
            }
          }); // store links

          node.links = links;
        });
      }
    };

    return ServerSideDatasource;
  }(AbstractDatasource);

  /**
   * @callback GetNode
   * @summary Function to load a node
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @param {string} nodeId
   * @returns {PSV.plugins.VirtualTourPlugin.Node|Promise<PSV.plugins.VirtualTourPlugin.Node>}
   */

  /**
   * @callback GetLinks
   * @summary Function to load the links of a node
   * @deprecated `getNode` must directly return the links of each node
   * @memberOf PSV.plugins.VirtualTourPlugin
   * @param {string} nodeId
   * @returns {PSV.plugins.VirtualTourPlugin.NodeLink[]|Promise<PSV.plugins.VirtualTourPlugin.NodeLink[]>}
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
   * @property {string} [thumbnail] - thumbnail for the nodes list in the side panel
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
   * @property {PSV.plugins.VirtualTourPlugin.GetLinks} [getLinks] - Deprecated: `getNode` must directly return the links of each node
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
  // add markers buttons

  photoSphereViewer.DEFAULTS.lang[NodesListButton.id] = 'Locations';
  photoSphereViewer.registerButton(NodesListButton, 'caption:left');
  /**
   * @summary Create virtual tours by linking multiple panoramas
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var VirtualTourPlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(VirtualTourPlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.VirtualTourPlugin.Options} [options]
     */
    function VirtualTourPlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {Object}
       * @property {PSV.plugins.VirtualTourPlugin.Node} currentNode
       * @property {PSV.Tooltip} currentTooltip
       * @property {string} loadingNode
       * @property {function} stopObserver
       * @private
       */

      _this.prop = {
        currentNode: null,
        currentTooltip: null,
        loadingNode: null,
        stopObserver: null
      };
      /**
       * @type {Record<string, boolean | Promise>}
       * @private
       */

      _this.preload = {};
      /**
       * @member {PSV.plugins.VirtualTourPlugin.Options}
       * @private
       */

      _this.config = _extends({
        dataMode: MODE_CLIENT,
        positionMode: MODE_MANUAL,
        renderMode: MODE_3D,
        preload: false,
        rotateSpeed: '20rpm',
        transition: photoSphereViewer.CONSTANTS.DEFAULT_TRANSITION,
        markerLatOffset: -0.1,
        arrowPosition: 'bottom',
        linksOnCompass: (options == null ? void 0 : options.renderMode) === MODE_MARKERS
      }, options, {
        markerStyle: _extends({}, DEFAULT_MARKER, options == null ? void 0 : options.markerStyle),
        arrowStyle: _extends({}, DEFAULT_ARROW, options == null ? void 0 : options.arrowStyle)
      });

      if ((options == null ? void 0 : options.listButton) === false) {
        photoSphereViewer.utils.logWarn('VirtualTourPlugin: listButton option is deprecated. ' + 'Please define the global navbar options according to your needs.');
      }

      if ((options == null ? void 0 : options.listButton) === true && _this.config.dataMode === MODE_SERVER) {
        photoSphereViewer.utils.logWarn('VirtualTourPlugin: the list button is not supported in server mode.');
      }
      /**
       * @type {PSV.plugins.MarkersPlugin}
       * @private
       */


      _this.markers = null;
      /**
       * @type {PSV.plugins.CompassPlugin}
       * @private
       */

      _this.compass = null;
      /**
       * @type {PSV.plugins.GalleryPlugin}
       * @private
       */

      _this.gallery = null;
      /**
       * @type {PSV.plugins.VirtualTourPlugin.AbstractDatasource}
       */

      _this.datasource = null;
      /**
       * @type {external:THREE.Group}
       * @private
       */

      _this.arrowsGroup = null;

      if (_this.is3D()) {
        _this.arrowsGroup = new three.Group();
        var localLight = new three.PointLight(0xffffff, 1, 0);
        localLight.position.set(0, _this.config.arrowPosition === 'bottom' ? 2 : -2, 0);

        _this.arrowsGroup.add(localLight);
      }

      return _this;
    }
    /**
     * @package
     */


    var _proto = VirtualTourPlugin.prototype;

    _proto.init = function init() {
      var _this$markers,
          _this2 = this;

      _AbstractPlugin.prototype.init.call(this);

      this.markers = this.psv.getPlugin('markers');
      this.compass = this.psv.getPlugin('compass');
      this.gallery = this.psv.getPlugin('gallery');

      if (!this.is3D() && !this.markers) {
        throw new photoSphereViewer.PSVError('VirtualTour plugin requires the Markers plugin in markers mode.');
      }

      if ((_this$markers = this.markers) != null && _this$markers.config.markers) {
        photoSphereViewer.utils.logWarn('No default markers can be configured on Markers plugin when using VirtualTour plugin. ' + 'Consider defining `markers` on each tour node.');
        delete this.markers.config.markers;
      }

      this.datasource = this.isServerSide() ? new ServerSideDatasource(this) : new ClientSideDatasource(this);

      if (this.is3D()) {
        this.psv.once(photoSphereViewer.CONSTANTS.EVENTS.READY, function () {
          _this2.__positionArrows();

          _this2.psv.renderer.scene.add(_this2.arrowsGroup);

          var ambientLight = new three.AmbientLight(0xffffff, 1);

          _this2.psv.renderer.scene.add(ambientLight);

          _this2.psv.needsUpdate();
        });
        this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, this);
        this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, this);
        this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
        this.prop.stopObserver = this.psv.observeObjects(LINK_DATA, this);
      } else {
        this.markers.on('select-marker', this);
      }

      if (this.isServerSide()) {
        if (this.config.startNodeId) {
          this.setCurrentNode(this.config.startNodeId);
        }
      } else if (this.config.nodes) {
        this.setNodes(this.config.nodes, this.config.startNodeId);
        delete this.config.nodes;
      }
    }
    /**
     * @package
     */
    ;

    _proto.destroy = function destroy() {
      var _this$prop$stopObserv, _this$prop;

      if (this.markers) {
        this.markers.off('select-marker', this);
      }

      if (this.arrowsGroup) {
        this.psv.renderer.scene.remove(this.arrowsGroup);
      }

      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.CLICK, this);
      (_this$prop$stopObserv = (_this$prop = this.prop).stopObserver) == null ? void 0 : _this$prop$stopObserv.call(_this$prop);
      this.datasource.destroy();
      delete this.preload;
      delete this.datasource;
      delete this.markers;
      delete this.compass;
      delete this.gallery;
      delete this.arrowsGroup;

      _AbstractPlugin.prototype.destroy.call(this);
    };

    _proto.handleEvent = function handleEvent(e) {
      var _e$args$0$data, _e$args$0$objects$fin;

      var link;

      switch (e.type) {
        case 'select-marker':
          link = (_e$args$0$data = e.args[0].data) == null ? void 0 : _e$args$0$data[LINK_DATA];

          if (link) {
            this.setCurrentNode(link.nodeId, link);
          }

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.POSITION_UPDATED:
        case photoSphereViewer.CONSTANTS.EVENTS.ZOOM_UPDATED:
          if (this.arrowsGroup) {
            this.__positionArrows();
          }

          break;

        case photoSphereViewer.CONSTANTS.EVENTS.CLICK:
          link = (_e$args$0$objects$fin = e.args[0].objects.find(function (o) {
            return o.userData[LINK_DATA];
          })) == null ? void 0 : _e$args$0$objects$fin.userData[LINK_DATA];

          if (link) {
            this.setCurrentNode(link.nodeId, link);
          }

          break;

        case photoSphereViewer.CONSTANTS.OBJECT_EVENTS.ENTER_OBJECT:
          this.__onEnterObject(e.detail.object, e.detail.viewerPoint);

          break;

        case photoSphereViewer.CONSTANTS.OBJECT_EVENTS.HOVER_OBJECT:
          this.__onHoverObject(e.detail.object, e.detail.viewerPoint);

          break;

        case photoSphereViewer.CONSTANTS.OBJECT_EVENTS.LEAVE_OBJECT:
          this.__onLeaveObject(e.detail.object);

          break;
      }
    }
    /**
     * @summary Tests if running in server mode
     * @return {boolean}
     */
    ;

    _proto.isServerSide = function isServerSide() {
      return this.config.dataMode === MODE_SERVER;
    }
    /**
     * @summary Tests if running in GPS mode
     * @return {boolean}
     */
    ;

    _proto.isGps = function isGps() {
      return this.config.positionMode === MODE_GPS;
    }
    /**
     * @summary Tests if running in 3D mode
     * @return {boolean}
     */
    ;

    _proto.is3D = function is3D() {
      return this.config.renderMode === MODE_3D;
    }
    /**
     * @summary Sets the nodes (client mode only)
     * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
     * @param {string} [startNodeId]
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    ;

    _proto.setNodes = function setNodes(nodes, startNodeId) {
      var _this3 = this;

      if (this.isServerSide()) {
        throw new photoSphereViewer.PSVError('Cannot set nodes in server side mode');
      }

      this.datasource.setNodes(nodes);

      if (!startNodeId) {
        startNodeId = nodes[0].id;
      } else if (!this.datasource.nodes[startNodeId]) {
        startNodeId = nodes[0].id;
        photoSphereViewer.utils.logWarn("startNodeId not found is provided nodes, resetted to " + startNodeId);
      }

      this.setCurrentNode(startNodeId);

      if (this.gallery) {
        this.gallery.setItems(nodes.map(function (node) {
          return {
            id: node.id,
            panorama: node.panorama,
            name: node.name,
            thumbnail: node.thumbnail,
            options: {
              caption: node.caption,
              panoData: node.panoData,
              sphereCorrection: node.sphereCorrection,
              description: node.description
            }
          };
        }), function (id) {
          _this3.setCurrentNode(id);

          _this3.gallery.hide();
        });
      }
    }
    /**
     * @summary Changes the current node
     * @param {string} nodeId
     * @param {PSV.plugins.VirtualTourPlugin.NodeLink} [fromLink]
     * @returns {Promise<boolean>} resolves false if the loading was aborted by another call
     */
    ;

    _proto.setCurrentNode = function setCurrentNode(nodeId, fromLink) {
      var _this$prop$currentNod,
          _this4 = this;

      if (fromLink === void 0) {
        fromLink = null;
      }

      if (nodeId === ((_this$prop$currentNod = this.prop.currentNode) == null ? void 0 : _this$prop$currentNod.id)) {
        return Promise.resolve(true);
      }

      this.psv.hideError();
      this.prop.loadingNode = nodeId;
      var fromNode = this.prop.currentNode;
      var fromLinkPosition = fromNode && fromLink ? this.__getLinkPosition(fromNode, fromLink) : null;
      return Promise.all([// if this node is already preloading, wait for it
      Promise.resolve(this.preload[nodeId]).then(function () {
        if (_this4.prop.loadingNode !== nodeId) {
          throw photoSphereViewer.utils.getAbortError();
        }

        return _this4.datasource.loadNode(nodeId);
      }), Promise.resolve(fromLinkPosition ? this.config.rotateSpeed : false).then(function (speed) {
        // eslint-disable-line consistent-return
        if (speed) {
          return _this4.psv.animate(_extends({}, fromLinkPosition, {
            speed: speed
          }));
        }
      }).then(function () {
        _this4.psv.loader.show();
      })]).then(function (_ref) {
        var _this4$markers, _this4$compass;

        var node = _ref[0];

        if (_this4.prop.loadingNode !== nodeId) {
          throw photoSphereViewer.utils.getAbortError();
        }

        _this4.prop.currentNode = node;

        if (_this4.prop.currentTooltip) {
          _this4.prop.currentTooltip.hide();

          _this4.prop.currentTooltip = null;
        }

        if (_this4.is3D()) {
          var _this4$arrowsGroup;

          (_this4$arrowsGroup = _this4.arrowsGroup).remove.apply(_this4$arrowsGroup, _this4.arrowsGroup.children.filter(function (o) {
            return o.type === 'Mesh';
          }));
        }

        (_this4$markers = _this4.markers) == null ? void 0 : _this4$markers.clearMarkers();
        (_this4$compass = _this4.compass) == null ? void 0 : _this4$compass.clearHotspots();
        return Promise.all([_this4.psv.setPanorama(node.panorama, {
          transition: _this4.config.transition,
          caption: node.caption,
          description: node.description,
          panoData: node.panoData,
          sphereCorrection: node.sphereCorrection
        }).then(function (completed) {
          if (!completed) {
            throw photoSphereViewer.utils.getAbortError();
          }
        }), _this4.datasource.loadLinkedNodes(nodeId)]);
      }).then(function () {
        if (_this4.prop.loadingNode !== nodeId) {
          throw photoSphereViewer.utils.getAbortError();
        }

        var node = _this4.prop.currentNode;

        if (node.markers) {
          if (_this4.markers) {
            _this4.markers.setMarkers(node.markers);
          } else {
            photoSphereViewer.utils.logWarn("Node " + node.id + " markers ignored because the plugin is not loaded.");
          }
        }

        _this4.__renderLinks(node);

        _this4.__preload(node);
        /**
         * @event node-changed
         * @memberof PSV.plugins.VirtualTourPlugin
         * @summary Triggered when the current node is changed
         * @param {string} nodeId
         * @param {PSV.plugins.VirtualTourPlugin.NodeChangedData} data
         */


        _this4.trigger(EVENTS.NODE_CHANGED, nodeId, {
          fromNode: fromNode,
          fromLink: fromLink,
          fromLinkPosition: fromLinkPosition
        });

        _this4.prop.loadingNode = null;
        return true;
      }).catch(function (err) {
        if (photoSphereViewer.utils.isAbortError(err)) {
          return false;
        }

        _this4.psv.showError(_this4.psv.config.lang.loadError);

        _this4.psv.loader.hide();

        _this4.psv.navbar.setCaption('');

        _this4.prop.loadingNode = null;
        throw err;
      });
    }
    /**
     * @summary Adds the links for the node
     * @param {PSV.plugins.VirtualTourPlugin.Node} node
     * @private
     */
    ;

    _proto.__renderLinks = function __renderLinks(node) {
      var _this5 = this;

      var positions = [];
      node.links.forEach(function (link) {
        var position = _this5.__getLinkPosition(node, link);

        positions.push(position);

        if (_this5.is3D()) {
          var _mesh$userData, _link$arrowStyle, _link$arrowStyle2;

          var mesh = new three.Mesh(ARROW_GEOM, new three.MeshLambertMaterial());
          mesh.userData = (_mesh$userData = {}, _mesh$userData[LINK_DATA] = link, _mesh$userData.longitude = position.longitude, _mesh$userData);
          mesh.rotation.order = 'YXZ';
          mesh.rotateY(-position.longitude);

          _this5.psv.dataHelper.sphericalCoordsToVector3({
            longitude: position.longitude,
            latitude: 0
          }, mesh.position).multiplyScalar(1 / photoSphereViewer.CONSTANTS.SPHERE_RADIUS);

          var outlineMesh = new three.Mesh(ARROW_OUTLINE_GEOM, new three.MeshBasicMaterial({
            side: three.BackSide
          }));
          outlineMesh.position.copy(mesh.position);
          outlineMesh.rotation.copy(mesh.rotation);
          setMeshColor(mesh, ((_link$arrowStyle = link.arrowStyle) == null ? void 0 : _link$arrowStyle.color) || _this5.config.arrowStyle.color);
          setMeshColor(outlineMesh, ((_link$arrowStyle2 = link.arrowStyle) == null ? void 0 : _link$arrowStyle2.outlineColor) || _this5.config.arrowStyle.outlineColor);

          _this5.arrowsGroup.add(mesh);

          _this5.arrowsGroup.add(outlineMesh);
        } else {
          var _data;

          if (_this5.isGps()) {
            position.latitude += _this5.config.markerLatOffset;
          }

          _this5.markers.addMarker(_extends({}, _this5.config.markerStyle, link.markerStyle, {
            id: "tour-link-" + link.nodeId,
            tooltip: link.name,
            visible: true,
            hideList: true,
            content: null,
            data: (_data = {}, _data[LINK_DATA] = link, _data)
          }, position), false);
        }
      });

      if (this.is3D()) {
        this.__positionArrows();
      } else {
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
    ;

    _proto.__getLinkPosition = function __getLinkPosition(node, link) {
      if (this.isGps()) {
        var p1 = [three.MathUtils.degToRad(node.position[0]), three.MathUtils.degToRad(node.position[1])];
        var p2 = [three.MathUtils.degToRad(link.position[0]), three.MathUtils.degToRad(link.position[1])];
        var h1 = node.position[2] !== undefined ? node.position[2] : link.position[2] || 0;
        var h2 = link.position[2] !== undefined ? link.position[2] : node.position[2] || 0;
        var latitude = 0;

        if (h1 !== h2) {
          latitude = Math.atan((h2 - h1) / distance(p1, p2));
        }

        var longitude = bearing(p1, p2);
        return {
          longitude: longitude,
          latitude: latitude
        };
      } else {
        return this.psv.dataHelper.cleanPosition(link);
      }
    }
    /**
     * @private
     */
    ;

    _proto.__onEnterObject = function __onEnterObject(mesh, viewerPoint) {
      var _link$arrowStyle3;

      var link = mesh.userData[LINK_DATA];
      setMeshColor(mesh, ((_link$arrowStyle3 = link.arrowStyle) == null ? void 0 : _link$arrowStyle3.hoverColor) || this.config.arrowStyle.hoverColor);

      if (link.name) {
        this.prop.currentTooltip = this.psv.tooltip.create({
          left: viewerPoint.x,
          top: viewerPoint.y,
          content: link.name
        });
      }

      this.psv.needsUpdate();
    }
    /**
     * @private
     */
    ;

    _proto.__onHoverObject = function __onHoverObject(mesh, viewerPoint) {
      if (this.prop.currentTooltip) {
        this.prop.currentTooltip.move({
          left: viewerPoint.x,
          top: viewerPoint.y
        });
      }
    }
    /**
     * @private
     */
    ;

    _proto.__onLeaveObject = function __onLeaveObject(mesh) {
      var _link$arrowStyle4;

      var link = mesh.userData[LINK_DATA];
      setMeshColor(mesh, ((_link$arrowStyle4 = link.arrowStyle) == null ? void 0 : _link$arrowStyle4.color) || this.config.arrowStyle.color);

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
    ;

    _proto.__positionArrows = function __positionArrows() {
      this.arrowsGroup.position.copy(this.psv.prop.direction).multiplyScalar(0.5);
      var s = this.config.arrowStyle.scale;
      var f = s[1] + (s[0] - s[1]) * (this.psv.getZoomLevel() / 100);
      var y = 2.5 - this.psv.getZoomLevel() / 100 * 1.5;
      this.arrowsGroup.position.y += this.config.arrowPosition === 'bottom' ? -y : y;
      this.arrowsGroup.scale.set(f, f, f);
    }
    /**
     * @summary Manage the preload of the linked panoramas
     * @param {PSV.plugins.VirtualTourPlugin.Node} node
     * @private
     */
    ;

    _proto.__preload = function __preload(node) {
      var _this6 = this;

      if (!this.config.preload) {
        return;
      }

      this.preload[node.id] = true;
      this.prop.currentNode.links.filter(function (link) {
        return !_this6.preload[link.nodeId];
      }).filter(function (link) {
        if (typeof _this6.config.preload === 'function') {
          return _this6.config.preload(_this6.prop.currentNode, link);
        } else {
          return true;
        }
      }).forEach(function (link) {
        _this6.preload[link.nodeId] = _this6.datasource.loadNode(link.nodeId).then(function (linkNode) {
          return _this6.psv.textureLoader.preloadPanorama(linkNode.panorama);
        }).then(function () {
          _this6.preload[link.nodeId] = true;
        }).catch(function () {
          delete _this6.preload[link.nodeId];
        });
      });
    }
    /**
     * @summary Toggles the visibility of the list of nodes
     */
    ;

    _proto.toggleNodesList = function toggleNodesList() {
      if (this.psv.panel.prop.contentId === ID_PANEL_NODES_LIST) {
        this.hideNodesList();
      } else {
        this.showNodesList();
      }
    }
    /**
     * @summary Opens side panel with the list of nodes
     */
    ;

    _proto.showNodesList = function showNodesList() {
      var _this$prop$currentNod2,
          _this7 = this;

      photoSphereViewer.utils.logWarn("Starting from next version, the VirtualTourPlugin will require the GalleryPlugin to display the list of nodes.");
      var nodes = this.change(EVENTS.RENDER_NODES_LIST, Object.values(this.datasource.nodes));
      this.psv.panel.show({
        id: ID_PANEL_NODES_LIST,
        content: NODES_LIST_TEMPLATE(nodes, this.psv.config.lang[NodesListButton.id], (_this$prop$currentNod2 = this.prop.currentNode) == null ? void 0 : _this$prop$currentNod2.id),
        noMargin: true,
        clickHandler: function clickHandler(e) {
          var li = e.target ? photoSphereViewer.utils.getClosest(e.target, 'li') : undefined;
          var nodeId = li ? li.dataset.nodeId : undefined;

          if (nodeId) {
            _this7.setCurrentNode(nodeId);

            _this7.hideNodesList();
          }
        }
      });
    }
    /**
     * @summary Closes side panel if it contains the list of nodes
     */
    ;

    _proto.hideNodesList = function hideNodesList() {
      this.psv.panel.hide(ID_PANEL_NODES_LIST);
    };

    return VirtualTourPlugin;
  }(photoSphereViewer.AbstractPlugin);
  VirtualTourPlugin.id = 'virtual-tour';
  VirtualTourPlugin.EVENTS = EVENTS;
  VirtualTourPlugin.MODE_CLIENT = MODE_CLIENT;
  VirtualTourPlugin.MODE_SERVER = MODE_SERVER;
  VirtualTourPlugin.MODE_3D = MODE_3D;
  VirtualTourPlugin.MODE_MARKERS = MODE_MARKERS;
  VirtualTourPlugin.MODE_MANUAL = MODE_MANUAL;
  VirtualTourPlugin.MODE_GPS = MODE_GPS;

  exports.EVENTS = EVENTS;
  exports.MODE_3D = MODE_3D;
  exports.MODE_CLIENT = MODE_CLIENT;
  exports.MODE_GPS = MODE_GPS;
  exports.MODE_MANUAL = MODE_MANUAL;
  exports.MODE_MARKERS = MODE_MARKERS;
  exports.MODE_SERVER = MODE_SERVER;
  exports.VirtualTourPlugin = VirtualTourPlugin;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=virtual-tour.js.map
