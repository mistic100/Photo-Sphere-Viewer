import type { NavbarGroup } from '../components/Navbar';
import { ICONS, IDS } from '../data/constants';
import {
    ConfigChangedEvent,
    HideNotificationEvent,
    HidePanelEvent,
    ShowNotificationEvent,
    ShowPanelEvent,
} from '../events';
import { AbstractButton } from './AbstractButton';

const enum DescriptionButtonMode {
    NONE,
    NOTIF,
    PANEL,
}

export class DescriptionButton extends AbstractButton {
    static override readonly id = 'description';

    private mode = DescriptionButtonMode.NONE;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-description-button',
            collapsable: false,
            tabbable: true,
            icon: ICONS.info,
        });

        this.viewer.addEventListener(HideNotificationEvent.type, this);
        this.viewer.addEventListener(ShowNotificationEvent.type, this);
        this.viewer.addEventListener(HidePanelEvent.type, this);
        this.viewer.addEventListener(ShowPanelEvent.type, this);
        this.viewer.addEventListener(ConfigChangedEvent.type, this);
    }

    override destroy() {
        this.viewer.removeEventListener(HideNotificationEvent.type, this);
        this.viewer.removeEventListener(ShowNotificationEvent.type, this);
        this.viewer.removeEventListener(HidePanelEvent.type, this);
        this.viewer.removeEventListener(ShowPanelEvent.type, this);
        this.viewer.removeEventListener(ConfigChangedEvent.type, this);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (e instanceof ConfigChangedEvent) {
            e.containsOptions('description') && this.autoHide();
            return;
        }

        if (!this.mode) {
            return;
        }

        let closed = false;
        if (e instanceof HideNotificationEvent) {
            closed = this.mode === DescriptionButtonMode.NOTIF;
        } else if (e instanceof ShowNotificationEvent) {
            closed = this.mode === DescriptionButtonMode.NOTIF && e.notificationId !== IDS.DESCRIPTION;
        } else if (e instanceof HidePanelEvent) {
            closed = this.mode === DescriptionButtonMode.PANEL;
        } else if (e instanceof ShowPanelEvent) {
            closed = this.mode === DescriptionButtonMode.PANEL && e.panelId !== IDS.DESCRIPTION;
        }

        if (closed) {
            this.toggleActive(false);
            this.mode = DescriptionButtonMode.NONE;
        }
    }

    onClick() {
        if (this.mode) {
            this.__close();
        } else {
            this.__open();
        }
    }

    override hide(refresh?: boolean) {
        super.hide(refresh);

        if (this.mode) {
            this.__close();
        }
    }

    /**
     * @internal
     */
    autoHide() {
        const caption = this.viewer.navbar.caption;
        const captionHidden = caption && !caption.isVisible();
        const hasDescription = !!this.viewer.config.description;

        if (captionHidden || hasDescription) {
            this.show(false);
        } else {
            this.hide(false);
        }
    }

    private __close() {
        switch (this.mode) {
            case DescriptionButtonMode.NOTIF:
                this.viewer.notification.hide(IDS.DESCRIPTION);
                break;
            case DescriptionButtonMode.PANEL:
                this.viewer.panel.hide(IDS.DESCRIPTION);
                break;
            default:
        }
    }

    private __open() {
        this.toggleActive(true);

        if (this.viewer.config.description) {
            this.mode = DescriptionButtonMode.PANEL;
            this.viewer.panel.show({
                id: IDS.DESCRIPTION,
                title: this.viewer.config.caption,
                content: this.viewer.config.description,
            });
        } else {
            this.mode = DescriptionButtonMode.NOTIF;
            this.viewer.notification.show({
                id: IDS.DESCRIPTION,
                content: this.viewer.config.caption,
            });
        }
    }
}
