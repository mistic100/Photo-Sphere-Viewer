import type { NavbarGroup } from '../components/Navbar';
import { ICONS } from '../data/constants';
import { AbstractZoomButton, ZoomButtonDirection } from './AbstractZoomButton';

export class ZoomOutButton extends AbstractZoomButton {
    static override readonly id = 'zoomOut';

    constructor(parent: NavbarGroup) {
        super(parent, ICONS.zoomOut, ZoomButtonDirection.OUT);
    }
}
