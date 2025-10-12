import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import { StereoUpdatedEvent } from './events';
import stereo from './icons/stereo.svg';
import type { StereoPlugin } from './StereoPlugin';

export class StereoButton extends AbstractButton {
    static override readonly id = 'stereo';

    private readonly plugin: StereoPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-stereo-button',
            icon: stereo,
            collapsable: true,
            tabbable: true,
        });

        this.plugin = this.viewer.getPlugin('stereo');

        if (this.plugin) {
            this.plugin.addEventListener(StereoUpdatedEvent.type, this);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.plugin.removeEventListener(StereoUpdatedEvent.type, this);
        }

        super.destroy();
    }

    override isSupported() {
        return !this.plugin ? false : { initial: false, promise: this.plugin.isSupported };
    }

    handleEvent(e: Event) {
        if (e instanceof StereoUpdatedEvent) {
            this.toggleActive(e.stereoEnabled);
        }
    }

    /**
     * Toggles stereo control
     */
    onClick() {
        this.plugin.toggle();
    }
}
