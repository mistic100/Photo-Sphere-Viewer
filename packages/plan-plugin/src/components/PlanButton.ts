import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import { ViewChanged } from '../events';
import map from '../icons/map.svg';
import type { PlanPlugin } from '../PlanPlugin';

export class PlanButton extends AbstractButton {
    static override readonly id = 'plan';

    private readonly plugin: PlanPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-plan-button',
            collapsable: true,
            tabbable: true,
            title: 'map',
            icon: map,
        });

        this.plugin = this.viewer.getPlugin('plan');

        if (this.plugin) {
            this.plugin.addEventListener(ViewChanged.type, this);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.plugin.removeEventListener(ViewChanged.type, this);
        }

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof ViewChanged) {
            this.toggleActive(e.view !== 'closed');
        }
    }

    override isSupported() {
        return !!this.plugin;
    }

    onClick() {
        this.plugin.component.toggle();
    }
}
