import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, events, Tooltip, utils } from '@photo-sphere-viewer/core';
import { BufferEvent, ProgressEvent } from '../events';
import { formatTime } from '../utils';
import type { VideoPlugin } from '../VideoPlugin';

export class ProgressBar extends AbstractComponent {
    private readonly bufferElt: HTMLElement;
    private readonly progressElt: HTMLElement;
    private readonly handleElt: HTMLElement;

    private readonly slider: utils.Slider;

    protected override readonly state = {
        visible: true,
        req: null as ReturnType<typeof requestAnimationFrame>,
        tooltip: null as Tooltip,
    };

    constructor(
        private readonly plugin: VideoPlugin,
        viewer: Viewer
    ) {
        super(viewer, {
            className: 'psv-video-progressbar',
        });

        this.bufferElt = document.createElement('div');
        this.bufferElt.className = 'psv-video-progressbar__buffer';
        this.container.appendChild(this.bufferElt);

        this.progressElt = document.createElement('div');
        this.progressElt.className = 'psv-video-progressbar__progress';
        this.container.appendChild(this.progressElt);

        this.handleElt = document.createElement('div');
        this.handleElt.className = 'psv-video-progressbar__handle';
        this.container.appendChild(this.handleElt);

        this.slider = new utils.Slider(
            this.container,
            utils.SliderDirection.HORIZONTAL,
            this.__onSliderUpdate.bind(this)
        );

        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
        this.plugin.addEventListener(BufferEvent.type, this);
        this.plugin.addEventListener(ProgressEvent.type, this);

        this.state.req = window.requestAnimationFrame(() => this.__updateProgress());

        this.hide();
    }

    override destroy() {
        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
        this.plugin.removeEventListener(BufferEvent.type, this);
        this.plugin.removeEventListener(ProgressEvent.type, this);

        this.slider.destroy();
        this.state.tooltip?.hide();
        window.cancelAnimationFrame(this.state.req);

        delete this.state.tooltip;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.PanoramaLoadedEvent.type:
            case BufferEvent.type:
            case ProgressEvent.type:
                this.bufferElt.style.width = `${this.plugin.getBufferProgress() * 100}%`;
                break;
        }
    }

    private __updateProgress() {
        this.progressElt.style.width = `${this.plugin.getProgress() * 100}%`;

        this.state.req = window.requestAnimationFrame(() => this.__updateProgress());
    }

    private __onSliderUpdate(data: utils.SliderUpdateData) {
        if (data.mouseover) {
            this.handleElt.style.display = 'block';
            this.handleElt.style.left = `${data.value * 100}%`;

            const time = formatTime(this.plugin.getDuration() * data.value);

            if (!this.state.tooltip) {
                this.state.tooltip = this.viewer.createTooltip({
                    top: data.cursor.clientY,
                    left: data.cursor.clientX,
                    content: time,
                });
            } else {
                this.state.tooltip.update(time, {
                    top: data.cursor.clientY,
                    left: data.cursor.clientX,
                });
            }
        } else {
            this.handleElt.style.display = 'none';

            this.state.tooltip?.hide();
            delete this.state.tooltip;
        }
        if (data.click) {
            this.plugin.setProgress(data.value);
        }
    }
}
