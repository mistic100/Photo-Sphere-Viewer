import { Object3D } from 'three';

export class DeviceOrientationControls {
    object: Object3D;
    deviceOrientation: any;
    screenOrientation: number;
    alphaOffset: number;

    constructor(object: Object3D);

    connect();

    disconnect();

    update();
}
