import { MathUtils } from 'three';
import { AbstractPlugin, CONSTANTS, SYSTEM, utils } from '../..';
import compass from './compass.svg';
import './style.scss';


/**
 * @typedef {Object} PSV.plugins.CompassPlugin.Options
 * @property {string} [size='120px'] - size of the compass
 * @property {string} [position='top left'] - position of the compass
 * @property {string} [backgroundSvg] - SVG used as background of the compass
 * @property {string} [coneColor='rgba(255, 255, 255, 0.5)'] - color of the cone of the compass
 * @property {boolean} [navigation=true] - allows to click on the compass to rotate the viewer
 * @property {string} [navigationColor='rgba(255, 0, 0, 0.2)'] - color of the navigation cone
 * @property {PSV.plugins.CompassPlugin.Hotspot[]} [hotspots] - small dots visible on the compass (will contain every marker with the "compass" data)
 * @property {string} [hotspotColor='rgba(0, 0, 0, 0.5)'] - default color of hotspots
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.plugins.CompassPlugin.Hotspot
 * @type {string} [color] - override the global "hotspotColor"
 */


const HOTSPOT_SIZE_RATIO = 1 / 40;


/**
 * @summary Adds a compass on the viewer
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class CompassPlugin extends AbstractPlugin {

  static id = 'compass';

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.CompassPlugin.Options} options
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {PSV.plugins.CompassPlugin.Options}
     * @private
     */
    this.config = {
      size           : '120px',
      backgroundSvg  : compass,
      coneColor      : 'rgba(255, 255, 255, 0.5)',
      navigation     : true,
      navigationColor: 'rgba(255, 0, 0, 0.2)',
      hotspotColor   : 'rgba(0, 0, 0, 0.5)',
      ...options,
      position       : utils.cleanPosition(options.position, { allowCenter: true, cssOrder: true }) || ['top', 'left'],
    };

    /**
     * @private
     */
    this.prop = {
      visible  : true,
      mouse    : null,
      mouseDown: false,
      markers  : [],
    };

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @private
     */
    this.markers = null;

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.container = document.createElement('div');
    this.container.className = `psv-compass psv-compass--${this.config.position.join('-')}`;
    this.container.innerHTML = this.config.backgroundSvg;

    this.container.style.width = this.config.size;
    this.container.style.height = this.config.size;
    if (this.config.position[0] === 'center') {
      this.container.style.marginTop = `calc(-${this.config.size} / 2)`;
    }
    if (this.config.position[1] === 'center') {
      this.container.style.marginLeft = `calc(-${this.config.size} / 2)`;
    }

    /**
     * @member {HTMLCanvasElement}
     * @readonly
     * @private
     */
    this.canvas = document.createElement('canvas');

    this.container.appendChild(this.canvas);

    if (this.config.navigation) {
      this.container.addEventListener('mouseenter', this);
      this.container.addEventListener('mouseleave', this);
      this.container.addEventListener('mousemove', this);
      this.container.addEventListener('mousedown', this);
      this.container.addEventListener('mouseup', this);
      this.container.addEventListener('touchstart', this);
      this.container.addEventListener('touchmove', this);
      this.container.addEventListener('touchend', this);
    }
  }

  /**
   * @package
   */
  init() {
    super.init();

    this.markers = this.psv.getPlugin('markers');

    this.psv.container.appendChild(this.container);

    this.canvas.width = this.container.clientWidth * SYSTEM.pixelRatio;
    this.canvas.height = this.container.clientWidth * SYSTEM.pixelRatio;

    this.psv.on(CONSTANTS.EVENTS.RENDER, this);

    if (this.markers) {
      this.markers.on('set-markers', this);
    }
  }

  /**
   * @package
   */
  destroy() {
    this.psv.off(CONSTANTS.EVENTS.RENDER, this);

    if (this.markers) {
      this.markers.off('set-markers', this);
    }

    this.psv.container.removeChild(this.container);

    delete this.canvas;
    delete this.container;

    super.destroy();
  }

  /**
   * @private
   */
  handleEvent(e) {
    switch (e.type) {
      case CONSTANTS.EVENTS.RENDER:
        this.__update();
        break;
      case 'set-markers':
        this.prop.markers = e.args[0].filter(m => m.data?.compass);
        this.__update();
        break;
      case 'mouseenter':
      case 'mousemove':
      case 'touchmove':
        this.prop.mouse = e.changedTouches?.[0] || e;
        if (this.prop.mouseDown) {
          this.__click();
        }
        else {
          this.__update();
        }
        e.stopPropagation();
        e.preventDefault();
        break;
      case 'mousedown':
      case 'touchstart':
        this.prop.mouseDown = true;
        e.stopPropagation();
        e.preventDefault();
        break;
      case 'mouseup':
      case 'touchend':
        this.prop.mouse = e.changedTouches?.[0] || e;
        this.prop.mouseDown = false;
        this.__click();
        if (e.changedTouches) {
          this.prop.mouse = null;
          this.__update();
        }
        e.stopPropagation();
        e.preventDefault();
        break;
      case 'mouseleave':
        this.prop.mouse = null;
        this.prop.mouseDown = false;
        this.__update();
        break;
      default:
        break;
    }
  }

  /**
   * @summary Hides the compass
   */
  hide() {
    this.container.style.display = 'none';
    this.prop.visible = false;
  }

  /**
   * @summary Shows the compass
   */
  show() {
    this.container.style.display = '';
    this.prop.visible = true;
  }

  /**
   * @summary Changes the hotspots on the compass
   * @param {PSV.plugins.CompassPlugin.Hotspot[]} hotspots
   */
  setHotspots(hotspots) {
    this.config.hotspots = hotspots;
    this.__update();
  }

  /**
   * @summary Removes all hotspots
   */
  clearHotspots() {
    this.setHotspots(null);
  }

  /**
   * @summary Updates the compass for current zoom and position
   * @private
   */
  __update() {
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const longitude = this.psv.getPosition().longitude;
    const fov = MathUtils.degToRad(this.psv.prop.hFov);

    this.__drawCone(context, this.config.coneColor, longitude, fov);

    const mouseAngle = this.__getMouseAngle();
    if (mouseAngle !== null) {
      this.__drawCone(context, this.config.navigationColor, mouseAngle, fov);
    }

    this.prop.markers.forEach((marker) => {
      this.__drawMarker(context, marker);
    });
    this.config.hotspots?.forEach((spot) => {
      if ('longitude' in spot && !('latitude' in spot)) {
        spot.latitude = 0;
      }
      const pos = this.psv.dataHelper.cleanPosition(spot);
      this.__drawPoint(context, spot.color || this.config.hotspotColor, pos.longitude, pos.latitude);
    });
  }

  /**
   * @summary Rotates the viewer depending on the position of the mouse on the compass
   * @private
   */
  __click() {
    const mouseAngle = this.__getMouseAngle();

    if (mouseAngle !== null) {
      this.psv.rotate({
        longitude: mouseAngle,
        latitude : 0,
      });
    }
  }

  /**
   * @summary Draw a cone
   * @param {CanvasRenderingContext2D} context
   * @param {string} color
   * @param {number} longitude - in viewer reference
   * @param {number} fov
   * @private
   */
  __drawCone(context, color, longitude, fov) {
    const a1 = longitude - Math.PI / 2 - fov / 2;
    const a2 = a1 + fov;
    const c = this.canvas.width / 2;

    context.beginPath();
    context.moveTo(c, c);
    context.lineTo(c + Math.cos(a1) * c, c + Math.sin(a1) * c);
    context.arc(c, c, c, a1, a2, false);
    context.lineTo(c, c);
    context.fillStyle = color;
    context.fill();
  }

  /**
   * @summary Draw a Marker
   * @param {CanvasRenderingContext2D} context
   * @param {PSV.plugins.MarkersPlugin.Marker} marker
   * @private
   */
  __drawMarker(context, marker) {
    let color = this.config.hotspotColor;
    if (typeof marker.data.compass === 'string') {
      color = marker.data.compass;
    }

    if (marker.isPoly()) {
      context.beginPath();
      marker.props.def.forEach(([longitude, latitude], i) => {
        const a = longitude - Math.PI / 2;
        const d = (latitude + Math.PI / 2) / Math.PI;
        const c = this.canvas.width / 2;

        context[i === 0 ? 'moveTo' : 'lineTo'](c + Math.cos(a) * c * d, c + Math.sin(a) * c * d);
      });
      if (marker.isPolygon()) {
        context.fillStyle = color;
        context.fill();
      }
      else {
        context.strokeStyle = color;
        context.lineWidth = Math.max(1, this.canvas.width * HOTSPOT_SIZE_RATIO / 2);
        context.stroke();
      }
    }
    else {
      const pos = marker.props.position;
      this.__drawPoint(context, color, pos.longitude, pos.latitude);
    }
  }

  /**
   * @summary Draw a point
   * @param {CanvasRenderingContext2D} context
   * @param {string} color
   * @param {number} longitude - in viewer reference
   * @param {number} latitude - in viewer reference
   * @private
   */
  __drawPoint(context, color, longitude, latitude) {
    const a = longitude - Math.PI / 2;
    const d = (latitude + Math.PI / 2) / Math.PI;
    const c = this.canvas.width / 2;
    const r = Math.max(2, this.canvas.width * HOTSPOT_SIZE_RATIO);

    context.beginPath();
    context.ellipse(
      c + Math.cos(a) * c * d, c + Math.sin(a) * c * d,
      r, r,
      0, 0, Math.PI * 2
    );
    context.fillStyle = color;
    context.fill();
  }

  /**
   * @summary Gets the longitude corresponding to the mouse position on the compass
   * @return {number | null}
   * @private
   */
  __getMouseAngle() {
    if (!this.prop.mouse) {
      return null;
    }

    const boundingRect = this.container.getBoundingClientRect();
    const mouseX = this.prop.mouse.clientX - boundingRect.left - boundingRect.width / 2;
    const mouseY = this.prop.mouse.clientY - boundingRect.top - boundingRect.width / 2;

    if (Math.sqrt(mouseX * mouseX + mouseY * mouseY) > boundingRect.width / 2) {
      return null;
    }

    return Math.atan2(mouseY, mouseX) + Math.PI / 2;
  }

}
