import type { Navbar } from '../components/Navbar';
import { KEY_CODES } from '../data/constants';
import { SYSTEM } from '../data/system';
import { invertResolvableBoolean } from '../utils';
import { PressHandler } from '../utils/PressHandler';
import { AbstractButton } from './AbstractButton';

export const enum ZoomButtonDirection {
    IN,
    OUT,
}

export class AbstractZoomButton extends AbstractButton {
    static override readonly groupId = 'zoom';

    private readonly handler = new PressHandler();

    constructor(
        navbar: Navbar,
        icon: string,
        private direction: ZoomButtonDirection
    ) {
        super(navbar, {
            className: 'psv-zoom-button',
            hoverScale: true,
            collapsable: false,
            tabbable: true,
            icon: icon,
        });

        this.container.addEventListener('mousedown', this);
        this.container.addEventListener('keydown', this);
        this.container.addEventListener('keyup', this);
        this.viewer.container.addEventListener('mouseup', this);
        this.viewer.container.addEventListener('touchend', this);
    }

    override destroy() {
        this.__onMouseUp();

        this.viewer.container.removeEventListener('mouseup', this);
        this.viewer.container.removeEventListener('touchend', this);

        super.destroy();
    }

    handleEvent(e: Event) {
        // prettier-ignore
        switch (e.type) {
            case 'mousedown': this.__onMouseDown(); break;
            case 'mouseup': this.__onMouseUp(); break;
            case 'touchend': this.__onMouseUp(); break;
            case 'keydown': (e as KeyboardEvent).key === KEY_CODES.Enter && this.__onMouseDown(); break;
            case 'keyup': (e as KeyboardEvent).key === KEY_CODES.Enter && this.__onMouseUp(); break;
        }
    }

    onClick() {
        // nothing
    }

    override isSupported() {
        return invertResolvableBoolean(SYSTEM.isTouchEnabled);
    }

    private __onMouseDown() {
        if (!this.state.enabled) {
            return;
        }

        this.viewer.dynamics.zoom.roll(this.direction === ZoomButtonDirection.OUT);
        this.handler.down();
    }

    private __onMouseUp() {
        if (!this.state.enabled) {
            return;
        }

        this.handler.up(() => this.viewer.dynamics.zoom.stop());
    }
}
