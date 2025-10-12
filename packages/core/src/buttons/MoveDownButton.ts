import type { NavbarGroup } from '../components/Navbar';
import { AbstractMoveButton, MoveButtonDirection } from './AbstractMoveButton';

export class MoveDownButton extends AbstractMoveButton {
    static override readonly id = 'moveDown';

    constructor(parent: NavbarGroup) {
        super(parent, MoveButtonDirection.DOWN);
    }
}
