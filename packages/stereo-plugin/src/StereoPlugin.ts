import type { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractPlugin, events, PSVError, utils } from '@photo-sphere-viewer/core';
import type { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect.js';
import { StereoPluginEvents, StereoUpdatedEvent } from './events';
import mobileRotateIcon from './icons/mobile-rotate.svg';
import { cancelWaitLandscape, getOrientation, waitLandscape } from './utils';

const ID_OVERLAY_PLEASE_ROTATE = 'pleaseRotate';

/**
 * Adds stereo view on mobile devices
 */
export class StereoPlugin extends AbstractPlugin<StereoPluginEvents> {
    static override readonly id = 'stereo';
    static override readonly VERSION = PKG_VERSION;

    private readonly state = {
        enabled: false,
        wakeLock: null as WakeLockSentinel,
        waitLandscape: null as any,
    };

    private gyroscope: GyroscopePlugin;
    private markers: MarkersPlugin;
    private compass: CompassPlugin;

    /**
     * @internal
     */
    get isSupported(): Promise<boolean> {
        return this.gyroscope.isSupported();
    }

    constructor(viewer: Viewer) {
        super(viewer);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.markers = this.viewer.getPlugin('markers');
        this.compass = this.viewer.getPlugin('compass');
        this.gyroscope = this.viewer.getPlugin('gyroscope');

        if (!this.gyroscope) {
            throw new PSVError('Stereo plugin requires the Gyroscope plugin');
        }

        this.viewer.addEventListener(events.StopAllEvent.type, this);
        this.viewer.addEventListener(events.ClickEvent.type, this);
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.StopAllEvent.type, this);
        this.viewer.removeEventListener(events.ClickEvent.type, this);

        this.stop();

        delete this.markers;
        delete this.compass;
        delete this.gyroscope;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.StopAllEvent || e instanceof events.ClickEvent) {
            this.stop();
        }
    }

    /**
     * Checks if the stereo view is enabled
     */
    isEnabled(): boolean {
        return this.state.enabled;
    }

    /**
     * Enables the stereo view
     *
     *  - enables wake lock
     *  - enables full screen
     *  - starts gyroscope controle
     *  - hides markers, navbar and panel
     *  - instanciate the stereo effect
     */
    start(): Promise<void> {
        // Need to be in the main event queue
        this.viewer.enterFullscreen();
        this.__startWakelock();
        this.__lockOrientation();

        return this.gyroscope.start('fast').then(
            () => {
                this.viewer.renderer.setCustomRenderer((renderer) => new StereoEffect(renderer));
                this.state.enabled = true;

                this.markers?.hideAllMarkers();
                this.compass?.hide();
                this.viewer.navbar.hide();
                this.viewer.panel.hide();

                this.dispatchEvent(new StereoUpdatedEvent(true));

                this.viewer.notification.show({
                    content: this.viewer.config.lang.stereoNotification,
                    timeout: 3000,
                });
            },
            () => {
                this.__unlockOrientation();
                this.__stopWakelock();
                this.viewer.exitFullscreen();
                return Promise.reject();
            }
        );
    }

    /**
     * Disables the stereo view
     */
    stop() {
        if (this.isEnabled()) {
            this.viewer.renderer.setCustomRenderer(null);
            this.state.enabled = false;

            this.markers?.showAllMarkers();
            this.compass?.show();
            this.viewer.navbar.show();

            this.__unlockOrientation();
            this.__stopWakelock();
            this.viewer.exitFullscreen();
            this.gyroscope.stop();

            this.dispatchEvent(new StereoUpdatedEvent(false));
        }
    }

    /**
     * Enables or disables the stereo view
     */
    toggle() {
        if (this.isEnabled()) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Enables WakeLock
     */
    private __startWakelock() {
        if ('wakeLock' in navigator) {
            navigator.wakeLock
                .request('screen')
                .then((wakeLock: WakeLockSentinel) => {
                    this.state.wakeLock = wakeLock;
                })
                .catch(() => utils.logWarn('Cannot acquire WakeLock'));
        } else {
            utils.logWarn('WakeLock is not available');
        }
    }

    /**
     * Disables WakeLock
     */
    private __stopWakelock() {
        if (this.state.wakeLock) {
            this.state.wakeLock.release();
            this.state.wakeLock = null;
        }
    }

    /**
     * Tries to lock the device in landscape or display a message
     */
    private __lockOrientation() {
        let displayRotateMessageTimeout: ReturnType<typeof setTimeout>;

        const displayRotateMessage = () => {
            if (getOrientation() !== 'landscape' && !this.viewer.overlay.isVisible(ID_OVERLAY_PLEASE_ROTATE)) {
                this.viewer.overlay.show({
                    id: ID_OVERLAY_PLEASE_ROTATE,
                    image: mobileRotateIcon,
                    title: this.viewer.config.lang.pleaseRotate,
                    text: this.viewer.config.lang.tapToContinue,
                });

                this.state.waitLandscape = waitLandscape(() => {
                    this.viewer.overlay.hide(ID_OVERLAY_PLEASE_ROTATE);
                    cancelWaitLandscape(this.state.waitLandscape);
                    this.state.waitLandscape = null;
                });
            }

            if (displayRotateMessageTimeout) {
                clearTimeout(displayRotateMessageTimeout);
                displayRotateMessageTimeout = null;
            }
        };

        try {
            (screen.orientation as any).lock('landscape').then(null, () => displayRotateMessage());
            displayRotateMessageTimeout = setTimeout(() => displayRotateMessage(), 1000);
        } catch {
            displayRotateMessage();
        }
    }

    /**
     * Unlock the device orientation
     */
    private __unlockOrientation() {
        this.viewer.overlay.hide(ID_OVERLAY_PLEASE_ROTATE);

        if (this.state.waitLandscape) {
            cancelWaitLandscape(this.state.waitLandscape);
            this.state.waitLandscape = null;
        }

        try {
            screen.orientation?.unlock();
        } catch {
            // empty
        }
    }
}
