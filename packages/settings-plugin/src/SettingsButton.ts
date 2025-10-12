import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import icon from './icons/settings.svg';
import type { SettingsPlugin } from './SettingsPlugin';

export class SettingsButton extends AbstractButton {
    static override readonly id = 'settings';

    private readonly plugin: SettingsPlugin;
    private readonly badge: HTMLElement;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-settings-button',
            icon: icon,
            collapsable: false,
            tabbable: true,
        });

        this.plugin = this.viewer.getPlugin('settings');

        this.badge = document.createElement('div');
        this.badge.className = 'psv-settings-badge';
        this.badge.style.display = 'none';
        this.container.appendChild(this.badge);
    }

    override isSupported() {
        return !!this.plugin;
    }

    /**
     * Toggles settings
     */
    onClick() {
        this.plugin.toggleSettings();
    }

    /**
     * Changes the badge value
     */
    setBadge(value: string) {
        this.badge.innerText = value;
        this.badge.style.display = value ? '' : 'none';
    }
}
