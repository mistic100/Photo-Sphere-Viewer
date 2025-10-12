import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import { HideMarkersEvent, ShowMarkersEvent } from './events';
import pin from './icons/pin.svg';
import type { MarkersPlugin } from './MarkersPlugin';

export class MarkersButton extends AbstractButton {
    static override readonly id = 'markers';

    private readonly plugin: MarkersPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-markers-button',
            icon: pin,
            collapsable: true,
            tabbable: true,
        });

        this.plugin = this.viewer.getPlugin('markers');

        if (this.plugin) {
            this.plugin.addEventListener(ShowMarkersEvent.type, this);
            this.plugin.addEventListener(HideMarkersEvent.type, this);

            this.toggleActive(true);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.plugin.removeEventListener(ShowMarkersEvent.type, this);
            this.plugin.removeEventListener(HideMarkersEvent.type, this);
        }

        super.destroy();
    }

    override isSupported() {
        return !!this.plugin;
    }

    handleEvent(e: Event) {
        if (e instanceof ShowMarkersEvent) {
            this.toggleActive(true);
        } else if (e instanceof HideMarkersEvent) {
            this.toggleActive(false);
        }
    }

    onClick() {
        this.plugin.toggleAllMarkers();
    }
}
