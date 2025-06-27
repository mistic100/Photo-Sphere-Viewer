import type { Navbar } from '../components/Navbar';
import { ICONS } from '../data/constants';
import { ConfigChangedEvent, PanoramaLoadedEvent } from '../events';
import { AbstractButton } from './AbstractButton';

export class DownloadButton extends AbstractButton {
    static override readonly id = 'download';

    readonly link: HTMLAnchorElement;

    constructor(navbar: Navbar) {
        super(navbar, {
            tagName: 'a',
            className: 'psv-download-button',
            hoverScale: true,
            collapsable: true,
            tabbable: true,
            icon: ICONS.download,
        });

        this.viewer.addEventListener(ConfigChangedEvent.type, this);
        this.viewer.addEventListener(PanoramaLoadedEvent.type, this);
    }

    override destroy(): void {
        this.viewer.removeEventListener(ConfigChangedEvent.type, this);
        this.viewer.removeEventListener(PanoramaLoadedEvent.type, this);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (e instanceof ConfigChangedEvent) {
            e.containsOptions('downloadUrl') && this.checkSupported();
            e.containsOptions('downloadUrl', 'downloadName') && this.__update();
        } else if (e instanceof PanoramaLoadedEvent) {
            this.checkSupported();
            this.__update();
        }
    }

    onClick() {
        // nothing
    }

    override checkSupported() {
        const supported = this.viewer.config.downloadUrl || this.viewer.adapter.getDownloadUrl(this.viewer.config.panorama);
        if (supported) {
            this.show();
        } else {
            this.hide();
        }
    }

    private __update() {
        const link = this.container as HTMLAnchorElement;
        link.href = this.viewer.config.downloadUrl || this.viewer.adapter.getDownloadUrl(this.viewer.config.panorama);
        link.target = '_blank';
        if (link.href.startsWith('data:') && !this.viewer.config.downloadName) {
            link.download = 'panorama.' + link.href.substring(0, link.href.indexOf(';')).split('/').pop();
        } else {
            link.download = this.viewer.config.downloadName || link.href.split('/').pop();
        }
    }
}
