import { CAPTURE_EVENTS_CLASS, KEY_CODES } from '../data/constants';
import { HideOverlayEvent, KeypressEvent, ShowOverlayEvent } from '../events';
import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { AbstractComponent } from './AbstractComponent';

/**
 * Configuration for {@link Overlay.show}
 */
export type OverlayConfig = {
    /**
     * unique identifier to use with {@link Overlay.hide} and {@link Overlay.isVisible}
     */
    id?: string;
    /**
     * SVG image/icon displayed above the text
     */
    image?: string;
    /**
     * main message
     */
    title: string;
    /**
     * secondary message
     */
    text?: string;
    /**
     * if the user can hide the overlay by clicking
     * @default true
     */
    dismissible?: boolean;
};

/**
 * Overlay component
 */
export class Overlay extends AbstractComponent {
    /**
     * @internal
     */
    protected override readonly state = {
        visible: false,
        contentId: null as string,
        dismissible: true,
    };

    private readonly image: HTMLElement;
    private readonly title: HTMLElement;
    private readonly text: HTMLElement;

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer, {
            className: `psv-overlay ${CAPTURE_EVENTS_CLASS}`,
        });

        this.image = document.createElement('div');
        this.image.className = 'psv-overlay-image';
        this.container.appendChild(this.image);

        this.title = document.createElement('div');
        this.title.className = 'psv-overlay-title';
        this.container.appendChild(this.title);

        this.text = document.createElement('div');
        this.text.className = 'psv-overlay-text';
        this.container.appendChild(this.text);

        this.container.addEventListener('click', this);
        this.viewer.addEventListener(KeypressEvent.type, this);

        super.hide();
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(KeypressEvent.type, this);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e.type === 'click') {
            if (this.isVisible() && this.state.dismissible) {
                this.hide();
                e.stopPropagation();
            }
        } else if (e instanceof KeypressEvent) {
            if (this.isVisible() && this.state.dismissible && e.key === KEY_CODES.Escape) {
                this.hide();
                e.preventDefault();
            }
        }
    }

    /**
     * Checks if the overlay is visible
     */
    override isVisible(id?: string) {
        return this.state.visible && (!id || !this.state.contentId || this.state.contentId === id);
    }

    /**
     * @throws {@link PSVError} always
     * @internal
     */
    override toggle() {
        throw new PSVError('Overlay cannot be toggled');
    }

    /**
     * Displays an overlay on the viewer
     */
    override show(config: string | OverlayConfig) {
        if (typeof config === 'string') {
            config = { title: config };
        }

        this.state.contentId = config.id || null;
        this.state.dismissible = config.dismissible !== false;
        this.image.innerHTML = config.image || '';
        this.title.innerHTML = config.title || '';
        this.text.innerHTML = config.text || '';

        super.show();

        this.viewer.dispatchEvent(new ShowOverlayEvent(this.state.contentId));
    }

    /**
     * Hides the overlay
     */
    override hide(id?: string) {
        if (this.isVisible(id)) {
            const contentId = this.state.contentId;

            super.hide();

            this.state.contentId = null;

            this.viewer.dispatchEvent(new HideOverlayEvent(contentId));
        }
    }
}
