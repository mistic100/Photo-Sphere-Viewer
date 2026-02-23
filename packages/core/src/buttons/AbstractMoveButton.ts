import type { Navbar } from '../components/Navbar';
import { ICONS, KEY_CODES } from '../data/constants';
import { SYSTEM } from '../data/system';
import { invertResolvableBoolean } from '../utils';
import { PressHandler } from '../utils/PressHandler';
import { AbstractButton } from './AbstractButton';

export const enum MoveButtonDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

function getIcon(value: MoveButtonDirection): string {
    let angle: number;
    switch (value) {
        case MoveButtonDirection.UP: angle = 90; break;
        case MoveButtonDirection.DOWN: angle = -90; break;
        case MoveButtonDirection.RIGHT: angle = 180; break;
        default: angle = 0; break;
    }

    return ICONS.arrow.replace('rotate(0', `rotate(${angle}`);
}

export abstract class AbstractMoveButton extends AbstractButton {
    static override readonly groupId = 'move';

    private readonly handler = new PressHandler();

    constructor(
        navbar: Navbar,
        private direction: MoveButtonDirection,
    ) {
        super(navbar, {
            className: 'psv-move-button',
            hoverScale: true,
            collapsable: false,
            tabbable: true,
            icon: getIcon(direction),
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

        const dynamicRoll: {
            yaw?: boolean;
            pitch?: boolean;
        } = {};
        switch (this.direction) {
            case MoveButtonDirection.UP: dynamicRoll.pitch = false; break;
            case MoveButtonDirection.DOWN: dynamicRoll.pitch = true; break;
            case MoveButtonDirection.RIGHT: dynamicRoll.yaw = false; break;
            default: dynamicRoll.yaw = true; break;
        }

        this.viewer.stopAll();
        this.viewer.dynamics.position.roll(dynamicRoll);
        this.handler.down();
    }

    private __onMouseUp() {
        if (!this.state.enabled) {
            return;
        }

        this.handler.up(() => {
            this.viewer.dynamics.position.stop();
            this.viewer.resetIdleTimer();
        });
    }
}
