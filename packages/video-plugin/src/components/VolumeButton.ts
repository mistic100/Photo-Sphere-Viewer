import type { NavbarGroup } from '@photo-sphere-viewer/core';
import { AbstractButton, events, utils } from '@photo-sphere-viewer/core';
import { PlayPauseEvent, VolumeChangeEvent } from '../events';
import volumeIcon from '../icons/volume.svg';
import type { VideoPlugin } from '../VideoPlugin';

export class VolumeButton extends AbstractButton {
    static override readonly id = 'videoVolume';
    static override readonly groupId = 'video';

    private readonly plugin?: VideoPlugin;

    private readonly rangeContainer: HTMLElement;
    private readonly progressElt: HTMLElement;
    private readonly handleElt: HTMLElement;

    private readonly slider: utils.Slider;

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-video-volume-button',
            collapsable: false,
            tabbable: true,
            icon: volumeIcon,
            title: '',
        });

        this.plugin = this.viewer.getPlugin('video');

        if (this.plugin) {
            this.container.querySelector('svg').addEventListener('click', () => {
                this.plugin.setMute();
            });

            this.rangeContainer = document.createElement('div');
            this.rangeContainer.className = 'psv-video-volume';
            this.container.appendChild(this.rangeContainer);

            const trackElt = document.createElement('div');
            trackElt.className = 'psv-video-volume__track';
            this.rangeContainer.appendChild(trackElt);

            this.progressElt = document.createElement('div');
            this.progressElt.className = 'psv-video-volume__progress';
            this.rangeContainer.appendChild(this.progressElt);

            this.handleElt = document.createElement('div');
            this.handleElt.className = 'psv-video-volume__handle';
            this.rangeContainer.appendChild(this.handleElt);

            this.slider = new utils.Slider(
                this.rangeContainer,
                utils.SliderDirection.HORIZONTAL,
                this.__onSliderUpdate.bind(this),
            );

            this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
            this.plugin.addEventListener(PlayPauseEvent.type, this);
            this.plugin.addEventListener(VolumeChangeEvent.type, this);

            this.__setVolume(0);
        }
    }

    override destroy() {
        if (this.plugin) {
            this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
            this.plugin.removeEventListener(PlayPauseEvent.type, this);
            this.plugin.removeEventListener(VolumeChangeEvent.type, this);
        }

        this.slider.destroy();

        super.destroy();
    }

    override isSupported() {
        return !!this.plugin;
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case events.PanoramaLoadedEvent.type:
            case PlayPauseEvent.type:
            case VolumeChangeEvent.type:
                this.__setVolume(this.plugin.getVolume());
                break;
        }
    }

    onClick() {
        // nothing
    }

    private __onSliderUpdate(data: utils.SliderUpdateData) {
        if (data.mousedown) {
            this.plugin.setVolume(data.value);
        }
    }

    private __setVolume(volume: number) {
        let level;
        if (volume === 0) level = 0;
        else if (volume < 0.333) level = 1;
        else if (volume < 0.666) level = 2;
        else level = 3;

        utils.toggleClass(this.container, 'psv-video-volume-button--0', level === 0);
        utils.toggleClass(this.container, 'psv-video-volume-button--1', level === 1);
        utils.toggleClass(this.container, 'psv-video-volume-button--2', level === 2);
        utils.toggleClass(this.container, 'psv-video-volume-button--3', level === 3);

        this.handleElt.style.left = `${volume * 100}%`;
        this.progressElt.style.width = `${volume * 100}%`;
    }
}
