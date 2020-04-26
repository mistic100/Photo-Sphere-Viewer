import { CONSTANTS, utils } from 'photo-sphere-viewer';

/**
 * Returns intermediary point between two points on the sphere
 * {@link http://www.movable-type.co.uk/scripts/latlong.html}
 * @param {number[]} p1
 * @param {number[]} p2
 * @param {number} f
 * @returns {number[]}
 * @private
 */
export function greatArcIntermediaryPoint(p1, p2, f) {
  const [λ1, φ1] = p1;
  const [λ2, φ2] = p2;

  const r = utils.greatArcDistance(p1, p2) * CONSTANTS.SPHERE_RADIUS;
  const a = Math.sin((1 - f) * r) / Math.sin(r / CONSTANTS.SPHERE_RADIUS);
  const b = Math.sin(f * r) / Math.sin(r);
  const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
  const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
  const z = a * Math.sin(φ1) + b * Math.sin(φ2);

  return [
    Math.atan2(y, x),
    Math.atan2(z, Math.sqrt(x * x + y * y)),
  ];
}

/**
 * @summary Computes the center point of a polygon
 * @todo Get "visual center" (https://blog.mapbox.com/a-new-algorithm-for-finding-a-visual-center-of-a-polygon-7c77e6492fbc)
 * @param {number[][]} polygon
 * @returns {number[]}
 * @private
 */
export function getPolygonCenter(polygon) {
  const sum = polygon.reduce((intermediary, point) => [intermediary[0] + point[0], intermediary[1] + point[1]]);
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

/**
 * @summary Computes the middle point of a polyline
 * @param {number[][]} polyline
 * @returns {number[]}
 * @private
 */
export function getPolylineCenter(polyline) {
  // compute each segment length + total length
  let length = 0;
  const lengths = [];

  for (let i = 0; i < polyline.length - 1; i++) {
    const l = utils.greatArcDistance(polyline[i], polyline[i + 1]) * CONSTANTS.SPHERE_RADIUS;

    lengths.push(l);
    length += l;
  }

  // iterate until length / 2
  let consumed = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    // once the segment containing the middle point is found, computes the intermediary point
    if (consumed + lengths[i] > length / 2) {
      const r = (length / 2 - consumed) / lengths[i];
      return greatArcIntermediaryPoint(polyline[i], polyline[i + 1], r);
    }

    consumed += lengths[i];
  }

  // this never happens
  return polyline[Math.round(polyline.length / 2)];
}
