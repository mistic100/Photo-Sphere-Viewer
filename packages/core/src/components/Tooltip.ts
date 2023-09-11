import { PSVError } from '../PSVError';
import { addClasses, cleanCssPosition, getStyle, cssPositionIsOrdered } from '../utils';
import type { Viewer } from '../Viewer';
import { HideTooltipEvent, ShowTooltipEvent } from '../events';
import { AbstractComponent } from './AbstractComponent';

/**
 * Object defining the tooltip position
 */
export type TooltipPosition = {
    /**
     * Position of the tip of the arrow of the tooltip, in pixels
     */
    top: number;
    /**
     * Position of the tip of the arrow of the tooltip, in pixels
     */
    left: number;
    /**
     * Tooltip position toward it's arrow tip.
     * Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.
     */
    position?: string | [string, string];
    /**
     * @internal
     */
    box?: { width: number; height: number };
};

/**
 * Configuration for {@link Viewer.createTooltip}
 */
export type TooltipConfig = TooltipPosition & {
    /**
     * HTML content of the tooltip
     */
    content: string;
    /**
     * Additional CSS class added to the tooltip
     */
    className?: string;
    /**
     * CSS properties added to the tooltip
     */
    style?: Record<string, string>;
    /**
     * Userdata associated to the tooltip
     */
    data?: any;
};

type TooltipStyle = {
    posClass: [string, string];
    width: number;
    height: number;
    top: number;
    left: number;
    arrowTop: number;
    arrowLeft: number;
};

const enum TooltipState {
    NONE,
    SHOWING,
    HIDING,
    READY,
}

/**
 * Tooltip component
 * @description Never instanciate tooltips directly use {@link Viewer#createTooltip} instead
 */
export class Tooltip extends AbstractComponent {
    /**
     * @internal
     */
    protected override readonly state = {
        visible: true,
        arrow: 0,
        border: 0,
        state: TooltipState.NONE,
        width: 0,
        height: 0,
        pos: '',
        config: null as TooltipPosition,
        data: null as any,
    };

    private readonly content: HTMLElement;
    private readonly arrow: HTMLElement;

    /**
     * @internal
     */
    constructor(viewer: Viewer, config: TooltipConfig) {
        super(viewer, {
            className: 'psv-tooltip',
        });

        this.content = document.createElement('div');
        this.content.className = 'psv-tooltip-content';
        this.container.appendChild(this.content);

        this.arrow = document.createElement('div');
        this.arrow.className = 'psv-tooltip-arrow';
        this.container.appendChild(this.arrow);

        this.container.addEventListener('transitionend', this);

        // allows to interact with static tooltips
        this.container.addEventListener('touchdown', (e) => e.stopPropagation());
        this.container.addEventListener('mousedown', (e) => e.stopPropagation());

        this.container.style.top = '-1000px';
        this.container.style.left = '-1000px';

        this.show(config);
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e.type === 'transitionend') {
            this.__onTransitionEnd(e as TransitionEvent);
        }
    }

    /**
     * @internal
     */
    override destroy() {
        delete this.state.data;
        super.destroy();
    }

    /**
     * @throws {@link PSVError} always
     * @internal
     */
    override toggle() {
        throw new PSVError('Tooltip cannot be toggled');
    }

    /**
     * Displays the tooltip on the viewer
     * @internal
     */
    override show(config: TooltipConfig) {
        if (this.state.state !== TooltipState.NONE) {
            throw new PSVError('Initialized tooltip cannot be re-initialized');
        }

        if (config.className) {
            addClasses(this.container, config.className);
        }
        if (config.style) {
            Object.assign(this.container.style, config.style);
        }

        this.state.state = TooltipState.READY;

        this.update(config.content, config);

        this.state.data = config.data;
        this.state.state = TooltipState.SHOWING;

        this.viewer.dispatchEvent(new ShowTooltipEvent(this, this.state.data));

        this.__waitImages();
    }

    /**
     * Updates the content of the tooltip, optionally with a new position
     * @throws {@link PSVError} if the configuration is invalid
     */
    update(content: string, config?: TooltipPosition) {
        this.content.innerHTML = content;

        const rect = this.container.getBoundingClientRect();
        this.state.width = rect.right - rect.left;
        this.state.height = rect.bottom - rect.top;
        this.state.arrow = parseInt(getStyle(this.arrow, 'borderTopWidth'), 10);
        this.state.border = parseInt(getStyle(this.container, 'borderTopLeftRadius'), 10);

        this.move(config ?? this.state.config);
    }

    /**
     * Moves the tooltip to a new position
     * @throws {@link PSVError} if the configuration is invalid
     */
    move(config: TooltipPosition) {
        if (this.state.state !== TooltipState.SHOWING && this.state.state !== TooltipState.READY) {
            throw new PSVError('Uninitialized tooltip cannot be moved');
        }

        config.box = config.box ?? this.state.config?.box ?? { width: 0, height: 0 };
        this.state.config = config;

        const t = this.container;
        const a = this.arrow;

        // compute size
        const style: TooltipStyle = {
            posClass: cleanCssPosition(config.position, { allowCenter: false, cssOrder: false }) || ['top', 'center'],
            width: this.state.width,
            height: this.state.height,
            top: 0,
            left: 0,
            arrowTop: 0,
            arrowLeft: 0,
        };

        // set initial position
        this.__computeTooltipPosition(style, config);

        // correct position if overflow
        let swapY = null;
        let swapX = null;
        if (style.top < 0) {
            swapY = 'bottom';
        } else if (style.top + style.height > this.viewer.state.size.height) {
            swapY = 'top';
        }
        if (style.left < 0) {
            swapX = 'right';
        } else if (style.left + style.width > this.viewer.state.size.width) {
            swapX = 'left';
        }
        if (swapX || swapY) {
            const ordered = cssPositionIsOrdered(style.posClass);
            if (swapY) {
                style.posClass[ordered ? 0 : 1] = swapY;
            }
            if (swapX) {
                style.posClass[ordered ? 1 : 0] = swapX;
            }
            this.__computeTooltipPosition(style, config);
        }

        // apply position
        t.style.top = style.top + 'px';
        t.style.left = style.left + 'px';

        a.style.top = style.arrowTop + 'px';
        a.style.left = style.arrowLeft + 'px';

        const newPos = style.posClass.join('-');
        if (newPos !== this.state.pos) {
            t.classList.remove(`psv-tooltip--${this.state.pos}`);

            this.state.pos = newPos;
            t.classList.add(`psv-tooltip--${this.state.pos}`);
        }
    }

    /**
     * Hides the tooltip
     */
    override hide() {
        this.container.classList.remove('psv-tooltip--visible');
        this.state.state = TooltipState.HIDING;

        this.viewer.dispatchEvent(new HideTooltipEvent(this.state.data));
    }

    /**
     * Finalize transition
     */
    private __onTransitionEnd(e: TransitionEvent) {
        if (e.propertyName === 'transform') {
            switch (this.state.state) {
                case TooltipState.SHOWING:
                    this.container.classList.add('psv-tooltip--visible');
                    this.state.state = TooltipState.READY;
                    break;

                case TooltipState.HIDING:
                    this.state.state = TooltipState.NONE;
                    this.destroy();
                    break;

                default:
                // nothing
            }
        }
    }

    /**
     * Computes the position of the tooltip and its arrow
     */
    private __computeTooltipPosition(style: TooltipStyle, config: TooltipPosition) {
        const arrow = this.state.arrow;
        const top = config.top;
        const height = style.height;
        const left = config.left;
        const width = style.width;
        const offsetSide = arrow + this.state.border;
        const offsetX = config.box.width / 2 + arrow * 2;
        const offsetY = config.box.height / 2 + arrow * 2;

        switch (style.posClass.join('-')) {
            case 'top-left':
                style.top = top - offsetY - height;
                style.left = left + offsetSide - width;
                style.arrowTop = height;
                style.arrowLeft = width - offsetSide - arrow;
                break;
            case 'top-center':
                style.top = top - offsetY - height;
                style.left = left - width / 2;
                style.arrowTop = height;
                style.arrowLeft = width / 2 - arrow;
                break;
            case 'top-right':
                style.top = top - offsetY - height;
                style.left = left - offsetSide;
                style.arrowTop = height;
                style.arrowLeft = arrow;
                break;
            case 'bottom-left':
                style.top = top + offsetY;
                style.left = left + offsetSide - width;
                style.arrowTop = -arrow * 2;
                style.arrowLeft = width - offsetSide - arrow;
                break;
            case 'bottom-center':
                style.top = top + offsetY;
                style.left = left - width / 2;
                style.arrowTop = -arrow * 2;
                style.arrowLeft = width / 2 - arrow;
                break;
            case 'bottom-right':
                style.top = top + offsetY;
                style.left = left - offsetSide;
                style.arrowTop = -arrow * 2;
                style.arrowLeft = arrow;
                break;
            case 'left-top':
                style.top = top + offsetSide - height;
                style.left = left - offsetX - width;
                style.arrowTop = height - offsetSide - arrow;
                style.arrowLeft = width;
                break;
            case 'center-left':
                style.top = top - height / 2;
                style.left = left - offsetX - width;
                style.arrowTop = height / 2 - arrow;
                style.arrowLeft = width;
                break;
            case 'left-bottom':
                style.top = top - offsetSide;
                style.left = left - offsetX - width;
                style.arrowTop = arrow;
                style.arrowLeft = width;
                break;
            case 'right-top':
                style.top = top + offsetSide - height;
                style.left = left + offsetX;
                style.arrowTop = height - offsetSide - arrow;
                style.arrowLeft = -arrow * 2;
                break;
            case 'center-right':
                style.top = top - height / 2;
                style.left = left + offsetX;
                style.arrowTop = height / 2 - arrow;
                style.arrowLeft = -arrow * 2;
                break;
            case 'right-bottom':
                style.top = top - offsetSide;
                style.left = left + offsetX;
                style.arrowTop = arrow;
                style.arrowLeft = -arrow * 2;
                break;

            // no default
        }
    }

    /**
     * If the tooltip contains images, recompute its size once they are loaded
     */
    private __waitImages() {
        const images = this.content.querySelectorAll('img');

        if (images.length > 0) {
            const promises: Array<Promise<any>> = [];

            images.forEach((image) => {
                promises.push(
                    new Promise((resolve) => {
                        image.onload = resolve;
                        image.onerror = resolve;
                    })
                );
            });

            Promise.all(promises).then(() => {
                if (this.state.state === TooltipState.SHOWING || this.state.state === TooltipState.READY) {
                    const rect = this.container.getBoundingClientRect();
                    this.state.width = rect.right - rect.left;
                    this.state.height = rect.bottom - rect.top;
                    this.move(this.state.config);
                }
            });
        }
    }
}
