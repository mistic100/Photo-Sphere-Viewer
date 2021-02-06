/**
 * @summary Transforms a string to dash-case {@link https://github.com/shahata/dasherize}
 */

export function dasherize(str: string): string;

/**
 * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
 */
export function throttle(func: Function, wait: number): Function;

/**
 * @summary Test if an object is a plain object
 * @description Test if an object is a plain object, i.e. is constructed
 * by the built-in Object constructor and inherits directly from Object.prototype
 * or null. Some built-in objects pass the test, e.g. Math which is a plain object
 * and some host or exotic objects may pass also.
 * {@link http://stackoverflow.com/a/5878101/1207670}
 */
export function isPlainObject(obj: any): boolean;

/**
 * @summary Merges the enumerable attributes of two objects
 * @description Replaces arrays and alters the target object.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>
 */
export function deepmerge(target: object, src: object): object;

/**
 * @summary Deeply clones an object
 */
export function clone(src: object): object;

/**
 * @summery Test of an object is empty
 */
export function isEmpty(obj: object): boolean;

/**
 * @summary Loops over enumerable properties of an object
 */
export function each(object: object, callback: (value: any, key: string) => void);

/**
 * @summary Returns the intersection between two arrays
 */
export function intersect<T>(array1: T[], array2: T[]): T[];

/**
 * @summary Returns if a valu is null or undefined
 */
export function isNil(val: any): val is null | undefined;

/**
 * @summary Returns the first non null non undefined parameter
 */
export function firstNonNull(...values: any[]): any;
