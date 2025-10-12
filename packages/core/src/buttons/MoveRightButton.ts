import type { NavbarGroup } from '../components/Navbar';
import { AbstractMoveButton, MoveButtonDirection } from './AbstractMoveButton';

export class MoveRightButton extends AbstractMoveButton {
    static override readonly id = 'moveRight';

    constructor(parent: NavbarGroup) {
        super(parent, MoveButtonDirection.RIGHT);
    }
}
