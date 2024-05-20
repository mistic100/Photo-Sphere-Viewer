import { ResolvableBoolean } from '../model';
import { PSVError } from '../PSVError';
import { VIEWER_DATA } from './constants';

const LOCALSTORAGE_TOUCH_SUPPORT = `${VIEWER_DATA}_touchSupport`;

/**
 * General information about the system
 */
export const SYSTEM = {
    /**
     * Indicates if the system data has been loaded
     */
    loaded: false,

    /**
     * Device screen pixel ratio
     */
    pixelRatio: 1,

    /**
     * Device supports WebGL
     */
    isWebGLSupported: false,

    /**
     * Maximum WebGL texture width
     */
    maxTextureWidth: 0,

    /**
     * Device supports touch events
     */
    isTouchEnabled: null as ResolvableBoolean,

    /**
     * @internal
     */
    __maxCanvasWidth: null as number | null,

    /**
     * If the current device is an iPhone
     */
    isIphone: false,

    /**
     * Maximum canvas width
     */
    get maxCanvasWidth(): number {
        if (this.__maxCanvasWidth === null) {
            this.__maxCanvasWidth = getMaxCanvasWidth(this.maxTextureWidth);
        }
        return this.__maxCanvasWidth;
    },

    /**
     * Loads the system if not already loaded
     * @internal
     */
    load() {
        if (!this.loaded) {
            const ctx = getWebGLCtx();

            this.pixelRatio = window.devicePixelRatio || 1;
            this.isWebGLSupported = !!ctx;
            this.maxTextureWidth = ctx ? ctx.getParameter(ctx.MAX_TEXTURE_SIZE) : 0;
            this.isTouchEnabled = isTouchEnabled();
            this.isIphone = /iPhone/i.test(navigator.userAgent);
            this.loaded = true;
        }

        if (!SYSTEM.isWebGLSupported) {
            throw new PSVError('WebGL 2 is not supported.');
        }
        if (SYSTEM.maxTextureWidth === 0) {
            throw new PSVError('Unable to detect system capabilities');
        }
    },
};

/**
 * Tries to return a canvas webgl context
 */
function getWebGLCtx(): WebGLRenderingContext | null {
    try {
        const canvas = document.createElement('canvas');
        return canvas.getContext('webgl2');
    } catch (e) {
        return null;
    }
}

/**
 * Detects if the user is using a touch screen
 */
function isTouchEnabled(): ResolvableBoolean {
    let initial = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (LOCALSTORAGE_TOUCH_SUPPORT in localStorage) {
        initial = localStorage[LOCALSTORAGE_TOUCH_SUPPORT] === 'true';
    }

    const promise = new Promise<boolean>((resolve) => {
        const clear = () => {
            window.removeEventListener('mousedown', listenerMouse);
            window.removeEventListener('touchstart', listenerTouch);
            clearTimeout(listenerTimeoutId);
        };

        const listenerMouse = () => {
            clear();
            localStorage[LOCALSTORAGE_TOUCH_SUPPORT] = false;
            resolve(false);
        };

        const listenerTouch = () => {
            clear();
            localStorage[LOCALSTORAGE_TOUCH_SUPPORT] = true;
            resolve(true);
        };

        const listenerTimeout = () => {
            clear();
            localStorage[LOCALSTORAGE_TOUCH_SUPPORT] = initial;
            resolve(initial);
        };

        window.addEventListener('mousedown', listenerMouse, false);
        window.addEventListener('touchstart', listenerTouch, false);
        const listenerTimeoutId = setTimeout(listenerTimeout, 10000);
    });

    return { initial, promise };
}

/**
 * Gets max canvas width supported by the browser.
 * We only test powers of 2 and height = width / 2 because that's what we need to generate WebGL textures
 */
function getMaxCanvasWidth(maxWidth: number): number {
    let width = maxWidth;
    let pass = false;

    while (width > 1024 && !pass) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = width / 2;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 1, 1);

        try {
            if (ctx.getImageData(0, 0, 1, 1).data[0] > 0) {
                pass = true;
            }
        } catch (e) {
            // continue
        }

        // Release canvas elements (Safari memory usage fix)
        // https://stackoverflow.com/questions/52532614/total-canvas-memory-use-exceeds-the-maximum-limit-safari-12
        canvas.width = 0;
        canvas.height = 0;

        if (!pass) {
            width /= 2;
        }
    }

    if (pass) {
        return width;
    } else {
        throw new PSVError('Unable to detect system capabilities');
    }
}
