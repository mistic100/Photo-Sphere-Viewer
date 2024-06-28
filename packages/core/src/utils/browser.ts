import { Point } from '../model';
import { angle, distance } from './math';

/**
 * Get an element in the page by an unknown selector
 */
export function getElement(selector: string | HTMLElement): HTMLElement {
    if (typeof selector === 'string') {
        return selector.match(/^[a-z]/i) ? document.getElementById(selector) : document.querySelector(selector);
    } else {
        return selector;
    }
}

/**
 * Toggles a CSS class
 */
export function toggleClass(element: Element, className: string, active?: boolean) {
    if (active === undefined) {
        element.classList.toggle(className);
    } else if (active) {
        element.classList.add(className);
    } else if (!active) {
        element.classList.remove(className);
    }
}

/**
 * Adds one or several CSS classes to an element
 */
export function addClasses(element: Element, className: string) {
    element.classList.add(...className.split(' ').filter(c => !!c));
}

/**
 * Removes one or several CSS classes to an element
 */
export function removeClasses(element: Element, className: string) {
    element.classList.remove(...className.split(' ').filter(c => !!c));
}

/**
 * Searches if an element has a particular parent at any level including itself
 */
export function hasParent(el: HTMLElement, parent: Element): boolean {
    let test: HTMLElement | null = el;

    do {
        if (test === parent) {
            return true;
        }
        test = test.parentElement;
    } while (test);

    return false;
}

/**
 * Gets the closest parent (can by itself)
 */
export function getClosest(el: HTMLElement, selector: string): HTMLElement | null {
    // When el is document or window, the matches does not exist
    if (!el?.matches) {
        return null;
    }

    let test: HTMLElement | null = el;

    do {
        if (test.matches(selector)) {
            return test;
        }
        test = test.parentElement;
    } while (test);

    return null;
}

/**
 * Gets the position of an element in the viewer without reflow
 * Will gives the same result as getBoundingClientRect() as soon as there are no CSS transforms
 */
export function getPosition(el: HTMLElement): Point {
    let x = 0;
    let y = 0;
    let test: HTMLElement | null = el;

    while (test) {
        x += test.offsetLeft - test.scrollLeft + test.clientLeft;
        y += test.offsetTop - test.scrollTop + test.clientTop;
        test = test.offsetParent as HTMLElement;
    }

    return { x, y };
}

/**
 * Gets an element style value
 */
export function getStyleProperty(elt: Element, varname: string): string {
    return window.getComputedStyle(elt).getPropertyValue(varname);
}

export type TouchData = {
    distance: number;
    angle: number;
    center: Point;
};

/**
 * Returns data about a touch event (first 2 fingers) : distance, angle, center
 */
export function getTouchData(e: TouchEvent): TouchData {
    if (e.touches.length < 2) {
        return null;
    }

    const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

    return {
        distance: distance(p1, p2),
        angle: angle(p1, p2),
        center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    };
}

let fullscreenElement: HTMLElement;

/**
 * Detects if fullscreen is enabled
 */
export function isFullscreenEnabled(elt: HTMLElement, isIphone = false): boolean {
    if (isIphone) {
        return elt === fullscreenElement;
    } else {
        return document.fullscreenElement === elt;
    }
}

/**
 * Enters fullscreen mode
 */
export function requestFullscreen(elt: HTMLElement, isIphone = false) {
    if (isIphone) {
        fullscreenElement = elt;
        elt.classList.add('psv-fullscreen-emulation');
        document.dispatchEvent(new Event('fullscreenchange'));
    } else {
        elt.requestFullscreen();
    }
}

/**
 * Exits fullscreen mode
 */
export function exitFullscreen(isIphone = false) {
    if (isIphone) {
        fullscreenElement.classList.remove('psv-fullscreen-emulation');
        fullscreenElement = null;
        document.dispatchEvent(new Event('fullscreenchange'));
    } else {
        document.exitFullscreen();
    }
}
