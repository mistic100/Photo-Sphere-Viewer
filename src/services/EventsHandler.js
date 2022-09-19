import { MathUtils, SplineCurve, Vector2 } from 'three';
import {
  ACTIONS,
  CTRLZOOM_TIMEOUT,
  DBLCLICK_DELAY,
  EVENTS,
  IDS,
  INERTIA_WINDOW,
  KEY_CODES,
  LONGTOUCH_DELAY,
  MESH_USER_DATA,
  MOVE_THRESHOLD,
  OBJECT_EVENTS,
  TWOFINGERSOVERLAY_DELAY
} from '../data/constants';
import { SYSTEM } from '../data/system';
import gestureIcon from '../icons/gesture.svg';
import mousewheelIcon from '../icons/mousewheel.svg';
import {
  clone,
  distance,
  each,
  getClosest,
  getPosition,
  hasParent,
  isEmpty,
  isFullscreenEnabled,
  normalizeWheel,
  throttle
} from '../utils';
import { Animation } from '../utils/Animation';
import { PressHandler } from '../utils/PressHandler';
import { AbstractService } from './AbstractService';

const IDLE = 0;
const MOVING = 1;
const INERTIA = 2;

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
     * @property {number} moveThreshold - computed threshold based on device pixel ratio
     * @property {number} step
     * @property {boolean} mousedown - before moving past the threshold
     * @property {number} startMouseX - start x position of the click/touch
     * @property {number} startMouseY - start y position of the click/touch
     * @property {number} mouseX - current x position of the cursor
     * @property {number} mouseY - current y position of the cursor
     * @property {number[][]} mouseHistory - list of latest positions of the cursor, [time, x, y]
     * @property {number} pinchDist - distance between fingers when zooming
     * @property {PressHandler} keyHandler
     * @property {boolean} ctrlKeyDown - when the Ctrl key is pressed
     * @property {PSV.ClickData} dblclickData - temporary storage of click data between two clicks
     * @property {number} dblclickTimeout - timeout id for double click
     * @property {number} twofingersTimeout - timeout id for "two fingers" overlay
     * @property {number} ctrlZoomTimeout - timeout id for "ctrol zoom" overlay
     * @protected
     */
    this.state = {
      moveThreshold    : MOVE_THRESHOLD * SYSTEM.pixelRatio,
      keyboardEnabled  : false,
      step             : IDLE,
      mousedown        : false,
      startMouseX      : 0,
      startMouseY      : 0,
      mouseX           : 0,
      mouseY           : 0,
      mouseHistory     : [],
      pinchDist        : 0,
      keyHandler       : new PressHandler(),
      ctrlKeyDown      : false,
      dblclickData     : null,
      dblclickTimeout  : null,
      longtouchTimeout : null,
      twofingersTimeout: null,
      ctrlZoomTimeout  : null,
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
    window.addEventListener('keydown', this, { passive: false });
    window.addEventListener('keyup', this);
    this.psv.container.addEventListener('mousedown', this);
    window.addEventListener('mousemove', this, { passive: false });
    window.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchstart', this, { passive: false });
    window.addEventListener('touchmove', this, { passive: false });
    window.addEventListener('touchend', this, { passive: false });
    this.psv.container.addEventListener(SYSTEM.mouseWheelEvent, this, { passive: false });

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
    window.removeEventListener('keyup', this);
    this.psv.container.removeEventListener('mousedown', this);
    window.removeEventListener('mousemove', this);
    window.removeEventListener('mouseup', this);
    this.psv.container.removeEventListener('touchstart', this);
    window.removeEventListener('touchmove', this);
    window.removeEventListener('touchend', this);
    this.psv.container.removeEventListener(SYSTEM.mouseWheelEvent, this);

    if (SYSTEM.fullscreenEvent) {
      document.removeEventListener(SYSTEM.fullscreenEvent, this);
    }

    clearTimeout(this.state.dblclickTimeout);
    clearTimeout(this.state.longtouchTimeout);
    clearTimeout(this.state.twofingersTimeout);
    clearTimeout(this.state.ctrlZoomTimeout);

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
      case 'resize':    this.__onResize(); break;
      case 'keydown':   this.__onKeyDown(evt); break;
      case 'keyup':     this.__onKeyUp(); break;
      case 'mousemove': this.__onMouseMove(evt); break;
      case 'mouseup':   this.__onMouseUp(evt); break;
      case 'touchmove': this.__onTouchMove(evt); break;
      case 'touchend':  this.__onTouchEnd(evt); break;
      case SYSTEM.fullscreenEvent: this.__fullscreenToggled(); break;
      // @formatter:on
    }
    /* eslint-enable */

    if (!getClosest(evt.target, '.psv--capture-event')) {
      /* eslint-disable */
      switch (evt.type) {
        // @formatter:off
        case 'mousedown':  this.__onMouseDown(evt); break;
        case 'touchstart': this.__onTouchStart(evt); break;
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
   * @param {KeyboardEvent} e
   * @private
   */
  __onKeyDown(e) {
    if (this.config.mousewheelCtrlKey) {
      this.state.ctrlKeyDown = e.key === KEY_CODES.Control;

      if (this.state.ctrlKeyDown) {
        clearTimeout(this.state.ctrlZoomTimeout);
        this.psv.overlay.hide(IDS.CTRL_ZOOM);
      }
    }

    const e2 = this.psv.trigger(EVENTS.KEY_PRESS, e.key);
    if (e2.isDefaultPrevented()) {
      return;
    }

    if (!this.state.keyboardEnabled) {
      return;
    }

    const action = this.config.keyboard[e.key];
    if (action === ACTIONS.TOGGLE_AUTOROTATE) {
      this.psv.toggleAutorotate();
      e.preventDefault();
    }
    else if (action && !this.state.keyHandler.time) {
      if (action !== ACTIONS.ZOOM_IN && action !== ACTIONS.ZOOM_OUT) {
        this.psv.__stopAll();
      }

      /* eslint-disable */
      switch (action) {
        // @formatter:off
        case ACTIONS.ROTATE_LAT_UP: this.psv.dynamics.position.roll({latitude: false}); break;
        case ACTIONS.ROTATE_LAT_DOWN: this.psv.dynamics.position.roll({latitude: true});  break;
        case ACTIONS.ROTATE_LONG_RIGHT: this.psv.dynamics.position.roll({longitude: false}); break;
        case ACTIONS.ROTATE_LONG_LEFT: this.psv.dynamics.position.roll({longitude: true}); break;
        case ACTIONS.ZOOM_IN: this.psv.dynamics.zoom.roll(false); break;
        case ACTIONS.ZOOM_OUT: this.psv.dynamics.zoom.roll(true); break;
        // @formatter:on
      }
      /* eslint-enable */

      this.state.keyHandler.down();
      e.preventDefault();
    }
  }

  /**
   * @summary Handles keyboard events
   * @private
   */
  __onKeyUp() {
    this.state.ctrlKeyDown = false;

    if (!this.state.keyboardEnabled) {
      return;
    }

    this.state.keyHandler.up(() => {
      this.psv.dynamics.position.stop();
      this.psv.dynamics.zoom.stop();
      this.psv.resetIdleTimer();
    });
  }

  /**
   * @summary Handles mouse down events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseDown(evt) {
    this.state.mousedown = true;
    this.state.startMouseX = evt.clientX;
    this.state.startMouseY = evt.clientY;
  }

  /**
   * @summary Handles mouse up events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseUp(evt) {
    if (this.state.mousedown || this.state.step === MOVING) {
      this.__stopMove(evt.clientX, evt.clientY, evt.target, evt.button === 2);
    }
  }

  /**
   * @summary Handles mouse move events
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseMove(evt) {
    if (this.config.mousemove && (this.state.mousedown || this.state.step === MOVING)) {
      evt.preventDefault();
      this.__move(evt.clientX, evt.clientY);
    }

    if (!isEmpty(this.prop.objectsObservers) && hasParent(evt.target, this.psv.container)) {
      const viewerPos = getPosition(this.psv.container);

      const viewerPoint = {
        x: evt.clientX - viewerPos.left,
        y: evt.clientY - viewerPos.top,
      };

      const intersections = this.psv.dataHelper.getIntersections(viewerPoint);

      const emit = (observer, key, type) => {
        observer.listener.handleEvent(new CustomEvent(type, {
          detail: {
            originalEvent: evt,
            object       : observer.object,
            data         : observer.object.userData[key],
            viewerPoint  : viewerPoint,
          },
        }));
      };

      each(this.prop.objectsObservers, (observer, key) => {
        const intersection = intersections.find(i => i.object.userData[key]);

        if (intersection) {
          if (observer.object && intersection.object !== observer.object) {
            emit(observer, key, OBJECT_EVENTS.LEAVE_OBJECT);
            delete observer.object;
          }

          if (!observer.object) {
            observer.object = intersection.object;
            emit(observer, key, OBJECT_EVENTS.ENTER_OBJECT);
          }
          else {
            emit(observer, key, OBJECT_EVENTS.HOVER_OBJECT);
          }
        }
        else if (observer.object) {
          emit(observer, key, OBJECT_EVENTS.LEAVE_OBJECT);
          delete observer.object;
        }
      });
    }
  }

  /**
   * @summary Handles touch events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchStart(evt) {
    if (evt.touches.length === 1) {
      this.state.mousedown = true;
      this.state.startMouseX = evt.touches[0].clientX;
      this.state.startMouseY = evt.touches[0].clientY;

      if (!this.prop.longtouchTimeout) {
        this.prop.longtouchTimeout = setTimeout(() => {
          const touch = evt.touches[0];
          this.__stopMove(touch.clientX, touch.clientY, touch.target, true);
          this.prop.longtouchTimeout = null;
        }, LONGTOUCH_DELAY);
      }
    }
    else if (evt.touches.length === 2) {
      this.state.mousedown = false;
      this.__cancelLongTouch();

      if (this.config.mousemove) {
        this.__cancelTwoFingersOverlay();
        this.__startMoveZoom(evt);
        evt.preventDefault();
      }
    }
  }

  /**
   * @summary Handles touch events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchEnd(evt) {
    this.__cancelLongTouch();

    if (this.state.mousedown || this.state.step === MOVING) {
      evt.preventDefault();
      this.__cancelTwoFingersOverlay();

      if (evt.touches.length === 1) {
        this.__stopMove(this.state.mouseX, this.state.mouseY);
      }
      else if (evt.touches.length === 0) {
        const touch = evt.changedTouches[0];
        this.__stopMove(touch.clientX, touch.clientY, touch.target);
      }
    }
  }

  /**
   * @summary Handles touch move events
   * @param {TouchEvent} evt
   * @private
   */
  __onTouchMove(evt) {
    this.__cancelLongTouch();

    if (!this.config.mousemove) {
      return;
    }

    if (evt.touches.length === 1) {
      if (this.config.touchmoveTwoFingers) {
        if (this.state.mousedown && !this.prop.twofingersTimeout) {
          this.prop.twofingersTimeout = setTimeout(() => {
            this.psv.overlay.show({
              id   : IDS.TWO_FINGERS,
              image: gestureIcon,
              text : this.config.lang.twoFingers,
            });
          }, TWOFINGERSOVERLAY_DELAY);
        }
      }
      else if (this.state.mousedown || this.state.step === MOVING) {
        evt.preventDefault();
        const touch = evt.touches[0];
        this.__move(touch.clientX, touch.clientY);
      }
    }
    else {
      evt.preventDefault();
      this.__moveZoom(evt);
      this.__cancelTwoFingersOverlay();
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
   * @summary Cancel the two fingers overlay timer if any
   * @private
   */
  __cancelTwoFingersOverlay() {
    if (this.config.touchmoveTwoFingers) {
      if (this.prop.twofingersTimeout) {
        clearTimeout(this.prop.twofingersTimeout);
        this.prop.twofingersTimeout = null;
      }
      this.psv.overlay.hide(IDS.TWO_FINGERS);
    }
  }

  /**
   * @summary Handles mouse wheel events
   * @param {WheelEvent} evt
   * @private
   */
  __onMouseWheel(evt) {
    if (!this.config.mousewheel) {
      return;
    }

    if (this.config.mousewheelCtrlKey && !this.state.ctrlKeyDown) {
      this.psv.overlay.show({
        id   : IDS.CTRL_ZOOM,
        image: mousewheelIcon,
        text : this.config.lang.ctrlZoom,
      });

      clearTimeout(this.state.ctrlZoomTimeout);
      this.state.ctrlZoomTimeout = setTimeout(() => this.psv.overlay.hide(IDS.CTRL_ZOOM), CTRLZOOM_TIMEOUT);

      return;
    }

    evt.preventDefault();
    evt.stopPropagation();

    const delta = normalizeWheel(evt).spinY * 5 * this.config.zoomSpeed;
    if (delta !== 0) {
      this.psv.dynamics.zoom.step(-delta, 5);
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
   * @summary Resets all state variables
   * @private
   */
  __resetMove() {
    this.state.step = IDLE;
    this.state.mousedown = false;
    this.state.mouseX = 0;
    this.state.mouseY = 0;
    this.state.startMouseX = 0;
    this.state.startMouseY = 0;
    this.state.mouseHistory.length = 0;
  }

  /**
   * @summary Initializes the combines move and zoom
   * @param {TouchEvent} evt
   * @private
   */
  __startMoveZoom(evt) {
    this.psv.__stopAll();
    this.__resetMove();

    const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
    const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY };

    this.state.step = MOVING;
    this.state.pinchDist = distance(p1, p2);
    this.state.mouseX = (p1.x + p2.x) / 2;
    this.state.mouseY = (p1.y + p2.y) / 2;
    this.__logMouseMove(this.state.mouseX, this.state.mouseY);
  }

  /**
   * @summary Stops the movement
   * @description If the move threshold was not reached a click event is triggered, otherwise an animation is launched to simulate inertia
   * @param {int} clientX
   * @param {int} clientY
   * @param {EventTarget} [target]
   * @param {boolean} [rightclick=false]
   * @private
   */
  __stopMove(clientX, clientY, target = null, rightclick = false) {
    if (this.state.step === MOVING) {
      if (this.config.moveInertia) {
        this.__logMouseMove(clientX, clientY);
        this.__stopMoveInertia(clientX, clientY);
      }
      else {
        this.__resetMove();
        this.psv.resetIdleTimer();
      }
    }
    else if (this.state.mousedown) {
      this.psv.stopAnimation();
      this.__click(clientX, clientY, target, rightclick);
      this.__resetMove();
      this.psv.resetIdleTimer();
    }
  }

  /**
   * @summary Performs an animation to simulate inertia when the movement stops
   * @param {int} clientX
   * @param {int} clientY
   * @private
   */
  __stopMoveInertia(clientX, clientY) {
    // get direction at end of movement
    const curve = new SplineCurve(this.state.mouseHistory.map(([, x, y]) => new Vector2(x, y)));
    const direction = curve.getTangent(1);

    // average speed
    const speed = this.state.mouseHistory.slice(1).reduce(({ total, prev }, curr) => {
      return {
        total: total + distance({ x: prev[1], y: prev[2] }, { x: curr[1], y: curr[2] }) / (curr[0] - prev[0]),
        prev : curr,
      };
    }, {
      total: 0,
      prev : this.state.mouseHistory[0],
    }).total / this.state.mouseHistory.length;

    if (!speed) {
      this.__resetMove();
      this.psv.resetIdleTimer();
      return;
    }

    this.state.step = INERTIA;

    let currentClientX = clientX;
    let currentClientY = clientY;

    this.prop.animationPromise = new Animation({
      properties: {
        speed: { start: speed, end: 0 },
      },
      duration  : 1000,
      easing    : 'outQuad',
      onTick    : (properties) => {
        // 3 is a magic number
        currentClientX += properties.speed * direction.x * 3 * SYSTEM.pixelRatio;
        currentClientY += properties.speed * direction.y * 3 * SYSTEM.pixelRatio;
        this.__applyMove(currentClientX, currentClientY);
      },
    });

    this.prop.animationPromise
      .then((done) => {
        this.prop.animationPromise = null;
        if (done) {
          this.__resetMove();
          this.psv.resetIdleTimer();
        }
      });
  }

  /**
   * @summary Triggers an event with all coordinates when a simple click is performed
   * @param {int} clientX
   * @param {int} clientY
   * @param {EventTarget} target
   * @param {boolean} [rightclick=false]
   * @fires PSV.click
   * @fires PSV.dblclick
   * @private
   */
  __click(clientX, clientY, target, rightclick = false) {
    const boundingRect = this.psv.container.getBoundingClientRect();

    /**
     * @type {PSV.ClickData}
     */
    const data = {
      rightclick: rightclick,
      target    : target,
      clientX   : clientX,
      clientY   : clientY,
      viewerX   : clientX - boundingRect.left,
      viewerY   : clientY - boundingRect.top,
    };

    const intersections = this.psv.dataHelper.getIntersections({
      x: data.viewerX,
      y: data.viewerY,
    });

    const sphereIntersection = intersections.find(i => i.object.userData[MESH_USER_DATA]);

    if (sphereIntersection) {
      const sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(sphereIntersection.point);
      data.longitude = sphericalCoords.longitude;
      data.latitude = sphericalCoords.latitude;

      data.objects = intersections.map(i => i.object).filter(o => !o.userData[MESH_USER_DATA]);

      try {
        const textureCoords = this.psv.dataHelper.sphericalCoordsToTextureCoords(data);
        data.textureX = textureCoords.x;
        data.textureY = textureCoords.y;
      }
      catch (e) {
        data.textureX = NaN;
        data.textureY = NaN;
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
        if (Math.abs(this.state.dblclickData.clientX - data.clientX) < this.state.moveThreshold
          && Math.abs(this.state.dblclickData.clientY - data.clientY) < this.state.moveThreshold) {
          this.psv.trigger(EVENTS.DOUBLE_CLICK, this.state.dblclickData);
        }

        clearTimeout(this.state.dblclickTimeout);
        this.state.dblclickTimeout = null;
        this.state.dblclickData = null;
      }
    }
  }

  /**
   * @summary Starts moving when crossing moveThreshold and performs movement
   * @param {int} clientX
   * @param {int} clientY
   * @private
   */
  __move(clientX, clientY) {
    if (this.state.mousedown
      && (Math.abs(clientX - this.state.startMouseX) >= this.state.moveThreshold
        || Math.abs(clientY - this.state.startMouseY) >= this.state.moveThreshold)) {
      this.psv.__stopAll();
      this.__resetMove();
      this.state.step = MOVING;
      this.state.mouseX = clientX;
      this.state.mouseY = clientY;
      this.__logMouseMove(clientX, clientY);
    }
    else if (this.state.step === MOVING) {
      this.__applyMove(clientX, clientY);
      this.__logMouseMove(clientX, clientY);
    }
  }

  /**
   * @summary Raw method for movement, called from mouse event and move inertia
   * @param {int} clientX
   * @param {int} clientY
   * @private
   */
  __applyMove(clientX, clientY) {
    const rotation = {
      longitude: (clientX - this.state.mouseX) / this.prop.size.width * this.config.moveSpeed
        * MathUtils.degToRad(this.prop.littlePlanet ? 90 : this.prop.hFov),
      latitude : (clientY - this.state.mouseY) / this.prop.size.height * this.config.moveSpeed
        * MathUtils.degToRad(this.prop.littlePlanet ? 90 : this.prop.vFov),
    };

    const currentPosition = this.psv.getPosition();
    this.psv.rotate({
      longitude: currentPosition.longitude - rotation.longitude,
      latitude : currentPosition.latitude + rotation.latitude,
    });

    this.state.mouseX = clientX;
    this.state.mouseY = clientY;
  }

  /**
   * @summary Perfoms combined move and zoom
   * @param {TouchEvent} evt
   * @private
   */
  __moveZoom(evt) {
    if (this.state.step === MOVING) {
      const p1 = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
      const p2 = { x: evt.touches[1].clientX, y: evt.touches[1].clientY };

      const p = distance(p1, p2);
      const delta = (p - this.state.pinchDist) / SYSTEM.pixelRatio * this.config.zoomSpeed;

      this.psv.zoom(this.psv.getZoomLevel() + delta);

      this.__move((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);

      this.state.pinchDist = p;
    }
  }

  /**
   * @summary Stores each mouse position during a mouse move
   * @description Positions older than "INERTIA_WINDOW" are removed<br>
   *     Positions before a pause of "INERTIA_WINDOW" / 10 are removed
   * @param {int} clientX
   * @param {int} clientY
   * @private
   */
  __logMouseMove(clientX, clientY) {
    const now = Date.now();

    const last = this.state.mouseHistory.length ? this.state.mouseHistory[this.state.mouseHistory.length - 1] : [0, -1, -1];

    // avoid duplicates
    if (last[1] === clientX && last[2] === clientY) {
      last[0] = now;
    }
    else if (now === last[0]) {
      last[1] = clientX;
      last[2] = clientY;
    }
    else {
      this.state.mouseHistory.push([now, clientX, clientY]);
    }

    let previous = null;

    for (let i = 0; i < this.state.mouseHistory.length;) {
      if (this.state.mouseHistory[i][0] < now - INERTIA_WINDOW) {
        this.state.mouseHistory.splice(i, 1);
      }
      else if (previous && this.state.mouseHistory[i][0] - previous > INERTIA_WINDOW / 10) {
        this.state.mouseHistory.splice(0, i);
        i = 0;
        previous = this.state.mouseHistory[i][0];
      }
      else {
        previous = this.state.mouseHistory[i][0];
        i++;
      }
    }
  }

}
