import { AbstractPlugin, CONSTANTS, PSVError, utils } from 'photo-sphere-viewer';

/**
 * @typedef {PSV.ExtendedPosition|string|Object} PSV.plugins.AutorotateKeypointsPlugin.Keypoints
 * @summary Definition of keypoints for automatic rotation, can be a position object, a marker id or an object with the following properties
 * @property {string} [markerId]
 * @property {PSV.ExtendedPosition} [position]
 * @property {string|{content: string, position: string}} [tooltip]
 * @property {number} [pause=0]
 */

/**
 * @typedef {Object} PSV.plugins.AutorotateKeypointsPlugin.Options
 * @property {boolean} [startFromClosest=true] - start from the closest keypoint instead of the first keypoint
 * @property {PSV.plugins.AutorotateKeypointsPlugin.Keypoints[]} keypoints
 */

/**
 * @summary Number of steps between each points
 * @type {number}
 * @constant
 * @private
 */
const NUM_STEPS = 16;

const serializePt = position => [position.longitude, position.latitude];


/**
 * @summary Replaces the standard autorotate animation by a smooth transition between multiple points
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export default class AutorotateKeypointsPlugin extends AbstractPlugin {

  static id = 'autorotate-keypoints';

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.AutorotateKeypointsPlugin.Options} [options]
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {Object}
     * @property {number} idx -  current index in keypoints
     * @property {number[][]} curve - curve between idx and idx + 1
     * @property {number[]} startPt - start point of the current step
     * @property {number[]} endPt - end point of the current step
     * @property {number} startTime - start time of the current step
     * @property {number} stepDuration - expected duration of the step
     * @property {number} remainingPause - time remaining for the pause
     * @property {number} lastTime - previous timestamp in render loop
     * @property {PSV.components.Tooltip} tooltip - currently displayed tooltip
     * @private
     */
    this.state = {};

    /**
     * @member {PSV.plugins.AutorotateKeypointsPlugin.Options}
     * @private
     */
    this.config = {
      startFromClosest: true,
      ...options,
      keypoints       : null,
    };

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @private
     */
    this.markers = this.psv.getPlugin('markers');

    if (options?.keypoints) {
      this.setKeypoints(options.keypoints);
    }

    this.psv.on(CONSTANTS.EVENTS.AUTOROTATE, this);
  }

  destroy() {
    this.psv.off(CONSTANTS.EVENTS.AUTOROTATE, this);

    delete this.keypoints;
    delete this.state;

    super.destroy();
  }

  handleEvent(e) {
    if (e.type === CONSTANTS.EVENTS.AUTOROTATE) {
      this.__configure();
    }
  }

  /**
   * @summary Changes the keypoints
   * @param {PSV.plugins.AutorotateKeypointsPlugin.Keypoints[]} keypoints
   */
  setKeypoints(keypoints) {
    if (keypoints?.length < 2) {
      throw new PSVError('At least two points are required');
    }

    this.keypoints = utils.clone(keypoints);

    if (this.keypoints) {
      this.keypoints.forEach((pt, i) => {
        if (typeof pt === 'string') {
          // eslint-disable-next-line no-param-reassign
          pt = { markerId: pt };
        }
        else if (this.psv.dataHelper.isExtendedPosition(pt)) {
          // eslint-disable-next-line no-param-reassign
          pt = { position: pt };
        }
        if (pt.markerId) {
          if (!this.markers) {
            throw new PSVError(`Keypoint #${i} references a marker but markers plugin is not loaded`);
          }
          const marker = this.markers.getMarker(pt.markerId);
          pt.position = serializePt(marker.props.position);
        }
        else if (pt.position) {
          pt.position = serializePt(this.psv.dataHelper.cleanPosition(pt.position));
        }
        else {
          throw new PSVError(`Keypoint #${i} is missing marker or position`);
        }

        if (typeof pt.tooltip === 'string') {
          pt.tooltip = { content: pt.tooltip };
        }

        this.keypoints[i] = pt;
      });
    }

    this.__configure();
  }

  /**
   * @private
   */
  __configure() {
    if (!this.psv.isAutorotateEnabled() || !this.keypoints) {
      this.__hideTooltip();
      this.state = {};
      return;
    }

    this.state = {
      idx           : -1,
      curve         : [],
      startPt       : null,
      endPt         : null,
      startTime     : null,
      stepDuration  : null,
      remainingPause: null,
      lastTime      : null,
      tooltip       : null,
    };

    if (this.config.startFromClosest) {
      const index = this.__findMinIndex(this.keypoints, (keypoint) => {
        return utils.greatArcDistance(keypoint.position, serializePt(this.psv.prop.position));
      });

      this.keypoints.push(...this.keypoints.splice(0, index));
    }

    const autorotateCb = (e, timestamp) => {
      // initialisation
      if (!this.state.startTime) {
        this.state.endPt = serializePt(this.psv.prop.position);
        this.__nextStep();

        this.state.startTime = timestamp;
        this.state.lastTime = timestamp;
      }

      this.__nextFrame(timestamp);
    };

    this.psv.off(CONSTANTS.EVENTS.BEFORE_RENDER, this.psv.prop.autorotateCb);
    this.psv.prop.autorotateCb = autorotateCb;
    this.psv.on(CONSTANTS.EVENTS.BEFORE_RENDER, this.psv.prop.autorotateCb);
  }

  /**
   * @private
   */
  __incrementIdx() {
    this.state.idx++;
    if (this.state.idx === this.keypoints.length) {
      this.state.idx = 0;
    }
  }

  /**
   * @private
   */
  __showTooltip() {
    const keypoint = this.keypoints[this.state.idx];

    if (keypoint.tooltip) {
      const position = this.psv.dataHelper.vector3ToViewerCoords(this.psv.prop.direction);

      this.state.tooltip = this.psv.tooltip.create({
        content : keypoint.tooltip.content,
        position: keypoint.tooltip.position,
        top     : position.y,
        left    : position.x,
      });
    }
    else if (keypoint.markerId) {
      const marker = this.markers.getMarker(keypoint.markerId);
      marker.showTooltip();
      this.state.tooltip = marker.tooltip;
    }
  }

  /**
   * @private
   */
  __hideTooltip() {
    if (this.state.tooltip) {
      const keypoint = this.keypoints[this.state.idx];

      if (keypoint.tooltip) {
        this.state.tooltip.hide();
      }
      else if (keypoint.markerId) {
        const marker = this.markers.getMarker(keypoint.markerId);
        marker.hideTooltip();
      }

      this.state.tooltip = null;
    }
  }

  /**
   * @private
   */
  __nextPoint() {
    // get the 4 points necessary to compute the current movement
    // one point before and two points before current
    const workPoints = [];
    if (this.state.idx === -1) {
      workPoints.push(
        serializePt(this.psv.prop.position),
        serializePt(this.psv.prop.position),
        this.keypoints[0].position,
        this.keypoints[1].position
      );
    }
    else {
      for (let i = -1; i < 3; i++) {
        const keypoint = this.state.idx + i < 0
          ? this.keypoints[this.keypoints.length - 1]
          : this.keypoints[(this.state.idx + i) % this.keypoints.length];
        workPoints.push(keypoint.position);
      }
    }

    // apply offsets to avoid crossing the origin
    const workPoints2 = [workPoints[0].slice(0)];

    let k = 0;
    for (let i = 1; i <= 3; i++) {
      const d = workPoints[i - 1][0] - workPoints[i][0];
      if (d > Math.PI) { // crossed the origin left to right
        k += 1;
      }
      else if (d < -Math.PI) { // crossed the origin right to left
        k -= 1;
      }
      if (k !== 0 && i === 1) {
        // do not modify first point, apply the reverse offset the the previous point instead
        workPoints2[0][0] -= k * 2 * Math.PI;
        k = 0;
      }
      workPoints2.push([workPoints[i][0] + k * 2 * Math.PI, workPoints[i][1]]);
    }

    // only keep the curve for the current movement
    this.state.curve = this.__getCurvePoints(workPoints2, 0.6, NUM_STEPS)
      .slice(NUM_STEPS, NUM_STEPS * 2);

    if (this.state.idx !== -1) {
      this.state.remainingPause = this.keypoints[this.state.idx].pause;

      if (this.state.remainingPause) {
        this.__showTooltip();
      }
      else {
        this.__incrementIdx();
      }
    }
    else {
      this.__incrementIdx();
    }
  }

  /**
   * @private
   */
  __nextStep() {
    if (this.state.curve.length === 0) {
      this.__nextPoint();

      // reset transformation made to the previous point
      this.state.endPt[0] = utils.parseAngle(this.state.endPt[0]);
    }

    // target next point
    this.state.startPt = this.state.endPt;
    this.state.endPt = this.state.curve.shift();

    // compute duration from distance and speed
    const distance = utils.greatArcDistance(this.state.startPt, this.state.endPt);
    this.state.stepDuration = distance * 1000 / Math.abs(this.psv.config.autorotateSpeed);

    if (distance === 0) { // edge case
      this.__nextStep();
    }
  }

  /**
   * @private
   */
  __nextFrame(timestamp) {
    const ellapsed = timestamp - this.state.lastTime;
    this.state.lastTime = timestamp;

    // currently paused
    if (this.state.remainingPause) {
      this.state.remainingPause = Math.max(0, this.state.remainingPause - ellapsed);
      if (this.state.remainingPause > 0) {
        return;
      }
      else {
        this.__hideTooltip();
        this.__incrementIdx();
        this.state.startTime = timestamp;
      }
    }

    let progress = (timestamp - this.state.startTime) / this.state.stepDuration;
    if (progress >= 1) {
      this.__nextStep();
      progress = 0;
      this.state.startTime = timestamp;
    }

    this.psv.rotate({
      longitude: this.state.startPt[0] + (this.state.endPt[0] - this.state.startPt[0]) * progress,
      latitude : this.state.startPt[1] + (this.state.endPt[1] - this.state.startPt[1]) * progress,
    }, true);
  }

  /**
   * @summary Interpolate curvature points using cardinal spline
   * {@link https://stackoverflow.com/a/15528789/1207670}
   * @param {number[][]} pts
   * @param {number} [tension=0.5]
   * @param {number} [numOfSegments=16]
   * @returns {number[][]}
   * @private
   */
  __getCurvePoints(pts, tension = 0.5, numOfSegments = 16) {
    const res = [];

    // The algorithm require a previous and next point to the actual point array.
    const _pts = pts.slice(0);
    _pts.unshift(pts[0]);
    _pts.push(pts[pts.length - 1]);

    // 1. loop through each point
    // 2. loop through each segment
    for (let i = 1; i < _pts.length - 2; i++) {
      // calc tension vectors
      const t1x = (_pts[i + 1][0] - _pts[i - 1][0]) * tension;
      const t2x = (_pts[i + 2][0] - _pts[i][0]) * tension;

      const t1y = (_pts[i + 1][1] - _pts[i - 1][1]) * tension;
      const t2y = (_pts[i + 2][1] - _pts[i][1]) * tension;

      for (let t = 1; t <= numOfSegments; t++) {
        // calc step
        const st = t / numOfSegments;

        const st3 = Math.pow(st, 3);
        const st2 = Math.pow(st, 2);

        // calc cardinals
        const c1 = 2 * st3 - 3 * st2 + 1;
        const c2 = -2 * st3 + 3 * st2;
        const c3 = st3 - 2 * st2 + st;
        const c4 = st3 - st2;

        // calc x and y cords with common control vectors
        const x = c1 * _pts[i][0] + c2 * _pts[i + 1][0] + c3 * t1x + c4 * t2x;
        const y = c1 * _pts[i][1] + c2 * _pts[i + 1][1] + c3 * t1y + c4 * t2y;

        // store points in array
        res.push([x, y]);
      }
    }

    return res;
  }

  __findMinIndex(array, mapper) {
    let idx = 0;
    let current = Number.MAX_VALUE;

    array.forEach((item, i) => {
      const value = mapper ? mapper(item) : item;
      if (value < current) {
        current = value;
        idx = i;
      }
    });

    return idx;
  }

}
