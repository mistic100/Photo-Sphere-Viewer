import { MathUtils } from 'three';
import { Dynamic, MultiDynamic } from '../utils';
import type { Viewer } from '../Viewer';
import { PositionUpdatedEvent, RollUpdatedEvent, ZoomUpdatedEvent } from '../events';
import { AbstractService } from './AbstractService';

export class ViewerDynamics extends AbstractService {
    readonly zoom = new Dynamic(
        (zoomLevel) => {
            this.viewer.state.vFov = this.viewer.dataHelper.zoomLevelToFov(zoomLevel);
            this.viewer.state.hFov = this.viewer.dataHelper.vFovToHFov(this.viewer.state.vFov);
            this.viewer.dispatchEvent(new ZoomUpdatedEvent(zoomLevel));
        },
        {
            defaultValue: this.viewer.config.defaultZoomLvl,
            min: 0,
            max: 100,
            wrap: false,
        }
    );

    readonly position = new MultiDynamic(
        (position) => {
            this.viewer.dataHelper.sphericalCoordsToVector3(position, this.viewer.state.direction);
            this.viewer.dispatchEvent(new PositionUpdatedEvent(position));
        },
        {
            yaw: new Dynamic(null, {
                defaultValue: this.config.defaultYaw,
                min: 0,
                max: 2 * Math.PI,
                wrap: true,
            }),
            pitch: new Dynamic(null, {
                defaultValue: this.config.defaultPitch,
                min: -Math.PI / 2,
                max: Math.PI / 2,
                wrap: false,
            }),
        }
    );

    readonly roll = new Dynamic(
        (roll) => {
            this.viewer.state.roll = roll;
            this.viewer.dispatchEvent(new RollUpdatedEvent(roll));
        },
        {
            defaultValue: 0,
            min: - Math.PI,
            max: Math.PI,
            wrap: false,
        }
    );

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer);
        this.updateSpeeds();
    }

    /**
     * @internal
     */
    updateSpeeds() {
        this.zoom.setSpeed(this.config.zoomSpeed * 50);
        this.position.setSpeed(MathUtils.degToRad(this.config.moveSpeed * 50));
        this.roll.setSpeed(MathUtils.degToRad(this.config.moveSpeed * 50));
    }

    /**
     * @internal
     */
    update(elapsed: number) {
        this.zoom.update(elapsed);
        this.position.update(elapsed);
        this.roll.update(elapsed);
    }
}
