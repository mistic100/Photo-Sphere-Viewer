import type { NavbarGroup } from '../components/Navbar';
import { AbstractMoveButton, MoveButtonDirection } from './AbstractMoveButton';

export class MoveUpButton extends AbstractMoveButton {
    static override readonly id = 'moveUp';

    constructor(parent: NavbarGroup) {
        super(parent, MoveButtonDirection.UP);
    }
}
