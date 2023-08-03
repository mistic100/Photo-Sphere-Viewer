import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, CONSTANTS, events, utils } from '@photo-sphere-viewer/core';
import { PlayPauseEvent } from '../events';
import playIcon from '../icons/play.svg';
import { VideoPlugin } from '../VideoPlugin';

export class PauseOverlay extends AbstractComponent {
    private readonly button: HTMLElement;

    constructor(
        private readonly plugin: VideoPlugin,
        viewer: Viewer
    ) {
        super(viewer, {
            className: 'psv-video-overlay',
        });

        this.button = document.createElement('button');
        this.button.className = `psv-video-bigbutton ${CONSTANTS.CAPTURE_EVENTS_CLASS}`;
        this.button.innerHTML = playIcon;
        this.container.appendChild(this.button);

        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
        this.plugin.addEventListener(PlayPauseEvent.type, this);
        this.button.addEventListener('click', this);
    }

    override destroy() {
        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
        this.plugin.removeEventListener(PlayPauseEvent.type, this);

        super.destroy();
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case events.PanoramaLoadedEvent.type:
            case PlayPauseEvent.type:
                utils.toggleClass(this.button, 'psv-video-bigbutton--pause', !this.plugin.isPlaying());
                break;
            case 'click':
                this.plugin.playPause();
                break;
        }
    }
}
