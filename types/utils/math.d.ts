import { Point, Position } from '../models';

/**
 * @summary Ensures that a number is in a given interval
 */
export function bound(x: number, min: number, max: number): number;

/**
 * @summary Checks if a value is an integer
 */
export function isInteger(value: any): boolean;

/**
 * @summary Computes the sum of an array
 */
export function sum(array: number[]): number;

/**
 * @summary Computes the distance between two points
 */
export function distance(p1: Point, p2: Point): number;

/**
 * @summary Compute the shortest offset between two longitudes
 */
export function getShortestArc(from: number, to: number): number;

/**
 * @summary Computes the angle between the current position and a target position
 */
export function getAngle(position1: Position, position2: Position): number;

/**
 * @summary Returns the distance between two points on a sphere of radius one
 */
export function greatArcDistance(p1: number[], p2: number[]): number;
