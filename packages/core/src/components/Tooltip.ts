import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { HideTooltipEvent, ShowTooltipEvent } from '../events';
import { Point } from '../model';
import { addClasses, cleanCssPosition, cssPositionIsOrdered, getStyleProperty, hasParent, logWarn } from '../utils';
import { AbstractComponent } from './AbstractComponent';

/**
 * Object defining the tooltip position
 */
export type TooltipPosition = Point & {
    /**
     * @deprecated use `y` instead
     */
    top?: number;
    /**
     * @deprecated use `x` instead
     */
    left?: number;
    /**
     * Tooltip position toward it's arrow tip.
     * Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.
     */
    position?: string | [string, string];
    /**
     * @internal
     */
    offset?: { x: number; y: number };
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
 * Never instanciate tooltips directly use {@link Viewer#createTooltip} instead
 */
export class Tooltip extends AbstractComponent {
    /**
     * @internal
     */
    protected override readonly state = {
        visible: true,
        arrowSize: 0,
        borderRadius: 0,
        state: TooltipState.NONE,
        width: 0,
        height: 0,
        pos: '',
        config: null as TooltipPosition,
        data: null as any,
        hideTimeout: null as ReturnType<typeof setTimeout>,
    };

    /**
     * @internal
     */
    constructor(viewer: Viewer, config: TooltipConfig) {
        super(viewer, {
            className: 'psv-tooltip',
        });

        this.container.addEventListener('transitionend', this);

        // allows to interact with static tooltips
        this.container.addEventListener('touchdown', e => e.stopPropagation());
        this.container.addEventListener('mousedown', e => e.stopPropagation());

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
        clearTimeout(this.state.hideTimeout);
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
        this.container.innerHTML = content;

        const rect = this.container.getBoundingClientRect();
        this.state.width = rect.right - rect.left;
        this.state.height = rect.bottom - rect.top;
        this.state.arrowSize = parseInt(getStyleProperty(this.container, '--psv-tooltip-arrow-size'), 10);
        this.state.borderRadius = parseInt(getStyleProperty(this.container, 'border-top-left-radius'), 10);

        this.move(config ?? this.state.config);
        this.__waitImages();
    }

    /**
     * Moves the tooltip to a new position
     * @throws {@link PSVError} if the configuration is invalid
     */
    move(config: TooltipPosition) {
        if (this.state.state !== TooltipState.SHOWING && this.state.state !== TooltipState.READY) {
            throw new PSVError('Uninitialized tooltip cannot be moved');
        }

        this.state.config = config;

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
        this.container.style.top = style.top + 'px';
        this.container.style.left = style.left + 'px';
        this.container.style.setProperty('--psv-tooltip-arrow-top', style.arrowTop + 'px');
        this.container.style.setProperty('--psv-tooltip-arrow-left', style.arrowLeft + 'px');

        const newPos = style.posClass.join('-');
        if (newPos !== this.state.pos) {
            this.container.classList.remove(`psv-tooltip--${this.state.pos}`);

            this.state.pos = newPos;
            this.container.classList.add(`psv-tooltip--${this.state.pos}`);
        }
    }

    /**
     * Hides the tooltip
     */
    override hide() {
        this.container.classList.remove('psv-tooltip--visible');
        this.state.state = TooltipState.HIDING;

        this.viewer.dispatchEvent(new HideTooltipEvent(this.state.data));

        // watchdog in case the "transitionend" event is not received
        const duration = parseFloat(getStyleProperty(this.container, 'transition-duration'));
        this.state.hideTimeout = setTimeout(() => {
            this.destroy();
        }, duration * 2000);
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
        if (config.left || config.top) {
            logWarn('left/top properties are deprecated for tooltips, use x/y instead');
        }

        const arrowSize = this.state.arrowSize;
        const borderRadius = this.state.borderRadius;
        const x = config.x ?? config.left;
        const y = config.y ?? config.top;
        const width = style.width;
        const height = style.height;
        const offsetX = (config.offset?.x ?? 0);
        const offsetY = (config.offset?.y ?? 0);

        switch (style.posClass.join('-')) {
            case 'top-left':
                style.top = y - arrowSize - height - offsetY;
                style.left = x + arrowSize + borderRadius - width;
                style.arrowTop = height;
                style.arrowLeft = width - arrowSize * 2 - borderRadius;
                break;
            case 'top-center':
                style.top = y - arrowSize - height - offsetY;
                style.left = x - width / 2;
                style.arrowTop = height;
                style.arrowLeft = width / 2 - arrowSize;
                break;
            case 'top-right':
                style.top = y - arrowSize - height - offsetY;
                style.left = x - arrowSize - borderRadius;
                style.arrowTop = height;
                style.arrowLeft = borderRadius;
                break;
            case 'bottom-left':
                style.top = y + arrowSize + offsetY;
                style.left = x + arrowSize + borderRadius - width;
                style.arrowTop = -arrowSize * 2;
                style.arrowLeft = width - arrowSize * 2 - borderRadius;
                break;
            case 'bottom-center':
                style.top = y + arrowSize + offsetY;
                style.left = x - width / 2;
                style.arrowTop = -arrowSize * 2;
                style.arrowLeft = width / 2 - arrowSize;
                break;
            case 'bottom-right':
                style.top = y + arrowSize + offsetY;
                style.left = x - arrowSize - borderRadius;
                style.arrowTop = -arrowSize * 2;
                style.arrowLeft = borderRadius;
                break;
            case 'left-top':
                style.top = y + arrowSize + borderRadius - height;
                style.left = x - arrowSize - width - offsetX;
                style.arrowTop = height - arrowSize * 2 - borderRadius;
                style.arrowLeft = width;
                break;
            case 'center-left':
                style.top = y - height / 2;
                style.left = x - arrowSize - width - offsetX;
                style.arrowTop = height / 2 - arrowSize;
                style.arrowLeft = width;
                break;
            case 'left-bottom':
                style.top = y - arrowSize - borderRadius;
                style.left = x - arrowSize - width - offsetX;
                style.arrowTop = borderRadius;
                style.arrowLeft = width;
                break;
            case 'right-top':
                style.top = y + arrowSize + borderRadius - height;
                style.left = x + arrowSize + offsetX;
                style.arrowTop = height - arrowSize * 2 - borderRadius;
                style.arrowLeft = -arrowSize * 2;
                break;
            case 'center-right':
                style.top = y - height / 2;
                style.left = x + arrowSize + offsetX;
                style.arrowTop = height / 2 - arrowSize;
                style.arrowLeft = -arrowSize * 2;
                break;
            case 'right-bottom':
                style.top = y - arrowSize - borderRadius;
                style.left = x + arrowSize + offsetX;
                style.arrowTop = borderRadius;
                style.arrowLeft = -arrowSize * 2;
                break;
            // no default
        }
    }

    /**
     * If the tooltip contains images, recompute its size once they are loaded
     */
    private __waitImages() {
        const images = this.container.querySelectorAll('img') as NodeListOf<HTMLImageElement>;

        if (images.length > 0) {
            const promises: Array<Promise<any>> = [];

            images.forEach((image) => {
                if (!image.complete) {
                    promises.push(
                        new Promise((resolve) => {
                            image.onload = resolve;
                            image.onerror = resolve;
                        }),
                    );
                }
            });

            if (promises.length) {
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
}

/**
 * Helper to display a tooltip on mouseover for an element
 */
export class AttachedTooltip {
    private tooltip: Tooltip;

    private enabled = true;

    /**
     * @internal
     */
    constructor(
        private viewer: Viewer,
        private config: Omit<TooltipConfig, 'x' | 'y' | 'offset'>,
        private element: HTMLElement,
    ) {
        element.addEventListener('mouseenter', this);
        element.addEventListener('mouseleave', this);
    }

    /**
     * @internal
     */
    handleEvent(e: MouseEvent) {
        switch (e.type) {
            case 'mouseenter':
                this.__onMouseEnter();
                break;

            case 'mouseleave':
                this.__onMouseLeave(e);
                break;
        }
    }

    /**
     * Unattaches the tooltip
     */
    destroy() {
        this.element.removeEventListener('mouseenter', this);
        this.element.removeEventListener('mouseleave', this);
        this.tooltip?.destroy();

        delete this.element;
        delete this.tooltip;
    }

    /**
     * Updates the tooltip content
     */
    update(content: string) {
        this.tooltip?.update(content);
        this.config.content = content;
    }

    /**
     * Temporarily disables the tooltip
     */
    disable() {
        this.tooltip?.hide();
        this.tooltip = null;

        this.enabled = false;
    }

    /**
     * Re-enable the tooltip
     */
    enable() {
        this.enabled = true;
    }

    private __onMouseEnter() {
        // do not recreate the tooltip
        if (this.tooltip || !this.enabled) {
            return;
        }

        const box = this.element.getBoundingClientRect();
        this.tooltip = this.viewer.createTooltip({
            ...this.config,
            x: box.x + box.width / 2,
            y: box.y + box.height / 2,
            offset: {
                x: box.width / 2,
                y: box.height / 2,
            },
        });

        // hide the tooltip when the cursor leaves the tooltip
        // only if no going to the src element
        this.tooltip.container.addEventListener('mouseleave', (e: MouseEvent) => {
            if (this.tooltip && !hasParent(e.relatedTarget as HTMLElement, this.element)) {
                this.tooltip.hide();
                this.tooltip = null;
            }
        });
    }

    private __onMouseLeave(e: MouseEvent) {
        // hide the tooltip when the cursor leaves the src element
        // only if no going to the tooltip
        if (this.tooltip && !hasParent(e.relatedTarget as HTMLElement, this.tooltip.container)) {
            this.tooltip.hide();
            this.tooltip = null;
        }
    }
}
