import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import compass from './compass.svg';
import { GyroscopeUpdatedEvent } from './events';
import type { GyroscopePlugin } from './GyroscopePlugin';

export class GyroscopeButton extends AbstractButton {
    static override readonly id = 'gyroscope';

    private readonly plugin: GyroscopePlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-gyroscope-button',
            icon: compass,
            collapsable: true,
            tabbable: true,
        });

        this.plugin = this.viewer.getPlugin('gyroscope');

        if (this.plugin) {
            this.plugin.addEventListener(GyroscopeUpdatedEvent.type, this);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.plugin.removeEventListener(GyroscopeUpdatedEvent.type, this);
        }

        super.destroy();
    }

    override isSupported() {
        return !this.plugin ? false : { initial: false, promise: this.plugin.isSupported() };
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof GyroscopeUpdatedEvent) {
            this.toggleActive(e.gyroscopeEnabled);
        }
    }

    /**
     * Toggles gyroscope control
     */
    onClick() {
        this.plugin.toggle();
    }
}
