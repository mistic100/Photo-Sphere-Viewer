import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import { HideGalleryEvent, ShowGalleryEvent } from './events';
import type { GalleryPlugin } from './GalleryPlugin';
import gallery from './icons/gallery.svg';

export class GalleryButton extends AbstractButton {
    static override readonly id = 'gallery';

    private readonly plugin: GalleryPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-gallery-button',
            collapsable: true,
            tabbable: true,
            icon: gallery,
        });

        this.plugin = this.viewer.getPlugin('gallery');

        if (this.plugin) {
            this.plugin.addEventListener(ShowGalleryEvent.type, this);
            this.plugin.addEventListener(HideGalleryEvent.type, this);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.plugin.removeEventListener(ShowGalleryEvent.type, this);
            this.plugin.removeEventListener(HideGalleryEvent.type, this);
        }

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof ShowGalleryEvent) {
            this.toggleActive(true);
        } else if (e instanceof HideGalleryEvent) {
            this.toggleActive(false);
        }
    }

    override isSupported() {
        return !!this.plugin;
    }

    onClick() {
        this.plugin.toggle();
    }
}
