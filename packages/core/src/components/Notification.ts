import { PSVError } from '../PSVError';
import type { Viewer } from '../Viewer';
import { HideNotificationEvent, ShowNotificationEvent } from '../events';
import { AbstractComponent } from './AbstractComponent';

/**
 * Configuration for {@link Notification.show}
 */
export type NotificationConfig = {
    /**
     * unique identifier to use with {@link Notification.hide} and {@link Notification.isVisible}
     */
    id?: string;
    /**
     * notification content
     */
    content: string;
    /**
     * automatically hide the notification after X milliseconds
     */
    timeout?: number;
};

/**
 * Notification component
 */
export class Notification extends AbstractComponent {
    /**
     * @internal
     */
    protected override readonly state = {
        visible: false,
        contentId: null as string,
        timeout: null as ReturnType<typeof setTimeout>,
    };

    private readonly content: HTMLElement;

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer, {
            className: 'psv-notification',
        });

        this.content = document.createElement('div');
        this.content.className = 'psv-notification-content';
        this.container.appendChild(this.content);

        this.content.addEventListener('click', () => this.hide());
    }

    /**
     * Checks if the notification is visible
     */
    override isVisible(id?: string) {
        return this.state.visible && (!id || !this.state.contentId || this.state.contentId === id);
    }

    /**
     * @throws {@link PSVError} always
     * @internal
     */
    override toggle() {
        throw new PSVError('Notification cannot be toggled');
    }

    /**
     * Displays a notification on the viewer
     */
    override show(config: string | NotificationConfig) {
        if (this.state.timeout) {
            clearTimeout(this.state.timeout);
            this.state.timeout = null;
        }

        if (typeof config === 'string') {
            config = { content: config };
        }

        this.state.contentId = config.id || null;
        this.content.innerHTML = config.content;

        this.container.classList.add('psv-notification--visible');
        this.state.visible = true;

        this.viewer.dispatchEvent(new ShowNotificationEvent(this.state.contentId));

        if (config.timeout) {
            this.state.timeout = setTimeout(() => this.hide(this.state.contentId), config.timeout);
        }
    }

    /**
     * Hides the notification
     */
    override hide(id?: string) {
        if (this.isVisible(id)) {
            const contentId = this.state.contentId;

            this.container.classList.remove('psv-notification--visible');
            this.state.visible = false;

            this.state.contentId = null;

            this.viewer.dispatchEvent(new HideNotificationEvent(contentId));
        }
    }
}
