import { Euler, Texture, Vector3 } from 'three';
import { ExtendedPosition, Point } from '../models';

/**
 * @summary Displays a warning in the console
 */
export function logWarn(message: string);

/**
 * @summary Checks if an object is a {PSV.ExtendedPosition}, ie has x/y or longitude/latitude
 */
export function isExtendedPosition(object: any): object is ExtendedPosition;

/**
 * @summary Returns the value of a given attribute in the panorama metadata
 */
export function getXMPValue(data: string, attr: string): number | null;

/**
 * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @description The implementation is as close as possible to the "background-position" specification
 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
 */
export function parsePosition(value: string | Point): Point;

/**
 * @summary Parse a CSS-like position into an array of position keywords among top, bottom, left, right and center
 */
export function cleanPosition(value: string | string[], options?: { allowCenter: boolean, cssOrder: boolean }): string[];

/**
 * @summary Parses an speed
 * @param speed - The speed, in radians/degrees/revolutions per second/minute
 * @returns radians per second
 * @throws {PSVError} when the speed cannot be parsed
 */
export function parseSpeed(speed: string | number): number;

/**
 * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
 * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
 * @param {boolean} [zeroCenter=false] - normalize between -Pi - Pi instead of 0 - 2*Pi
 * @param {boolean} [halfCircle=zeroCenter] - normalize between -Pi/2 - Pi/2 instead of -Pi - Pi
 * @throws {PSVError} when the angle cannot be parsed
 */
export function parseAngle(angle: string | number, zeroCenter?: boolean, halfCircle?: boolean): number;

/**
 * @summary Creates a THREE texture from an image
 */
export function createTexture(img: HTMLImageElement | HTMLCanvasElement): Texture;

/**
 * @summary Applies the inverse of Euler angles to a vector
 */
export function applyEulerInverse(vector: Vector3, euler: Euler);
