import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import { ViewChanged } from '../events';
import map from '../icons/map.svg';
import type { MapPlugin } from '../MapPlugin';

export class MapButton extends AbstractButton {
    static override readonly id = 'map';

    private readonly plugin: MapPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-map-button',
            collapsable: true,
            tabbable: true,
            icon: map,
        });

        this.plugin = this.viewer.getPlugin('map');

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
