/**
 * @summary Ensures that a number is in a given interval
 * @memberOf PSV.utils
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function bound(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

/**
 * @summary Checks if a value is an integer
 * @memberOf PSV.utils
 * @param {*} value
 * @returns {boolean}
 */
export function isInteger(value) {
  if (Number.isInteger) {
    return Number.isInteger(value);
  }
  return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value;
}


/**
 * @summary Computes the sum of an array
 * @memberOf PSV.utils
 * @param {number[]} array
 * @returns {number}
 */
export function sum(array) {
  return array.reduce((a, b) => a + b, 0);
}

/**
 * @summary Computes the distance between two points
 * @memberOf PSV.utils
 * @param {PSV.Point} p1
 * @param {PSV.Point} p2
 * @returns {number}
 */
export function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * @summary Compute the shortest offset between two longitudes
 * @memberOf PSV.utils
 * @param {number} from
 * @param {number} to
 * @returns {number}
 */
export function getShortestArc(from, to) {
  const tCandidates = [
    0, // direct
    Math.PI * 2, // clock-wise cross zero
    -Math.PI * 2, // counter-clock-wise cross zero
  ];

  return tCandidates.reduce((value, candidate) => {
    const newCandidate = to - from + candidate;
    return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
  }, Infinity);
}

/**
 * @summary Computes the angle between the current position and a target position
 * @memberOf PSV.utils
 * @param {PSV.Position} position1
 * @param {PSV.Position} position2
 * @returns {number}
 */
export function getAngle(position1, position2) {
  return Math.acos(
    Math.cos(position1.latitude)
    * Math.cos(position2.latitude)
    * Math.cos(position1.longitude - position2.longitude)
    + Math.sin(position1.latitude)
    * Math.sin(position2.latitude)
  );
}

/**
 * Returns the distance between two points on a sphere of radius one
 * @memberOf PSV.utils
 * @param {number[]} p1
 * @param {number[]} p2
 * @returns {number}
 */
export function greatArcDistance(p1, p2) {
  const [λ1, φ1] = p1;
  const [λ2, φ2] = p2;

  const x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
  const y = (φ2 - φ1);
  return Math.sqrt(x * x + y * y);
}
