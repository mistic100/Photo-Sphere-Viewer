import { Position, utils } from '@photo-sphere-viewer/core';
import { Mesh, BufferGeometry, MeshBasicMaterial, MathUtils, HexColorString } from 'three';
import { GpsPosition } from './model';

/**
 * Changes the color of a mesh
 */
export function setMeshColor(mesh: Mesh<BufferGeometry, MeshBasicMaterial>, color: HexColorString) {
    mesh.material.color.set(color);
}

/**
 * Returns the distance between two GPS points
 */
export function distance(p1: [number, number], p2: [number, number]): number {
    return utils.greatArcDistance(p1, p2) * 6371e3;
}

/**
 * Returns the bearing between two GPS points
 * @link http://www.movable-type.co.uk/scripts/latlong.html
 */
export function bearing(p1: [number, number], p2: [number, number]): number {
    const [long1, lat1] = p1;
    const [long2, lat2] = p2;

    const y = Math.sin(long2 - long1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(long2 - long1);
    return Math.atan2(y, x);
}

/**
 * Returns the difference between two WS84 GPS points as yaw+pitch on the viewer
 */
export function gpsToSpherical(gps1: GpsPosition, gps2: GpsPosition): Position {
    const p1: [number, number] = [MathUtils.degToRad(gps1[0]), MathUtils.degToRad(gps1[1])];
    const p2: [number, number] = [MathUtils.degToRad(gps2[0]), MathUtils.degToRad(gps2[1])];
    const h1 = gps1[2] ?? 0;
    const h2 = gps2[2] ?? 0;

    let pitch = 0;
    if (h1 !== h2) {
        pitch = Math.atan((h2 - h1) / distance(p1, p2));
    }

    const yaw = bearing(p1, p2);

    return { yaw, pitch };
}
