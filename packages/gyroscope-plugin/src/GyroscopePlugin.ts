import type { Position, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, events, utils } from '@photo-sphere-viewer/core';
import { Object3D, Vector3 } from 'three';
import { DeviceOrientationControls } from './DeviceOrientationControls';
import { GyroscopePluginEvents, GyroscopeUpdatedEvent } from './events';
import { GyroscopePluginConfig, UpdatableGyroscopePluginConfig } from './model.js';

const getConfig = utils.getConfigParser<GyroscopePluginConfig>(
    {
        touchmove: true,
        roll: true,
        absolutePosition: false,
        moveMode: 'smooth',
    },
    {
        moveMode(moveMode, { defValue }) {
            if (moveMode !== 'smooth' && moveMode !== 'fast') {
                utils.logWarn(`GyroscopePlugin: invalid moveMode`);
                return defValue;
            } else {
                return moveMode;
            }
        },
    }
);

const direction = new Vector3();

/**
 * Adds gyroscope controls on mobile devices
 */
export class GyroscopePlugin extends AbstractConfigurablePlugin<
    GyroscopePluginConfig,
    GyroscopePluginConfig,
    UpdatableGyroscopePluginConfig,
    GyroscopePluginEvents
> {
    static override readonly id = 'gyroscope';
    static override readonly VERSION = PKG_VERSION;
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof GyroscopePluginConfig> = ['absolutePosition'];

    private readonly state = {
        isSupported: this.__checkSupport(),
        alphaOffset: 0,
        enabled: false,
        config_moveInertia: true,
        moveMode: this.config.moveMode,
    };

    private controls: DeviceOrientationControls;

    constructor(viewer: Viewer, config: GyroscopePluginConfig) {
        super(viewer, config);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.viewer.addEventListener(events.StopAllEvent.type, this);
        this.viewer.addEventListener(events.BeforeRotateEvent.type, this);
        this.viewer.addEventListener(events.BeforeRenderEvent.type, this);
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.StopAllEvent.type, this);
        this.viewer.removeEventListener(events.BeforeRotateEvent.type, this);
        this.viewer.removeEventListener(events.BeforeRenderEvent.type, this);

        this.stop();

        this.controls?.disconnect();
        delete this.controls;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof events.StopAllEvent) {
            this.stop();
        } else if (e instanceof events.BeforeRenderEvent) {
            this.__onBeforeRender();
        } else if (e instanceof events.BeforeRotateEvent) {
            this.__onBeforeRotate(e as events.BeforeRotateEvent);
        }
    }

    /**
     * Checks if the gyroscope is supported
     */
    isSupported(): Promise<boolean> {
        return this.state.isSupported;
    }

    /**
     * Checks if the gyroscope is enabled
     */
    isEnabled(): boolean {
        return this.state.enabled;
    }

    /**
     * Enables the gyroscope navigation if available
     */
    start(moveMode = this.config.moveMode): Promise<void> {
        return this.state.isSupported
            .then((supported) => {
                if (supported) {
                    return this.__requestPermission();
                } else {
                    utils.logWarn('gyroscope not available');
                    return Promise.reject();
                }
            })
            .then((granted) => {
                if (granted) {
                    return Promise.resolve();
                } else {
                    utils.logWarn('gyroscope not allowed');
                    return Promise.reject();
                }
            })
            .then(() => {
                this.viewer.stopAll();

                this.state.moveMode = moveMode;

                // disable inertia
                this.state.config_moveInertia = this.viewer.config.moveInertia;
                this.viewer.config.moveInertia = false;

                // enable gyro controls
                if (!this.controls) {
                    this.controls = new DeviceOrientationControls(new Object3D(), this.config.absolutePosition);
                }

                // reset
                this.controls.alphaOffset = 0;

                this.state.alphaOffset = this.config.absolutePosition ? 0 : null;
                this.state.enabled = true;

                this.dispatchEvent(new GyroscopeUpdatedEvent(true));
            });
    }

    /**
     * Disables the gyroscope navigation
     */
    stop() {
        if (this.isEnabled()) {
            this.state.enabled = false;
            this.viewer.config.moveInertia = this.state.config_moveInertia;

            if (this.config.roll) {
                this.viewer.dynamics.roll.goto(0, 30);
            }

            this.dispatchEvent(new GyroscopeUpdatedEvent(false));

            this.viewer.resetIdleTimer();
        }
    }

    /**
     * Enables or disables the gyroscope navigation
     */
    toggle() {
        if (this.isEnabled()) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Handles gyro movements
     */
    private __onBeforeRender() {
        if (!this.isEnabled()) {
            return;
        }

        if (!this.controls.deviceOrientation) {
            return;
        }

        const position = this.viewer.getPosition();

        // on first run compute the offset depending on the current viewer position and device orientation
        if (this.state.alphaOffset === null) {
            if (this.controls.update()) {
                this.controls.object.getWorldDirection(direction);

                const sphericalCoords = this.viewer.dataHelper.vector3ToSphericalCoords(direction);
                this.state.alphaOffset = sphericalCoords.yaw - position.yaw;
            }
        } else {
            this.controls.alphaOffset = this.state.alphaOffset;
            if (this.controls.update()) {
                this.controls.object.getWorldDirection(direction);

                const sphericalCoords = this.viewer.dataHelper.vector3ToSphericalCoords(direction);

                const target: Position = {
                    yaw: sphericalCoords.yaw,
                    pitch: -sphericalCoords.pitch,
                };

                // having a slow speed on smalls movements allows to absorb the device/hand vibrations
                const step = this.state.moveMode === 'smooth' ? 3 : 10;
                this.viewer.dynamics.position.goto(target, utils.getAngle(position, target) < 0.01 ? 1 : step);

                if (this.config.roll) {
                    this.viewer.dynamics.roll.goto(-this.controls.object.rotation.z, this.state.moveMode === 'smooth' ? 10 : 30);
                }
            }
        }
    }

    /**
     * Intercepts moves and offsets the alpha angle
     */
    private __onBeforeRotate(e: events.BeforeRotateEvent) {
        if (this.isEnabled()) {
            e.preventDefault();

            if (this.config.touchmove) {
                this.state.alphaOffset -= e.position.yaw - this.viewer.getPosition().pitch;
            }
        }
    }

    /**
     * Detects if device orientation is supported
     */
    private __checkSupport(): Promise<boolean> {
        if (
            'DeviceOrientationEvent' in window
            && typeof (DeviceOrientationEvent as any).requestPermission === 'function'
        ) {
            return Promise.resolve(true);
        } else if ('DeviceOrientationEvent' in window) {
            return new Promise((resolve) => {
                const listener = (e: DeviceOrientationEvent) => {
                    resolve(!!e && !utils.isNil(e.alpha) && !isNaN(e.alpha));

                    window.removeEventListener('deviceorientation', listener);
                };

                window.addEventListener('deviceorientation', listener, false);
                setTimeout(listener, 10000);
            });
        } else {
            return Promise.resolve(false);
        }
    }

    /**
     * Request permission to the motion API
     */
    private __requestPermission(): Promise<boolean> {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            return (DeviceOrientationEvent as any)
                .requestPermission()
                .then((response: string) => response === 'granted')
                .catch(() => false);
        } else {
            return Promise.resolve(true);
        }
    }
}
