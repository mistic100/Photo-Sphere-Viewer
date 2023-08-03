import { Euler, LinearFilter, LinearMipmapLinearFilter, MathUtils, Quaternion, Texture, Vector3 } from 'three';
import { PSVError } from '../PSVError';
import { ExtendedPosition, Point, ResolvableBoolean } from '../model';
import { wrap } from './math';
import { clone, isPlainObject } from './misc';

/**
 * Executes a callback with the value of a ResolvableBoolean
 */
export function resolveBoolean(value: boolean | ResolvableBoolean, cb: (val: boolean, init: boolean) => void) {
    if (isPlainObject(value)) {
        cb((value as ResolvableBoolean).initial, true);
        (value as ResolvableBoolean).promise.then((res) => cb(res, false));
    } else {
        cb(value as boolean, true);
    }
}

/**
 * Inverts the result of a ResolvableBoolean
 */
export function invertResolvableBoolean(value: ResolvableBoolean): ResolvableBoolean {
    return {
        initial: !value.initial,
        promise: value.promise.then((res) => !res),
    };
}

/**
 * Builds an Error with name 'AbortError'
 */
export function getAbortError(): Error {
    const error = new Error('Loading was aborted.');
    error.name = 'AbortError';
    return error;
}

/**
 * Tests if an Error has name 'AbortError'
 */
export function isAbortError(err: Error): boolean {
    return err?.name === 'AbortError';
}

/**
 * Displays a warning in the console with "PhotoSphereViewer" prefix
 */
export function logWarn(message: string) {
    console.warn(`PhotoSphereViewer: ${message}`);
}

/**
 * Checks if an object is a ExtendedPosition, ie has textureX/textureY or yaw/pitch
 */
export function isExtendedPosition(object: any): object is ExtendedPosition {
    if (!object) {
        return false;
    }
    return [
        ['textureX', 'textureY'],
        ['yaw', 'pitch'],
    ].some(([key1, key2]) => {
        return object[key1] !== undefined && object[key2] !== undefined;
    });
}

/**
 * Returns the value of a given attribute in the panorama metadata
 */
export function getXMPValue(data: string, attr: string): number | null {
    // XMP data are stored in children
    let result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>');
    if (result !== null) {
        const val = parseInt(result[1], 10);
        return isNaN(val) ? null : val;
    }

    // XMP data are stored in attributes
    result = data.match('GPano:' + attr + '="(.*?)"');
    if (result !== null) {
        const val = parseInt(result[1], 10);
        return isNaN(val) ? null : val;
    }

    return null;
}

const CSS_POSITIONS: Record<string, string> = {
    top: '0%',
    bottom: '100%',
    left: '0%',
    right: '100%',
    center: '50%',
};
const X_VALUES = ['left', 'center', 'right'];
const Y_VALUES = ['top', 'center', 'bottom'];
const POS_VALUES = [...X_VALUES, ...Y_VALUES];
const CENTER = 'center';

/**
 * Translate CSS values like "top center" or "10% 50%" as top and left positions (0-1 range)
 * @description The implementation is as close as possible to the "background-position" specification
 * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
 */
export function parsePoint(value: string | Point): Point {
    if (!value) {
        return { x: 0.5, y: 0.5 };
    }

    if (typeof value === 'object') {
        return value;
    }

    let tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

    if (tokens.length === 1) {
        if (CSS_POSITIONS[tokens[0]]) {
            tokens = [tokens[0], CENTER];
        } else {
            tokens = [tokens[0], tokens[0]];
        }
    }

    const xFirst = tokens[1] !== 'left' && tokens[1] !== 'right' && tokens[0] !== 'top' && tokens[0] !== 'bottom';

    tokens = tokens.map((token) => CSS_POSITIONS[token] || token);

    if (!xFirst) {
        tokens.reverse();
    }

    const parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

    if (parsed) {
        return {
            x: parseFloat(parsed[1]) / 100,
            y: parseFloat(parsed[2]) / 100,
        };
    } else {
        return { x: 0.5, y: 0.5 };
    }
}

/**
 * Parse a CSS-like position into an array of position keywords among top, bottom, left, right and center
 * @param value
 * @param [options]
 * @param [options.allowCenter=true] allow "center center"
 * @param [options.cssOrder=true] force CSS order (y axis then x axis)
 */
export function cleanCssPosition(
    value: string | string[],
    { allowCenter, cssOrder } = {
        allowCenter: true,
        cssOrder: true,
    }
): [string, string] | null {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        value = value.split(' ');
    }

    if (value.length === 1) {
        if (value[0] === CENTER) {
            value = [CENTER, CENTER];
        } else if (X_VALUES.indexOf(value[0]) !== -1) {
            value = [CENTER, value[0]];
        } else if (Y_VALUES.indexOf(value[0]) !== -1) {
            value = [value[0], CENTER];
        }
    }

    if (value.length !== 2 || POS_VALUES.indexOf(value[0]) === -1 || POS_VALUES.indexOf(value[1]) === -1) {
        logWarn(`Unparsable position ${value}`);
        return null;
    }

    if (!allowCenter && value[0] === CENTER && value[1] === CENTER) {
        logWarn(`Invalid position center center`);
        return null;
    }

    if (cssOrder && !cssPositionIsOrdered(value)) {
        value = [value[1], value[0]];
    }
    if (value[1] === CENTER && X_VALUES.indexOf(value[0]) !== -1) {
        value = [CENTER, value[0]];
    }
    if (value[0] === CENTER && Y_VALUES.indexOf(value[1]) !== -1) {
        value = [value[1], CENTER];
    }

    return value as [string, string];
}

/**
 * Checks if an array of two positions is ordered (y axis then x axis)
 */
export function cssPositionIsOrdered(value: string[]): boolean {
    return Y_VALUES.indexOf(value[0]) !== -1 && X_VALUES.indexOf(value[1]) !== -1;
}

/**
 * @summary Parses an speed
 * @param speed in radians/degrees/revolutions per second/minute
 * @throws {@link PSVError} when the speed cannot be parsed
 */
export function parseSpeed(speed: string | number): number {
    let parsed;

    if (typeof speed === 'string') {
        const speedStr = speed.toString().trim();

        // Speed extraction
        let speedValue = parseFloat(speedStr.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
        const speedUnit = speedStr.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

        // "per minute" -> "per second"
        if (speedUnit.match(/(pm|per minute)$/)) {
            speedValue /= 60;
        }

        // Which unit?
        switch (speedUnit) {
            // Degrees per minute / second
            case 'dpm':
            case 'degrees per minute':
            case 'dps':
            case 'degrees per second':
                parsed = MathUtils.degToRad(speedValue);
                break;

            // Radians per minute / second
            case 'rdpm':
            case 'radians per minute':
            case 'rdps':
            case 'radians per second':
                parsed = speedValue;
                break;

            // Revolutions per minute / second
            case 'rpm':
            case 'revolutions per minute':
            case 'rps':
            case 'revolutions per second':
                parsed = speedValue * Math.PI * 2;
                break;

            // Unknown unit
            default:
                throw new PSVError(`Unknown speed unit "${speedUnit}"`);
        }
    } else {
        parsed = speed;
    }

    return parsed;
}

/**
 * Parses an angle value in radians or degrees and returns a normalized value in radians
 * @param angle - eg: 3.14, 3.14rad, 180deg
 * @param [zeroCenter=false] - normalize between -Pi - Pi instead of 0 - 2*Pi
 * @param [halfCircle=zeroCenter] - normalize between -Pi/2 - Pi/2 instead of -Pi - Pi
 * @throws {@link PSVError} when the angle cannot be parsed
 */
export function parseAngle(angle: string | number, zeroCenter = false, halfCircle = zeroCenter): number {
    let parsed;

    if (typeof angle === 'string') {
        const match = angle
            .toLowerCase()
            .trim()
            .match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

        if (!match) {
            throw new PSVError(`Unknown angle "${angle}"`);
        }

        const value = parseFloat(match[1]);
        const unit = match[2];

        if (unit) {
            switch (unit) {
                case 'deg':
                case 'degs':
                    parsed = MathUtils.degToRad(value);
                    break;
                case 'rad':
                case 'rads':
                    parsed = value;
                    break;
                default:
                    throw new PSVError(`Unknown angle unit "${unit}"`);
            }
        } else {
            parsed = value;
        }
    } else if (typeof angle === 'number' && !isNaN(angle)) {
        parsed = angle;
    } else {
        throw new PSVError(`Unknown angle "${angle}"`);
    }

    parsed = wrap(zeroCenter ? parsed + Math.PI : parsed, Math.PI * 2);

    return zeroCenter
        ? MathUtils.clamp(parsed - Math.PI, -Math.PI / (halfCircle ? 2 : 1), Math.PI / (halfCircle ? 2 : 1))
        : parsed;
}

/**
 * Creates a THREE texture from an image
 */
export function createTexture(img: HTMLImageElement | HTMLCanvasElement, mimaps = false): Texture {
    const texture = new Texture(img);
    texture.needsUpdate = true;
    texture.minFilter = mimaps ? LinearMipmapLinearFilter : LinearFilter;
    texture.generateMipmaps = mimaps;
    texture.anisotropy = mimaps ? 2 : 1;
    return texture;
}

const quaternion = new Quaternion();

/**
 * Applies the inverse of Euler angles to a vector
 */
export function applyEulerInverse(vector: Vector3, euler: Euler) {
    quaternion.setFromEuler(euler).invert();
    vector.applyQuaternion(quaternion);
}

/**
 * Declaration of configuration parsers, used by {@link getConfigParser}
 */
export type ConfigParsers<T, U extends T = T> = {
    [key in keyof T]: (val: T[key], opts: { defValue: U[key]; rawConfig: T }) => U[key];
};

/**
 * Result of {@link getConfigParser}
 */
export type ConfigParser<T, U extends T> = {
    (config: T): U;
    defaults: Required<U>;
    parsers: ConfigParsers<T, U>;
};

/**
 * Creates a function to validate an user configuration object
 *
 * @template T type of input config
 * @template U type of config after parsing
 *
 * @param defaults the default configuration
 * @param parsers function used to parse/validate the configuration
 *
 * @example
 * ```ts
 * type MyConfig = {
 *      value: number;
 *      label?: string;
 * };
 *
 * const getConfig<MyConfig>({
 *      value: 1,
 *      label: 'Title',
 * }, {
 *      value(value, { defValue }) {
 *          return value < 10 ? value : defValue;
 *      }
 * });
 *
 * const config = getConfig({ value: 3 });
 * ```
 */
export function getConfigParser<T extends Record<string, any>, U extends T = T>(
    defaults: Required<U>,
    parsers?: ConfigParsers<T, U>
): ConfigParser<T, U> {
    const parser = function (userConfig: T): U {
        if (!userConfig) {
            return clone(defaults);
        }

        const rawConfig: U = clone({
            ...defaults,
            ...userConfig,
        });

        const config: U = {} as U;

        for (let [key, value] of Object.entries(rawConfig) as Array<[keyof T, any]>) {
            if (parsers && key in parsers) {
                value = parsers[key](value, {
                    rawConfig: rawConfig,
                    defValue: defaults[key],
                });
            } else if (!(key in defaults)) {
                logWarn(`Unknown option ${key as string}`);
                continue;
            }

            // @ts-ignore
            config[key] = value;
        }

        return config;
    } as ConfigParser<T, U>;

    parser.defaults = defaults;
    parser.parsers = parsers || ({} as any);

    return parser;
}
