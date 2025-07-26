import { CAPTURE_EVENTS_CLASS, ICONS, KEY_CODES } from '../data/constants';
import { PSVError } from '../PSVError';
import { getEventTarget, toggleClass } from '../utils';
import type { Viewer } from '../Viewer';
import { HidePanelEvent, KeypressEvent, ShowPanelEvent } from '../events';
import { AbstractComponent } from './AbstractComponent';

const PANEL_MIN_WIDTH = 200;

const PANEL_CLASS_NO_INTERACTION = 'psv-panel-content--no-interaction';

/**
 * Configuration for {@link Panel.show}
 */
export type PanelConfig = {
    /**
     * unique identifier to use with {@link Panel.hide} and {@link Panel.isVisible} and to store the width
     */
    id?: string;
    /**
     * HTML content of the panel
     */
    content: string;
    /**
     * remove the default margins
     * @default false
     */
    noMargin?: boolean;
    /**
     * initial width
     */
    width?: string;
    /**
     * called when the user clicks inside the panel or presses the Enter key while an element focused
     */
    clickHandler?: (target: HTMLElement) => void;
};

/**
 * Panel component
 */
export class Panel extends AbstractComponent {
    /**
     * @internal
     */
    protected override readonly state = {
        visible: false,
        contentId: null as string,
        mouseX: 0,
        mouseY: 0,
        mousedown: false,
        clickHandler: null as (e: MouseEvent) => void,
        keyHandler: null as (e: KeyboardEvent) => void,
        width: {} as Record<string, string>,
    };

    private readonly content: HTMLElement;

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer, {
            className: `psv-panel ${CAPTURE_EVENTS_CLASS}`,
        });

        const resizer = document.createElement('div');
        resizer.className = 'psv-panel-resizer';
        this.container.appendChild(resizer);

        const closeBtn = document.createElement('div');
        closeBtn.className = 'psv-panel-close-button';
        closeBtn.innerHTML = ICONS.close;
        closeBtn.title = viewer.config.lang.close;
        this.container.appendChild(closeBtn);

        this.content = document.createElement('div');
        this.content.className = 'psv-panel-content';
        this.container.appendChild(this.content);

        closeBtn.addEventListener('click', () => this.hide());

        // Event for panel resizing
        resizer.addEventListener('mousedown', this);
        resizer.addEventListener('touchstart', this);
        this.viewer.container.addEventListener('mouseup', this);
        this.viewer.container.addEventListener('touchend', this);
        this.viewer.container.addEventListener('mousemove', this);
        this.viewer.container.addEventListener('touchmove', this);

        this.viewer.addEventListener(KeypressEvent.type, this);
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(KeypressEvent.type, this);

        this.viewer.container.removeEventListener('mousemove', this);
        this.viewer.container.removeEventListener('touchmove', this);
        this.viewer.container.removeEventListener('mouseup', this);
        this.viewer.container.removeEventListener('touchend', this);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case 'mousedown': this.__onMouseDown(e as MouseEvent); break;
            case 'touchstart': this.__onTouchStart(e as TouchEvent); break;
            case 'mousemove': this.__onMouseMove(e as MouseEvent); break;
            case 'touchmove': this.__onTouchMove(e as TouchEvent); break;
            case 'mouseup': this.__onMouseUp(e as MouseEvent); break;
            case 'touchend': this.__onTouchEnd(e as TouchEvent); break;
            case KeypressEvent.type: this.__onKeyPress(e as KeypressEvent); break;
        }
    }

    /**
     * Checks if the panel is visible
     */
    override isVisible(id?: string) {
        return this.state.visible && (!id || !this.state.contentId || this.state.contentId === id);
    }

    /**
     * @throws {@link PSVError} always
     * @internal
     */
    override toggle() {
        throw new PSVError('Panel cannot be toggled');
    }

    /**
     * Shows the panel
     */
    override show(config: string | PanelConfig) {
        if (typeof config === 'string') {
            config = { content: config };
        }
        const wasVisible = this.isVisible(config.id);

        this.state.contentId = config.id || null;
        this.state.visible = true;

        if (this.state.clickHandler) {
            this.content.removeEventListener('click', this.state.clickHandler);
            this.content.removeEventListener('keydown', this.state.keyHandler);
            this.state.clickHandler = null;
            this.state.keyHandler = null;
        }

        if (config.id && this.state.width[config.id]) {
            this.container.style.width = this.state.width[config.id];
        } else if (config.width) {
            this.container.style.width = config.width;
        } else {
            this.container.style.width = null;
        }

        this.content.innerHTML = config.content;
        this.content.scrollTop = 0;
        this.container.classList.add('psv-panel--open');

        toggleClass(this.content, 'psv-panel-content--no-margin', config.noMargin === true);

        if (config.clickHandler) {
            this.state.clickHandler = (e) => {
                config.clickHandler(getEventTarget(e));
            };
            this.state.keyHandler = (e) => {
                if (e.key === KEY_CODES.Enter) {
                    config.clickHandler(getEventTarget(e));
                }
            };
            this.content.addEventListener('click', this.state.clickHandler);
            this.content.addEventListener('keydown', this.state.keyHandler);

            // focus the first element if possible, after animation ends
            if (!wasVisible) {
                setTimeout(() => {
                    (this.content.querySelector('a,button,[tabindex]') as HTMLElement)?.focus();
                }, 300);
            }
        }

        this.viewer.dispatchEvent(new ShowPanelEvent(this.state.contentId));
    }

    /**
     * Hides the panel
     */
    override hide(id?: string) {
        if (this.isVisible(id)) {
            const contentId = this.state.contentId;

            this.state.visible = false;
            this.state.contentId = null;

            this.content.innerHTML = null;
            this.container.classList.remove('psv-panel--open');

            if (this.state.clickHandler) {
                this.content.removeEventListener('click', this.state.clickHandler);
                this.content.removeEventListener('keydown', this.state.keyHandler);
                this.state.clickHandler = null;
                this.state.keyHandler = null;
            }

            this.viewer.dispatchEvent(new HidePanelEvent(contentId));
        }
    }

    private __onMouseDown(evt: MouseEvent) {
        evt.stopPropagation();
        this.__startResize(evt.clientX, evt.clientY);
    }

    private __onTouchStart(evt: TouchEvent) {
        evt.stopPropagation();
        if (evt.touches.length === 1) {
            const touch = evt.touches[0];
            this.__startResize(touch.clientX, touch.clientY);
        }
    }

    private __onMouseUp(evt: MouseEvent) {
        if (this.state.mousedown) {
            evt.stopPropagation();
            this.state.mousedown = false;
            this.content.classList.remove(PANEL_CLASS_NO_INTERACTION);
        }
    }

    private __onTouchEnd(evt: TouchEvent) {
        if (this.state.mousedown) {
            evt.stopPropagation();
            if (evt.touches.length === 0) {
                this.state.mousedown = false;
                this.content.classList.remove(PANEL_CLASS_NO_INTERACTION);
            }
        }
    }

    private __onMouseMove(evt: MouseEvent) {
        if (this.state.mousedown) {
            evt.stopPropagation();
            this.__resize(evt.clientX, evt.clientY);
        }
    }

    private __onTouchMove(evt: TouchEvent) {
        if (this.state.mousedown) {
            const touch = evt.touches[0];
            this.__resize(touch.clientX, touch.clientY);
        }
    }

    private __onKeyPress(evt: KeypressEvent) {
        if (this.isVisible() && evt.matches(KEY_CODES.Escape)) {
            this.hide();
            evt.preventDefault();
        }
    }

    private __startResize(clientX: number, clientY: number) {
        this.state.mouseX = clientX;
        this.state.mouseY = clientY;
        this.state.mousedown = true;
        this.content.classList.add(PANEL_CLASS_NO_INTERACTION);
    }

    private __resize(clientX: number, clientY: number) {
        const x = clientX;
        const y = clientY;
        const width = Math.max(PANEL_MIN_WIDTH, this.container.offsetWidth - (x - this.state.mouseX)) + 'px';

        if (this.state.contentId) {
            this.state.width[this.state.contentId] = width;
        }

        this.container.style.width = width;

        this.state.mouseX = x;
        this.state.mouseY = y;
    }
}
