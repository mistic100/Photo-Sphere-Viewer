import type { NavbarGroup } from '../components/Navbar';
import { ICONS } from '../data/constants';
import { FullscreenEvent } from '../events';
import { AbstractButton } from './AbstractButton';

export class FullscreenButton extends AbstractButton {
    static override readonly id = 'fullscreen';

    constructor(parent: NavbarGroup) {
        super(parent, {
            className: 'psv-fullscreen-button',
            collapsable: false,
            tabbable: true,
            icon: ICONS.fullscreenIn,
            iconActive: ICONS.fullscreenOut,
        });

        this.viewer.addEventListener(FullscreenEvent.type, this);
    }

    override destroy() {
        this.viewer.removeEventListener(FullscreenEvent.type, this);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (e instanceof FullscreenEvent) {
            this.toggleActive(e.fullscreenEnabled);
        }
    }

    onClick() {
        this.viewer.toggleFullscreen();
    }
}
