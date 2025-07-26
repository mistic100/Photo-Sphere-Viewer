import type { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import type { AbstractAdapter, PluginConstructor, Position, TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, CONSTANTS, events, PSVError, utils } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { MathUtils, SplineCurve, Texture, Vector2 } from 'three';
import { PauseOverlay } from './components/PauseOverlay';
import { ProgressBar } from './components/ProgressBar';
import { BufferEvent, PlayPauseEvent, ProgressEvent, VideoPluginEvents, VolumeChangeEvent } from './events';
import { VideoKeypoint, VideoPluginConfig } from './model';
// import { debugCurve } from '../../shared/autorotate-utils';

const getConfig = utils.getConfigParser<VideoPluginConfig>({
    progressbar: true,
    bigbutton: true,
    keypoints: null,
});

/**
 * Controls a video adapter
 */
export class VideoPlugin extends AbstractConfigurablePlugin<
    VideoPluginConfig,
    VideoPluginConfig,
    never,
    VideoPluginEvents
> {
    static override readonly id = 'video';
    static override readonly VERSION = PKG_VERSION;
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions = Object.keys(getConfig.defaults);

    private readonly state = {
        curve: null as SplineCurve,
        start: null as VideoKeypoint,
        end: null as VideoKeypoint,
        waiting: false,
        keypoints: null as VideoKeypoint[],
    };

    private video?: HTMLVideoElement;
    private progressbar?: ProgressBar;
    private overlay?: PauseOverlay;

    private autorotate?: AutorotatePlugin;
    private markers?: MarkersPlugin;

    static withConfig(config: VideoPluginConfig): [PluginConstructor, any] {
        return [VideoPlugin, config];
    }

    constructor(viewer: Viewer, config: VideoPluginConfig) {
        super(viewer, config);

        if (!(this.viewer.adapter.constructor as typeof AbstractAdapter).id.includes('video')) {
            throw new PSVError('VideoPlugin can only be used with a video adapter.');
        }

        if (this.config.progressbar) {
            this.progressbar = new ProgressBar(this, viewer);
        }

        if (this.config.bigbutton) {
            this.overlay = new PauseOverlay(this, viewer);
        }
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        utils.checkStylesheet(this.viewer.container, 'video-plugin');

        this.markers = this.viewer.getPlugin('markers');
        this.autorotate = this.viewer.getPlugin('autorotate');

        if (this.autorotate) {
            this.autorotate.config.autostartDelay = 0;
            this.autorotate.config.autostartOnIdle = false;
        }

        if (this.config.keypoints) {
            this.setKeypoints(this.config.keypoints);
            delete this.config.keypoints;
        }

        this.autorotate?.addEventListener('autorotate', this);
        this.viewer.addEventListener(events.BeforeRenderEvent.type, this);
        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.addEventListener(events.KeypressEvent.type, this);
    }

    /**
     * @internal
     */
    override destroy() {
        this.autorotate?.removeEventListener('autorotate', this);
        this.viewer.removeEventListener(events.BeforeRenderEvent.type, this);
        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.removeEventListener(events.KeypressEvent.type, this);

        delete this.progressbar;
        delete this.overlay;
        delete this.markers;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.BeforeRenderEvent.type:
                this.__autorotate();
                break;
            case 'autorotate':
                this.__configureAutorotate();
                break;
            case events.PanoramaLoadedEvent.type:
                this.__bindVideo((e as events.PanoramaLoadedEvent).data);
                this.progressbar?.show();
                break;
            case events.KeypressEvent.type:
                this.__onKeyPress(e as events.KeypressEvent);
                break;
            case 'play':
                if (this.state.waiting) {
                    this.viewer.loader.showUndefined();
                }
                this.dispatchEvent(new PlayPauseEvent(true));
                break;
            case 'pause':
                if (this.state.waiting) {
                    this.viewer.loader.hide();
                }
                this.dispatchEvent(new PlayPauseEvent(false));
                break;
            case 'progress':
                this.dispatchEvent(new BufferEvent(this.getBufferProgress()));
                break;
            case 'volumechange':
                this.dispatchEvent(new VolumeChangeEvent(this.getVolume()));
                break;
            case 'timeupdate':
                this.dispatchEvent(new ProgressEvent(this.getTime(), this.getDuration(), this.getProgress()));
                break;
            case 'playing':
                this.state.waiting = false;
                this.viewer.loader.hide();
                break;
            case 'waiting':
                this.state.waiting = true;
                this.viewer.loader.showUndefined();
                break;
        }
    }

    private __bindVideo(textureData: TextureData) {
        if (this.video) {
            this.video.removeEventListener('play', this);
            this.video.removeEventListener('pause', this);
            this.video.removeEventListener('progress', this);
            this.video.removeEventListener('volumechange', this);
            this.video.removeEventListener('timeupdate', this);
            this.video.removeEventListener('playing', this);
            this.video.removeEventListener('waiting', this);
        }

        this.video = (textureData as TextureData<Texture>).texture.image;
        this.state.waiting = false;

        this.video.addEventListener('play', this);
        this.video.addEventListener('pause', this);
        this.video.addEventListener('progress', this);
        this.video.addEventListener('volumechange', this);
        this.video.addEventListener('timeupdate', this);
        this.video.addEventListener('playing', this);
        this.video.addEventListener('waiting', this);
    }

    private __onKeyPress(e: events.KeypressEvent) {
        if (e.matches(CONSTANTS.KEY_CODES.Space)) {
            this.playPause();
            e.preventDefault();
        }
    }

    /**
     * Returns the durection of the video
     */
    getDuration(): number {
        return this.video?.duration ?? 0;
    }

    /**
     * Returns the current time of the video
     */
    getTime(): number {
        return this.video?.currentTime ?? 0;
    }

    /**
     * Returns the play progression of the video
     */
    getProgress(): number {
        return this.video ? this.video.currentTime / this.video.duration : 0;
    }

    /**
     * Returns if the video is playing
     */
    isPlaying(): boolean {
        return this.video ? !this.video.paused : false;
    }

    /**
     * Returns the video volume
     */
    getVolume(): number {
        return this.video?.muted ? 0 : this.video?.volume ?? 0;
    }

    /**
     * Starts or pause the video
     */
    playPause() {
        if (this.video) {
            if (this.video.paused) {
                this.video.play();
            } else {
                this.video.pause();
            }
        }
    }

    /**
     * Starts the video if paused
     */
    play() {
        if (this.video?.paused) {
            this.video.play();
        }
    }

    /**
     * Pauses the cideo if playing
     */
    pause() {
        if (this.video && !this.video.paused) {
            this.video.pause();
        }
    }

    /**
     * Sets the volume of the video
     */
    setVolume(volume: number) {
        if (this.video) {
            this.video.muted = false;
            this.video.volume = MathUtils.clamp(volume, 0, 1);
        }
    }

    /**
     * (Un)mutes the video
     * @param [mute] - toggle if undefined
     */
    setMute(mute?: boolean) {
        if (this.video) {
            this.video.muted = mute === undefined ? !this.video.muted : mute;
            if (!this.video.muted && this.video.volume === 0) {
                this.video.volume = 0.1;
            }
        }
    }

    /**
     * Changes the current time of the video
     */
    setTime(time: number) {
        if (this.video) {
            this.video.currentTime = time;
        }
    }

    /**
     * Changes the progression of the video
     */
    setProgress(progress: number) {
        if (this.video) {
            this.video.currentTime = this.video.duration * progress;
        }
    }

    /**
     * @internal
     */
    getBufferProgress() {
        if (this.video) {
            let maxBuffer = 0;

            const buffer = this.video.buffered;

            for (let i = 0, l = buffer.length; i < l; i++) {
                if (buffer.start(i) <= this.video.currentTime && buffer.end(i) >= this.video.currentTime) {
                    maxBuffer = buffer.end(i);
                    break;
                }
            }

            return Math.max(this.video.currentTime, maxBuffer) / this.video.duration;
        } else {
            return 0;
        }
    }

    /**
     * Changes the keypoints
     * @throws {@link PSVError} if the configuration is invalid
     */
    setKeypoints(keypoints?: VideoKeypoint[] | null) {
        if (!this.autorotate) {
            throw new PSVError('Video keypoints required the AutorotatePlugin');
        }

        if (!keypoints) {
            this.state.keypoints = null;
            this.__configureAutorotate();
            return;
        }

        if (keypoints.length < 2) {
            throw new PSVError('At least two points are required');
        }

        this.state.keypoints = utils.clone(keypoints);

        if (this.state.keypoints) {
            this.state.keypoints.forEach((pt, i) => {
                if (pt.position) {
                    pt.position = this.viewer.dataHelper.cleanPosition(pt.position);
                } else {
                    throw new PSVError(`Keypoint #${i} is missing marker or position`);
                }

                if (utils.isNil(pt.time)) {
                    throw new PSVError(`Keypoint #${i} is missing time`);
                }
            });

            this.state.keypoints.sort((a, b) => a.time - b.time);
        }

        this.__configureAutorotate();
    }

    private __configureAutorotate() {
        delete this.state.curve;
        delete this.state.start;
        delete this.state.end;

        if (this.autorotate.isEnabled() && this.state.keypoints) {
            // cancel core rotation
            this.viewer.dynamics.position.stop();
        }
    }

    private __autorotate() {
        if (!this.autorotate?.isEnabled() || !this.state.keypoints) {
            return;
        }

        const currentTime = this.getTime();
        const autorotate = this.state;

        if (!autorotate.curve || currentTime < autorotate.start.time || currentTime >= autorotate.end.time) {
            this.__autorotateNext(currentTime);
        }

        if (autorotate.start === autorotate.end) {
            this.viewer.rotate(autorotate.start.position);
        } else {
            const progress = (currentTime - autorotate.start.time) / (autorotate.end.time - autorotate.start.time);
            // only the middle segment contains the current section
            const pt = autorotate.curve.getPoint(1 / 3 + progress / 3);

            this.viewer.dynamics.position.goto({ yaw: pt.x, pitch: pt.y });
        }
    }

    private __autorotateNext(currentTime: number) {
        let k1 = null;
        let k2 = null;

        const keypoints = this.state.keypoints;
        const l = keypoints.length - 1;

        if (currentTime < keypoints[0].time) {
            k1 = 0;
            k2 = 0;
        }
        for (let i = 0; i < l; i++) {
            if (currentTime >= keypoints[i].time && currentTime < keypoints[i + 1].time) {
                k1 = i;
                k2 = i + 1;
                break;
            }
        }
        if (currentTime >= keypoints[l].time) {
            k1 = l;
            k2 = l;
        }

        // get the 4 points necessary to compute the current movement
        // one point before and two points after the current
        const workPoints: Position[] = [
            keypoints[Math.max(0, k1 - 1)].position as Position,
            keypoints[k1].position as Position,
            keypoints[k2].position as Position,
            keypoints[Math.min(l, k2 + 1)].position as Position,
        ];

        // apply offsets to avoid crossing the origin
        const workVectors = [new Vector2(workPoints[0].yaw, workPoints[0].pitch)];

        let k = 0;
        for (let i = 1; i <= 3; i++) {
            const d = workPoints[i - 1].yaw - workPoints[i].yaw;
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
            workVectors.push(new Vector2(workPoints[i].yaw + k * 2 * Math.PI, workPoints[i].pitch));
        }

        this.state.curve = new SplineCurve(workVectors);
        this.state.start = keypoints[k1];
        this.state.end = keypoints[k2];

        // debugCurve(this.markers, this.autorotate.curve.getPoints(16 * 3).map(p => ([p.x, p.y])), 16);
    }
}
