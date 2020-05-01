import { Animation } from '../Animation';
import {
  ACTIONS,
  DBLCLICK_DELAY,
  EVENTS,
  IDS,
  INERTIA_WINDOW,
  LONGTOUCH_DELAY,
  MOVE_THRESHOLD
} from '../data/constants';
import { SYSTEM } from '../data/system';
import gestureIcon from '../icons/gesture.svg';
import { clone, distance, getClosest, getEventKey, isFullscreenEnabled, normalizeWheel, throttle } from '../utils';
import { AbstractService } from './AbstractService';

/**
 * @summary Events handler
 * @extends PSV.services.AbstractService
 * @memberof PSV.services
 */
export class EventsHandler extends AbstractService {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @summary Internal properties
     * @member {Object}
     * @property {boolean} moving - is the user moving
     * @property {boolean} zooming - is the user zooming
     * @property {number} startMouseX - start x position of the click/touch
     * @property {number} startMouseY - start y position of the click/touch
     * @property {number} mouseX - current x position of the cursor
     * @property {number} mouseY - current y position of the cursor
     * @property {number[][]} mouseHistory - list of latest positions of the cursor, [time, x, y]
     * @property {number} pinchDist - distance between fingers when zooming
     * @property {PSV.ClickData} dblclickData - temporary storage of click data between two clicks
     * @property {number} dblclickTimeout - timeout id for double click
     * @protected
     */
    this.state = {
      keyboardEnabled : false,
      moving          : false,
      zooming         : false,
      startMouseX     : 0,
      startMouseY     : 0,
      mouseX          : 0,
      mouseY          : 0,
      mouseHistory    : [],
      pinchDist       : 0,
      dblclickData    : null,
      dblclickTimeout : null,
      longtouchTimeout: null,
    };

    /**
     * @summary Throttled wrapper of {@link PSV.Viewer#autoSize}
     * @type {Function}
     * @private
     */
    this.__onResize = throttle(() => this.psv.autoSize(), 50);
  }

  /**
   * @summary Initializes event handlers
   * @protected
   */
  init() {
    window.addEventListener('resize', this);
    window.addEventListener('keydown', this);
    this.psv.container.addEventListener('mouseenter', this);
    this.psv.container.addEventListener('mousedown', this);
    this.psv.container.addEventListener('mouseleave', this);
    window.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchstart', this);
    window.addEventListener('touchend', this);
    this.psv.container.addEventListener('mousemove', this);
    this.psv.container.addEventListener('touchmove', this);
    this.psv.container.addEventListener(SYSTEM.mouseWheelEvent, this);

    if (SYSTEM.fullscreenEvent) {
      document.addEventListener(SYSTEM.fullscreenEvent, this);
    }
  }

  /**
   * @override
   */
  destroy() {
    window.removeEventListener('resize', this);
    window.removeEventListener('keydown', this);
    this.psv.container.removeEventListener('mouseenter', this);
    this.psv.container.removeEventListener('mousedown', this);
    this.psv.container.removeEventListener('mouseleave', this);
    window.removeEventListener('mouseup', this);
    this.psv.container.removeEventListener('touchstart', this);
    window.removeEventListener('touchend', this);
    this.psv.container.removeEventListener('mousemove', this);
    this.psv.container.removeEventListener('touchmove', this);
    this.psv.container.removeEventListener(SYSTEM.mouseWheelEvent, this);

    if (SYSTEM.fullscreenEvent) {
      document.removeEventListener(SYSTEM.fullscreenEvent, this);
    }

    clearTimeout(this.state.dblclickTimeout);
    clearTimeout(this.state.longtouchTimeout);

    delete this.state;

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} evt
   * @private
   */
  handleEvent(evt) {
    /* eslint-disable */
    switch (evt.type) {
      // @formatter:off
      case 'resize':   this.__onResize(); break;
      case 'keydown':  this.__onKeyDown(evt); break;
      case 'mouseup':  this.__onMouseUp(evt); break;
      case 'touchend': this.__onTouchEnd(evt); break;
      case SYSTEM.fullscreenEvent: this.__fullscreenToggled(); break;
      // @formatter:on
    }
    /* eslint-enable */

    if (!getClosest(evt.target, '.psv-navbar') && !getClosest(evt.target, '.psv-panel')) {
      /* eslint-disable */
      switch (evt.type) {
        // @formatter:off
        case 'mousedown':  this.__onMouseDown(evt); break;
        case 'mouseenter': this.__onMouseEnter(evt); break;
        case 'touchstart': this.__onTouchStart(evt); break;
        case 'mouseleave': this.__onMouseLeave(evt); break;
        case 'mousemove':  this.__onMouseMove(evt); break;
        case 'touchmove':   this.__onTouchMove(evt); break;
        case SYSTEM.mouseWheelEvent: this.__onMouseWheel(evt); break;
        // @formatter:on
      }
      /* eslint-enable */
    }
  }

  /**
   * @summary Enables the keyboard controls
   * @protected
   */
  enableKeyboard() {
    this.state.keyboardEnabled = true;
  }

  /**
   * @summary Disables the keyboard controls
   * @protected
   */
  disableKeyboard() {
    this.state.keyboardEnabled = false;
  }

  /**
   * @summary Handles keyboard events
   * @param {KeyboardEvent} evt
   * @private
   */
  __onKeyDown(evt) {
    if (!this.state.keyboardEnabled) {
      return;
    }

    let dLong = 0;
    let dLat = 0;
    let dZoom = 0;

    const key = getEventKey(evt);
    const action = this.config.keyboard[key];

    /* eslint-disable */
    switch (action) {
      // @formatter:off
      case ACTIONS.ROTATE_LAT_UP    : dLat = 0.01;   break;
      case ACTIONS.ROTATE_LAT_DOWN  : dLat = -0.01;  break;
      case ACTIONS.ROTATE_LONG_RIGHT: dLong = 0.01;  break;
      case ACTIONS.ROTATE_LONG_LEFT : dLong = -0.01; break;
      case ACTIONS.ZOOM_IN          : dZoom = 1;     break;
      case ACTIONS.ZOOM_OUT         : dZoom = -1;    break;
      case ACTIONS.TOGGLE_AUTOROTATE: this.psv.toggleAutorotate(); break;
      // @formatter:on
    }
    /* eslint-enable */

    if (dZoom !== 0) {
      this.psv.zoom(this.prop.zoomLvl + dZoom * this.config.zoomButtonIncrement);
    }
    else if (dLat !== 0 || dLong !== 0) {
      this.psv.rotate({
        longitude: this.prop.position.longitude + dLong * this.prop.moveSpeed * this.prop.hFov,
        latitude : this.prop.position.latitude + dLat * this.prop.moveSpeed * this.prop.vFov,
      });
    }
  }

  /**
   * @summary Handles mouse down events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseDown(evt) {
    if (!this.config.mousemove || this.config.captureCursor) {
      return;
    }

    this.__startMove(evt);
  }

  /**
   * @summary Handles mouse enter events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseEnter(evt) {
    if (!this.config.mousemove || !this.config.captureCursor) {
      return;
    }

    this.__startMove(evt);
  }

  /**
   * @summary Handles mouse up events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseUp(evt) {
    if (!this.config.mousemove || this.config.captureCursor) {
      return;
    }

    this.__stopMove(evt);
  }

  /**
   * @summary Handles mouse leave events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseLeave(evt) {
    if (!this.config.mousemove || !this.config.captureCursor) {
      return;
    }

    this.__stopMove(evt);
  }

  /**
   * @summary Handles mouse move events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseMove(evt) {
    if (!this.config.mousemove) {
      return;
    }

    if (evt.buttons !== 0) {
      evt.preventDefault();
      this.__move(evt);
    }
    else if (this.config.captureCursor) {
      this.__moveAbsolute(evt);
    }
  }

  /**
   * @summary Handles touch events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchStart(evt) {
    if (!this.config.mousemove) {
      return;
    }

    if (evt.touches.length === 1) {
      if (!this.config.touchmoveTwoFingers) {
        this.__startMove(evt.touches[0]);
        evt.preventDefault(); // prevent mouse events emulation
      }

      if (!this.prop.longtouchTimeout) {
        this.prop.longtouchTimeout = setTimeout(() => {
          this.__click(evt.touches[0], true);
          this.prop.longtouchTimeout = null;
        }, LONGTOUCH_DELAY);
      }
    }
    else if (evt.touches.length === 2) {
      this.__cancelLongTouch();
      this.__startMoveZoom(evt);
      evt.preventDefault();
    }
  }

  /**
   * @summary Handles touch events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchEnd(evt) {
    if (!this.config.mousemove) {
      return;
    }

    if (this.prop.longtouchTimeout) {
      this.__cancelLongTouch();

      if (evt.touches.length === 1) {
        this.__stopMoveZoom();
      }
      else if (evt.touches.length === 0) {
        this.__stopMove(evt.changedTouches[0]);

        if (this.config.touchmoveTwoFingers) {
          this.psv.overlay.hide(IDS.TWO_FINGERS);
        }
      }
    }
  }

  /**
   * @summary Handles touch move events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchMove(evt) {
    if (!this.config.mousemove) {
      return;
    }

    if (evt.touches.length === 1) {
      if (this.config.touchmoveTwoFingers) {
        this.psv.overlay.show({
          id   : IDS.TWO_FINGERS,
          image: gestureIcon,
          text : this.config.lang.twoFingers[0],
        });
      }
      else {
        evt.preventDefault();
        this.__move(evt.touches[0]);
      }
    }
    else if (evt.touches.length === 2) {
      evt.preventDefault();
      this.__moveZoom(evt);
    }
  }

  /**
   * @summary Cancel the long touch timer if any
   * @private
   */
  __cancelLongTouch() {
    if (this.prop.longtouchTimeout) {
      clearTimeout(this.prop.longtouchTimeout);
      this.prop.longtouchTimeout = null;
    }
  }

  /**
   * @summary Handles mouse wheel events
   * @param {MouseWheelEvent} evt
   * @private
   */
  __onMouseWheel(evt) {
    if (!this.config.mousewheel) {
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();

    const delta = normalizeWheel(evt).spinY * 5;

    if (delta !== 0) {
      this.psv.zoom(this.prop.zoomLvl - delta * this.config.mousewheelSpeed);
    }
  }

  /**
   * @summary Handles fullscreen events
   * @param {boolean} [force] force state
   * @fires PSV.fullscreen-updated
   * @package
   */
  __fullscreenToggled(force) {
    this.prop.fullscreen = force !== undefined ? force : isFullscreenEnabled(this.psv.container);

    if (this.config.keyboard) {
      if (this.prop.fullscreen) {
        this.psv.startKeyboardControl();
      }
      else {
        this.psv.stopKeyboardControl();
      }
    }

    this.psv.trigger(EVENTS.FULLSCREEN_UPDATED, this.prop.fullscreen);
  }

  /**
   * @summary Initializes the movement
   * @param {MouseEvent|Touch} evt
   * @private
   */
  __startMove(evt) {
    this.psv.stopAutorotate();
    this.psv.stopAnimation()
      .then(() => {
        this.state.mouseX = evt.clientX;
        this.state.mouseY = evt.clientY;
        this.state.startMouseX = this.state.mouseX;
        this.state.startMouseY = this.state.mouseY;
        this.state.moving = true;
        this.state.zooming = false;

        this.state.mouseHistory.length = 0;
        this.__logMouseMove(evt);
      });
  }

  /**
   * @summary Initializes the combines move and zoom
   * @param {TouchEvent} evt
   * @private
   */
  __startMoveZoom(evt) {
    const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
    const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY };

    this.state.pinchDist = distance(p1, p2);
    this.state.mouseX = (p1.x + p2.x) / 2;
    this.state.mouseY = (p1.y + p2.y) / 2;
    this.state.startMouseX = this.state.mouseX;
    this.state.startMouseY = this.state.mouseY;
    this.state.moving = true;
    this.state.zooming = true;
  }

  /**
   * @summary Stops the movement
   * @description If the move threshold was not reached a click event is triggered, otherwise an animation is launched to simulate inertia
   * @param {MouseEvent|Touch} evt
   * @private
   */
  __stopMove(evt) {
    if (!getClosest(evt.target, '.psv-container')) {
      this.state.moving = false;
      this.state.mouseHistory.length = 0;
      return;
    }

    if (this.state.moving) {
      // move threshold to trigger a click
      if (Math.abs(evt.clientX - this.state.startMouseX) < MOVE_THRESHOLD && Math.abs(evt.clientY - this.state.startMouseY) < MOVE_THRESHOLD) {
        this.__click(evt);
        this.state.moving = false;
      }
      // inertia animation
      else if (this.config.moveInertia) {
        this.__logMouseMove(evt);
        this.__stopMoveInertia(evt);
      }
      else {
        this.state.moving = false;
      }

      this.state.mouseHistory.length = 0;
    }
  }

  /**
   * @summary Stops the combined move and zoom
   * @private
   */
  __stopMoveZoom() {
    this.state.mouseHistory.length = 0;
    this.state.moving = false;
    this.state.zooming = false;
  }

  /**
   * @summary Performs an animation to simulate inertia when the movement stops
   * @param {MouseEvent|Touch} evt
   * @private
   */
  __stopMoveInertia(evt) {
    const direction = {
      x: evt.clientX - this.state.mouseHistory[0][1],
      y: evt.clientY - this.state.mouseHistory[0][2],
    };

    const norm = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

    this.prop.animationPromise = new Animation({
      properties: {
        clientX: { start: evt.clientX, end: evt.clientX + direction.x },
        clientY: { start: evt.clientY, end: evt.clientY + direction.y },
      },
      duration  : norm * INERTIA_WINDOW / 100,
      easing    : 'outCirc',
      onTick    : (properties) => {
        this.__move(properties, false);
      },
    })
      .finally(() => {
        this.state.moving = false;
      });
  }

  /**
   * @summary Triggers an event with all coordinates when a simple click is performed
   * @param {MouseEvent|Touch} evt
   * @param {boolean} [longtouch=false]
   * @fires PSV.click
   * @fires PSV.dblclick
   * @private
   */
  __click(evt, longtouch = false) {
    const boundingRect = this.psv.container.getBoundingClientRect();

    /**
     * @type {PSV.ClickData}
     */
    const data = {
      rightclick: longtouch || evt.button === 2,
      target    : evt.target,
      clientX   : evt.clientX,
      clientY   : evt.clientY,
      viewerX   : evt.clientX - boundingRect.left,
      viewerY   : evt.clientY - boundingRect.top,
    };

    const intersect = this.psv.dataHelper.viewerCoordsToVector3({
      x: data.viewerX,
      y: data.viewerY,
    });

    if (intersect) {
      const sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(intersect);
      data.longitude = sphericalCoords.longitude;
      data.latitude = sphericalCoords.latitude;

      // TODO: for cubemap, computes texture's index and coordinates
      if (!this.prop.isCubemap) {
        const textureCoords = this.psv.dataHelper.sphericalCoordsToTextureCoords(data);
        data.textureX = textureCoords.x;
        data.textureY = textureCoords.y;
      }

      if (!this.state.dblclickTimeout) {
        this.psv.trigger(EVENTS.CLICK, data);

        this.state.dblclickData = clone(data);
        this.state.dblclickTimeout = setTimeout(() => {
          this.state.dblclickTimeout = null;
          this.state.dblclickData = null;
        }, DBLCLICK_DELAY);
      }
      else {
        if (Math.abs(this.state.dblclickData.clientX - data.clientX) < MOVE_THRESHOLD
          && Math.abs(this.state.dblclickData.clientY - data.clientY) < MOVE_THRESHOLD) {
          this.psv.trigger(EVENTS.DOUBLE_CLICK, this.state.dblclickData);
        }

        clearTimeout(this.state.dblclickTimeout);
        this.state.dblclickTimeout = null;
        this.state.dblclickData = null;
      }
    }
  }

  /**
   * @summary Performs movement
   * @param {MouseEvent|Touch} evt
   * @param {boolean} [log=true]
   * @private
   */
  __move(evt, log) {
    if (this.state.moving) {
      const x = evt.clientX;
      const y = evt.clientY;

      const rotation = {
        longitude: (x - this.state.mouseX) / this.prop.size.width * this.prop.moveSpeed * this.prop.hFov * SYSTEM.pixelRatio,
        latitude : (y - this.state.mouseY) / this.prop.size.height * this.prop.moveSpeed * this.prop.vFov * SYSTEM.pixelRatio,
      };

      this.psv.rotate({
        longitude: this.prop.position.longitude - rotation.longitude,
        latitude : this.prop.position.latitude + rotation.latitude,
      });

      this.state.mouseX = x;
      this.state.mouseY = y;

      if (log !== false) {
        this.__logMouseMove(evt);
      }
    }
  }

  /**
   * @summary Performs movement absolute to cursor position in viewer
   * @param {MouseEvent} evt
   * @private
   */
  __moveAbsolute(evt) {
    if (this.state.moving) {
      const containerRect = this.psv.container.getBoundingClientRect();
      this.psv.rotate({
        longitude: ((evt.clientX - containerRect.left) / containerRect.width - 0.5) * Math.PI * 2,
        latitude : -((evt.clientY - containerRect.top) / containerRect.height - 0.5) * Math.PI,
      });
    }
  }

  /**
   * @summary Perfoms combines move and zoom
   * @param {TouchEvent} evt
   * @private
   */
  __moveZoom(evt) {
    if (this.state.zooming && this.state.moving) {
      const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
      const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY };

      const p = distance(p1, p2);
      const delta = 80 * (p - this.state.pinchDist) / this.prop.size.width;

      this.psv.zoom(this.prop.zoomLvl + delta);

      this.__move({
        clientX: (p1.x + p2.x) / 2,
        clientY: (p1.y + p2.y) / 2,
      });

      this.state.pinchDist = p;
    }
  }

  /**
   * @summary Stores each mouse position during a mouse move
   * @description Positions older than "INERTIA_WINDOW" are removed<br>
   *     Positions before a pause of "INERTIA_WINDOW" / 10 are removed
   * @param {MouseEvent|Touch} evt
   * @private
   */
  __logMouseMove(evt) {
    const now = Date.now();
    this.state.mouseHistory.push([now, evt.clientX, evt.clientY]);

    let previous = null;

    for (let i = 0; i < this.state.mouseHistory.length;) {
      if (this.state.mouseHistory[0][i] < now - INERTIA_WINDOW) {
        this.state.mouseHistory.splice(i, 1);
      }
      else if (previous && this.state.mouseHistory[0][i] - previous > INERTIA_WINDOW / 10) {
        this.state.mouseHistory.splice(0, i);
        i = 0;
        previous = this.state.mouseHistory[0][i];
      }
      else {
        i++;
        previous = this.state.mouseHistory[0][i];
      }
    }
  }

}
