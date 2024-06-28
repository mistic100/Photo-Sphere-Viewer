import { Point, Position } from '../model';

/**
 * Ensures a value is within 0 and `max` by wrapping max to 0
 */
export function wrap(value: number, max: number): number {
    let result = value % max;

    if (result < 0) {
        result += max;
    }

    return result;
}

/**
 * Computes the sum of an array
 */
export function sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
}

/**
 * Computes the distance between two points
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Computes the angle between two points
 */
export function angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Compute the shortest offset between two angles on a sphere
 */
export function getShortestArc(from: number, to: number): number {
    const candidates = [
        0, // direct
        Math.PI * 2, // clock-wise cross zero
        -Math.PI * 2, // counter-clock-wise cross zero
    ];

    return candidates.reduce((value, candidate) => {
        const newCandidate = to - from + candidate;
        return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
    }, Infinity);
}

/**
 * Computes the angle between the current position and a target position
 */
export function getAngle(position1: Position, position2: Position): number {
    // prettier-ignore
    return Math.acos(
        Math.cos(position1.pitch)
        * Math.cos(position2.pitch) 
        * Math.cos(position1.yaw - position2.yaw) 
        + Math.sin(position1.pitch) 
        * Math.sin(position2.pitch)
    );
}

/**
 * Returns the distance between two points on a sphere of radius one
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 */
export function greatArcDistance([yaw1, pitch1]: [number, number], [yaw2, pitch2]: [number, number]): number {
    // if yaw delta is > PI, apply an offset to only consider the shortest arc
    if (yaw1 - yaw2 > Math.PI) {
        yaw1 -= 2 * Math.PI;
    } else if (yaw1 - yaw2 < -Math.PI) {
        yaw1 += 2 * Math.PI;
    }
    const x = (yaw2 - yaw1) * Math.cos((pitch1 + pitch2) / 2);
    const y = pitch2 - pitch1;
    return Math.sqrt(x * x + y * y);
}
