import type { ExtendedPosition, PluginConstructor, Position, Tooltip, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, CONSTANTS, events, PSVError, utils } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import type { VideoPlugin } from '@photo-sphere-viewer/video-plugin';
import { MathUtils, SplineCurve, Vector2 } from 'three';
import { AutorotateEvent, AutorotatePluginEvents } from './events';
import { AutorotateKeypoint, AutorotatePluginConfig, UpdatableAutorotatePluginConfig } from './model';
// import { debugCurve } from '../../shared/autorotate-utils';

type ParsedAutorotatePluginConfig = Omit<AutorotatePluginConfig, 'autorotateSpeed' | 'autorotatePitch'> & {
    autorotateSpeed?: number;
    autorotatePitch?: number;
};

type AutorotateKeypointInternal = {
    position: [number, number];
    markerId: string;
    pause: number;
    tooltip: { content: string; position?: string };
};

const getConfig = utils.getConfigParser<AutorotatePluginConfig, ParsedAutorotatePluginConfig>(
    {
        autostartDelay: 2000,
        autostartOnIdle: true,
        autorotateSpeed: utils.parseSpeed('2rpm'),
        autorotatePitch: null,
        autorotateZoomLvl: null,
        keypoints: null,
        startFromClosest: true,
    },
    {
        autostartOnIdle: (autostartOnIdle, { rawConfig }) => {
            if (autostartOnIdle && utils.isNil(rawConfig.autostartDelay)) {
                utils.logWarn('autostartOnIdle requires a non null autostartDelay');
                return false;
            }
            return autostartOnIdle;
        },
        autorotateSpeed: (autorotateSpeed) => {
            return utils.parseSpeed(autorotateSpeed);
        },
        autorotatePitch: (autorotatePitch) => {
            // autorotatePitch is between -PI/2 and PI/2
            if (!utils.isNil(autorotatePitch)) {
                return utils.parseAngle(autorotatePitch, true);
            }
            return null;
        },
        autorotateZoomLvl: (autorotateZoomLvl) => {
            if (!utils.isNil(autorotateZoomLvl)) {
                return MathUtils.clamp(autorotateZoomLvl, 0, 100);
            }
            return null;
        },
    },
);

const NUM_STEPS = 16;

function serializePt(position: Position): [number, number] {
    return [position.yaw, position.pitch];
}

/**
 * Adds an automatic rotation of the panorama
 */
export class AutorotatePlugin extends AbstractConfigurablePlugin<
    AutorotatePluginConfig,
    ParsedAutorotatePluginConfig,
    UpdatableAutorotatePluginConfig,
    AutorotatePluginEvents
> {
    static override readonly id = 'autorotate';
    static override readonly VERSION = PKG_VERSION;
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof AutorotatePluginConfig> = ['keypoints'];

    private readonly state = {
        initialStart: true,
        disableOnIdle: false,
        /** if the automatic rotation is enabled */
        enabled: false,
        /** current index in keypoints */
        idx: -1,
        /** curve between idx and idx + 1 */
        curve: [] as Array<[number, number]>,
        /** start point of the current step */
        startStep: null as [number, number],
        /** end point of the current step */
        endStep: null as [number, number],
        /** start time of the current step  */
        startTime: null as number,
        /** expected duration of the step */
        stepDuration: null as number,
        /** time remaining for the pause */
        remainingPause: null as number,
        /** previous timestamp in render loop */
        lastTime: null as number,
        /** currently displayed tooltip */
        tooltip: null as Tooltip,
    };

    private keypoints: AutorotateKeypointInternal[];

    private video?: VideoPlugin;
    private markers?: MarkersPlugin;

    static withConfig(config: AutorotatePluginConfig): [PluginConstructor, any] {
        return [AutorotatePlugin, config];
    }

    constructor(viewer: Viewer, config: AutorotatePluginConfig) {
        super(viewer, config);

        this.state.initialStart = !utils.isNil(this.config.autostartDelay);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.video = this.viewer.getPlugin('video');
        this.markers = this.viewer.getPlugin('markers');

        if (this.config.keypoints) {
            this.setKeypoints(this.config.keypoints);
            delete this.config.keypoints;
        }

        this.viewer.addEventListener(events.StopAllEvent.type, this);
        this.viewer.addEventListener(events.BeforeRenderEvent.type, this);

        // conflict with play/pause of the video plugin
        if (!this.video) {
            this.viewer.addEventListener(events.KeypressEvent.type, this);
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.StopAllEvent.type, this);
        this.viewer.removeEventListener(events.BeforeRenderEvent.type, this);
        this.viewer.removeEventListener(events.KeypressEvent.type, this);

        delete this.video;
        delete this.markers;
        delete this.keypoints;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.StopAllEvent.type:
                this.stop();
                break;

            case events.BeforeRenderEvent.type: {
                this.__beforeRender((e as events.BeforeRenderEvent).timestamp);
                break;
            }

            case events.KeypressEvent.type:
                this.__onKeyPress(e as events.KeypressEvent);
                break;
        }
    }

    /**
     * Changes the keypoints
     * @throws {@link PSVError} if the configuration is invalid
     */
    setKeypoints(keypoints: AutorotateKeypoint[] | null) {
        if (!keypoints) {
            this.keypoints = null;
        } else {
            if (keypoints.length < 2) {
                throw new PSVError('At least two points are required');
            }

            this.keypoints = keypoints.map((pt, i) => {
                const keypoint: AutorotateKeypointInternal = {
                    position: null,
                    markerId: null,
                    pause: 0,
                    tooltip: null,
                };

                let position: ExtendedPosition;

                if (typeof pt === 'string') {
                    keypoint.markerId = pt;
                } else if (utils.isExtendedPosition(pt)) {
                    position = pt;
                } else {
                    keypoint.markerId = pt.markerId;
                    keypoint.pause = pt.pause;
                    position = pt.position;

                    if (pt.tooltip && typeof pt.tooltip === 'object') {
                        keypoint.tooltip = pt.tooltip;
                    } else if (typeof pt.tooltip === 'string') {
                        keypoint.tooltip = { content: pt.tooltip };
                    }
                }

                if (keypoint.markerId) {
                    if (!this.markers) {
                        throw new PSVError(`Keypoint #${i} references a marker but the markers plugin is not loaded`);
                    }
                    const marker = this.markers.getMarker(keypoint.markerId);
                    keypoint.position = serializePt(marker.state.position);
                } else if (position) {
                    keypoint.position = serializePt(this.viewer.dataHelper.cleanPosition(position));
                } else {
                    throw new PSVError(`Keypoint #${i} is missing marker or position`);
                }

                return keypoint;
            });
        }

        if (this.isEnabled()) {
            this.stop();
            this.start();
        }
    }

    /**
     * Checks if the automatic rotation is enabled
     */
    isEnabled(): boolean {
        return this.state.enabled;
    }

    /**
     * Starts the automatic rotation
     */
    start() {
        if (this.isEnabled()) {
            return;
        }

        this.viewer.stopAll();

        if (!this.keypoints) {
            this.__animate();
        } else if (this.config.startFromClosest) {
            this.__shiftKeypoints();
        }

        this.state.initialStart = false;
        this.state.disableOnIdle = false;
        this.state.enabled = true;

        this.dispatchEvent(new AutorotateEvent(true));
    }

    /**
     * Stops the automatic rotation
     */
    stop() {
        if (!this.isEnabled()) {
            return;
        }

        this.__hideTooltip();
        this.__reset();

        this.viewer.stopAnimation();
        this.viewer.dynamics.position.stop();
        this.viewer.dynamics.zoom.stop();

        this.state.enabled = false;

        this.dispatchEvent(new AutorotateEvent(false));
    }

    /**
     * Starts or stops the automatic rotation
     */
    toggle() {
        if (this.isEnabled()) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * @internal
     */
    reverse() {
        if (this.isEnabled() && !this.keypoints) {
            this.config.autorotateSpeed = -this.config.autorotateSpeed;
            this.__animate();
        }
    }

    /**
     * @internal
     */
    disableOnIdle() {
        this.state.disableOnIdle = true;
    }

    /**
     * Launches the standard animation
     */
    private __animate() {
        // do the zoom before the rotation
        let p: PromiseLike<any>;
        if (!utils.isNil(this.config.autorotateZoomLvl)) {
            p = this.viewer.animate({
                zoom: this.config.autorotateZoomLvl,
                // "2" is magic, and kinda related to the "PI/4" in getAnimationProperties()
                speed: `${this.viewer.config.zoomSpeed * 2}rpm`,
            });
        } else {
            p = Promise.resolve(true);
        }

        p.then((done) => {
            if (done) {
                this.viewer.dynamics.position.roll(
                    {
                        yaw: this.config.autorotateSpeed < 0,
                    },
                    Math.abs(this.config.autorotateSpeed / this.viewer.config.moveSpeed),
                );

                if (!utils.isNil(this.config.autorotatePitch)) {
                    this.viewer.dynamics.position.goto(
                        {
                            pitch: this.config.autorotatePitch,
                        },
                        Math.abs(this.config.autorotateSpeed / this.viewer.config.moveSpeed),
                    );
                }
            }
        });
    }

    /**
     * Resets all the curve variables
     */
    private __reset() {
        this.state.idx = -1;
        this.state.curve = [];
        this.state.startStep = null;
        this.state.endStep = null;
        this.state.startTime = null;
        this.state.stepDuration = null;
        this.state.remainingPause = null;
        this.state.lastTime = null;
        this.state.tooltip = null;
    }

    /**
     * Automatically starts if the delay is reached
     * Performs keypoints animation
     */
    private __beforeRender(timestamp: number) {
        if (
            (this.state.initialStart || (this.config.autostartOnIdle && !this.state.disableOnIdle))
            && this.viewer.state.idleTime > 0
            && timestamp - this.viewer.state.idleTime > this.config.autostartDelay
        ) {
            this.start();
        }

        if (this.isEnabled() && this.keypoints) {
            // initialisation
            if (!this.state.startTime) {
                this.state.endStep = serializePt(this.viewer.getPosition());
                this.__nextStep();

                this.state.startTime = timestamp;
                this.state.lastTime = timestamp;
            }

            this.__nextFrame(timestamp);
        }
    }

    private __shiftKeypoints() {
        const currentPosition = serializePt(this.viewer.getPosition());
        const index = this.__findMinIndex(this.keypoints, (keypoint) => {
            return utils.greatArcDistance(keypoint.position, currentPosition);
        });

        this.keypoints.push(...this.keypoints.splice(0, index));
    }

    private __incrementIdx() {
        this.state.idx++;
        if (this.state.idx === this.keypoints.length) {
            this.state.idx = 0;
        }
    }

    private __showTooltip() {
        const keypoint = this.keypoints[this.state.idx];

        if (keypoint.tooltip) {
            const position = this.viewer.dataHelper.vector3ToViewerCoords(this.viewer.state.direction);

            this.state.tooltip = this.viewer.createTooltip({
                content: keypoint.tooltip.content,
                position: keypoint.tooltip.position,
                top: position.y,
                left: position.x,
            });
        } else if (keypoint.markerId) {
            const marker = this.markers.getMarker(keypoint.markerId);
            marker.showTooltip();
            this.state.tooltip = marker.tooltip;
        }
    }

    private __hideTooltip() {
        if (this.state.tooltip) {
            const keypoint = this.keypoints[this.state.idx];

            if (keypoint.tooltip) {
                this.state.tooltip.hide();
            } else if (keypoint.markerId) {
                const marker = this.markers.getMarker(keypoint.markerId);
                marker.hideTooltip();
            }

            this.state.tooltip = null;
        }
    }

    private __nextPoint() {
        // get the 4 points necessary to compute the current movement
        // the two points of the current segments and one point before and after
        const workPoints = [];
        if (this.state.idx === -1) {
            const currentPosition = serializePt(this.viewer.getPosition());
            workPoints.push(
                currentPosition,
                currentPosition,
                this.keypoints[0].position,
                this.keypoints[1].position,
            );
        } else {
            for (let i = -1; i < 3; i++) {
                const keypoint = this.state.idx + i < 0
                    ? this.keypoints[this.keypoints.length - 1]
                    : this.keypoints[(this.state.idx + i) % this.keypoints.length];
                workPoints.push(keypoint.position);
            }
        }

        // apply offsets to avoid crossing the origin
        const workVectors = [new Vector2(workPoints[0][0], workPoints[0][1])];

        let k = 0;
        for (let i = 1; i <= 3; i++) {
            const d = workPoints[i - 1][0] - workPoints[i][0];
            if (d > Math.PI) {
                // crossed the origin left to right
                k += 1;
            } else if (d < -Math.PI) {
                // crossed the origin right to left
                k -= 1;
            }
            if (k !== 0 && i === 1) {
                // do not modify first point, apply the reverse offset the the previous point instead
                workVectors[0].x -= k * 2 * Math.PI;
                k = 0;
            }
            workVectors.push(new Vector2(workPoints[i][0] + k * 2 * Math.PI, workPoints[i][1]));
        }

        const curve: Array<[number, number]> = new SplineCurve(workVectors)
            .getPoints(NUM_STEPS * 3)
            .map(p => [p.x, p.y]);

        // debugCurve(this.markers, curve, NUM_STEPS);

        // only keep the curve for the current movement
        this.state.curve = curve.slice(NUM_STEPS + 1, NUM_STEPS * 2 + 1);

        if (this.state.idx !== -1) {
            this.state.remainingPause = this.keypoints[this.state.idx].pause;

            if (this.state.remainingPause) {
                this.__showTooltip();
            } else {
                this.__incrementIdx();
            }
        } else {
            this.__incrementIdx();
        }
    }

    private __nextStep() {
        if (this.state.curve.length === 0) {
            this.__nextPoint();

            // reset transformation made to the previous point
            this.state.endStep[0] = utils.parseAngle(this.state.endStep[0]);
        }

        // target next point
        this.state.startStep = this.state.endStep;
        this.state.endStep = this.state.curve.shift();

        // compute duration from distance and speed
        const distance = utils.greatArcDistance(this.state.startStep, this.state.endStep);
        this.state.stepDuration = (distance * 1000) / Math.abs(this.config.autorotateSpeed);

        if (distance === 0) {
            // edge case
            this.__nextStep();
        }
    }

    private __nextFrame(timestamp: number) {
        const ellapsed = timestamp - this.state.lastTime;
        this.state.lastTime = timestamp;

        // currently paused
        if (this.state.remainingPause) {
            this.state.remainingPause = Math.max(0, this.state.remainingPause - ellapsed);
            if (this.state.remainingPause > 0) {
                return;
            } else {
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

        this.viewer.rotate({
            yaw: this.state.startStep[0] + (this.state.endStep[0] - this.state.startStep[0]) * progress,
            pitch: this.state.startStep[1] + (this.state.endStep[1] - this.state.startStep[1]) * progress,
        });
    }

    private __findMinIndex<T>(array: T[], mapper: (item: T) => number) {
        let idx = 0;
        let current = Number.MAX_VALUE;

        array.forEach((item, i) => {
            const value = mapper(item);
            if (value < current) {
                current = value;
                idx = i;
            }
        });

        return idx;
    }

    private __onKeyPress(e: events.KeypressEvent) {
        if (this.viewer.state.keyboardEnabled && e.matches(CONSTANTS.KEY_CODES.Space)) {
            this.toggle();
            e.preventDefault();
        }
    }
}
