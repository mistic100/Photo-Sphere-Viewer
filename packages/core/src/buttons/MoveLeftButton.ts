import type { NavbarGroup } from '../components/Navbar';
import { AbstractMoveButton, MoveButtonDirection } from './AbstractMoveButton';

export class MoveLeftButton extends AbstractMoveButton {
    static override readonly id = 'moveLeft';

    constructor(parent: NavbarGroup) {
        super(parent, MoveButtonDirection.LEFT);
    }
}
