import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton, events } from '@photo-sphere-viewer/core';
import { ProgressEvent } from '../events';
import { formatTime } from '../utils';
import type { VideoPlugin } from '../VideoPlugin';

export class TimeCaption extends AbstractButton {
    static override readonly id = 'videoTime';
    static override readonly groupId = 'video';

    private plugin?: VideoPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-video-time',
            collapsable: false,
            tabbable: false,
        });

        this.plugin = this.viewer.getPlugin('video');

        if (this.plugin) {
            this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
            this.plugin.addEventListener(ProgressEvent.type, this);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
            this.plugin.removeEventListener(ProgressEvent.type, this);
        }

        delete this.plugin;

        super.destroy();
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case events.PanoramaLoadedEvent.type:
            case ProgressEvent.type: {
                let caption = `<strong>${formatTime(this.plugin.getTime())}</strong>`;
                if (isFinite(this.plugin.getDuration())) {
                    caption += `/<span>${formatTime(this.plugin.getDuration())}</span>`;
                }
                this.container.innerHTML = caption;
                break;
            }
        }
    }

    onClick(): void {
        // nothing
    }
}
