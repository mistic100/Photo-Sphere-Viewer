import { Position, utils } from '@photo-sphere-viewer/core';
import { MathUtils } from 'three';
import { GpsPosition } from './model';

/**
 * Returns the difference between two WS84 GPS points as yaw+pitch on the viewer
 */
export function gpsToSpherical(gps1: GpsPosition, gps2: GpsPosition): Position {
    const p1 = gpsDegToRad(gps1);
    const p2 = gpsDegToRad(gps2);
    const h1 = gps1[2] ?? 0;
    const h2 = gps2[2] ?? 0;

    let pitch = 0;
    if (h1 !== h2) {
        pitch = Math.atan((h2 - h1) / distance(p1, p2));
    }

    const yaw = bearing(p1, p2);

    return { yaw, pitch };
}

function gpsDegToRad(gps: GpsPosition): [number, number] {
    return [MathUtils.degToRad(gps[0]), MathUtils.degToRad(gps[1])];
}

/**
 * Returns the distance between two GPS points
 */
function distance(p1: [number, number], p2: [number, number]): number {
    return utils.greatArcDistance(p1, p2) * 6371e3;
}

/**
 * Returns the bearing between two GPS points
 * @link http://www.movable-type.co.uk/scripts/latlong.html
 */
function bearing(p1: [number, number], p2: [number, number]): number {
    const [long1, lat1] = p1;
    const [long2, lat2] = p2;

    const y = Math.sin(long2 - long1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(long2 - long1);
    return Math.atan2(y, x);
}
