/**
 * Transforms a string to dash-case
 * @see https://github.com/shahata/dasherize
 */
export function dasherize(str: string): string {
    return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, (s, i) => {
        return (i > 0 ? '-' : '') + s.toLowerCase();
    });
}

/**
 * Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
 */
export function throttle<T extends (...args: any) => any>(callback: T, wait: number): (...args: Parameters<T>) => void {
    let paused = false;
    return function (this: any, ...args: Parameters<T>) {
        if (!paused) {
            paused = true;
            setTimeout(() => {
                callback.apply(this, args);
                paused = false;
            }, wait);
        }
    };
}

/**
 * Test if an object is a plain object
 * Test if an object is a plain object, i.e. is constructed by the built-in
 * Object constructor and inherits directly from Object.prototype or null.
 * @see https://github.com/lodash/lodash/blob/master/isPlainObject.js
 */
export function isPlainObject<T extends Record<string, any>>(value: any): value is T {
    if (typeof value !== 'object' || value === null || Object.prototype.toString.call(value) !== '[object Object]') {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}

/**
 * Merges the enumerable attributes of two objects
 * Replaces arrays and alters the target object.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>
 */
export function deepmerge<T>(target: T, src: T): T {
    const first = src;

    // eslint-disable-next-line @typescript-eslint/no-shadow
    return (function merge(target: any, src: any) {
        if (Array.isArray(src)) {
            if (!target || !Array.isArray(target)) {
                target = [];
            } else {
                target.length = 0;
            }
            src.forEach((e, i) => {
                target[i] = merge(null, e);
            });
        } else if (typeof src === 'object') {
            if (!target || Array.isArray(target)) {
                target = {};
            }
            Object.keys(src).forEach((key) => {
                if (typeof src[key] !== 'object' || !src[key] || !isPlainObject(src[key])) {
                    target[key] = src[key];
                } else if (src[key] !== first) {
                    if (!target[key]) {
                        target[key] = merge(null, src[key]);
                    } else {
                        merge(target[key], src[key]);
                    }
                }
            });
        } else {
            target = src;
        }

        return target;
    })(target, src);
}

/**
 * Deeply clones an object
 */
export function clone<T>(src: T): T {
    return deepmerge(null as T, src);
}

/**
 * Tests of an object is empty
 */
export function isEmpty(obj: any): boolean {
    return !obj || (Object.keys(obj).length === 0 && obj.constructor === Object);
}

/**
 * Returns if a valu is null or undefined
 */
export function isNil(val: any): val is null | undefined {
    return val === null || val === undefined;
}

/**
 * Returns the first non null non undefined parameter
 */
export function firstNonNull<T>(...values: T[]): T | null {
    for (const val of values) {
        if (!isNil(val)) {
            return val;
        }
    }

    return null;
}

/**
 * Returns deep equality between objects
 * @see https://gist.github.com/egardner/efd34f270cc33db67c0246e837689cb9
 */
export function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
        return true;
    } else if (isObject(obj1) && isObject(obj2)) {
        if (Object.keys(obj1).length !== Object.keys(obj2).length) {
            return false;
        }
        for (const prop of Object.keys(obj1)) {
            if (!deepEqual(obj1[prop], obj2[prop])) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function isObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null;
}
