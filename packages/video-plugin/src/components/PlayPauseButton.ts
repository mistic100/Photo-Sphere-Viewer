import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton } from '@photo-sphere-viewer/core';
import { PlayPauseEvent } from '../events';
import pauseIcon from '../icons/pause.svg';
import playIcon from '../icons/play.svg';
import type { VideoPlugin } from '../VideoPlugin';

export class PlayPauseButton extends AbstractButton {
    static override readonly id = 'videoPlay';
    static override readonly groupId = 'video';

    private readonly plugin?: VideoPlugin;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-video-play-button',
            collapsable: false,
            tabbable: true,
            icon: playIcon,
            iconActive: pauseIcon,
        });

        this.plugin = this.viewer.getPlugin('video');

        this.plugin?.addEventListener(PlayPauseEvent.type, this);
    }

    override destroy() {
        this.plugin?.removeEventListener(PlayPauseEvent.type, this);

        super.destroy();
    }

    override isSupported() {
        return !!this.plugin;
    }

    handleEvent(e: Event) {
        if (e instanceof PlayPauseEvent) {
            this.toggleActive(e.playing);
        }
    }

    onClick() {
        this.plugin.playPause();
    }
}
