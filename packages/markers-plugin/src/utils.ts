import { CONSTANTS, utils } from '@photo-sphere-viewer/core';

/**
 * Returns intermediary point between two points on the sphere
 * {@link http://www.movable-type.co.uk/scripts/latlong.html}
 * @internal
 */
export function greatArcIntermediaryPoint(p1: [number, number], p2: [number, number], f: number): [number, number] {
    const [λ1, φ1] = p1;
    const [λ2, φ2] = p2;

    const r = utils.greatArcDistance(p1, p2);
    const a = Math.sin((1 - f) * r) / Math.sin(r);
    const b = Math.sin(f * r) / Math.sin(r);
    const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    const z = a * Math.sin(φ1) + b * Math.sin(φ2);

    return [Math.atan2(y, x), Math.atan2(z, Math.sqrt(x * x + y * y))];
}

/**
 * Given a list of spherical points, offsets yaws in order to have only coutinuous values
 * eg: [0.2, 6.08] is transformed to [0.2, -0.2]
 */
function getPolygonCoherentPoints(points: Array<[number, number]>) {
    const workPoints = [points[0]];

    let k = 0;
    for (let i = 1; i < points.length; i++) {
        const d = points[i - 1][0] - points[i][0];
        if (d > Math.PI) {
            // crossed the origin left to right
            k += 1;
        } else if (d < -Math.PI) {
            // crossed the origin right to left
            k -= 1;
        }
        workPoints.push([points[i][0] + k * 2 * Math.PI, points[i][1]]);
    }

    return workPoints;
}

/**
 * Computes the center point of a polygon
 * @todo Get "visual center" (https://blog.mapbox.com/a-new-algorithm-for-finding-a-visual-center-of-a-polygon-7c77e6492fbc)
 * @internal
 */
export function getPolygonCenter(polygon: Array<[number, number]>): [number, number] {
    const points = getPolygonCoherentPoints(polygon);

    const sum = points.reduce((intermediary, point) => [intermediary[0] + point[0], intermediary[1] + point[1]]);
    return [utils.parseAngle(sum[0] / polygon.length), sum[1] / polygon.length];
}

/**
 * Computes the middle point of a polyline
 * @internal
 */
export function getPolylineCenter(polyline: Array<[number, number]>): [number, number] {
    const points = getPolygonCoherentPoints(polyline);

    // compute each segment length + total length
    let length = 0;
    const lengths = [];

    for (let i = 0; i < points.length - 1; i++) {
        const l = utils.greatArcDistance(points[i], points[i + 1]) * CONSTANTS.SPHERE_RADIUS;

        lengths.push(l);
        length += l;
    }

    // iterate until length / 2
    let consumed = 0;

    for (let j = 0; j < points.length - 1; j++) {
        // once the segment containing the middle point is found, computes the intermediary point
        if (consumed + lengths[j] > length / 2) {
            const r = (length / 2 - consumed) / lengths[j];
            return greatArcIntermediaryPoint(points[j], points[j + 1], r);
        }

        consumed += lengths[j];
    }

    // this never happens
    return points[Math.round(points.length / 2)];
}
